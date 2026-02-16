/** Saga Genesis Token — Metaplex verified collection */
export const SAGA_GENESIS_COLLECTION =
  "46pcSL5gmjBrPqGKFaLbbCmR6iVuLJbnQy13hAe7s6CC";

/** Seeker Genesis Token — Token-2022 mint authority */
export const SEEKER_MINT_AUTHORITY =
  "GT2zuHVaZQYZSyQMgJPLzvkmyztfyXg2NJunqFp4p3A4";

/** Seeker Genesis Token — metadata address */
export const SEEKER_METADATA_ADDRESS =
  "GT22s89nU4iWFkNXj1Bw6uYhJJWDRPpShHt4Bk8f99Te";

export type GenesisTokenType = "saga" | "seeker";

export interface GenesisTokenResult {
  hasToken: boolean;
  tokenType: GenesisTokenType | null;
  mintAddress: string | null;
}
