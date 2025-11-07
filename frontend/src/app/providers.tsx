"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi/config";
import { Toaster } from "sonner";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#ffffff',
            accentColorForeground: '#000000',
            borderRadius: 'medium',
            fontStack: 'system',
          })}
        >
          {children}
          <Toaster position="top-right" theme="dark" />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
