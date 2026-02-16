import React, { useEffect, useRef } from "react";
import { View, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ChatBubble } from "@/components/ChatBubble";
import { MessageInput } from "@/components/MessageInput";
import { useChatStore, type Message } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import type { ChatStackParamList } from "@/navigation/types";
import { colors, spacing } from "@/constants/theme";

type Props = NativeStackScreenProps<ChatStackParamList, "ChatRoom">;

export default function ChatRoomScreen({ route }: Props) {
  const { channelId, channelName } = route.params;
  const { supabaseUserId } = useAuthStore();
  const {
    messagesByChannel,
    isLoadingMessages,
    loadMessages,
    sendMessage,
    markRead,
  } = useChatStore();
  const flatListRef = useRef<FlatList>(null);

  // Subscribe to real-time messages
  useRealtimeMessages(channelId);

  // Load initial messages
  useEffect(() => {
    loadMessages(channelId);
  }, [channelId]);

  // Mark as read on enter
  useEffect(() => {
    if (supabaseUserId) {
      markRead(channelId, supabaseUserId);
    }
  }, [channelId, supabaseUserId]);

  const messages = messagesByChannel[channelId] ?? [];

  const handleSend = (content: string) => {
    if (!supabaseUserId) return;
    sendMessage({ channelId, senderId: supabaseUserId, content });

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === supabaseUserId;
    const senderName =
      item.senderDisplayName ??
      (item.senderWalletAddress
        ? `${item.senderWalletAddress.slice(0, 4)}...${item.senderWalletAddress.slice(-4)}`
        : undefined);

    return (
      <ChatBubble
        content={item.content}
        createdAt={item.createdAt}
        isOwn={isOwn}
        senderName={isOwn ? undefined : senderName}
        isPending={item.isPending}
      />
    );
  };

  if (isLoadingMessages && messages.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
      />
      <MessageInput onSend={handleSend} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    paddingVertical: spacing.sm,
  },
});
