import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, spacing, borderRadius } from "@/constants/theme";

interface Props {
  isVerifying: boolean;
  walletAddress: string;
  onRetry: () => void;
  onDisconnect: () => void;
}

export function TokenGateScreen({
  isVerifying,
  walletAddress,
  onRetry,
  onDisconnect,
}: Props) {
  const shortAddress = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;

  return (
    <View style={styles.container}>
      <Ionicons name="lock-closed" size={64} color={colors.secondary} />
      <Text style={styles.title}>Exclusive Access</Text>
      <Text style={styles.subtitle}>
        SeekerChat is only for Solana Saga and Seeker phone owners.
      </Text>
      <View style={styles.card}>
        <Ionicons name="phone-portrait-outline" size={24} color={colors.textSecondary} />
        <Text style={styles.cardText}>
          Your wallet ({shortAddress}) does not hold a Saga Genesis Token or
          Seeker Genesis Token.
        </Text>
      </View>
      <Text style={styles.hint}>
        If you own a Saga or Seeker phone, make sure your Genesis Token is in
        the connected wallet.
      </Text>

      {isVerifying ? (
        <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryText}>Check Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.disconnectButton} onPress={onDisconnect}>
            <Text style={styles.disconnectText}>Disconnect Wallet</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: 18,
  },
  loader: {
    marginTop: spacing.lg,
  },
  actions: {
    gap: spacing.md,
    width: "100%",
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  retryText: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.bg,
  },
  disconnectButton: {
    backgroundColor: colors.bgTertiary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  disconnectText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});
