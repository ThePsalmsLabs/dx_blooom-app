"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Enhanced Dialog Root with better default props
function Dialog({
  modal = true, // Ensure modal behavior
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root> & {
  modal?: boolean
}) {
  return (
    <DialogPrimitive.Root 
      data-slot="dialog" 
      modal={modal}
      {...props} 
    />
  )
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

// Enhanced Portal with container targeting for better z-index control
function DialogPortal({
  container,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal> & {
  container?: HTMLElement | null
}) {
  // Always use document body for modals to ensure they're above everything
  // This prevents container-related z-index stacking issues
  const portalContainer = typeof document !== 'undefined' ? document.body : undefined
  
  return (
    <DialogPrimitive.Portal 
      data-slot="dialog-portal" 
      container={portalContainer}
      {...props} 
    />
  )
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

// Enhanced Overlay with higher z-index and better animation
function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        // CRITICAL: Maximum z-index to ensure it's above everything including other modals
        "fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm",
        // Enhanced animations for better UX
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=open]:duration-300 data-[state=closed]:duration-200",
        // Ensure overlay is always visible and captures all interactions
        "pointer-events-auto cursor-pointer",
        className
      )}
      style={{
        // Force overlay positioning and visibility
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        ...props.style
      }}
      {...props}
    />
  )
}

// Enhanced Dialog Content with maximum z-index and robust positioning
function DialogContent({
  className,
  children,
  showCloseButton = true,
  forceRender = false, // Emergency prop to force visibility
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  forceRender?: boolean // Debug prop - forces visibility regardless of other issues
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        aria-describedby={undefined}
        className={cn(
          // CRITICAL: Maximum z-index to ensure visibility above everything
          "fixed top-[50%] left-[50%] z-[10000]",
          // CRITICAL: Robust positioning and centering
          "translate-x-[-50%] translate-y-[-50%]",
          // CRITICAL: Explicit dimensions and constraints
          "w-full max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]",
          "sm:max-w-lg",
          // Styling and animations
          "grid gap-4 rounded-lg border bg-background p-6 shadow-2xl",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
          "duration-200",
          // Ensure proper pointer events and visibility
          "pointer-events-auto visible opacity-100",
          // Emergency force render styles
          forceRender && "!opacity-100 !visible !pointer-events-auto",
          className
        )}
        style={{
          // Always ensure proper positioning
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10000,
          // Emergency inline styles to force visibility if needed
          ...(forceRender && {
            opacity: 1,
            visibility: 'visible',
            pointerEvents: 'auto',
          }),
        }}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className={cn(
              "absolute top-4 right-4 z-10",
              "rounded-sm opacity-70 ring-offset-background transition-opacity cursor-pointer",
              "hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "disabled:pointer-events-none disabled:cursor-not-allowed",
              "[&_svg]:pointer-events-none [&_svg]:size-4"
            )}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}