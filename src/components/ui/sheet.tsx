'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Root as VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

const Sheet = DialogPrimitive.Root

const SheetTrigger = DialogPrimitive.Trigger

const SheetClose = DialogPrimitive.Close

const SheetPortal = DialogPrimitive.Portal

SheetPortal.displayName = DialogPrimitive.Portal.displayName

// Enhanced SheetOverlay with better z-index management
const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & {
    isNavigation?: boolean
  }
>(({ className, isNavigation = false, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 bg-black/40 backdrop-blur-sm',
      // Navigation sheets get higher z-index priority
      isNavigation ? 'z-[9998]' : 'z-[1040]',
      // Smooth fade animations tied to Radix state
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      // Add class for CSS targeting
      isNavigation && 'navigation-sheet-overlay',
      className
    )}
    data-radix-dialog-overlay
    {...props}
  />
))
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    side?: 'top' | 'bottom' | 'left' | 'right'
    title?: React.ReactNode
    description?: React.ReactNode
    isNavigation?: boolean
  }
>(({ 
  side = 'right',
  title = 'Navigation Drawer',
  description = 'Application navigation panel',
  className,
  children,
  isNavigation = false,
  ...props
}, ref) => (
  <SheetPortal>
    {/* Force mount into body with a hard class for CSS targeting */}
    <SheetOverlay isNavigation={isNavigation} className="navigation-sheet-overlay" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Base styles for all sheet content
        'fixed flex flex-col bg-background p-6 shadow-lg transition ease-in-out navigation-sheet-content',
        // Enhanced animation for better UX
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=open]:duration-300 data-[state=closed]:duration-200',
        // Navigation sheets get highest z-index for proper stacking
        isNavigation ? 'z-[9999]' : 'z-[1050]',
        // Position-specific styles with improved responsive handling
        side === 'top' && [
          'inset-x-0 top-0 w-full max-h-[90vh] overflow-y-auto border-b',
          'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        ],
        side === 'bottom' && [
          'inset-x-0 bottom-0 w-full max-h-[90vh] overflow-y-auto border-t',
          'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        ],
        side === 'left' && [
          'inset-y-0 left-0 h-full overflow-y-auto border-r',
          // Improved responsive width handling
          'w-[85vw] sm:w-[75vw] md:w-[420px] max-w-[420px]',
          'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
        ],
        side === 'right' && [
          'inset-y-0 right-0 h-full overflow-y-auto border-l',
          // Improved responsive width handling
          'w-[85vw] sm:w-[75vw] md:w-[420px] max-w-[420px]',
          'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
        ],
        // Add navigation-specific class for CSS targeting
        isNavigation && 'navigation-sidebar',
        className
      )}
      data-radix-dialog-content
      {...props}
    >
      {/* Accessibility: ensure a Title is always present for screen readers */}
      <VisuallyHidden>
        <SheetTitle>{title}</SheetTitle>
        <SheetDescription>{description}</SheetDescription>
      </VisuallyHidden>
      {children}
      <SheetClose className={cn(
        'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity cursor-pointer',
        'hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:pointer-events-none disabled:cursor-not-allowed z-10'
      )}>
        <X className="h-4 w-4" />
        <span className="sr-only">Close navigation</span>
      </SheetClose>
    </DialogPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = DialogPrimitive.Content.displayName

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mb-4 flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
)
SheetHeader.displayName = 'SheetHeader'

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('mt-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
)
SheetFooter.displayName = 'SheetFooter'

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold text-foreground', className)}
    {...props}
  />
))
SheetTitle.displayName = DialogPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
SheetDescription.displayName = DialogPrimitive.Description.displayName

export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
}
