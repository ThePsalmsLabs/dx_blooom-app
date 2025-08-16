/**
 * AdaptiveNavigation Component - Phase 1 Navigation Unification
 * File: src/components/layout/AdaptiveNavigation.tsx
 * 
 * This component unifies the web app and mini app navigation experiences into a single
 * adaptive system that provides consistent functionality while optimizing for each context.
 * It replaces the separate AppLayout navigation implementations with intelligent
 * contextual adaptation, building progressively on the enhanced design tokens.
 * 
 * Key Features:
 * - Context-aware rendering (web vs miniapp) using design tokens
 * - Viewport-responsive behavior (mobile, tablet, desktop)
 * - Progressive enhancement that builds on design token foundation
 * - Unified navigation item system using existing Navigation.tsx patterns
 * - Display mode adaptation (sidebar-full, sidebar-compact, header-menu, header-compact)
 * - Seamless integration with existing shadcn/ui components and styling patterns
 * - Performance-optimized rendering with smart state management
 * - Accessibility-first implementation with proper ARIA attributes
 * - Role-based access control using established UserRole patterns
 * 
 * Architecture Integration:
 * - Builds on enhanced design tokens from design-tokens.css
 * - Uses existing navigation patterns from Navigation.tsx (useAppNavigation function)
 * - Maintains compatibility with existing shadcn/ui components
 * - Preserves current responsive breakpoints and interaction patterns
 * - Follows established role-based access control patterns
 * - Integrates with wagmi wallet state and Next.js routing
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAccount } from 'wagmi'
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Settings,
  User,
  LogOut,
  X,
  MoreHorizontal,
  Home
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
  ScrollArea,
  Avatar,
  AvatarFallback
} from '@/components/ui'

// Import existing navigation logic and types from Navigation.tsx
import { 
  useAppNavigation,
  type NavigationSection,
  type NavigationItem,
  type UserRole 
} from '@/components/layout/Navigation'
import { cn, formatAddress } from '@/lib/utils'

// ================================================
// TYPE DEFINITIONS FOR ADAPTIVE BEHAVIOR
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
  /** Current application context (web or miniapp) */
  context?: NavigationContext
  /** Current user role for filtering navigation items */
  userRole: UserRole
  /** Whether navigation is open (for mobile/compact modes) */
  isOpen?: boolean
  /** Callback when navigation open state changes */
  onOpenChange?: (open: boolean) => void
  /** Custom CSS class name */
  className?: string
  /** Whether to show brand/logo area */
  showBrand?: boolean
  /** Custom brand content to display */
  brandContent?: React.ReactNode
  /** Whether to show user profile section */
  showUserProfile?: boolean
  /** Callback when user profile is clicked */
  onUserProfileClick?: () => void
  /** Callback when logout is triggered */
  onLogout?: () => void
  /** Force a specific display mode (override automatic detection) */
  forceDisplayMode?: DisplayMode
  /** Whether to auto-close navigation after item selection (mobile) */
  autoClose?: boolean
  /** Additional custom navigation items to append */
  additionalItems?: NavigationItem[]
}

/**
 * Navigation State Interface
 */
interface NavigationState {
  displayMode: DisplayMode
  isCollapsed: boolean
  activeItemId: string | null
  hoveredItemId: string | null
  isTransitioning: boolean
}

/**
 * Viewport Detection Hook
 * Uses the design tokens responsive breakpoints for consistency
 */
function useViewportSize(): ViewportSize {
  const [viewportSize, setViewportSize] = useState<ViewportSize>('desktop')

  useEffect(() => {
    const updateViewportSize = () => {
      const width = window.innerWidth
      // Using standard design token breakpoints: 640px (mobile), 768px (tablet), 1024px+ (desktop)
      if (width < 640) {
        setViewportSize('mobile')
      } else if (width < 1024) {
        setViewportSize('tablet')
      } else {
        setViewportSize('desktop')
      }
    }

    updateViewportSize()
    window.addEventListener('resize', updateViewportSize)
    return () => window.removeEventListener('resize', updateViewportSize)
  }, [])

  return viewportSize
}

/**
 * Display Mode Detection
 * Determines the appropriate navigation display mode based on context and viewport
 */
function useDisplayMode(
  context: NavigationContext,
  viewport: ViewportSize,
  forceMode?: DisplayMode
): DisplayMode {
  return useMemo(() => {
    if (forceMode) return forceMode

    // Mini app context always uses compact modes
    if (context === 'miniapp') {
      return viewport === 'mobile' ? 'header-compact' : 'header-menu'
    }

    // Web context adapts to viewport
    switch (viewport) {
      case 'mobile':
        return 'header-compact'
      case 'tablet':
        return 'sidebar-compact'
      case 'desktop':
      default:
        return 'sidebar-full'
    }
  }, [context, viewport, forceMode])
}

// ================================================
// MAIN ADAPTIVE NAVIGATION COMPONENT
// ================================================

/**
 * AdaptiveNavigation Component
 * 
 * The main component that provides unified navigation across contexts.
 * Uses intelligent adaptation to provide the optimal experience for each context
 * while maintaining consistent functionality and interaction patterns.
 */
export function AdaptiveNavigation({
  context = 'web',
  userRole,
  isOpen = false,
  onOpenChange,
  className,
  showBrand = true,
  brandContent,
  showUserProfile = true,
  onUserProfileClick,
  onLogout,
  forceDisplayMode,
  autoClose = true,
  additionalItems = []
}: AdaptiveNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { address, isConnected } = useAccount()
  
  // Viewport detection using design token breakpoints
  const viewport = useViewportSize()
  const displayMode = useDisplayMode(context, viewport, forceDisplayMode)
  
  // Navigation state management
  const [navigationState, setNavigationState] = useState<NavigationState>({
    displayMode,
    isCollapsed: false,
    activeItemId: null,
    hoveredItemId: null,
    isTransitioning: false
  })

  // Get navigation sections using existing useAppNavigation pattern
  const navigationSections = useAppNavigation(userRole)
  
  // Combine navigation items from sections with additional items
  const allNavigationItems = useMemo(() => {
    const sectionItems = navigationSections.flatMap(section => section.items)
    return [...sectionItems, ...additionalItems]
  }, [navigationSections, additionalItems])

  // Update display mode when dependencies change
  useEffect(() => {
    setNavigationState(prev => ({ ...prev, displayMode }))
  }, [displayMode])

  // Update active item based on current pathname
  useEffect(() => {
    const activeItem = allNavigationItems.find(item => 
      pathname === item.href || pathname.startsWith(item.href + '/')
    )
    setNavigationState(prev => ({ 
      ...prev, 
      activeItemId: activeItem?.id || null 
    }))
  }, [pathname, allNavigationItems])

  // Navigation item click handler
  const handleNavigationClick = useCallback((item: NavigationItem) => {
    if (item.disabled) return

    if (item.onClick) {
      item.onClick()
    } else {
      router.push(item.href)
    }

    // Auto-close on mobile if enabled
    if (autoClose && (displayMode === 'header-compact' || displayMode === 'header-menu')) {
      onOpenChange?.(false)
    }
  }, [router, displayMode, autoClose, onOpenChange])

  // User profile click handler
  const handleUserProfileClick = useCallback(() => {
    if (onUserProfileClick) {
      onUserProfileClick()
    } else {
      router.push('/profile')
    }
  }, [onUserProfileClick, router])

  // Logout handler
  const handleLogout = useCallback(() => {
    if (onLogout) {
      onLogout()
    }
    // Default logout behavior could be added here
  }, [onLogout])

  // Sidebar collapse toggle (for sidebar modes)
  const handleSidebarToggle = useCallback(() => {
    setNavigationState(prev => ({ ...prev, isCollapsed: !prev.isCollapsed }))
  }, [])

  // ===== RENDER METHODS FOR DIFFERENT DISPLAY MODES =====

  /**
   * Renders sidebar navigation (desktop/tablet modes)
   */
  const renderSidebar = () => {
    const isCompact = displayMode === 'sidebar-compact' || navigationState.isCollapsed
    const width = isCompact ? 'w-[var(--nav-sidebar-width-collapsed)]' : 'w-[var(--nav-sidebar-width-expanded)]'

    return (
      <aside 
        className={cn(
          'nav-sidebar-adaptive flex flex-col border-r bg-background/95 backdrop-blur transition-adaptive',
          width,
          className
        )}
        data-context={context}
        data-display-mode={displayMode}
      >
        {/* Brand Section */}
        {showBrand && (
          <div className="space-section-padding border-b">
            {brandContent || (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Home className="w-4 h-4 text-primary-foreground" />
                </div>
                {!isCompact && (
                  <div className="flex flex-col">
                    <span className="font-semibold text-adaptive-base">Platform</span>
                    <span className="text-xs text-muted-foreground">Creator Economy</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Navigation Content */}
        <ScrollArea className="flex-1 space-content-padding">
          <nav className="space-y-2">
            {navigationSections.map((section) => (
              <NavigationSectionComponent
                key={section.id}
                section={section}
                displayMode={displayMode}
                isCompact={isCompact}
                activeItemId={navigationState.activeItemId}
                onItemClick={handleNavigationClick}
              />
            ))}
          </nav>
        </ScrollArea>

        {/* User Profile Section */}
        {showUserProfile && isConnected && (
          <div className="space-section-padding border-t">
            <UserProfileSection
              address={address}
              userRole={userRole}
              isCompact={isCompact}
              onProfileClick={handleUserProfileClick}
              onLogout={handleLogout}
            />
          </div>
        )}

        {/* Sidebar Toggle Button */}
        {displayMode === 'sidebar-full' && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSidebarToggle}
              className="w-full justify-start gap-2 touch-target-optimized"
            >
              {navigationState.isCollapsed ? (
                <ChevronRight className="nav-icon-adaptive" />
              ) : (
                <ChevronLeft className="nav-icon-adaptive" />
              )}
              {!isCompact && <span className="text-adaptive-base">Collapse</span>}
            </Button>
          </div>
        )}
      </aside>
    )
  }

  /**
   * Renders header navigation (mobile/miniapp modes)
   */
  const renderHeader = () => {
    const isCompact = displayMode === 'header-compact'

    return (
      <header 
        className={cn(
          'nav-adaptive flex items-center justify-between space-content-padding border-b bg-background/95 backdrop-blur',
          className
        )}
        data-context={context}
        data-display-mode={displayMode}
      >
        {/* Brand/Logo */}
        {showBrand && (
          <div className="flex items-center gap-3">
            {brandContent || (
              <>
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Home className="w-4 h-4 text-primary-foreground" />
                </div>
                {!isCompact && (
                  <span className="font-semibold text-adaptive-base">Platform</span>
                )}
              </>
            )}
          </div>
        )}

        {/* Navigation Items (header-menu mode) */}
        {displayMode === 'header-menu' && (
          <nav className="flex items-center space-component-gap">
            {allNavigationItems.slice(0, 4).map((item) => (
              <HeaderNavigationItem
                key={item.id}
                item={item}
                isActive={navigationState.activeItemId === item.id}
                onClick={() => handleNavigationClick(item)}
              />
            ))}
            {allNavigationItems.length > 4 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="touch-target-optimized">
                    <MoreHorizontal className="nav-icon-adaptive" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {allNavigationItems.slice(4).map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => handleNavigationClick(item)}
                      disabled={item.disabled}
                    >
                      <item.icon className="mr-2 nav-icon-adaptive" />
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
        )}

        {/* Mobile Menu Toggle */}
        {displayMode === 'header-compact' && (
          <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="touch-target-optimized">
                <Menu className="nav-icon-adaptive" />
                <span className="sr-only">Open navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <MobileNavigationContent
                sections={[...navigationSections]}
                userRole={userRole}
                activeItemId={navigationState.activeItemId}
                showUserProfile={showUserProfile}
                address={address}
                isConnected={isConnected}
                onItemClick={handleNavigationClick}
                onProfileClick={handleUserProfileClick}
                onLogout={handleLogout}
                onClose={() => onOpenChange?.(false)}
              />
            </SheetContent>
          </Sheet>
        )}

        {/* User Profile (header modes) */}
        {showUserProfile && isConnected && displayMode === 'header-menu' && (
          <UserProfileDropdown
            address={address}
            userRole={userRole}
            onProfileClick={handleUserProfileClick}
            onLogout={handleLogout}
          />
        )}
      </header>
    )
  }

  // ===== MAIN RENDER =====

  const isSidebarMode = displayMode === 'sidebar-full' || displayMode === 'sidebar-compact'
  const isHeaderMode = displayMode === 'header-menu' || displayMode === 'header-compact'

  return (
    <TooltipProvider>
      <div 
        className={cn('adaptive-navigation-container', className)}
        data-context={context}
        data-display-mode={displayMode}
        data-viewport={viewport}
      >
        {isSidebarMode && renderSidebar()}
        {isHeaderMode && renderHeader()}
      </div>
    </TooltipProvider>
  )
}

// ================================================
// SUPPORTING COMPONENTS
// ================================================

/**
 * Navigation Section Component
 * Renders a group of navigation items with optional section header
 */
interface NavigationSectionComponentProps {
  section: NavigationSection
  displayMode: DisplayMode
  isCompact: boolean
  activeItemId: string | null
  onItemClick: (item: NavigationItem) => void
}

function NavigationSectionComponent({
  section,
  isCompact,
  activeItemId,
  onItemClick
}: NavigationSectionComponentProps) {
  const [isExpanded, setIsExpanded] = useState(section.defaultExpanded ?? true)

  const visibleItems = section.items.filter(item => !item.disabled)
  if (visibleItems.length === 0) return null

  return (
    <div className="space-y-1">
      {/* Section Header */}
      {!isCompact && section.label && (
        <div className="flex items-center justify-between px-2 py-1">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {section.label}
          </h3>
          {section.isCollapsible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              <ChevronRight 
                className={cn(
                  'h-3 w-3 transition-transform',
                  isExpanded && 'rotate-90'
                )}
              />
            </Button>
          )}
        </div>
      )}

      {/* Section Items */}
      {(isExpanded || isCompact) && (
        <div className="space-y-1">
          {visibleItems.map((item) => (
            <SidebarNavigationItem
              key={item.id}
              item={item}
              isCompact={isCompact}
              isActive={activeItemId === item.id}
              onClick={() => onItemClick(item)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Sidebar Navigation Item Component
 */
interface SidebarNavigationItemProps {
  item: NavigationItem
  isCompact: boolean
  isActive: boolean
  onClick: () => void
}

function SidebarNavigationItem({
  item,
  isCompact,
  isActive,
  onClick
}: SidebarNavigationItemProps) {
  const buttonContent = (
    <>
      <item.icon className={cn('nav-icon-adaptive flex-shrink-0')} />
      {!isCompact && (
        <>
          <span className="text-adaptive-base font-weight-adaptive-normal truncate">
            {item.label}
          </span>
          <div className="ml-auto flex items-center gap-1">
            {item.badge && (
              <Badge variant="secondary" className="text-xs">
                {item.badge}
              </Badge>
            )}
            {item.isNew && (
              <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                New
              </Badge>
            )}
          </div>
        </>
      )}
    </>
  )

  if (isCompact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? 'secondary' : 'ghost'}
            size="sm"
            onClick={onClick}
            disabled={item.disabled}
            className={cn(
              'nav-item-adaptive w-full justify-start gap-3 px-2 touch-target-optimized',
              isActive && 'bg-secondary font-weight-adaptive-medium'
            )}
          >
            {buttonContent}
          </Button>
        </TooltipTrigger>
        <TooltipContent align="end" className="flex flex-col gap-1">
          <span className="font-medium">{item.label}</span>
          {item.description && (
            <span className="text-xs text-muted-foreground">{item.description}</span>
          )}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Button
      variant={isActive ? 'secondary' : 'ghost'}
      size="sm"
      onClick={onClick}
      disabled={item.disabled}
      className={cn(
        'nav-item-adaptive w-full justify-start gap-3 px-2 touch-target-optimized',
        isActive && 'bg-secondary font-weight-adaptive-medium'
      )}
    >
      {buttonContent}
    </Button>
  )
}

/**
 * Header Navigation Item Component
 */
interface HeaderNavigationItemProps {
  item: NavigationItem
  isActive: boolean
  onClick: () => void
}

function HeaderNavigationItem({ item, isActive, onClick }: HeaderNavigationItemProps) {
  return (
    <Button
      variant={isActive ? 'secondary' : 'ghost'}
      size="sm"
      onClick={onClick}
      disabled={item.disabled}
      className={cn(
        'touch-target-optimized gap-2',
        isActive && 'font-weight-adaptive-medium'
      )}
    >
      <item.icon className="nav-icon-adaptive" />
      <span className="text-adaptive-base">{item.label}</span>
      {item.badge && (
        <Badge variant="secondary" className="text-xs">
          {item.badge}
        </Badge>
      )}
    </Button>
  )
}

/**
 * User Profile Section Component (for sidebar)
 */
interface UserProfileSectionProps {
  address: `0x${string}` | undefined
  userRole: UserRole
  isCompact: boolean
  onProfileClick: () => void
  onLogout: () => void
}

function UserProfileSection({
  address,
  userRole,
  isCompact,
  onProfileClick,
  onLogout
}: UserProfileSectionProps) {
  if (!address) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={cn(
            'w-full justify-start gap-3 touch-target-optimized',
            isCompact ? 'px-2' : 'px-3'
          )}
        >
          <Avatar className="w-6 h-6">
            <AvatarFallback className="text-xs">
              {address.slice(2, 4).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!isCompact && (
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium">
                {formatAddress(address)}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {userRole}
              </span>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onProfileClick}>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
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
}

/**
 * User Profile Dropdown Component (for header)
 */
interface UserProfileDropdownProps {
  address: `0x${string}` | undefined
  userRole: UserRole
  onProfileClick: () => void
  onLogout: () => void
}

function UserProfileDropdown({
  address,
  onProfileClick,
  onLogout
}: UserProfileDropdownProps) {
  if (!address) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="touch-target-optimized gap-2">
          <Avatar className="w-6 h-6">
            <AvatarFallback className="text-xs">
              {address.slice(2, 4).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-adaptive-base hidden sm:inline">
            {formatAddress(address)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onProfileClick}>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
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
}

/**
 * Mobile Navigation Content Component
 */
interface MobileNavigationContentProps {
  sections: NavigationSection[]
  userRole: UserRole
  activeItemId: string | null
  showUserProfile: boolean
  address: `0x${string}` | undefined
  isConnected: boolean
  onItemClick: (item: NavigationItem) => void
  onProfileClick: () => void
  onLogout: () => void
  onClose: () => void
}

function MobileNavigationContent({
  sections,
  userRole,
  activeItemId,
  showUserProfile,
  address,
  isConnected,
  onItemClick,
  onProfileClick,
  onLogout,
  onClose
}: MobileNavigationContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Navigation</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation Content */}
      <ScrollArea className="flex-1 p-4">
        <nav className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="space-y-2">
              {section.label && (
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.label}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeItemId === item.id ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => onItemClick(item)}
                    disabled={item.disabled}
                    className="w-full justify-start gap-3 touch-target-optimized"
                  >
                    <item.icon className="nav-icon-adaptive" />
                    <span className="text-adaptive-base">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* User Profile Footer */}
      {showUserProfile && isConnected && address && (
        <div className="p-4 border-t">
          <UserProfileSection
            address={address}
            userRole={userRole}
            isCompact={false}
            onProfileClick={onProfileClick}
            onLogout={onLogout}
          />
        </div>
      )}
    </div>
  )
}

// ================================================
// EXPORTS
// ================================================

export default AdaptiveNavigation

// Export types for external usage
// export type {
//   NavigationContext,
//   ViewportSize,
//   DisplayMode,
//   AdaptiveNavigationProps
// }