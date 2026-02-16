import { create } from "zustand";
import { getSupabase } from "@/lib/supabase";

interface SettingsState {
  displayName: string | null;
  avatarUrl: string | null;
  isDarkMode: boolean;
  isUpdating: boolean;
}

interface SettingsActions {
  loadProfile: (userId: string) => Promise<void>;
  updateDisplayName: (userId: string, name: string) => Promise<boolean>;
  toggleDarkMode: () => void;
}

type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>((set) => ({
  displayName: null,
  avatarUrl: null,
  isDarkMode: true, // Default dark (Solana aesthetic)
  isUpdating: false,

  loadProfile: async (userId: string) => {
    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("users")
        .select("display_name, avatar_url")
        .eq("id", userId)
        .single();

      if (data) {
        set({
          displayName: data.display_name,
          avatarUrl: data.avatar_url,
        });
      }
    } catch {
      // Ignore
    }
  },

  updateDisplayName: async (userId: string, name: string) => {
    set({ isUpdating: true });
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("users")
        .update({ display_name: name })
        .eq("id", userId);

      if (!error) {
        set({ displayName: name, isUpdating: false });
        return true;
      }
      set({ isUpdating: false });
      return false;
    } catch {
      set({ isUpdating: false });
      return false;
    }
  },

  toggleDarkMode: () => {
    set((state) => ({ isDarkMode: !state.isDarkMode }));
  },
}));
