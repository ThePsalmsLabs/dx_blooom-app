/**
 * Unified Messaging Test Page
 * File: /src/app/test-unified-messaging/page.tsx
 *
 * Test page for unified XMTP messaging system.
 * Provides comprehensive testing of all components and integrations.
 */

'use client'

import React from 'react'
import { UnifiedMessagingTest } from '@/shared/xmtp/components/UnifiedMessagingTest'

export default function TestUnifiedMessagingPage() {
  return (
    <div className="min-h-screen bg-background">
      <UnifiedMessagingTest />
    </div>
  )
}
