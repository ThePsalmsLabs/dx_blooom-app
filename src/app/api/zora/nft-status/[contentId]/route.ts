// src/app/api/zora/nft-status/[contentId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSharedPublicClient } from '@/lib/web3/client'
import { base, baseSepolia } from 'viem/chains'
import { getContractConfig } from '@/lib/contracts/config'
import { ZoraDatabaseService } from '@/services/zora/ZoraDatabaseService'
import type { NFTStatusResponse } from '@/types/zora'

export async function GET(
  request: NextRequest,
  { params }: { params: { contentId: string } }
) {
  try {
    const contentId = BigInt(params.contentId)
    const searchParams = request.nextUrl.searchParams
    const creatorAddress = searchParams.get('creatorAddress') as `0x${string}`
    const chainId = parseInt(searchParams.get('chainId') || '8453')

    if (!creatorAddress) {
      return NextResponse.json(
        { error: 'Creator address is required' },
        { status: 400 }
      )
    }

    // Initialize database service
    const dbService = new ZoraDatabaseService()

    // Check if content is minted as NFT
    const isMinted = await dbService.isContentMintedAsNFT(contentId)
    
    if (!isMinted) {
      return NextResponse.json<NFTStatusResponse>({
        success: true,
        data: {
          isMinted: false
        }
      })
    }

    // Get NFT record and analytics
    const nftRecord = await dbService.getContentNFTRecord(contentId)
    
    if (!nftRecord) {
      return NextResponse.json<NFTStatusResponse>({
        success: true,
        data: {
          isMinted: false
        }
      })
    }

    // Get performance comparison
    const performanceComparison = await dbService.getPerformanceComparison(contentId)

    return NextResponse.json<NFTStatusResponse>({
      success: true,
      data: {
        isMinted: true,
        nftRecord,
        analytics: performanceComparison ? {
          totalMints: performanceComparison.nftMetrics.mints,
          totalVolume: performanceComparison.nftMetrics.nftRevenue,
          averagePrice: performanceComparison.nftMetrics.averageMintPrice,
          uniqueMinters: 0, // Would come from on-chain data
          mintsLast24h: BigInt(0),
          volumeLast24h: BigInt(0),
          mintsLast7d: BigInt(0),
          volumeLast7d: BigInt(0),
          mintsLast30d: BigInt(0),
          volumeLast30d: BigInt(0),
          mintTrend: 'stable',
          volumeTrend: 'stable',
          conversionRate: 0,
          socialShares: 0,
          socialEngagement: 0,
          discoverySource: 'direct_link'
        } : undefined
      }
    })

  } catch (error) {
    console.error('Error checking NFT status:', error)
    return NextResponse.json<NFTStatusResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check NFT status'
      },
      { status: 500 }
    )
  }
}
