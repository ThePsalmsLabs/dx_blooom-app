import { useReadContract } from 'wagmi'
import { type Address } from 'viem'
import { ZORA_CREATOR_1155_IMPL_ABI } from '@/lib/contracts/abis/zora'

interface ZoraTokenInfo {
  uri: string
  maxSupply: bigint
  totalMinted: bigint
}

interface UseZoraTokenInfoResult {
  data: ZoraTokenInfo | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

export function useZoraTokenInfo(
  contractAddress: Address | undefined,
  tokenId: bigint | undefined
): UseZoraTokenInfoResult {
  
  const result = useReadContract({
    address: contractAddress,
    abi: ZORA_CREATOR_1155_IMPL_ABI,
    functionName: 'getTokenInfo',
    args: tokenId !== undefined ? [tokenId] : undefined,
  })

  return {
    data: result.data ? {
      uri: result.data.uri,
      maxSupply: result.data.maxSupply,
      totalMinted: result.data.totalMinted
    } : undefined,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch
  }
}