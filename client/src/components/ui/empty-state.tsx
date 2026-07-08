// src/components/ui/empty-state.tsx
// Denft Design System — Empty state component

import * as React from 'react'
import { cn } from '@/lib/cn'
import { Button } from './button'

export interface EmptyStateProps {
  /** Large icon displayed at top */
  icon: React.ReactNode
  /** Main heading */
  title: string
  /** Supporting description (max 2 lines) */
  description: string
  /** Primary call-to-action */
  action?: {
    label: string
    onClick: () => void
    isLoading?: boolean
  }
  /** Secondary call-to-action */
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

/**
 * EmptyState — shown when a list/page has no content.
 *
 * @example
 * <EmptyState
 *   icon={<FolderOpen className="h-16 w-16" />}
 *   title="Your vault is empty"
 *   description="Upload your first file to get started."
 *   action={{ label: 'Upload File', onClick: () => navigate('/upload') }}
 * />
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-8',
        className
      )}
      role="status"
      aria-label={title}
    >
      {/* Icon */}
      <div className="mb-6 text-primary-500/60 dark:text-primary-400/50">
        {icon}
      </div>

      {/* Heading */}
      <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed mb-8">
        {description}
      </p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button
              size="lg"
              variant="primary"
              isLoading={action.isLoading}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              size="lg"
              variant="ghost"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
