import { useEffect, useRef, useState } from 'react'
import { X, Mail, Twitter, Github, Info, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { useWeb3Auth } from '@/contexts/Web3AuthContext'
import { useWallet } from '@/contexts/WalletContext'

export interface SocialLoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SocialLoginModal({ isOpen, onClose }: SocialLoginModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const { loginWithSocial, isLoading: isWeb3AuthLoading } = useWeb3Auth()
  const { authenticateWallet, showToast } = useWallet()
  const [isConnecting, setIsConnecting] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus()
      document.body.style.overflow = 'hidden'
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isConnecting) onClose()
      }
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = ''
      }
    }
  }, [isOpen, onClose, isConnecting])

  const handleSocialLogin = async (provider: 'google' | 'twitter' | 'github') => {
    try {
      setIsConnecting(provider)
      // 1. Web3Auth Login (Social)
      const web3authProvider = await loginWithSocial(provider)
      if (!web3authProvider) throw new Error('Web3Auth Provider not initialized')

      // 2. Extract Solana Wallet
      const { SolanaWallet } = await import('@web3auth/solana-provider')
      const { PublicKey } = await import('@solana/web3.js')
      const solanaWallet = new SolanaWallet(web3authProvider)
      const accounts = await solanaWallet.requestAccounts()
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No Solana account found')
      }
      
      const pubKey = new PublicKey(accounts[0])

      // 3. Authenticate with backend using custom signer
      await authenticateWallet(pubKey, `Web3Auth (${provider})`, async (msg) => {
        return await solanaWallet.signMessage(msg)
      })
      
      showToast(`Successfully logged in with ${provider}`, 'success')
      onClose()
    } catch (error: any) {
      console.error(error)
      // Note: Toast is usually shown in the contexts, but we catch here to stop loading state
    } finally {
      setIsConnecting(null)
    }
  }

  if (!isOpen) return null

  const isLoadingAny = isConnecting !== null || isWeb3AuthLoading;

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
        aria-hidden="true"
        onClick={() => !isLoadingAny && onClose()}
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
              Sign in securely without a wallet
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            disabled={isLoadingAny}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            variant="outline" 
            fullWidth 
            className="justify-start gap-3" 
            onClick={() => handleSocialLogin('google')}
            disabled={isLoadingAny}
          >
            {isConnecting === 'google' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} 
            {isConnecting === 'google' ? 'Connecting...' : 'Continue with Google'}
          </Button>
          <Button 
            variant="outline" 
            fullWidth 
            className="justify-start gap-3" 
            onClick={() => handleSocialLogin('twitter')}
            disabled={isLoadingAny}
          >
            {isConnecting === 'twitter' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Twitter className="h-4 w-4" />} 
            {isConnecting === 'twitter' ? 'Connecting...' : 'Continue with Twitter'}
          </Button>
          <Button 
            variant="outline" 
            fullWidth 
            className="justify-start gap-3" 
            onClick={() => handleSocialLogin('github')}
            disabled={isLoadingAny}
          >
            {isConnecting === 'github' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />} 
            {isConnecting === 'github' ? 'Connecting...' : 'Continue with GitHub'}
          </Button>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-lg bg-success-500/10 border border-success-500/20 p-3">
          <Info className="h-5 w-5 text-success-400 shrink-0 mt-0.5" />
          <p className="text-sm text-success-300">
            Powered by Web3Auth. A non-custodial Solana wallet is instantly generated for your social account.
          </p>
        </div>
      </div>
    </>
  )
}
