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

type ToastItem = {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

type ToastContextType = {
  toast: (t: Omit<ToastItem, 'id'>) => void
  dismiss: (id: string) => void
  toasts: ToastItem[]
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: React.ReactNode
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const toast = React.useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = crypto.randomUUID()
    const newToast = { id, ...t }
    setToasts((prev) => [...prev, newToast])

    if (t.duration !== 0) {
      setTimeout(() => dismiss(id), t.duration ?? 3000)
    }
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismiss, toasts }}>
      <div className="relative z-[9990]">
        {children}
        <ToastViewport>
          {toasts.map((t) => (
            <Toast
              key={t.id}
              title={t.title}
              description={t.description}
              variant={t.variant}
              onClose={() => dismiss(t.id)}
            />
          ))}
        </ToastViewport>
      </div>
    </ToastContext.Provider>
  )
}
ToastProvider.displayName = 'ToastProvider'

export const ToastViewport = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'fixed top-4 right-4 z-[9990] flex flex-col space-y-2',
      className
    )}
    {...props}
  >
    {children}
  </div>
)
ToastViewport.displayName = 'ToastViewport'
