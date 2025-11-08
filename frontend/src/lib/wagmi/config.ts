import { http } from "wagmi";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

// Arc Testnet Configuration (Wagmi v2 + Viem)
export const arcTestnet = defineChain({
  id: 5042002, // Arc Testnet Chain ID
  name: "Arc Testnet",
  nativeCurrency: {
    decimals: 18, // Arc uses 18 decimals for native USDC (not ERC20 6 decimals)
    name: "USD Coin",
    symbol: "USDC",
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arc Explorer",
      url: "https://explorer.testnet.arc.network",
    },
  },
  testnet: true,
});

// Export chains array
export const chains = [arcTestnet];

// Wagmi v2 Configuration with RainbowKit
export const wagmiConfig = getDefaultConfig({
  appName: "Aegis Finance",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(),
  },
});
