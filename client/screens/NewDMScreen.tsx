import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";
import { useChannelStore } from "@/stores/channelStore";
import { getSupabase } from "@/lib/supabase";
import type { ChatStackParamList } from "@/navigation/types";
import { colors, fontSize, spacing, borderRadius } from "@/constants/theme";

type Nav = NativeStackNavigationProp<ChatStackParamList, "NewDM">;

export default function NewDMScreen() {
  const navigation = useNavigation<Nav>();
  const { supabaseUserId } = useAuthStore();
  const { getOrCreateDM } = useChannelStore();
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!search.trim() || !supabaseUserId) return;

    setIsSearching(true);
    try {
      const supabase = getSupabase();

      // Search by wallet address or display name
      const { data: users } = await supabase
        .from("users")
        .select("id, wallet_address, display_name")
        .or(
          `wallet_address.ilike.%${search.trim()}%,display_name.ilike.%${search.trim()}%`,
        )
        .neq("id", supabaseUserId)
        .limit(1)
        .single();

      if (!users) {
        Alert.alert("Not Found", "No user found with that address or name.");
        setIsSearching(false);
        return;
      }

      // Get or create DM channel
      const channelId = await getOrCreateDM(supabaseUserId, users.id);
      if (channelId) {
        const displayName =
          users.display_name ??
          `${users.wallet_address.slice(0, 4)}...${users.wallet_address.slice(-4)}`;
        navigation.replace("ChatRoom", { channelId, channelName: displayName });
      } else {
        Alert.alert("Error", "Failed to create conversation");
      }
    } catch {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Enter a wallet address or display name</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          value={search}
          onChangeText={setSearch}
          placeholder="e.g. 7xKX...4pQ2 or username"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity
          style={[styles.searchButton, isSearching && styles.searchDisabled]}
          onPress={handleSearch}
          disabled={isSearching || !search.trim()}
        >
          {isSearching ? (
            <ActivityIndicator color={colors.bg} size="small" />
          ) : (
            <Ionicons name="arrow-forward" size={20} color={colors.bg} />
          )}
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>
        The recipient must also be a verified Saga/Seeker owner
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
  },
  searchRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgTertiary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  searchDisabled: {
    opacity: 0.5,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
