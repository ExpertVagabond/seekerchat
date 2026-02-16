/** Supabase project URL — set via EAS secrets in production */
export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  "https://knffubovjrgumchjqaih.supabase.co";

/** Supabase anon key — safe to embed, RLS protects data */
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuZmZ1Ym92anJndW1jaGpxYWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNTg1ODQsImV4cCI6MjA4NjgzNDU4NH0.htjtBP8q2QZJA4AAzSGrahvG_Ipdw-sV4phSsauWLqY";

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
