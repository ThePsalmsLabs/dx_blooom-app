# Phase 4 Portfolio Dashboard Integration Guide

This guide provides comprehensive examples and best practices for integrating the Phase 4 Portfolio Dashboard into your onchain content platform.

## 🚀 Complete System Overview

Phase 4 completes our four-phase portfolio management system:

- **Phase 1**: Token balance tracking and display
- **Phase 2**: Smart purchase integration
- **Phase 3**: Advanced token swapping
- **Phase 4**: Portfolio analytics and management dashboard

## 📊 New Components Added

### 1. `usePortfolioAnalytics` Hook

Advanced portfolio analytics that transform raw token data into actionable insights:

```typescript
interface PortfolioMetrics {
  totalValue: number
  percentChange24h: number
  diversificationScore: number  // 0-100
  riskScore: number            // 0-100
  largestHolding: TokenInfo | null
  // ... more metrics
}

interface PortfolioInsight {
  type: 'optimization' | 'risk' | 'opportunity' | 'educational'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  actionText?: string
  actionCallback?: () => void
}
```

### 2. `PortfolioDashboard` Component

A comprehensive portfolio management interface with:
- Real-time portfolio metrics
- Token allocation analysis
- Personalized recommendations
- Advanced filtering and sorting
- Integrated swap functionality

### 3. Portfolio Page (`/portfolio`)

A complete page implementation ready for your application routing.

## 🔧 Integration Examples

### Basic Portfolio Dashboard Integration

```tsx
// In your main application layout
import { PortfolioDashboard } from '@/components/web3/portfolio'

export default function DashboardLayout() {
  return (
    <div className="container mx-auto p-6">
      <PortfolioDashboard
        onTokenSelect={(token) => {
          // Handle token selection - navigate to details, start swap, etc.
          console.log('Token selected:', token.symbol)
        }}
        onSwapRequest={(fromToken, toToken) => {
          // Handle swap requests from portfolio view
          console.log('Swap requested')
        }}
      />
    </div>
  )
}
```

### Header Portfolio Summary

Add portfolio information to your application header:

```tsx
// components/layout/HeaderPortfolioSummary.tsx
import { useTokenBalances, usePortfolioAnalytics } from '@/components/web3/portfolio'

export const HeaderPortfolioSummary = () => {
  const { totalPortfolioValue } = useTokenBalances()
  const { metrics } = usePortfolioAnalytics()
  
  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <div className="text-sm font-medium">
          ${totalPortfolioValue.toFixed(2)}
        </div>
        <div className={cn(
          "text-xs",
          metrics.percentChange24h >= 0 ? "text-green-600" : "text-red-600"
        )}>
          {metrics.percentChange24h >= 0 ? '+' : ''}
          {metrics.percentChange24h.toFixed(1)}%
        </div>
      </div>
      <Button size="sm" variant="outline" asChild>
        <Link href="/portfolio">Portfolio</Link>
      </Button>
    </div>
  )
}
```

### Enhanced Content Purchase with Portfolio Context

```tsx
// Enhanced content page with portfolio awareness
import { 
  SmartContentPurchaseCard,
  usePortfolioAnalytics,
  useTokenBalances 
} from '@/components/web3/portfolio'

export default function ContentPage({ contentId }: { contentId: string }) {
  const { canAffordContentPrice } = useTokenBalances()
  const { insights } = usePortfolioAnalytics()
  
  // Check if user has portfolio optimization recommendations
  const hasHighRiskWarning = insights.some(
    insight => insight.type === 'risk' && insight.priority === 'high'
  )
  
  return (
    <div className="space-y-6">
      {/* Portfolio risk warning for large purchases */}
      {hasHighRiskWarning && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your portfolio has high concentration risk. Consider diversifying before large purchases.
            <Link href="/portfolio" className="font-medium underline ml-1">
              View Portfolio
            </Link>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Enhanced purchase card with portfolio integration */}
      <SmartContentPurchaseCard
        contentId={BigInt(contentId)}
        enableSwapIntegration={true}
        showBalanceDetails={true}
        onPurchaseSuccess={() => {
          router.push(`/content/${contentId}/view`)
        }}
      />
    </div>
  )
}
```

### Portfolio-Driven Navigation

```tsx
// Smart navigation that adapts to portfolio state
import { usePortfolioAnalytics } from '@/components/web3/portfolio'

export const SmartNavigation = () => {
  const { metrics, insights } = usePortfolioAnalytics()
  
  // Get high-priority insights for navigation badges
  const criticalInsights = insights.filter(i => i.priority === 'high')
  
  return (
    <nav className="flex items-center gap-4">
      <NavLink href="/browse">Browse Content</NavLink>
      <NavLink href="/creators">Creators</NavLink>
      
      {/* Portfolio link with insight indicator */}
      <NavLink href="/portfolio" className="relative">
        Portfolio
        {criticalInsights.length > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
            {criticalInsights.length}
          </Badge>
        )}
      </NavLink>
      
      {/* Conditional risk management link */}
      {metrics.riskScore > 70 && (
        <NavLink href="/portfolio?tab=insights" className="text-amber-600">
          Risk Management
        </NavLink>
      )}
    </nav>
  )
}
```

### Advanced Portfolio Widget

```tsx
// Compact portfolio widget for dashboard views
import { usePortfolioAnalytics, useTokenBalances } from '@/components/web3/portfolio'

export const PortfolioWidget = () => {
  const { totalPortfolioValue, tokens } = useTokenBalances()
  const { metrics, insights } = usePortfolioAnalytics()
  
  const topHoldings = tokens
    .filter(t => t.balanceUSD > 0)
    .sort((a, b) => b.balanceUSD - a.balanceUSD)
    .slice(0, 3)
  
  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Portfolio Overview
          <Button size="sm" variant="outline" asChild>
            <Link href="/portfolio">View All</Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Portfolio value */}
        <div className="text-center">
          <div className="text-2xl font-bold">
            ${totalPortfolioValue.toFixed(2)}
          </div>
          <div className={cn(
            "text-sm",
            metrics.percentChange24h >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {metrics.percentChange24h >= 0 ? '+' : ''}
            {metrics.percentChange24h.toFixed(1)}% (24h)
          </div>
        </div>
        
        {/* Top holdings */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Top Holdings</p>
          {topHoldings.map(token => (
            <div key={token.address} className="flex justify-between text-sm">
              <span>{token.symbol}</span>
              <span>${token.balanceUSD.toFixed(2)}</span>
            </div>
          ))}
        </div>
        
        {/* Quick insights */}
        {insights.slice(0, 1).map(insight => (
          <Alert key={insight.title} className="text-xs">
            <AlertDescription>{insight.description}</AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  )
}
```

## 🎯 Advanced Use Cases

### 1. Portfolio-Based Content Recommendations

```tsx
// Recommend content based on portfolio composition
export const SmartContentRecommendations = () => {
  const { metrics, allocations } = usePortfolioAnalytics()
  
  // Recommend educational content for high-risk portfolios
  if (metrics.riskScore > 70) {
    return (
      <ContentGrid 
        filter="educational"
        title="Recommended: Risk Management Content"
        description="Based on your portfolio's risk level"
      />
    )
  }
  
  // Recommend creator content for well-diversified portfolios
  if (metrics.diversificationScore > 80) {
    return (
      <ContentGrid 
        filter="premium"
        title="Exclusive Creator Content"
        description="Your diversified portfolio qualifies for premium content"
      />
    )
  }
  
  return <ContentGrid title="Popular Content" />
}
```

### 2. Automated Portfolio Rebalancing Suggestions

```tsx
// Component that suggests portfolio rebalancing
export const RebalancingSuggestions = () => {
  const { allocations, metrics } = usePortfolioAnalytics()
  
  const suggestions = allocations
    .filter(alloc => alloc.recommendedAction !== 'hold')
    .slice(0, 3)
  
  if (suggestions.length === 0) return null
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Optimization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map(suggestion => (
          <div key={suggestion.token.address} className="flex justify-between items-center">
            <div>
              <p className="font-medium">{suggestion.token.symbol}</p>
              <p className="text-sm text-muted-foreground">
                {suggestion.actionReason}
              </p>
            </div>
            <Button size="sm" variant="outline">
              {suggestion.recommendedAction === 'consider_reducing' ? 'Reduce' :
               suggestion.recommendedAction === 'consider_increasing' ? 'Increase' : 'Swap'}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
```

### 3. Portfolio Performance Tracking

```tsx
// Track and display portfolio performance over time
export const PerformanceTracker = () => {
  const { metrics } = usePortfolioAnalytics()
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h')
  
  const getPerformanceData = () => {
    switch (timeframe) {
      case '24h': return metrics.percentChange24h
      case '7d': return metrics.percentChange7d
      case '30d': return metrics.percentChange30d
    }
  }
  
  const performance = getPerformanceData()
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Performance
          <Tabs value={timeframe} onValueChange={setTimeframe}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="24h">24H</TabsTrigger>
              <TabsTrigger value="7d">7D</TabsTrigger>
              <TabsTrigger value="30d">30D</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className={cn(
            "text-3xl font-bold",
            performance >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {performance >= 0 ? '+' : ''}{performance.toFixed(2)}%
          </div>
          <p className="text-sm text-muted-foreground">
            Portfolio performance ({timeframe})
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
```

## 🔧 Configuration Options

### Portfolio Dashboard Configuration

```tsx
interface DashboardConfig {
  viewMode: 'overview' | 'detailed' | 'analytics'
  sortBy: 'value' | 'allocation' | 'performance' | 'alphabetical'
  hideSmallBalances: boolean
  hidePrivateInfo: boolean
  showInsights: boolean
}

// Use configuration
<PortfolioDashboard
  onTokenSelect={handleTokenSelect}
  onSwapRequest={handleSwapRequest}
  // Dashboard inherits configuration from user preferences
/>
```

### Analytics Customization

```tsx
// Custom analytics hook for specific use cases
export const useCustomPortfolioAnalytics = (
  riskTolerance: 'conservative' | 'moderate' | 'aggressive'
) => {
  const baseAnalytics = usePortfolioAnalytics()
  
  // Adjust recommendations based on risk tolerance
  const customInsights = useMemo(() => {
    return baseAnalytics.insights.filter(insight => {
      if (riskTolerance === 'conservative') {
        return insight.type !== 'opportunity' || insight.priority !== 'low'
      }
      return true
    })
  }, [baseAnalytics.insights, riskTolerance])
  
  return {
    ...baseAnalytics,
    insights: customInsights
  }
}
```

## 🎨 Styling and Theming

### Custom Dashboard Themes

```tsx
// Create themed portfolio dashboard
const DarkPortfolioDashboard = () => (
  <div className="dark"> {/* Force dark theme */}
    <PortfolioDashboard
      className="bg-gray-900 text-white"
      onTokenSelect={handleTokenSelect}
    />
  </div>
)

// Compact mobile version
const MobilePortfolioDashboard = () => (
  <PortfolioDashboard
    className="px-2"
    onTokenSelect={handleTokenSelect}
    // Mobile-optimized configuration would be passed here
  />
)
```

### Custom Metric Cards

```tsx
// Create custom metric displays
export const CustomMetricCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon 
}: {
  title: string
  value: string
  change?: number
  icon: React.ComponentType<{ className?: string }>
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {change !== undefined && (
        <div className={cn(
          "text-xs mt-1",
          change >= 0 ? "text-green-600" : "text-red-600"
        )}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </div>
      )}
    </CardContent>
  </Card>
)
```

## 📱 Responsive Design

The Portfolio Dashboard is fully responsive and adapts to different screen sizes:

- **Desktop**: Full dashboard with all features
- **Tablet**: Optimized grid layouts with collapsible sections
- **Mobile**: Stacked layout with swipe navigation

```tsx
// Responsive portfolio implementation
export const ResponsivePortfolio = () => {
  const isMobile = useMediaQuery('(max-width: 768px)')
  
  if (isMobile) {
    return (
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          {/* Mobile-optimized overview */}
        </TabsContent>
        <TabsContent value="holdings">
          {/* Mobile token list */}
        </TabsContent>
        <TabsContent value="insights">
          {/* Mobile insights */}
        </TabsContent>
      </Tabs>
    )
  }
  
  return <PortfolioDashboard />
}
```

## 🔐 Security Considerations

### Private Information Handling

```tsx
// Implement privacy controls
export const PrivacyAwarePortfolio = () => {
  const [hideBalances, setHideBalances] = useState(false)
  
  return (
    <div>
      <Button 
        onClick={() => setHideBalances(!hideBalances)}
        size="sm"
        variant="outline"
      >
        {hideBalances ? <Eye /> : <EyeOff />}
        {hideBalances ? 'Show' : 'Hide'} Balances
      </Button>
      
      <PortfolioDashboard
        // Pass privacy preference to dashboard
        onTokenSelect={handleTokenSelect}
      />
    </div>
  )
}
```

### Data Export Controls

```tsx
// Implement secure data export
export const SecureDataExport = () => {
  const handleExport = async () => {
    // Implement secure export with user confirmation
    const confirmed = await confirmAction(
      'Export portfolio data?',
      'This will create a file with your portfolio information.'
    )
    
    if (confirmed) {
      // Export logic here
    }
  }
  
  return (
    <Button onClick={handleExport}>
      <Download className="h-4 w-4 mr-2" />
      Export Portfolio
    </Button>
  )
}
```

## 🚀 Performance Optimization

### Lazy Loading

```tsx
// Implement lazy loading for large portfolios
const LazyPortfolioDashboard = lazy(() => 
  import('@/components/web3/portfolio').then(module => ({
    default: module.PortfolioDashboard
  }))
)

export const OptimizedPortfolioPage = () => (
  <Suspense fallback={<PortfolioLoadingSkeleton />}>
    <LazyPortfolioDashboard />
  </Suspense>
)
```

### Memoization

```tsx
// Optimize expensive calculations
export const OptimizedPortfolioMetrics = () => {
  const { tokens } = useTokenBalances()
  
  const memoizedMetrics = useMemo(() => {
    return calculateComplexMetrics(tokens)
  }, [tokens])
  
  return <MetricsDisplay metrics={memoizedMetrics} />
}
```

This comprehensive integration guide provides everything you need to successfully implement the Phase 4 Portfolio Dashboard in your onchain content platform. The system is designed to scale with your platform's growth while providing users with professional-grade portfolio management capabilities.
