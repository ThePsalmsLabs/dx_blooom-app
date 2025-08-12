/**
 * Enhanced Navigation Component - Phase 2 Integration
 * File: src/components/layout/NavigationEnhancement.tsx
 * 
 * This enhancement integrates all Phase 2 components into your existing navigation
 * architecture while maintaining backward compatibility and user experience flow.
 * The navigation now exposes content discovery and analytics features through
 * intuitive menu organization that matches user mental models.
 * 
 * Integration Strategy:
 * - Preserves existing navigation patterns and user flows
 * - Adds Phase 2 features through logical menu groupings
 * - Provides role-based access to analytics features
 * - Maintains responsive design across all device sizes
 * - Integrates breadcrumb navigation for complex feature discovery
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
  Zap
} from 'lucide-react'

// ===== ENHANCED NAVIGATION TYPES =====

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
  readonly icon: React.ComponentType<any>
  readonly description?: string
  readonly roles: readonly UserRole[]
  readonly badge?: string
  readonly isNew?: boolean
  readonly isActive?: boolean
  readonly disabled?: boolean
  readonly onClick?: () => void
}

export type UserRole = 'disconnected' | 'consumer' | 'creator' | 'admin'

// ===== PHASE 2 NAVIGATION CONFIGURATION =====

/**
 * Enhanced Navigation Configuration
 * 
 * This configuration integrates Phase 2 features into logical navigation
 * sections that guide users through discovery → analytics → management flows.
 * Each section is carefully designed to support user journey progression.
 */
export function useEnhancedNavigation(userRole: UserRole): readonly NavigationSection[] {
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
        }
      ],
      roles: ['disconnected', 'consumer', 'creator', 'admin'],
      defaultExpanded: true
    })

    // ===== PHASE 2: CONTENT DISCOVERY SECTION =====
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

    // ===== CREATOR SECTION =====
    // Creator-specific features including Phase 2 analytics integration
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
          }
        ],
        roles: ['creator'],
        isCollapsible: true,
        defaultExpanded: true
      })
    }

    // ===== ADMIN SECTION =====
    // Administrative features including Phase 2 platform analytics
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

// ===== ENHANCED NAVIGATION COMPONENT =====

interface EnhancedNavigationProps {
  userRole: UserRole
  className?: string
  onNavigate?: () => void
}

export function EnhancedNavigation({ 
  userRole, 
  className = '', 
  onNavigate 
}: EnhancedNavigationProps) {
  const router = useRouter()
  const sections = useEnhancedNavigation(userRole)

  const handleNavigation = (href: string, onClick?: () => void) => {
    if (onClick) {
      onClick()
    } else {
      router.push(href)
    }
    onNavigate?.()
  }

  return (
    <nav className={`space-y-6 ${className}`}>
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
    <div className="space-y-2">
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
            <h3 className="font-semibold text-sm text-foreground/90">
              {section.label}
            </h3>
            {section.description && (
              <p className="text-xs text-muted-foreground">
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
        <div className="ml-2 space-y-1 border-l border-border/30 pl-4">
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
      className={`w-full flex items-center justify-between p-2 rounded-md text-sm transition-colors ${
        item.isActive
          ? 'bg-primary text-primary-foreground'
          : item.disabled
          ? 'text-muted-foreground/50 cursor-not-allowed'
          : 'text-foreground/80 hover:bg-muted/50 hover:text-foreground'
      }`}
    >
      <div className="flex items-center gap-3">
        <item.icon className="w-4 h-4" />
        <span className="font-medium">{item.label}</span>
        {item.isNew && (
          <span className="px-1.5 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded">
            New
          </span>
        )}
      </div>
      
      {item.badge && (
        <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
          {item.badge}
        </span>
      )}
    </button>
  )
}

export default EnhancedNavigation