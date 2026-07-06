// src/components/ui/progress.tsx
// Sprint 3 — Simple, accessible progress bar component

import React from 'react'
import { cn } from '@/lib/cn'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number // 0 to 100
  colorVariant?: 'primary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
}

export function Progress({
  value,
  colorVariant = 'primary',
  size = 'md',
  className,
  ...props
}: ProgressProps) {
  // Clamp value between 0 and 100
  const safeValue = Math.min(100, Math.max(0, value))

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }

  const colorClasses = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
  }

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
      className={cn(
        'w-full overflow-hidden rounded-full bg-neutral-800',
        heightClasses[size],
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'h-full transition-all duration-500 ease-out',
          colorClasses[colorVariant]
        )}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  )
}
