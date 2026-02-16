import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { UserAvatar } from "./UserAvatar";
import { colors, fontSize, spacing, borderRadius } from "@/constants/theme";
import { format, isToday, isYesterday } from "date-fns";

interface Props {
  name: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  avatarUrl: string | null;
  isDm: boolean;
  onPress: () => void;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
}

export function ChannelListItem({
  name,
  lastMessage,
  lastMessageAt,
  unreadCount,
  avatarUrl,
  onPress,
}: Props) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <UserAvatar avatarUrl={avatarUrl} walletAddress={name} size={48} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {lastMessageAt && (
            <Text style={styles.time}>{formatTime(lastMessageAt)}</Text>
          )}
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.preview} numberOfLines={1}>
            {lastMessage ?? "No messages yet"}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  time: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  preview: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.sm,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.bg,
  },
});
