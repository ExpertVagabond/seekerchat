import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { colors, borderRadius } from "@/constants/theme";

interface Props {
  walletAddress?: string;
  avatarUrl?: string | null;
  size?: number;
}

/** Generates a consistent color from a wallet address */
function addressToColor(address: string): string {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

/** First 2 chars of wallet address as initials */
function getInitials(address: string): string {
  return address.slice(0, 2).toUpperCase();
}

export function UserAvatar({ walletAddress, avatarUrl, size = 40 }: Props) {
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  const bgColor = walletAddress ? addressToColor(walletAddress) : colors.secondary;
  const initials = walletAddress ? getInitials(walletAddress) : "??";

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.35 }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.bgTertiary,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: "#fff",
    fontWeight: "700",
  },
});
