import { create } from "zustand";
import { getSupabase } from "@/lib/supabase";

export interface Channel {
  id: string;
  name: string;
  description: string | null;
  isDm: boolean;
  avatarUrl: string | null;
  memberCount: number;
  createdBy: string | null;
}

interface ChannelState {
  publicChannels: Channel[];
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
}

interface ChannelActions {
  loadPublicChannels: () => Promise<void>;
  createChannel: (params: {
    name: string;
    description?: string;
    createdBy: string;
  }) => Promise<string | null>;
  joinChannel: (channelId: string, userId: string) => Promise<boolean>;
  leaveChannel: (channelId: string, userId: string) => Promise<boolean>;
  getOrCreateDM: (userA: string, userB: string) => Promise<string | null>;
}

type ChannelStore = ChannelState & ChannelActions;

export const useChannelStore = create<ChannelStore>((set) => ({
  publicChannels: [],
  isLoading: false,
  isCreating: false,
  error: null,

  loadPublicChannels: async () => {
    set({ isLoading: true });
    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("channels")
        .select("id, name, description, is_dm, avatar_url, created_by")
        .eq("is_dm", false)
        .order("name");

      if (data) {
        const channels: Channel[] = data.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          isDm: c.is_dm,
          avatarUrl: c.avatar_url,
          memberCount: 0, // Filled lazily
          createdBy: c.created_by,
        }));
        set({ publicChannels: channels, isLoading: false });
      }
    } catch (error) {
      console.error("Failed to load channels:", error);
      set({ isLoading: false });
    }
  },

  createChannel: async ({ name, description, createdBy }) => {
    set({ isCreating: true, error: null });
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("channels")
        .insert({
          name,
          description: description ?? null,
          is_dm: false,
          created_by: createdBy,
        })
        .select("id")
        .single();

      if (error) {
        set({ isCreating: false, error: error.message });
        return null;
      }

      // Auto-join as admin
      await supabase.from("channel_members").insert({
        channel_id: data.id,
        user_id: createdBy,
        role: "admin",
      });

      set({ isCreating: false });
      return data.id;
    } catch {
      set({ isCreating: false, error: "Failed to create channel" });
      return null;
    }
  },

  joinChannel: async (channelId: string, userId: string) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from("channel_members").insert({
        channel_id: channelId,
        user_id: userId,
        role: "member",
      });
      return !error;
    } catch {
      return false;
    }
  },

  leaveChannel: async (channelId: string, userId: string) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("channel_members")
        .delete()
        .eq("channel_id", channelId)
        .eq("user_id", userId);
      return !error;
    } catch {
      return false;
    }
  },

  getOrCreateDM: async (userA: string, userB: string) => {
    try {
      const supabase = getSupabase();

      // Check if a DM channel already exists between these two users
      const { data: existingChannels } = await supabase
        .from("channel_members")
        .select("channel_id")
        .eq("user_id", userA);

      if (existingChannels) {
        for (const membership of existingChannels) {
          const { data: otherMember } = await supabase
            .from("channel_members")
            .select("channel_id")
            .eq("channel_id", membership.channel_id)
            .eq("user_id", userB)
            .single();

          if (otherMember) {
            // Verify it's a DM
            const { data: channel } = await supabase
              .from("channels")
              .select("id, is_dm")
              .eq("id", membership.channel_id)
              .eq("is_dm", true)
              .single();

            if (channel) return channel.id;
          }
        }
      }

      // Create new DM channel
      const { data: newChannel, error } = await supabase
        .from("channels")
        .insert({ name: "DM", is_dm: true, created_by: userA })
        .select("id")
        .single();

      if (error || !newChannel) return null;

      // Add both users as members
      await supabase.from("channel_members").insert([
        { channel_id: newChannel.id, user_id: userA, role: "member" },
        { channel_id: newChannel.id, user_id: userB, role: "member" },
      ]);

      return newChannel.id;
    } catch {
      return null;
    }
  },
}));
