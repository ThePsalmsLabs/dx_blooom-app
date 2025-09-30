/**
 * V2 Payment Modal Demo Component
 * 
 * Demonstrates the world-class V2 payment modal with all its features
 */

'use client'

import React from 'react'
import { type Address } from 'viem'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, CreditCard, Zap } from 'lucide-react'

import { V2PaymentModal, useV2PaymentModal } from './V2PaymentModal'

interface V2PaymentModalDemoProps {
  contentId?: bigint
  creator?: Address
}

export function V2PaymentModalDemo({ 
  contentId = BigInt(1), 
  creator = '0x742d35Cc6634C0532925a3b8D8835d3e4DD8D5a' as Address 
}: V2PaymentModalDemoProps) {
  
  const paymentModal = useV2PaymentModal({
    contentId,
    creator,
    title: 'Premium Video Content',
    description: 'Exclusive behind-the-scenes content from your favorite creator',
    onSuccess: (txHash) => {
      console.log('Payment successful!', txHash)
      // You could redirect to content or show success notification
    },
    onError: (error) => {
      console.error('Payment failed:', error)
      // You could show error notification
    }
  })

  return (
    <div className="space-y-6">
      <Card className="max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>V2 Payment Modal</span>
            </CardTitle>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Enhanced
            </Badge>
          </div>
          <CardDescription>
            World-class web3 payment experience using your V2 contracts
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Multi-token Support:</span>
              <span>✅ USDC, WETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Real-time Pricing:</span>
              <span>✅ PriceOracle</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Signature Flow:</span>
              <span>✅ EIP-712</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Advanced Settings:</span>
              <span>✅ Slippage Control</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status Tracking:</span>
              <span>✅ Progress Bar</span>
            </div>
          </div>

          <Button 
            onClick={paymentModal.openModal}
            className="w-full"
            size="lg"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Open Payment Modal
          </Button>

          <Button 
            variant="outline"
            onClick={paymentModal.openModal}
            className="w-full"
          >
            <Zap className="h-4 w-4 mr-2" />
            Quick Demo
          </Button>
        </CardContent>
      </Card>

      {/* Features List */}
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">Modal Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
              <div>
                <div className="font-medium">Token Selection</div>
                <div className="text-muted-foreground">Choose between USDC and WETH with real-time pricing</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
              <div>
                <div className="font-medium">Payment Review</div>
                <div className="text-muted-foreground">Clear breakdown of costs and advanced settings</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
              <div>
                <div className="font-medium">Processing Flow</div>
                <div className="text-muted-foreground">Real-time progress tracking with status updates</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
              <div>
                <div className="font-medium">Success/Error Handling</div>
                <div className="text-muted-foreground">Beautiful success confirmation and error recovery</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* The Modal Component */}
      <V2PaymentModal {...paymentModal.modalProps} />
    </div>
  )
}

export default V2PaymentModalDemo