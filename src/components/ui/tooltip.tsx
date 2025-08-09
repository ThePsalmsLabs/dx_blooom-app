'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'


interface TooltipContextProps {
  open: boolean
  setOpen: (open: boolean) => void
}

interface TooltipTriggerProps {
    children: React.ReactNode
    asChild?: boolean
  }

const TooltipContext = React.createContext<TooltipContextProps | null>(null)

export const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false)
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      {children}
    </TooltipContext.Provider>
  )
}

export const Tooltip = ({ children }: { children: React.ReactNode }) => {
  return <div className="relative inline-block">{children}</div>
}

export const TooltipTrigger = ({ children, asChild }: TooltipTriggerProps) => {
    const ctx = React.useContext(TooltipContext)
    if (!ctx) throw new Error('TooltipTrigger must be used within a TooltipProvider')
  
    const Comp = asChild ? Slot : 'div'
  
    return (
      <Comp
        onMouseEnter={() => ctx.setOpen(true)}
        onMouseLeave={() => ctx.setOpen(false)}
        className="inline-block"
      >
        {children}
      </Comp>
    )
  }

export const TooltipContent = ({
  children,
  className = '',
  align = 'center',
}: {
  children: React.ReactNode
  className?: string
  align?: 'start' | 'center' | 'end'
}) => {
  const ctx = React.useContext(TooltipContext)
  if (!ctx) throw new Error('TooltipContent must be used within a TooltipProvider')

  if (!ctx.open) return null

  const alignment = align === 'start' ? 'left-0' : align === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2'

  return (
    <div
      role="tooltip"
      className={`absolute top-full ${alignment} z-50 mt-2 rounded bg-black px-2 py-1 text-xs text-white shadow-md max-w-xs break-words ${className}`}
    >
      {children}
    </div>
  )
}
