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
  return <>{children}</>
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
}: {
  children: React.ReactNode
  className?: string
}) => {
  const ctx = React.useContext(TooltipContext)
  if (!ctx) throw new Error('TooltipContent must be used within a TooltipProvider')

  return ctx.open ? (
    <div
      role="tooltip"
      className={`absolute z-50 mt-2 rounded bg-black px-2 py-1 text-xs text-white shadow-md ${className}`}
    >
      {children}
    </div>
  ) : null
}
