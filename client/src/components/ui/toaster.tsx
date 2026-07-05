// src/components/ui/toaster.tsx
// Denft Design System — Sonner Toaster wrapper
// Replaces the custom framer-motion toast system with production-ready Sonner.

import { Toaster as Sonner } from 'sonner'
import { useTheme } from '@/contexts/ThemeContext'

/**
 * Toaster — renders the Sonner toast container.
 * Place once in App.tsx, outside of the Router but inside ThemeProvider.
 *
 * Usage (in components):
 *   import { toast } from 'sonner'
 *   toast.success('File uploaded!')
 *   toast.error('Upload failed.')
 *   toast.loading('Uploading…')
 */
export function Toaster() {
  const { resolvedTheme } = useTheme()

  return (
    <Sonner
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      position="bottom-right"
      richColors
      closeButton
      expand={false}
      visibleToasts={3}
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: [
            'font-sans text-sm rounded-lg shadow-xl',
            'border border-neutral-200 dark:border-neutral-700',
          ].join(' '),
          title:       'font-semibold',
          description: 'text-neutral-500 dark:text-neutral-400 text-xs',
          actionButton:'bg-primary-500 text-white hover:bg-primary-600 rounded-md px-3 py-1 text-xs font-medium',
          cancelButton:'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-md px-3 py-1 text-xs font-medium',
          closeButton: 'rounded-full',
        },
      }}
    />
  )
}

// Re-export toast helper so components only need to import from one place
export { toast } from 'sonner'
