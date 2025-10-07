/**
 * MiniApp Messages Page - Clean Unified System Implementation
 * File: src/app/mini/messages/page.tsx
 *
 * Simple, clean implementation using only our unified XMTP system.
 * No legacy compatibility layers or complex type mappings.
 */

'use client'

import React from 'react'
import SimpleMiniAppMessages from './SimpleMiniAppMessages'

export default function MessagesPage() {
  return (
    <div className="h-screen bg-gray-50">
      <SimpleMiniAppMessages />
    </div>
  )
}