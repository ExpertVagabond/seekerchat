import {
  transact,
  Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { APP_IDENTITY, SOLANA_CLUSTER } from "@/constants/config";

export interface WalletAuthResult {
  address: string;
  authToken: string;
}

/** Connect to a wallet via Mobile Wallet Adapter and authorize */
export async function connectWallet(): Promise<WalletAuthResult> {
  return await transact(async (wallet: Web3MobileWallet) => {
    const result = await wallet.authorize({
      cluster: SOLANA_CLUSTER,
      identity: APP_IDENTITY,
    });
    return {
      address: result.accounts[0].address,
      authToken: result.auth_token,
    };
  });
}

/** Re-authorize with an existing auth token */
export async function reauthorizeWallet(
  authToken: string,
): Promise<WalletAuthResult> {
  return await transact(async (wallet: Web3MobileWallet) => {
    const result = await wallet.reauthorize({
      auth_token: authToken,
      identity: APP_IDENTITY,
    });
    return {
      address: result.accounts[0].address,
      authToken: result.auth_token,
    };
  });
}

/** Sign an arbitrary message using MWA */
export async function signMessage(
  authToken: string,
  message: Uint8Array,
): Promise<Uint8Array> {
  return await transact(async (wallet: Web3MobileWallet) => {
    await wallet.reauthorize({
      auth_token: authToken,
      identity: APP_IDENTITY,
    });
    const signatures = await wallet.signMessages({
      addresses: [], // Signs with the authorized account
      payloads: [message],
    });
    return signatures[0];
  });
}

/** Deauthorize the wallet (logout) */
export async function deauthorizeWallet(authToken: string): Promise<void> {
  await transact(async (wallet: Web3MobileWallet) => {
    await wallet.deauthorize({ auth_token: authToken });
  });
}
