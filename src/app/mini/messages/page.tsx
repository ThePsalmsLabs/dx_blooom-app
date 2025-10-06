/**
 * MiniApp Messages Page - Mobile-First XMTP Integration
 * File: src/app/mini/messages/page.tsx
 *
 * Full-featured messaging interface optimized for mobile miniapp experience.
 * Integrates all XMTP functionality with touch-optimized UI patterns.
 */

'use client'

import React, { Suspense, useCallback, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'
import { 
  MessageCircle, 
  ArrowLeft, 
  Plus, 
  Search,
  Users,
  AlertCircle,
  Loader2,
  Wifi,
  WifiOff
} from 'lucide-react'

// UI Components
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  Badge,
  Skeleton
} from '@/components/ui/index'
import { cn } from '@/lib/utils'

// XMTP Messaging Components
import { MessagingInterface } from '@/components/messaging/MessagingInterface'
import { ConversationList } from '@/components/messaging/ConversationList'
import { useXMTPClient } from '@/hooks/messaging/useXMTPClient'
import { useConversationManager } from '@/hooks/messaging/useConversationManager'
import { useMessageReadState } from '@/hooks/messaging/useMessageReadState'
import { useFarcasterAutoWallet } from '@/hooks/miniapp/useFarcasterAutoWallet'
import { useMiniAppUtils, useSocialState } from '@/contexts/UnifiedMiniAppProvider'

import type { Address } from 'viem'
import type { Conversation, ConversationPreview } from '@/types/messaging'

// ================================================
// MOBILE-OPTIMIZED LOADING COMPONENTS
// ================================================

function MiniAppMessagesLoading() {
  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header Skeleton */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 p-4 space-y-4">
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MiniAppMessagesError({ 
  error, 
  resetErrorBoundary 
}: { 
  error: Error
  resetErrorBoundary: () => void 
}) {
  return (
    <div className="h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 flex items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Messaging Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load messaging interface. This might be due to network issues or XMTP connectivity.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Button onClick={resetErrorBoundary} className="w-full">
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ================================================
// CONVERSATION SELECTION STATE
// ================================================

interface ConversationState {
  selectedConversation: string | null
  showConversationList: boolean
  searchQuery: string
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

// Convert ConversationPreview to Conversation for ConversationList compatibility
function convertPreviewToConversation(preview: ConversationPreview): Conversation {
  return {
    id: preview.id,
    participantAddress: preview.peerAddress,
    participantName: `${preview.peerAddress.slice(0, 6)}...${preview.peerAddress.slice(-4)}`,
    lastMessage: preview.lastMessage ? {
      id: `${preview.id}-last`,
      content: preview.lastMessage.content,
      sender: preview.lastMessage.sender,
      timestamp: preview.lastMessage.timestamp,
      type: 'text' as const,
      category: preview.lastMessage.category,
      isOwn: false
    } : undefined,
    lastMessageAt: preview.lastMessage?.timestamp || preview.createdAt,
    unreadCount: preview.unreadCount,
    isOnline: false,
    status: preview.status,
    context: preview.context
  }
}

// ================================================
// MAIN MESSAGES PAGE COMPONENT
// ================================================

function MiniAppMessagesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Wallet and social context
  const { isConnected: walletConnected, address: userAddress } = useFarcasterAutoWallet()
  const { isMiniApp } = useMiniAppUtils()
  const socialState = useSocialState()
  
  // XMTP Integration
  const { 
    client, 
    isConnected: xmtpConnected, 
    isConnecting: xmtpConnecting,
    connect: connectXMTP,
    error: xmtpError 
  } = useXMTPClient()
  
  const { 
    conversations, 
    isLoading: conversationsLoading, 
    error: conversationsError,
    loadConversations 
  } = useConversationManager()
  
  // Read state management
  const { markMessagesPageVisited, markAsRead } = useMessageReadState(conversations)

  // Navigation and UI State
  const [conversationState, setConversationState] = useState<ConversationState>({
    selectedConversation: searchParams.get('conversation') || null,
    showConversationList: !searchParams.get('conversation'),
    searchQuery: ''
  })

  // Auto-connect XMTP when wallet is ready
  useEffect(() => {
    if (walletConnected && userAddress && !xmtpConnected && !xmtpConnecting && !xmtpError) {
      console.log('🔄 Auto-connecting XMTP in messages page...')
      connectXMTP().catch(console.error)
    }
  }, [walletConnected, userAddress, xmtpConnected, xmtpConnecting, xmtpError, connectXMTP])
  
  // Mark messages as read when page is visited
  useEffect(() => {
    if (conversationState.showConversationList && conversations.length > 0) {
      markMessagesPageVisited()
    }
  }, [conversationState.showConversationList, conversations.length, markMessagesPageVisited])

  // Handle conversation selection
  const handleConversationSelect = useCallback((conversationId: string) => {
    setConversationState(prev => ({
      ...prev,
      selectedConversation: conversationId,
      showConversationList: false
    }))
    
    // Mark conversation as read when opened
    markAsRead(conversationId)
    
    // Update URL without full navigation
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set('conversation', conversationId)
    window.history.replaceState({}, '', `?${newParams.toString()}`)
  }, [searchParams, markAsRead])

  // Handle back to conversation list
  const handleBackToList = useCallback(() => {
    setConversationState(prev => ({
      ...prev,
      selectedConversation: null,
      showConversationList: true
    }))
    
    // Clear conversation from URL
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.delete('conversation')
    const newUrl = newParams.toString() ? `?${newParams.toString()}` : ''
    window.history.replaceState({}, '', window.location.pathname + newUrl)
  }, [searchParams])

  // ================================================
  // RENDER STATES
  // ================================================

  // Wallet not connected
  if (!walletConnected || !userAddress) {
    return (
      <div className="h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 flex items-center justify-center rounded-full bg-primary/10">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Connect Wallet for Messaging</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Connect your wallet to start messaging with creators and other users.
            </p>
            <Button 
              onClick={() => router.push('/mini')}
              className="w-full"
            >
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // XMTP Connection Issues
  if (xmtpError) {
    return (
      <div className="h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 flex items-center justify-center rounded-full bg-destructive/10">
              <WifiOff className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Connection Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to connect to XMTP messaging network. Please check your connection and try again.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Button 
                onClick={() => connectXMTP()}
                disabled={xmtpConnecting}
                className="w-full"
              >
                {xmtpConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wifi className="mr-2 h-4 w-4" />
                    Retry Connection
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/mini')}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // XMTP Connecting
  if (xmtpConnecting || !xmtpConnected) {
    return (
      <div className="h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 flex items-center justify-center rounded-full bg-blue-500/10">
              <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
            </div>
            <CardTitle>Connecting to Messaging</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Setting up secure messaging with XMTP protocol...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ================================================
  // MAIN MESSAGING INTERFACE
  // ================================================

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Mobile Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {conversationState.selectedConversation ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/mini')}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <div>
              <h1 className="font-semibold text-base">
                {conversationState.selectedConversation ? 'Conversation' : 'Messages'}
              </h1>
              {socialState?.userProfile && (
                <p className="text-xs text-muted-foreground">
                  @{socialState.userProfile.username}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <Badge variant="secondary" className="text-xs">
              <div className="h-1.5 w-1.5 bg-green-500 rounded-full mr-1" />
              Connected
            </Badge>
            
            {!conversationState.selectedConversation && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  // Future: Open new conversation modal
                  console.log('New conversation')
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {conversationState.showConversationList ? (
          /* Conversation List View */
          <div className="h-full flex flex-col">
            {/* Search Bar */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={conversationState.searchQuery}
                  onChange={(e) => setConversationState(prev => ({ ...prev, searchQuery: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {conversationsLoading ? (
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton className="h-3 w-12" />
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center space-y-4">
                    <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-muted">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">No conversations yet</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Start messaging by purchasing content or connecting with creators
                      </p>
                    </div>
                    <Button 
                      onClick={() => router.push('/mini/browse')}
                      variant="outline"
                    >
                      Browse Content
                    </Button>
                  </div>
                </div>
              ) : (
                <ConversationList
                  conversations={conversations.map(convertPreviewToConversation)}
                  onConversationSelect={(conversation) => handleConversationSelect(conversation.id)}
                  searchQuery={conversationState.searchQuery}
                  className="p-4"
                />
              )}
            </div>
          </div>
        ) : (
          /* Individual Conversation View */
          conversationState.selectedConversation && (
            <MessagingInterface
              userAddress={userAddress}
              creatorAddress={conversationState.selectedConversation as Address}
              contentId={searchParams.get('contentId') || undefined}
              context={(searchParams.get('context') as any) || 'general'}
              className="h-full"
            />
          )
        )}
      </div>
    </div>
  )
}

// ================================================
// EXPORTED PAGE COMPONENT
// ================================================

export default function MiniAppMessagesPage() {
  return (
    <ErrorBoundary FallbackComponent={MiniAppMessagesError}>
      <Suspense fallback={<MiniAppMessagesLoading />}>
        <MiniAppMessagesContent />
      </Suspense>
    </ErrorBoundary>
  )
}