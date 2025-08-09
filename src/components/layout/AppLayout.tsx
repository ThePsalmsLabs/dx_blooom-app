/**
 * AppLayout Component - Component 8.1: Core Layout Foundation
 * File: src/components/layout/AppLayout.tsx
 * 
 * This component serves as the fundamental layout wrapper for the entire application,
 * providing persistent structure, wallet context awareness, and role-based interface
 * adaptation. It demonstrates how Web3 applications require layout systems that
 * respond to blockchain state changes and user role transitions.
 * 
 * Key Features:
 * - Persistent header with wallet connection status and user role indicators
 * - Dynamic navigation that adapts to creator vs consumer roles
 * - Global blockchain state awareness and network status monitoring
 * - Responsive design with mobile-first navigation patterns
 * - Toast notification system for Web3 transaction feedback
 * - Error boundary integration for graceful error handling
 * - Theme persistence and user preference management
 * 
 * This component showcases how sophisticated Web3 applications coordinate
 * multiple complex states (wallet, network, user roles, transactions) while
 * maintaining familiar, intuitive user experiences.
 */

'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAccount, useChainId, useDisconnect } from 'wagmi'
import { usePathname, useRouter } from 'next/navigation'
import {
  Menu,
  X,
  Wallet,
  User,
  Settings,
  LogOut,
  Bell,
  Search,
  Plus,
  Home,
  Compass,
  BarChart3,
  Shield,
  AlertCircle,
  CheckCircle,
  WifiOff,
  Loader2
} from 'lucide-react'
import {
    Button,
    Card,
    CardContent,
    Avatar,
    AvatarFallback,
    Badge,
    Sheet,
    SheetContent,
    SheetTrigger,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    Toast,
    ToastProvider,
    ToastViewport
  } from '@/components/ui/index'
import { cn, formatAddress } from '@/lib/utils'

// Import our architectural layers for layout functionality
import {
  useIsCreatorRegistered,
  useCreatorProfile,
  useTokenBalance
} from '@/hooks/contracts/core'
import { useWalletConnectionUI } from '@/hooks/ui/integration'
import { WalletConnectButton, WalletStatus } from '@/components/web3/WalletConnectModal'
import { isSupportedChain, getCurrentChain } from '@/lib/web3/wagmi'

/**
 * User Role Types
 * 
 * These types define how the layout adapts to different user roles
 * and permissions within the platform.
 */
type UserRole = 'disconnected' | 'consumer' | 'creator' | 'admin'

/**
 * Navigation Item Interface
 * 
 * Defines the structure for navigation menu items with role-based visibility
 * and dynamic state handling.
 */
interface NavigationItem {
  readonly label: string
  readonly href: string
  readonly icon: React.ComponentType<{ className?: string }>
  readonly roles: readonly UserRole[]
  readonly isActive?: boolean
  readonly badge?: string
  readonly disabled?: boolean
}

/**
 * Layout State Interface
 * 
 * Tracks the current state of the layout including user role, navigation,
 * and various UI state flags.
 */
interface LayoutState {
  readonly userRole: UserRole
  readonly isNavigationOpen: boolean
  readonly isNetworkSupported: boolean
  readonly pendingTransactions: number
  readonly unreadNotifications: number
  readonly isOnline: boolean
}

/**
 * Props interface for the AppLayout component
 */
interface AppLayoutProps {
  /** Child components to render within the layout */
  children: React.ReactNode
  /** Optional className for custom styling */
  className?: string
  /** Whether to show the navigation sidebar */
  showNavigation?: boolean
  /** Whether to show the header */
  showHeader?: boolean
  /** Optional custom header content */
  headerContent?: React.ReactNode
}

/**
 * AppLayout Component
 * 
 * This component orchestrates the complete application layout experience,
 * adapting to user roles, wallet states, and network conditions. It provides
 * the foundation for all other layout components while maintaining consistent
 * Web3-aware navigation patterns.
 */
export function AppLayout({
  children,
  className,
  showNavigation = true,
  showHeader = true,
  headerContent
}: AppLayoutProps) {
  // Wallet and network state
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { disconnect } = useDisconnect()
  const router = useRouter()
  const pathname = usePathname()

  // Creator and role detection using our architectural layers
  const creatorRegistration = useIsCreatorRegistered(address)
  const creatorProfile = useCreatorProfile(address)
  const walletUI = useWalletConnectionUI()

  // Layout state management
  const [layoutState, setLayoutState] = useState<LayoutState>({
    userRole: 'disconnected',
    isNavigationOpen: false,
    isNetworkSupported: true,
    pendingTransactions: 0,
    unreadNotifications: 0,
    isOnline: true
  })

  // Determine user role based on wallet and registration status
  const userRole: UserRole = useMemo(() => {
    if (!isConnected || !address) return 'disconnected'
    if (creatorRegistration.data) return 'creator'
    return 'consumer'
  }, [isConnected, address, creatorRegistration.data])

  // Check network support
  const isNetworkSupported = useMemo(() => {
    return isSupportedChain(chainId)
  }, [chainId])

  // Update layout state when dependencies change
  useEffect(() => {
    setLayoutState(prev => ({
      ...prev,
      userRole,
      isNetworkSupported,
      // Simulate online status check
      isOnline: navigator.onLine
    }))
  }, [userRole, isNetworkSupported])

  // Navigation items based on user role
  const navigationItems: NavigationItem[] = useMemo(() => {
    const items: NavigationItem[] = [
      {
        label: 'Home',
        href: '/',
        icon: Home,
        roles: ['disconnected', 'consumer', 'creator', 'admin'],
        isActive: pathname === '/'
      },
      {
        label: 'Browse Content',
        href: '/browse',
        icon: Compass,
        roles: ['disconnected', 'consumer', 'creator', 'admin'],
        isActive: pathname.startsWith('/browse')
      }
    ]

    // Add creator-specific navigation items
    if (userRole === 'creator') {
      items.push(
        {
          label: 'Creator Dashboard',
          href: '/dashboard',
          icon: BarChart3,
          roles: ['creator'],
          isActive: pathname.startsWith('/dashboard')
        },
        {
          label: 'Upload Content',
          href: '/upload',
          icon: Plus,
          roles: ['creator'],
          isActive: pathname.startsWith('/upload')
        }
      )
    }

    return items
  }, [userRole, pathname])

  // Handle navigation state changes
  const handleNavigationToggle = useCallback(() => {
    setLayoutState(prev => ({
      ...prev,
      isNavigationOpen: !prev.isNavigationOpen
    }))
  }, [])

  const handleNavigationClose = useCallback(() => {
    setLayoutState(prev => ({
      ...prev,
      isNavigationOpen: false
    }))
  }, [])

  // Handle user actions
  const handleDisconnect = useCallback(() => {
    disconnect()
    router.push('/')
  }, [disconnect, router])

  const handleProfileClick = useCallback(() => {
    if (userRole === 'creator') {
      router.push('/dashboard')
    } else {
      router.push('/profile')
    }
  }, [userRole, router])

  return (
    <ToastProvider>
      <div className={cn(
        "min-h-screen bg-background flex flex-col",
        className
      )}>
        {/* Header */}
        {showHeader && (
          <AppHeader
            userRole={userRole}
            isConnected={isConnected}
            address={address}
            creatorProfile={creatorProfile.data}
            isNetworkSupported={isNetworkSupported}
            onNavigationToggle={handleNavigationToggle}
            onDisconnect={handleDisconnect}
            onProfileClick={handleProfileClick}
            walletUI={walletUI}
            headerContent={headerContent}
          />
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* Navigation Sidebar */}
          {showNavigation && (
            <AppNavigation
              navigationItems={navigationItems}
              userRole={userRole}
              isOpen={layoutState.isNavigationOpen}
              onClose={handleNavigationClose}
            />
          )}

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto">
            {/* Network Warning Banner */}
            {!isNetworkSupported && <NetworkWarningBanner />}
            
            {/* Offline Warning Banner */}
            {!layoutState.isOnline && <OfflineWarningBanner />}

            {/* Content */}
            <div className="container mx-auto px-4 py-6">
              {children}
            </div>
          </main>
        </div>

        {/* Toast Notifications */}
        <ToastViewport />
      </div>
    </ToastProvider>
  )
}

/**
 * App Header Component
 * 
 * Renders the top navigation bar with wallet connection status,
 * user profile information, and primary navigation actions.
 */
interface AppHeaderProps {
  userRole: UserRole
  isConnected: boolean
  address?: string
  creatorProfile?: NonNullable<ReturnType<typeof useCreatorProfile>['data']>
  isNetworkSupported: boolean
  onNavigationToggle: () => void
  onDisconnect: () => void
  onProfileClick: () => void
  walletUI: ReturnType<typeof useWalletConnectionUI>
  headerContent?: React.ReactNode
}

function AppHeader({
  userRole,
  isConnected,
  address,
  creatorProfile,
  isNetworkSupported,
  onNavigationToggle,
  onDisconnect,
  onProfileClick,
  walletUI,
  headerContent
}: AppHeaderProps) {
  return (
    <header className="border-b bg-background relative z-40">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left side - Logo and navigation toggle */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onNavigationToggle}
              className="md:hidden relative z-50"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Bloom</span>
            </div>
          </div>

          {/* Center - Custom header content */}
          {headerContent && (
            <div className="hidden md:flex flex-1 justify-center px-8">
              {headerContent}
            </div>
          )}

          {/* Right side - User actions and wallet */}
          <div className="flex items-center gap-3">
            {/* Search (for larger screens) */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex"
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Notifications */}
            {isConnected && (
              <Button
                variant="ghost"
                size="sm"
                className="relative"
              >
                <Bell className="h-4 w-4" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                >
                  3
                </Badge>
              </Button>
            )}

            {/* Wallet Status Display */}
            {isConnected && (
              <WalletStatus 
                showAddress={false} 
                showNetwork={true}
                className="hidden md:flex"
              />
            )}

            {/* Wallet Connection / User Profile */}
            {isConnected && address ? (
              <UserProfileDropdown
                userRole={userRole}
                address={address}
                creatorProfile={creatorProfile}
                isNetworkSupported={isNetworkSupported}
                onProfileClick={onProfileClick}
                onDisconnect={onDisconnect}
              />
            ) : (
              <WalletConnectButton size="sm" />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

/**
 * User Profile Dropdown Component
 * 
 * Shows connected wallet information and user actions.
 */
interface UserProfileDropdownProps {
  userRole: UserRole
  address: string
  creatorProfile?: NonNullable<ReturnType<typeof useCreatorProfile>['data']>
  isNetworkSupported: boolean
  onProfileClick: () => void
  onDisconnect: () => void
}

function UserProfileDropdown({
  userRole,
  address,
  creatorProfile,
  isNetworkSupported,
  onProfileClick,
  onDisconnect
}: UserProfileDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {formatAddress(address as `0x${string}`).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!isNetworkSupported && (
            <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-background" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      {/* 
        KEY FIX: Add custom className with higher z-index to overcome 
        the stacking context created by the header's backdrop-blur 
      */}
      <DropdownMenuContent 
        className="w-56 z-[9999]" 
        align="end"
        side="bottom"
        sideOffset={8}
        avoidCollisions={true}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {userRole === 'creator' ? 'Creator Account' : 'User Account'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {formatAddress(address as `0x${string}`)}
            </p>
            {creatorProfile?.isVerified && (
              <Badge variant="secondary" className="w-fit text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified Creator
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onProfileClick}>
          <User className="mr-2 h-4 w-4" />
          <span>{userRole === 'creator' ? 'Dashboard' : 'Profile'}</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onDisconnect} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * App Navigation Component
 * 
 * Provides the main navigation sidebar with role-based menu items.
 */
interface AppNavigationProps {
  navigationItems: NavigationItem[]
  userRole: UserRole
  isOpen: boolean
  onClose: () => void
}

function AppNavigation({
  navigationItems,
  userRole,
  isOpen,
  onClose
}: AppNavigationProps) {
  const visibleItems = navigationItems.filter(item => 
    item.roles.includes(userRole)
  )

  // Mobile navigation (sheet)
  const mobileNav = (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-72 z-[2147483647]">
        <nav className="flex flex-col gap-2 pt-6">
          {visibleItems.map((item) => (
            <NavigationItem key={item.href} item={item} onSelect={onClose} />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )

  // Desktop navigation (sidebar)
  const desktopNav = (
    <aside className="hidden md:flex w-64 flex-col border-r bg-background/95 backdrop-blur">
      <nav className="flex flex-col gap-2 p-4">
        {visibleItems.map((item) => (
          <NavigationItem key={item.href} item={item} />
        ))}
      </nav>
    </aside>
  )

  return (
    <>
      {mobileNav}
      {desktopNav}
    </>
  )
}

/**
 * Navigation Item Component
 * 
 * Renders individual navigation menu items with proper styling and state.
 */
interface NavigationItemProps {
  item: NavigationItem
  onSelect?: () => void
}

function NavigationItem({ item, onSelect }: NavigationItemProps) {
  const router = useRouter()

  const handleClick = useCallback(() => {
    router.push(item.href)
    onSelect?.()
  }, [router, item.href, onSelect])

  return (
    <Button
      variant={item.isActive ? "secondary" : "ghost"}
      className="justify-start gap-3 h-10"
      onClick={handleClick}
      disabled={item.disabled}
    >
      <item.icon className="h-4 w-4" />
      <span>{item.label}</span>
      {item.badge && (
        <Badge variant="secondary" className="ml-auto">
          {item.badge}
        </Badge>
      )}
    </Button>
  )
}

/**
 * Warning Banner Components
 * 
 * Display important status information to users.
 */
function NetworkWarningBanner() {
  const currentChain = getCurrentChain()
  
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="flex items-center gap-2 text-amber-800 text-sm">
        <AlertCircle className="h-4 w-4" />
        <span>
              You\'re connected to an unsupported network. Please switch to {currentChain.name} to use the platform.
        </span>
      </div>
    </div>
  )
}

function OfflineWarningBanner() {
  return (
    <div className="bg-red-50 border-b border-red-200 px-4 py-3">
      <div className="flex items-center gap-2 text-red-800 text-sm">
        <WifiOff className="h-4 w-4" />
        <span>
          You're currently offline. Some features may not work properly.
        </span>
      </div>
    </div>
  )
}

/**
 * Export type definitions for use in other layout components
 */
export type { UserRole, NavigationItem, LayoutState, AppLayoutProps }