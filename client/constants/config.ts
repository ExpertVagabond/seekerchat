/** Supabase project URL — set via EAS secrets in production */
export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://YOUR_PROJECT.supabase.co";

/** Supabase anon key — safe to embed, RLS protects data */
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Helius RPC — DAS-compatible, required for Genesis Token verification */
export const HELIUS_RPC_URL =
  process.env.EXPO_PUBLIC_HELIUS_RPC_URL ??
  "https://mainnet.helius-rpc.com/?api-key=YOUR_KEY";

/** Solana cluster for MWA authorization */
export const SOLANA_CLUSTER = "mainnet-beta" as const;

/** App identity for MWA wallet authorization */
export const APP_IDENTITY = {
  name: "SeekerChat",
  uri: "https://seekerchat.app",
  icon: "favicon.ico",
} as const;

/** SIWS domain — must match what wallet displays */
export const SIWS_DOMAIN = "seekerchat.app";
