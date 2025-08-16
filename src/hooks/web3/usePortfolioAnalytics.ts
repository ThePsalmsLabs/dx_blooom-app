// =============================================================================
// PHASE 4: PORTFOLIO DASHBOARD - COMPREHENSIVE PORTFOLIO MANAGEMENT
// =============================================================================

/**
 * Phase 4 creates a sophisticated portfolio management dashboard that transforms
 * raw token balance data into actionable financial insights. Think of this as
 * building a financial command center that helps users understand not just what
 * they own, but how their portfolio is performing and what actions they might
 * want to take.
 * 
 * Educational Framework for Phase 4:
 * - Financial Psychology: Present complex data in ways that build user confidence
 * - Progressive Complexity: Start simple, offer depth for advanced users
 * - Actionable Insights: Don't just show data, suggest what users might do with it
 * - Context Awareness: Connect portfolio data to user goals and platform features
 * - Visual Hierarchy: Guide attention to the most important information first
 * 
 * This phase demonstrates how to create interfaces that educate users about
 * finance while empowering them to make better decisions about their assets.
 */

/**
 * Advanced Portfolio Analytics Hook
 * 
 * This hook transforms basic token balance data into sophisticated portfolio
 * insights. It demonstrates how to create financial intelligence that helps
 * users understand their holdings beyond just current values.
 * 
 * Educational Concept: Financial Data Transformation
 * Raw balance data is just the beginning. Professional portfolio management
 * requires analyzing trends, calculating performance metrics, identifying
 * optimization opportunities, and providing contextual insights that help
 * users make better financial decisions.
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useTokenBalances, type TokenInfo } from '@/hooks/web3/useTokenBalances'

/**
 * Portfolio Performance Metrics
 * 
 * These interfaces define the sophisticated analytics we'll provide to users.
 * Each metric serves a specific purpose in helping users understand their
 * financial position and make informed decisions.
 */
export interface PortfolioMetrics {
  readonly totalValue: number
  readonly totalValue24hAgo: number
  readonly percentChange24h: number
  readonly percentChange7d: number
  readonly percentChange30d: number
  readonly largestHolding: TokenInfo | null
  readonly smallestHolding: TokenInfo | null
  readonly diversificationScore: number // 0-100, higher is more diversified
  readonly riskScore: number // 0-100, higher is riskier
}

/**
 * Token Allocation Analysis
 * 
 * This interface helps users understand how their portfolio is distributed
 * across different tokens. Understanding allocation is crucial for portfolio
 * optimization and risk management.
 */
export interface TokenAllocation {
  readonly token: TokenInfo
  readonly allocation: number // Percentage of total portfolio
  readonly value: number // USD value
  readonly trend: 'up' | 'down' | 'stable'
  readonly recommendedAction: 'hold' | 'consider_reducing' | 'consider_increasing' | 'consider_swapping'
  readonly actionReason: string
}

/**
 * Portfolio Insights and Recommendations
 * 
 * This interface demonstrates how to transform portfolio analysis into
 * actionable recommendations. Instead of just showing data, we provide
 * guidance that helps users improve their financial position.
 */
export interface PortfolioInsight {
  readonly type: 'optimization' | 'risk' | 'opportunity' | 'educational'
  readonly priority: 'high' | 'medium' | 'low'
  readonly title: string
  readonly description: string
  readonly actionText?: string
  readonly actionCallback?: () => void
  readonly learnMoreUrl?: string
}

/**
 * Complete Portfolio Analytics State
 * 
 * This interface combines all our analytics into a comprehensive portfolio
 * overview that users can understand and act upon.
 */
export interface PortfolioAnalytics {
  readonly metrics: PortfolioMetrics
  readonly allocations: TokenAllocation[]
  readonly insights: PortfolioInsight[]
  readonly isLoading: boolean
  readonly lastUpdated: Date
  readonly refreshAnalytics: () => void
}

/**
 * Portfolio Analytics Hook Implementation
 * 
 * This hook demonstrates how to create sophisticated financial analytics
 * from basic token balance data. It shows how to build intelligence that
 * helps users make better financial decisions.
 */
export const usePortfolioAnalytics = (): PortfolioAnalytics => {
  const { tokens, totalPortfolioValue, isLoading, refreshBalances } = useTokenBalances()
  const [lastUpdated, setLastUpdated] = useState(new Date())
  
  /**
   * Historical Data Simulation
   * 
   * In a production system, you would fetch historical price and balance data
   * from your backend or a data provider. This simulation demonstrates how
   * to calculate performance metrics that help users understand trends.
   * 
   * Educational Note: The Importance of Historical Context
   * Current portfolio value is important, but understanding how that value
   * has changed over time is crucial for making informed financial decisions.
   * Trends help users understand whether they're moving in the right direction.
   */
  const [historicalData] = useState(() => {
    // Simulate historical portfolio values
    const today = totalPortfolioValue
    const yesterday = today * (1 + (Math.random() - 0.5) * 0.05) // ±2.5% variation
    const lastWeek = today * (1 + (Math.random() - 0.5) * 0.15) // ±7.5% variation
    const lastMonth = today * (1 + (Math.random() - 0.5) * 0.30) // ±15% variation
    
    return { today, yesterday, lastWeek, lastMonth }
  })
  
  /**
   * Portfolio Metrics Calculation
   * 
   * This calculation demonstrates how to transform raw portfolio data into
   * meaningful financial metrics. Each metric tells users something different
   * about their financial position and helps them make better decisions.
   */
  const metrics = useMemo((): PortfolioMetrics => {
    if (tokens.length === 0) {
      return {
        totalValue: 0,
        totalValue24hAgo: 0,
        percentChange24h: 0,
        percentChange7d: 0,
        percentChange30d: 0,
        largestHolding: null,
        smallestHolding: null,
        diversificationScore: 0,
        riskScore: 0
      }
    }
    
    // Sort tokens by value to find largest and smallest holdings
    const sortedByValue = [...tokens]
      .filter(token => token.balanceUSD > 0)
      .sort((a, b) => b.balanceUSD - a.balanceUSD)
    
    /**
     * Diversification Score Calculation
     * 
     * This algorithm assesses how well-diversified a portfolio is. A more
     * diversified portfolio is generally less risky because it's not overly
     * dependent on any single asset.
     * 
     * Educational Concept: Portfolio Theory
     * Modern Portfolio Theory suggests that diversification can reduce risk
     * without necessarily reducing returns. Our diversification score helps
     * users understand whether their portfolio follows this principle.
     */
    const calculateDiversificationScore = (): number => {
      if (sortedByValue.length <= 1) return 0
      
      // Calculate concentration - how much of the portfolio is in the largest holding
      const largestHoldingPercentage = sortedByValue[0].balanceUSD / totalPortfolioValue
      
      // More holdings generally means better diversification
      const holdingCountScore = Math.min(sortedByValue.length * 20, 60) // Max 60 points for 3+ holdings
      
      // Lower concentration in any single asset is better
      const concentrationScore = Math.max(0, 40 - (largestHoldingPercentage * 100))
      
      return Math.round(holdingCountScore + concentrationScore)
    }
    
    /**
     * Risk Score Calculation
     * 
     * This algorithm assesses the overall risk level of the portfolio based
     * on token characteristics and allocation. It helps users understand
     * whether their portfolio matches their risk tolerance.
     */
    const calculateRiskScore = (): number => {
      let riskScore = 0
      
      for (const token of sortedByValue) {
        const allocation = token.balanceUSD / totalPortfolioValue
        
        // Different tokens have different risk characteristics
        let tokenRisk = 30 // Base risk for crypto assets
        
        if (token.symbol === 'USDC' || token.symbol === 'USDT') {
          tokenRisk = 5 // Stablecoins are low risk
        } else if (token.symbol === 'ETH' || token.symbol === 'WETH') {
          tokenRisk = 40 // ETH is moderate-high risk
        } else {
          tokenRisk = 60 // Other tokens are higher risk
        }
        
        // Weight risk by allocation
        riskScore += tokenRisk * allocation
      }
      
      return Math.round(riskScore)
    }
    
    return {
      totalValue: totalPortfolioValue,
      totalValue24hAgo: historicalData.yesterday,
      percentChange24h: historicalData.yesterday > 0 ? ((totalPortfolioValue - historicalData.yesterday) / historicalData.yesterday) * 100 : 0,
      percentChange7d: historicalData.lastWeek > 0 ? ((totalPortfolioValue - historicalData.lastWeek) / historicalData.lastWeek) * 100 : 0,
      percentChange30d: historicalData.lastMonth > 0 ? ((totalPortfolioValue - historicalData.lastMonth) / historicalData.lastMonth) * 100 : 0,
      largestHolding: sortedByValue[0] || null,
      smallestHolding: sortedByValue[sortedByValue.length - 1] || null,
      diversificationScore: calculateDiversificationScore(),
      riskScore: calculateRiskScore()
    }
  }, [tokens, totalPortfolioValue, historicalData])
  
  /**
   * Token Allocation Analysis
   * 
   * This analysis helps users understand how their portfolio is distributed
   * and provides specific recommendations for each holding. It demonstrates
   * how to create actionable insights from portfolio data.
   */
  const allocations = useMemo((): TokenAllocation[] => {
    if (totalPortfolioValue === 0) return []
    
    return tokens
      .filter(token => token.balanceUSD > 0)
      .map(token => {
        const allocation = (token.balanceUSD / totalPortfolioValue) * 100
        
        /**
         * Recommendation Algorithm
         * 
         * This algorithm analyzes each token holding and provides specific
         * recommendations based on allocation size, token characteristics,
         * and portfolio composition principles.
         */
        let recommendedAction: TokenAllocation['recommendedAction'] = 'hold'
        let actionReason = 'Current allocation looks appropriate'
        
        // Analyze allocation size
        if (allocation > 70) {
          recommendedAction = 'consider_reducing'
          actionReason = 'Very high concentration in single asset increases risk'
        } else if (allocation > 50) {
          recommendedAction = 'consider_reducing'
          actionReason = 'High concentration might benefit from diversification'
        } else if (allocation < 5 && token.symbol !== 'USDC') {
          recommendedAction = 'consider_increasing'
          actionReason = 'Small allocation might benefit from consolidation'
        }
        
        // Analyze token-specific factors
        if (token.symbol === 'USDC' && allocation < 20 && metrics.riskScore > 60) {
          recommendedAction = 'consider_increasing'
          actionReason = 'Consider increasing stable asset allocation to reduce portfolio risk'
        }
        
        /**
         * Trend Analysis
         * 
         * This analysis looks at recent price performance to categorize
         * whether each holding is trending up, down, or remaining stable.
         * This helps users understand momentum in their holdings.
         */
        const trend: TokenAllocation['trend'] = 
          token.priceChange24h > 2 ? 'up' :
          token.priceChange24h < -2 ? 'down' : 'stable'
        
        return {
          token,
          allocation,
          value: token.balanceUSD,
          trend,
          recommendedAction,
          actionReason
        }
      })
      .sort((a, b) => b.allocation - a.allocation) // Sort by allocation size
  }, [tokens, totalPortfolioValue, metrics.riskScore])
  
  /**
   * Portfolio Insights Generation
   * 
   * This function demonstrates how to transform portfolio analysis into
   * specific, actionable recommendations that help users improve their
   * financial position. Each insight provides education and guidance.
   */
  const insights = useMemo((): PortfolioInsight[] => {
    const generatedInsights: PortfolioInsight[] = []
    
    // Diversification insights
    if (metrics.diversificationScore < 40) {
      generatedInsights.push({
        type: 'risk',
        priority: 'high',
        title: 'Portfolio Concentration Risk',
        description: `Your portfolio is heavily concentrated in ${metrics.largestHolding?.symbol}. Consider diversifying to reduce risk.`,
        actionText: 'Explore Diversification',
        learnMoreUrl: '/learn/diversification'
      })
    } else if (metrics.diversificationScore > 80) {
      generatedInsights.push({
        type: 'optimization',
        priority: 'low',
        title: 'Well-Diversified Portfolio',
        description: 'Your portfolio shows good diversification across multiple assets, which helps manage risk.',
        actionText: 'View Portfolio Details'
      })
    }
    
    // Risk management insights
    if (metrics.riskScore > 70) {
      generatedInsights.push({
        type: 'risk',
        priority: 'medium',
        title: 'High Risk Portfolio',
        description: 'Your portfolio has a high risk score. Consider adding stable assets like USDC to balance risk.',
        actionText: 'Add Stable Assets'
      })
    }
    
    // Performance insights
    if (metrics.percentChange24h > 10) {
      generatedInsights.push({
        type: 'opportunity',
        priority: 'medium',
        title: 'Strong Performance',
        description: `Your portfolio is up ${metrics.percentChange24h.toFixed(1)}% in 24 hours. Consider taking some profits.`,
        actionText: 'Review Holdings'
      })
    } else if (metrics.percentChange24h < -10) {
      generatedInsights.push({
        type: 'opportunity',
        priority: 'medium',
        title: 'Portfolio Decline',
        description: `Your portfolio is down ${Math.abs(metrics.percentChange24h).toFixed(1)}% in 24 hours. This might be a buying opportunity.`,
        actionText: 'Analyze Market'
      })
    }
    
    // Small balance cleanup
    const smallBalances = allocations.filter(alloc => alloc.value < 5 && alloc.allocation < 2)
    if (smallBalances.length > 2) {
      generatedInsights.push({
        type: 'optimization',
        priority: 'low',
        title: 'Small Balance Cleanup',
        description: `You have ${smallBalances.length} small token balances. Consider consolidating to reduce complexity.`,
        actionText: 'Consolidate Holdings'
      })
    }
    
    // Educational insights for new users
    if (totalPortfolioValue > 0 && totalPortfolioValue < 100) {
      generatedInsights.push({
        type: 'educational',
        priority: 'low',
        title: 'Growing Your Portfolio',
        description: 'You\'re getting started with crypto! Consider dollar-cost averaging to build your position over time.',
        actionText: 'Learn About DCA',
        learnMoreUrl: '/learn/dollar-cost-averaging'
      })
    }
    
    return generatedInsights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }, [metrics, allocations, totalPortfolioValue])
  
  /**
   * Analytics Refresh Handler
   * 
   * This function provides a way to refresh all portfolio analytics,
   * which is important for maintaining current information in a
   * dynamic crypto environment.
   */
  const refreshAnalytics = useCallback(() => {
    refreshBalances()
    setLastUpdated(new Date())
  }, [refreshBalances])
  
  return {
    metrics,
    allocations,
    insights,
    isLoading,
    lastUpdated,
    refreshAnalytics
  }
}
