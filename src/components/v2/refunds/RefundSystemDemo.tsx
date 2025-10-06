'use client'

/**
 * RefundSystemDemo.tsx - Complete demonstration of V2 Refund Management System
 * 
 * Showcases all refund components with interactive examples and mock data
 * to demonstrate the best-in-class UI/UX implementation.
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefundRequestModal } from './RefundRequestModal'
import { RefundHistoryTable } from './RefundHistoryTable'
import { AdminRefundPanel } from './AdminRefundPanel'
import { RefundStatusBadge } from './RefundStatusBadge'
import { V2ContentRefundButton } from './V2ContentRefundButton'
import { 
  DollarSign, 
  Activity, 
  TrendingUp,
  FileText,
  Settings,
  Play,
  Eye,
  RefreshCw
} from 'lucide-react'

export function RefundSystemDemo() {
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [activeDemo, setActiveDemo] = useState('overview')

  // Mock data for demonstration
  const mockPurchase = {
    intentId: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
    contentId: 'course-123',
    purchaseAmount: BigInt('25000000'), // $25 USDC (6 decimals)
    contentTitle: 'Advanced React Patterns Course',
    contentCreator: 'Alex Thompson',
    purchaseDate: new Date('2024-01-15'),
    creatorAmount: BigInt('24250000'), // ~97% after fees
    platformFee: BigInt('625000'), // 2.5%
    operatorFee: BigInt('125000'), // 0.5%
  }

  const demoStats = {
    totalRefunds: 1247,
    pendingRequests: 23,
    approvalRate: 87,
    avgProcessingTime: 1.2
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          V2 Refund Management System
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Best-in-class refund processing with advanced UI/UX, real-time analytics, 
          and seamless integration with V2 smart contracts on Base Mainnet.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            ✅ Production Ready
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            🔗 Contract Aligned
          </Badge>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            ⚡ Real-time Updates
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{demoStats.totalRefunds}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{demoStats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              Avg {demoStats.avgProcessingTime}h processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{demoStats.approvalRate}%</div>
            <p className="text-xs text-muted-foreground">
              Above industry average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <RefreshCw className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Demo Tabs */}
      <Tabs value={activeDemo} onValueChange={setActiveDemo} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="user-request" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            User Request
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Admin Panel
          </TabsTrigger>
          <TabsTrigger value="components" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Components
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                System Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Key Features</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700">✓</Badge>
                      Smart contract integration with RefundManager.sol
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700">✓</Badge>
                      Real-time refund processing and status updates
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700">✓</Badge>
                      Advanced admin dashboard with analytics
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700">✓</Badge>
                      Automated risk scoring and AI suggestions
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700">✓</Badge>
                      Batch processing and bulk operations
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700">✓</Badge>
                      Comprehensive audit trail and reporting
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">User Experience</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">🎨</Badge>
                      Modern, responsive design with smooth animations
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">⚡</Badge>
                      Instant feedback and status notifications
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">🔍</Badge>
                      Advanced search and filtering capabilities
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">📱</Badge>
                      Mobile-first responsive interface
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">🎯</Badge>
                      Contextual actions and smart defaults
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">♿</Badge>
                      Full accessibility compliance (WCAG 2.1)
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Request Tab */}
        <TabsContent value="user-request" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                User Refund Request Interface
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Experience the user-facing refund request interface with comprehensive form validation,
                fee breakdown, and clear process expectations.
              </p>
              
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <h4 className="font-semibold">Demo Purchase</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Content:</span>
                    <div className="font-medium">{mockPurchase.contentTitle}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Creator:</span>
                    <div className="font-medium">{mockPurchase.contentCreator}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Amount:</span>
                    <div className="font-medium">$25.00 USDC</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date:</span>
                    <div className="font-medium">{mockPurchase.purchaseDate.toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={() => setShowRefundModal(true)}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Open Refund Request Modal
                </Button>
                <V2ContentRefundButton
                  intentId={mockPurchase.intentId}
                  contentId={mockPurchase.contentId}
                  purchaseAmount={mockPurchase.purchaseAmount}
                  contentTitle={mockPurchase.contentTitle}
                  contentCreator={mockPurchase.contentCreator}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Refund History Interface
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                View the comprehensive refund history table with advanced filtering, sorting, and export capabilities.
              </p>
              <RefundHistoryTable />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Tab */}
        <TabsContent value="admin" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Admin Management Panel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Experience the full-featured admin interface with real-time metrics, batch operations, 
                and sophisticated refund processing tools.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Admin panel requires PAYMENT_MONITOR_ROLE. 
                  Connect with an admin wallet to access full functionality.
                </p>
              </div>
              <AdminRefundPanel />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Components Tab */}
        <TabsContent value="components" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Individual Components Showcase
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Badges */}
              <div className="space-y-3">
                <h4 className="font-semibold">Status Badge Variants</h4>
                <div className="flex flex-wrap gap-3">
                  <RefundStatusBadge status="pending" />
                  <RefundStatusBadge status="approved" />
                  <RefundStatusBadge status="rejected" />
                  <RefundStatusBadge status="processed" />
                </div>
              </div>

              {/* Interactive Elements */}
              <div className="space-y-3">
                <h4 className="font-semibold">Interactive Elements</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h5 className="font-medium mb-2">Quick Actions</h5>
                    <div className="space-y-2">
                      <Button size="sm" variant="outline" className="w-full">
                        Process Refund
                      </Button>
                      <Button size="sm" variant="outline" className="w-full">
                        Send Notification
                      </Button>
                      <Button size="sm" variant="outline" className="w-full">
                        Generate Report
                      </Button>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <h5 className="font-medium mb-2">Status Indicators</h5>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">System Online</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-sm">Processing Requests</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">Pending Review</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Feature Highlights */}
              <div className="space-y-3">
                <h4 className="font-semibold">Technical Highlights</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                    <h5 className="font-medium text-blue-900 mb-2">React Query Integration</h5>
                    <p className="text-blue-700">Optimistic updates, caching, and real-time synchronization</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                    <h5 className="font-medium text-green-900 mb-2">Framer Motion</h5>
                    <p className="text-green-700">Smooth animations and micro-interactions</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
                    <h5 className="font-medium text-purple-900 mb-2">TypeScript</h5>
                    <p className="text-purple-700">Full type safety and IntelliSense support</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Refund Request Modal */}
      <RefundRequestModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        intentId={mockPurchase.intentId}
        purchaseAmount={mockPurchase.purchaseAmount}
        contentTitle={mockPurchase.contentTitle}
        contentCreator={mockPurchase.contentCreator}
        purchaseDate={mockPurchase.purchaseDate}
        creatorAmount={mockPurchase.creatorAmount}
        platformFee={mockPurchase.platformFee}
        operatorFee={mockPurchase.operatorFee}
      />
    </div>
  )
}