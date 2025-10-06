/**
 * Messaging Demo Page
 * 
 * Comprehensive testing playground for all messaging features.
 * Showcases XMTP integration, real-time messaging, and UI components.
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessagingInterface } from '@/components/messaging/MessagingInterface'
import { SmartMessagingButton } from '@/components/messaging/SmartMessagingButton'
import { PostPurchaseMessaging } from '@/components/messaging/PostPurchaseMessaging'
import { CreatorMessagingDashboard } from '@/components/creator/CreatorMessagingDashboard'
import { useWalletConnectionUI } from '@/hooks/ui/integration'
import { useXMTPClient } from '@/hooks/messaging/useXMTPClient'
import { MessageSquare, Users, TrendingUp, Shield, Zap } from 'lucide-react'
import type { Address } from 'viem'

// Mock addresses for testing
const DEMO_ADDRESSES = {
  creator1: '0x742d35Cc94C4C0F3a3dFa8B2E9C6e0F6b8e4d5a1' as Address,
  creator2: '0x853e46De95D5D7F7e6dFb9C3F0G7f9c5d7f8e6b2' as Address,
  fan1: '0x964f57Ef06E6E8G8f7eGc0D4G1H8g6d8e9f7c3' as Address,
  fan2: '0xa75g68Fg17F7F9H9g8fHd1E5H2I9h7e9f8g4d4' as Address
} as const

export default function MessagingDemoPage() {
  // ===== STATE =====
  
  const [selectedDemo, setSelectedDemo] = useState<string>('interface')
  const [showPostPurchase, setShowPostPurchase] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<Address>(DEMO_ADDRESSES.creator1)
  
  // ===== MOCK DATA FOR CREATOR DASHBOARD =====
  
  const mockConversations = [
    {
      id: '1',
      participantAddress: DEMO_ADDRESSES.fan1,
      participantName: 'Alice',
      lastMessage: 'Thanks for the amazing content!',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 5),
      unreadCount: 2,
      totalMessages: 15,
      isFromPurchaser: true,
      contentPurchased: {
        id: 'content-1',
        title: 'Digital Art Collection',
        amount: '50'
      },
      tags: ['vip', 'repeat'],
      isPinned: true,
      isArchived: false,
      sentiment: 'positive' as const
    },
    {
      id: '2',
      participantAddress: DEMO_ADDRESSES.fan2,
      participantName: 'Bob',
      lastMessage: 'When is the next drop?',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 30),
      unreadCount: 0,
      totalMessages: 8,
      isFromPurchaser: true,
      contentPurchased: {
        id: 'content-2',
        title: 'Music NFT',
        amount: '25'
      },
      tags: ['engaged'],
      isPinned: false,
      isArchived: false,
      sentiment: 'neutral' as const
    }
  ]
  
  const mockAnalytics = {
    totalConversations: 42,
    totalMessages: 328,
    avgResponseTime: 12,
    engagementRate: 67,
    topFans: [
      {
        address: DEMO_ADDRESSES.fan1,
        name: 'Alice',
        messageCount: 45,
        totalSpent: '250'
      },
      {
        address: DEMO_ADDRESSES.fan2,
        name: 'Bob',
        messageCount: 32,
        totalSpent: '180'
      }
    ],
    messagesByDay: [
      { date: '2024-01-01', count: 12 },
      { date: '2024-01-02', count: 18 },
      { date: '2024-01-03', count: 25 },
      { date: '2024-01-04', count: 30 },
      { date: '2024-01-05', count: 22 },
      { date: '2024-01-06', count: 28 },
      { date: '2024-01-07', count: 35 }
    ],
    conversionMetrics: {
      messagesToPurchase: 42,
      repeatPurchasers: 18,
      avgPurchaseAfterMessage: '75.50'
    }
  }
  
  // ===== HOOKS =====
  
  const walletUI = useWalletConnectionUI()
  const { client, isConnected, isConnecting, connect } = useXMTPClient()
  
  const { address: userAddress, isConnected: isWalletConnected } = walletUI
  
  // ===== DEMO SECTIONS =====
  
  const demoSections = [
    {
      id: 'interface',
      title: 'Messaging Interface',
      description: 'Full messaging UI with conversations and real-time chat',
      icon: MessageSquare,
      component: (
        <div className="h-[600px] border rounded-lg overflow-hidden">
          <MessagingInterface 
            userAddress={selectedAddress}
          />
        </div>
      )
    },
    {
      id: 'buttons',
      title: 'Smart Messaging Buttons',
      description: 'Platform-adaptive messaging entry points',
      icon: Zap,
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(DEMO_ADDRESSES).map(([name, address]) => (
              <Card key={address} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium capitalize">{name}</h4>
                    <p className="text-sm text-muted-foreground font-mono">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </p>
                  </div>
                  <Badge variant={name.includes('creator') ? 'default' : 'secondary'}>
                    {name.includes('creator') ? 'Creator' : 'Fan'}
                  </Badge>
                </div>
                <SmartMessagingButton 
                  userAddress={address}
                  variant="default"
                  size="sm"
                  className="w-full"
                />
              </Card>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'post-purchase',
      title: 'Post-Purchase Messaging',
      description: 'Celebration modals and purchase flow integration',
      icon: TrendingUp,
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => setShowPostPurchase(true)}
              variant="outline"
              className="h-24"
            >
              🎉 Trigger Celebration Modal
            </Button>
            <Button 
              variant="outline"
              className="h-24"
              disabled
            >
              📧 Email Integration
              <Badge className="ml-2">Soon</Badge>
            </Button>
            <Button 
              variant="outline"
              className="h-24"
              disabled
            >
              🔔 Push Notifications
              <Badge className="ml-2">Soon</Badge>
            </Button>
          </div>
          
          {showPostPurchase && (
            <PostPurchaseMessaging
              userAddress={selectedAddress}
              creatorAddress={DEMO_ADDRESSES.creator1}
              contentId="demo-content-123"
              contentTitle="Demo NFT Collection"
              variant="celebration"
              isVisible={showPostPurchase}
              onDismiss={() => setShowPostPurchase(false)}
            />
          )}
        </div>
      )
    },
    {
      id: 'dashboard',
      title: 'Creator Dashboard',
      description: 'Analytics, management, and engagement tools',
      icon: Users,
      component: (
        <div className="h-[700px] border rounded-lg overflow-hidden bg-background">
          <CreatorMessagingDashboard 
            creatorAddress={DEMO_ADDRESSES.creator1}
            conversations={mockConversations}
            analytics={mockAnalytics}
            onConversationSelect={(id) => console.log('Selected conversation:', id)}
            onMarkAsRead={(id) => console.log('Mark as read:', id)}
            onArchiveConversation={(id) => console.log('Archive:', id)}
            onPinConversation={(id) => console.log('Pin:', id)}
            onDeleteConversation={(id) => console.log('Delete:', id)}
          />
        </div>
      )
    }
  ]
  
  // ===== CONNECTION STATUS =====
  
  const connectionStatus = () => {
    if (!isWalletConnected) {
      return { status: 'disconnected', message: 'Connect wallet to test messaging', color: 'bg-gray-500' }
    }
    if (isConnecting) {
      return { status: 'connecting', message: 'Connecting to XMTP...', color: 'bg-yellow-500' }
    }
    if (isConnected) {
      return { status: 'connected', message: 'XMTP Connected', color: 'bg-green-500' }
    }
    return { status: 'ready', message: 'Ready to connect XMTP', color: 'bg-blue-500' }
  }
  
  const status = connectionStatus()
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Messaging System Demo</h1>
            <p className="text-muted-foreground">
              Comprehensive testing playground for XMTP messaging features
            </p>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${status.color}`} />
              <span className="text-sm font-medium">{status.message}</span>
            </div>
            
            {isWalletConnected && !isConnected && !isConnecting && (
              <Button onClick={connect} size="sm">
                Connect XMTP
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Address Selector */}
      {isConnected && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Demo Address Selector</CardTitle>
            <CardDescription>
              Choose which address to simulate for testing messaging features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(DEMO_ADDRESSES).map(([name, address]) => (
                <Button
                  key={address}
                  variant={selectedAddress === address ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedAddress(address)}
                  className="h-auto p-3 flex flex-col items-start"
                >
                  <span className="font-medium capitalize">{name}</span>
                  <span className="text-xs opacity-70 font-mono">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Demo Tabs */}
      <Tabs value={selectedDemo} onValueChange={setSelectedDemo}>
        <TabsList className="grid w-full grid-cols-4">
          {demoSections.map((section) => (
            <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-2">
              <section.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{section.title}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {demoSections.map((section) => (
          <TabsContent key={section.id} value={section.id} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <section.icon className="w-5 h-5" />
                  {section.title}
                </CardTitle>
                <CardDescription>
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {section.component}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
      
      {/* Features Overview */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Implemented Features
          </CardTitle>
          <CardDescription>
            Complete messaging system with XMTP v3 integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'Real-time messaging with XMTP',
              'Platform-adaptive UI (desktop/mobile)',
              'Typing indicators & message status',
              'Message reactions & interactions',
              'Post-purchase messaging flows',
              'Creator analytics dashboard',
              'Permission-based messaging',
              'iMessage-inspired design',
              'Dark/light mode theming',
              'Wallet integration',
              'Message management (edit/delete)',
              'Conversation threading'
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Technical Notes */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Technical Implementation</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none dark:prose-invert">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">XMTP Integration</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Global client caching for performance</li>
                <li>• Real-time message streaming</li>
                <li>• Typing indicators via special messages</li>
                <li>• Conversation management</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">UI Architecture</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Component-based messaging interface</li>
                <li>• Platform detection and adaptation</li>
                <li>• Responsive design patterns</li>
                <li>• Accessibility compliance ready</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}