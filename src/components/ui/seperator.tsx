import * as React from 'react'

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className = '', orientation = 'horizontal', decorative = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role={decorative ? 'presentation' : 'separator'}
        aria-orientation={orientation}
        className={`bg-border ${orientation === 'vertical' ? 'w-px h-full' : 'h-px w-full'} ${className}`}
        {...props}
      />
    )
  }
)

Separator.displayName = 'Separator'
