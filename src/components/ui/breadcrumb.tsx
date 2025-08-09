// components/ui/breadcrumb.tsx
'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export type BreadcrumbProps = React.HTMLAttributes<HTMLElement>
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

export type BreadcrumbListProps = React.HTMLAttributes<HTMLOListElement>
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

export type BreadcrumbItemProps = React.HTMLAttributes<HTMLLIElement>
export const BreadcrumbItem = React.forwardRef<HTMLLIElement, BreadcrumbItemProps>(
  ({ className, children, ...props }, ref) => (
    <li ref={ref} className={cn('flex items-center', className)} {...props}>
      {children}
    </li>
  )
)
BreadcrumbItem.displayName = 'BreadcrumbItem'

export type BreadcrumbLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement>
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

export type BreadcrumbSeparatorProps = React.HTMLAttributes<HTMLSpanElement>
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

export type BreadcrumbPageProps = React.HTMLAttributes<HTMLSpanElement>
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
