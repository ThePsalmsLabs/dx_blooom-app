export const CONTRACT_ADDRESSES = {
    // Base Mainnet addresses - these should match your deployed contracts
    8453: {
      CREATOR_REGISTRY: process.env.NEXT_PUBLIC_CREATOR_REGISTRY_ADDRESS as `0x${string}`,
      CONTENT_REGISTRY: process.env.NEXT_PUBLIC_CONTENT_REGISTRY_ADDRESS as `0x${string}`,
      PAY_PER_VIEW: process.env.NEXT_PUBLIC_PAY_PER_VIEW_ADDRESS as `0x${string}`,
      SUBSCRIPTION_MANAGER: process.env.NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS as `0x${string}`,
      COMMERCE_INTEGRATION: process.env.NEXT_PUBLIC_COMMERCE_INTEGRATION_ADDRESS as `0x${string}`,
      PRICE_ORACLE: process.env.NEXT_PUBLIC_PRICE_ORACLE_ADDRESS as `0x${string}`,
      COMMERCE_PROTOCOL: process.env.NEXT_PUBLIC_COMMERCE_PROTOCOL_ADDRESS as `0x${string}`,
      USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`,
    },
    // Base Sepolia testnet addresses - for development and testing
    84532: {
      CREATOR_REGISTRY: '0x7a2BDfCf9D5dE4fd299Af7bF1A93514E46560b84' as `0x${string}`, // Add your testnet addresses here
      CONTENT_REGISTRY: '0xf4a37B1F3568b200a4ED98675224C0DfF6Ad7444' as `0x${string}`,
      PAY_PER_VIEW: '0xC042014fAC0Dd156c17b22e06fF964Eb2890A496' as `0x${string}`,
      SUBSCRIPTION_MANAGER: '0x996A1c47d3Aef5ACb5DE5Ef983c78feF56a1aBF5' as `0x${string}`,
      COMMERCE_INTEGRATION: '0x7cF35C5426A98304bA073D6b625BDFF01Cd5C715' as `0x${string}`,
      PRICE_ORACLE: '0x521f25C63FCCD2ff3c30d8B0F73291457d34c476' as `0x${string}`,
      COMMERCE_PROTOCOL: '0x96A08D8e8631b6dB52Ea0cbd7232d9A85d239147' as `0x${string}`,
      USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`,
    },
} as const
  
  // Helper function to get contract addresses for the current network
  // This prevents errors when switching between mainnet and testnet
export function getContractAddresses(chainId: number) {
    const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]
    if (!addresses) {
      throw new Error(`Unsupported chain ID: ${chainId}`)
    }
    return addresses
}

export const ZORA_ADDRESSES = {
  // Base Mainnet (8453) - Production addresses
  8453: {
    // Core Contracts
    ZORA_CREATOR_1155_FACTORY_IMPL: '0x777777E8850d8D6d98De2d777C5c3c7d45261788' as const,
    ZORA_CREATOR_1155_IMPL: '0x777777C338d93e2C7adf08D102d45CA7CC4Ed021' as const,
    
    // Minter Contracts
    FIXED_PRICE_SALE_STRATEGY: '0x7c74dfe39976dc395529c14e54a597809980e01c' as const,
    MERKLE_MINT_SALE_STRATEGY: '0xf48172ca3b6068b20eeb8abbbbaa5c2252c0e800' as const,
    
    // Rewards & Protocol
    PROTOCOL_REWARDS: '0x7777777F279eba3d3Ad8F4E708545291A6fDBA8B' as const,
    
    // Premint Contracts
    ZORA_CREATOR_1155_PREMINT_EXECUTOR: '0x7777773606e7e46C8Ba8B98C08f5cD218F335941' as const,
  },
  
  // Base Sepolia (84532) - Testnet addresses (same as mainnet for now, but properly separated)
  84532: {
    // Core Contracts
    ZORA_CREATOR_1155_FACTORY_IMPL: '0x777777E8850d8D6d98De2d777C5c3c7d45261788' as const,
    ZORA_CREATOR_1155_IMPL: '0x777777C338d93e2C7adf08D102d45CA7CC4Ed021' as const,
    
    // Minter Contracts
    FIXED_PRICE_SALE_STRATEGY: '0x7c74dfe39976dc395529c14e54a597809980e01c' as const,
    MERKLE_MINT_SALE_STRATEGY: '0xf48172ca3b6068b20eeb8abbbbaa5c2252c0e800' as const,
    
    // Rewards & Protocol
    PROTOCOL_REWARDS: '0x7777777F279eba3d3Ad8F4E708545291A6fDBA8B' as const,
    
    // Premint Contracts
    ZORA_CREATOR_1155_PREMINT_EXECUTOR: '0x7777773606e7e46C8Ba8B98C08f5cD218F335941' as const,
  }
} as const