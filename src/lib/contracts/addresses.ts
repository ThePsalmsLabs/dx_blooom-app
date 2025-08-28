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

