'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  MessageCircle, 
  Users, 
  TrendingUp, 
  Clock, 
  Star,
  Eye,
  DollarSign,
  BarChart3,
  Filter,
  Search,
  MoreHorizontal,
  Pin,
  Archive,
  Trash2,
  Reply,
  Heart,
  UserPlus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Address } from 'viem'

interface ConversationSummary {
  id: string
  participantAddress: Address
  participantName?: string
  participantAvatar?: string
  lastMessage: string
  lastMessageAt: Date
  unreadCount: number
  totalMessages: number
  isFromPurchaser: boolean
  contentPurchased?: {
    id: string
    title: string
    amount: string
  }
  tags: string[]
  isPinned: boolean
  isArchived: boolean
  sentiment: 'positive' | 'neutral' | 'negative'
}

interface MessagingAnalytics {
  totalConversations: number
  totalMessages: number
  avgResponseTime: number // in minutes
  engagementRate: number // percentage
  topFans: Array<{
    address: Address
    name: string
    avatar?: string
    messageCount: number
    totalSpent: string
  }>
  messagesByDay: Array<{
    date: string
    count: number
  }>
  conversionMetrics: {
    messagesToPurchase: number // percentage
    repeatPurchasers: number
    avgPurchaseAfterMessage: string
  }
}

interface CreatorMessagingDashboardProps {
  creatorAddress: Address
  conversations: ConversationSummary[]
  analytics: MessagingAnalytics
  onConversationSelect: (conversationId: string) => void
  onMarkAsRead: (conversationId: string) => void
  onArchiveConversation: (conversationId: string) => void
  onPinConversation: (conversationId: string) => void
  onDeleteConversation: (conversationId: string) => void
  className?: string
}

export function CreatorMessagingDashboard({
  creatorAddress,
  conversations,
  analytics,
  onConversationSelect,
  onMarkAsRead,
  onArchiveConversation,
  onPinConversation,
  onDeleteConversation,
  className
}: CreatorMessagingDashboardProps) {
  
  const [selectedTab, setSelectedTab] = useState<'overview' | 'conversations' | 'analytics'>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'pinned' | 'purchasers'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'unread' | 'messages'>('recent')

  // ===== FILTERED CONVERSATIONS =====
  
  const filteredConversations = useMemo(() => {
    let filtered = conversations.filter(conv => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = conv.participantName?.toLowerCase().includes(query)
        const matchesMessage = conv.lastMessage.toLowerCase().includes(query)
        const matchesContent = conv.contentPurchased?.title.toLowerCase().includes(query)
        if (!matchesName && !matchesMessage && !matchesContent) return false
      }
      
      // Status filter
      switch (filterStatus) {
        case 'unread':
          return conv.unreadCount > 0
        case 'pinned':
          return conv.isPinned
        case 'purchasers':
          return conv.isFromPurchaser
        default:
          return !conv.isArchived
      }
    })
    
    // Sort conversations
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'unread':
          return b.unreadCount - a.unreadCount
        case 'messages':
          return b.totalMessages - a.totalMessages
        case 'recent':
        default:
          return b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
      }
    })
    
    return filtered
  }, [conversations, searchQuery, filterStatus, sortBy])

  const unreadCount = conversations.filter(c => c.unreadCount > 0).length
  const purchaserCount = conversations.filter(c => c.isFromPurchaser).length

  return (
    <div className={cn('w-full max-w-7xl mx-auto space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Creator Messaging Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your fan communications and track engagement
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {analytics.totalConversations} conversations
          </Badge>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-sm">
              {unreadCount} unread
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Messages</p>
                <p className="text-2xl font-semibold">{analytics.totalMessages.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Fans</p>
                <p className="text-2xl font-semibold">{analytics.totalConversations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-semibold">{analytics.avgResponseTime}m</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Engagement</p>
                <p className="text-2xl font-semibold">{analytics.engagementRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="conversations" className="relative">
            Conversations
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Conversations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Recent Conversations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {conversations.slice(0, 5).map(conv => (
                  <div 
                    key={conv.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onConversationSelect(conv.id)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conv.participantAvatar} />
                      <AvatarFallback>
                        {conv.participantName?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {conv.participantName || `${conv.participantAddress.slice(0, 6)}...`}
                        </p>
                        {conv.isFromPurchaser && (
                          <Badge variant="secondary" className="text-xs">Purchased</Badge>
                        )}
                        {conv.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage}
                      </p>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {formatTimeAgo(conv.lastMessageAt)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top Fans */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Top Fans
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.topFans.slice(0, 5).map((fan, index) => (
                  <div key={fan.address} className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground w-4">
                        #{index + 1}
                      </span>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={fan.avatar} />
                        <AvatarFallback className="text-xs">
                          {fan.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium text-sm">{fan.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {fan.messageCount} messages • ${fan.totalSpent} spent
                      </p>
                    </div>
                    
                    <Heart className="w-4 h-4 text-red-500" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="space-y-4">
          {/* Conversation Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                {/* Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All ({conversations.length})</option>
                  <option value="unread">Unread ({unreadCount})</option>
                  <option value="pinned">Pinned</option>
                  <option value="purchasers">Purchasers ({purchaserCount})</option>
                </select>
                
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="recent">Most Recent</option>
                  <option value="unread">Most Unread</option>
                  <option value="messages">Most Active</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Conversation List */}
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredConversations.map(conv => (
                  <ConversationRow
                    key={conv.id}
                    conversation={conv}
                    onSelect={() => onConversationSelect(conv.id)}
                    onMarkAsRead={() => onMarkAsRead(conv.id)}
                    onPin={() => onPinConversation(conv.id)}
                    onArchive={() => onArchiveConversation(conv.id)}
                    onDelete={() => onDeleteConversation(conv.id)}
                  />
                ))}
                
                {filteredConversations.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    No conversations found matching your filters.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Conversion Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Messages → Purchases</span>
                    <span className="font-semibold">{analytics.conversionMetrics.messagesToPurchase}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${analytics.conversionMetrics.messagesToPurchase}%` }}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Repeat Purchasers</span>
                    <span className="font-semibold">{analytics.conversionMetrics.repeatPurchasers}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Purchase After Message</span>
                    <span className="font-semibold">${analytics.conversionMetrics.avgPurchaseAfterMessage}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Message Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Message Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.messagesByDay.slice(-7).map((day, index) => (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-16">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(day.count / Math.max(...analytics.messagesByDay.map(d => d.count))) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{day.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * Individual conversation row component
 */
function ConversationRow({
  conversation,
  onSelect,
  onMarkAsRead,
  onPin,
  onArchive,
  onDelete
}: {
  conversation: ConversationSummary
  onSelect: () => void
  onMarkAsRead: () => void
  onPin: () => void
  onArchive: () => void
  onDelete: () => void
}) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div 
      className="p-4 hover:bg-muted/50 transition-colors relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={conversation.participantAvatar} />
          <AvatarFallback>
            {conversation.participantName?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onSelect}>
          <div className="flex items-center gap-2 mb-1">
            <p className={cn(
              "font-medium truncate",
              conversation.unreadCount > 0 && "text-primary"
            )}>
              {conversation.participantName || `${conversation.participantAddress.slice(0, 6)}...`}
            </p>
            
            {conversation.isPinned && <Pin className="w-3 h-3 text-yellow-600" />}
            {conversation.isFromPurchaser && (
              <Badge variant="secondary" className="text-xs">Purchased</Badge>
            )}
            
            <div className="flex gap-1">
              {conversation.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground truncate mb-1">
            {conversation.lastMessage}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{formatTimeAgo(conversation.lastMessageAt)}</span>
            <span>{conversation.totalMessages} messages</span>
            {conversation.contentPurchased && (
              <span>Purchased: {conversation.contentPurchased.title}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {conversation.unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {conversation.unreadCount}
            </Badge>
          )}
          
          {/* Quick Actions */}
          {showActions && (
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onMarkAsRead}>
                <Eye className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onPin}>
                <Pin className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onArchive}>
                <Archive className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Format time ago helper
 */
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}