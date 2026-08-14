// src/lib/utils.ts
// Shared utility functions used across the application.

import { FILE_TYPE_LABELS, FILE_LIMITS } from './constants'

/**
 * Format a file size in bytes to a human-readable string.
 * @example formatFileSize(1536000) → "1.5 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Truncate a wallet address to show first 4 + last 4 chars.
 * @example truncateAddress('AbcDef123xyz9fKzQrsT') → 'AbcD…QrsT'
 */
export function truncateAddress(address: string, chars = 4): string {
  if (!address) return ''
  if (address.length <= chars * 2 + 3) return address
  return `${address.slice(0, chars)}…${address.slice(-chars)}`
}

/**
 * Truncate a file hash / CID for display.
 * @example truncateHash('sha256:abc123xyz789def456...') → 'sha256:abc123…ef456'
 */
export function truncateHash(hash: string, chars = 8): string {
  if (!hash) return ''
  const colonIdx = hash.indexOf(':')
  if (colonIdx !== -1) {
    const prefix = hash.slice(0, colonIdx + 1)
    const value  = hash.slice(colonIdx + 1)
    if (value.length <= chars * 2 + 3) return hash
    return `${prefix}${value.slice(0, chars)}…${value.slice(-chars)}`
  }
  if (hash.length <= chars * 2 + 3) return hash
  return `${hash.slice(0, chars)}…${hash.slice(-chars)}`
}

/**
 * Resolve a MIME type to a display category string.
 */
export function getFileCategory(mimeType: string): string {
  if (!mimeType) return 'default'
  if (mimeType.startsWith('image/'))       return 'image'
  if (mimeType.startsWith('video/'))       return 'video'
  if (mimeType.startsWith('audio/'))       return 'audio'
  if (mimeType.startsWith('text/'))        return 'document'
  if (mimeType === 'application/pdf')      return 'document'
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('gzip')) {
    return 'archive'
  }
  if (mimeType.includes('javascript') || mimeType.includes('typescript') ||
      mimeType.includes('json') || mimeType.includes('html') || mimeType.includes('css')) {
    return 'code'
  }
  return 'default'
}

/**
 * Get a human-readable label for a MIME type.
 */
export function getFileTypeLabel(mimeType: string): string {
  return FILE_TYPE_LABELS[mimeType] ?? mimeType.split('/')[1]?.toUpperCase() ?? 'File'
}

/**
 * Validate a file against the global file limits.
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > FILE_LIMITS.maxSizeBytes) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${FILE_LIMITS.maxSizeMB} MB.`,
    }
  }
  return { valid: true }
}

/**
 * Format a date to a relative time string (e.g. "2 hours ago").
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = Date.now()
  const diff = now - d.getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours   = Math.floor(minutes / 60)
  const days    = Math.floor(hours / 24)
  const weeks   = Math.floor(days / 7)
  const months  = Math.floor(days / 30)
  const years   = Math.floor(days / 365)

  if (seconds < 60)    return 'just now'
  if (minutes < 60)    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  if (hours < 24)      return `${hours} hour${hours === 1 ? '' : 's'} ago`
  if (days < 7)        return `${days} day${days === 1 ? '' : 's'} ago`
  if (weeks < 4)       return `${weeks} week${weeks === 1 ? '' : 's'} ago`
  if (months < 12)     return `${months} month${months === 1 ? '' : 's'} ago`
  return `${years} year${years === 1 ? '' : 's'} ago`
}

/**
 * Format a date to a readable string (e.g. "Jun 12, 2025").
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year:  'numeric',
    month: 'short',
    day:   'numeric',
  })
}

/**
 * Copy text to clipboard, returns true if successful.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for older browsers
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.focus()
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  }
}

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Calculate storage usage percentage.
 */
export function getStoragePercentage(used: number, total: number): number {
  if (total === 0) return 0
  return Math.min(100, Math.round((used / total) * 100))
}
