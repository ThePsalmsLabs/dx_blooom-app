import React from 'react'

interface FeatureBadgeProps {
  variant?: 'new' | 'enhanced' | 'beta'
  size?: 'sm' | 'md'
  className?: string
}

export function FeatureBadge({
  variant = 'new',
  size = 'sm',
  className = ''
}: FeatureBadgeProps) {
  const baseClasses = 'inline-flex items-center rounded font-medium'

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm'
  } as const

  const variantClasses = {
    new: 'bg-emerald-100 text-emerald-700',
    enhanced: 'bg-blue-100 text-blue-700',
    beta: 'bg-amber-100 text-amber-700'
  } as const

  const labels = {
    new: 'New',
    enhanced: 'Enhanced',
    beta: 'Beta'
  } as const

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {labels[variant]}
    </span>
  )
}

export default FeatureBadge


