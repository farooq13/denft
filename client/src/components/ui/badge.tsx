// src/components/ui/badge.tsx
// Denft Design System — Badge component

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full font-medium select-none whitespace-nowrap',
  {
    variants: {
      variant: {
        primary:   'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
        secondary: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300',
        success:   'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300',
        error:     'bg-error-100   text-error-700   dark:bg-error-900/30   dark:text-error-300',
        warning:   'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300',
        outline:   'border border-neutral-300 text-neutral-600 dark:border-neutral-600 dark:text-neutral-400',
        accent:    'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1   text-sm',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'sm',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Badge — inline status indicator pill.
 *
 * @example
 * <Badge variant="success">✓ Verified</Badge>
 * <Badge variant="warning">⚠ Unverified</Badge>
 * <Badge variant="secondary">Private</Badge>
 */
export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  )
}
