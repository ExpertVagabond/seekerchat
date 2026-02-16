import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useChannelStore, type Channel } from "@/stores/channelStore";
import { useAuthStore } from "@/stores/authStore";
import type { ChannelStackParamList } from "@/navigation/types";
import { colors, fontSize, spacing, borderRadius } from "@/constants/theme";

type Nav = NativeStackNavigationProp<ChannelStackParamList, "ChannelBrowser">;

export default function ChannelBrowserScreen() {
  const navigation = useNavigation<Nav>();
  const { supabaseUserId } = useAuthStore();
  const {
    publicChannels,
    isLoading,
    loadPublicChannels,
    createChannel,
    joinChannel,
  } = useChannelStore();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    loadPublicChannels();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim() || !supabaseUserId) return;
    const channelId = await createChannel({
      name: newName.trim(),
      description: newDesc.trim() || undefined,
      createdBy: supabaseUserId,
    });
    if (channelId) {
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
      navigation.navigate("ChatRoom", {
        channelId,
        channelName: newName.trim(),
      });
    }
  };

  const handleJoin = async (channel: Channel) => {
    if (!supabaseUserId) return;
    const joined = await joinChannel(channel.id, supabaseUserId);
    if (joined) {
      navigation.navigate("ChatRoom", {
        channelId: channel.id,
        channelName: channel.name,
      });
    } else {
      Alert.alert("Error", "Failed to join channel");
    }
  };

  const renderItem = ({ item }: { item: Channel }) => (
    <TouchableOpacity
      style={styles.channelCard}
      onPress={() => handleJoin(item)}
    >
      <View style={styles.channelIcon}>
        <Ionicons name="people" size={24} color={colors.primary} />
      </View>
      <View style={styles.channelInfo}>
        <Text style={styles.channelName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.channelDesc} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {showCreate && (
        <View style={styles.createForm}>
          <TextInput
            style={styles.input}
            placeholder="Channel name"
            placeholderTextColor={colors.textMuted}
            value={newName}
            onChangeText={setNewName}
            maxLength={50}
          />
          <TextInput
            style={styles.input}
            placeholder="Description (optional)"
            placeholderTextColor={colors.textMuted}
            value={newDesc}
            onChangeText={setNewDesc}
            maxLength={200}
          />
          <View style={styles.createActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCreate(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, !newName.trim() && styles.submitDisabled]}
              onPress={handleCreate}
              disabled={!newName.trim()}
            >
              <Text style={styles.submitText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={publicChannels}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={publicChannels.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="globe-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No channels yet</Text>
            <Text style={styles.emptyHint}>Be the first to create one</Text>
          </View>
        }
      />

      {!showCreate && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowCreate(true)}
        >
          <Ionicons name="add" size={28} color={colors.bg} />
        </TouchableOpacity>
      )}
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
  },
  channelCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.md,
  },
  channelIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bgTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
  },
  channelDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  createForm: {
    padding: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.bgTertiary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  createActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  cancelButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cancelText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.bg,
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
