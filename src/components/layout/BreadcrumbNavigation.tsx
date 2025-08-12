"use client"

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export function BreadcrumbNavigation() {
  const pathname = usePathname()

  const breadcrumbItems = React.useMemo(() => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const items = [{ label: 'Home', href: '/' }]
    let currentPath = ''
    for (const segment of pathSegments) {
      currentPath += `/${segment}`
      const label = getBreadcrumbLabel(segment)
      if (label) {
        items.push({ label, href: currentPath })
      }
    }
    return items
  }, [pathname])

  if (breadcrumbItems.length <= 1) return null

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={item.href}>
          {index > 0 && <ChevronRight className="w-4 h-4" />}
          {index === breadcrumbItems.length - 1 ? (
            <span className="font-medium text-foreground">{item.label}</span>
          ) : (
            <Link href={item.href} className="hover:text-foreground transition-colors">
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

function getBreadcrumbLabel(segment: string): string | null {
  const labelMap: Record<string, string> = {
    dashboard: 'Creator Dashboard',
    analytics: 'Analytics',
    content: 'Content Management',
    discovery: 'Discovery',
    categories: 'Categories',
    trending: 'Trending',
    admin: 'Administration',
    insights: 'Platform Insights',
    creators: 'Creator Management',
    settings: 'Settings'
  }
  return labelMap[segment] || null
}


