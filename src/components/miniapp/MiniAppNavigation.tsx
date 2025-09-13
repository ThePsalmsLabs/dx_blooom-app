/**
 * MiniApp Navigation Component - Ultra Modern Design
 * File: src/components/miniapp/MiniAppNavigation.tsx
 * 
 * A purpose-built navigation component designed exclusively for Farcaster mini apps.
 * Features ultra-modern design with glassmorphism effects, smooth animations, 
 * haptic feedback simulation, and seamless Farcaster wallet integration.
 * 
 * DESIGN PHILOSOPHY:
 * - Mobile-first with bottom navigation for thumb accessibility
 * - Glassmorphism and modern visual effects
 * - Smooth micro-interactions and animations  
 * - Farcaster-native user experience
 * - Touch-optimized with larger tap targets
 * - Social context awareness
 * 
 * KEY FEATURES:
 * - Bottom navigation bar with floating islands design
 * - Unified connect button using useFarcasterAutoWallet
 * - Animated active states with smooth transitions
 * - Haptic feedback simulation for interactions
 * - Theme toggle with smooth transitions
 * - Wallet status with real-time updates
 * - Progressive Web App optimizations
 */

'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import {
  Home,
  Compass,
  Users,
  User,
  Wallet,
  Zap,
  Moon,
  Sun,
  Sparkles,
  ArrowUpRight,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Waves
} from 'lucide-react'

// Import UI components
import {
  Button,
  Badge,
  Avatar,
  AvatarFallback,
  Card
} from '@/components/ui/index'
import { cn } from '@/lib/utils'

// Import hooks
import { useFarcasterAutoWallet } from '@/hooks/miniapp/useFarcasterAutoWallet'
import { useMiniAppUtils, useSocialState } from '@/contexts/UnifiedMiniAppProvider'
import { useTheme } from '@/components/providers/ThemeProvider'

// ================================================
// ULTRA MODERN TYPE DEFINITIONS
// ================================================

interface NavigationItem {
  readonly id: string
  readonly label: string
  readonly href: string
  readonly icon: React.ComponentType<{ className?: string }>
  readonly activeIcon?: React.ComponentType<{ className?: string }>
  readonly color: string
  readonly gradient: string
  readonly description: string
}

interface MiniAppNavigationProps {
  readonly className?: string
  readonly onNavigate?: (item: NavigationItem) => void
}

// ================================================
// MODERN NAVIGATION CONFIGURATION
// ================================================

const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/mini',
    icon: Home,
    color: 'rgb(99, 102, 241)', // Indigo
    gradient: 'from-indigo-500/20 to-purple-500/20',
    description: 'Discover amazing content'
  },
  {
    id: 'browse',
    label: 'Browse',
    href: '/mini/browse',
    icon: Compass,
    color: 'rgb(34, 197, 94)', // Green
    gradient: 'from-green-500/20 to-emerald-500/20',
    description: 'Explore creators and content'
  },
  {
    id: 'creators',
    label: 'Creators',
    href: '/mini/creators',
    icon: Users,
    color: 'rgb(249, 115, 22)', // Orange
    gradient: 'from-orange-500/20 to-red-500/20',
    description: 'Meet top creators'
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/mini/profile',
    icon: User,
    color: 'rgb(168, 85, 247)', // Purple
    gradient: 'from-purple-500/20 to-pink-500/20',
    description: 'Your account settings'
  }
] as const

// ================================================
// HAPTIC FEEDBACK SIMULATION
// ================================================

const triggerHaptic = (intensity: 'light' | 'medium' | 'heavy' = 'light') => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [50]
    }
    navigator.vibrate(patterns[intensity])
  }
}

// ================================================
// ULTRA MODERN NAVIGATION COMPONENT
// ================================================

export function MiniAppNavigation({ className, onNavigate }: MiniAppNavigationProps) {
  // ================================================
  // HOOKS AND STATE
  // ================================================
  
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // Mini app context
  const miniAppUtils = useMiniAppUtils()
  const socialState = useSocialState()
  const { isMiniApp } = miniAppUtils
  const { userProfile } = socialState
  
  // Farcaster wallet integration
  const {
    isConnected,
    address,
    isConnecting,
    connect: connectWallet,
    disconnect: disconnectWallet,
    error: walletError,
    isInMiniApp
  } = useFarcasterAutoWallet()
  
  // Animation state
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [isThemeTogglePressed, setIsThemeTogglePressed] = useState(false)
  
  // ================================================
  // EFFECTS
  // ================================================
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Update active item based on current path
  useEffect(() => {
    const currentItem = NAVIGATION_ITEMS.find(item => 
      item.href === pathname || (item.href !== '/mini' && pathname.startsWith(item.href))
    )
    setActiveItemId(currentItem?.id || 'home')
  }, [pathname])
  
  // ================================================
  // COMPUTED VALUES
  // ================================================
  
  const formattedAddress = useMemo(() => {
    if (!address) return null
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }, [address])
  
  const connectionStatus = useMemo(() => {
    if (isConnecting) return { text: 'Connecting...', color: 'text-amber-400', icon: Loader2 }
    if (walletError) return { text: 'Error', color: 'text-red-400', icon: AlertTriangle }
    if (isConnected) return { text: 'Connected', color: 'text-green-400', icon: CheckCircle }
    return { text: 'Connect', color: 'text-gray-400', icon: Wallet }
  }, [isConnecting, isConnected, walletError])
  
  // ================================================
  // EVENT HANDLERS
  // ================================================
  
  const handleNavigate = useCallback((item: NavigationItem) => {
    if (item.id === activeItemId) return
    
    // Haptic feedback
    triggerHaptic('light')
    
    // Set active state immediately for smooth transition
    setActiveItemId(item.id)
    
    // Call external handler
    onNavigate?.(item)
    
    // Navigate
    router.push(item.href)
  }, [router, onNavigate, activeItemId])
  
  const handleConnect = useCallback(async () => {
    try {
      triggerHaptic('medium')
      if (isConnected) {
        // If connected, disconnect the wallet properly
        if (window.confirm('Disconnect your wallet?')) {
          console.log('🔄 Disconnecting Farcaster wallet...')
          disconnectWallet()
        }
      } else {
        // If not connected, connect the wallet
        await connectWallet()
      }
    } catch (error) {
      console.error('Wallet action failed:', error)
      triggerHaptic('heavy')
    }
  }, [connectWallet, disconnectWallet, isConnected])
  
  const handleThemeToggle = useCallback(() => {
    setIsThemeTogglePressed(true)
    triggerHaptic('light')
    
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    
    setTimeout(() => setIsThemeTogglePressed(false), 150)
  }, [theme, setTheme])
  
  // ================================================
  // RENDER COMPONENTS
  // ================================================
  
  const ConnectionButton = React.memo(() => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative"
    >
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        className={cn(
          "relative h-11 px-4 rounded-full overflow-hidden",
          "backdrop-blur-xl border border-white/20",
          "shadow-lg transition-all duration-300",
          "hover:shadow-xl active:scale-95",
          isConnected ? [
            "bg-gradient-to-r from-green-500/90 to-emerald-500/90",
            "shadow-green-500/25 hover:shadow-green-500/40",
            "hover:from-red-500/90 hover:to-red-600/90",
            "hover:shadow-red-500/40"
          ] : [
            "bg-gradient-to-r from-blue-600/90 to-purple-600/90",
            "shadow-blue-500/25 hover:shadow-blue-500/40"
          ]
        )}
      >
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5"
          animate={{
            x: isConnecting ? ['0%', '100%'] : '0%'
          }}
          transition={{
            duration: 1.5,
            repeat: isConnecting ? Infinity : 0,
            ease: "linear"
          }}
        />
        
        <div className="relative flex items-center gap-2">
          <motion.div
            animate={{ rotate: isConnecting ? 360 : 0 }}
            transition={{ duration: 1, repeat: isConnecting ? Infinity : 0, ease: "linear" }}
          >
            <connectionStatus.icon className="h-4 w-4" />
          </motion.div>
          
          <span className="font-medium text-sm">
            {isConnected ? 'Connected' : connectionStatus.text}
          </span>
          
          {isConnected && formattedAddress && (
            <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
              {formattedAddress}
            </Badge>
          )}
        </div>
      </Button>
    </motion.div>
  ))
  
  const ThemeToggle = React.memo(() => (
    <motion.button
      onClick={handleThemeToggle}
      className={cn(
        "relative h-11 w-11 rounded-full",
        "bg-gradient-to-br from-white/10 to-white/5",
        "backdrop-blur-xl border border-white/20",
        "shadow-lg shadow-black/10",
        "transition-all duration-300",
        "hover:shadow-xl hover:from-white/20 hover:to-white/10",
        "active:scale-95"
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        rotate: isThemeTogglePressed ? 180 : 0,
        scale: isThemeTogglePressed ? 0.9 : 1
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <AnimatePresence mode="wait">
        {mounted && (
          <motion.div
            key={theme}
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-amber-400" />
            ) : (
              <Moon className="h-5 w-5 text-indigo-400" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  ))
  
  const NavigationItem = React.memo<{ item: NavigationItem }>(({ item }) => {
    const isActive = activeItemId === item.id
    
    return (
      <motion.button
        onClick={() => handleNavigate(item)}
        className="relative flex flex-col items-center gap-1 p-3 min-h-16 group"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        layout
      >
        {/* Active indicator background */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              layoutId="activeIndicator"
              className={cn(
                "absolute inset-0 rounded-2xl",
                "bg-gradient-to-br", item.gradient,
                "shadow-lg shadow-black/10",
                "border border-white/20"
              )}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 35,
                mass: 1
              }}
            />
          )}
        </AnimatePresence>
        
        {/* Icon */}
        <motion.div
          className="relative z-10"
          animate={{
            y: isActive ? -2 : 0,
            scale: isActive ? 1.1 : 1
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <item.icon 
            className={cn(
              "h-6 w-6 transition-colors duration-200",
              isActive ? "text-white" : "text-gray-400",
              "group-hover:text-white"
            )}
          />
        </motion.div>
        
        {/* Label */}
        <motion.span
          className={cn(
            "text-xs font-medium transition-colors duration-200 relative z-10",
            isActive ? "text-white" : "text-gray-500",
            "group-hover:text-white"
          )}
          animate={{
            y: isActive ? -1 : 0,
            fontWeight: isActive ? 600 : 500
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {item.label}
        </motion.span>
        
        {/* Sparkle effect for active item */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              className="absolute -top-1 -right-1 z-20"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              <Sparkles className="h-3 w-3 text-yellow-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    )
  })
  
  // ================================================
  // MAIN RENDER
  // ================================================
  
  return (
    <>
      {/* Top Status Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50",
          "bg-gradient-to-b from-background/95 to-background/80",
          "backdrop-blur-xl border-b border-white/10",
          "shadow-sm",
          className
        )}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo and Social Profile */}
          <div className="flex items-center gap-3">
            {/* Bloom Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2"
            >
              <div className="relative">
                <img
                  src="/images/BLOOM.svg"
                  alt="Bloom"
                  className="h-8 w-8 rounded-lg object-contain"
                  draggable="false"
                />
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg opacity-20 blur-sm"></div>
              </div>
              <span className="font-bold text-sm bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Bloom
              </span>
            </motion.div>

            {/* Social Profile */}
            <AnimatePresence>
              {userProfile && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  <Avatar className="h-7 w-7 border-2 border-white/20">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs">
                      {userProfile.displayName?.charAt(0) || userProfile.username?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium">
                      {userProfile.displayName || `@${userProfile.username}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Connected
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <ConnectionButton />
          </div>
        </div>
      </motion.div>
      
      {/* Bottom Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 pb-safe-area"
      >
        <div className="mx-4 mb-4">
          <Card 
            className={cn(
              "relative overflow-hidden",
              "bg-gradient-to-r from-background/95 to-background/90",
              "backdrop-blur-xl border border-white/20",
              "shadow-2xl shadow-black/20",
              "rounded-3xl"
            )}
          >
            {/* Animated background waves */}
            <div className="absolute inset-0 opacity-5">
              <motion.div
                className="absolute inset-0"
                animate={{
                  backgroundPosition: ['0% 0%', '100% 100%']
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "linear"
                }}
                style={{
                  backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.3) 0%, transparent 50%)',
                  backgroundSize: '200% 200%'
                }}
              />
            </div>
            
            {/* Navigation Items */}
            <div className="relative flex items-center justify-around px-2 py-2">
              {NAVIGATION_ITEMS.map((item) => (
                <NavigationItem key={item.id} item={item} />
              ))}
            </div>
          </Card>
        </div>
      </motion.div>
      
      {/* Safe area spacer */}
      <div className="h-32 pointer-events-none" />
    </>
  )
}

// ================================================
// EXPORTS
// ================================================

export default MiniAppNavigation
export type { NavigationItem, MiniAppNavigationProps }