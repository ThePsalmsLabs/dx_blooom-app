/**
 * Graph Integration for Creators Directory
 * 
 * This file prepares for future integration with The Graph subgraph
 * to provide more efficient creator data fetching.
 */

import type { Address } from 'viem'
import type { Creator } from '@/types/contracts'

// GraphQL query for fetching creators
export const CREATORS_QUERY = `
  query GetCreators($first: Int!, $skip: Int!, $orderBy: String!, $orderDirection: String!) {
    creators(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      isRegistered
      subscriptionPrice
      isVerified
      totalEarnings
      contentCount
      subscriberCount
      registrationTime
    }
  }
`

// GraphQL query for fetching creator profiles
export const CREATOR_PROFILE_QUERY = `
  query GetCreatorProfile($id: ID!) {
    creator(id: $id) {
      id
      isRegistered
      subscriptionPrice
      isVerified
      totalEarnings
      contentCount
      subscriberCount
      registrationTime
    }
  }
`

// GraphQL query for verified creators
export const VERIFIED_CREATORS_QUERY = `
  query GetVerifiedCreators($first: Int!) {
    creators(
      first: $first
      where: { isVerified: true }
      orderBy: totalEarnings
      orderDirection: desc
    ) {
      id
      isRegistered
      subscriptionPrice
      isVerified
      totalEarnings
      contentCount
      subscriberCount
      registrationTime
    }
  }
`

// GraphQL query for top creators by earnings
export const TOP_CREATORS_QUERY = `
  query GetTopCreators($first: Int!) {
    creators(
      first: $first
      orderBy: totalEarnings
      orderDirection: desc
    ) {
      id
      isRegistered
      subscriptionPrice
      isVerified
      totalEarnings
      contentCount
      subscriberCount
      registrationTime
    }
  }
`

// GraphQL query for creators by subscription price range
export const CREATORS_BY_PRICE_QUERY = `
  query GetCreatorsByPrice($minPrice: BigInt!, $maxPrice: BigInt!, $first: Int!) {
    creators(
      first: $first
      where: {
        subscriptionPrice_gte: $minPrice
        subscriptionPrice_lte: $maxPrice
      }
      orderBy: subscriptionPrice
      orderDirection: asc
    ) {
      id
      isRegistered
      subscriptionPrice
      isVerified
      totalEarnings
      contentCount
      subscriberCount
      registrationTime
    }
  }
`

// GraphQL query for creators by content count
export const CREATORS_BY_CONTENT_QUERY = `
  query GetCreatorsByContent($minContent: Int!, $first: Int!) {
    creators(
      first: $first
      where: { contentCount_gte: $minContent }
      orderBy: contentCount
      orderDirection: desc
    ) {
      id
      isRegistered
      subscriptionPrice
      isVerified
      totalEarnings
      contentCount
      subscriberCount
      registrationTime
    }
  }
`

// GraphQL query for creators by subscriber count
export const CREATORS_BY_SUBSCRIBERS_QUERY = `
  query GetCreatorsBySubscribers($minSubscribers: Int!, $first: Int!) {
    creators(
      first: $first
      where: { subscriberCount_gte: $minSubscribers }
      orderBy: subscriberCount
      orderDirection: desc
    ) {
      id
      isRegistered
      subscriptionPrice
      isVerified
      totalEarnings
      contentCount
      subscriberCount
      registrationTime
    }
  }
`

// GraphQL query for creators by registration date
export const CREATORS_BY_DATE_QUERY = `
  query GetCreatorsByDate($fromDate: BigInt!, $first: Int!) {
    creators(
      first: $first
      where: { registrationTime_gte: $fromDate }
      orderBy: registrationTime
      orderDirection: desc
    ) {
      id
      isRegistered
      subscriptionPrice
      isVerified
      totalEarnings
      contentCount
      subscriberCount
      registrationTime
    }
  }
`

// GraphQL query for search creators by address
export const SEARCH_CREATORS_QUERY = `
  query SearchCreators($searchTerm: String!, $first: Int!) {
    creators(
      first: $first
      where: { id_contains_nocase: $searchTerm }
      orderBy: totalEarnings
      orderDirection: desc
    ) {
      id
      isRegistered
      subscriptionPrice
      isVerified
      totalEarnings
      contentCount
      subscriberCount
      registrationTime
    }
  }
`

// GraphQL query for creator statistics
export const CREATOR_STATS_QUERY = `
  query GetCreatorStats {
    creatorStats(id: "global") {
      totalCreators
      totalVerifiedCreators
      totalEarnings
      totalContent
      totalSubscribers
    }
  }
`

// Types for GraphQL responses
export interface GraphCreator {
  id: Address
  isRegistered: boolean
  subscriptionPrice: string
  isVerified: boolean
  totalEarnings: string
  contentCount: string
  subscriberCount: string
  registrationTime: string
}

export interface CreatorStats {
  totalCreators: string
  totalVerifiedCreators: string
  totalEarnings: string
  totalContent: string
  totalSubscribers: string
}

// Helper function to convert GraphQL data to Creator type
export function graphCreatorToCreator(graphCreator: GraphCreator): Creator {
  return {
    isRegistered: graphCreator.isRegistered,
    subscriptionPrice: BigInt(graphCreator.subscriptionPrice),
    isVerified: graphCreator.isVerified,
    totalEarnings: BigInt(graphCreator.totalEarnings),
    contentCount: BigInt(graphCreator.contentCount),
    subscriberCount: BigInt(graphCreator.subscriberCount),
    registrationTime: BigInt(graphCreator.registrationTime),
  }
}

// Helper function to convert GraphQL data to CreatorListEntry type
export function graphCreatorToCreatorListEntry(graphCreator: GraphCreator) {
  return {
    address: graphCreator.id,
    profile: graphCreatorToCreator(graphCreator),
    isLoading: false,
    error: null,
  }
}

// Configuration for different networks
export const GRAPH_ENDPOINTS = {
  // Base Mainnet
  8453: 'https://api.thegraph.com/subgraphs/name/your-subgraph-name',
  // Base Sepolia
  84532: 'https://api.thegraph.com/subgraphs/name/your-subgraph-name-sepolia',
} as const

// Default query variables
export const DEFAULT_QUERY_VARS = {
  first: 100,
  skip: 0,
  orderBy: 'totalEarnings',
  orderDirection: 'desc',
} as const

// Pagination helper
export function getPaginationVars(page: number, pageSize: number) {
  return {
    first: pageSize,
    skip: page * pageSize,
  }
}

// Sorting helper
export function getSortingVars(sortBy: string, sortOrder: 'asc' | 'desc') {
  let orderBy = 'totalEarnings'
  
  switch (sortBy) {
    case 'newest':
      orderBy = 'registrationTime'
      break
    case 'earnings':
      orderBy = 'totalEarnings'
      break
    case 'subscribers':
      orderBy = 'subscriberCount'
      break
    case 'content':
      orderBy = 'contentCount'
      break
    case 'alphabetical':
      orderBy = 'id'
      break
    default:
      orderBy = 'totalEarnings'
  }
  
  return {
    orderBy,
    orderDirection: sortOrder.toUpperCase(),
  }
}
