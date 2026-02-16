import { useEffect, useRef } from "react";
import { getSupabase } from "@/lib/supabase";
import { useChatStore, type Message } from "@/stores/chatStore";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Subscribe to real-time message inserts for a specific channel.
 * Uses Supabase Postgres Changes (INSERT on messages table).
 */
export function useRealtimeMessages(channelId: string | null) {
  const addMessage = useChatStore((s) => s.addMessage);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!channelId) return;

    const supabase = getSupabase();

    subscriptionRef.current = supabase
      .channel(`messages:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            channel_id: string;
            sender_id: string;
            content: string;
            client_id: string | null;
            reply_to: string | null;
            created_at: string;
          };

          const message: Message = {
            id: row.id,
            channelId: row.channel_id,
            senderId: row.sender_id,
            content: row.content,
            clientId: row.client_id,
            replyTo: row.reply_to,
            createdAt: row.created_at,
          };

          addMessage(channelId, message);
        },
      )
      .subscribe();

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [channelId, addMessage]);
}
