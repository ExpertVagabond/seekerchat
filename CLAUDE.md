# SeekerChat — Project-Specific Claude Code Instructions

## Project Identity
- **App Name:** SeekerChat
- **Type:** Expo/React Native chat dApp (Android-only, Solana Mobile)
- **Package:** com.seekerchat.app
- **EAS Owner:** purplesquirrelmedia
- **Framework:** Expo ~54, React Native 0.81.x, TypeScript strict

## Architecture
- **Auth:** Mobile Wallet Adapter (MWA) → Sign In With Solana (SIWS) → Supabase JWT
- **Token Gate:** Verify Saga Genesis Token OR Seeker Genesis Token on every launch
- **Backend:** Supabase (PostgreSQL + real-time + RLS)
- **State:** Zustand stores + TanStack React Query
- **Offline:** AsyncStorage message queue, NetInfo flush

## Project Structure
```
client/           # React Native app
  components/     # Reusable UI (ChatBubble, MessageInput, etc.)
  screens/        # Screen components
  navigation/     # React Navigation (tabs + stacks)
  stores/         # Zustand state (auth, chat, channel, tokenGate, settings)
  hooks/          # Custom hooks (useWalletAuth, useRealtimeMessages, etc.)
  lib/            # Core utilities (mwa, siws, supabase, genesisToken, etc.)
  constants/      # Config, theme, token addresses
supabase/         # Database migrations
publishing/       # dApp Store submission assets
```

## Key Constants
- Saga Genesis Collection: `46pcSL5gmjBrPqGKFaLbbCmR6iVuLJbnQy13hAe7s6CC`
- Seeker Mint Authority: `GT2zuHVaZQYZSyQMgJPLzvkmyztfyXg2NJunqFp4p3A4`

## Environment Variables (via EAS secrets)
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `EXPO_PUBLIC_HELIUS_RPC_URL` — Helius DAS-compatible RPC

## Scripts
- `npm start` — Start Expo dev client
- `npm run lint` — ESLint
- `npm run check:types` — TypeScript strict check
- `npm run format` — Prettier

## Do NOT
- Run interactive CLI commands via Bash (eas login, expo login)
- Use Expo Go (MWA requires custom dev builds)
- Store API keys in code (use EAS secrets / env vars)
- Skip Genesis Token verification on any auth flow
