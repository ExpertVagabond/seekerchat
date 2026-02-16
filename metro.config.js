const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Solana web3.js requires these polyfills
config.resolver.extraNodeModules = {
  crypto: require.resolve("expo-crypto"),
};

module.exports = config;
