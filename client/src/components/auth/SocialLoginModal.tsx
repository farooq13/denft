// src/components/auth/SocialLoginModal.tsx
// Sprint 2 — Placeholder for Social Login (Web3Auth integration planned for later).

import { useEffect, useRef } from 'react'
import { X, Mail, Twitter, Github, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

export interface SocialLoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SocialLoginModal({ isOpen, onClose }: SocialLoginModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus()
      document.body.style.overflow = 'hidden'
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = ''
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="social-modal-title"
        className={cn(
          'fixed left-1/2 top-1/2 z-[90] w-full max-w-sm -translate-x-1/2 -translate-y-1/2',
          'rounded-2xl border border-neutral-700 bg-neutral-950 shadow-2xl',
          'animate-scale-in p-6'
        )}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 id="social-modal-title" className="text-lg font-semibold text-neutral-50">
              Social Login
            </h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              Sign in without a wallet
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <Button variant="outline" fullWidth className="justify-start gap-3" disabled>
            <Mail className="h-4 w-4" /> Continue with Google
          </Button>
          <Button variant="outline" fullWidth className="justify-start gap-3" disabled>
            <Twitter className="h-4 w-4" /> Continue with Twitter
          </Button>
          <Button variant="outline" fullWidth className="justify-start gap-3" disabled>
            <Github className="h-4 w-4" /> Continue with GitHub
          </Button>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-lg bg-primary-500/10 border border-primary-500/20 p-3">
          <Info className="h-5 w-5 text-primary-400 shrink-0 mt-0.5" />
          <p className="text-sm text-primary-300">
            Social login (Web3Auth) is currently under development and will be available in a future update.
          </p>
        </div>
      </div>
    </>
  )
}
