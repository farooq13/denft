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

/** Pre-composed full Dashboard skeleton */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="h-32 w-full rounded-2xl bg-neutral-900 border border-neutral-800 animate-pulse flex justify-between items-center p-8">
        <div className="flex gap-5 items-center">
          <Skeleton variant="circle" className="h-16 w-16" />
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Skeleton className="h-[300px] w-full rounded-2xl" />
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
        <div className="space-y-8">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

/** Pre-composed full Vault skeleton */
export function VaultSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-16 rounded-md" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <SkeletonFileCard />
        <SkeletonFileCard />
        <SkeletonFileCard />
        <SkeletonFileCard />
        <SkeletonFileCard />
        <SkeletonFileCard />
        <SkeletonFileCard />
        <SkeletonFileCard />
      </div>
    </div>
  )
}
