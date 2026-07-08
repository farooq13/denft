// src/components/ui/card.tsx
// Denft Design System — Card component

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const cardVariants = cva(
  'rounded-lg transition-all duration-sm',
  {
    variants: {
      variant: {
        default: [
          'bg-white border border-neutral-200',
          'dark:bg-neutral-800 dark:border-neutral-700',
        ],
        elevated: [
          'bg-white shadow-elevated border-0',
          'dark:bg-neutral-800',
          'hover:shadow-lg',
        ],
        outlined: [
          'bg-transparent border-2 border-neutral-300',
          'dark:border-neutral-600',
        ],
        ghost: [
          'bg-transparent border-0',
        ],
        glass: [
          'glass border-0',
          'dark:glass-dark',
        ],
      },
      padding: {
        none: '',
        sm:   'p-3',
        md:   'p-4',
        lg:   'p-6',
        xl:   'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'lg',
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

/**
 * Card — content container with multiple style variants.
 *
 * @example
 * <Card variant="elevated">
 *   <CardHeader>Title</CardHeader>
 *   <CardBody>Content</CardBody>
 * </Card>
 */
export function Card({ className, variant, padding, ...props }: CardProps) {
  return (
    <div
      className={cn(cardVariants({ variant, padding, className }))}
      {...props}
    />
  )
}

// ── Sub-components ────────────────────────────────────────────

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn('flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-700', className)}
      {...props}
    />
  )
}

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardBody({ className, ...props }: CardBodyProps) {
  return (
    <div className={cn('pt-4', className)} {...props} />
  )
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ className, ...props }: CardFooterProps) {
  return (
    <div
      className={cn('flex items-center gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700 mt-4', className)}
      {...props}
    />
  )
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn('text-base font-semibold text-neutral-900 dark:text-neutral-50', className)}
      {...props}
    />
  )
}

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <p
      className={cn('text-sm text-neutral-500 dark:text-neutral-400 mt-1', className)}
      {...props}
    />
  )
}
