// src/lib/cn.ts
// Utility for merging Tailwind class names safely.
// Combines clsx (conditional classes) + tailwind-merge (deduplication).

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS class names safely, deduplicating conflicting utilities.
 * @example cn('px-4 py-2', isActive && 'bg-primary-500', 'px-6')
 *          → 'py-2 bg-primary-500 px-6'  (px-4 is overridden by px-6)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
