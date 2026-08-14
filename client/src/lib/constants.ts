// src/lib/constants.ts
// Shared design-system constants available in TypeScript code.
// Mirrors the @theme values from globals.css.

/** Animation duration tokens (in ms) */
export const ANIMATION_DURATIONS = {
  xs:   100,  // micro-interactions (button press feedback)
  sm:   150,  // component state changes (color, opacity)
  base: 250,  // modal/drawer open/close, tab switches
  lg:   350,  // page transitions, full-screen animations
  slow: 500,  // intro animations, high-attention items
} as const

/** Responsive breakpoints (matches @theme screens) */
export const BREAKPOINTS = {
  xs:  '375px',
  sm:  '640px',
  md:  '768px',
  lg:  '1024px',
  xl:  '1280px',
  '2xl': '1536px',
} as const

/** WCAG minimum touch target size (px) */
export const TOUCH_TARGET_MIN = 44

/** App-wide layout constants */
export const LAYOUT = {
  navbarHeight:    64,     // px
  sidebarWidth:    240,    // px
  contentMaxWidth: 1280,   // px
  footerHeight:    200,    // px (approx)
} as const

/** LocalStorage keys — centralised to avoid typos */
export const STORAGE_KEYS = {
  theme:       'denft-theme',
  onboarding:  'denft-onboarding-seen',
  viewMode:    'denft-files-view-mode',
  wallet:      'denft-wallet',
} as const

/** File type → display name mapping */
export const FILE_TYPE_LABELS: Record<string, string> = {
  'application/pdf':       'PDF',
  'image/jpeg':            'Image',
  'image/png':             'Image',
  'image/gif':             'GIF',
  'image/webp':            'Image',
  'image/svg+xml':         'SVG',
  'video/mp4':             'Video',
  'video/webm':            'Video',
  'audio/mpeg':            'Audio',
  'audio/wav':             'Audio',
  'text/plain':            'Text',
  'application/zip':       'Archive',
  'application/x-tar':     'Archive',
  'application/json':      'JSON',
  'application/javascript':'JavaScript',
  'text/html':             'HTML',
  'text/css':              'CSS',
}

/** File type → CSS class token mapping */
export const FILE_TYPE_CLASS: Record<string, string> = {
  document: 'file-type-document',
  image:    'file-type-image',
  video:    'file-type-video',
  audio:    'file-type-audio',
  archive:  'file-type-archive',
  code:     'file-type-code',
  default:  'file-type-default',
}

/** Toast auto-dismiss durations (ms) */
export const TOAST_DURATION = {
  success: 4000,
  error:   6000,
  warning: 5000,
  info:    3000,
  loading: Infinity,
} as const

/** Maximum file sizes */
export const FILE_LIMITS = {
  maxSizeBytes:  500 * 1024 * 1024,  // 500 MB
  maxSizeMB:     500,
  maxFilesAtOnce: 10,
} as const

/** Supported file categories for filtering */
export const FILE_CATEGORIES = [
  { value: 'all',       label: 'All Files' },
  { value: 'document',  label: 'Documents' },
  { value: 'image',     label: 'Images' },
  { value: 'video',     label: 'Videos' },
  { value: 'audio',     label: 'Audio' },
  { value: 'archive',   label: 'Archives' },
  { value: 'code',      label: 'Code' },
  { value: 'other',     label: 'Other' },
] as const

export type FileCategory = typeof FILE_CATEGORIES[number]['value']
