import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Address } from 'viem'
import { 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  Settings,
  Zap,
  DollarSign,
  Activity,
  Clock
} from 'lucide-react'
import { 
  useSlippageManagement, 
  SlippageLevel, 
  MarketVolatility, 
  PairType 
} from '../../hooks/web3/payment/useSlippageManagement'
import { PaymentMethod } from '@/hooks/business/workflows'

/**
 * Props for the SlippageProtection component
 */
interface SlippageProtectionProps {
  // Payment context
  fromToken: Address
  toToken: Address
  fromAmount: bigint
  paymentMethod: PaymentMethod
  
  // UI configuration
  showAdvancedControls?: boolean        // Show expert-level controls
  showMarketData?: boolean             // Display market condition indicators  
  showPriceImpact?: boolean            // Show estimated price impact
  compactMode?: boolean                // Condensed layout for mobile
  className?: string                   // Additional CSS classes
  
  // Behavior
  enableRealTimeUpdates?: boolean      // Live market condition updates
  allowCustomSlippage?: boolean        // Allow users to set custom values
  autoApplyRecommendations?: boolean   // Automatically use smart recommendations
  
  // Event handlers
  onSlippageChange?: (slippage: number, level: SlippageLevel) => void
  onRecommendationAccepted?: (recommendation: number) => void
  onAdvancedToggle?: (showAdvanced: boolean) => void
}

/**
 * Slippage level configurations with user-friendly descriptions
 */
const SLIPPAGE_LEVEL_CONFIG = {
  [SlippageLevel.ULTRA_LOW]: {
    label: 'Ultra Low',
    description: 'Minimal protection, lowest cost',
    icon: Shield,
    color: 'text-green-600',
    background: 'bg-green-50',
    border: 'border-green-200',
    recommendation: 'Best for stable coin swaps',
    riskLevel: 'Low Risk'
  },
  [SlippageLevel.LOW]: {
    label: 'Low', 
    description: 'Conservative protection',
    icon: Shield,
    color: 'text-blue-600',
    background: 'bg-blue-50', 
    border: 'border-blue-200',
    recommendation: 'Good for most stable pairs',
    riskLevel: 'Low Risk'
  },
  [SlippageLevel.MODERATE]: {
    label: 'Moderate',
    description: 'Balanced protection (recommended)',
    icon: CheckCircle,
    color: 'text-purple-600',
    background: 'bg-purple-50',
    border: 'border-purple-200',
    recommendation: 'Optimal for most users',
    riskLevel: 'Balanced'
  },
  [SlippageLevel.HIGH]: {
    label: 'High',
    description: 'Strong protection for volatile markets',
    icon: TrendingUp,
    color: 'text-orange-600',
    background: 'bg-orange-50',
    border: 'border-orange-200',
    recommendation: 'Better during market volatility',
    riskLevel: 'Medium Risk'
  },
  [SlippageLevel.AGGRESSIVE]: {
    label: 'Aggressive',
    description: 'Maximum protection, higher cost',
    icon: Zap,
    color: 'text-red-600',
    background: 'bg-red-50',
    border: 'border-red-200', 
    recommendation: 'For highly volatile or exotic pairs',
    riskLevel: 'High Risk'
  }
}

/**
 * Market condition display configurations
 */
const MARKET_CONDITION_CONFIG = {
  [MarketVolatility.VERY_LOW]: {
    label: 'Very Stable',
    icon: TrendingDown,
    color: 'text-green-600',
    description: 'Market is very calm, lower slippage recommended'
  },
  [MarketVolatility.LOW]: {
    label: 'Stable',
    icon: Activity,
    color: 'text-green-600',
    description: 'Normal market conditions'
  },
  [MarketVolatility.MODERATE]: {
    label: 'Normal',
    icon: Activity,
    color: 'text-blue-600',
    description: 'Typical market movement'
  },
  [MarketVolatility.HIGH]: {
    label: 'Volatile',
    icon: TrendingUp,
    color: 'text-orange-600',
    description: 'Market is moving, consider higher slippage'
  },
  [MarketVolatility.EXTREME]: {
    label: 'Highly Volatile',
    icon: AlertCircle,
    color: 'text-red-600',
    description: 'Extreme market conditions, use high slippage'
  }
}

/**
 * Format slippage percentage for display
 */
const formatSlippagePercentage = (basisPoints: number): string => {
  const percentage = basisPoints / 100
  if (percentage < 1) {
    return `${percentage.toFixed(2)}%`
  } else if (percentage < 10) {
    return `${percentage.toFixed(1)}%`
  } else {
    return `${percentage.toFixed(0)}%`
  }
}

/**
 * SlippageProtection Component
 * 
 * This component provides an intuitive interface for users to configure slippage
 * protection settings. It integrates deeply with our sophisticated slippage
 * management hook to provide intelligent recommendations while allowing users
 * to maintain control over their price protection preferences.
 * 
 * Key Features:
 * - Smart default recommendations based on token pairs and market conditions
 * - Clear visualization of market volatility and its impact on recommendations
 * - Advanced controls for expert users who want precise control
 * - Real-time validation with helpful warnings and suggestions
 * - Integration with our Phase 1 payment monitoring system
 * 
 */
export function SlippageProtection({
  fromToken,
  toToken, 
  fromAmount,
  paymentMethod,
  showAdvancedControls = false,
  showMarketData = true,
  showPriceImpact = true,
  compactMode = false,
  className = '',
  enableRealTimeUpdates = true,
  allowCustomSlippage = true,
  autoApplyRecommendations = false,
  onSlippageChange,
  onRecommendationAccepted,
  onAdvancedToggle
}: SlippageProtectionProps) {
  
  // Initialize our slippage management system
  const slippageSystem = useSlippageManagement({
    enableRealTimeUpdates,
    updateIntervalMs: 10000,
    enableVolatilityDetection: true,
    safetyBuffer: 10,
    maxAutoSlippage: 500
  })
  
  // Local UI state
  const [showAdvanced, setShowAdvanced] = useState(showAdvancedControls)
  const [customSlippageInput, setCustomSlippageInput] = useState('')
  const [showRecommendationTooltip, setShowRecommendationTooltip] = useState(false)
  const [priceImpactData, setPriceImpactData] = useState<{
    estimate: number
    loading: boolean
    error: string | null
  }>({
    estimate: 0,
    loading: false,
    error: null
  })
  
  // Calculate current recommendation based on payment context
  const currentRecommendation = useMemo(() => {
    return slippageSystem.calculateSlippage({
      fromToken,
      toToken,
      fromAmount,
      paymentMethod,
      userPreference: slippageSystem.slippageLevel
    })
  }, [slippageSystem, fromToken, toToken, fromAmount, paymentMethod])
  
  // Validate current slippage setting
  const slippageValidation = useMemo(() => {
    return slippageSystem.validateSlippage(slippageSystem.currentSlippage, {
      fromToken,
      toToken,
      fromAmount,
      paymentMethod
    })
  }, [slippageSystem, fromToken, toToken, fromAmount, paymentMethod])
  
  /**
   * Handle slippage level changes
   */
  const handleSlippageLevelChange = useCallback((level: SlippageLevel) => {
    slippageSystem.setSlippageLevel(level)
    
    // Clear custom input when using preset levels
    setCustomSlippageInput('')
    
    // Notify parent component
    const levelDefaults = {
      [SlippageLevel.ULTRA_LOW]: 10,
      [SlippageLevel.LOW]: 50,
      [SlippageLevel.MODERATE]: 100,
      [SlippageLevel.HIGH]: 200,
      [SlippageLevel.AGGRESSIVE]: 500
    }
    
    onSlippageChange?.(levelDefaults[level], level)
  }, [slippageSystem, onSlippageChange])
  
  /**
   * Handle custom slippage input
   */
  const handleCustomSlippageChange = useCallback((value: string) => {
    setCustomSlippageInput(value)
    
    // Parse and validate the input
    const numericValue = parseFloat(value)
    if (!isNaN(numericValue) && numericValue >= 0) {
      const basisPoints = Math.round(numericValue * 100)
      
      // Validate the slippage value
      const validation = slippageSystem.validateSlippage(basisPoints, {
        fromToken,
        toToken,
        fromAmount,
        paymentMethod
      })
      
      if (validation.isValid || validation.warnings.length === 0) {
        slippageSystem.setCustomSlippage(basisPoints)
        onSlippageChange?.(basisPoints, slippageSystem.slippageLevel)
      }
    }
  }, [slippageSystem, fromToken, toToken, fromAmount, paymentMethod, onSlippageChange])
  
  /**
   * Accept the smart recommendation
   */
  const acceptRecommendation = useCallback(() => {
    const recommendedBasisPoints = currentRecommendation.recommended
    slippageSystem.setCustomSlippage(recommendedBasisPoints)
    setCustomSlippageInput((recommendedBasisPoints / 100).toFixed(2))
    
    onRecommendationAccepted?.(recommendedBasisPoints)
  }, [currentRecommendation.recommended, slippageSystem, onRecommendationAccepted])
  
  /**
   * Toggle advanced controls
   */
  const toggleAdvancedControls = useCallback(() => {
    const newShowAdvanced = !showAdvanced
    setShowAdvanced(newShowAdvanced)
    onAdvancedToggle?.(newShowAdvanced)
  }, [showAdvanced, onAdvancedToggle])
  
  /**
   * Load price impact estimation
   */
  const loadPriceImpact = useCallback(async () => {
    try {
      setPriceImpactData(prev => ({ ...prev, loading: true, error: null }))
      
      const impact = await slippageSystem.estimatePriceImpact(fromAmount, fromToken, toToken)
      
      setPriceImpactData({
        estimate: impact,
        loading: false,
        error: null
      })
    } catch (error) {
      setPriceImpactData({
        estimate: 0,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to estimate price impact'
      })
    }
  }, [slippageSystem, fromAmount, fromToken, toToken])
  
  // Load price impact when component mounts or parameters change
  useEffect(() => {
    if (showPriceImpact && fromAmount > BigInt(0)) {
      loadPriceImpact()
    }
  }, [showPriceImpact, fromAmount, loadPriceImpact])
  
  // Auto-apply recommendations if enabled
  useEffect(() => {
    if (autoApplyRecommendations && currentRecommendation.confidence > 70) {
      acceptRecommendation()
    }
  }, [autoApplyRecommendations, currentRecommendation.confidence, acceptRecommendation])
  
  // Get market condition configuration
  const marketCondition = MARKET_CONDITION_CONFIG[currentRecommendation.marketVolatility]
  const currentLevelConfig = SLIPPAGE_LEVEL_CONFIG[slippageSystem.slippageLevel]
  
  // Determine container styling
  const containerClasses = `
    ${compactMode ? 'p-4' : 'p-6'} 
    bg-white rounded-xl border shadow-sm 
    ${className}
  `.trim()
  
  return (
    <div className={containerClasses}>
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Price Protection
          </h3>
        </div>
        
        {allowCustomSlippage && (
          <button
            onClick={toggleAdvancedControls}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <Settings className="h-4 w-4" />
            <span>{showAdvanced ? 'Simple' : 'Advanced'}</span>
          </button>
        )}
      </div>
      
      {/* Market Conditions Display */}
      {showMarketData && slippageSystem.marketData && (
        <div className={`mb-4 p-3 rounded-lg ${
          compactMode ? 'text-sm' : ''
        }`} style={{ 
          backgroundColor: marketCondition.color.includes('green') ? '#f0fdf4' :
                          marketCondition.color.includes('blue') ? '#eff6ff' :
                          marketCondition.color.includes('orange') ? '#fff7ed' :
                          marketCondition.color.includes('red') ? '#fef2f2' : '#f9fafb'
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <marketCondition.icon className={`h-4 w-4 ${marketCondition.color}`} />
              <span className="font-medium text-gray-900">
                Market: {marketCondition.label}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Confidence: {currentRecommendation.confidence}%
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {marketCondition.description}
          </p>
        </div>
      )}
      
      {/* Current Settings Display */}
      <div className={`mb-4 p-4 rounded-lg border ${currentLevelConfig.background} ${currentLevelConfig.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <currentLevelConfig.icon className={`h-5 w-5 ${currentLevelConfig.color}`} />
            <div>
              <div className="font-semibold text-gray-900">
                {formatSlippagePercentage(slippageSystem.currentSlippage)} Slippage
              </div>
              <div className="text-sm text-gray-600">
                {currentLevelConfig.description}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-sm font-medium ${currentLevelConfig.color}`}>
              {currentLevelConfig.riskLevel}
            </div>
            {currentRecommendation.confidence < 60 && (
              <div className="text-xs text-yellow-600">
                Low confidence
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Slippage Level Selection (Simple Mode) */}
      {!showAdvanced && (
        <div className="mb-4">
          <div className="grid grid-cols-3 gap-2">
            {[SlippageLevel.LOW, SlippageLevel.MODERATE, SlippageLevel.HIGH].map((level) => {
              const config = SLIPPAGE_LEVEL_CONFIG[level]
              const isSelected = slippageSystem.slippageLevel === level
              
              return (
                <button
                  key={level}
                  onClick={() => handleSlippageLevelChange(level)}
                  className={`
                    p-3 rounded-lg border-2 transition-all text-left
                    ${isSelected 
                      ? `${config.background} ${config.border} ${config.color}` 
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <config.icon className="h-4 w-4" />
                    <span className="font-medium text-sm">{config.label}</span>
                  </div>
                  <div className="text-xs opacity-75">
                    {config.recommendation}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
      
      {/* Advanced Controls */}
      {showAdvanced && allowCustomSlippage && (
        <div className="mb-4 space-y-4">
          {/* All Slippage Levels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slippage Level
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(SLIPPAGE_LEVEL_CONFIG).map(([level, config]) => {
                const isSelected = slippageSystem.slippageLevel === level as SlippageLevel
                
                return (
                  <button
                    key={level}
                    onClick={() => handleSlippageLevelChange(level as SlippageLevel)}
                    className={`
                      p-2 rounded-lg border text-left transition-all
                      ${isSelected 
                        ? `${config.background} ${config.border} ${config.color}` 
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-2">
                      <config.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{config.label}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* Custom Slippage Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Slippage Percentage
            </label>
            <div className="relative">
              <input
                type="number"
                value={customSlippageInput}
                onChange={(e) => handleCustomSlippageChange(e.target.value)}
                placeholder="e.g., 1.5"
                min="0.01"
                max="5.0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <span className="text-gray-500">%</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Smart Recommendation */}
      {currentRecommendation.recommended !== slippageSystem.currentSlippage && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Smart Recommendation
              </span>
            </div>
            <button
              onClick={acceptRecommendation}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            {formatSlippagePercentage(currentRecommendation.recommended)} - {currentRecommendation.reasoning}
          </p>
        </div>
      )}
      
      {/* Validation Warnings */}
      {slippageValidation.warnings.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-900">
              Warnings
            </span>
          </div>
          {slippageValidation.warnings.map((warning: string, index: number) => (
            <p key={index} className="text-sm text-yellow-700">
              • {warning}
            </p>
          ))}
        </div>
      )}
      
      {/* Validation Errors */}
      {slippageValidation.errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-900">
              Errors
            </span>
          </div>
          {slippageValidation.errors.map((error: string, index: number) => (
            <p key={index} className="text-sm text-red-700">
              • {error}
            </p>
          ))}
        </div>
      )}
      
      {/* Price Impact Display */}
      {showPriceImpact && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Expected Price Impact:</span>
            </div>
            <div>
              {priceImpactData.loading ? (
                <span className="text-gray-500">Calculating...</span>
              ) : priceImpactData.error ? (
                <span className="text-red-600">Error</span>
              ) : (
                <span className={`font-medium ${
                  priceImpactData.estimate < 1 ? 'text-green-600' :
                  priceImpactData.estimate < 3 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {priceImpactData.estimate.toFixed(2)}%
                </span>
              )}
            </div>
          </div>
          
          {slippageSystem.marketData && (
            <div className="flex items-center justify-between text-sm mt-2">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Liquidity Score:</span>
              </div>
              <div>
                <span className={`font-medium ${
                  slippageSystem.marketData.liquidityScore > 80 ? 'text-green-600' :
                  slippageSystem.marketData.liquidityScore > 60 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {slippageSystem.marketData.liquidityScore}/100
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Loading States */}
      {slippageSystem.isLoading && (
        <div className="text-center py-2">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 animate-spin" />
            <span>Updating market data...</span>
          </div>
        </div>
      )}
      
      {/* Error Display */}
      {slippageSystem.error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-900">
              Error
            </span>
          </div>
          <p className="text-sm text-red-700 mt-1">
            {slippageSystem.error}
          </p>
        </div>
      )}
    </div>
  )
}