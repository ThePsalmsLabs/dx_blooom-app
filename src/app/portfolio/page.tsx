/**
 * Portfolio Page Component
 * 
 * This page component integrates the complete Phase 4 portfolio management
 * system into your application routing. It demonstrates how to create a
 * dedicated portfolio management experience that users can access directly.
 * 
 * Integration Features:
 * - Full portfolio dashboard with analytics
 * - Seamless navigation to other parts of your platform
 * - Context-aware actions (swap, buy content, etc.)
 * - Responsive design for all screen sizes
 * - Loading and error states
 * - Breadcrumb navigation
 */

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { 
  ArrowLeft, 
  Plus, 
  TrendingUp, 
  ShoppingCart,
  ExternalLink,
  Info
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Import the complete portfolio system
import { 
  PortfolioDashboard, 
  useEnhancedTokenBalances, 
  usePortfolioAnalytics,
  type TokenInfo 
} from '@/components/web3/portfolio'

// Import layout components
import { BreadcrumbNavigation } from '@/components/layout/BreadcrumbNavigation'
import { WalletConnectionButton } from '@/components/web3/WalletConnect'

/**
 * Portfolio Page State Management
 * 
 * This interface manages the various states and actions that can be
 * initiated from the portfolio page.
 */
interface PortfolioPageState {
  readonly selectedToken: TokenInfo | null
  readonly showWelcomeGuide: boolean
  readonly activeAction: 'none' | 'swap' | 'purchase' | 'deposit'
}

/**
 * Main Portfolio Page Component
 * 
 * This component creates a comprehensive portfolio page that integrates
 * seamlessly with your application's navigation and user experience patterns.
 */
export default function PortfolioPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { totalPortfolioValue, tokens } = useEnhancedTokenBalances()
  const { metrics } = usePortfolioAnalytics()
  
  const [pageState, setPageState] = useState<PortfolioPageState>({
    selectedToken: null,
    showWelcomeGuide: true,
    activeAction: 'none'
  })
  
  /**
   * Token Selection Handler
   * 
   * This handler demonstrates how portfolio interactions can trigger
   * navigation to other parts of your application.
   */
  const handleTokenSelect = useCallback((token: TokenInfo) => {
    setPageState(prev => ({ ...prev, selectedToken: token }))
    
    // Optional: Navigate to token details page
    // router.push(`/portfolio/token/${token.address}`)
  }, [])
  
  /**
   * Swap Request Handler
   * 
   * This handler manages swap requests initiated from the portfolio dashboard.
   */
  const handleSwapRequest = useCallback((fromToken?: TokenInfo, toToken?: TokenInfo) => {
    setPageState(prev => ({ ...prev, activeAction: 'swap' }))
    
    // The PortfolioDashboard component handles the actual swap modal
    console.log('Swap requested:', fromToken?.symbol, 'to', toToken?.symbol)
  }, [])
  
  /**
   * Quick Actions Handler
   * 
   * This demonstrates how to provide quick access to common portfolio actions.
   */
  const handleQuickAction = useCallback((action: 'buy_content' | 'add_funds' | 'swap_tokens') => {
    switch (action) {
      case 'buy_content':
        router.push('/browse')
        break
      case 'add_funds':
        // Navigate to deposit/onramp flow
        router.push('/wallet-demo') // Your existing wallet demo page
        break
      case 'swap_tokens':
        setPageState(prev => ({ ...prev, activeAction: 'swap' }))
        break
    }
  }, [router])
  
  /**
   * Welcome Guide Component
   * 
   * This component helps new users understand how to use the portfolio features.
   */
  const renderWelcomeGuide = () => {
    if (!pageState.showWelcomeGuide || totalPortfolioValue > 0) return null
    
    return (
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">Welcome to your Portfolio Dashboard!</p>
            <p className="text-sm">
              Your portfolio is currently empty. Here are some ways to get started:
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button 
                size="sm" 
                onClick={() => handleQuickAction('add_funds')}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Funds
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleQuickAction('buy_content')}
                className="text-xs"
              >
                <ShoppingCart className="h-3 w-3 mr-1" />
                Browse Content
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setPageState(prev => ({ ...prev, showWelcomeGuide: false }))}
                className="text-xs"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    )
  }
  
  /**
   * Portfolio Summary Component
   * 
   * This component provides a quick overview that complements the main dashboard.
   */
  const renderPortfolioSummary = () => {
    if (totalPortfolioValue === 0) return null
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Portfolio Value</CardDescription>
            <CardTitle className="text-2xl">
              ${totalPortfolioValue.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {metrics.percentChange24h >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
              )}
              <span className={cn(
                "text-sm font-medium",
                metrics.percentChange24h >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {metrics.percentChange24h >= 0 ? '+' : ''}
                {metrics.percentChange24h.toFixed(2)}% (24h)
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Token Count</CardDescription>
            <CardTitle className="text-2xl">{tokens.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {tokens.filter(t => t.balanceUSD > 1).length} with significant value
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Risk Level</CardDescription>
            <CardTitle className="text-2xl">{metrics.riskScore}/100</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={
              metrics.riskScore > 70 ? "destructive" :
              metrics.riskScore > 40 ? "default" : "secondary"
            }>
              {metrics.riskScore > 70 ? 'High Risk' :
               metrics.riskScore > 40 ? 'Moderate Risk' : 'Conservative'}
            </Badge>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  /**
   * Page Navigation Component
   * 
   * This component provides navigation context and quick actions.
   */
  const renderPageNavigation = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <BreadcrumbNavigation />
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => handleQuickAction('buy_content')}
        >
          <ShoppingCart className="h-4 w-4 mr-1" />
          Browse Content
        </Button>
        <Button 
          size="sm"
          onClick={() => handleQuickAction('swap_tokens')}
        >
          <TrendingUp className="h-4 w-4 mr-1" />
          Swap Tokens
        </Button>
      </div>
    </div>
  )
  
  // Handle wallet connection state
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        {renderPageNavigation()}
        
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">Portfolio Dashboard</h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Connect your wallet to view your token portfolio and access advanced trading features.
            </p>
          </div>
          
          <WalletConnectionButton />
          
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              New to crypto?{' '}
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal"
                onClick={() => router.push('/onboard')}
              >
                Learn the basics
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Navigation */}
      {renderPageNavigation()}
      
      {/* Welcome Guide for New Users */}
      {renderWelcomeGuide()}
      
      {/* Portfolio Summary */}
      {renderPortfolioSummary()}
      
      {/* Main Portfolio Dashboard */}
      <PortfolioDashboard
        onTokenSelect={handleTokenSelect}
        onSwapRequest={handleSwapRequest}
        className="border-0 p-0" // Remove default padding since we're handling it at page level
      />
      
      {/* Footer Links */}
      <div className="mt-8 pt-6 border-t text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Need help managing your portfolio?{' '}
          <Button 
            variant="link" 
            className="p-0 h-auto font-normal text-sm"
            onClick={() => router.push('/docs/portfolio-guide')}
          >
            View Portfolio Guide
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </p>
        <div className="flex justify-center gap-4 text-xs text-muted-foreground">
          <Button 
            variant="link" 
            className="p-0 h-auto font-normal text-xs"
            onClick={() => router.push('/browse')}
          >
            Browse Content
          </Button>
          <Button 
            variant="link" 
            className="p-0 h-auto font-normal text-xs"
            onClick={() => router.push('/creators')}
          >
            Discover Creators
          </Button>
          <Button 
            variant="link" 
            className="p-0 h-auto font-normal text-xs"
            onClick={() => router.push('/dashboard')}
          >
            Creator Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}