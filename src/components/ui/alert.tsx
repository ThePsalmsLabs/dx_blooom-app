import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info'
}

const variantClasses: Record<NonNullable<AlertProps['variant']>, string> = {
  default: 'bg-muted text-muted-foreground border',
  destructive: 'bg-red-50 text-red-900 border border-red-500',
  success: 'bg-green-50 text-green-900 border border-green-500',
  warning: 'bg-yellow-50 text-yellow-900 border border-yellow-500',
  info: 'bg-blue-50 text-blue-900 border border-blue-500',
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'w-full rounded-lg p-4 text-sm shadow-sm',
          variantClasses[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Alert.displayName = 'Alert'

export interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const AlertDescription = React.forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('mt-1 text-sm leading-relaxed', className)}
      {...props}
    />
  )
)
AlertDescription.displayName = 'AlertDescription'
