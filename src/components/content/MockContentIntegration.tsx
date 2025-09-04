/**
 * Mock Content Integration Component
 * 
 * This component provides a seamless way to use mock content data
 * in place of real contract data during development, ensuring that
 * the UI can be fully tested with realistic content.
 */

'use client'

import React from 'react'
import { getMockContentById } from '@/lib/mock-content-seeder'
import { useContentById } from '@/hooks/contracts/core'
import type { Content } from '@/types/contracts'

interface MockContentProviderProps {
  contentId: bigint
  children: (data: {
    content: Content | undefined
    isLoading: boolean
    error: Error | null
    isMockData: boolean
  }) => React.ReactNode
}

/**
 * Mock Content Provider Component
 * 
 * This component checks if real contract data is available, and if not,
 * provides mock data instead. This allows the UI to function during development
 * even when the contract might not have any content deployed.
 */
export function MockContentProvider({ contentId, children }: MockContentProviderProps) {
  // Try to fetch real contract data first
  const contractQuery = useContentById(contentId)
  
  // Check if we should use mock data
  const shouldUseMockData = contractQuery.error || !contractQuery.data
  
  // Get mock content if needed
  const mockContent = shouldUseMockData ? getMockContentById(contentId) : null
  
  // Convert mock content to contract Content format
  const content: Content | undefined = mockContent ? {
    creator: mockContent.creator,
    ipfsHash: mockContent.ipfsHash,
    title: mockContent.title,
    description: mockContent.description,
    category: mockContent.category,
    payPerViewPrice: mockContent.payPerViewPrice,
    creationTime: mockContent.creationTime,
    isActive: mockContent.isActive
  } : contractQuery.data
  
  return (
    <>
      {children({
        content,
        isLoading: shouldUseMockData ? false : contractQuery.isLoading,
        error: shouldUseMockData ? null : contractQuery.error,
        isMockData: shouldUseMockData && mockContent !== undefined
      })}
    </>
  )
}

/**
 * Hook for seamless mock/real content integration
 */
export function useContentWithMockFallback(contentId: bigint | undefined) {
  const contractQuery = useContentById(contentId)
  
  // Check if we should use mock data
  const shouldUseMockData = (contractQuery.error || !contractQuery.data) && contentId !== undefined
  
  // Get mock content if needed
  const mockContent = shouldUseMockData && contentId ? getMockContentById(contentId) : null
  
  // Convert mock content to contract Content format
  const content: Content | undefined = mockContent ? {
    creator: mockContent.creator,
    ipfsHash: mockContent.ipfsHash,
    title: mockContent.title,
    description: mockContent.description,
    category: mockContent.category,
    payPerViewPrice: mockContent.payPerViewPrice,
    creationTime: mockContent.creationTime,
    isActive: mockContent.isActive
  } : contractQuery.data
  
  return {
    data: content,
    isLoading: shouldUseMockData ? false : contractQuery.isLoading,
    error: shouldUseMockData ? null : contractQuery.error,
    isSuccess: shouldUseMockData ? mockContent !== undefined : contractQuery.isSuccess,
    isMockData: shouldUseMockData && mockContent !== undefined,
    refetch: contractQuery.refetch
  }
}
