// src/components/auth/ProtectedRoute.tsx
// Sprint 2 — Auth flash fix + clean LoadingState + AccessDenied.
//
// THE BUG (from audit):
//   The original component rendered children briefly before the wallet
//   adapter finished its async auto-connect check. This caused a flash
//   of protected content, then a redirect to the connect screen.
//
// THE FIX:
//   We read `connecting` from WalletContext. On first render, the Solana
//   adapter may be in a `connecting` state if autoConnect is set (or if
//   the user has a cached wallet). We block rendering until that resolves.
//   We also add a short `isInitialising` guard (one tick) to absorb the
//   initial React render before wallet state is populated.

import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Wallet, Shield, ArrowRight, Lock } from 'lucide-react'
import { useWallet } from '@/contexts/WalletContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

// ── LoadingState ──────────────────────────────────────────────

/**
 * Shown while the wallet adapter is verifying an existing connection.
 * Replaces the original NextUI Spinner with our design system.
 */
function LoadingState() {
  return (
    <div
      className="min-h-[60vh] flex flex-col items-center justify-center gap-6"
      role="status"
      aria-live="polite"
      aria-label="Verifying wallet connection"
    >
      {/* Animated wallet icon */}
      <div className="relative">
        <div className="h-16 w-16 rounded-full bg-primary-500/10 border border-primary-500/30 flex items-center justify-center animate-pulse-glow">
          <Wallet className="h-7 w-7 text-primary-400" aria-hidden="true" />
        </div>
        {/* Spinning ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary-500 animate-spin"
          aria-hidden="true"
        />
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-neutral-100">
          Verifying wallet…
        </h2>
        <p className="text-sm text-neutral-500">
          Checking your existing connection
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5" aria-hidden="true">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

// ── AccessDenied ──────────────────────────────────────────────

/**
 * Shown when the user reaches a protected route without a wallet connection.
 * Preserves all informational copy from the original component.
 */
function AccessDenied({
  onConnect,
  isLoading,
  from,
}: {
  onConnect: () => void
  isLoading: boolean
  from: string
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div
        className={cn(
          'w-full max-w-md rounded-2xl border border-neutral-700',
          'bg-neutral-900/80 backdrop-blur-xl p-8 text-center',
          'shadow-2xl shadow-black/40'
        )}
        role="main"
        aria-label="Wallet connection required"
      >
        {/* Icon */}
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-error-500/10 border border-error-500/30 mb-6 mx-auto">
          <Shield className="h-8 w-8 text-error-400" aria-hidden="true" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-neutral-50 mb-3">
          Wallet Required
        </h1>

        {/* Description */}
        <p className="text-neutral-400 leading-relaxed mb-6 text-sm">
          This page requires a connected Solana wallet. Your wallet acts as
          your identity — no account or password needed.
        </p>

        {/* Feature list */}
        <ul className="space-y-2 mb-8 text-left" aria-label="What you get with a connected wallet">
          {[
            'Blockchain-secured authentication',
            'Access your encrypted file vault',
            'Manage sharing permissions',
            'Verify file authenticity on-chain',
          ].map(feature => (
            <li key={feature} className="flex items-center gap-2.5 text-sm text-neutral-300">
              <Lock className="h-3.5 w-3.5 text-primary-400 shrink-0" aria-hidden="true" />
              {feature}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          onClick={onConnect}
          rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
          id="connect-wallet-protected"
        >
          Connect Wallet
        </Button>

        {/* Help link */}
        <p className="text-xs text-neutral-600 mt-4">
          Don't have a wallet?{' '}
          <a
            href="https://phantom.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-400 hover:text-primary-300 underline transition-colors"
          >
            Get Phantom
          </a>
        </p>

        {/* Destination hint */}
        {from && from !== '/' && (
          <p className="text-xs text-neutral-700 mt-2">
            You'll be returned to <span className="text-neutral-500">{from}</span> after connecting.
          </p>
        )}
      </div>
    </div>
  )
}

// ── ProtectedRoute ────────────────────────────────────────────

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isConnected, connectWallet, isLoading, connectionStatus } = useWallet()
  const location = useLocation()

  // Auth-flash fix:
  // On first mount, the Solana adapter might not have resolved its state yet.
  // We wait one tick (useEffect) before deciding to show the AccessDenied screen.
  // This prevents the flash of protected content → redirect.
  const [isInitialising, setIsInitialising] = useState(true)

  useEffect(() => {
    // One microtask tick is enough — by then the wallet adapter has emitted
    // its initial state (connected/disconnected).
    const id = requestAnimationFrame(() => {
      setIsInitialising(false)
    })
    return () => cancelAnimationFrame(id)
  }, [])

  // 1. Still initialising or actively connecting → show LoadingState
  if (isInitialising || connectionStatus === 'connecting' || isLoading) {
    return <LoadingState />
  }

  // 2. Not connected → show fallback or AccessDenied
  if (!isConnected) {
    if (fallback) return <>{fallback}</>

    return (
      <AccessDenied
        onConnect={connectWallet}
        isLoading={isLoading}
        from={location.pathname}
      />
    )
  }

  // 3. Connected → render protected content
  return <>{children}</>
}

// Backward-compat named export
export default ProtectedRoute