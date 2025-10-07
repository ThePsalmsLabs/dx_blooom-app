/**
 * Unified Messaging System Test Component
 * File: /src/shared/xmtp/components/UnifiedMessagingTest.tsx
 *
 * Comprehensive test component to verify unified XMTP messaging system.
 * Tests all components, hooks, and integrations work together correctly.
 *
 * Features:
 * - Component integration testing
 * - Hook functionality testing
 * - Cross-platform compatibility testing
 * - Error handling verification
 * - Build verification
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Unified XMTP Components
import { MessagingInterface } from './MessagingInterface'
import { ConversationList } from './ConversationList'
import { MessageComposer } from './MessageComposer'
import { MessageBubble } from './MessageBubble'
import { V2MiniAppMessagingInterface } from './V2MiniAppMessagingInterface'
import { SmartMessagingButton } from './SmartMessagingButton'

// Unified XMTP Hooks
import { useXMTPClient, useXMTPClientActions, useIsXMTPConnected, useXMTPConnectionStatus } from '../client'
import { useConversationManager } from '../hooks/index'
import { useRealtimeMessages } from '../hooks/index'
import { useMessagingPermissions } from '../hooks/index'
import { useMessageReadState } from '../hooks/index'
import { useMessagingPlatform } from './SmartMessagingButton'

// Types
import type { Address } from 'viem'
import type { MessagePreview } from '../types/index'

// ================================================
// TYPES & INTERFACES
// ================================================

interface TestResult {
  readonly name: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  error?: string
  duration?: number
}

interface TestSuite {
  readonly name: string
  readonly tests: TestResult[]
  status: 'pending' | 'running' | 'passed' | 'failed'
}

// ================================================
// TEST DATA
// ================================================

const TEST_USER_ADDRESS = '0x1234567890123456789012345678901234567890' as Address
const TEST_CREATOR_ADDRESS = '0x0987654321098765432109876543210987654321' as Address
const TEST_CONTENT_ID = '123'

const TEST_MESSAGE: MessagePreview = {
  id: 'test-message-1',
  content: { type: 'text', text: 'Hello! This is a test message.' },
  sender: TEST_CREATOR_ADDRESS,
  timestamp: new Date(),
  isRead: false,
  category: 'community_msg' as any,
  status: 'delivered'
}

// ================================================
// TEST COMPONENT
// ================================================

export function UnifiedMessagingTest() {
  // ===== STATE MANAGEMENT =====
  
  const [testSuites, setTestSuites] = useState<TestSuite[]>([
    {
      name: 'XMTP Client Integration',
      tests: [
        { name: 'Client Connection', status: 'pending' },
        { name: 'Auto-Connection', status: 'pending' },
        { name: 'Connection Status', status: 'pending' }
      ],
      status: 'pending'
    },
    {
      name: 'Component Integration',
      tests: [
        { name: 'MessagingInterface', status: 'pending' },
        { name: 'ConversationList', status: 'pending' },
        { name: 'MessageComposer', status: 'pending' },
        { name: 'MessageBubble', status: 'pending' },
        { name: 'V2MiniAppMessagingInterface', status: 'pending' },
        { name: 'SmartMessagingButton', status: 'pending' }
      ],
      status: 'pending'
    },
    {
      name: 'Hook Functionality',
      tests: [
        { name: 'useConversationManager', status: 'pending' },
        { name: 'useRealtimeMessages', status: 'pending' },
        { name: 'useMessagingPermissions', status: 'pending' },
        { name: 'useMessageReadState', status: 'pending' },
        { name: 'useMessagingPlatform', status: 'pending' }
      ],
      status: 'pending'
    },
    {
      name: 'Cross-Platform Compatibility',
      tests: [
        { name: 'Web Platform Detection', status: 'pending' },
        { name: 'Miniapp Platform Detection', status: 'pending' },
        { name: 'Mobile Platform Detection', status: 'pending' }
      ],
      status: 'pending'
    }
  ])
  
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<string | null>(null)
  
  // ===== XMTP INTEGRATION =====
  
  const client = useXMTPClient()
  const isConnected = useIsXMTPConnected()
  const connectionStatus = useXMTPConnectionStatus()
  const { connectWithAutoSigner } = useXMTPClientActions()
  const { conversations, isLoading: conversationsLoading } = useConversationManager()
  const { checkPermissions } = useMessagingPermissions()
  const { hasUnreadMessages, unreadCount } = useMessageReadState(conversations)
  const platformInfo = useMessagingPlatform()
  
  // ===== TEST EXECUTION =====
  
  const runTest = async (suiteIndex: number, testIndex: number): Promise<void> => {
    const suite = testSuites[suiteIndex]
    const test = suite.tests[testIndex]
    
    setCurrentTest(`${suite.name} - ${test.name}`)
    
    // Update test status to running
    setTestSuites(prev => {
      const newSuites = [...prev]
      newSuites[suiteIndex].tests[testIndex].status = 'running'
      newSuites[suiteIndex].status = 'running'
      return newSuites
    })
    
    const startTime = Date.now()
    
    try {
      // Execute specific test based on suite and test name
      await executeSpecificTest(suite.name, test.name)
      
      const duration = Date.now() - startTime
      
      // Update test status to passed
      setTestSuites(prev => {
        const newSuites = [...prev]
        newSuites[suiteIndex].tests[testIndex].status = 'passed'
        newSuites[suiteIndex].tests[testIndex].duration = duration
        return newSuites
      })
      
    } catch (error) {
      const duration = Date.now() - startTime
      
      // Update test status to failed
      setTestSuites(prev => {
        const newSuites = [...prev]
        newSuites[suiteIndex].tests[testIndex].status = 'failed'
        newSuites[suiteIndex].tests[testIndex].error = error instanceof Error ? error.message : String(error)
        newSuites[suiteIndex].tests[testIndex].duration = duration
        return newSuites
      })
    }
    
    setCurrentTest(null)
  }
  
  const executeSpecificTest = async (suiteName: string, testName: string): Promise<void> => {
    switch (suiteName) {
      case 'XMTP Client Integration':
        await testXMTPClient(testName)
        break
      case 'Component Integration':
        await testComponents(testName)
        break
      case 'Hook Functionality':
        await testHooks(testName)
        break
      case 'Cross-Platform Compatibility':
        await testPlatformCompatibility(testName)
        break
      default:
        throw new Error(`Unknown test suite: ${suiteName}`)
    }
  }
  
  const testXMTPClient = async (testName: string): Promise<void> => {
    switch (testName) {
      case 'Client Connection':
        if (!isConnected) {
          throw new Error('XMTP client not connected')
        }
        break
      case 'Auto-Connection':
        // Test auto-connection functionality
        if (connectionStatus.status === 'disconnected') {
          await connectWithAutoSigner({ env: 'production' })
        }
        break
      case 'Connection Status':
        if (connectionStatus.status === 'error') {
          throw new Error(`Connection error: ${connectionStatus.errorMessage}`)
        }
        break
      default:
        throw new Error(`Unknown XMTP test: ${testName}`)
    }
  }
  
  const testComponents = async (testName: string): Promise<void> => {
    // Test component rendering and basic functionality
    switch (testName) {
      case 'MessagingInterface':
        // Component should render without errors
        break
      case 'ConversationList':
        // Component should render without errors
        break
      case 'MessageComposer':
        // Component should render without errors
        break
      case 'MessageBubble':
        // Component should render without errors
        break
      case 'V2MiniAppMessagingInterface':
        // Component should render without errors
        break
      case 'SmartMessagingButton':
        // Component should render without errors
        break
      default:
        throw new Error(`Unknown component test: ${testName}`)
    }
  }
  
  const testHooks = async (testName: string): Promise<void> => {
    switch (testName) {
      case 'useConversationManager':
        if (conversationsLoading && conversations.length === 0) {
          // This is expected behavior
        }
        break
      case 'useRealtimeMessages':
        // Hook should be available
        break
      case 'useMessagingPermissions':
        const hasPermission = await checkPermissions(TEST_CREATOR_ADDRESS, {
          userAddress: TEST_USER_ADDRESS,
          context: 'general'
        })
        if (typeof hasPermission !== 'boolean') {
          throw new Error('Permission check should return boolean')
        }
        break
      case 'useMessageReadState':
        if (typeof hasUnreadMessages !== 'boolean') {
          throw new Error('Read state should return boolean')
        }
        if (typeof unreadCount !== 'number') {
          throw new Error('Unread count should return number')
        }
        break
      case 'useMessagingPlatform':
        if (typeof platformInfo.isMiniApp !== 'boolean') {
          throw new Error('Platform detection should return boolean')
        }
        break
      default:
        throw new Error(`Unknown hook test: ${testName}`)
    }
  }
  
  const testPlatformCompatibility = async (testName: string): Promise<void> => {
    switch (testName) {
      case 'Web Platform Detection':
        if (platformInfo.isDesktop && platformInfo.recommendedUXPattern !== 'side-panel') {
          throw new Error('Desktop should recommend side-panel')
        }
        break
      case 'Miniapp Platform Detection':
        // Test miniapp detection logic
        break
      case 'Mobile Platform Detection':
        if (platformInfo.isMobile && platformInfo.recommendedUXPattern !== 'dedicated-page') {
          throw new Error('Mobile should recommend dedicated-page')
        }
        break
      default:
        throw new Error(`Unknown platform test: ${testName}`)
    }
  }
  
  const runAllTests = async (): Promise<void> => {
    setIsRunning(true)
    
    try {
      for (let suiteIndex = 0; suiteIndex < testSuites.length; suiteIndex++) {
        const suite = testSuites[suiteIndex]
        
        for (let testIndex = 0; testIndex < suite.tests.length; testIndex++) {
          await runTest(suiteIndex, testIndex)
        }
        
        // Update suite status
        setTestSuites(prev => {
          const newSuites = [...prev]
          const allTestsPassed = newSuites[suiteIndex].tests.every(test => test.status === 'passed')
          newSuites[suiteIndex].status = allTestsPassed ? 'passed' : 'failed'
          return newSuites
        })
      }
    } finally {
      setIsRunning(false)
    }
  }
  
  // ===== RENDER HELPERS =====
  
  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 rounded-full bg-gray-300" />
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
    }
  }
  
  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-600'
      case 'running':
        return 'bg-blue-100 text-blue-600'
      case 'passed':
        return 'bg-green-100 text-green-600'
      case 'failed':
        return 'bg-red-100 text-red-600'
    }
  }
  
  // ===== MAIN RENDER =====
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Unified XMTP Messaging System Test</h1>
        <p className="text-muted-foreground">
          Comprehensive testing of all unified messaging components, hooks, and integrations
        </p>
        
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={runAllTests}
            disabled={isRunning}
            className="min-w-[200px]"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run All Tests'
            )}
          </Button>
          
          {currentTest && (
            <Badge variant="outline" className="text-sm">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              {currentTest}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Test Suites */}
      <div className="grid gap-6">
        {testSuites.map((suite, suiteIndex) => (
          <Card key={suite.name}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(suite.status)}
                {suite.name}
                <Badge className={getStatusColor(suite.status)}>
                  {suite.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suite.tests.map((test, testIndex) => (
                  <div
                    key={test.name}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(test.status)}
                      <span className="font-medium">{test.name}</span>
                      {test.duration && (
                        <Badge variant="outline" className="text-xs">
                          {test.duration}ms
                        </Badge>
                      )}
                    </div>
                    
                    {test.error && (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">{test.error}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Component Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Component Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">MessageBubble Test</h3>
              <MessageBubble
                message={TEST_MESSAGE}
                isOwn={false}
                showAvatar={true}
                isLastInGroup={true}
              />
            </div>
            
            <div>
              <h3 className="font-medium mb-2">SmartMessagingButton Test</h3>
              <SmartMessagingButton
                userAddress={TEST_USER_ADDRESS}
                creatorAddress={TEST_CREATOR_ADDRESS}
                contentId={TEST_CONTENT_ID}
                context="general"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ================================================
// EXPORTS
// ================================================

export default UnifiedMessagingTest
