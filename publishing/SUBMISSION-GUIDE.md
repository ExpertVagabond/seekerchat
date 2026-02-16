# SeekerChat — Solana dApp Store Submission Guide

## Prerequisites

### 1. Helius API Key (Required for Genesis Token verification)

Sign up at https://dashboard.helius.dev/signup (free, no credit card).

Free tier: 1M credits/month, 10 req/s, DAS API included.

After getting your key, set it as an EAS secret:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_HELIUS_RPC_URL \
  --value "https://mainnet.helius-rpc.com/?api-key=YOUR_ACTUAL_KEY" \
  --non-interactive
```

### 2. Solana Wallet with SOL

The dApp Store publisher registration requires a Solana wallet with ~0.2 SOL
for on-chain publisher registration (NFT mint).

### 3. Signed APK

Already built and located at `publishing/files/app-release.apk` (84MB).
If you need to rebuild:

```bash
eas build --profile dapp-store --platform android --non-interactive
```

Build uses local keystore at `$VS/configs/credentials/seekerchat/dapp-store.keystore`.

## Submission Steps

### Step 1: Create Publisher Profile

1. Go to https://publish.solanamobile.com
2. Connect your Solana wallet (Phantom recommended)
3. Click "Create Publisher"
4. Fill in publisher details:
   - **Name:** Purple Squirrel Media
   - **Website:** https://purplesquirrelmedia.io
   - **Email:** matthew@purplesquirrelmedia.io
5. Approve the on-chain transaction (~0.01 SOL)

### Step 2: Create App Listing

1. Click "Create App" in the publisher dashboard
2. Fill in app details:
   - **App Name:** SeekerChat
   - **Android Package:** com.seekerchat.app
   - **Category:** Social / Communication
   - **Website:** https://seekerchat.app
   - **License URL:** https://seekerchat.app/terms
   - **Privacy Policy:** https://seekerchat.app/privacy

### Step 3: Create Release

1. Click "Create Release" on your app
2. Upload assets from `publishing/media/`:
   - **Icon:** icon.png (512x512)
   - **Banner:** banner.png (848x1264)
   - **Feature Graphic:** feature_graphic.png (1024x500)
   - **Screenshots:** screenshot_1.png through screenshot_4.png
3. Upload APK from `publishing/files/app-release.apk`
4. Fill in catalog text (copy from `publishing/config.yaml`):
   - **Short Description:** Exclusive encrypted chat for Solana Saga & Seeker phone owners
   - **Long Description:** (see config.yaml `long_description` field)
   - **What's New:** (see config.yaml `new_in_version` field)
5. Add testing instructions (see config.yaml `testing_instructions` field)

### Step 4: Submit for Review

1. Review all details
2. Click "Submit for Review"
3. Review takes 2-5 business days
4. You'll receive email notification at matthew@purplesquirrelmedia.io

## Post-Submission

- **Review status:** Check at https://publish.solanamobile.com
- **If rejected:** Fix issues noted in rejection email, create new release
- **Updates:** Create new release with incremented version, rebuild APK

## File Reference

| File | Purpose |
|------|---------|
| `publishing/config.yaml` | Full store metadata (copy-paste source) |
| `publishing/media/icon.png` | App icon |
| `publishing/media/banner.png` | Store banner |
| `publishing/media/feature_graphic.png` | Feature graphic |
| `publishing/media/screenshot_1-4.png` | Store screenshots |
| `publishing/files/app-release.apk` | Signed release APK |
| `credentials.json` | Local keystore config (gitignored) |

## Credentials

- **Keystore:** `$VS/configs/credentials/seekerchat/dapp-store.keystore`
- **Alias:** seekerchat-dapp-store
- **Supabase:** `$VS/configs/credentials/seekerchat/supabase.env`
- **EAS Project:** 7c3add5b-90c4-4988-8790-6fd313442ece
