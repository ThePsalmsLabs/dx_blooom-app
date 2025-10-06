'use client'

/**
 * GasSavingsCalculator.tsx - Real-time Gas Savings Display
 * 
 * Shows users how much they save with gasless payments.
 * Features real-time gas price fetching and savings visualization.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Zap,
  Info,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { usePublicClient } from 'wagmi'
import { formatGwei, formatUnits } from 'viem'
import { usePriceOracle } from '@/hooks/contracts/v2/managers/usePriceOracle'

interface GasSavingsCalculatorProps {
  purchaseAmount: bigint
  className?: string
  showDetailed?: boolean
  variant?: 'compact' | 'detailed' | 'minimal'
}

interface GasData {
  approval: number
  transaction: number
  timestamp: number
  baseFee: number
  priorityFee: number
}

export function GasSavingsCalculator({
  purchaseAmount,
  className,
  showDetailed = false,
  variant = 'compact'
}: GasSavingsCalculatorProps) {
  // Use established contract hooks following the pattern
  const { useGetETHPrice } = usePriceOracle()
  const publicClient = usePublicClient()
  
  // Get real ETH price from price oracle (1 USDC reference)
  const { 
    data: ethPriceData, 
    isLoading: ethPriceLoading,
    error: ethPriceError 
  } = useGetETHPrice(BigInt(1000000)) // 1 USDC = 10^6
  
  // State for gas calculations
  const [gasData, setGasData] = useState<GasData | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Calculate gas savings using real-time data
  const calculateGasSavings = useCallback(async () => {
    if (!publicClient || !ethPriceData) return
    
    try {
      // Get current gas price from Base network
      const gasPrice = await publicClient.getGasPrice()
      const block = await publicClient.getBlock()
      
      // Estimate gas for typical transactions
      const approvalGasEstimate = BigInt(50000) // Standard ERC20 approval
      const purchaseGasEstimate = BigInt(150000) // Standard commerce transaction
      
      // Convert gas prices for display
      const baseFeeGwei = Number(formatGwei(block.baseFeePerGas || gasPrice))
      const priorityFeeGwei = baseFeeGwei * 0.1 // Typical priority fee
      
      // Calculate USD costs using real ETH price from price oracle
      // ethPriceData returns ETH amount for 1 USDC, so we need to invert it
      const ethAmountForOneUSDC = Number(formatUnits(ethPriceData as bigint, 18))
      const ethPriceUSD = 1 / ethAmountForOneUSDC // USD per ETH
      
      const gasToETH = (gasAmount: bigint, gasPriceWei: bigint) => 
        Number(formatUnits(gasAmount * gasPriceWei, 18))
      
      const approvalCostETH = gasToETH(approvalGasEstimate, gasPrice)
      const transactionCostETH = gasToETH(purchaseGasEstimate, gasPrice)
      
      const realGasData: GasData = {
        approval: approvalCostETH * ethPriceUSD,
        transaction: transactionCostETH * ethPriceUSD,
        timestamp: Date.now(),
        baseFee: baseFeeGwei,
        priorityFee: priorityFeeGwei
      }
      
      setGasData(realGasData)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to calculate gas savings:', err)
      // Don't set gasData on error - component will handle loading/error states
    }
  }, [publicClient, ethPriceData])

  // Calculate gas savings on mount and when data changes
  useEffect(() => {
    calculateGasSavings()
    
    const interval = setInterval(calculateGasSavings, 30000) // 30 seconds
    
    return () => clearInterval(interval)
  }, [calculateGasSavings])

  // Calculate savings
  const calculateSavings = () => {
    if (!gasData) return null
    
    const totalGasCost = gasData.approval + gasData.transaction
    const purchaseAmountUSD = Number(purchaseAmount) / 1e6
    const savingsPercentage = (totalGasCost / purchaseAmountUSD) * 100
    
    return {
      totalGasCost,
      purchaseAmountUSD,
      savingsPercentage,
      relativeImpact: savingsPercentage > 20 ? 'high' : savingsPercentage > 10 ? 'medium' : 'low'
    }
  }

  const savings = calculateSavings()
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount)
  }
  
  // Format percentage
  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100)
  }

  // Get impact color
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Zap className="h-4 w-4 text-green-600" />
        <span className="text-sm text-green-600 font-medium">
          Save {savings ? formatCurrency(savings.totalGasCost) : '$1.50'} in gas
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-3 w-3 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Gas fees paid by the platform for gasless payments</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">Gas Savings</span>
              </div>
              <Badge className="bg-green-100 text-green-800 text-xs">
                Gasless Payment
              </Badge>
            </div>

            {/* Savings Display */}
            {ethPriceLoading || !gasData ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                <span className="text-sm text-gray-500">Calculating savings...</span>
              </div>
            ) : ethPriceError ? (
              <div className="text-sm text-red-500">
                Unable to fetch current gas prices
              </div>
            ) : savings ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Standard payment gas:</span>
                  <span className="text-sm font-medium">{formatCurrency(savings.totalGasCost)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Gasless payment:</span>
                  <span className="text-sm font-medium text-green-600">FREE</span>
                </div>
                <div className="border-t pt-2 flex items-center justify-between">
                  <span className="text-sm font-medium">You save:</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(savings.totalGasCost)}
                  </span>
                </div>
                {savings.savingsPercentage > 5 && (
                  <div className={cn(
                    'text-xs p-2 rounded-lg border',
                    getImpactColor(savings.relativeImpact)
                  )}>
                    Gas fees represent {formatPercentage(savings.savingsPercentage)} of your purchase
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Unable to fetch current gas prices
              </div>
            )}

            {/* Last Updated */}
            {lastUpdated && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                <span>Updated {lastUpdated.toLocaleTimeString()}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={calculateGasSavings}
                  disabled={ethPriceLoading}
                >
                  <RefreshCw className={cn('h-3 w-3', ethPriceLoading && 'animate-spin')} />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Detailed variant
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingDown className="h-5 w-5 text-green-600" />
          Gas Cost Analysis
          <Badge className="bg-green-100 text-green-800 ml-auto">
            Gasless Available
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comparison Table */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Payment Method</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Standard</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Gasless</div>
          </div>

          {/* Gas Costs */}
          <div className="text-sm font-medium">Gas Fees</div>
          <div className="text-center">
            {ethPriceLoading || !gasData ? (
              <RefreshCw className="h-4 w-4 animate-spin mx-auto text-gray-400" />
            ) : gasData ? (
              <div className="space-y-1">
                <div className="text-sm">{formatCurrency(gasData.approval + gasData.transaction)}</div>
                <div className="text-xs text-gray-500">
                  Approval + Transaction
                </div>
              </div>
            ) : (
              <span className="text-sm text-gray-400">Loading...</span>
            )}
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-green-600">FREE</div>
            <div className="text-xs text-green-600">Platform covers gas</div>
          </div>

          {/* Total Cost */}
          <div className="text-sm font-medium">Total Cost</div>
          <div className="text-center">
            {savings ? (
              <div className="text-sm font-semibold">
                {formatCurrency(savings.purchaseAmountUSD + savings.totalGasCost)}
              </div>
            ) : (
              <span className="text-sm text-gray-400">Calculating...</span>
            )}
          </div>
          <div className="text-center">
            {savings ? (
              <div className="text-sm font-semibold text-green-600">
                {formatCurrency(savings.purchaseAmountUSD)}
              </div>
            ) : (
              <span className="text-sm text-gray-400">Calculating...</span>
            )}
          </div>
        </div>

        {/* Savings Highlight */}
        {savings && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-green-900">
                  Save {formatCurrency(savings.totalGasCost)} with Gasless Payment
                </h4>
                <p className="text-sm text-green-700">
                  That&apos;s {formatPercentage(savings.savingsPercentage)} of your purchase amount
                </p>
              </div>
              <Badge className={cn(
                'text-xs',
                getImpactColor(savings.relativeImpact)
              )}>
                {savings.relativeImpact.toUpperCase()} IMPACT
              </Badge>
            </div>
          </motion.div>
        )}

        {/* Gas Price Breakdown */}
        {showDetailed && gasData && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Current Gas Prices (Base Network)</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-gray-600">Base Fee</div>
                <div className="font-medium">{gasData.baseFee.toFixed(3)} gwei</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-gray-600">Priority Fee</div>
                <div className="font-medium">{gasData.priorityFee.toFixed(3)} gwei</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-gray-600">Approval Cost</div>
                <div className="font-medium">{formatCurrency(gasData.approval)}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-gray-600">Transaction Cost</div>
                <div className="font-medium">{formatCurrency(gasData.transaction)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Update Info */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>
              Last updated: {lastUpdated?.toLocaleTimeString() || 'Never'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={calculateGasSavings}
            disabled={ethPriceLoading}
          >
            <RefreshCw className={cn('h-3 w-3 mr-1', ethPriceLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}