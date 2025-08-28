import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { type Address } from 'viem'
import { Eye } from 'lucide-react'

// Import your existing hooks and components
import { useContentById } from '@/hooks/contracts/core'
import { useCreatorProfile } from '@/hooks/contracts/core'
import { useHasContentAccess } from '@/hooks/contracts/core'
import { OrchestratedContentPurchaseCard } from '@/components/content/OrchestratedContentPurchaseCard'
import { SubscriptionPurchaseModal } from '@/components/subscription/SubscriptionPurchaseModal'
import { formatCurrency } from '@/lib/utils'

interface ContentAccessControlProps {
  contentId: bigint
  creatorAddress: Address
  userAddress?: Address
  className?: string
}

export function ContentAccessControl({
  contentId,
  creatorAddress,
  userAddress,
  className
}: ContentAccessControlProps) {
  const router = useRouter()
  const contentQuery = useContentById(contentId)
  const creatorProfile = useCreatorProfile(creatorAddress)
  const hasAccess = useHasContentAccess(userAddress, contentId)
  
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)

  if (hasAccess.data) {
    return (
      <Button className={className} onClick={() => router.push(`/content/${contentId}/view`)}>
        <Eye className="h-4 w-4 mr-2" />
        View Content
      </Button>
    )
  }

  if (!contentQuery.data || !creatorProfile.data) {
    return <div>Loading...</div>
  }

  const content = contentQuery.data
  const creator = creatorProfile.data

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Pay-per-view option */}
      <div className="p-4 border rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium">Buy This Content</h4>
          <span className="font-bold">
            {formatCurrency(content.payPerViewPrice, 6, 'USDC')}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          One-time purchase for permanent access to this content
        </p>
        <OrchestratedContentPurchaseCard
          contentId={contentId}
          userAddress={userAddress}
          onPurchaseSuccess={() => console.log('Purchase successful for content:', contentId)}
          onViewContent={(contentId) => router.push(`/content/${contentId}/view`)}
          variant="full"
          showCreatorInfo={true}
          showPurchaseDetails={true}
          enableMultiPayment={true}
          showSystemHealth={true}
          enablePerformanceMetrics={false}
          className="w-full"
        />
      </div>

      {/* Subscription option */}
      <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-blue-900">Subscribe to Creator</h4>
          <span className="font-bold text-blue-900">
            {formatCurrency(creator.subscriptionPrice, 6, 'USDC')}/month
          </span>
        </div>
        <p className="text-sm text-blue-700 mb-3">
          Access all creator content for 30 days
        </p>
        <Button 
          onClick={() => setShowSubscriptionModal(true)}
          variant="default"
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          Subscribe to All Content
        </Button>
      </div>

      <SubscriptionPurchaseModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        creatorAddress={creatorAddress}
        onSubscriptionSuccess={() => {
          // Refresh access status
          hasAccess.refetch()
        }}
      />
    </div>
  )
}
