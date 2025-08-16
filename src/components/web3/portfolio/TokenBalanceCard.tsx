/**
 * Individual Token Balance Card Component
 * 
 * This component displays information for a single token, designed to match
 * your existing Card components and design system perfectly.
 * 
 * Design Integration:
 * - Uses your existing Card, Badge, and Button components
 * - Follows your established styling patterns from ContentPurchaseCard
 * - Integrates with your icon system and color scheme
 * - Matches the hover and interaction patterns from your other cards
 */

import React from 'react'
import { TrendingUp, TrendingDown, CheckCircle, Copy, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TokenInfo } from '@/hooks/web3/useTokenBalances'
import { formatTokenAmount, formatUSDValue } from '@/hooks/web3/useTokenBalances'

interface TokenBalanceCardProps {
  readonly token: TokenInfo
  readonly onClick?: () => void
  readonly onCopy?: () => void
  readonly className?: string
  readonly showUSDValue?: boolean
  readonly showPriceChange?: boolean
  readonly showCopyAddress?: boolean
  readonly variant?: 'default' | 'compact' | 'minimal'
}

export const TokenBalanceCard: React.FC<TokenBalanceCardProps> = ({
  token,
  onClick,
  onCopy,
  className,
  showUSDValue = true,
  showPriceChange = true,
  showCopyAddress = false,
  variant = 'default'
}) => {
  const isPositive = token.priceChange24h >= 0
  const hasBalance = parseFloat(token.balanceFormatted) > 0
  const isClickable = !!onClick
  
  // Token icon fallback based on symbol
  const getTokenIcon = () => {
    switch (token.symbol) {
      case 'ETH':
        return '⟠'
      case 'USDC':
        return '💲'
      case 'WETH':
        return '⟠'
      default:
        return token.symbol.slice(0, 2).toUpperCase()
    }
  }
  
  // Get appropriate styling based on token category
  const getTokenGradient = () => {
    switch (token.category) {
      case 'native':
        return 'from-blue-500 to-purple-600'
      case 'stablecoin':
        return 'from-green-500 to-emerald-600'
      default:
        return 'from-gray-500 to-slate-600'
    }
  }
  
  const handleCardClick = () => {
    if (isClickable) {
      onClick?.()
    }
  }
  
  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCopy?.()
  }
  
  if (variant === 'minimal') {
    return (
      <div className={cn(
        "flex items-center justify-between py-2 px-3 rounded-lg border bg-card",
        isClickable && "cursor-pointer hover:bg-accent/50 transition-colors",
        !hasBalance && "opacity-60",
        className
      )} onClick={handleCardClick}>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-6 h-6 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold",
            getTokenGradient()
          )}>
            {getTokenIcon()}
          </div>
          <span className="font-medium text-sm">{token.symbol}</span>
        </div>
        <div className="text-right">
          <div className="font-semibold text-sm">
            {formatTokenAmount(token.balanceFormatted, token.symbol)}
          </div>
          {showUSDValue && (
            <div className="text-xs text-muted-foreground">
              {formatUSDValue(token.balanceUSD)}
            </div>
          )}
        </div>
      </div>
    )
  }
  
  if (variant === 'compact') {
    return (
      <Card className={cn(
        "transition-all duration-200",
        isClickable && "cursor-pointer hover:shadow-md hover:scale-[1.01]",
        "border border-border bg-card",
        !hasBalance && "opacity-60",
        className
      )} onClick={handleCardClick}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className={cn(
                  "w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold",
                  getTokenGradient()
                )}>
                  {getTokenIcon()}
                </div>
                {token.isVerified && (
                  <CheckCircle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-blue-500 bg-white rounded-full" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-sm">{token.symbol}</span>
                  {token.isNative && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">Native</Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-semibold text-sm">
                {formatTokenAmount(token.balanceFormatted, token.symbol)}
              </div>
              {showUSDValue && (
                <div className="text-xs text-muted-foreground">
                  {formatUSDValue(token.balanceUSD)}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Default variant - full card
  return (
    <Card className={cn(
      "transition-all duration-200",
      isClickable && "cursor-pointer hover:shadow-md hover:scale-[1.01]",
      "border border-border bg-card",
      !hasBalance && "opacity-60",
      className
    )} onClick={handleCardClick}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Token Information Section */}
          <div className="flex items-center gap-3">
            {/* Token Icon */}
            <div className="relative">
              <div className={cn(
                "w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg",
                getTokenGradient()
              )}>
                {getTokenIcon()}
              </div>
              {/* Verified Badge */}
              {token.isVerified && (
                <CheckCircle className="absolute -bottom-1 -right-1 h-4 w-4 text-blue-500 bg-white rounded-full" />
              )}
            </div>
            
            {/* Token Details */}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">{token.symbol}</span>
                {token.isNative && (
                  <Badge variant="secondary" className="text-xs">Native</Badge>
                )}
                {token.category === 'stablecoin' && (
                  <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                    Stable
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{token.name}</p>
              
              {/* Token Address (if needed) */}
              {showCopyAddress && !token.isNative && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground font-mono">
                    {token.address.slice(0, 6)}...{token.address.slice(-4)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={handleCopyClick}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Balance Information Section */}
          <div className="text-right">
            {/* Token Balance */}
            <div className="font-semibold text-lg">
              {formatTokenAmount(token.balanceFormatted, token.symbol)}
            </div>
            <div className="text-sm text-muted-foreground">
              {token.symbol}
            </div>
            
            {/* USD Value and Price Change */}
            <div className="flex items-center justify-end gap-2 mt-2">
              {showUSDValue && (
                <span className="text-sm font-medium text-foreground">
                  {formatUSDValue(token.balanceUSD)}
                </span>
              )}
            </div>
            
            {/* Price Information */}
            <div className="flex items-center justify-end gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {formatUSDValue(token.price)} per {token.symbol}
              </span>
              
              {showPriceChange && Math.abs(token.priceChange24h) > 0 && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs",
                    isPositive 
                      ? "text-green-600 bg-green-50 hover:bg-green-100" 
                      : "text-red-600 bg-red-50 hover:bg-red-100"
                  )}
                >
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(token.priceChange24h).toFixed(2)}%
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
