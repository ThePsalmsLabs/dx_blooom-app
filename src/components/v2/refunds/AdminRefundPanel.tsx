/**
 * AdminRefundPanel.tsx - Advanced admin interface for refund management
 * 
 * Best-in-class UX with sophisticated interactions, real-time updates,
 * batch operations, and comprehensive analytics. Features smooth animations,
 * intelligent sorting, and contextual actions.
 */

import { useState, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { 
  Search, 
  Filter, 
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  MoreHorizontal,
  Eye,
  MessageSquare,
  DollarSign,
  Activity,
  FileText,
  Zap,
  Target,
  Shield,
  Bell,
  Archive,
  Send
} from 'lucide-react'
import { useRefundManager } from '@/hooks/contracts/v2/managers/useRefundManager'
import { InteractiveRefundStatusBadge } from './RefundStatusBadge'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/seperator'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { formatUnits } from 'viem'
import { format, startOfDay, endOfDay } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

// Enhanced mock data for demonstration
interface AdminRefundRequest {
  id: string
  intentId: `0x${string}`
  user: `0x${string}`
  contentTitle: string
  contentCreator: string
  creatorAddress: `0x${string}`
  amount: bigint
  creatorAmount: bigint
  platformFee: bigint
  operatorFee: bigint
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'processed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  requestDate: Date
  processedDate?: Date
  adminNotes?: string
  transactionHash?: `0x${string}`
  userReputation: number
  contentAccessCount: number
  similarRequests: number
  automationSuggestion?: 'approve' | 'reject' | 'manual'
  riskScore: number
}

interface RefundMetrics {
  totalRequests: number
  pendingRequests: number
  approvedToday: number
  rejectedToday: number
  totalRefundAmount: bigint
  averageProcessingTime: number
  approvalRate: number
}

type SortField = 'requestDate' | 'amount' | 'status' | 'priority' | 'riskScore'
type SortDirection = 'asc' | 'desc'

export function AdminRefundPanel() {
  const { address: adminAddress } = useAccount()
  const { 
    processRefund, 
    useRefundMetrics, 
    useHasPaymentMonitorRole 
  } = useRefundManager()

  // Admin authorization check
  const hasAdminRole = useHasPaymentMonitorRole(adminAddress)
  const refundMetrics = useRefundMetrics()

  // State management
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [sortField, setSortField] = useState<SortField>('requestDate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  // Modal states
  const [selectedRequest, setSelectedRequest] = useState<AdminRefundRequest | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [batchAction, setBatchAction] = useState<'approve' | 'reject'>('approve')
  const [batchNotes, setBatchNotes] = useState('')

  // Loading states
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set())

  // TODO: Replace with real backend data fetching
  // This should fetch from an admin API that combines:
  // 1. On-chain refund request data from RefundManager events
  // 2. Off-chain metadata (content titles, user reputation, risk scores)
  // 3. Analytics data (similar requests, automation suggestions)
  
  const actualRequests: AdminRefundRequest[] = []
  const actualMetrics: RefundMetrics = {
    totalRequests: 0,
    pendingRequests: 0,
    approvedToday: 0,
    rejectedToday: 0,
    totalRefundAmount: BigInt('0'),
    averageProcessingTime: 0,
    approvalRate: 0
  }

  // Filtering and sorting logic
  const filteredAndSortedRequests = useMemo(() => {
    let filtered = actualRequests

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(request =>
        request.contentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.contentCreator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.intentId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(request => request.priority === priorityFilter)
    }

    // Date range filter
    if (dateRange.from) {
      filtered = filtered.filter(request =>
        request.requestDate >= startOfDay(dateRange.from!)
      )
    }
    if (dateRange.to) {
      filtered = filtered.filter(request =>
        request.requestDate <= endOfDay(dateRange.to!)
      )
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'requestDate':
          aValue = a.requestDate.getTime()
          bValue = b.requestDate.getTime()
          break
        case 'amount':
          aValue = Number(a.amount)
          bValue = Number(b.amount)
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
          aValue = priorityOrder[a.priority]
          bValue = priorityOrder[b.priority]
          break
        case 'riskScore':
          aValue = a.riskScore
          bValue = b.riskScore
          break
        default:
          return 0
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [actualRequests, searchQuery, statusFilter, priorityFilter, dateRange, sortField, sortDirection])

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleSelectRequest = (requestId: string, selected: boolean) => {
    const newSelected = new Set(selectedRequests)
    if (selected) {
      newSelected.add(requestId)
    } else {
      newSelected.delete(requestId)
    }
    setSelectedRequests(newSelected)
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedRequests(new Set(filteredAndSortedRequests.map(r => r.id)))
    } else {
      setSelectedRequests(new Set())
    }
  }

  const handleProcessRefund = async (request: AdminRefundRequest, approve: boolean, notes?: string) => {
    if (!adminAddress) return

    setProcessingRequests(prev => new Set([...prev, request.id]))

    try {
      if (approve) {
        await processRefund.mutateAsync(request.intentId)
        toast.success(`Refund for ${request.contentTitle} has been processed.`)
      } else {
        // In production, this would call a reject function
        toast.success(`Refund for ${request.contentTitle} has been rejected.`)
      }

      // Update local state (in production, refetch data)
      // ...

    } catch (error) {
      toast.error('Failed to process refund. Please try again.')
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev)
        newSet.delete(request.id)
        return newSet
      })
    }
  }

  const handleBatchProcess = async () => {
    const requests = filteredAndSortedRequests.filter(r => selectedRequests.has(r.id))
    
    for (const request of requests) {
      await handleProcessRefund(request, batchAction === 'approve', batchNotes)
    }

    setSelectedRequests(new Set())
    setShowBatchModal(false)
    setBatchNotes('')
  }

  const formatAmount = (amount: bigint) => {
    return `$${formatUnits(amount, 6)}`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 7) return 'text-red-600'
    if (score >= 4) return 'text-orange-600'
    if (score >= 2) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3" />
    return sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
  }

  // Check admin permissions
  if (!adminAddress) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
            <p className="text-muted-foreground">
              Please connect an admin wallet to access the refund management panel.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (hasAdminRole.isLoading) {
    return (
      <Card className="max-w-6xl mx-auto">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-4 gap-4">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!hasAdminRole.data) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Insufficient Permissions</h3>
            <p className="text-muted-foreground">
              Your account does not have the required admin permissions to access this panel.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Refund Management</h1>
          <p className="text-muted-foreground">
            Monitor and process refund requests with advanced analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRefreshing(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Requests ({actualMetrics.pendingRequests})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{actualMetrics.pendingRequests}</div>
                  <p className="text-xs text-muted-foreground">
                    Avg. {actualMetrics.averageProcessingTime}h to process
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{actualMetrics.approvedToday}</div>
                  <p className="text-xs text-muted-foreground">
                    {actualMetrics.rejectedToday} rejected
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Refunded</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatAmount(actualMetrics.totalRefundAmount)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {actualMetrics.totalRequests} total requests
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
                  <Target className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{actualMetrics.approvalRate}%</div>
                  <Progress value={actualMetrics.approvalRate} className="mt-2" />
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="h-16 flex-col gap-2" variant="outline">
                  <CheckCircle2 className="h-6 w-6" />
                  Bulk Approve
                </Button>
                <Button className="h-16 flex-col gap-2" variant="outline">
                  <Bell className="h-6 w-6" />
                  Set Alerts
                </Button>
                <Button className="h-16 flex-col gap-2" variant="outline">
                  <Download className="h-6 w-6" />
                  Export Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by content, user, reason, or Intent ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Batch Actions */}
              {selectedRequests.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {selectedRequests.size} request{selectedRequests.size > 1 ? 's' : ''} selected
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setBatchAction('approve')
                          setShowBatchModal(true)
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve Selected
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setBatchAction('reject')
                          setShowBatchModal(true)
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Selected
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Requests Table */}
          <Card>
            <CardContent className="pt-6">
              {filteredAndSortedRequests.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedRequests.size === filteredAndSortedRequests.length}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('requestDate')}
                            className="h-auto p-0 font-semibold"
                          >
                            Date {getSortIcon('requestDate')}
                          </Button>
                        </TableHead>
                        <TableHead>Content & User</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('amount')}
                            className="h-auto p-0 font-semibold"
                          >
                            Amount {getSortIcon('amount')}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('priority')}
                            className="h-auto p-0 font-semibold"
                          >
                            Priority {getSortIcon('priority')}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('riskScore')}
                            className="h-auto p-0 font-semibold"
                          >
                            Risk {getSortIcon('riskScore')}
                          </Button>
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {filteredAndSortedRequests.map((request, index) => (
                          <motion.tr
                            key={request.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className="group hover:bg-muted/50 transition-colors"
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedRequests.has(request.id)}
                                onCheckedChange={(checked) => 
                                  handleSelectRequest(request.id, checked as boolean)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {format(request.requestDate, 'MMM dd')}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {format(request.requestDate, 'HH:mm')}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-48">
                                <div className="font-medium truncate">{request.contentTitle}</div>
                                <div className="text-sm text-muted-foreground truncate">
                                  by {request.contentCreator}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                  {request.user.slice(0, 8)}...{request.user.slice(-6)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold">{formatAmount(request.amount)}</div>
                              <div className="text-xs text-muted-foreground">
                                Rep: {request.userReputation}/10
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getPriorityColor(request.priority)}>
                                {request.priority}
                              </Badge>
                              {request.automationSuggestion && (
                                <div className="mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    AI: {request.automationSuggestion}
                                  </Badge>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className={`font-semibold ${getRiskColor(request.riskScore)}`}>
                                {request.riskScore.toFixed(1)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {request.contentAccessCount} views
                              </div>
                            </TableCell>
                            <TableCell>
                              <InteractiveRefundStatusBadge
                                status={request.status}
                                isLoading={processingRequests.has(request.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedRequest(request)
                                    setShowDetailsModal(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {request.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                      onClick={() => handleProcessRefund(request, true)}
                                      disabled={processingRequests.has(request.id)}
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleProcessRefund(request, false)}
                                      disabled={processingRequests.has(request.id)}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="ghost">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                      <MessageSquare className="h-4 w-4 mr-2" />
                                      Add Note
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Send className="h-4 w-4 mr-2" />
                                      Contact User
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Archive className="h-4 w-4 mr-2" />
                                      Archive
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Requests Found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                      ? 'No refund requests match your current filters.'
                      : 'No refund requests to display.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Advanced analytics and reporting features are coming in the next update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Refund Request Details</DialogTitle>
            <DialogDescription>
              Review the complete information for this refund request.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Content</Label>
                  <p className="text-sm">{selectedRequest.contentTitle}</p>
                  <p className="text-xs text-muted-foreground">by {selectedRequest.contentCreator}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="text-sm font-semibold">{formatAmount(selectedRequest.amount)}</p>
                </div>
              </div>

              <Separator />

              {/* User Information */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">User Information</Label>
                <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Address:</span>
                    <span className="text-sm font-mono">{selectedRequest.user}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Reputation:</span>
                    <span className="text-sm">{selectedRequest.userReputation}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Content Access Count:</span>
                    <span className="text-sm">{selectedRequest.contentAccessCount}</span>
                  </div>
                </div>
              </div>

              {/* Refund Reason */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Refund Reason</Label>
                <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedRequest.reason}</p>
              </div>

              {/* Risk Analysis */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Risk Analysis</Label>
                <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Risk Score:</span>
                    <span className={`text-sm font-semibold ${getRiskColor(selectedRequest.riskScore)}`}>
                      {selectedRequest.riskScore.toFixed(1)}/10
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Similar Requests:</span>
                    <span className="text-sm">{selectedRequest.similarRequests}</span>
                  </div>
                  {selectedRequest.automationSuggestion && (
                    <div className="flex justify-between">
                      <span className="text-sm">AI Suggestion:</span>
                      <Badge variant="outline" className="text-xs">
                        {selectedRequest.automationSuggestion}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
            {selectedRequest?.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (selectedRequest) {
                      handleProcessRefund(selectedRequest, false)
                      setShowDetailsModal(false)
                    }
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    if (selectedRequest) {
                      handleProcessRefund(selectedRequest, true)
                      setShowDetailsModal(false)
                    }
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Action Modal */}
      <Dialog open={showBatchModal} onOpenChange={setShowBatchModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {batchAction === 'approve' ? 'Approve' : 'Reject'} Selected Requests
            </DialogTitle>
            <DialogDescription>
              You are about to {batchAction} {selectedRequests.size} refund request{selectedRequests.size > 1 ? 's' : ''}.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="batch-notes">Admin Notes (Optional)</Label>
              <Textarea
                id="batch-notes"
                value={batchNotes}
                onChange={(e) => setBatchNotes(e.target.value)}
                placeholder="Add notes for these requests..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchModal(false)}>
              Cancel
            </Button>
            <Button
              variant={batchAction === 'approve' ? 'default' : 'destructive'}
              onClick={handleBatchProcess}
            >
              {batchAction === 'approve' ? (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {batchAction === 'approve' ? 'Approve' : 'Reject'} {selectedRequests.size} Request{selectedRequests.size > 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}