/**
 * Simple MiniApp Messages - Direct Unified System Usage
 * File: src/app/mini/messages/SimpleMiniAppMessages.tsx
 *
 * Clean implementation using only our unified XMTP system.
 * No legacy type mappings or complex compatibility layers.
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MessageCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { useConversationManager } from '@/shared/xmtp'
import { useMiniAppXMTP } from '@/hooks/miniapp/useMiniAppXMTP'
import { useMiniAppWallet } from '@/hooks/miniapp/useMiniAppWallet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ConversationPreview } from '@/shared/xmtp/types'

interface ConversationListItemProps {
  conversation: ConversationPreview
  onSelect: (conversationId: string) => void
}

function ConversationListItem({ conversation, onSelect }: ConversationListItemProps) {
  const { peerAddress, lastMessage, unreadCount, lastMessageTime } = conversation
  
  return (
    <div 
      className="p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => onSelect(conversation.id)}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="font-medium text-sm">
              {peerAddress.slice(0, 6)}...{peerAddress.slice(-4)}
            </div>
            {unreadCount > 0 && (
              <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          
          {lastMessage && (
            <div className="text-muted-foreground text-sm mt-1 truncate">
              {lastMessage.content}
            </div>
          )}
          
          {lastMessageTime && (
            <div className="text-muted-foreground text-xs mt-1">
              {lastMessageTime.toLocaleDateString()} at {lastMessageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0 text-muted-foreground">
          <ArrowLeft className="h-4 w-4 rotate-180" />
        </div>
      </div>
    </div>
  )
}

export default function SimpleMiniAppMessages() {
  const router = useRouter()
  const { isConnected: walletConnected, address: walletAddress } = useMiniAppWallet()
  const { conversations, isLoading } = useConversationManager()
  const miniAppXMTP = useMiniAppXMTP()
  const [retryCount, setRetryCount] = React.useState(0)

  // Use miniAppXMTP state directly (it has its own client management)
  const xmtpConnected = !!miniAppXMTP.client
  const xmtpError = miniAppXMTP.error

  // Auto-connect to XMTP when wallet is connected
  React.useEffect(() => {
    const initXMTP = async () => {
      if (walletConnected && walletAddress && !xmtpConnected && !miniAppXMTP.isConnecting) {
        console.log('🔌 MiniApp: Auto-connecting to XMTP...')
        try {
          await miniAppXMTP.connect()
          console.log('✅ XMTP connected successfully')
          setRetryCount(0)
        } catch (error) {
          console.error('❌ Failed to auto-connect XMTP:', error)
        }
      }
    }
    
    initXMTP()
  }, [walletConnected, walletAddress, xmtpConnected, miniAppXMTP.isConnecting, miniAppXMTP.connect, retryCount])

  const handleConversationSelect = (conversationId: string) => {
    console.log('Selected conversation:', conversationId)
    // TODO: Navigate to conversation detail view
  }

  const handleGoBack = () => {
    router.back()
  }

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
  }

  // Connection Status Badge
  const getConnectionStatusBadge = () => {
    if (miniAppXMTP.isConnecting) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Connecting...
        </Badge>
      )
    }
    
    if (xmtpConnected) {
      return (
        <Badge variant="default" className="bg-green-600 gap-1">
          <div className="h-2 w-2 bg-white rounded-full" />
          Connected
        </Badge>
      )
    }
    
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        Disconnected
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-Optimized Navigation Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                className="h-9 w-9 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <div>
                  <h1 className="text-lg font-semibold">Messages</h1>
                  <p className="text-xs text-muted-foreground">
                    {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {getConnectionStatusBadge()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4">
        {/* Wallet Connection Check */}
        {!walletConnected && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Wallet Not Connected</p>
                <p className="text-sm">Please connect your wallet to access messaging features.</p>
                <Button 
                  size="sm" 
                  onClick={handleGoBack}
                  className="mt-2"
                >
                  Go Back
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* XMTP Connection Error */}
        {walletConnected && !xmtpConnected && xmtpError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Connection Error</p>
                <p className="text-sm">
                  {xmtpError.message || 'Failed to connect to XMTP network'}
                </p>
                <div className="flex gap-2 mt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleRetry}
                    className="gap-2"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Retry
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleGoBack}
                  >
                    Go Back
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* XMTP Connecting State */}
        {walletConnected && !xmtpConnected && miniAppXMTP.isConnecting && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">
              Connecting to messaging network...
            </p>
          </div>
        )}

        {/* Loading Conversations */}
        {walletConnected && xmtpConnected && isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4 mb-3"></div>
                <div className="h-3 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {/* Conversations List */}
        {walletConnected && xmtpConnected && !isLoading && (
          <div className="space-y-2">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No conversations yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Start messaging creators to see conversations here
                </p>
                <Button onClick={handleGoBack} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </div>
            ) : (
              conversations.map(conversation => (
                <ConversationListItem
                  key={conversation.id}
                  conversation={conversation}
                  onSelect={handleConversationSelect}
                />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}