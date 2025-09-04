/**
 * Mock Content Seeder for Development
 * 
 * This utility helps populate the browse page with realistic content data
 * for development and testing purposes. It creates mock content that follows
 * the same structure as real contract data.
 */

import { ContentCategory } from '@/types/contracts'
import type { Address } from 'viem'

export interface MockContent {
  id: bigint
  creator: Address
  title: string
  description: string
  category: ContentCategory
  payPerViewPrice: bigint
  creationTime: bigint
  isActive: boolean
  ipfsHash: string
  thumbnail?: string
  duration?: number
  tags: string[]
}

/**
 * Generate realistic mock content for each category
 */
export const generateMockContent = (): MockContent[] => {
  const baseTime = BigInt(Math.floor(Date.now() / 1000))
  const creators: Address[] = [
    '0x1234567890123456789012345678901234567890',
    '0x2345678901234567890123456789012345678901',
    '0x3456789012345678901234567890123456789012',
    '0x4567890123456789012345678901234567890123',
    '0x5678901234567890123456789012345678901234'
  ]

  const mockContentData: Omit<MockContent, 'id'>[] = [
    // VIDEO CONTENT
    {
      creator: creators[0],
      title: 'Building DeFi Applications with Solidity',
      description: 'A comprehensive tutorial on creating decentralized finance applications using Solidity smart contracts.',
      category: ContentCategory.VIDEO,
      payPerViewPrice: BigInt(5 * 10**6), // 5 USDC
      creationTime: baseTime - BigInt(3600),
      isActive: true,
      ipfsHash: 'QmVideo1234567890abcdef',
      thumbnail: '/api/placeholder/400/225',
      duration: 3600, // 1 hour
      tags: ['defi', 'solidity', 'tutorial', 'blockchain']
    },
    {
      creator: creators[1],
      title: 'NFT Marketplace Demo',
      description: 'Watch how to build a complete NFT marketplace from scratch using React and Web3.',
      category: ContentCategory.VIDEO,
      payPerViewPrice: BigInt(3 * 10**6), // 3 USDC
      creationTime: baseTime - BigInt(7200),
      isActive: true,
      ipfsHash: 'QmVideo2345678901bcdefg',
      duration: 2400, // 40 minutes
      tags: ['nft', 'marketplace', 'react', 'web3']
    },
    {
      creator: creators[2],
      title: 'Crypto Trading Strategies 2024',
      description: 'Learn advanced cryptocurrency trading strategies that actually work in volatile markets.',
      category: ContentCategory.VIDEO,
      payPerViewPrice: BigInt(10 * 10**6), // 10 USDC
      creationTime: baseTime - BigInt(1800),
      isActive: true,
      ipfsHash: 'QmVideo3456789012cdefgh',
      duration: 5400, // 1.5 hours
      tags: ['trading', 'crypto', 'strategy', 'finance']
    },

    // AUDIO CONTENT
    {
      creator: creators[0],
      title: 'Web3 Podcast: The Future of Decentralization',
      description: 'An in-depth discussion about the future of Web3 and decentralized technologies.',
      category: ContentCategory.AUDIO,
      payPerViewPrice: BigInt(2 * 10**6), // 2 USDC
      creationTime: baseTime - BigInt(10800),
      isActive: true,
      ipfsHash: 'QmAudio1234567890abcdef',
      duration: 2700, // 45 minutes
      tags: ['podcast', 'web3', 'decentralization', 'technology']
    },
    {
      creator: creators[3],
      title: 'Blockchain Beats: Crypto Music Collection',
      description: 'Original music inspired by blockchain technology and the crypto revolution.',
      category: ContentCategory.AUDIO,
      payPerViewPrice: BigInt(1 * 10**6), // 1 USDC
      creationTime: baseTime - BigInt(14400),
      isActive: true,
      ipfsHash: 'QmAudio2345678901bcdefg',
      duration: 180, // 3 minutes
      tags: ['music', 'crypto', 'original', 'electronic']
    },

    // ARTICLE CONTENT
    {
      creator: creators[1],
      title: 'The Complete Guide to DeFi Yield Farming',
      description: 'Everything you need to know about yield farming in DeFi protocols. Risks, rewards, and strategies.',
      category: ContentCategory.ARTICLE,
      payPerViewPrice: BigInt(4 * 10**6), // 4 USDC
      creationTime: baseTime - BigInt(5400),
      isActive: true,
      ipfsHash: 'QmArticle1234567890abcdef',
      tags: ['defi', 'yield-farming', 'guide', 'finance']
    },
    {
      creator: creators[2],
      title: 'Smart Contract Security Best Practices',
      description: 'Learn how to write secure smart contracts and avoid common vulnerabilities that lead to exploits.',
      category: ContentCategory.ARTICLE,
      payPerViewPrice: BigInt(6 * 10**6), // 6 USDC
      creationTime: baseTime - BigInt(9000),
      isActive: true,
      ipfsHash: 'QmArticle2345678901bcdefg',
      tags: ['security', 'smart-contracts', 'solidity', 'best-practices']
    },

    // IMAGE CONTENT
    {
      creator: creators[4],
      title: 'Digital Art: Crypto Landscapes',
      description: 'A stunning collection of digital art pieces inspired by cryptocurrency and blockchain themes.',
      category: ContentCategory.IMAGE,
      payPerViewPrice: BigInt(2 * 10**6), // 2 USDC
      creationTime: baseTime - BigInt(12600),
      isActive: true,
      ipfsHash: 'QmImage1234567890abcdef',
      tags: ['digital-art', 'crypto', 'landscape', 'nft']
    },
    {
      creator: creators[3],
      title: 'Infographic: How DeFi Works',
      description: 'Visual explanation of how decentralized finance protocols work and interact with each other.',
      category: ContentCategory.IMAGE,
      payPerViewPrice: BigInt(1 * 10**6), // 1 USDC
      creationTime: baseTime - BigInt(16200),
      isActive: true,
      ipfsHash: 'QmImage2345678901bcdefg',
      tags: ['infographic', 'defi', 'education', 'visual']
    },

    // DOCUMENT CONTENT
    {
      creator: creators[1],
      title: 'Ethereum Smart Contract Audit Report',
      description: 'Professional security audit report for a DeFi protocol with detailed findings and recommendations.',
      category: ContentCategory.DOCUMENT,
      payPerViewPrice: BigInt(15 * 10**6), // 15 USDC
      creationTime: baseTime - BigInt(7800),
      isActive: true,
      ipfsHash: 'QmDocument1234567890abcdef',
      tags: ['audit', 'security', 'ethereum', 'report']
    },
    {
      creator: creators[0],
      title: 'Web3 Business Model Canvas',
      description: 'A comprehensive business model template specifically designed for Web3 and blockchain startups.',
      category: ContentCategory.DOCUMENT,
      payPerViewPrice: BigInt(8 * 10**6), // 8 USDC
      creationTime: baseTime - BigInt(11400),
      isActive: true,
      ipfsHash: 'QmDocument2345678901bcdefg',
      tags: ['business', 'web3', 'startup', 'template']
    },

    // COURSE CONTENT
    {
      creator: creators[2],
      title: 'Complete Solidity Development Course',
      description: 'Master Solidity programming from beginner to advanced. Includes 50+ hours of video content and exercises.',
      category: ContentCategory.COURSE,
      payPerViewPrice: BigInt(50 * 10**6), // 50 USDC
      creationTime: baseTime - BigInt(4200),
      isActive: true,
      ipfsHash: 'QmCourse1234567890abcdef',
      duration: 180000, // 50 hours
      tags: ['course', 'solidity', 'programming', 'blockchain']
    },
    {
      creator: creators[4],
      title: 'DeFi Protocol Analysis Masterclass',
      description: 'Learn how to analyze and evaluate DeFi protocols for investment and development opportunities.',
      category: ContentCategory.COURSE,
      payPerViewPrice: BigInt(75 * 10**6), // 75 USDC
      creationTime: baseTime - BigInt(1200),
      isActive: true,
      ipfsHash: 'QmCourse2345678901bcdefg',
      duration: 144000, // 40 hours
      tags: ['course', 'defi', 'analysis', 'investment']
    },

    // DATA CONTENT
    {
      creator: creators[3],
      title: 'Ethereum Transaction Dataset Q4 2024',
      description: 'Comprehensive dataset of Ethereum transactions with gas analysis and pattern recognition data.',
      category: ContentCategory.DATA,
      payPerViewPrice: BigInt(20 * 10**6), // 20 USDC
      creationTime: baseTime - BigInt(6000),
      isActive: true,
      ipfsHash: 'QmData1234567890abcdef',
      tags: ['dataset', 'ethereum', 'transactions', 'analytics']
    },
    {
      creator: creators[1],
      title: 'DeFi TVL Historical Data 2020-2024',
      description: 'Four years of Total Value Locked data across major DeFi protocols with trend analysis.',
      category: ContentCategory.DATA,
      payPerViewPrice: BigInt(25 * 10**6), // 25 USDC
      creationTime: baseTime - BigInt(8400),
      isActive: true,
      ipfsHash: 'QmData2345678901bcdefg',
      tags: ['dataset', 'defi', 'tvl', 'historical']
    }
  ]

  // Convert to full MockContent with IDs
  return mockContentData.map((content, index) => ({
    id: BigInt(index + 1),
    ...content
  }))
}

/**
 * Get mock content filtered by category
 */
export const getMockContentByCategory = (category: ContentCategory): MockContent[] => {
  return generateMockContent().filter(content => content.category === category)
}

/**
 * Get mock content count by category
 */
export const getMockContentCountByCategory = (): Record<ContentCategory | 'all', number> => {
  const allContent = generateMockContent()
  const counts = {
    all: allContent.length,
    [ContentCategory.ARTICLE]: 0,
    [ContentCategory.VIDEO]: 0,
    [ContentCategory.AUDIO]: 0,
    [ContentCategory.IMAGE]: 0,
    [ContentCategory.DOCUMENT]: 0,
    [ContentCategory.COURSE]: 0,
    [ContentCategory.SOFTWARE]: 0,
    [ContentCategory.DATA]: 0
  }

  allContent.forEach(content => {
    counts[content.category]++
  })

  return counts
}

/**
 * Search mock content by title or description
 */
export const searchMockContent = (query: string): MockContent[] => {
  const allContent = generateMockContent()
  const lowercaseQuery = query.toLowerCase()
  
  return allContent.filter(content => 
    content.title.toLowerCase().includes(lowercaseQuery) ||
    content.description.toLowerCase().includes(lowercaseQuery) ||
    content.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  )
}

/**
 * Get mock content IDs (for compatibility with existing hooks)
 */
export const getMockContentIds = (): bigint[] => {
  return generateMockContent().map(content => content.id)
}

/**
 * Get mock content by ID
 */
export const getMockContentById = (id: bigint): MockContent | undefined => {
  return generateMockContent().find(content => content.id === id)
}
