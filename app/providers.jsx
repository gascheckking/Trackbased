"use client";

// Global providers for Wagmi + Web3Modal
import { ReactNode } from "react";
import { WagmiConfig, configureChains, createConfig } from "wagmi";
import { base } from "wagmi/chains";
import { w3mProvider, EthereumClient } from "@web3modal/ethereum";
import { Web3Modal } from "@web3modal/react";

// NOTE: put your WalletConnect Project ID here (the one you showed earlier)
const PROJECT_ID = "c0aa1ca206eb7d58226102b102ec49e9";

// Configure chains (Base only). Add others if you want.
const chains = [base];

// Provider via WalletConnect infra
const { publicClient, webSocketPublicClient } = configureChains(
  chains,
  [w3mProvider({ projectId: PROJECT_ID })]
);

// Wagmi client
const wagmiConfig = createConfig({
  autoConnect: true,
  publicClient,
  webSocketPublicClient
});

// Ethereum client for Web3Modal
const ethereumClient = new EthereumClient(wagmiConfig, chains);

export default function Providers({ children }) {
  return (
    <>
      <WagmiConfig config={wagmiConfig}>{children}</WagmiConfig>
      {/* Web3Modal lives once at root */}
      <Web3Modal projectId={PROJECT_ID} ethereumClient={ethereumClient} />
    </>
  );
}
