import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { UserAvatar } from "@/components/UserAvatar";
import { getSupabase } from "@/lib/supabase";
import type { ChatStackParamList } from "@/navigation/types";
import { colors, fontSize, spacing, borderRadius } from "@/constants/theme";

type Props = NativeStackScreenProps<ChatStackParamList, "Profile">;

interface UserProfile {
  walletAddress: string;
  displayName: string | null;
  avatarUrl: string | null;
  genesisTokenType: string;
  createdAt: string;
}

export default function ProfileScreen({ route }: Props) {
  const { userId } = route.params;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("users")
        .select("wallet_address, display_name, avatar_url, genesis_token_type, created_at")
        .eq("id", userId)
        .single();

      if (data) {
        setProfile({
          walletAddress: data.wallet_address,
          displayName: data.display_name,
          avatarUrl: data.avatar_url,
          genesisTokenType: data.genesis_token_type,
          createdAt: data.created_at,
        });
      }
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  const shortAddress = `${profile.walletAddress.slice(0, 6)}...${profile.walletAddress.slice(-4)}`;
  const joinDate = new Date(profile.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <UserAvatar
          walletAddress={profile.walletAddress}
          avatarUrl={profile.avatarUrl}
          size={80}
        />
        <Text style={styles.name}>
          {profile.displayName ?? shortAddress}
        </Text>
        {profile.displayName && (
          <Text style={styles.address}>{shortAddress}</Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Device</Text>
          <Text style={styles.value}>
            {profile.genesisTokenType === "saga" ? "Saga" : "Seeker"}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Member since</Text>
          <Text style={styles.value}>{joinDate}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.text,
  },
  address: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontFamily: "monospace",
  },
  section: {
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  label: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  value: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: "600",
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
