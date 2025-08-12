"use client"

import React from 'react'
import { BreadcrumbNavigation } from './BreadcrumbNavigation'
import { AppLayout } from './AppLayout'

interface PageLayoutProps {
  children: React.ReactNode
  showBreadcrumbs?: boolean
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  className?: string
}

export function PageLayout({
  children,
  showBreadcrumbs = true,
  maxWidth = '2xl',
  className = ''
}: PageLayoutProps) {
  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  }[maxWidth]

  return (
    <AppLayout>
      <div className={`container mx-auto px-4 py-8 ${maxWidthClass} ${className}`}>
        {showBreadcrumbs && <BreadcrumbNavigation />}
        {children}
      </div>
    </AppLayout>
  )
}

export default PageLayout


