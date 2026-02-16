import { useCallback } from "react";
import { useTokenGateStore } from "@/stores/tokenGateStore";

/**
 * Hook for Genesis Token verification.
 * Returns verification state and a manual re-verify action.
 */
export function useGenesisToken() {
  const {
    hasToken,
    tokenType,
    mintAddress,
    isVerifying,
    lastCheckedAt,
    error,
    verify,
  } = useTokenGateStore();

  const reVerify = useCallback(
    (walletAddress: string) => verify(walletAddress),
    [verify],
  );

  return {
    hasToken,
    tokenType,
    mintAddress,
    isVerifying,
    lastCheckedAt,
    error,
    reVerify,
  };
}
