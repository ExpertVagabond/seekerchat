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
