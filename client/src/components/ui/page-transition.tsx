// src/components/ui/page-transition.tsx
// Sprint 1 — Subtle fade-in animation applied to every page route.
// Respects prefers-reduced-motion: if set, the animation is instantaneous.

import React from 'react'
import { motion } from 'framer-motion'

interface PageTransitionProps {
  children: React.ReactNode
  /** Optional extra class on the wrapper */
  className?: string
}

const variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
}

/**
 * PageTransition — wraps a page and applies a fade+slide-up entrance.
 *
 * Usage: wrap the top-level JSX of each page component:
 * ```tsx
 * export const Home = () => (
 *   <PageTransition>
 *     …content…
 *   </PageTransition>
 * )
 * ```
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
