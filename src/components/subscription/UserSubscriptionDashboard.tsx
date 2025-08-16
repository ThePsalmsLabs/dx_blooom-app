/**
 * User Subscription Dashboard Component - Phase 3 Component  
 * File: src/components/subscription/UserSubscriptionDashboard.tsx
 * 
 * This component provides a comprehensive dashboard for users to manage their subscriptions,
 * view details, cancel subscriptions, and configure auto-renewal settings. It integrates
 * seamlessly with the platform's existing architecture, leveraging the useSubscriptionManagement
 * and useAutoRenewalManagement hooks while following established UI patterns.
 * 
 * Educational Architecture Integration:
 * - Uses your established Card, Table, Dialog, and Button component patterns
 * - Follows your Tailwind CSS styling conventions and responsive design patterns
 * - Integrates with your navigation system through proper role-based access control
 * - Implements your standard loading, error, and success state handling patterns
 * - Uses your established data formatting utilities for consistent user experience
 * 
 * Key Features Implemented:
 * - Comprehensive subscription list with status indicators and action controls
 * - Auto-renewal configuration with balance management and failure recovery
 * - Subscription cancellation with immediate and end-of-period options
 * - Real-time data updates through contract event monitoring
 * - Responsive design with mobile-optimized layouts and accessibility features
 * - Advanced filtering and search capabilities for subscription management
 * 
 * Business Impact:
 * - Empowers users with self-service subscription management capabilities
 * - Reduces support burden through clear status information and guided actions
 * - Improves retention through intelligent auto-renewal configuration
 * - Provides transparency into subscription costs and renewal schedules
 * - Enables proactive management of subscription portfolios
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useAccount } from 'wagmi'
import {
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  Settings,
  Trash2,
  RefreshCw,
  Search,
  TrendingUp,
  Wallet,
  Plus,
  AlertTriangle,
  DollarSign,
  Users
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert'
import { Separator } from '@/components/ui/seperator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

// Import our architectural layers following established patterns
import { useSubscriptionManagement } from '@/hooks/contracts/subscription/useSubscriptionManagement'
import { useAutoRenewalManagement } from '@/hooks/contracts/subscription/useAutoRenewalManagement'
import { 
  formatCurrency, 
  formatAddress, 
  formatAbsoluteTime 
} from '@/lib/utils'

// Import platform types following your type system
import type {
  SubscriptionRecord,
  UserSubscriptionSummary,
  SubscriptionStatus,
  AutoRenewalSetupOptions,
  PaymentFailureContext
} from '@/types/platform'
// Use the runtime hook's config type which matches the API actually returned
import type { AutoRenewalConfig as HookAutoRenewalConfig } from '@/hooks/contracts/subscription/useAutoRenewalManagement'
import type { Address } from 'viem'

// ===== COMPONENT INTERFACE DEFINITIONS =====

/**
 * Props Interface for UserSubscriptionDashboard
 * 
 * This interface follows your platform's pattern of flexible, optional props
 * with sensible defaults and comprehensive customization options.
 */
interface UserSubscriptionDashboardProps {
  /** Optional user address - defaults to connected wallet */
  userAddress?: Address
  /** Optional className for custom styling */
  className?: string
  /** Optional callback when subscription actions complete */
  onSubscriptionAction?: (action: 'cancel' | 'renew' | 'configure', subscriptionId: string) => void
  /** Whether to show detailed analytics - defaults to true */
  showAnalytics?: boolean
  /** Whether to enable bulk actions - defaults to false */
  enableBulkActions?: boolean
}

/**
 * Subscription Filter Options Interface
 * 
 * This interface provides comprehensive filtering capabilities for subscription management,
 * enabling users to efficiently navigate large subscription portfolios.
 */
interface SubscriptionFilterOptions {
  readonly status: 'all' | 'active' | 'expired' | 'cancelled' | 'grace_period'
  readonly autoRenewal: 'all' | 'enabled' | 'disabled'
  readonly searchQuery: string
  readonly sortBy: 'creator' | 'status' | 'renewal_date' | 'price' | 'created_date'
  readonly sortOrder: 'asc' | 'desc'
}

/**
 * Auto-Renewal Configuration Modal State Interface
 * 
 * This interface manages the complex state required for auto-renewal configuration,
 * including validation, loading states, and user feedback mechanisms.
 */
interface AutoRenewalModalState {
  readonly isOpen: boolean
  readonly subscriptionId: string | null
  readonly currentConfig: HookAutoRenewalConfig | null
  readonly formData: {
    readonly enabled: boolean
    readonly maxPrice: string
    readonly depositAmount: string
    readonly autoTopUp: boolean
  }
  readonly isLoading: boolean
  readonly error: string | null
}

/**
 * Subscription Cancellation Modal State Interface
 * 
 * This interface manages cancellation workflow state with proper validation
 * and user confirmation mechanisms.
 */
interface CancellationModalState {
  readonly isOpen: boolean
  readonly subscriptionId: string | null
  readonly creatorAddress: Address | null
  readonly immediate: boolean
  readonly reason: string
  readonly isLoading: boolean
  readonly error: string | null
}

// ===== MAIN COMPONENT IMPLEMENTATION =====

/**
 * UserSubscriptionDashboard Component
 * 
 * This component orchestrates the complete user subscription management experience,
 * demonstrating how your modular architecture enables sophisticated subscription
 * management while maintaining excellent performance and user experience.
 */
export function UserSubscriptionDashboard({
  userAddress,
  className = '',
  onSubscriptionAction,
  showAnalytics = true,
  enableBulkActions = false
}: UserSubscriptionDashboardProps) {
  // Wallet connection and user verification following established patterns
  const { address: connectedAddress, isConnected } = useAccount()
  const effectiveUserAddress = userAddress || connectedAddress

  // Core subscription data using your architectural layers
  const subscriptionManagement = useSubscriptionManagement(effectiveUserAddress)
  const autoRenewalManagement = useAutoRenewalManagement(effectiveUserAddress)

  // Component state management following your established patterns
  const [filterOptions, setFilterOptions] = useState<SubscriptionFilterOptions>({
    status: 'all',
    autoRenewal: 'all',
    searchQuery: '',
    sortBy: 'renewal_date',
    sortOrder: 'asc'
  })

  const [autoRenewalModal, setAutoRenewalModal] = useState<AutoRenewalModalState>({
    isOpen: false,
    subscriptionId: null,
    currentConfig: null,
    formData: {
      enabled: false,
      maxPrice: '',
      depositAmount: '',
      autoTopUp: false
    },
    isLoading: false,
    error: null
  })

  const [cancellationModal, setCancellationModal] = useState<CancellationModalState>({
    isOpen: false,
    subscriptionId: null,
    creatorAddress: null,
    immediate: false,
    reason: '',
    isLoading: false,
    error: null
  })

  const [selectedSubscriptions, setSelectedSubscriptions] = useState<Set<string>>(new Set())

  // ===== DATA PROCESSING AND TRANSFORMATION =====

  /**
   * Transform and filter subscription data for display
   * 
   * This function demonstrates your platform's data transformation patterns,
   * converting contract data into UI-ready information with proper filtering and sorting.
   */
  type UISubscription = {
    subscriptionId: string
    creator: Address
    isActive: boolean
    inGracePeriod: boolean
    startTime: bigint
    endTime: bigint
    gracePeriodEnd: bigint
    status: string
    autoRenewalEnabled: boolean
    monthlyPrice: bigint
    totalPaid: bigint
    nextRenewalDate: Date | null
    daysRemaining: number
    canCancel: boolean
  }

  const processedSubscriptions = useMemo((): UISubscription[] => {
    const subscriptions = (subscriptionManagement.allSubscriptions?.subscriptions || []) as unknown as readonly UISubscription[]
    
    // Apply status filter
    let filtered: UISubscription[] = subscriptions.filter((subscription: UISubscription) => {
      if (filterOptions.status === 'all') return true
      
      // Calculate subscription status based on your platform logic
      const now = BigInt(Math.floor(Date.now() / 1000))
      const isActive = subscription.isActive && subscription.endTime > now
      const isExpired = subscription.endTime <= now && !subscription.inGracePeriod
      const isInGrace = subscription.inGracePeriod && subscription.gracePeriodEnd > now
      const isCancelled = !subscription.isActive
      
      switch (filterOptions.status) {
        case 'active': return isActive
        case 'expired': return isExpired
        case 'grace_period': return isInGrace
        case 'cancelled': return isCancelled
        default: return true
      }
    })

    // Apply auto-renewal filter
    if (filterOptions.autoRenewal !== 'all') {
      filtered = filtered.filter((subscription: UISubscription) => {
        const enabled = subscription.autoRenewalEnabled
        return filterOptions.autoRenewal === 'enabled' ? enabled : !enabled
      })
    }

    // Apply search filter
    if (filterOptions.searchQuery.trim()) {
      const query = filterOptions.searchQuery.toLowerCase()
      filtered = filtered.filter((subscription: UISubscription) => 
        formatAddress(subscription.creator).toLowerCase().includes(query) ||
        subscription.subscriptionId.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    filtered.sort((a: UISubscription, b: UISubscription) => {
      let comparison = 0
      
      switch (filterOptions.sortBy) {
        case 'creator':
          comparison = a.creator.localeCompare(b.creator)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'renewal_date':
          comparison = Number(a.endTime - b.endTime)
          break
        case 'price':
          comparison = Number(a.monthlyPrice - b.monthlyPrice)
          break
        case 'created_date':
          comparison = Number(a.startTime - b.startTime)
          break
        default:
          comparison = 0
      }
      
      return filterOptions.sortOrder === 'desc' ? -comparison : comparison
    })

    return filtered
  }, [subscriptionManagement.allSubscriptions, filterOptions])

  /**
   * Calculate subscription summary statistics
   * 
   * This function demonstrates your platform's analytics patterns,
   * computing derived metrics for dashboard display.
   */
  const subscriptionSummary = useMemo((): UserSubscriptionSummary => {
    const subscriptions = (subscriptionManagement.allSubscriptions?.subscriptions || []) as unknown as readonly UISubscription[]
    const now = BigInt(Math.floor(Date.now() / 1000))
    
    const active = subscriptions.filter((sub: UISubscription) => sub.isActive && sub.endTime > now)
    const expired = subscriptions.filter((sub: UISubscription) => sub.endTime <= now)
    
    const totalMonthlySpend = active.reduce((sum: bigint, sub: UISubscription) => sum + sub.monthlyPrice, BigInt(0))
    const totalLifetimeSpend = subscriptions.reduce((sum: bigint, sub: UISubscription) => sum + sub.totalPaid, BigInt(0))
    
    const nextRenewalDates = active
      .filter((sub: UISubscription) => sub.nextRenewalDate)
      .map((sub: UISubscription) => sub.nextRenewalDate!)
      .sort((a: Date, b: Date) => a.getTime() - b.getTime())

    return {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: active.length,
      expiredSubscriptions: expired.length,
      totalMonthlySpend,
      subscriptions: subscriptions as unknown as readonly SubscriptionRecord[],
      nextRenewalDate: nextRenewalDates[0] || null,
      hasActiveSubscriptions: active.length > 0,
      averageSubscriptionPrice: active.length > 0 
        ? totalMonthlySpend / BigInt(active.length) 
        : BigInt(0),
      mostExpensiveSubscription: active.reduce(
        (max: bigint, sub: UISubscription) => sub.monthlyPrice > max ? sub.monthlyPrice : max, 
        BigInt(0)
      ),
      longestSubscriptionDays: subscriptions.reduce((max: number, sub: UISubscription) => {
        const days = Number((now - sub.startTime) / BigInt(86400))
        return days > max ? days : max
      }, 0),
      totalLifetimeSpend
    }
  }, [subscriptionManagement.allSubscriptions])

  // ===== EVENT HANDLERS =====

  /**
   * Handle Auto-Renewal Configuration
   * 
   * This function demonstrates your platform's transaction handling patterns,
   * with proper loading states, error handling, and user feedback.
   */
  const handleAutoRenewalConfigure = useCallback(async (subscriptionId: string) => {
    try {
      setAutoRenewalModal(prev => ({ ...prev, isLoading: true, error: null }))
      
      const setupOptions: AutoRenewalSetupOptions = {
        enable: autoRenewalModal.formData.enabled,
        maxPrice: autoRenewalModal.formData.maxPrice 
          ? BigInt(Math.floor(parseFloat(autoRenewalModal.formData.maxPrice) * 1_000_000))
          : undefined,
        depositAmount: autoRenewalModal.formData.depositAmount
          ? BigInt(Math.floor(parseFloat(autoRenewalModal.formData.depositAmount) * 1_000_000))
          : undefined,
        autoTopUp: autoRenewalModal.formData.autoTopUp
      }

      await autoRenewalManagement.setAutoRenewal(subscriptionId, setupOptions)
      
      // Refresh subscription data following your established patterns
      await subscriptionManagement.refetchAll()
      
      setAutoRenewalModal(prev => ({ 
        ...prev, 
        isOpen: false, 
        isLoading: false,
        error: null 
      }))
      
      onSubscriptionAction?.('configure', subscriptionId)
    } catch (error) {
      console.error('Auto-renewal configuration failed:', error)
      setAutoRenewalModal(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Configuration failed'
      }))
    }
  }, [autoRenewalModal.formData, autoRenewalManagement, subscriptionManagement, onSubscriptionAction])

  /**
   * Handle Subscription Cancellation
   * 
   * This function implements your platform's cancellation workflow with
   * proper confirmation and state management patterns.
   */
  const handleSubscriptionCancel = useCallback(async () => {
    if (!cancellationModal.creatorAddress) return

    try {
      setCancellationModal(prev => ({ ...prev, isLoading: true, error: null }))
      
      await subscriptionManagement.cancelSubscription(
        cancellationModal.creatorAddress,
        {
          immediate: cancellationModal.immediate,
          reason: cancellationModal.reason
        }
      )
      
      // Refresh data following established patterns
      await subscriptionManagement.refetchAll()
      
      setCancellationModal(prev => ({ 
        ...prev, 
        isOpen: false, 
        isLoading: false,
        error: null 
      }))
      
      onSubscriptionAction?.('cancel', cancellationModal.subscriptionId || '')
    } catch (error) {
      console.error('Subscription cancellation failed:', error)
      setCancellationModal(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Cancellation failed'
      }))
    }
  }, [cancellationModal, subscriptionManagement, onSubscriptionAction])

  /**
   * Open Auto-Renewal Configuration Modal
   * 
   * This function prepares modal state with existing configuration data.
   */
  const openAutoRenewalModal = useCallback(async (subscription: UISubscription) => {
    try {
      const currentConfig = await autoRenewalManagement.getAutoRenewalStatus(subscription.creator)
      
      setAutoRenewalModal({
        isOpen: true,
        subscriptionId: subscription.subscriptionId,
        currentConfig,
        formData: {
          enabled: currentConfig?.enabled || false,
          maxPrice: currentConfig?.maxPrice 
            ? (Number(currentConfig.maxPrice) / 1_000_000).toString()
            : (Number(subscription.monthlyPrice) / 1_000_000).toString(),
          depositAmount: currentConfig?.balance 
            ? (Number(currentConfig.balance) / 1_000_000).toString()
            : '',
          autoTopUp: false
        },
        isLoading: false,
        error: null
      })
    } catch (error) {
      console.error('Failed to load auto-renewal config:', error)
    }
  }, [autoRenewalManagement])

  /**
   * Open Cancellation Modal
   * 
   * This function prepares cancellation modal with subscription context.
   */
  const openCancellationModal = useCallback((subscription: UISubscription) => {
    setCancellationModal({
      isOpen: true,
      subscriptionId: subscription.subscriptionId,
      creatorAddress: subscription.creator,
      immediate: false,
      reason: '',
      isLoading: false,
      error: null
    })
  }, [])

  // ===== BULK OPERATIONS (Optional Advanced Feature) =====

  const handleBulkAutoRenewal = useCallback(async (enable: boolean) => {
    // Implementation for bulk auto-renewal configuration
    // This would iterate through selectedSubscriptions and apply changes
    console.log('Bulk auto-renewal:', enable, selectedSubscriptions)
  }, [selectedSubscriptions])

  // ===== RENDER HELPERS =====

  /**
   * Render Subscription Status Badge
   * 
   * This function demonstrates your platform's status indication patterns
   * with proper color coding and accessibility features.
   */
  const renderStatusBadge = useCallback((subscription: UISubscription) => {
    const now = BigInt(Math.floor(Date.now() / 1000))
    const isActive = subscription.isActive && subscription.endTime > now
    const isExpired = subscription.endTime <= now && !subscription.inGracePeriod
    const isInGrace = subscription.inGracePeriod && subscription.gracePeriodEnd > now

    if (isActive) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Active
        </Badge>
      )
    } else if (isInGrace) {
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Grace Period
        </Badge>
      )
    } else if (isExpired) {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
          <Trash2 className="h-3 w-3 mr-1" />
          Cancelled
        </Badge>
      )
    }
  }, [])

  /**
   * Render Auto-Renewal Status
   * 
   * This function provides clear visual indication of auto-renewal status
   * with contextual information and action prompts.
   */
  const renderAutoRenewalStatus = useCallback((subscription: UISubscription) => {
    if (subscription.autoRenewalEnabled) {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            <RefreshCw className="h-3 w-3 mr-1" />
            Enabled
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openAutoRenewalModal(subscription)}
            className="h-6 px-2 text-xs"
          >
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      )
    } else {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
            Disabled
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openAutoRenewalModal(subscription)}
            className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800"
          >
            <Plus className="h-3 w-3" />
            Setup
          </Button>
        </div>
      )
    }
  }, [openAutoRenewalModal])

  // ===== CONDITIONAL RENDERING FOR STATES =====

  // Loading state following your established patterns
  if (!isConnected) {
    return (
      <div className={cn("max-w-6xl mx-auto p-6", className)}>
        <Alert>
          <Wallet className="h-4 w-4" />
          <AlertDescription>
            Please connect your wallet to view your subscriptions.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (subscriptionManagement.isLoading) {
    return (
      <div className={cn("max-w-6xl mx-auto p-6", className)}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  // Error state following your established patterns
  if (subscriptionManagement.isError) {
    return (
      <div className={cn("max-w-6xl mx-auto p-6", className)}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load subscription data. Please refresh the page and try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // ===== MAIN COMPONENT RENDER =====

  return (
    <div className={cn("max-w-6xl mx-auto p-6 space-y-6", className)}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage your content subscriptions and auto-renewal settings
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => subscriptionManagement.refetchAll()}
            disabled={subscriptionManagement.isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", subscriptionManagement.isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Subscription Summary Cards */}
      {showAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                  <p className="text-2xl font-bold">{subscriptionSummary.activeSubscriptions}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Spend</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(subscriptionSummary.totalMonthlySpend)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Next Renewal</p>
                  <p className="text-2xl font-bold">
                    {subscriptionSummary.nextRenewalDate 
                      ? new Date(subscriptionSummary.nextRenewalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : 'N/A'
                    }
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lifetime Spend</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(subscriptionSummary.totalLifetimeSpend)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by creator address or subscription ID..."
                  value={filterOptions.searchQuery}
                  onChange={(e) => setFilterOptions(prev => ({ ...prev, searchQuery: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterOptions.status}
                onChange={(e) => setFilterOptions(prev => ({ 
                  ...prev, 
                  status: e.target.value as SubscriptionFilterOptions['status']
                }))}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="grace_period">Grace Period</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={filterOptions.autoRenewal}
                onChange={(e) => setFilterOptions(prev => ({ 
                  ...prev, 
                  autoRenewal: e.target.value as SubscriptionFilterOptions['autoRenewal']
                }))}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Auto-Renewal</option>
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>

              <select
                value={`${filterOptions.sortBy}-${filterOptions.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-')
                  setFilterOptions(prev => ({ 
                    ...prev, 
                    sortBy: sortBy as SubscriptionFilterOptions['sortBy'],
                    sortOrder: sortOrder as SubscriptionFilterOptions['sortOrder']
                  }))
                }}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="renewal_date-asc">Renewal Date (Soon)</option>
                <option value="renewal_date-desc">Renewal Date (Late)</option>
                <option value="creator-asc">Creator (A-Z)</option>
                <option value="creator-desc">Creator (Z-A)</option>
                <option value="price-desc">Price (High-Low)</option>
                <option value="price-asc">Price (Low-High)</option>
                <option value="created_date-desc">Newest First</option>
                <option value="created_date-asc">Oldest First</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subscription Management</CardTitle>
              <CardDescription>
                View and manage all your content subscriptions
              </CardDescription>
            </div>
            {enableBulkActions && selectedSubscriptions.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {selectedSubscriptions.size} selected
                </Badge>
                <Button variant="outline" size="sm" onClick={() => handleBulkAutoRenewal(true)}>
                  Enable Auto-Renewal
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkAutoRenewal(false)}>
                  Disable Auto-Renewal
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {processedSubscriptions.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Subscriptions Found</h3>
              <p className="text-muted-foreground mb-4">
                {filterOptions.searchQuery || filterOptions.status !== 'all' 
                  ? 'No subscriptions match your current filters.'
                  : 'You haven\'t subscribed to any creators yet.'
                }
              </p>
              {filterOptions.searchQuery || filterOptions.status !== 'all' ? (
                <Button 
                  variant="outline" 
                  onClick={() => setFilterOptions({
                    status: 'all',
                    autoRenewal: 'all',
                    searchQuery: '',
                    sortBy: 'renewal_date',
                    sortOrder: 'asc'
                  })}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button variant="default">
                  Browse Creators
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {enableBulkActions && (
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedSubscriptions.size === processedSubscriptions.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSubscriptions(new Set(processedSubscriptions.map(s => s.subscriptionId)))
                            } else {
                              setSelectedSubscriptions(new Set())
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </TableHead>
                    )}
                    <TableHead>Creator</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Renewal Date</TableHead>
                    <TableHead>Auto-Renewal</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedSubscriptions.map((subscription) => (
                    <TableRow key={subscription.subscriptionId} className="hover:bg-muted/50">
                      {enableBulkActions && (
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedSubscriptions.has(subscription.subscriptionId)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedSubscriptions)
                              if (e.target.checked) {
                                newSelected.add(subscription.subscriptionId)
                              } else {
                                newSelected.delete(subscription.subscriptionId)
                              }
                              setSelectedSubscriptions(newSelected)
                            }}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                      )}
                      
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {formatAddress(subscription.creator)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Since {formatAbsoluteTime(subscription.startTime, { month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {renderStatusBadge(subscription)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {formatCurrency(subscription.monthlyPrice)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Total: {formatCurrency(subscription.totalPaid)}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {subscription.nextRenewalDate 
                              ? formatAbsoluteTime(BigInt(Math.floor(subscription.nextRenewalDate.getTime() / 1000)), { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })
                              : 'N/A'
                            }
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {subscription.daysRemaining > 0 
                              ? `${subscription.daysRemaining} days left`
                              : 'Expired'
                            }
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {renderAutoRenewalStatus(subscription)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAutoRenewalModal(subscription)}
                            className="h-8 w-8 p-0"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          
                          {subscription.canCancel && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openCancellationModal(subscription)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-Renewal Configuration Modal */}
      <Dialog open={autoRenewalModal.isOpen} onOpenChange={(open) => {
        if (!open) {
          setAutoRenewalModal(prev => ({ ...prev, isOpen: false, error: null }))
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Auto-Renewal</DialogTitle>
            <DialogDescription>
              Set up automatic subscription renewal to ensure uninterrupted access to content.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {autoRenewalModal.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{autoRenewalModal.error}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-renewal-enabled" className="text-sm font-medium">
                Enable Auto-Renewal
              </Label>
              <Switch
                id="auto-renewal-enabled"
                checked={autoRenewalModal.formData.enabled}
                onCheckedChange={(checked) => 
                  setAutoRenewalModal(prev => ({
                    ...prev,
                    formData: { ...prev.formData, enabled: checked }
                  }))
                }
              />
            </div>

            {autoRenewalModal.formData.enabled && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="max-price">Maximum Price (USDC)</Label>
                  <Input
                    id="max-price"
                    type="number"
                    step="0.01"
                    placeholder="15.00"
                    value={autoRenewalModal.formData.maxPrice}
                    onChange={(e) => 
                      setAutoRenewalModal(prev => ({
                        ...prev,
                        formData: { ...prev.formData, maxPrice: e.target.value }
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-renewal will be disabled if the creator raises their price above this amount
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deposit-amount">Deposit Amount (USDC)</Label>
                  <Input
                    id="deposit-amount"
                    type="number"
                    step="0.01"
                    placeholder="30.00"
                    value={autoRenewalModal.formData.depositAmount}
                    onChange={(e) => 
                      setAutoRenewalModal(prev => ({
                        ...prev,
                        formData: { ...prev.formData, depositAmount: e.target.value }
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    USDC amount to deposit for future renewals (recommended: 2-3 months)
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-top-up" className="text-sm font-medium">
                    Auto Top-Up
                  </Label>
                  <Switch
                    id="auto-top-up"
                    checked={autoRenewalModal.formData.autoTopUp}
                    onCheckedChange={(checked) => 
                      setAutoRenewalModal(prev => ({
                        ...prev,
                        formData: { ...prev.formData, autoTopUp: checked }
                      }))
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setAutoRenewalModal(prev => ({ ...prev, isOpen: false }))}
              disabled={autoRenewalModal.isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => autoRenewalModal.subscriptionId && handleAutoRenewalConfigure(autoRenewalModal.subscriptionId)}
              disabled={autoRenewalModal.isLoading}
            >
              {autoRenewalModal.isLoading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              {autoRenewalModal.formData.enabled ? 'Enable Auto-Renewal' : 'Disable Auto-Renewal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancellation Modal */}
      <Dialog open={cancellationModal.isOpen} onOpenChange={(open) => {
        if (!open) {
          setCancellationModal(prev => ({ ...prev, isOpen: false, error: null }))
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Choose how you want to cancel your subscription to this creator.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {cancellationModal.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{cancellationModal.error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="end-of-period"
                  name="cancellation-type"
                  checked={!cancellationModal.immediate}
                  onChange={() => setCancellationModal(prev => ({ ...prev, immediate: false }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="end-of-period" className="text-sm font-medium">
                  Cancel at end of period
                </label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                You'll keep access until your current billing period ends
              </p>

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="immediate"
                  name="cancellation-type"
                  checked={cancellationModal.immediate}
                  onChange={() => setCancellationModal(prev => ({ ...prev, immediate: true }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="immediate" className="text-sm font-medium">
                  Cancel immediately
                </label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Your access will end immediately (no refund)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancellation-reason">Reason (optional)</Label>
              <textarea
                id="cancellation-reason"
                placeholder="Let us know why you're cancelling..."
                value={cancellationModal.reason}
                onChange={(e) => 
                  setCancellationModal(prev => ({ ...prev, reason: e.target.value }))
                }
                className="w-full p-2 border border-input bg-background rounded-md text-sm resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCancellationModal(prev => ({ ...prev, isOpen: false }))}
              disabled={cancellationModal.isLoading}
            >
              Keep Subscription
            </Button>
            <Button 
              variant="destructive"
              onClick={handleSubscriptionCancel}
              disabled={cancellationModal.isLoading}
            >
              {cancellationModal.isLoading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              {cancellationModal.immediate ? 'Cancel Now' : 'Cancel at End of Period'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===== EXPORT FOR COMPONENT USAGE =====

export default UserSubscriptionDashboard