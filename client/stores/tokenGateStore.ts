import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { verifyGenesisToken } from "@/lib/genesisToken";
import type { GenesisTokenType } from "@/constants/tokens";

const TOKEN_CACHE_KEY = "seekerchat_genesis_token";
const CACHE_TTL_MS = 1000 * 60 * 60; // Re-verify every hour

interface TokenCacheData {
  hasToken: boolean;
  tokenType: GenesisTokenType | null;
  mintAddress: string | null;
  checkedAt: number;
}

interface TokenGateState {
  hasToken: boolean;
  tokenType: GenesisTokenType | null;
  mintAddress: string | null;
  isVerifying: boolean;
  lastCheckedAt: number | null;
  error: string | null;
}

interface TokenGateActions {
  verify: (walletAddress: string) => Promise<boolean>;
  loadCache: () => Promise<void>;
  clearCache: () => Promise<void>;
}

type TokenGateStore = TokenGateState & TokenGateActions;

export const useTokenGateStore = create<TokenGateStore>((set, get) => ({
  hasToken: false,
  tokenType: null,
  mintAddress: null,
  isVerifying: false,
  lastCheckedAt: null,
  error: null,

  loadCache: async () => {
    try {
      const raw = await AsyncStorage.getItem(TOKEN_CACHE_KEY);
      if (!raw) return;
      const cached: TokenCacheData = JSON.parse(raw);

      // Use cache if still fresh
      if (Date.now() - cached.checkedAt < CACHE_TTL_MS) {
        set({
          hasToken: cached.hasToken,
          tokenType: cached.tokenType,
          mintAddress: cached.mintAddress,
          lastCheckedAt: cached.checkedAt,
        });
      }
    } catch {
      // Ignore cache errors
    }
  },

  verify: async (walletAddress: string) => {
    set({ isVerifying: true, error: null });

    try {
      const result = await verifyGenesisToken(walletAddress);
      const now = Date.now();

      const cacheData: TokenCacheData = {
        hasToken: result.hasToken,
        tokenType: result.tokenType,
        mintAddress: result.mintAddress,
        checkedAt: now,
      };

      await AsyncStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify(cacheData));

      set({
        hasToken: result.hasToken,
        tokenType: result.tokenType,
        mintAddress: result.mintAddress,
        isVerifying: false,
        lastCheckedAt: now,
      });

      return result.hasToken;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Token verification failed";
      set({ isVerifying: false, error: message });
      return false;
    }
  },

  clearCache: async () => {
    await AsyncStorage.removeItem(TOKEN_CACHE_KEY);
    set({
      hasToken: false,
      tokenType: null,
      mintAddress: null,
      lastCheckedAt: null,
    });
  },
}));
