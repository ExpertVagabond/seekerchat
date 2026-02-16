import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fontSize, spacing, borderRadius } from "@/constants/theme";
import { format } from "date-fns";

interface Props {
  content: string;
  createdAt: string;
  isOwn: boolean;
  senderName?: string;
  isPending?: boolean;
}

export function ChatBubble({
  content,
  createdAt,
  isOwn,
  senderName,
  isPending,
}: Props) {
  const time = format(new Date(createdAt), "HH:mm");

  return (
    <View style={[styles.row, isOwn && styles.rowOwn]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {!isOwn && senderName && (
          <Text style={styles.senderName}>{senderName}</Text>
        )}
        <Text style={[styles.content, isOwn ? styles.contentOwn : styles.contentOther]}>
          {content}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.time, isOwn ? styles.timeOwn : styles.timeOther]}>
            {time}
          </Text>
          {isPending && <Text style={styles.pending}>sending...</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginVertical: 2,
    marginHorizontal: spacing.md,
  },
  rowOwn: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  bubbleOwn: {
    backgroundColor: colors.bubbleOwn,
    borderBottomRightRadius: borderRadius.sm,
  },
  bubbleOther: {
    backgroundColor: colors.bubbleOther,
    borderBottomLeftRadius: borderRadius.sm,
  },
  senderName: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 2,
  },
  content: {
    fontSize: fontSize.md,
    lineHeight: 20,
  },
  contentOwn: {
    color: colors.bubbleOwnText,
  },
  contentOther: {
    color: colors.bubbleOtherText,
  },
  meta: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 2,
    gap: 4,
  },
  time: {
    fontSize: fontSize.xs,
  },
  timeOwn: {
    color: colors.bubbleOwnText,
    opacity: 0.6,
  },
  timeOther: {
    color: colors.textMuted,
  },
  pending: {
    fontSize: fontSize.xs,
    color: colors.warning,
    fontStyle: "italic",
  },
});
