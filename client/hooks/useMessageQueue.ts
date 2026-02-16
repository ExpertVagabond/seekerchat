import { useEffect, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useChatStore } from "@/stores/chatStore";

/**
 * Monitors network connectivity and flushes the offline message queue
 * when the device comes back online.
 */
export function useMessageQueue() {
  const flushOfflineQueue = useChatStore((s) => s.flushOfflineQueue);
  const isFlushing = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      if (state.isConnected && !isFlushing.current) {
        isFlushing.current = true;
        try {
          await flushOfflineQueue();
        } finally {
          isFlushing.current = false;
        }
      }
    });

    return () => unsubscribe();
  }, [flushOfflineQueue]);
}
