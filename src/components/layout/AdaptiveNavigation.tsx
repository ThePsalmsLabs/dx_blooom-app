/**
 * AdaptiveNavigation Component - Phase 1 Navigation Unification
 * File: src/components/layout/AdaptiveNavigation.tsx
 * 
 * This component unifies the web app and mini app navigation experiences into a single
 * adaptive system that provides consistent functionality while optimizing for each context.
 * It replaces the separate AppLayout navigation and MiniAppLayout implementations with
 * intelligent contextual adaptation.
 * 
 * Key Features:
 * - Context-aware rendering (web vs miniapp)
 * - Viewport-responsive behavior (mobile, tablet, desktop)
 * - Unified navigation item system using existing useAppNavigation hook
 * - Display mode adaptation (sidebar-full, sidebar-compact, header-menu, header-compact)
 * - Seamless integration with existing styling and component patterns
 * - Performance-optimized rendering with smart state management
 * - Accessibility-first implementation with proper ARIA attributes
 * - Progressive enhancement that gracefully degrades
 * 
 * Architecture Integration:
 * - Uses existing useAppNavigation hook for navigation data
 * - Integrates with unified design tokens from design-tokens.css
 * - Maintains compatibility with existing shadcn/ui components
 * - Preserves current responsive breakpoints and interaction patterns
 * - Follows established role-based access control patterns
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAccount } from 'wagmi'
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Settings,
  User,
  LogOut,
  Shield
} from 'lucide-react'

// Import shadcn/ui components following existing patterns
import {
  Button,
  Sheet,
  SheetContent,
  SheetTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  ScrollArea
} from '@/components/ui'

// Import existing navigation logic and types
import { 
  useAppNavigation,
  type NavigationSection,
  type NavigationItem,
  type UserRole 
} from '@/components/layout/Navigation'
import { cn } from '@/lib/utils'

// ================================================
// TYPE DEFINITIONS
// ================================================

/**
 * Context Types for Adaptive Behavior
 */
export type NavigationContext = 'web' | 'miniapp'
export type ViewportSize = 'mobile' | 'tablet' | 'desktop'
export type DisplayMode = 'sidebar-full' | 'sidebar-compact' | 'header-menu' | 'header-compact'

/**
 * Component Configuration Interface
 */
export interface AdaptiveNavigationProps {
  context?: NavigationContext
  userRole: UserRole
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  showBrand?: boolean
  brandContent?: React.ReactNode
  showUserProfile?: boolean
  onUserProfileClick?: () => void
  onLogout?: () => void
  forceDisplayMode?: DisplayMode
  autoClose?: boolean
}

/**
 * Navigation State Interface
 */
interface NavigationState {
  currentDisplayMode: DisplayMode
  isCollapsed: boolean
  isMobileOpen: boolean
  expandedSections: Set<string>
  viewportSize: ViewportSize
}

/**
 * Display Mode Configuration
 */
interface DisplayModeConfig {
  showSidebar: boolean
  showHeader: boolean
  showLabels: boolean
  showDescriptions: boolean
  showSectionHeaders: boolean
  allowCollapse: boolean
  maxWidth?: string
  headerHeight?: string
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

function getViewportSize(): ViewportSize {
  if (typeof window === 'undefined') return 'desktop'
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

function getDisplayMode(
  context: NavigationContext,
  viewport: ViewportSize,
  forceMode?: DisplayMode
): DisplayMode {
  if (forceMode) return forceMode
  if (context === 'miniapp') {
    return viewport === 'mobile' ? 'header-compact' : 'header-menu'
  }
  switch (viewport) {
    case 'mobile':
      return 'header-menu'
    case 'tablet':
      return 'sidebar-compact'
    case 'desktop':
      return 'sidebar-full'
    default:
      return 'sidebar-full'
  }
}

function getDisplayModeConfig(mode: DisplayMode): DisplayModeConfig {
  const configs: Record<DisplayMode, DisplayModeConfig> = {
    'sidebar-full': {
      showSidebar: true,
      showHeader: false,
      showLabels: true,
      showDescriptions: true,
      showSectionHeaders: true,
      allowCollapse: true,
      maxWidth: 'var(--nav-sidebar-width-expanded)'
    },
    'sidebar-compact': {
      showSidebar: true,
      showHeader: false,
      showLabels: false,
      showDescriptions: false,
      showSectionHeaders: false,
      allowCollapse: false,
      maxWidth: 'var(--nav-sidebar-width-collapsed)'
    },
    'header-menu': {
      showSidebar: false,
      showHeader: true,
      showLabels: true,
      showDescriptions: true,
      showSectionHeaders: true,
      allowCollapse: false,
      headerHeight: 'var(--nav-current-height)'
    },
    'header-compact': {
      showSidebar: false,
      showHeader: true,
      showLabels: false,
      showDescriptions: false,
      showSectionHeaders: false,
      allowCollapse: false,
      headerHeight: 'var(--nav-header-height-compact)'
    }
  }
  return configs[mode]
}

// ================================================
// MAIN COMPONENT
// ================================================

export function AdaptiveNavigation({
  context = 'web',
  userRole,
  isOpen: controlledOpen,
  onOpenChange,
  className,
  showBrand = true,
  brandContent,
  showUserProfile = true,
  onUserProfileClick,
  onLogout,
  forceDisplayMode,
  autoClose = true
}: AdaptiveNavigationProps): React.ReactElement {
  const router = useRouter()
  const pathname = usePathname()
  const { address, isConnected } = useAccount()

  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentDisplayMode: 'sidebar-full',
    isCollapsed: false,
    isMobileOpen: false,
    expandedSections: new Set(['main']),
    viewportSize: 'desktop'
  })

  const isOpen = controlledOpen ?? navigationState.isMobileOpen
  const setIsOpen = useCallback((open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open)
    } else {
      setNavigationState(prev => ({ ...prev, isMobileOpen: open }))
    }
  }, [onOpenChange])

  useEffect(() => {
    function updateViewport() {
      const viewport = getViewportSize()
      const displayMode = getDisplayMode(context, viewport, forceDisplayMode)
      setNavigationState(prev => ({
        ...prev,
        viewportSize: viewport,
        currentDisplayMode: displayMode
      }))
    }
    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [context, forceDisplayMode])

  const navigationSections = useAppNavigation(userRole)
  const displayConfig = useMemo(() => getDisplayModeConfig(navigationState.currentDisplayMode), [navigationState.currentDisplayMode])

  const handleNavigationClick = useCallback((href: string, onClick?: () => void) => {
    if (onClick) {
      onClick()
    } else {
      router.push(href)
    }
    if (autoClose && navigationState.currentDisplayMode === 'header-menu') {
      setIsOpen(false)
    }
  }, [router, autoClose, navigationState.currentDisplayMode, setIsOpen])

  const handleSectionToggle = useCallback((sectionId: string) => {
    setNavigationState(prev => {
      const expanded = new Set(prev.expandedSections)
      if (expanded.has(sectionId)) {
        expanded.delete(sectionId)
      } else {
        expanded.add(sectionId)
      }
      return { ...prev, expandedSections: expanded }
    })
  }, [])

  const handleCollapseToggle = useCallback(() => {
    if (!displayConfig.allowCollapse) return
    setNavigationState(prev => ({
      ...prev,
      isCollapsed: !prev.isCollapsed,
      currentDisplayMode: prev.isCollapsed ? 'sidebar-full' : 'sidebar-compact'
    }))
  }, [displayConfig.allowCollapse])

  const renderBrand = (): React.ReactElement | null => {
    if (!showBrand) return null
    const content = brandContent || (
      <div className="flex items-center gap-2">
        <Shield className="nav-icon-adaptive text-primary" />
        {displayConfig.showLabels && (
          <span className="font-bold text-base text-adaptive-base">Bloom</span>
        )}
      </div>
    )
    return (
      <div className="space-content-padding border-b border-border/30">
        <div className="nav-adaptive flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="p-0 h-auto hover:bg-transparent"
          >
            {content}
          </Button>
          {displayConfig.allowCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCollapseToggle}
              className="nav-icon-adaptive"
            >
              {navigationState.isCollapsed ? <ChevronRight /> : <ChevronLeft />}
            </Button>
          )}
        </div>
      </div>
    )
  }

  const renderNavigationItem = (item: NavigationItem): React.ReactElement => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
    const ItemIcon = item.icon
    const button = (
      <Button
        variant={isActive ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleNavigationClick(item.href, item.onClick)}
        disabled={item.disabled}
        className={cn(
          'w-full justify-start gap-3 nav-item-adaptive touch-target-optimized transition-adaptive',
          isActive && 'bg-primary text-primary-foreground',
          item.disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <ItemIcon className="nav-icon-adaptive flex-shrink-0" />
        {displayConfig.showLabels && (
          <div className="flex-1 min-w-0 text-left">
            <div className="font-medium text-adaptive-base">{item.label}</div>
            {displayConfig.showDescriptions && item.description && (
              <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {item.description}
              </div>
            )}
          </div>
        )}
        <div className="flex items-center gap-1">
          {item.badge && (
            <Badge variant="secondary" className="text-xs">
              {item.badge}
            </Badge>
          )}
          {item.isNew && (
            <Badge variant="default" className="text-xs bg-blue-500 text-white">
              New
            </Badge>
          )}
        </div>
      </Button>
    )
    if (!displayConfig.showLabels) {
      return (
        <TooltipProvider key={item.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent align="end" className="max-w-xs">
              <div className="font-medium">{item.label}</div>
              {item.description && (
                <div className="text-xs text-muted-foreground mt-1">
                  {item.description}
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }
    return <div key={item.id}>{button}</div>
  }

  const renderNavigationSection = (section: NavigationSection): React.ReactElement | null => {
    const isExpanded = navigationState.expandedSections.has(section.id)
    const visibleItems = section.items.filter(item => item.roles.includes(userRole))
    if (visibleItems.length === 0) return null
    return (
      <div key={section.id} className="space-y-1">
        {displayConfig.showSectionHeaders && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSectionToggle(section.id)}
            className="w-full justify-between text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <span>{section.label}</span>
            {section.isCollapsible && (
              <ChevronRight 
                className={cn(
                  'h-3 w-3 transition-transform',
                  isExpanded && 'rotate-90'
                )}
              />
            )}
          </Button>
        )}
        {(isExpanded || !section.isCollapsible) && (
          <div className="space-y-1 pl-2">
            {visibleItems.map(renderNavigationItem)}
          </div>
        )}
      </div>
    )
  }

  const renderUserProfile = (): React.ReactElement | null => {
    if (!showUserProfile || !isConnected) return null
    const profileButton = (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-3">
            <User className="nav-icon-adaptive" />
            {displayConfig.showLabels && (
              <div className="flex-1 min-w-0 text-left">
                <div className="font-medium text-adaptive-base">Account</div>
                <div className="text-xs text-muted-foreground">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
                </div>
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onUserProfileClick}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    return (
      <div className="border-t border-border/30 pt-4">
        {profileButton}
      </div>
    )
  }

  const renderNavigationContent = (): React.ReactElement => (
    <div className="flex flex-col h-full">
      {renderBrand()}
      <ScrollArea className="flex-1 space-content-padding">
        <nav className="space-y-4">
          {navigationSections.map(renderNavigationSection)}
        </nav>
      </ScrollArea>
      {renderUserProfile()}
    </div>
  )

  if (displayConfig.showSidebar) {
    return (
      <aside 
        className={cn(
          'fixed left-0 top-0 z-40 h-full border-r bg-background/95 backdrop-blur transition-adaptive',
          'hidden md:flex flex-col',
          className
        )}
        style={{ width: displayConfig.maxWidth }}
        data-context={context}
        data-display-mode={navigationState.currentDisplayMode}
      >
        {renderNavigationContent()}
      </aside>
    )
  }

  return (
    <div 
      className={cn('md:hidden', className)}
      data-context={context}
      data-display-mode={navigationState.currentDisplayMode}
    >
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="nav-adaptive touch-target-optimized hamburger-button"
            aria-label="Toggle navigation menu"
          >
            <Menu className="nav-icon-adaptive" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-80 p-0 navigation-sidebar"
          style={{ height: '100vh' }}
        >
          {renderNavigationContent()}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ================================================
// ADDITIONAL COMPONENTS
// ================================================

interface AdaptiveNavigationHeaderProps {
  context?: NavigationContext
  userRole: UserRole
  onUserProfileClick?: () => void
  onLogout?: () => void
  className?: string
  children?: React.ReactNode
}

export function AdaptiveNavigationHeader({
  context = 'web',
  userRole,
  onUserProfileClick,
  onLogout,
  className,
  children
}: AdaptiveNavigationHeaderProps): React.ReactElement {
  return (
    <header 
      className={cn(
        'border-b bg-background/95 backdrop-blur sticky top-0 z-50 nav-adaptive',
        className
      )}
      data-context={context}
    >
      <div className="container-unified flex items-center justify-between space-content-padding">
        <div className="flex items-center gap-4">
          <AdaptiveNavigation
            context={context}
            userRole={userRole}
            onUserProfileClick={onUserProfileClick}
            onLogout={onLogout}
            showBrand={false}
          />
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Bloom</span>
          </div>
        </div>
        {children && (
          <div className="flex-1 flex justify-center px-8">
            {children}
          </div>
        )}
        <div className="flex items-center gap-2"></div>
      </div>
    </header>
  )
}

// ================================================
// LAYOUT INTEGRATION COMPONENT
// ================================================

interface AdaptiveLayoutProps {
  context?: NavigationContext
  userRole: UserRole
  children: React.ReactNode
  showNavigation?: boolean
  showHeader?: boolean
  headerContent?: React.ReactNode
  onUserProfileClick?: () => void
  onLogout?: () => void
  className?: string
}

export function AdaptiveLayout({
  context = 'web',
  userRole,
  children,
  showNavigation = true,
  showHeader = true,
  headerContent,
  onUserProfileClick,
  onLogout,
  className
}: AdaptiveLayoutProps): React.ReactElement {
  const [viewport, setViewport] = useState<ViewportSize>('desktop')
  useEffect(() => {
    const updateViewport = () => setViewport(getViewportSize())
    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])
  const displayMode = getDisplayMode(context, viewport)
  const config = getDisplayModeConfig(displayMode)
  return (
    <div 
      className={cn('min-h-screen bg-background', className)}
      data-context={context}
    >
      {showHeader && (
        <AdaptiveNavigationHeader
          context={context}
          userRole={userRole}
          onUserProfileClick={onUserProfileClick}
          onLogout={onLogout}
        >
          {headerContent}
        </AdaptiveNavigationHeader>
      )}
      <div className="flex">
        {showNavigation && config.showSidebar && (
          <AdaptiveNavigation
            context={context}
            userRole={userRole}
            onUserProfileClick={onUserProfileClick}
            onLogout={onLogout}
          />
        )}
        <main 
          className={cn(
            'flex-1 transition-adaptive',
            config.showSidebar && 'md:ml-64'
          )}
          style={{ marginLeft: config.showSidebar ? config.maxWidth : 0 }}
        >
          <div className="container-unified space-section-padding">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdaptiveNavigation

