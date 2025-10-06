/**
 * Checkbox Component
 * 
 * A modern, accessible checkbox component with proper styling
 */

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  id?: string
  className?: string
  children?: React.ReactNode
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ checked = false, onCheckedChange, disabled, id, className, ...props }, ref) => {
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        data-state={checked ? "checked" : "unchecked"}
        disabled={disabled}
        id={id}
        ref={ref}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          checked 
            ? "bg-primary text-primary-foreground" 
            : "bg-background",
          className
        )}
        onClick={() => onCheckedChange?.(!checked)}
        {...props}
      >
        {checked && (
          <Check className="h-3 w-3 text-current" />
        )}
      </button>
    )
  }
)

Checkbox.displayName = "Checkbox"

export { Checkbox }