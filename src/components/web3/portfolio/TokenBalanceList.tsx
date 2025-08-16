/**
 * Token Balance List Component
 * 
 * This component displays a comprehensive list of token balances with filtering,
 * loading states, and error handling. Designed to be embedded in existing components
 * like WalletConnectModal and ContentPurchaseCard.
 * 
 * Integration Features:
 * - Matches your existing loading skeleton patterns
 * - Uses your established error handling UI
 * - Follows your button and layout conventions
 * - Integrates with your existing refresh patterns
 */

import React, { useState, useMemo } from 'react'
import { 
  Wallet, 
  RefreshCw, 
  TrendingUp, 
  AlertCircle, 
  Filter,
  Eye,
  EyeOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { useEnhancedTokenBalances, type TokenInfo, formatUSDValue } from '@/hooks/web3/useEnhancedTokenBalances'
import { TokenBalanceCard } from './TokenBalanceCard'

interface TokenBalanceListProps {
  readonly onTokenSelect?: (token: TokenInfo) => void
  readonly hideZeroBalances?: boolean
  readonly showHeader?: boolean
  readonly showRefreshButton?: boolean
  readonly showPortfolioValue?: boolean
  readonly maxItems?: number
  readonly className?: string
  readonly layout?: 'list' | 'grid' | 'compact'
  readonly variant?: 'default' | 'modal' | 'sidebar'
  readonly enableFiltering?: boolean
}

export const TokenBalanceList: React.FC<TokenBalanceListProps> = ({
  onTokenSelect,
  hideZeroBalances = true,
  showHeader = true,
  showRefreshButton = true,
  showPortfolioValue = true,
  maxItems,
  className,
  layout = 'list',
  variant = 'default',
  enableFiltering = false
}) => {
  const { 
    tokens, 
    totalPortfolioValue, 
    isLoading, 
    error, 
    refreshBalances 
  } = useEnhancedTokenBalances()
  
  const [showZeroBalances, setShowZeroBalances] = useState(!hideZeroBalances)
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'native' | 'stablecoin'>('all')
  
  // Filter tokens based on user preferences
  const displayTokens = useMemo(() => {
    let filtered = tokens
    
    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(token => token.category === selectedCategory)
    }
    
    // Hide tokens with zero balances if requested
    if (!showZeroBalances) {
      filtered = filtered.filter(token => parseFloat(token.balanceFormatted) > 0)
    }
    
    // Sort by USD value (highest first), then by symbol
    filtered.sort((a, b) => {
      const valueA = a.balanceUSD
      const valueB = b.balanceUSD
      
      if (valueA !== valueB) {
        return valueB - valueA
      }
      
      return a.symbol.localeCompare(b.symbol)
    })
    
    // Limit number of items if specified
    if (maxItems) {
      filtered = filtered.slice(0, maxItems)
    }
    
    return filtered
  }, [tokens, showZeroBalances, selectedCategory, maxItems])
  
  // Get portfolio insights
  const portfolioInsights = useMemo(() => {
    const tokensWithBalance = tokens.filter(token => parseFloat(token.balanceFormatted) > 0)
    const largestHolding = tokensWithBalance.reduce((max, token) => 
      token.balanceUSD > max.balanceUSD ? token : max, 
      tokensWithBalance[0] || null
    )
    
    return {
      totalTokens: tokensWithBalance.length,
      largestHolding,
      totalValue: totalPortfolioValue
    }
  }, [tokens, totalPortfolioValue])
  
  // Handle token selection
  const handleTokenSelect = (token: TokenInfo) => {
    onTokenSelect?.(token)
  }
  
  // Loading state display
  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {showHeader && (
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-20" />
          </div>
        )}
        {Array.from({ length: Math.min(maxItems || 3, 3) }).map((_, i) => (
          <Skeleton key={i} className={cn(
            layout === 'compact' ? "h-12" : "h-20",
            "w-full"
          )} />
        ))}
      </div>
    )
  }
  
  // Error state display
  if (error) {
    return (
      <div className={cn("space-y-3", className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to load token balances: {error}
          </AlertDescription>
        </Alert>
        {showRefreshButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={refreshBalances}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </div>
    )
  }
  
  // Empty state display
  if (displayTokens.length === 0) {
    return (
      <div className={cn("text-center py-6", className)}>
        <Wallet className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {!showZeroBalances ? 'No tokens with balance found' : 'No tokens found'}
        </p>
        {enableFiltering && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowZeroBalances(!showZeroBalances)}
            className="mt-2"
          >
            {!showZeroBalances ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show all tokens
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide zero balances
              </>
            )}
          </Button>
        )}
      </div>
    )
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header Section */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">
              {variant === 'modal' ? 'Your Balances' : 'Token Balances'}
            </h3>
            {showPortfolioValue && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold text-green-600">
                  {formatUSDValue(portfolioInsights.totalValue)}
                </span>
                <Badge variant="secondary" className="text-green-600 bg-green-50">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Portfolio
                </Badge>
              </div>
            )}
            {portfolioInsights.totalTokens > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {portfolioInsights.totalTokens} token{portfolioInsights.totalTokens !== 1 ? 's' : ''} with balance
                {portfolioInsights.largestHolding && (
                  <> • Largest: {portfolioInsights.largestHolding.symbol}</>
                )}
              </p>
            )}
          </div>
          
          {showRefreshButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={refreshBalances}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
          )}
        </div>
      )}
      
      {/* Filtering Controls */}
      {enableFiltering && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter:</span>
          </div>
          
          <div className="flex gap-1">
            {(['all', 'native', 'stablecoin'] as const).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize text-xs"
              >
                {category === 'all' ? 'All' : category}
              </Button>
            ))}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowZeroBalances(!showZeroBalances)}
            className="ml-auto text-xs"
          >
            {showZeroBalances ? (
              <>
                <EyeOff className="h-3 w-3 mr-1" />
                Hide zero
              </>
            ) : (
              <>
                <Eye className="h-3 w-3 mr-1" />
                Show all
              </>
            )}
          </Button>
        </div>
      )}
      
      {/* Token List */}
      <div className={cn(
        layout === 'grid' && "grid grid-cols-1 sm:grid-cols-2 gap-3",
        layout === 'list' && "space-y-3",
        layout === 'compact' && "space-y-2"
      )}>
        {displayTokens.map((token) => (
          <TokenBalanceCard
            key={token.address}
            token={token}
            onClick={() => handleTokenSelect(token)}
            variant={layout === 'compact' ? 'compact' : 'default'}
            showUSDValue={true}
            showPriceChange={layout !== 'compact'}
            showCopyAddress={variant === 'modal'}
          />
        ))}
      </div>
      
      {/* Show More Button */}
      {maxItems && tokens.length > maxItems && (
        <div className="text-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {/* Handle show more */}}
            className="text-sm"
          >
            Show {tokens.length - maxItems} more tokens
          </Button>
        </div>
      )}
    </div>
  )
}
