// ---------------------------------------------------------------------------
// Security: input validation, error sanitization, constants
// ---------------------------------------------------------------------------

const MAX_INPUT_LENGTH = 4096;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_ADDRESS_LENGTH = 64;
const SOLANA_PUBKEY_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const MAX_MESSAGES_PER_MINUTE = 30;

function sanitizeError(err: unknown): string {
  let msg = String(err instanceof Error ? err.message : err);
  msg = msg.replace(/\/[^\s:]+/g, "[path]");
  msg = msg.replace(/at\s+.+\(.*:\d+:\d+\)/g, "[stackframe]");
  msg = msg.replace(/[1-9A-HJ-NP-Za-km-z]{64,}/g, "[REDACTED_KEY]");
  return msg.slice(0, 500);
}

function validateWalletAddress(address: string): string {
  const trimmed = address.trim();
  if (trimmed.length > MAX_ADDRESS_LENGTH) {
    throw new Error("Address exceeds maximum length");
  }
  if (!SOLANA_PUBKEY_RE.test(trimmed)) {
    throw new Error("Invalid Solana wallet address format");
  }
  return trimmed;
}

function validateMessage(msg: string): string {
  if (typeof msg !== "string") throw new Error("Message must be a string");
  const trimmed = msg.trim();
  if (trimmed.length === 0) throw new Error("Message must not be empty");
  if (trimmed.length > MAX_MESSAGE_LENGTH)
    throw new Error(`Message exceeds maximum length of ${MAX_MESSAGE_LENGTH}`);
  // Strip HTML tags to prevent injection
  return trimmed.replace(/<[^>]*>/g, "");
}

function validateStringInput(
  value: unknown,
  maxLen: number = MAX_INPUT_LENGTH,
  field: string = "input",
): string {
  if (typeof value !== "string") throw new Error(`${field} must be a string`);
  return value.trim().slice(0, maxLen);
}

// ---------------------------------------------------------------------------
// App imports
// ---------------------------------------------------------------------------

import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TokenGateScreen } from "@/components/TokenGateScreen";
import RootStackNavigator from "@/navigation/RootStackNavigator";
import WalletConnectScreen from "@/screens/WalletConnectScreen";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useMessageQueue } from "@/hooks/useMessageQueue";
import { colors } from "@/constants/theme";

function AppContent() {
  const {
    walletAddress,
    isAuthenticated,
    isAuthLoading,
    hasGenesisToken,
    isVerifyingToken,
    isReady,
    connect,
    disconnect,
  } = useWalletAuth();

  // Monitor network and flush offline message queue
  useMessageQueue();

  // Loading state
  if (isAuthLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  // Not connected — show wallet connect screen
  if (!isAuthenticated) {
    return <WalletConnectScreen />;
  }

  // Connected but no Genesis Token — show gate
  if (!hasGenesisToken && walletAddress) {
    return (
      <TokenGateScreen
        isVerifying={isVerifyingToken}
        walletAddress={walletAddress}
        onRetry={() => {
          const { verify } = require("@/stores/tokenGateStore").useTokenGateStore.getState();
          verify(walletAddress);
        }}
        onDisconnect={disconnect}
      />
    );
  }

  // Fully authenticated + verified — show main app
  return (
    <KeyboardProvider>
      <NavigationContainer>
        <RootStackNavigator />
      </NavigationContainer>
      <StatusBar style="light" />
    </KeyboardProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={styles.root}>
            <AppContent />
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },
});
