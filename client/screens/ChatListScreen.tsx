import React, { useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChannelListItem } from "@/components/ChannelListItem";
import { useChatStore, type Conversation } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import type { ChatStackParamList } from "@/navigation/types";
import { colors, fontSize, spacing } from "@/constants/theme";

type Nav = NativeStackNavigationProp<ChatStackParamList, "ChatList">;

export default function ChatListScreen() {
  const navigation = useNavigation<Nav>();
  const { supabaseUserId } = useAuthStore();
  const { conversations, isLoadingConversations, loadConversations } =
    useChatStore();

  const refresh = useCallback(() => {
    if (supabaseUserId) loadConversations(supabaseUserId);
  }, [supabaseUserId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const renderItem = ({ item }: { item: Conversation }) => (
    <ChannelListItem
      name={item.name}
      lastMessage={item.lastMessage}
      lastMessageAt={item.lastMessageAt}
      unreadCount={item.unreadCount}
      avatarUrl={item.avatarUrl}
      isDm={item.isDm}
      onPress={() =>
        navigation.navigate("ChatRoom", {
          channelId: item.channelId,
          channelName: item.name,
        })
      }
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.channelId}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingConversations}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptyHint}>
              Start a DM or join a channel to begin chatting
            </Text>
          </View>
        }
        contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : undefined}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("NewDM")}
      >
        <Ionicons name="create-outline" size={24} color={colors.bg} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  emptyContainer: {
    flex: 1,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  emptyHint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
