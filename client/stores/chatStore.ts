import { create } from "zustand";
import { getSupabase } from "@/lib/supabase";
import { enqueueMessage, flushQueue, type QueuedMessage } from "@/lib/messageQueue";
import * as Crypto from "expo-crypto";

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  senderDisplayName?: string;
  senderWalletAddress?: string;
  content: string;
  clientId: string | null;
  replyTo: string | null;
  createdAt: string;
  isPending?: boolean;
}

export interface Conversation {
  channelId: string;
  name: string;
  isDm: boolean;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  avatarUrl: string | null;
}

interface ChatState {
  conversations: Conversation[];
  messagesByChannel: Record<string, Message[]>;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
}

interface ChatActions {
  loadConversations: (userId: string) => Promise<void>;
  loadMessages: (channelId: string, limit?: number) => Promise<void>;
  sendMessage: (params: {
    channelId: string;
    senderId: string;
    content: string;
    replyTo?: string;
  }) => Promise<void>;
  addMessage: (channelId: string, message: Message) => void;
  flushOfflineQueue: () => Promise<void>;
  markRead: (channelId: string, userId: string) => Promise<void>;
}

type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  messagesByChannel: {},
  isLoadingConversations: false,
  isLoadingMessages: false,
  isSending: false,

  loadConversations: async (userId: string) => {
    set({ isLoadingConversations: true });
    try {
      const supabase = getSupabase();

      // Get channels the user is a member of, with last message
      const { data: memberships } = await supabase
        .from("channel_members")
        .select(`
          channel_id,
          last_read_at,
          channels (
            id,
            name,
            is_dm,
            avatar_url
          )
        `)
        .eq("user_id", userId);

      if (!memberships) {
        set({ conversations: [], isLoadingConversations: false });
        return;
      }

      const conversations: Conversation[] = [];

      for (const m of memberships) {
        const channel = (m as Record<string, unknown>).channels as {
          id: string;
          name: string;
          is_dm: boolean;
          avatar_url: string | null;
        } | null;

        if (!channel) continue;

        // Get last message for this channel
        const { data: lastMsg } = await supabase
          .from("messages")
          .select("content, created_at")
          .eq("channel_id", channel.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("channel_id", channel.id)
          .gt("created_at", m.last_read_at ?? "1970-01-01");

        conversations.push({
          channelId: channel.id,
          name: channel.name,
          isDm: channel.is_dm,
          lastMessage: lastMsg?.content ?? null,
          lastMessageAt: lastMsg?.created_at ?? null,
          unreadCount: count ?? 0,
          avatarUrl: channel.avatar_url,
        });
      }

      // Sort by last message time (newest first)
      conversations.sort((a, b) => {
        if (!a.lastMessageAt) return 1;
        if (!b.lastMessageAt) return -1;
        return b.lastMessageAt.localeCompare(a.lastMessageAt);
      });

      set({ conversations, isLoadingConversations: false });
    } catch (error) {
      console.error("Failed to load conversations:", error);
      set({ isLoadingConversations: false });
    }
  },

  loadMessages: async (channelId: string, limit = 50) => {
    set({ isLoadingMessages: true });
    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("messages")
        .select(`
          id,
          channel_id,
          sender_id,
          content,
          client_id,
          reply_to,
          created_at,
          users!sender_id (
            display_name,
            wallet_address
          )
        `)
        .eq("channel_id", channelId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (data) {
        const messages: Message[] = data.map((row) => {
          const sender = (row as Record<string, unknown>).users as {
            display_name: string | null;
            wallet_address: string;
          } | null;

          return {
            id: row.id,
            channelId: row.channel_id,
            senderId: row.sender_id,
            senderDisplayName: sender?.display_name ?? undefined,
            senderWalletAddress: sender?.wallet_address ?? undefined,
            content: row.content,
            clientId: row.client_id,
            replyTo: row.reply_to,
            createdAt: row.created_at,
          };
        });

        set((state) => ({
          messagesByChannel: {
            ...state.messagesByChannel,
            [channelId]: messages.reverse(),
          },
          isLoadingMessages: false,
        }));
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async ({ channelId, senderId, content, replyTo }) => {
    const clientId = Crypto.randomUUID();
    const now = new Date().toISOString();

    // Optimistic UI — add immediately
    const pendingMessage: Message = {
      id: `pending_${clientId}`,
      channelId,
      senderId,
      content,
      clientId,
      replyTo: replyTo ?? null,
      createdAt: now,
      isPending: true,
    };

    set((state) => ({
      messagesByChannel: {
        ...state.messagesByChannel,
        [channelId]: [
          ...(state.messagesByChannel[channelId] ?? []),
          pendingMessage,
        ],
      },
    }));

    // Enqueue for offline safety
    const queueItem: QueuedMessage = {
      clientId,
      channelId,
      senderId,
      content,
      createdAt: now,
    };
    await enqueueMessage(queueItem);

    // Try sending immediately
    const supabase = getSupabase();
    const { error } = await supabase.from("messages").insert({
      client_id: clientId,
      channel_id: channelId,
      sender_id: senderId,
      content,
      reply_to: replyTo ?? null,
      created_at: now,
    });

    if (!error) {
      // Remove from queue on success
      const { dequeueMessage: dequeue } = await import("@/lib/messageQueue");
      await dequeue(clientId);
    }
    // On failure, message stays in queue for later flush
  },

  addMessage: (channelId: string, message: Message) => {
    set((state) => {
      const existing = state.messagesByChannel[channelId] ?? [];

      // Deduplicate by clientId (optimistic message already there)
      if (message.clientId) {
        const idx = existing.findIndex(
          (m) => m.clientId === message.clientId,
        );
        if (idx >= 0) {
          const updated = [...existing];
          updated[idx] = { ...message, isPending: false };
          return {
            messagesByChannel: {
              ...state.messagesByChannel,
              [channelId]: updated,
            },
          };
        }
      }

      // Deduplicate by id
      if (existing.some((m) => m.id === message.id)) {
        return state;
      }

      return {
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: [...existing, message],
        },
      };
    });
  },

  flushOfflineQueue: async () => {
    await flushQueue();
  },

  markRead: async (channelId: string, userId: string) => {
    const supabase = getSupabase();
    await supabase
      .from("channel_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("channel_id", channelId)
      .eq("user_id", userId);

    // Update local unread count
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.channelId === channelId ? { ...c, unreadCount: 0 } : c,
      ),
    }));
  },
}));
