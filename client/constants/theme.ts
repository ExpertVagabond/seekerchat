export const colors = {
  // Solana-inspired palette
  primary: "#14F195", // Solana green
  primaryDark: "#0DB47A",
  secondary: "#9945FF", // Solana purple
  secondaryDark: "#7B37CC",

  // Backgrounds
  bg: "#0D1117",
  bgSecondary: "#161B22",
  bgTertiary: "#21262D",
  bgCard: "#1C2128",

  // Text
  text: "#F0F6FC",
  textSecondary: "#8B949E",
  textMuted: "#484F58",

  // Status
  success: "#14F195",
  error: "#F85149",
  warning: "#D29922",
  info: "#58A6FF",

  // Chat
  bubbleOwn: "#14F195",
  bubbleOwnText: "#0D1117",
  bubbleOther: "#21262D",
  bubbleOtherText: "#F0F6FC",

  // Borders
  border: "#30363D",
  borderLight: "#21262D",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
  title: 34,
} as const;

export const borderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
