import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSupabase } from "./supabase";

const QUEUE_KEY = "seekerchat_message_queue";

export interface QueuedMessage {
  clientId: string;
  channelId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

/** Add a message to the offline queue */
export async function enqueueMessage(message: QueuedMessage): Promise<void> {
  const queue = await getQueue();
  queue.push(message);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/** Remove a message from the queue (after successful send) */
export async function dequeueMessage(clientId: string): Promise<void> {
  const queue = await getQueue();
  const filtered = queue.filter((m) => m.clientId !== clientId);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}

/** Get all queued messages */
export async function getQueue(): Promise<QueuedMessage[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QueuedMessage[];
  } catch {
    return [];
  }
}

/** Flush all queued messages to Supabase. Returns count of successfully sent. */
export async function flushQueue(): Promise<number> {
  const queue = await getQueue();
  if (queue.length === 0) return 0;

  const supabase = getSupabase();
  let sent = 0;

  for (const msg of queue) {
    const { error } = await supabase.from("messages").insert({
      client_id: msg.clientId,
      channel_id: msg.channelId,
      sender_id: msg.senderId,
      content: msg.content,
      created_at: msg.createdAt,
    });

    if (!error) {
      await dequeueMessage(msg.clientId);
      sent++;
    } else if (error.code === "23505") {
      // Unique constraint violation — already sent (dedup)
      await dequeueMessage(msg.clientId);
      sent++;
    } else {
      console.warn("Failed to flush message:", error.message);
      break; // Stop on first real failure to preserve order
    }
  }

  return sent;
}
