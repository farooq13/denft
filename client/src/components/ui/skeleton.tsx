// src/components/ui/skeleton.tsx
// Denft Design System — Loading skeleton component

import * as React from 'react'
import { cn } from '@/lib/cn'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Extra visual variants */
  variant?: 'default' | 'circle' | 'text'
}

/**
 * Skeleton — animated loading placeholder.
 * Dimensions controlled via className (e.g. `h-4 w-32`).
 *
 * @example
 * <Skeleton className="h-4 w-full" />            // text line
 * <Skeleton variant="circle" className="h-10 w-10" />  // avatar
 * <Skeleton className="h-48 w-full rounded-lg" />  // card image
 */
export function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading…"
      className={cn(
        'skeleton animate-pulse-sm',
        variant === 'circle' && 'rounded-full',
        variant === 'text'   && 'rounded h-4',
        variant === 'default'&& 'rounded-md',
        className
      )}
      {...props}
    />
  )
}

/** Pre-composed card skeleton */
export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
  )
}

/** Pre-composed file card skeleton */
export function SkeletonFileCard() {
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 space-y-3">
      <Skeleton className="h-12 w-12 mx-auto rounded-lg" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-3 w-3/4 mx-auto" />
      <div className="flex gap-2 justify-center">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  )
}

/** Pre-composed stat card skeleton (for Dashboard) */
export function SkeletonStatCard() {
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton variant="circle" className="h-8 w-8" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}
