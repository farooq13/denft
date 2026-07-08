// src/components/wallet/WalletButton.tsx
// Sprint 2 — Refactored WalletButton to use the standalone WalletConnectModal.
// Removed all HeroUI dependencies.

import { useState } from 'react'
import { Wallet } from 'lucide-react'
import { useWallet } from '@/contexts/WalletContext'
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react'
import { Button } from '@/components/ui/button'
import { WalletConnectModal } from '@/components/auth/WalletConnectModal'

export function WalletButton() {
  const { isLoading, connectionStatus } = useWallet()
  const { connecting } = useSolanaWallet()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const isBusy = connectionStatus === 'connecting' || connecting || isLoading

  return (
    <>
      <Button
        variant="primary"
        size="md"
        onClick={() => setIsModalOpen(true)}
        isLoading={isBusy}
        leftIcon={!isBusy && <Wallet className="h-4 w-4" aria-hidden="true" />}
      >
        {isBusy ? 'Connecting…' : 'Connect Wallet'}
      </Button>

      <WalletConnectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}