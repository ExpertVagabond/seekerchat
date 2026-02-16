import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { useAuthStore } from "@/stores/authStore";
import { colors, fontSize, spacing } from "@/constants/theme";

export default function WalletConnectScreen() {
  const { connect, isConnecting, error, clearError } = useAuthStore();

  const handleConnect = async () => {
    clearError();
    await connect();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="chatbubbles" size={80} color={colors.primary} />
        <Text style={styles.title}>SeekerChat</Text>
        <Text style={styles.subtitle}>
          Exclusive messaging for Solana Saga {"\n"}& Seeker phone owners
        </Text>
      </View>

      <View style={styles.features}>
        {[
          { icon: "shield-checkmark", label: "Token-gated access" },
          { icon: "flash", label: "Real-time messaging" },
          { icon: "people", label: "1:1 DMs & group channels" },
        ].map((feature) => (
          <View key={feature.label} style={styles.featureRow}>
            <Ionicons
              name={feature.icon as keyof typeof Ionicons.glyphMap}
              size={20}
              color={colors.primary}
            />
            <Text style={styles.featureText}>{feature.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.bottom}>
        {error && <Text style={styles.error}>{error}</Text>}
        <WalletConnectButton onPress={handleConnect} isLoading={isConnecting} />
        <Text style={styles.hint}>
          Connect your Solana wallet to get started
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "space-between",
    padding: spacing.xl,
    paddingTop: 80,
  },
  header: {
    alignItems: "center",
    gap: spacing.md,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  features: {
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  featureText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  bottom: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  error: {
    fontSize: fontSize.sm,
    color: colors.error,
    textAlign: "center",
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
  },
});
