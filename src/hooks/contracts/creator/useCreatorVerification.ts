/**
 * Creator Verification Hook - Verification Workflow Management
 * File: src/hooks/contracts/creator/useCreatorVerification.ts
 * 
 * This hook manages the complete creator verification workflow, providing functions
 * to check verification status, submit verification applications, and track the
 * verification process. It integrates with your existing contract architecture
 * while handling the off-chain verification application process.
 * 
 * The verification workflow follows this pattern:
 * 1. Creator checks eligibility and current verification status
 * 2. Creator submits verification application with required documentation
 * 3. Application is stored off-chain (IPFS) and tracked on-chain
 * 4. Platform administrators review and approve/deny applications
 * 5. Verification status is updated via the setCreatorVerification contract function
 * 
 * This hook provides the creator-facing functionality while respecting the
 * administrative nature of the actual verification approval process.
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { type Address } from 'viem'
import { useQueryClient } from '@tanstack/react-query'

// Import contract configuration and ABIs
import { getCreatorRegistryContract } from '@/lib/contracts/config'

// Import existing hooks for data access
import { useCreatorProfile } from '@/hooks/contracts/core'

// Import types and utilities

// ===== VERIFICATION DATA INTERFACES =====

/**
 * Verification Application Data
 * This interface defines the data structure for verification applications
 */
export interface VerificationData {
  readonly creatorAddress: Address
  readonly displayName: string
  readonly bio: string
  readonly websiteUrl?: string
  readonly socialLinks: {
    readonly twitter?: string
    readonly instagram?: string
    readonly youtube?: string
    readonly linkedin?: string
    readonly discord?: string
  }
  readonly contentExamples: readonly string[] // IPFS hashes of sample content
  readonly identityVerification: {
    readonly type: 'social_media' | 'website' | 'legal_document' | 'other'
    readonly proof: string // URL or IPFS hash of verification proof
    readonly description: string
  }
  readonly applicationDate: Date
  readonly additionalNotes?: string
}

/**
 * Verification Eligibility Check Result
 * This interface defines the eligibility criteria for verification
 */
export interface VerificationEligibility {
  readonly isEligible: boolean
  readonly meetsContentRequirement: boolean // At least 3 pieces of content
  readonly meetsEarningsRequirement: boolean // At least $100 total earnings
  readonly meetsSubscriberRequirement: boolean // At least 10 subscribers
  readonly hasCompleteProfile: boolean // Profile data is filled out
  readonly requirements: {
    readonly minContentCount: number
    readonly minEarnings: bigint // In USDC (6 decimals)
    readonly minSubscribers: number
    readonly currentContentCount: number
    readonly currentEarnings: bigint
    readonly currentSubscribers: number
  }
  readonly missingRequirements: readonly string[]
}

/**
 * Verification Application Status
 * This tracks the status of a verification application
 */
export interface VerificationApplicationStatus {
  readonly status: 'none' | 'draft' | 'submitted' | 'under_review' | 'approved' | 'denied'
  readonly applicationId?: string
  readonly submittedAt?: Date
  readonly reviewedAt?: Date
  readonly reviewNotes?: string
  readonly ipfsHash?: string // Where application data is stored
}

// ===== VERIFICATION HOOK IMPLEMENTATION =====

/**
 * Creator Verification Hook
 * 
 * This hook provides comprehensive verification functionality for creators,
 * handling eligibility checks, application submission, and status tracking.
 */
export function useCreatorVerification(creatorAddress?: Address) {
  const { address: connectedAddress } = useAccount()
  const chainId = useChainId()
  const queryClient = useQueryClient()

  // Use the provided address or fall back to connected address
  const targetAddress = creatorAddress || connectedAddress

  // Get creator profile data for verification checks
  const { 
    data: creatorProfile, 
    isLoading: isLoadingProfile, 
    error: profileError,
    refetch: refetchProfile 
  } = useCreatorProfile(targetAddress)

  // Local state for verification application
  const [applicationData, setApplicationData] = useState<Partial<VerificationData> | null>(null)
  const [applicationStatus, setApplicationStatus] = useState<VerificationApplicationStatus>({
    status: 'none'
  })
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false)
  const [applicationError, setApplicationError] = useState<string | null>(null)

  // Contract configuration
  const contractConfig = useMemo(() => getCreatorRegistryContract(chainId), [chainId])

  // ===== VERIFICATION ELIGIBILITY LOGIC =====

  /**
   * Check if creator meets verification requirements
   * This evaluates content count, earnings, subscribers, and profile completeness
   */
  const verificationEligibility = useMemo<VerificationEligibility>(() => {
    if (!creatorProfile || !creatorProfile.isRegistered) {
      return {
        isEligible: false,
        meetsContentRequirement: false,
        meetsEarningsRequirement: false,
        meetsSubscriberRequirement: false,
        hasCompleteProfile: false,
        requirements: {
          minContentCount: 3,
          minEarnings: BigInt(100 * 1e6), // $100 USDC
          minSubscribers: 10,
          currentContentCount: 0,
          currentEarnings: BigInt(0),
          currentSubscribers: 0
        },
        missingRequirements: ['Creator not registered']
      }
    }

    // Define verification requirements
    const MIN_CONTENT_COUNT = 3
    const MIN_EARNINGS = BigInt(100 * 1e6) // $100 USDC (6 decimals)
    const MIN_SUBSCRIBERS = 10

    // Check each requirement
    const meetsContentRequirement = creatorProfile.contentCount >= MIN_CONTENT_COUNT
    const meetsEarningsRequirement = creatorProfile.totalEarnings >= MIN_EARNINGS
    const meetsSubscriberRequirement = creatorProfile.subscriberCount >= MIN_SUBSCRIBERS
    
    // Basic completeness heuristic (no off-chain profileData available here)
    // Treat profile as "complete" if the creator is registered and has either
    // non-zero subscription price or any content published.
    const hasCompleteProfile = creatorProfile.isRegistered && (
      creatorProfile.subscriptionPrice > BigInt(0) || creatorProfile.contentCount > BigInt(0)
    )

    // Determine overall eligibility
    const isEligible = meetsContentRequirement && 
                      meetsEarningsRequirement && 
                      meetsSubscriberRequirement && 
                      hasCompleteProfile

    // Generate list of missing requirements
    const missingRequirements: string[] = []
    if (!meetsContentRequirement) {
      missingRequirements.push(`Need ${MIN_CONTENT_COUNT - Number(creatorProfile.contentCount)} more pieces of content`)
    }
    if (!meetsEarningsRequirement) {
      const missingEarnings = Number(MIN_EARNINGS - creatorProfile.totalEarnings) / 1e6
      missingRequirements.push(`Need $${missingEarnings.toFixed(2)} more in earnings`)
    }
    if (!meetsSubscriberRequirement) {
      missingRequirements.push(`Need ${MIN_SUBSCRIBERS - Number(creatorProfile.subscriberCount)} more subscribers`)
    }
    if (!hasCompleteProfile) {
      missingRequirements.push('Complete your profile with a detailed bio')
    }
    // No suspension field available on Creator type

    return {
      isEligible,
      meetsContentRequirement,
      meetsEarningsRequirement,
      meetsSubscriberRequirement,
      hasCompleteProfile,
      requirements: {
        minContentCount: MIN_CONTENT_COUNT,
        minEarnings: MIN_EARNINGS,
        minSubscribers: MIN_SUBSCRIBERS,
        currentContentCount: Number(creatorProfile.contentCount),
        currentEarnings: creatorProfile.totalEarnings,
        currentSubscribers: Number(creatorProfile.subscriberCount)
      },
      missingRequirements
    }
  }, [creatorProfile])

  // ===== VERIFICATION APPLICATION FUNCTIONS =====

  /**
   * Initialize a new verification application
   * This creates a draft application with basic creator information
   */
  const initializeApplication = useCallback(() => {
    if (!targetAddress || !creatorProfile) {
      throw new Error('Creator profile required to initialize application')
    }

    const newApplication: Partial<VerificationData> = {
      creatorAddress: targetAddress,
      displayName: '',
      bio: '',
      websiteUrl: '',
      socialLinks: {},
      contentExamples: [],
      identityVerification: {
        type: 'social_media',
        proof: '',
        description: ''
      },
      applicationDate: new Date(),
      additionalNotes: ''
    }

    setApplicationData(newApplication)
    setApplicationStatus({ status: 'draft' })
    setApplicationError(null)
  }, [targetAddress, creatorProfile])

  /**
   * Update application data
   * This allows incremental updates to the verification application
   */
  const updateApplicationData = useCallback((updates: Partial<VerificationData>) => {
    setApplicationData(prev => prev ? { ...prev, ...updates } : null)
  }, [])

  /**
   * Submit verification application
   * This stores the application data on IPFS and creates an on-chain record
   */
  const submitApplication = useCallback(async (): Promise<string | null> => {
    if (!applicationData || !targetAddress) {
      throw new Error('Application data and creator address required')
    }

    if (!verificationEligibility.isEligible) {
      throw new Error('Creator does not meet verification requirements')
    }

    setIsSubmittingApplication(true)
    setApplicationError(null)

    try {
      // Complete the application data
      const completeApplication: VerificationData = {
        ...applicationData,
        creatorAddress: targetAddress,
        applicationDate: new Date()
      } as VerificationData

      // Store application data on IPFS
      // Note: In a real implementation, you would use your IPFS service
      const ipfsResponse = await fetch('/api/ipfs/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'verification_application',
          data: completeApplication
        })
      })

      if (!ipfsResponse.ok) {
        throw new Error('Failed to upload application to IPFS')
      }

      const { ipfsHash } = await ipfsResponse.json()

      // Create application record in platform database
      const applicationResponse = await fetch('/api/verification/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorAddress: targetAddress,
          ipfsHash,
          applicationData: completeApplication
        })
      })

      if (!applicationResponse.ok) {
        throw new Error('Failed to submit verification application')
      }

      const { applicationId } = await applicationResponse.json()

      // Update application status
      setApplicationStatus({
        status: 'submitted',
        applicationId,
        submittedAt: new Date(),
        ipfsHash
      })

      // Clear the draft data
      setApplicationData(null)

      return applicationId

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit application'
      setApplicationError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsSubmittingApplication(false)
    }
  }, [applicationData, targetAddress, verificationEligibility.isEligible])

  /**
   * Check application status
   * This fetches the current status of a verification application
   */
  const checkApplicationStatus = useCallback(async () => {
    if (!targetAddress) return

    try {
      const response = await fetch(`/api/verification/status/${targetAddress}`)
      if (response.ok) {
        const status = await response.json()
        setApplicationStatus(status)
      }
    } catch (error) {
      console.error('Failed to check verification status:', error)
    }
  }, [targetAddress])

  // Check application status on mount and when address changes
  useEffect(() => {
    checkApplicationStatus()
  }, [checkApplicationStatus])

  // ===== VERIFICATION STATUS FUNCTIONS =====

  /**
   * Get current verification status
   * This provides a comprehensive view of the creator's verification state
   */
  const verificationStatus = useMemo(() => {
    if (!creatorProfile) {
      return {
        isVerified: false,
        isEligible: false,
        canApply: false,
        hasActiveApplication: false,
        statusMessage: 'Creator profile not found'
      }
    }

    const isVerified = creatorProfile.isVerified
    const canApply = verificationEligibility.isEligible && !isVerified && applicationStatus.status !== 'submitted'
    const hasActiveApplication = ['submitted', 'under_review'].includes(applicationStatus.status)

    let statusMessage = ''
    if (isVerified) {
      statusMessage = 'Verified creator'
    } else if (hasActiveApplication) {
      statusMessage = 'Verification application under review'
    } else if (canApply) {
      statusMessage = 'Eligible for verification'
    } else {
      statusMessage = 'Not eligible for verification'
    }

    return {
      isVerified,
      isEligible: verificationEligibility.isEligible,
      canApply,
      hasActiveApplication,
      statusMessage,
      applicationStatus: applicationStatus.status
    }
  }, [creatorProfile, verificationEligibility.isEligible, applicationStatus.status])

  /**
   * Refresh verification data
   * This refetches all verification-related data
   */
  const refreshVerificationData = useCallback(async () => {
    await Promise.all([
      refetchProfile(),
      checkApplicationStatus()
    ])
  }, [refetchProfile, checkApplicationStatus])

  // ===== RETURN HOOK INTERFACE =====

  return {
    // Verification status
    verificationStatus,
    verificationEligibility,
    applicationStatus,

    // Application management
    applicationData,
    initializeApplication,
    updateApplicationData,
    submitApplication,
    isSubmittingApplication,
    applicationError,

    // Data refresh
    refreshVerificationData,
    checkApplicationStatus,

    // Loading states
    isLoading: isLoadingProfile,
    error: profileError,

    // Helper data
    creatorProfile,
    targetAddress
  }
}

// ===== VERIFICATION HELPER HOOK =====

/**
 * Simple verification status hook
 * This provides just the verification status for display components
 */
export function useVerificationStatus(creatorAddress?: Address) {
  const { verificationStatus, verificationEligibility, isLoading } = useCreatorVerification(creatorAddress)
  
  return {
    isVerified: verificationStatus.isVerified,
    isEligible: verificationStatus.isEligible,
    canApply: verificationStatus.canApply,
    hasActiveApplication: verificationStatus.hasActiveApplication,
    statusMessage: verificationStatus.statusMessage,
    missingRequirements: verificationEligibility.missingRequirements,
    isLoading
  }
}