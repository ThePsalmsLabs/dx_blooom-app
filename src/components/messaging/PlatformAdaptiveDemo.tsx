'use client'

import React from 'react'
import { SmartMessagingButton, useMessagingPlatform } from './SmartMessagingButton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function PlatformAdaptiveDemo() {
  const platform = useMessagingPlatform()
  
  return (
    <div className="space-y-8 p-8">
      {/* Platform Detection Display */}
      <div className="border rounded-lg p-6 bg-muted/20">
        <h3 className="text-lg font-semibold mb-4">Platform Detection</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className={cn(
            "p-3 rounded border",
            platform.isDesktop && "bg-green-100 dark:bg-green-900/20 border-green-300"
          )}>
            <strong>Desktop:</strong> {platform.isDesktop ? '✓' : '✗'}
            <div className="text-xs text-muted-foreground mt-1">
              Uses side panel for multitasking
            </div>
          </div>
          
          <div className={cn(
            "p-3 rounded border",
            platform.isMobile && "bg-blue-100 dark:bg-blue-900/20 border-blue-300"
          )}>
            <strong>Mobile Web:</strong> {platform.isMobile ? '✓' : '✗'}
            <div className="text-xs text-muted-foreground mt-1">
              Uses dedicated page for focus
            </div>
          </div>
          
          <div className={cn(
            "p-3 rounded border",
            platform.isMiniApp && "bg-purple-100 dark:bg-purple-900/20 border-purple-300"
          )}>
            <strong>Farcaster Miniapp:</strong> {platform.isMiniApp ? '✓' : '✗'}
            <div className="text-xs text-muted-foreground mt-1">
              Uses frame-optimized page
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-background rounded border">
          <strong>Recommended Pattern:</strong> {platform.recommendedUXPattern}
        </div>
      </div>

      {/* Smart Messaging Integration Examples */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Smart Messaging Examples</h3>
        
        {/* Post-Purchase Context */}
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Post-Purchase Flow</h4>
          <p className="text-sm text-muted-foreground mb-3">
            After a user purchases content, they can thank the creator
          </p>
          <SmartMessagingButton
            userAddress="0x1234567890123456789012345678901234567890"
            creatorAddress="0x742d35Cc6634C0532925a3b8D847B2f"
            contentId="12345"
            context="post_purchase"
            variant="default"
          >
            Thank Creator 💝
          </SmartMessagingButton>
        </div>

        {/* Social Share Context */}
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Social Share Flow</h4>
          <p className="text-sm text-muted-foreground mb-3">
            After sharing content, users can start a conversation
          </p>
          <SmartMessagingButton
            userAddress="0x1234567890123456789012345678901234567890"
            creatorAddress="0x742d35Cc6634C0532925a3b8D847B2f"
            context="social_share"
            variant="outline"
          >
            Start Conversation
          </SmartMessagingButton>
        </div>

        {/* General Context */}
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">General Messaging</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Direct messaging for general inquiries
          </p>
          <SmartMessagingButton
            userAddress="0x1234567890123456789012345678901234567890"
            creatorAddress="0x742d35Cc6634C0532925a3b8D847B2f"
            context="general"
            variant="secondary"
          >
            Send Message
          </SmartMessagingButton>
        </div>
      </div>

      {/* Platform-Specific Instructions */}
      <div className="border rounded-lg p-6 bg-accent/20">
        <h4 className="font-medium mb-3">How It Works</h4>
        <div className="space-y-2 text-sm">
          {platform.isDesktop && (
            <div className="flex items-start gap-2">
              <span className="text-green-600">🖥️</span>
              <div>
                <strong>Desktop Experience:</strong> Clicking will open a resizable side panel 
                that slides in from the right, allowing you to continue browsing while messaging.
              </div>
            </div>
          )}
          
          {platform.isMobile && (
            <div className="flex items-start gap-2">
              <span className="text-blue-600">📱</span>
              <div>
                <strong>Mobile Experience:</strong> Clicking will navigate to a dedicated 
                full-screen messaging page optimized for touch interactions.
              </div>
            </div>
          )}
          
          {platform.isMiniApp && (
            <div className="flex items-start gap-2">
              <span className="text-purple-600">🔗</span>
              <div>
                <strong>Miniapp Experience:</strong> Optimized for Farcaster frames with 
                proper safe area handling and frame-specific navigation.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual Testing */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-3">Test Different Patterns</h4>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Simulate desktop
              Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true })
              window.dispatchEvent(new Event('resize'))
            }}
          >
            Simulate Desktop
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Simulate mobile
              Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true })
              window.dispatchEvent(new Event('resize'))
            }}
          >
            Simulate Mobile
          </Button>
        </div>
      </div>
    </div>
  )
}