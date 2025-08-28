/**
 * Enhanced Application Navigation Component - Phase 3 Navigation Update
 * File: src/components/layout/Navigation.tsx
 * 
 * This enhancement builds upon the existing Navigation.tsx to integrate the new
 * UserSubscriptionDashboard component into the platform's navigation architecture.
 * It maintains backward compatibility while adding comprehensive user subscription
 * management capabilities through intuitive menu organization.
 * 
 * Integration Strategy:
 * - Preserves existing navigation patterns and user flows
 * - Adds Phase 3 subscription management features through logical menu groupings
 * - Provides role-based access to subscription features for consumers, creators, and admins
 * - Maintains responsive design across all device sizes
 * - Integrates subscription management into the natural user workflow
 * 
 * Key Enhancements:
 * - Added "My Account" section for user-specific features including subscription management
 * - Integrated UserSubscriptionDashboard under intuitive "Subscription Management" navigation
 * - Enhanced role-based visibility to ensure subscription features are available to all user types
 * - Added proper icons and descriptions for subscription-related navigation items
 * - Maintained consistency with existing navigation patterns and styling
 */

import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Search, 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Activity,
  Compass,
  BookOpen,
  Settings,
  Shield,
  Users,
  Target,
  Zap,
  CreditCard,
  User,
  RefreshCw,
  Calendar,
  Wallet,
  Sparkles
} from 'lucide-react'

// ===== NAVIGATION TYPES =====

export interface NavigationSection {
  readonly id: string
  readonly label: string
  readonly description?: string
  readonly items: readonly NavigationItem[]
  readonly roles: readonly UserRole[]
  readonly isCollapsible?: boolean
  readonly defaultExpanded?: boolean
}

export interface NavigationItem {
  readonly id: string
  readonly label: string
  readonly href: string
  readonly icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  readonly description?: string
  readonly roles: readonly UserRole[]
  readonly badge?: string
  readonly isNew?: boolean
  readonly isActive?: boolean
  readonly disabled?: boolean
  readonly onClick?: () => void
}

export type UserRole = 'disconnected' | 'consumer' | 'creator' | 'admin'

// ===== ENHANCED NAVIGATION CONFIGURATION =====

/**
 * Enhanced Navigation Configuration
 * 
 * This configuration extends the existing navigation structure to include
 * comprehensive subscription management capabilities while maintaining
 * intuitive user flows and role-based access control.
 */
export function useAppNavigation(userRole: UserRole): readonly NavigationSection[] {
  const pathname = usePathname()

  return useMemo(() => {
    const sections: NavigationSection[] = []

    // ===== CORE PLATFORM SECTION =====
    // Essential platform functions available to all users
    sections.push({
      id: 'platform-core',
      label: 'Platform',
      items: [
        {
          id: 'home',
          label: 'Home',
          href: '/',
          icon: Home,
          description: 'Platform overview and quick access',
          roles: ['disconnected', 'consumer', 'creator', 'admin'],
          isActive: pathname === '/'
        },
        {
          id: 'browse-content',
          label: 'Browse Content', 
          href: '/browse',
          icon: Compass,
          description: 'Discover content across all categories',
          roles: ['disconnected', 'consumer', 'creator', 'admin'],
          isActive: pathname.startsWith('/browse')
        },
        {
          id: 'creators-directory',
          label: 'Creators',
          href: '/creators',
          icon: Users,
          description: 'Discover and support amazing creators',
          roles: ['disconnected', 'consumer', 'creator', 'admin'],
          isActive: pathname.startsWith('/creators')
        },
        {
          id: 'collections',
          label: 'NFT Collections',
          href: '/collections',
          icon: Sparkles,
          description: 'Browse and collect NFT content on Zora',
          roles: ['disconnected', 'consumer', 'creator', 'admin'],
          isNew: true, // New NFT feature
          isActive: pathname.startsWith('/collections')
        }
      ],
      roles: ['disconnected', 'consumer', 'creator', 'admin'],
      defaultExpanded: true
    })

    // ===== CONTENT DISCOVERY SECTION =====
    // Advanced content discovery features for enhanced user experience
    sections.push({
      id: 'content-discovery',
      label: 'Discovery & Search',
      description: 'Advanced content exploration tools',
      items: [
        {
          id: 'content-discovery-interface',
          label: 'Advanced Search',
          href: '/discovery',
          icon: Search,
          description: 'Filter by category, tag, price, and creator',
          roles: ['consumer', 'creator', 'admin'],
          isNew: true, // Highlight as new Phase 2 feature
          isActive: pathname.startsWith('/discovery')
        },
        {
          id: 'content-categories',
          label: 'Browse Categories',
          href: '/discovery/categories',
          icon: BookOpen,
          description: 'Explore content by category',
          roles: ['consumer', 'creator', 'admin'],
          isActive: pathname.startsWith('/discovery/categories')
        },
        {
          id: 'trending-content',
          label: 'Trending Now',
          href: '/discovery/trending',
          icon: TrendingUp,
          description: 'Most popular and engaging content',
          roles: ['consumer', 'creator', 'admin'],
          isActive: pathname.startsWith('/discovery/trending')
        }
      ],
      roles: ['consumer', 'creator', 'admin'],
      isCollapsible: true,
      defaultExpanded: false
    })

    // ===== NEW: MY ACCOUNT SECTION =====
    // User-specific features including subscription management
    // This section is available to all connected users (consumers, creators, and admins)
    if (userRole !== 'disconnected') {
      sections.push({
        id: 'my-account',
        label: 'My Account',
        description: 'Personal account and subscription management',
        items: [
          {
            id: 'user-profile',
            label: 'Profile',
            href: '/profile',
            icon: User,
            description: 'View and edit your profile information',
            roles: ['consumer', 'creator', 'admin'],
            isActive: pathname === '/profile'
          },
          {
            id: 'subscription-management',
            label: 'Subscription Management',
            href: '/subscriptions',
            icon: CreditCard,
            description: 'Manage your content subscriptions and auto-renewal settings',
            roles: ['consumer', 'creator', 'admin'],
            isNew: true, // Highlight as new Phase 3 feature
            isActive: pathname.startsWith('/subscriptions')
          },
          {
            id: 'billing-history',
            label: 'Billing History',
            href: '/billing',
            icon: Calendar,
            description: 'View your transaction history and receipts',
            roles: ['consumer', 'creator', 'admin'],
            isActive: pathname.startsWith('/billing')
          },
          {
            id: 'portfolio',
            label: 'Portfolio',
            href: '/portfolio',
            icon: BarChart3,
            description: 'View your token balances and portfolio analytics',
            roles: ['consumer', 'creator', 'admin'],
            isNew: true, // Highlight as new feature
            isActive: pathname.startsWith('/portfolio')
          },
          {
            id: 'wallet-settings',
            label: 'Wallet Settings',
            href: '/wallet',
            icon: Wallet,
            description: 'Manage connected wallets and payment methods',
            roles: ['consumer', 'creator', 'admin'],
            isActive: pathname.startsWith('/wallet')
          }
        ],
        roles: ['consumer', 'creator', 'admin'],
        isCollapsible: true,
        defaultExpanded: true // Expanded by default for easy access to subscription management
      })
    }

    // ===== CREATOR SECTION =====
    // Creator-specific features including analytics integration
    if (userRole === 'creator') {
      sections.push({
        id: 'creator-tools',
        label: 'Creator Tools',
        description: 'Content management and performance analytics',
        items: [
          {
            id: 'creator-dashboard',
            label: 'Dashboard',
            href: '/dashboard',
            icon: BarChart3,
            description: 'Performance overview and quick stats',
            roles: ['creator'],
            isActive: pathname === '/dashboard'
          },
          {
            id: 'creator-analytics',
            label: 'Analytics Deep Dive',
            href: '/dashboard/analytics',
            icon: Activity,
            description: 'Comprehensive performance insights',
            roles: ['creator'],
            isNew: true, // Phase 2 feature
            isActive: pathname.startsWith('/dashboard/analytics')
          },
          {
            id: 'content-management',
            label: 'Content Management',
            href: '/dashboard/content',
            icon: Target,
            description: 'Upload and manage your content',
            roles: ['creator'],
            isActive: pathname.startsWith('/dashboard/content')
          },
          {
            id: 'creator-earnings',
            label: 'Earnings & Payouts',
            href: '/dashboard/earnings',
            icon: PieChart,
            description: 'Revenue tracking and withdrawal management',
            roles: ['creator'],
            isActive: pathname.startsWith('/dashboard/earnings')
          },
          {
            id: 'subscriber-management',
            label: 'Subscriber Management',
            href: '/dashboard/subscribers',
            icon: Users,
            description: 'View and analyze your subscriber base',
            roles: ['creator'],
            isNew: true, // Phase 3 feature - creator side of subscription management
            isActive: pathname.startsWith('/dashboard/subscribers')
          },
          {
            id: 'auto-renewal-analytics',
            label: 'Auto-Renewal Analytics',
            href: '/dashboard/renewals',
            icon: RefreshCw,
            description: 'Monitor subscription retention and auto-renewal performance',
            roles: ['creator'],
            isNew: true, // Phase 3 feature
            isActive: pathname.startsWith('/dashboard/renewals')
          },
          {
            id: 'collections',
            label: 'NFT Collections',
            href: '/collections',
            icon: Sparkles,
            description: 'Create and manage your NFT collections on Zora',
            roles: ['creator'],
            isNew: true, // New NFT feature
            isActive: pathname.startsWith('/collections')
          }
        ],
        roles: ['creator'],
        isCollapsible: true,
        defaultExpanded: true
      })
    }

    // ===== ADMIN SECTION =====
    // Administrative features including platform analytics
    if (userRole === 'admin') {
      sections.push({
        id: 'admin-tools',
        label: 'Administration',
        description: 'Platform management and insights',
        items: [
          {
            id: 'admin-dashboard',
            label: 'Admin Dashboard',
            href: '/admin',
            icon: Shield,
            description: 'Platform health and moderation',
            roles: ['admin'],
            isActive: pathname === '/admin'
          },
          {
            id: 'platform-insights',
            label: 'Platform Insights',
            href: '/admin/insights',
            icon: Zap,
            description: 'Comprehensive platform analytics and KPIs',
            roles: ['admin'],
            isNew: true, // Phase 2 feature
            isActive: pathname.startsWith('/admin/insights')
          },
          {
            id: 'creator-management',
            label: 'Creator Management',
            href: '/admin/creators',
            icon: Users,
            description: 'Creator verification and oversight',
            roles: ['admin'],
            isActive: pathname.startsWith('/admin/creators')
          },
          {
            id: 'subscription-oversight',
            label: 'Subscription Oversight',
            href: '/admin/subscriptions',
            icon: CreditCard,
            description: 'Platform-wide subscription analytics and management',
            roles: ['admin'],
            isNew: true, // Phase 3 feature
            isActive: pathname.startsWith('/admin/subscriptions')
          },
          {
            id: 'platform-settings',
            label: 'Platform Settings',
            href: '/admin/settings',
            icon: Settings,
            description: 'Configuration and system management',
            roles: ['admin'],
            isActive: pathname.startsWith('/admin/settings')
          }
        ],
        roles: ['admin'],
        isCollapsible: true,
        defaultExpanded: true
      })
    }

    // Filter sections by user role and return only relevant sections
    return sections.filter(section => 
      section.roles.includes(userRole) && 
      section.items.some(item => item.roles.includes(userRole))
    )
  }, [userRole, pathname])
}

// ===== NAVIGATION COMPONENT =====

interface NavigationProps {
  userRole: UserRole
  className?: string
  onNavigate?: () => void
}

export function AppNavigation({ 
  userRole, 
  className = '', 
  onNavigate 
}: NavigationProps) {
  const router = useRouter()
  const sections = useAppNavigation(userRole)

  const handleNavigation = (href: string, onClick?: () => void) => {
    if (onClick) {
      onClick()
    } else {
      router.push(href)
    }
    onNavigate?.()
  }

  return (
    <nav className={`space-y-4 sm:space-y-6 ${className}`}>
      {sections.map((section) => (
        <NavigationSection
          key={section.id}
          section={section}
          onNavigate={handleNavigation}
        />
      ))}
    </nav>
  )
}

// ===== NAVIGATION SECTION COMPONENT =====

interface NavigationSectionProps {
  section: NavigationSection
  onNavigate: (href: string, onClick?: () => void) => void
}

function NavigationSection({ section, onNavigate }: NavigationSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(section.defaultExpanded ?? true)

  const toggleExpanded = () => {
    if (section.isCollapsible) {
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <div className="space-y-1.5 sm:space-y-2">
      {/* Section Header */}
      <button
        onClick={toggleExpanded}
        className={`w-full text-left p-2 rounded-lg transition-colors ${
          section.isCollapsible 
            ? 'hover:bg-muted/50 cursor-pointer' 
            : 'cursor-default'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-xs sm:text-sm text-foreground/90">
              {section.label}
            </h3>
            {section.description && (
              <p className="hidden sm:block text-xs text-muted-foreground">
                {section.description}
              </p>
            )}
          </div>
          {section.isCollapsible && (
            <div className={`transform transition-transform ${
              isExpanded ? 'rotate-90' : 'rotate-0'
            }`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </button>

      {/* Section Items */}
      {isExpanded && (
        <div className="ml-1.5 sm:ml-2 space-y-0.5 sm:space-y-1 border-l border-border/30 pl-3 sm:pl-4">
          {section.items.map((item) => (
            <NavigationItemComponent
              key={item.id}
              item={item}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ===== NAVIGATION ITEM COMPONENT =====

interface NavigationItemComponentProps {
  item: NavigationItem
  onNavigate: (href: string, onClick?: () => void) => void
}

function NavigationItemComponent({ item, onNavigate }: NavigationItemComponentProps) {
  const handleClick = () => {
    if (!item.disabled) {
      onNavigate(item.href, item.onClick)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={item.disabled}
      className={`w-full flex items-center justify-between p-2 rounded-md text-xs sm:text-sm transition-colors ${
        item.isActive
          ? 'bg-primary text-primary-foreground'
          : item.disabled
          ? 'text-muted-foreground cursor-not-allowed opacity-50'
          : 'text-foreground hover:bg-muted/50'
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <item.icon className="h-4 w-4 flex-shrink-0" />
        <div className="flex flex-col items-start">
          <span className="font-medium leading-none">
            {item.label}
          </span>
          {item.description && (
            <span className="hidden sm:inline text-xs text-muted-foreground mt-1 line-clamp-2">
              {item.description}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        {item.badge && (
          <span className="px-1.5 py-0.5 text-xs bg-muted rounded-md">
            {item.badge}
          </span>
        )}
        {item.isNew && (
          <span className="hidden sm:inline px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-md font-medium">
            New
          </span>
        )}
      </div>
    </button>
  )
}

// ===== EXPORT COMPONENTS =====

export default AppNavigation

// Export all components and types for use throughout the application
export {
  AppNavigation as Navigation,
  NavigationSection,
  NavigationItemComponent
}

// Export types for external usage
export type {
  NavigationSection as NavigationSectionType
}