// tailwind.config.ts — Denft Design System
// Phase 2: Full custom token system

import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      // ── Colour Palette ───────────────────────────────────────────────
      colors: {
        primary: {
          50:  '#F0F6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',  // Primary CTA — Solana-inspired blue
          600: '#2563EB',  // Hover state
          700: '#1D4ED8',  // Active state
          900: '#1E3A8A',  // Dark backgrounds / deep containers
        },
        accent: {
          100: '#EDE9FE',
          200: '#DDD6FE',
          400: '#A78BFA',
          500: '#8B5CF6',  // Web3-appropriate purple
          600: '#7C3AED',
          700: '#6D28D9',
          900: '#4C1D95',
        },
        success: {
          50:  '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',  // Emerald green — confirmations, verified
          600: '#059669',
          700: '#047857',
        },
        error: {
          50:  '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',  // Red — errors, destructive actions
          600: '#DC2626',
          700: '#B91C1C',
        },
        warning: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',  // Amber — cautions, unverified
          600: '#D97706',
          700: '#B45309',
        },
        neutral: {
          50:  'var(--tw-neutral-50)',
          100: 'var(--tw-neutral-100)',
          200: 'var(--tw-neutral-200)',
          300: 'var(--tw-neutral-300)',
          400: 'var(--tw-neutral-400)',
          500: 'var(--tw-neutral-500)',
          600: 'var(--tw-neutral-600)',
          700: 'var(--tw-neutral-700)',
          800: 'var(--tw-neutral-800)',
          900: 'var(--tw-neutral-900)',
          950: 'var(--tw-neutral-950)',
        },
      },

      // ── Typography ───────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        'display':  ['3rem',   { lineHeight: '3.5rem',  fontWeight: '800' }],  // 48px
        'heading-1':['2.25rem',{ lineHeight: '2.75rem', fontWeight: '700' }],  // 36px
        'heading-2':['1.875rem',{ lineHeight: '2.25rem',fontWeight: '700' }],  // 30px
        'heading-3':['1.5rem', { lineHeight: '2rem',    fontWeight: '600' }],  // 24px
        'heading-4':['1.25rem',{ lineHeight: '1.75rem', fontWeight: '600' }],  // 20px
        'body-lg':  ['1.125rem',{ lineHeight: '1.75rem',fontWeight: '400' }],  // 18px
        'body':     ['1rem',   { lineHeight: '1.5rem',  fontWeight: '400' }],  // 16px
        'body-sm':  ['0.875rem',{ lineHeight: '1.25rem',fontWeight: '400' }],  // 14px
        'caption':  ['0.75rem',{ lineHeight: '1rem',    fontWeight: '500' }],  // 12px
        'label':    ['0.75rem',{ lineHeight: '0.875rem',fontWeight: '600' }],  // 12px
      },

      // ── Spacing (4px base unit) ───────────────────────────────────────
      spacing: {
        xs:   '0.25rem',  //  4px
        sm:   '0.5rem',   //  8px
        md:   '0.75rem',  // 12px
        base: '1rem',     // 16px
        lg:   '1.5rem',   // 24px
        xl:   '2rem',     // 32px
        '2xl':'3rem',     // 48px
        '3xl':'4rem',     // 64px
      },

      // ── Border Radius ─────────────────────────────────────────────────
      borderRadius: {
        sm:   '0.125rem',  //  2px — text inputs, small buttons
        md:   '0.375rem',  //  6px — cards, larger buttons
        lg:   '0.5rem',    //  8px — modals, prominent cards
        xl:   '0.75rem',   // 12px — hero sections, featured cards
        '2xl':'1rem',      // 16px — large panels
        full: '9999px',    // pill — badges, avatars
      },

      // ── Shadow System ─────────────────────────────────────────────────
      boxShadow: {
        xs:       '0 1px 2px rgba(0,0,0,0.05)',
        sm:       '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        md:       '0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)',
        lg:       '0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)',
        xl:       '0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)',
        '2xl':    '0 25px 50px rgba(0,0,0,0.25)',
        elevated: '0 5px 20px rgba(59,130,246,0.15)',   // Blue-tinted — primary cards
        'elevated-accent': '0 5px 20px rgba(139,92,246,0.15)',
        'glow-primary': '0 0 30px rgba(59,130,246,0.3)',
        'glow-success': '0 0 20px rgba(16,185,129,0.3)',
        'glow-error':   '0 0 20px rgba(239,68,68,0.3)',
      },

      // ── Transition Durations ──────────────────────────────────────────
      transitionDuration: {
        xs:   '100ms',  // micro-interactions (button press)
        sm:   '150ms',  // state changes (color, opacity)
        base: '250ms',  // modal/drawer, tab switches
        lg:   '350ms',  // page transitions, full-screen
        slow: '500ms',  // intro animations, high-attention
      },

      // ── Custom Animations ─────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%':   { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'slide-in-right': {
          '0%':   { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        'slide-out-right': {
          '0%':   { transform: 'translateX(0)',    opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        'slide-in-up': {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        'scale-in': {
          '0%':   { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        'shimmer': {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59,130,246,0.3)' },
          '50%':       { boxShadow: '0 0 40px rgba(59,130,246,0.5)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        'spin-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in':         'fade-in 150ms ease-out',
        'fade-out':        'fade-out 150ms ease-in',
        'slide-in-right':  'slide-in-right 250ms ease-out',
        'slide-out-right': 'slide-out-right 200ms ease-in',
        'slide-in-up':     'slide-in-up 250ms ease-out',
        'scale-in':        'scale-in 250ms ease-out',
        'shimmer':         'shimmer 2s infinite',
        'pulse-glow':      'pulse-glow 2s ease-in-out infinite',
        'float':           'float 6s ease-in-out infinite',
        'gradient-shift':  'gradient-shift 3s ease infinite',
        'spin-slow':       'spin-slow 3s linear infinite',
        'pulse-sm':        'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },

      // ── Breakpoints (confirm) ─────────────────────────────────────────
      screens: {
        xs: '375px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },

      // ── Max Width ─────────────────────────────────────────────────────
      maxWidth: {
        content: '1280px',
      },
    },
  },
  plugins: [],
}

export default config
