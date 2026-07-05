// src/components/layout/AppLayout.tsx
// Sprint 1 — Master layout wrapper with skip-to-main, sticky header, flex main, pinned footer.

import React from 'react'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

interface AppLayoutProps {
  children: React.ReactNode
}

/**
 * AppLayout — the structural shell for every page.
 *
 * Structure:
 *   [skip-to-main-content link — visually hidden, shown on focus]
 *   ┌──────────────────────────────┐
 *   │  <header> Navbar (sticky)    │ z-50
 *   ├──────────────────────────────┤
 *   │  <main id="main-content">    │
 *   │    max-w-7xl centred pad     │
 *   │    {children}                │
 *   │  </main>                     │
 *   ├──────────────────────────────┤
 *   │  <footer> Footer (mt-auto)   │
 *   └──────────────────────────────┘
 */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-900 transition-colors duration-base">
      {/* ── Skip-to-main (WCAG — visible on keyboard focus) ── */}
      <a
        href="#main-content"
        className="skip-to-main"
      >
        Skip to main content
      </a>

      {/* ── Sticky Navbar ───────────────────────────────────── */}
      <header className="sticky top-0 z-50">
        <Navbar />
      </header>

      {/* ── Main Content ────────────────────────────────────── */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 w-full outline-none"
        aria-label="Page content"
      >
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <Footer />
    </div>
  )
}
