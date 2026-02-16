import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { colors, fontSize, spacing, borderRadius } from "@/constants/theme";

interface Props {
  onPress: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function WalletConnectButton({ onPress, isLoading, disabled }: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={isLoading || disabled}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.bg} size="small" />
      ) : (
        <Text style={styles.text}>Connect Wallet</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.bg,
  },
});
