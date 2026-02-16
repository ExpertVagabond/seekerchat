import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { connectWallet, deauthorizeWallet } from "@/lib/mwa";
import {
  buildSIWSMessage,
  encodeSIWSMessage,
  generateNonce,
} from "@/lib/siws";
import { signMessage } from "@/lib/mwa";
import {
  authenticateWithWallet,
  signOut as supabaseSignOut,
} from "@/lib/supabase";
import bs58 from "bs58";

const MWA_AUTH_TOKEN_KEY = "seekerchat_mwa_auth_token";
const WALLET_ADDRESS_KEY = "seekerchat_wallet_address";

interface AuthState {
  walletAddress: string | null;
  mwaAuthToken: string | null;
  supabaseUserId: string | null;
  isConnecting: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  loadAuth: () => Promise<void>;
  connect: () => Promise<{ success: boolean; error?: string }>;
  disconnect: () => Promise<void>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  walletAddress: null,
  mwaAuthToken: null,
  supabaseUserId: null,
  isConnecting: false,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  loadAuth: async () => {
    try {
      const [savedToken, savedAddress] = await Promise.all([
        SecureStore.getItemAsync(MWA_AUTH_TOKEN_KEY),
        SecureStore.getItemAsync(WALLET_ADDRESS_KEY),
      ]);

      if (savedToken && savedAddress) {
        set({
          mwaAuthToken: savedToken,
          walletAddress: savedAddress,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  connect: async () => {
    set({ isConnecting: true, error: null });
    try {
      // Step 1: Connect wallet via MWA
      const { address, authToken } = await connectWallet();

      // Step 2: Build and sign SIWS message
      const nonce = generateNonce();
      const message = buildSIWSMessage({ address, nonce });
      const messageBytes = encodeSIWSMessage(message);
      const signature = await signMessage(authToken, messageBytes);
      const signatureBase58 = bs58.encode(signature);

      // Step 3: Authenticate with Supabase
      const { userId, error: authError } = await authenticateWithWallet({
        walletAddress: address,
        message,
        signature: signatureBase58,
      });

      if (authError) {
        set({ isConnecting: false, error: authError });
        return { success: false, error: authError };
      }

      // Step 4: Persist auth state
      await Promise.all([
        SecureStore.setItemAsync(MWA_AUTH_TOKEN_KEY, authToken),
        SecureStore.setItemAsync(WALLET_ADDRESS_KEY, address),
      ]);

      set({
        walletAddress: address,
        mwaAuthToken: authToken,
        supabaseUserId: userId,
        isConnecting: false,
        isAuthenticated: true,
        error: null,
      });

      return { success: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Wallet connection failed";
      set({ isConnecting: false, error: message });
      return { success: false, error: message };
    }
  },

  disconnect: async () => {
    const { mwaAuthToken } = get();
    try {
      if (mwaAuthToken) {
        await deauthorizeWallet(mwaAuthToken);
      }
      await supabaseSignOut();
    } catch {
      // Best effort — clear state regardless
    }

    await Promise.all([
      SecureStore.deleteItemAsync(MWA_AUTH_TOKEN_KEY),
      SecureStore.deleteItemAsync(WALLET_ADDRESS_KEY),
    ]);

    set({
      walletAddress: null,
      mwaAuthToken: null,
      supabaseUserId: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
