// src/components/auth/OnboardingModal.tsx
// Sprint 2 — First-time onboarding flow. Shown only once when a user connects their wallet.

import React, { useState, useEffect, useRef } from 'react'
import { Shield, Upload, Share2, Check, ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

export interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
}

const ONBOARDING_STEPS = [
  {
    title: 'Welcome to Denft',
    description: 'Your decentralized file storage vault. No passwords, no centralized servers. Just your wallet and your files.',
    icon: Shield,
    color: 'text-primary-400',
    bg: 'bg-primary-500/10',
    border: 'border-primary-500/20',
  },
  {
    title: 'Secure Uploads',
    description: 'Every file you upload is encrypted locally and pinned to IPFS for global, permanent availability.',
    icon: Upload,
    color: 'text-success-400',
    bg: 'bg-success-500/10',
    border: 'border-success-500/20',
  },
  {
    title: 'Smart Sharing',
    description: 'Share files with cryptographic proof. You control who gets access and for how long via smart contracts.',
    icon: Share2,
    color: 'text-accent-400',
    bg: 'bg-accent-500/10',
    border: 'border-accent-500/20',
  },
]

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen])

  if (!isOpen) return null

  const currentStep = ONBOARDING_STEPS[step]
  const Icon = currentStep.icon

  const handleNext = () => {
    if (step < ONBOARDING_STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      onClose()
    }
  }

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-modal-title"
        className={cn(
          'fixed left-1/2 top-1/2 z-[90] w-full max-w-md -translate-x-1/2 -translate-y-1/2',
          'rounded-3xl border border-neutral-700 bg-neutral-900 shadow-2xl',
          'animate-scale-in overflow-hidden'
        )}
      >
        {/* Header / close button (optional skip) */}
        <div className="absolute right-4 top-4 z-10">
          <button
            type="button"
            onClick={onClose}
            aria-label="Skip onboarding"
            className="text-neutral-500 hover:text-neutral-300 text-sm font-medium transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Content */}
        <div className="p-8 pb-6 flex flex-col items-center text-center mt-4">
          <div className={cn(
            'inline-flex p-5 rounded-full mb-6 border',
            currentStep.bg, currentStep.border
          )}>
            <Icon className={cn('h-10 w-10', currentStep.color)} aria-hidden="true" />
          </div>

          <h2 id="onboarding-modal-title" className="text-2xl font-bold text-neutral-50 mb-3">
            {currentStep.title}
          </h2>
          
          <p className="text-neutral-400 leading-relaxed text-sm min-h-[60px]">
            {currentStep.description}
          </p>
        </div>

        {/* Footer / Actions */}
        <div className="p-6 pt-0 bg-neutral-900 flex flex-col items-center">
          {/* Progress dots */}
          <div className="flex gap-2 mb-6" aria-label={`Step ${step + 1} of ${ONBOARDING_STEPS.length}`}>
            {ONBOARDING_STEPS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  i === step ? 'w-6 bg-primary-500' : 'w-2 bg-neutral-700'
                )}
              />
            ))}
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleNext}
            rightIcon={step === ONBOARDING_STEPS.length - 1 ? <Check className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
          >
            {step === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next'}
          </Button>
        </div>
      </div>
    </>
  )
}
