// src/components/auth/WalletConnectModal.tsx
// Sprint 2 — Standalone wallet selection modal (no HeroUI).
//
// Extracted from WalletButton so it can be opened from:
//   - The Navbar WalletButton trigger
//   - The Home page hero CTA
//   - The ProtectedRoute AccessDenied screen
//
// PRESERVED: wallet detection logic, connection flow, error display,
//            walletOptions list, install URL fallback.

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { X, ExternalLink, Wallet, AlertCircle, Loader2 } from 'lucide-react'
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react'
import { type WalletName } from '@solana/wallet-adapter-base'
import { useWallet } from '@/contexts/WalletContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

// ── Wallet options ────────────────────────────────────────────

const WALLET_OPTIONS = [
  {
    name: 'Phantom',
    walletName: 'Phantom' as WalletName,
    icon: 'https://phantom.app/img/phantom-icon.svg',
    installUrl: 'https://phantom.app/',
    detectionKey: 'isPhantom',
    description: 'Most popular Solana wallet',
  },
  {
    name: 'Solflare',
    walletName: 'Solflare' as WalletName,
    icon: 'https://solflare.com/favicon.ico',
    installUrl: 'https://solflare.com/',
    detectionKey: 'isSolflare',
    description: 'Feature-rich Solana wallet',
  },
  {
    name: 'Backpack',
    walletName: 'Backpack' as WalletName,
    icon: 'https://assets.website-files.com/63bdf35a98e26f5c05a4de0b/63c4fac12d03b72d5dc1b5f6_backpack-favicon.png',
    installUrl: 'https://backpack.app/',
    detectionKey: 'isBackpack',
    description: 'Multi-chain browser wallet',
  },
  {
    name: 'OKX Wallet',
    walletName: 'OKX' as WalletName,
    icon: 'https://static.okx.com/cdn/assets/imgs/247/58E63FEA47A2B7D7.png',
    installUrl: 'https://www.okx.com/wallet',
    detectionKey: 'isOkxWallet',
    description: 'Web3 wallet by OKX',
  },
  {
    name: 'Torus',
    walletName: 'Torus' as WalletName,
    icon: 'https://tor.us/favicon.ico',
    installUrl: 'https://tor.us/',
    detectionKey: null,
    description: 'Social login via Torus',
  },
] as const

export interface WalletConnectModalProps {
  isOpen: boolean
  onClose: () => void
}

/** Detect if a specific wallet extension is installed */
function isWalletDetected(detectionKey: string | null): boolean {
  if (!detectionKey) return true // web-based wallets
  try {
    const { solana } = window as Record<string, unknown>
    return !!(solana && (solana as Record<string, unknown>)[detectionKey])
  } catch {
    return false
  }
}

// ── WalletConnectModal ────────────────────────────────────────

export function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const { error } = useWallet()
  const { select, connect, connected, connecting, wallet } = useSolanaWallet()
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Close on successful connection
  useEffect(() => {
    if (connected && isOpen) onClose()
  }, [connected, isOpen, onClose])

  // Trap focus inside modal when open
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus()
    }
  }, [isOpen])

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  const handleWalletSelect = async (option: typeof WALLET_OPTIONS[number]) => {
    const detected = isWalletDetected(option.detectionKey)

    if (!detected) {
      window.open(option.installUrl, '_blank', 'noopener,noreferrer')
      return
    }

    setConnectingWallet(option.name)
    try {
      select(option.walletName)
      // Small delay so the adapter has time to register the selection
      await new Promise(resolve => setTimeout(resolve, 120))
      await connect()
    } catch (err) {
      console.error('Wallet connection failed:', err)
    } finally {
      setConnectingWallet(null)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* ── Backdrop ──────────────────────────────────────── */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* ── Modal panel ───────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-modal-title"
        className={cn(
          'fixed left-1/2 top-1/2 z-[90] w-full max-w-sm -translate-x-1/2 -translate-y-1/2',
          'rounded-2xl border border-neutral-700 bg-neutral-950 shadow-2xl',
          'animate-scale-in'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <h2
              id="wallet-modal-title"
              className="text-lg font-semibold text-neutral-50"
            >
              Connect a wallet
            </h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              on Solana to continue
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close wallet connect dialog"
            className={cn(
              'p-1.5 rounded-lg',
              'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800',
              'transition-colors duration-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
            )}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Wallet list */}
        <div className="px-4 pb-2 space-y-2" role="list" aria-label="Available wallets">
          {WALLET_OPTIONS.map(option => {
            const detected   = isWalletDetected(option.detectionKey)
            const isThisOne  = connectingWallet === option.name
            const isBusy     = connecting || connectingWallet !== null

            return (
              <button
                key={option.name}
                role="listitem"
                type="button"
                onClick={() => handleWalletSelect(option)}
                disabled={isBusy && !isThisOne}
                aria-label={
                  detected
                    ? `Connect with ${option.name}`
                    : `Install ${option.name}`
                }
                className={cn(
                  'w-full flex items-center justify-between',
                  'px-4 py-3 rounded-xl border',
                  'transition-all duration-sm',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                  detected
                    ? 'border-neutral-700 bg-neutral-900 hover:border-neutral-600 hover:bg-neutral-800'
                    : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700 opacity-70',
                  (isBusy && !isThisOne) && 'cursor-not-allowed opacity-40'
                )}
              >
                {/* Left: icon + name */}
                <div className="flex items-center gap-3">
                  <img
                    src={option.icon}
                    alt=""
                    aria-hidden="true"
                    className="h-8 w-8 rounded-lg object-contain bg-neutral-800 p-1"
                    onError={e => {
                      const t = e.currentTarget
                      t.src = `https://ui-avatars.com/api/?name=${option.name}&background=3B82F6&color=fff`
                    }}
                  />
                  <div className="text-left">
                    <p className="text-sm font-medium text-neutral-100">
                      {option.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {option.description}
                    </p>
                  </div>
                </div>

                {/* Right: status badge */}
                <div className="shrink-0 ml-2">
                  {isThisOne ? (
                    <Loader2 className="h-4 w-4 text-primary-400 animate-spin" aria-hidden="true" />
                  ) : detected ? (
                    <span className="text-xs font-medium text-success-500 bg-success-500/10 px-2 py-0.5 rounded-full">
                      Detected
                    </span>
                  ) : (
                    <ExternalLink className="h-3.5 w-3.5 text-neutral-600" aria-hidden="true" />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Connecting status */}
        {connecting && wallet && (
          <div className="mx-4 my-2 flex items-center gap-2 rounded-lg border border-primary-500/30 bg-primary-500/10 px-4 py-2.5">
            <Loader2 className="h-4 w-4 text-primary-400 animate-spin shrink-0" aria-hidden="true" />
            <p className="text-sm text-primary-300">
              Connecting to {wallet.adapter.name}…
            </p>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="mx-4 my-2 flex items-start gap-2 rounded-lg border border-error-500/30 bg-error-500/10 px-4 py-2.5">
            <AlertCircle className="h-4 w-4 text-error-400 mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-sm text-error-300">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 pt-2 border-t border-neutral-800 mt-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-600">
              New to Solana wallets?{' '}
              <a
                href="https://phantom.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 underline transition-colors"
              >
                Learn more
              </a>
            </p>
            <Wallet className="h-4 w-4 text-neutral-700" aria-hidden="true" />
          </div>
        </div>
      </div>
    </>
  )
}
