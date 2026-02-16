import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTokenGateStore } from "@/stores/tokenGateStore";
import { colors, fontSize, spacing, borderRadius } from "@/constants/theme";

export default function SettingsScreen() {
  const { walletAddress, supabaseUserId, disconnect } = useAuthStore();
  const { displayName, updateDisplayName } = useSettingsStore();
  const { tokenType } = useTokenGateStore();
  const [editName, setEditName] = useState(displayName ?? "");
  const [isEditing, setIsEditing] = useState(false);

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "";

  const handleSaveName = async () => {
    if (!supabaseUserId || !editName.trim()) return;
    const ok = await updateDisplayName(supabaseUserId, editName.trim());
    if (ok) {
      setIsEditing(false);
    } else {
      Alert.alert("Error", "Failed to update display name");
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      "Disconnect Wallet",
      "You will be signed out of SeekerChat.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Disconnect", style: "destructive", onPress: disconnect },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Wallet</Text>
          <Text style={styles.value}>{shortAddress}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Device</Text>
          <Text style={[styles.value, styles.badge]}>
            {tokenType === "saga" ? "Saga" : "Seeker"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Display Name</Text>
          {isEditing ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                maxLength={30}
                autoFocus
              />
              <TouchableOpacity onPress={handleSaveName}>
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.editRow}
              onPress={() => {
                setEditName(displayName ?? "");
                setIsEditing(true);
              }}
            >
              <Text style={styles.value}>
                {displayName ?? "Not set"}
              </Text>
              <Ionicons name="pencil" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Version</Text>
          <Text style={styles.value}>1.0.0</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Built on</Text>
          <Text style={styles.value}>Solana</Text>
        </View>
      </View>

      {/* Disconnect */}
      <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.disconnectText}>Disconnect Wallet</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.md,
    gap: spacing.lg,
  },
  section: {
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
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
    color: colors.textSecondary,
  },
  badge: {
    color: colors.primary,
    fontWeight: "600",
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  editInput: {
    backgroundColor: colors.bgTertiary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    fontSize: fontSize.md,
    color: colors.text,
    minWidth: 120,
  },
  disconnectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  disconnectText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.error,
  },
});
