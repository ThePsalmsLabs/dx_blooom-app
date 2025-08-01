// src/lib/biconomy/config.ts
/**
 * Biconomy Smart Account Configuration
 * 
 * This file creates the real Biconomy integration that will replace the mock
 * implementations in your existing Web3Provider. The configuration follows
 * your existing pattern of environment-based setup with proper fallbacks.
 * 
 * Key Concepts:
 * - Smart Accounts provide gasless transactions through paymasters
 * - Bundlers aggregate transactions for efficient processing
 * - The configuration integrates with your existing wagmi setup
 */

import { BiconomySmartAccountV2, DEFAULT_ENTRYPOINT_ADDRESS } from "@biconomy/account";
import { base, baseSepolia } from "viem/chains";
import { WalletClient } from "viem";

/**
 * Biconomy Environment Configuration
 *
 * All required environment variables are validated at startup.
 * This config is ready for multi-chain and future extension.
 */
const BICONOMY_API_KEY = process.env.NEXT_PUBLIC_BICONOMY_API_KEY;
const BICONOMY_BUNDLER_URL = process.env.NEXT_PUBLIC_BICONOMY_BUNDLER_URL;
const BICONOMY_PAYMASTER_URL = process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_URL;

if (!BICONOMY_BUNDLER_URL || !BICONOMY_PAYMASTER_URL) {
  throw new Error(
    "Biconomy: Missing BICONOMY_BUNDLER_URL or BICONOMY_PAYMASTER_URL in environment variables."
  );
}

/**
 * Centralized Biconomy config object.
 * Extend this for multi-chain or additional Biconomy features.
 */
export const biconomyConfig = {
  apiKey: BICONOMY_API_KEY,
  bundlerUrl: BICONOMY_BUNDLER_URL,
  paymasterUrl: BICONOMY_PAYMASTER_URL,
  // Add more global or chain-specific config here as needed
  chains: {
    [String(base.id)]: {
      bundlerUrl: BICONOMY_BUNDLER_URL,
      paymasterUrl: BICONOMY_PAYMASTER_URL,
      entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
      apiKey: BICONOMY_API_KEY,
    },
    [String(baseSepolia.id)]: {
      bundlerUrl: BICONOMY_BUNDLER_URL,
      paymasterUrl: BICONOMY_PAYMASTER_URL,
      entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
      apiKey: BICONOMY_API_KEY,
    },
    // Add more chains here as needed
  } as Record<string, {
    bundlerUrl: string;
    paymasterUrl: string;
    entryPointAddress: string;
    apiKey: string | undefined;
  }>,
};

/**
 * Returns the Biconomy config for a given chainId.
 * Extend this for more advanced multi-chain logic.
 */
export function getBiconomyChainConfig(chainId: number) {
  return biconomyConfig.chains[String(chainId)] || null;
}

/**
 * Factory for creating a Biconomy Smart Account instance.
 * Uses the centralized config and is ready for multi-chain.
 */
export async function createSmartAccount(
  signer: WalletClient,
  chainId: number
): Promise<BiconomySmartAccountV2 | null> {
  const config = getBiconomyChainConfig(chainId);
  if (!config) {
    console.log('Biconomy not available for this chain - using regular wallet');
    return null;
  }

  try {
    const smartAccount = await BiconomySmartAccountV2.create({
      signer,
      bundlerUrl: config.bundlerUrl,
      paymasterUrl: config.paymasterUrl,
      entryPointAddress: config.entryPointAddress,
    });
    console.log('✅ Smart Account created:', await smartAccount.getAccountAddress());
    return smartAccount;
  } catch (error) {
    console.error('Failed to create Smart Account:', error);
    return null;
  }
}

/**
 * .env template for documentation:
 *
 * NEXT_PUBLIC_BICONOMY_API_KEY=your_api_key_here
 * NEXT_PUBLIC_BICONOMY_BUNDLER_URL=https://bundler.biconomy.io/api/v3/84532/your_bundler_key
 * NEXT_PUBLIC_BICONOMY_PAYMASTER_URL=https://paymaster.biconomy.io/api/v2/84532/your_paymaster_key
 */