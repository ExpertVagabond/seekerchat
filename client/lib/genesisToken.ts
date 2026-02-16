import { PublicKey } from "@solana/web3.js";
import { getConnection } from "./solana";
import {
  SAGA_GENESIS_COLLECTION,
  SEEKER_MINT_AUTHORITY,
  type GenesisTokenResult,
} from "@/constants/tokens";

/**
 * Verify that a wallet holds a Saga Genesis Token or Seeker Genesis Token.
 *
 * Strategy:
 *   - Saga: Use Helius DAS `searchAssets` by verified collection address
 *   - Seeker: Use `getTokenAccountsByOwner` filtered by mint authority
 */
export async function verifyGenesisToken(
  walletAddress: string,
): Promise<GenesisTokenResult> {
  // Try Saga first (DAS API via Helius)
  const sagaResult = await checkSagaGenesisToken(walletAddress);
  if (sagaResult.hasToken) return sagaResult;

  // Fall back to Seeker check
  const seekerResult = await checkSeekerGenesisToken(walletAddress);
  return seekerResult;
}

/** Check for Saga Genesis Token via Helius DAS searchAssets */
async function checkSagaGenesisToken(
  walletAddress: string,
): Promise<GenesisTokenResult> {
  try {
    const connection = getConnection();
    const response = await fetch(connection.rpcEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "saga-genesis-check",
        method: "searchAssets",
        params: {
          ownerAddress: walletAddress,
          grouping: ["collection", SAGA_GENESIS_COLLECTION],
          page: 1,
          limit: 1,
        },
      }),
    });

    const data = await response.json();
    const items = data?.result?.items;

    if (items && items.length > 0) {
      return {
        hasToken: true,
        tokenType: "saga",
        mintAddress: items[0].id ?? null,
      };
    }
  } catch (error) {
    console.warn("Saga Genesis Token check failed:", error);
  }

  return { hasToken: false, tokenType: null, mintAddress: null };
}

/** Check for Seeker Genesis Token via token accounts filtered by mint authority */
async function checkSeekerGenesisToken(
  walletAddress: string,
): Promise<GenesisTokenResult> {
  try {
    const connection = getConnection();
    const ownerPubkey = new PublicKey(walletAddress);

    // Get all token accounts owned by this wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      ownerPubkey,
      { programId: new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb") }, // Token-2022 program
    );

    for (const account of tokenAccounts.value) {
      const parsedInfo = account.account.data.parsed?.info;
      if (!parsedInfo) continue;

      const mintAddress = parsedInfo.mint as string;
      const amount = parsedInfo.tokenAmount?.uiAmount ?? 0;

      if (amount <= 0) continue;

      // Verify this mint was created by the Seeker mint authority
      const mintInfo = await connection.getParsedAccountInfo(
        new PublicKey(mintAddress),
      );

      const mintData = (mintInfo.value?.data as { parsed?: { info?: { mintAuthority?: string } } })?.parsed?.info;

      if (mintData?.mintAuthority === SEEKER_MINT_AUTHORITY) {
        return {
          hasToken: true,
          tokenType: "seeker",
          mintAddress,
        };
      }
    }
  } catch (error) {
    console.warn("Seeker Genesis Token check failed:", error);
  }

  return { hasToken: false, tokenType: null, mintAddress: null };
}
