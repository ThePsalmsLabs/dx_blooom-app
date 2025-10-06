/**
 * PointsHistory.tsx - Premium Points Transaction History
 * 
 * Beautiful transaction history showing points earned and spent with
 * filtering, search, and export capabilities.
 */

'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { type Address } from 'viem'
import { useWatchContractEvent, useChainId } from 'wagmi'
import { getContractConfig } from '@/lib/contracts/config'
import { LOYALTY_MANAGER_ABI } from '@/lib/contracts/abis/v2ABIs/LoyaltyManager'
import {
  TrendingUp,
  TrendingDown,
  Search,
  Download,
  Calendar,
  Gift,
  Users,
  Star,
  Eye,
  MoreHorizontal
} from 'lucide-react'

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/seperator'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'

// Types for points transactions
export interface PointsTransaction {
  id: string
  type: 'earned' | 'spent' | 'bonus' | 'referral'
  amount: number
  reason: string
  details: string
  date: Date
  source?: string
  relatedId?: string
  metadata?: Record<string, any>
}

const TRANSACTION_ICONS = {
  earned: TrendingUp,
  spent: TrendingDown,
  bonus: Gift,
  referral: Users
}

const TRANSACTION_COLORS = {
  earned: 'text-green-600 bg-green-100',
  spent: 'text-red-600 bg-red-100',
  bonus: 'text-purple-600 bg-purple-100',
  referral: 'text-blue-600 bg-blue-100'
}

interface TransactionCardProps {
  transaction: PointsTransaction
  index: number
}

function TransactionCard({ transaction, index }: TransactionCardProps) {
  const Icon = TRANSACTION_ICONS[transaction.type]
  const colorClass = TRANSACTION_COLORS[transaction.type]
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
    >
      <Card className="hover:shadow-md transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-full ${colorClass}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-sm">{transaction.reason}</span>
                  <Badge variant="outline" className="text-xs">
                    {transaction.type}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mb-1">
                  {transaction.details}
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{transaction.date.toLocaleDateString()}</span>
                  <span>{transaction.date.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`font-bold text-lg ${
                transaction.type === 'earned' || transaction.type === 'bonus' || transaction.type === 'referral'
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {transaction.type === 'earned' || transaction.type === 'bonus' || transaction.type === 'referral' ? '+' : '-'}
                {transaction.amount.toLocaleString()}
              </div>
              <span className="text-xs text-muted-foreground font-medium">pts</span>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Eye className="h-3 w-3 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="h-3 w-3 mr-2" />
                    Export
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface PointsHistoryProps {
  userAddress: Address
  className?: string
}

export function PointsHistory({ userAddress, className = '' }: PointsHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('all')
  const [allTransactions, setAllTransactions] = useState<PointsTransaction[]>([])

  // Get contract config dynamically
  const chainId = useChainId()
  const contractConfig = getContractConfig(chainId, 'LOYALTY_MANAGER')
  
  // Listen to PointsEarned events
  useWatchContractEvent({
    address: contractConfig.address,
    abi: LOYALTY_MANAGER_ABI,
    eventName: 'PointsEarned',
    args: { user: userAddress },
    onLogs(logs) {
      const newTransactions = logs.map((log) => ({
        id: `earned-${log.transactionHash}-${log.logIndex}`,
        type: 'earned' as const,
        amount: Number(log.args.points),
        reason: log.args.reason || 'Points Earned',
        details: `Transaction: ${log.transactionHash?.slice(0, 10)}...`,
        date: new Date(Number(log.blockNumber) * 12000), // Approximate timestamp
        source: 'contract_event',
        relatedId: log.transactionHash
      }))
      
      setAllTransactions(prev => {
        const existing = prev.filter(tx => !tx.id.startsWith('earned-'))
        return [...existing, ...newTransactions].sort((a, b) => b.date.getTime() - a.date.getTime())
      })
    }
  })

  // Listen to PointsSpent events
  useWatchContractEvent({
    address: contractConfig.address,
    abi: LOYALTY_MANAGER_ABI,
    eventName: 'PointsSpent',
    args: { user: userAddress },
    onLogs(logs) {
      const newTransactions = logs.map((log) => ({
        id: `spent-${log.transactionHash}-${log.logIndex}`,
        type: 'spent' as const,
        amount: Number(log.args.points),
        reason: log.args.reason || 'Points Spent',
        details: `Transaction: ${log.transactionHash?.slice(0, 10)}...`,
        date: new Date(Number(log.blockNumber) * 12000), // Approximate timestamp
        source: 'contract_event',
        relatedId: log.transactionHash
      }))
      
      setAllTransactions(prev => {
        const existing = prev.filter(tx => !tx.id.startsWith('spent-'))
        return [...existing, ...newTransactions].sort((a, b) => b.date.getTime() - a.date.getTime())
      })
    }
  })

  // Listen to ReferralBonus events
  useWatchContractEvent({
    address: contractConfig.address,
    abi: LOYALTY_MANAGER_ABI,
    eventName: 'ReferralBonus',
    args: { referrer: userAddress },
    onLogs(logs) {
      const newTransactions = logs.map((log) => ({
        id: `referral-${log.transactionHash}-${log.logIndex}`,
        type: 'referral' as const,
        amount: Number(log.args.bonusPoints),
        reason: 'Referral Bonus',
        details: `Referred: ${log.args.referee?.slice(0, 10)}...`,
        date: new Date(Number(log.blockNumber) * 12000),
        source: 'contract_event',
        relatedId: log.transactionHash
      }))
      
      setAllTransactions(prev => {
        const existing = prev.filter(tx => !tx.id.startsWith('referral-'))
        return [...existing, ...newTransactions].sort((a, b) => b.date.getTime() - a.date.getTime())
      })
    }
  })

  // Filter and search logic
  const filteredTransactions = useMemo(() => {
    let filtered = allTransactions

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.type === filterType)
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date()
      const cutoffDate = new Date()
      
      switch (dateRange) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7)
          break
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1)
          break
        case '3months':
          cutoffDate.setMonth(now.getMonth() - 3)
          break
      }
      
      filtered = filtered.filter(tx => tx.date >= cutoffDate)
    }

    // Search functionality
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.details.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [searchTerm, filterType, dateRange, allTransactions])

  // Calculate totals
  const totals = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => {
      if (tx.type === 'earned' || tx.type === 'bonus' || tx.type === 'referral') {
        acc.earned += tx.amount
      } else {
        acc.spent += tx.amount
      }
      return acc
    }, { earned: 0, spent: 0 })
  }, [filteredTransactions])

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Type', 'Reason', 'Details', 'Amount'].join(','),
      ...filteredTransactions.map(tx => [
        tx.date.toISOString(),
        tx.type,
        `"${tx.reason}"`,
        `"${tx.details}"`,
        tx.amount
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `points-history-${userAddress.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-green-100 text-green-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Points Earned</div>
                <div className="text-xl font-bold text-green-600">
                  +{totals.earned.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-red-100 text-red-600">
                <TrendingDown className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Points Spent</div>
                <div className="text-xl font-bold text-red-600">
                  -{totals.spent.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-primary" />
              <span>Transaction History</span>
            </CardTitle>
            <Button onClick={exportTransactions} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm">Search Transactions</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by reason or details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-sm">Filter by Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="earned">Earned</SelectItem>
                  <SelectItem value="spent">Spent</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Transaction List */}
          <div className="space-y-3">
            <AnimatePresence>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction, index) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    index={index}
                  />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Star className="h-8 w-8 text-muted-foreground opacity-50" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || filterType !== 'all' || dateRange !== 'all'
                      ? 'Try adjusting your filters to see more results'
                      : 'Make your first purchase to start earning points!'
                    }
                  </p>
                  {(searchTerm || filterType !== 'all' || dateRange !== 'all') && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('')
                        setFilterType('all')
                        setDateRange('all')
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Results Count */}
          {filteredTransactions.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-green-600 font-medium">
                  Net: +{(totals.earned - totals.spent).toLocaleString()} pts
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PointsHistory