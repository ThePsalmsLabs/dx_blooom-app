/**
 * Simple test component to verify the simplified purchase modal
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CustomPurchaseModal } from '@/components/ui/custom-purchase-modal'

export function TestPurchaseModal() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="p-4">
      <Button onClick={() => setIsOpen(true)}>
        Test Purchase Modal
      </Button>

      <CustomPurchaseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        contentId={BigInt(1)}
        contentTitle="Test Content"
        contentPrice={BigInt(1000000)} // 1 USDC
        creatorAddress="0x123..."
        onPurchaseSuccess={(method, txHash) => {
          console.log('Purchase successful:', { method, txHash })
          setIsOpen(false)
        }}
        onPurchaseError={(method, error) => {
          console.error('Purchase failed:', { method, error })
        }}
      />
    </div>
  )
}

export default TestPurchaseModal
