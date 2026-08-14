// src/components/ui/button.tsx
// Denft Design System — Button component
// Built with class-variance-authority for type-safe variant handling.

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

const buttonVariants = cva(
  // Base styles — applied to all variants
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium rounded-md',
    'transition-all duration-sm',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'active:scale-95',
    'select-none',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-primary-500 text-white',
          'hover:bg-primary-600 hover:shadow-md',
          'active:bg-primary-700',
        ],
        secondary: [
          'bg-neutral-200 text-neutral-700',
          'hover:bg-neutral-300',
          'dark:bg-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-600',
        ],
        ghost: [
          'text-primary-500 bg-transparent',
          'hover:bg-primary-50 hover:text-primary-600',
          'dark:hover:bg-primary-900/20 dark:text-primary-400',
        ],
        outline: [
          'border-2 border-primary-500 text-primary-500 bg-transparent',
          'hover:bg-primary-50 hover:shadow-sm',
          'dark:hover:bg-primary-900/20',
        ],
        destructive: [
          'bg-error-500 text-white',
          'hover:bg-error-600 hover:shadow-md',
          'active:bg-error-700',
        ],
        'ghost-neutral': [
          'text-neutral-600 bg-transparent',
          'hover:bg-neutral-100 hover:text-neutral-800',
          'dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200',
        ],
        success: [
          'bg-success-500 text-white',
          'hover:bg-success-600 hover:shadow-md',
          'active:bg-success-700',
        ],
      },
      size: {
        xs: 'h-7  px-2    text-xs  gap-1',
        sm: 'h-8  px-3    text-sm  gap-1.5',
        md: 'h-10 px-4    text-sm  gap-2',
        lg: 'h-12 px-6    text-base gap-2',
        xl: 'h-14 px-8    text-lg  gap-3',
        icon: 'h-10 w-10  p-0',
        'icon-sm': 'h-8 w-8 p-0 text-sm',
        'icon-lg': 'h-12 w-12 p-0',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as a child component (e.g. Link) using Radix Slot */
  asChild?: boolean
  /** Show a loading spinner and disable the button */
  isLoading?: boolean
  /** Icon placed before the text */
  leftIcon?: React.ReactNode
  /** Icon placed after the text */
  rightIcon?: React.ReactNode
}

/**
 * Button component — supports 7 variants, 7 sizes, loading state.
 *
 * @example
 * <Button variant="primary" size="lg" onClick={handleSubmit}>
 *   Upload File
 * </Button>
 *
 * @example
 * <Button variant="outline" isLoading={isSubmitting}>
 *   Save Changes
 * </Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Loading…</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0" aria-hidden="true">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0" aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </Comp>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
