import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useTokenGateStore } from "@/stores/tokenGateStore";
import { useSettingsStore } from "@/stores/settingsStore";

/**
 * Orchestrates the full auth pipeline:
 *   1. Load persisted auth state
 *   2. If authenticated, load token gate cache
 *   3. Verify Genesis Token on-chain
 *   4. Load user profile
 */
export function useWalletAuth() {
  const {
    walletAddress,
    supabaseUserId,
    isAuthenticated,
    isLoading: authLoading,
    isConnecting,
    error: authError,
    loadAuth,
    connect,
    disconnect,
  } = useAuthStore();

  const {
    hasToken,
    tokenType,
    isVerifying,
    error: tokenError,
    verify,
    loadCache,
  } = useTokenGateStore();

  const { loadProfile } = useSettingsStore();

  // On mount: load cached auth + token state
  useEffect(() => {
    loadAuth();
    loadCache();
  }, []);

  // When wallet is connected, verify Genesis Token
  useEffect(() => {
    if (isAuthenticated && walletAddress && !hasToken) {
      verify(walletAddress);
    }
  }, [isAuthenticated, walletAddress]);

  // When authenticated + verified, load profile
  useEffect(() => {
    if (isAuthenticated && hasToken && supabaseUserId) {
      loadProfile(supabaseUserId);
    }
  }, [isAuthenticated, hasToken, supabaseUserId]);

  return {
    // Auth state
    walletAddress,
    isAuthenticated,
    isAuthLoading: authLoading,
    isConnecting,
    authError,

    // Token gate state
    hasGenesisToken: hasToken,
    genesisTokenType: tokenType,
    isVerifyingToken: isVerifying,
    tokenError,

    // Combined loading
    isLoading: authLoading || isVerifying,
    isReady: isAuthenticated && hasToken,

    // Actions
    connect,
    disconnect,
  };
}
