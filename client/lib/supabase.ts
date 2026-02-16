import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/constants/config";

/** Secure token storage adapter for Supabase auth */
const secureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    await SecureStore.deleteItemAsync(key);
  },
};

let _supabase: SupabaseClient | null = null;

/** Singleton Supabase client with SecureStore for token persistence */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: secureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return _supabase;
}

/**
 * Authenticate with Supabase using a wallet-signed SIWS message.
 * Uses Supabase's custom JWT flow:
 *   1. Client signs SIWS message via MWA
 *   2. We call a Supabase Edge Function that verifies the signature
 *   3. Edge Function returns a Supabase JWT
 *   4. We set the session client-side
 */
export async function authenticateWithWallet(params: {
  walletAddress: string;
  message: string;
  signature: string;
}): Promise<{ userId: string; error: string | null }> {
  const supabase = getSupabase();

  const { data, error } = await supabase.functions.invoke("wallet-auth", {
    body: {
      wallet_address: params.walletAddress,
      message: params.message,
      signature: params.signature,
    },
  });

  if (error || !data?.access_token) {
    return {
      userId: "",
      error: error?.message ?? data?.error ?? "Authentication failed",
    };
  }

  // Set the session returned by the Edge Function
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });

  if (sessionError) {
    return { userId: "", error: sessionError.message };
  }

  return { userId: data.user_id, error: null };
}

/** Sign out and clear stored session */
export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  await supabase.auth.signOut();
}
