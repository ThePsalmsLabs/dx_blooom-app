/**
 * Simple MiniApp Messages - Direct Unified System Usage
 * File: src/app/mini/messages/SimpleMiniAppMessages.tsx
 *
 * Clean implementation using only our unified XMTP system.
 * No legacy type mappings or complex compatibility layers.
 */

'use client'

import React from 'react'
import { useXMTPClient, useConversationManager, useXMTPStatus } from '@/shared/xmtp'
import { useFarcasterAutoWallet } from '@/hooks/miniapp/useFarcasterAutoWallet'
import type { ConversationPreview } from '@/shared/xmtp/types'

interface ConversationListItemProps {
  conversation: ConversationPreview
  onSelect: (conversationId: string) => void
}

function ConversationListItem({ conversation, onSelect }: ConversationListItemProps) {
  const { peerAddress, lastMessage, unreadCount, lastMessageTime } = conversation
  
  return (
    <div 
      className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
      onClick={() => onSelect(conversation.id)}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="font-medium text-sm">
            {peerAddress.slice(0, 6)}...{peerAddress.slice(-4)}
          </div>
          {lastMessage && (
            <div className="text-gray-600 text-sm mt-1 truncate">
              {lastMessage.content}
            </div>
          )}
          {lastMessageTime && (
            <div className="text-gray-400 text-xs mt-1">
              {lastMessageTime.toLocaleDateString()}
            </div>
          )}
        </div>
        {unreadCount > 0 && (
          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 ml-2">
            {unreadCount}
          </span>
        )}
      </div>
    </div>
  )
}

export default function SimpleMiniAppMessages() {
  const { isConnected: walletConnected } = useFarcasterAutoWallet()
  const client = useXMTPClient()
  const { isConnected: xmtpConnected, connectionStatus } = useXMTPStatus()
  const { conversations, isLoading } = useConversationManager()

  const handleConversationSelect = (conversationId: string) => {
    console.log('Selected conversation:', conversationId)
    // TODO: Navigate to conversation detail view
  }

  if (!walletConnected) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-lg font-semibold mb-2">Connect Your Wallet</h2>
        <p className="text-gray-600">Please connect your wallet to access messaging.</p>
      </div>
    )
  }

  if (!xmtpConnected) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-lg font-semibold mb-2">XMTP Status</h2>
        <p className="text-gray-600">
          Status: {connectionStatus.status}
        </p>
        {connectionStatus.status === 'error' && (
          <p className="text-red-600 mt-2">
            Error: {connectionStatus.errorMessage}
          </p>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="border-b border-gray-200 pb-4">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold">Messages</h1>
        <p className="text-sm text-gray-600">
          {conversations.length} conversations
        </p>
      </div>
      
      <div className="overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No conversations yet.</p>
            <p className="text-sm mt-2">Start messaging to see conversations here.</p>
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
    </div>
  )
}