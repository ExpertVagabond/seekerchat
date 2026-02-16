import { Connection, clusterApiUrl } from "@solana/web3.js";
import { HELIUS_RPC_URL, SOLANA_CLUSTER } from "@/constants/config";

let _connection: Connection | null = null;

/** Singleton Solana RPC connection (Helius, DAS-compatible) */
export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(HELIUS_RPC_URL, "confirmed");
  }
  return _connection;
}

/** Fallback public RPC (no DAS support, for basic queries only) */
export function getPublicConnection(): Connection {
  return new Connection(clusterApiUrl(SOLANA_CLUSTER), "confirmed");
}
