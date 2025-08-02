/**
 * Complete Creator Verification System
 * Main Component: CreatorVerificationStatus
 * 
 * This component orchestrates the complete verification experience for creators.
 * It determines which verification state to show based on the creator's current
 * status and eligibility.
 */

'use client'

import React, { useMemo } from 'react'
import { useAccount } from 'wagmi'
import { useCreatorProfile } from '@/hooks/contracts/core'
import { VerifiedCreatorCard } from './VerificationEligibility'
import { VerificationEligibilityCard } from './VerificationEligibility'
import { VerificationApplicationCard } from './VerificationApplication'

/**
 * Verification Requirements Configuration
 * This defines what creators need to provide for verification
 */
export const VERIFICATION_REQUIREMENTS = {
  // Minimum thresholds for automatic qualification
  minContentCount: 3,
  minTotalEarnings: 100, // $100 USDC
  minSubscribers: 10,
  
  // Required documentation
  requiredDocuments: [
    'Profile photo or avatar',
    'Bio with clear description of content',
    'At least 3 published content pieces',
    'Social media profiles (optional but recommended)'
  ],
  
  // Benefits of verification
  verifiedBenefits: [
    'Verification badge on profile and content',
    'Higher visibility in content discovery',
    'Priority customer support',
    'Access to creator analytics',
    'Exclusive verified creator community',
    'Early access to new features'
  ]
} as const

/**
 * Creator Verification Status Component
 * This shows creators their current verification status and next steps
 */
export function CreatorVerificationStatus({ 
  userAddress 
}: { 
  userAddress?: string 
}) {
  const { address } = useAccount()
  const creatorAddress = userAddress || address

  // Get creator data (using your existing hooks)
  const creatorProfile = useCreatorProfile(creatorAddress as `0x${string}`)
  
  // Determine verification eligibility
  const eligibilityCheck = useMemo(() => {
    if (!creatorProfile.data) {
      return { eligible: false, issues: ['Loading creator data...'], score: 0 }
    }

    const issues: string[] = []
    let score = 0

    // Check content count
    if (creatorProfile.data.contentCount < VERIFICATION_REQUIREMENTS.minContentCount) {
      issues.push(`Need ${VERIFICATION_REQUIREMENTS.minContentCount - Number(creatorProfile.data.contentCount)} more content pieces`)
    } else {
      score += 25
    }

    // Check earnings
    if (creatorProfile.data.totalEarnings < BigInt(VERIFICATION_REQUIREMENTS.minTotalEarnings * 1000000)) { // Convert to USDC decimals
      const needed = VERIFICATION_REQUIREMENTS.minTotalEarnings - Number(creatorProfile.data.totalEarnings) / 1000000
      issues.push(`Need $${needed} more in total earnings`)
    } else {
      score += 25
    }

    // Check subscriber count
    if (creatorProfile.data.subscriberCount < VERIFICATION_REQUIREMENTS.minSubscribers) {
      const needed = VERIFICATION_REQUIREMENTS.minSubscribers - Number(creatorProfile.data.subscriberCount)
      issues.push(`Need ${needed} more subscribers`)
    } else {
      score += 25
    }

    // Check profile completeness (placeholder - would need additional profile data)
    // For now, we'll assume profile is complete if they have earnings
    if (creatorProfile.data.totalEarnings === BigInt(0)) {
      issues.push('Start earning to build your creator profile')
    } else {
      score += 25
    }

    return {
      eligible: issues.length === 0,
      issues,
      score
    }
  }, [creatorProfile.data])

  // Show different UI based on verification status
  if (creatorProfile.data?.isVerified) {
    return <VerifiedCreatorCard creatorProfile={creatorProfile.data} />
  }

  if (!eligibilityCheck.eligible) {
    return <VerificationEligibilityCard eligibilityCheck={eligibilityCheck} />
  }

  return <VerificationApplicationCard creatorAddress={creatorAddress} />
} 