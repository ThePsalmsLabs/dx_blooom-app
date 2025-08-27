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

    // Get performance comparison with real analytics
    const performanceComparison = await dbService.getPerformanceComparison(contentId)

    return NextResponse.json<NFTStatusResponse>({
      success: true,
      data: {
        isMinted: true,
        nftRecord,
        analytics: performanceComparison ? {
          // NFT Metrics
          totalMints: performanceComparison.nftMetrics.mints,
          totalVolume: performanceComparison.nftMetrics.nftRevenue,
          averagePrice: performanceComparison.nftMetrics.averageMintPrice,
          uniqueMinters: 0, // TODO: Query from on-chain data
          
          // Subscription Metrics
          totalSubscribers: performanceComparison.subscriptionMetrics.subscribers,
          subscriptionRevenue: performanceComparison.subscriptionMetrics.subscriptionRevenue,
          averageSubscriptionPrice: performanceComparison.subscriptionMetrics.averageSubscriptionPrice,
          
          // Combined Metrics
          totalRevenue: performanceComparison.combinedMetrics.totalRevenue,
          totalEngagement: performanceComparison.combinedMetrics.totalEngagement,
          revenuePerUser: performanceComparison.combinedMetrics.revenuePerUser,
          
          // Historical Data (TODO: Implement)
          mintsLast24h: BigInt(0), // TODO: Calculate from mint timestamps
          volumeLast24h: BigInt(0), // TODO: Calculate from mint timestamps
          mintsLast7d: BigInt(0), // TODO: Calculate from mint timestamps
          volumeLast7d: BigInt(0), // TODO: Calculate from mint timestamps
          mintsLast30d: BigInt(0), // TODO: Calculate from mint timestamps
          volumeLast30d: BigInt(0), // TODO: Calculate from mint timestamps
          mintTrend: 'stable', // TODO: Calculate trend from historical data
          volumeTrend: 'stable', // TODO: Calculate trend from historical data
          
          // Social Metrics (TODO: Implement)
          conversionRate: 0, // TODO: Calculate from views vs mints
          socialShares: 0, // TODO: Query from social platforms
          socialEngagement: 0, // TODO: Query from social platforms
          discoverySource: 'direct_link' // TODO: Track discovery sources
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
