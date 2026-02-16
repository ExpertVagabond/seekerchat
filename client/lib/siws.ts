import nacl from "tweetnacl";
import bs58 from "bs58";
import { SIWS_DOMAIN } from "@/constants/config";

/**
 * Build a Sign-In With Solana (SIWS) message.
 * Follows the off-chain signing convention: \xffsolana offchain prefix
 * Compatible with Phantom, Solflare, and Seed Vault wallets.
 */
export function buildSIWSMessage(params: {
  address: string;
  nonce: string;
  issuedAt?: string;
  expirationTime?: string;
  statement?: string;
}): string {
  const {
    address,
    nonce,
    issuedAt = new Date().toISOString(),
    statement = "Sign in to SeekerChat",
  } = params;

  const lines = [
    `${SIWS_DOMAIN} wants you to sign in with your Solana account:`,
    address,
    "",
    statement,
    "",
    `URI: https://${SIWS_DOMAIN}`,
    `Version: 1`,
    `Chain ID: mainnet`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ];

  if (params.expirationTime) {
    lines.push(`Expiration Time: ${params.expirationTime}`);
  }

  return lines.join("\n");
}

/** Encode a SIWS message string to Uint8Array for signing */
export function encodeSIWSMessage(message: string): Uint8Array {
  return new TextEncoder().encode(message);
}

/**
 * Verify a SIWS signature locally (ed25519).
 * Used as a client-side sanity check before sending to Supabase.
 */
export function verifySIWSSignature(params: {
  message: Uint8Array;
  signature: Uint8Array;
  publicKey: string;
}): boolean {
  const pubKeyBytes = bs58.decode(params.publicKey);
  return nacl.sign.detached.verify(
    params.message,
    params.signature,
    pubKeyBytes,
  );
}

/** Generate a random nonce for SIWS challenge */
export function generateNonce(): string {
  const bytes = nacl.randomBytes(16);
  return bs58.encode(bytes);
}
