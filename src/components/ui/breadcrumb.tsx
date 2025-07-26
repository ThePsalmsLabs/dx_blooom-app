// components/ui/breadcrumb.tsx
'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {}
export const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, children, ...props }, ref) => (
    <nav
      ref={ref}
      aria-label="Breadcrumb"
      className={cn('w-full', className)}
      {...props}
    >
      {children}
    </nav>
  )
)
Breadcrumb.displayName = 'Breadcrumb'

export interface BreadcrumbListProps extends React.HTMLAttributes<HTMLOListElement> {}
export const BreadcrumbList = React.forwardRef<HTMLOListElement, BreadcrumbListProps>(
  ({ className, children, ...props }, ref) => (
    <ol
      ref={ref}
      className={cn('flex items-center space-x-2', className)}
      {...props}
    >
      {children}
    </ol>
  )
)
BreadcrumbList.displayName = 'BreadcrumbList'

export interface BreadcrumbItemProps extends React.HTMLAttributes<HTMLLIElement> {}
export const BreadcrumbItem = React.forwardRef<HTMLLIElement, BreadcrumbItemProps>(
  ({ className, children, ...props }, ref) => (
    <li ref={ref} className={cn('flex items-center', className)} {...props}>
      {children}
    </li>
  )
)
BreadcrumbItem.displayName = 'BreadcrumbItem'

export interface BreadcrumbLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {}
export const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  BreadcrumbLinkProps
>(
  ({ className, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(
        'text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50',
        className
      )}
      {...props}
    />
  )
)
BreadcrumbLink.displayName = 'BreadcrumbLink'

export interface BreadcrumbSeparatorProps extends React.HTMLAttributes<HTMLSpanElement> {}
export const BreadcrumbSeparator = React.forwardRef<
  HTMLSpanElement,
  BreadcrumbSeparatorProps
>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      aria-hidden="true"
      {...props}
    >
      /
    </span>
  )
)
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator'

export interface BreadcrumbPageProps extends React.HTMLAttributes<HTMLSpanElement> {}
export const BreadcrumbPage = React.forwardRef<HTMLSpanElement, BreadcrumbPageProps>(
  ({ className, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn('text-sm font-semibold text-foreground', className)}
      aria-current="page"
      {...props}
    >
      {children}
    </span>
  )
)
BreadcrumbPage.displayName = 'BreadcrumbPage'
