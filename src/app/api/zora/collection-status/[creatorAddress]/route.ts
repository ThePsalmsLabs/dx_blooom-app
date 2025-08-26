// src/app/api/zora/collection-status/[creatorAddress]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ZoraDatabaseService } from '@/services/zora/ZoraDatabaseService'
import type { CollectionStatusResponse } from '@/types/zora'

export async function GET(
  request: NextRequest,
  { params }: { params: { creatorAddress: string } }
) {
  try {
    const creatorAddress = params.creatorAddress as `0x${string}`
    const searchParams = request.nextUrl.searchParams
    const chainId = parseInt(searchParams.get('chainId') || '8453')

    if (!creatorAddress || !creatorAddress.startsWith('0x')) {
      return NextResponse.json(
        { error: 'Valid creator address is required' },
        { status: 400 }
      )
    }

    // Initialize database service
    const dbService = new ZoraDatabaseService()

    // Check if creator has a Zora collection
    const hasCollection = await dbService.hasCreatorCollection(creatorAddress)
    
    if (!hasCollection) {
      return NextResponse.json<CollectionStatusResponse>({
        success: true,
        data: {
          hasCollection: false
        }
      })
    }

    // Get collection record
    const collectionRecord = await dbService.getCreatorCollection(creatorAddress)
    
    if (!collectionRecord) {
      return NextResponse.json<CollectionStatusResponse>({
        success: true,
        data: {
          hasCollection: false
        }
      })
    }

    return NextResponse.json<CollectionStatusResponse>({
      success: true,
      data: {
        hasCollection: true,
        collectionRecord
      }
    })

  } catch (error) {
    console.error('Error checking collection status:', error)
    return NextResponse.json<CollectionStatusResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check collection status'
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { creatorAddress: string } }
) {
  try {
    const creatorAddress = params.creatorAddress as `0x${string}`
    const body = await request.json()
    
    const {
      collectionAddress,
      collectionName,
      collectionDescription,
      collectionURI,
      royaltyBPS,
      defaultMintPrice,
      maxSupply
    } = body

    if (!creatorAddress || !creatorAddress.startsWith('0x')) {
      return NextResponse.json(
        { error: 'Valid creator address is required' },
        { status: 400 }
      )
    }

    if (!collectionAddress || !collectionAddress.startsWith('0x')) {
      return NextResponse.json(
        { error: 'Valid collection address is required' },
        { status: 400 }
      )
    }

    // Initialize database service
    const dbService = new ZoraDatabaseService()

    // Create collection record
    const collectionRecord = {
      creatorAddress,
      creatorProfile: {
        isRegistered: true,
        subscriptionPrice: BigInt(0),
        isVerified: false,
        totalEarnings: BigInt(0),
        contentCount: BigInt(0),
        subscriberCount: BigInt(0),
        registrationTime: BigInt(0)
      },
      hasZoraCollection: true,
      zoraCollectionAddress: collectionAddress,
      zoraCollectionName: collectionName || 'Creator Collection',
      zoraCollectionDescription: collectionDescription || '',
      zoraCollectionURI: collectionURI || '',
      royaltyBPS: royaltyBPS || 500,
      defaultMintPrice: defaultMintPrice ? BigInt(defaultMintPrice) : BigInt(0),
      maxSupply: maxSupply || 1000,
      totalNFTsMinted: 0,
      totalCollectionVolume: BigInt(0),
      totalMints: BigInt(0),
      averageMintPrice: BigInt(0),
      collectionStatus: 'active' as const,
      lastUpdated: new Date()
    }

    await dbService.storeCreatorCollection(collectionRecord)

    return NextResponse.json<CollectionStatusResponse>({
      success: true,
      data: {
        hasCollection: true,
        collectionRecord
      }
    })

  } catch (error) {
    console.error('Error creating collection record:', error)
    return NextResponse.json<CollectionStatusResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create collection record'
      },
      { status: 500 }
    )
  }
}
