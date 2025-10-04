/**
 * RefundHistoryTable.tsx - User refund history display
 * 
 * Displays a comprehensive table of user's refund requests with status tracking,
 * filtering, and search functionality. Integrates with useRefundManager hook.
 */

import { useState, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { 
  Search, 
  Filter, 
  Download, 
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  FileText,
  AlertCircle
} from 'lucide-react'
import { useRefundManager } from '@/hooks/contracts/v2/managers/useRefundManager'
import { RefundStatusBadge } from './RefundStatusBadge'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Separator } from '@/components/ui/seperator'
import { formatUnits } from 'viem'
import { format } from 'date-fns'

// RefundHistoryItem interface is now imported from useRefundManager

interface RefundHistoryTableProps {
  className?: string
}

type SortField = 'requestDate' | 'amount' | 'status' | 'contentTitle'
type SortDirection = 'asc' | 'desc'

export function RefundHistoryTable({ className }: RefundHistoryTableProps) {
  const { address: userAddress } = useAccount()
  const { useRefundHistory, useRefundEligibility } = useRefundManager()
  
  // Get real refund data from hooks
  const refundHistory = useRefundHistory(userAddress)
  const refundEligibility = useRefundEligibility(userAddress)

  // Use actual refund data, fallback to empty array if loading or no data
  const actualRefunds = refundHistory.data || []

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<Date | undefined>()
  const [sortField, setSortField] = useState<SortField>('requestDate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filtering and sorting logic
  const filteredAndSortedRefunds = useMemo(() => {
    let filtered = actualRefunds

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(refund =>
        refund.contentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        refund.contentCreator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        refund.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        refund.intentId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(refund => refund.status === statusFilter)
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(refund =>
        refund.requestDate.toDateString() === dateFilter.toDateString()
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
        case 'contentTitle':
          aValue = a.contentTitle.toLowerCase()
          bValue = b.contentTitle.toLowerCase()
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
  }, [actualRefunds, searchQuery, statusFilter, dateFilter, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // In production: await refundHistory.refetch()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleExport = () => {
    // Simple CSV export
    const csvContent = [
      ['Date', 'Content', 'Creator', 'Amount', 'Reason', 'Status', 'Intent ID'].join(','),
      ...filteredAndSortedRefunds.map(refund => [
        format(refund.requestDate, 'yyyy-MM-dd'),
        `"${refund.contentTitle}"`,
        `"${refund.contentCreator}"`,
        formatUnits(refund.amount, 6),
        `"${refund.reason}"`,
        refund.status,
        refund.intentId
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `refund-history-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const formatAmount = (amount: bigint) => {
    return `$${formatUnits(amount, 6)}`
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3" />
    return sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
  }

  if (!userAddress) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Wallet Not Connected</h3>
            <p className="text-muted-foreground">
              Please connect your wallet to view your refund history.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Refund History
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={filteredAndSortedRefunds.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        {refundEligibility && (
          <div className="flex gap-4 pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{actualRefunds.length}</div>
              <div className="text-sm text-muted-foreground">Total Requests</div>
            </div>
            <Separator orientation="vertical" className="h-12" />
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {actualRefunds.filter(r => r.status === 'processed').length}
              </div>
              <div className="text-sm text-muted-foreground">Processed</div>
            </div>
            <Separator orientation="vertical" className="h-12" />
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {actualRefunds.filter(r => r.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            {refundEligibility.hasPendingRefund && (
              <>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatAmount(refundEligibility.pendingAmount || BigInt(0))}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending Amount</div>
                </div>
              </>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by content, creator, reason, or Intent ID..."
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

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-40">
                <Calendar className="h-4 w-4 mr-2" />
                {dateFilter ? format(dateFilter, 'MMM dd') : 'All Dates'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={dateFilter}
                onSelect={setDateFilter}
                initialFocus
              />
              {dateFilter && (
                <div className="p-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDateFilter(undefined)}
                    className="w-full"
                  >
                    Clear Filter
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Table */}
        {filteredAndSortedRefunds.length > 0 ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
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
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('contentTitle')}
                      className="h-auto p-0 font-semibold"
                    >
                      Content {getSortIcon('contentTitle')}
                    </Button>
                  </TableHead>
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
                  <TableHead>Reason</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('status')}
                      className="h-auto p-0 font-semibold"
                    >
                      Status {getSortIcon('status')}
                    </Button>
                  </TableHead>
                  <TableHead>Intent ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedRefunds.map((refund) => (
                  <TableRow key={refund.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {format(refund.requestDate, 'MMM dd, yyyy')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(refund.requestDate, 'HH:mm')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{refund.contentTitle}</div>
                        <div className="text-sm text-muted-foreground">
                          by {refund.contentCreator}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">{formatAmount(refund.amount)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-32 truncate" title={refund.reason}>
                        {refund.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      <RefundStatusBadge status={refund.status} />
                      {refund.processedDate && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(refund.processedDate, 'MMM dd')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-mono">
                        {refund.intentId.slice(0, 6)}...{refund.intentId.slice(-4)}
                      </Badge>
                      {refund.transactionHash && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Tx: {refund.transactionHash.slice(0, 6)}...
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Refund History</h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== 'all' || dateFilter
                ? 'No refunds match your current filters.'
                : 'You haven\'t made any refund requests yet.'}
            </p>
            {(searchQuery || statusFilter !== 'all' || dateFilter) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                  setDateFilter(undefined)
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}