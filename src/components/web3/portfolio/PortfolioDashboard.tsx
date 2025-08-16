/**
 * Comprehensive Portfolio Dashboard Component
 * 
 * This component creates a professional-grade portfolio management interface
 * that rivals platforms like Zerion and DeFiPulse. It demonstrates how to
 * present complex financial data in ways that inform and empower users.
 * 
 * Educational Concept: Information Architecture for Financial Interfaces
 * Financial dashboards must balance comprehensiveness with clarity. Users need
 * access to detailed information, but they shouldn't be overwhelmed by it.
 * Our design uses progressive disclosure, visual hierarchy, and contextual
 * organization to make complex information accessible and actionable.
 */

import React, { useState, useMemo } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  BarChart3,
  RefreshCw,
  Settings,
  Download,
  Share,
  Eye,
  EyeOff,
  AlertTriangle,
  Lightbulb,
  Target,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus,
  Filter,
  Search
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

// Import our analytics foundation and previous phase components
import { usePortfolioAnalytics } from '@/hooks/web3/usePortfolioAnalytics'
import { useTokenBalances, TokenBalanceCard, SwapModal } from '@/components/web3/portfolio'
import type { TokenInfo } from '@/hooks/web3/useTokenBalances'

/**
 * Portfolio Dashboard Configuration
 * 
 * This interface manages the various display options and user preferences
 * for the portfolio dashboard. It demonstrates how to create configurable
 * interfaces that adapt to different user needs and preferences.
 */
interface DashboardConfig {
  readonly viewMode: 'overview' | 'detailed' | 'analytics'
  readonly sortBy: 'value' | 'allocation' | 'performance' | 'alphabetical'
  readonly sortOrder: 'asc' | 'desc'
  readonly hideSmallBalances: boolean
  readonly hidePrivateInfo: boolean
  readonly chartTimeframe: '24h' | '7d' | '30d' | '90d'
  readonly showInsights: boolean
}

interface PortfolioDashboardProps {
  readonly onTokenSelect?: (token: TokenInfo) => void
  readonly onSwapRequest?: (fromToken?: TokenInfo, toToken?: TokenInfo) => void
  readonly className?: string
}

/**
 * Main Portfolio Dashboard Component
 * 
 * This component demonstrates how to create a comprehensive financial
 * interface that educates users while providing powerful portfolio
 * management capabilities.
 */
export const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({
  onTokenSelect,
  onSwapRequest,
  className
}) => {
  const { tokens, totalPortfolioValue, isLoading, refreshBalances } = useTokenBalances()
  const analytics = usePortfolioAnalytics()
  
  // Dashboard configuration state
  const [config, setConfig] = useState<DashboardConfig>({
    viewMode: 'overview',
    sortBy: 'value',
    sortOrder: 'desc',
    hideSmallBalances: false,
    hidePrivateInfo: false,
    chartTimeframe: '24h',
    showInsights: true
  })
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null)
  const [showSwapModal, setShowSwapModal] = useState(false)
  
  /**
   * Filtered and Sorted Token Display
   * 
   * This logic demonstrates how to create sophisticated filtering and sorting
   * for portfolio data. Users can customize their view to focus on what's
   * most important to them.
   */
  const displayTokens = useMemo(() => {
    let filtered = tokens.filter(token => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!token.symbol.toLowerCase().includes(query) && 
            !token.name.toLowerCase().includes(query)) {
          return false
        }
      }
      
      // Small balance filter
      if (config.hideSmallBalances && token.balanceUSD < 1) {
        return false
      }
      
      return true
    })
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (config.sortBy) {
        case 'value':
          comparison = b.balanceUSD - a.balanceUSD
          break
        case 'allocation':
          const allocA = (a.balanceUSD / totalPortfolioValue) * 100
          const allocB = (b.balanceUSD / totalPortfolioValue) * 100
          comparison = allocB - allocA
          break
        case 'performance':
          comparison = b.priceChange24h - a.priceChange24h
          break
        case 'alphabetical':
          comparison = a.symbol.localeCompare(b.symbol)
          break
      }
      
      return config.sortOrder === 'asc' ? comparison : -comparison
    })
    
    return filtered
  }, [tokens, searchQuery, config, totalPortfolioValue])
  
  /**
   * Portfolio Overview Section
   * 
   * This section provides users with immediate understanding of their
   * financial position. It demonstrates how to present key metrics in
   * a way that builds confidence and understanding.
   */
  const renderPortfolioOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Portfolio Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {config.hidePrivateInfo ? '••••••' : `$${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {analytics.metrics.percentChange24h >= 0 ? (
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
            )}
            <span className={cn(
              analytics.metrics.percentChange24h >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {Math.abs(analytics.metrics.percentChange24h).toFixed(2)}% (24h)
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* Portfolio Performance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">24h Performance</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={cn(
            "text-2xl font-bold",
            analytics.metrics.percentChange24h >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {analytics.metrics.percentChange24h >= 0 ? '+' : ''}
            {analytics.metrics.percentChange24h.toFixed(2)}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {config.hidePrivateInfo ? '••••••' : `$${Math.abs(totalPortfolioValue - analytics.metrics.totalValue24hAgo).toFixed(2)} change`}
          </div>
        </CardContent>
      </Card>
      
      {/* Diversification Score */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Diversification</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.metrics.diversificationScore}/100</div>
          <Progress value={analytics.metrics.diversificationScore} className="mt-2" />
          <div className="text-xs text-muted-foreground mt-1">
            {analytics.metrics.diversificationScore > 70 ? 'Well diversified' :
             analytics.metrics.diversificationScore > 40 ? 'Moderately diversified' : 'Needs diversification'}
          </div>
        </CardContent>
      </Card>
      
      {/* Risk Score */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.metrics.riskScore}/100</div>
          <Progress 
            value={analytics.metrics.riskScore} 
            className="mt-2"
          />
          <div className="text-xs text-muted-foreground mt-1">
            {analytics.metrics.riskScore > 70 ? 'High risk' :
             analytics.metrics.riskScore > 40 ? 'Moderate risk' : 'Conservative'}
          </div>
        </CardContent>
      </Card>
    </div>
  )
  
  /**
   * Portfolio Insights Section
   * 
   * This section demonstrates how to transform analytical data into
   * actionable user guidance. Each insight provides education and
   * specific recommendations.
   */
  const renderPortfolioInsights = () => {
    if (!config.showInsights || analytics.insights.length === 0) return null
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Portfolio Insights
          </CardTitle>
          <CardDescription>
            Personalized recommendations to optimize your portfolio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {analytics.insights.slice(0, 3).map((insight, index) => (
            <Alert key={index} className={cn(
              insight.priority === 'high' && "border-red-200 bg-red-50",
              insight.priority === 'medium' && "border-yellow-200 bg-yellow-50",
              insight.priority === 'low' && "border-blue-200 bg-blue-50"
            )}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {insight.type === 'risk' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                    {insight.type === 'opportunity' && <TrendingUp className="h-4 w-4 text-green-600" />}
                    {insight.type === 'optimization' && <Target className="h-4 w-4 text-blue-600" />}
                    {insight.type === 'educational' && <BookOpen className="h-4 w-4 text-purple-600" />}
                    <span className="font-medium">{insight.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {insight.priority}
                    </Badge>
                  </div>
                  <AlertDescription className="text-sm">
                    {insight.description}
                  </AlertDescription>
                </div>
                {insight.actionText && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={insight.actionCallback}
                  >
                    {insight.actionText}
                  </Button>
                )}
              </div>
            </Alert>
          ))}
        </CardContent>
      </Card>
    )
  }
  
  /**
   * Token Holdings Section
   * 
   * This section provides detailed information about individual token
   * holdings with sophisticated sorting and filtering capabilities.
   */
  const renderTokenHoldings = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Token Holdings</CardTitle>
            <CardDescription>
              {displayTokens.length} tokens • Total value ${totalPortfolioValue.toFixed(2)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-40"
              />
            </div>
            
            {/* Sort Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-1" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setConfig(prev => ({ ...prev, sortBy: 'value' }))}>
                  Portfolio Value
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setConfig(prev => ({ ...prev, sortBy: 'allocation' }))}>
                  Allocation %
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setConfig(prev => ({ ...prev, sortBy: 'performance' }))}>
                  24h Performance
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setConfig(prev => ({ ...prev, sortBy: 'alphabetical' }))}>
                  Alphabetical
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setConfig(prev => ({ ...prev, hideSmallBalances: !prev.hideSmallBalances }))}>
                  {config.hideSmallBalances ? 'Show' : 'Hide'} Small Balances
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayTokens.map((token) => {
            const allocation = (token.balanceUSD / totalPortfolioValue) * 100
            const allocationData = analytics.allocations.find(a => a.token.address === token.address)
            
            return (
              <div key={token.address} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <TokenBalanceCard
                    token={token}
                    onClick={() => {
                      setSelectedToken(token)
                      onTokenSelect?.(token)
                    }}
                    className="border-0 p-0 flex-1"
                  />
                  <div className="text-right ml-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {allocation.toFixed(1)}%
                      </span>
                      <Progress value={allocation} className="w-16" />
                    </div>
                    {allocationData && allocationData.recommendedAction !== 'hold' && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {allocationData.actionReason}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
  
  /**
   * Dashboard Controls Section
   * 
   * This section provides users with controls to customize their
   * dashboard view and access additional functionality.
   */
  const renderDashboardControls = () => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <Badge variant="outline" className="text-xs">
          Last updated: {analytics.lastUpdated.toLocaleTimeString()}
        </Badge>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfig(prev => ({ ...prev, hidePrivateInfo: !prev.hidePrivateInfo }))}
        >
          {config.hidePrivateInfo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setShowSwapModal(true)
            onSwapRequest?.()
          }}
        >
          <ArrowUpRight className="h-4 w-4 mr-1" />
          Swap
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={analytics.refreshAnalytics}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Dashboard Options</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setConfig(prev => ({ ...prev, showInsights: !prev.showInsights }))}>
              {config.showInsights ? 'Hide' : 'Show'} Insights
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="h-4 w-4 mr-2" />
              Export Portfolio
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share className="h-4 w-4 mr-2" />
              Share Portfolio
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
  
  // Loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-6 p-6", className)}>
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    )
  }
  
  return (
    <div className={cn("space-y-6 p-6", className)}>
      {/* Dashboard Controls */}
      {renderDashboardControls()}
      
      {/* Portfolio Overview */}
      {renderPortfolioOverview()}
      
      {/* Portfolio Insights */}
      {renderPortfolioInsights()}
      
      {/* Token Holdings */}
      {renderTokenHoldings()}
      
      {/* Swap Modal */}
      <SwapModal
        isOpen={showSwapModal}
        onClose={() => setShowSwapModal(false)}
        initialFromToken={selectedToken}
        onSwapComplete={() => {
          setShowSwapModal(false)
          analytics.refreshAnalytics()
        }}
      />
    </div>
  )
}
