/**
 * MiniApp Messaging Button Component
 * File: src/components/miniapp/MiniAppMessagingButton.tsx
 * 
 * Clean example of how to use XMTP in MiniApp context with proper
 * manual connection and optimal user experience.
 */

'use client'

import { useState } from 'react'
import { useMiniAppWallet } from '@/hooks/miniapp/useMiniAppWallet'
import { useMiniAppXMTP } from '@/hooks/miniapp/useMiniAppXMTP'

interface MiniAppMessagingButtonProps {
  recipientAddress: string
  disabled?: boolean
  className?: string
}

export function MiniAppMessagingButton({ 
  recipientAddress, 
  disabled = false,
  className = ''
}: MiniAppMessagingButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  
  // Get wallet state
  const wallet = useMiniAppWallet()
  
  // Get XMTP state 
  const xmtp = useMiniAppXMTP()
  
  const handleStartMessaging = async () => {
    try {
      setIsConnecting(true)
      
      // Ensure wallet is connected first
      if (!wallet.isConnected) {
        console.log('🔗 Connecting wallet first...')
        await wallet.connect()
      }
      
      // Connect XMTP (this will request signature if first time)
      if (!xmtp.isConnected) {
        console.log('📧 Connecting to XMTP...')
        await xmtp.connect()
      }
      
      // XMTP is now ready for messaging
      console.log('✅ Ready for messaging!')
      
      // Here you would typically:
      // - Navigate to messaging interface
      // - Create/open conversation
      // - Show messaging UI
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start messaging'
      console.error('❌ Messaging initialization failed:', errorMessage)
      
      // Show user-friendly error
      alert(`Could not start messaging: ${errorMessage}`)
      
    } finally {
      setIsConnecting(false)
    }
  }
  
  // Determine button state and text
  const getButtonState = () => {
    if (!xmtp.isMiniAppContext) {
      return { text: 'Not in MiniApp', disabled: true }
    }
    
    if (!wallet.isConnected) {
      return { text: 'Connect Wallet to Message', disabled: false }
    }
    
    if (!xmtp.canConnect) {
      return { text: 'Wallet Not Ready', disabled: true }
    }
    
    if (xmtp.isConnecting || isConnecting) {
      return { text: 'Connecting...', disabled: true }
    }
    
    if (xmtp.isConnected) {
      return { text: 'Start Conversation', disabled: false }
    }
    
    return { text: 'Enable Messaging', disabled: false }
  }
  
  const buttonState = getButtonState()
  const isDisabled = disabled || buttonState.disabled
  
  return (
    <div className="space-y-2">
      <button
        onClick={handleStartMessaging}
        disabled={isDisabled}
        className={`
          px-4 py-2 rounded-lg font-medium transition-colors
          ${isDisabled 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
          }
          ${className}
        `}
      >
        {buttonState.text}
      </button>
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 space-y-1">
          <div>Wallet: {wallet.isConnected ? '✅' : '❌'} | XMTP: {xmtp.isConnected ? '✅' : '❌'}</div>
          <div>MiniApp: {xmtp.isMiniAppContext ? '✅' : '❌'} | Can Connect: {xmtp.canConnect ? '✅' : '❌'}</div>
          {xmtp.error && <div className="text-red-500">Error: {xmtp.error.message}</div>}
        </div>
      )}
    </div>
  )
}

/**
 * Hook for messaging readiness state
 * Useful for conditional rendering in other components
 */
export function useMessagingReadiness() {
  const wallet = useMiniAppWallet()
  const xmtp = useMiniAppXMTP()
  
  return {
    isReady: wallet.isConnected && xmtp.isConnected,
    canInitialize: xmtp.isMiniAppContext && wallet.isConnected && xmtp.canConnect,
    needsWalletConnection: !wallet.isConnected,
    needsXMTPConnection: wallet.isConnected && !xmtp.isConnected,
    isInMiniApp: xmtp.isMiniAppContext,
    error: wallet.error || xmtp.error?.message || null
  }
}