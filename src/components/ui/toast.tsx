'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  onClose?: () => void
  variant?: 'default' | 'destructive'
}

export const Toast = ({
  title,
  description,
  onClose,
  className,
  variant = 'default',
  ...props
}: ToastProps) => {
  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-4 rounded-lg border bg-background p-4 shadow-lg transition-all',
        variant === 'destructive' && 'border-red-500 bg-red-50 text-red-900',
        className
      )}
      {...props}
    >
      <div className="flex-1">
        {title && <p className="text-sm font-semibold">{title}</p>}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <button
        onClick={onClose}
        className="ml-auto rounded-md p-1 hover:bg-muted"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
Toast.displayName = 'Toast'

interface ToastProviderProps {
  children: React.ReactNode
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  return <div className="relative z-[100]"><>{children}</></div>
}
ToastProvider.displayName = 'ToastProvider'

export const ToastViewport = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'fixed top-4 right-4 z-[100] flex flex-col space-y-2',
      className
    )}
    {...props}
  />
)
ToastViewport.displayName = 'ToastViewport'
