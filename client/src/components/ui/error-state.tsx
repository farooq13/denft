// src/components/ui/error-state.tsx
// Denft Design System — Error state component

import * as React from 'react'
import { useState } from 'react'
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from './button'

export interface ErrorStateProps {
  /** Custom icon (defaults to AlertCircle) */
  icon?: React.ReactNode
  /** Error heading — user-friendly */
  title: string
  /** User-friendly explanation (no technical jargon) */
  message: string
  /** Technical error details (hidden behind expandable section) */
  details?: string
  /** Primary recovery action */
  action?: {
    label: string
    onClick: () => void
    isLoading?: boolean
  }
  /** Secondary action (e.g. go back, contact support) */
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

/**
 * ErrorState — shown when an API call fails or an error occurs.
 *
 * @example
 * <ErrorState
 *   title="Could not load your files"
 *   message="We had trouble connecting to the server. Please check your internet connection and try again."
 *   details={error.message}
 *   action={{ label: 'Try Again', onClick: fetchFiles }}
 * />
 */
export function ErrorState({
  icon,
  title,
  message,
  details,
  action,
  secondaryAction,
  className,
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-8',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      {/* Icon */}
      <div className="mb-6 text-error-500">
        {icon ?? <AlertCircle className="h-16 w-16" aria-hidden="true" />}
      </div>

      {/* Heading */}
      <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
        {title}
      </h3>

      {/* User-friendly message */}
      <p className="text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed mb-6">
        {message}
      </p>

      {/* Expandable technical details */}
      {details && (
        <div className="w-full max-w-sm mb-6">
          <button
            type="button"
            className="flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors mx-auto mb-2"
            onClick={() => setShowDetails(v => !v)}
            aria-expanded={showDetails}
          >
            {showDetails
              ? <ChevronUp className="h-4 w-4" aria-hidden="true" />
              : <ChevronDown className="h-4 w-4" aria-hidden="true" />
            }
            {showDetails ? 'Hide details' : 'Show details'}
          </button>
          {showDetails && (
            <pre className="text-left text-xs font-mono bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 overflow-auto max-h-32 text-neutral-600 dark:text-neutral-400">
              {details}
            </pre>
          )}
        </div>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button
              size="md"
              variant="primary"
              isLoading={action.isLoading}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              size="md"
              variant="ghost-neutral"
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
