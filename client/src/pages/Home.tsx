
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield,
  Zap,
  Globe,
  Share2,
  Lock,
  Users,
  ArrowRight,
  FileText,
  Eye,
  CheckCircle,
} from 'lucide-react'
import { useWallet } from '@/contexts/WalletContext'
import { useFiles } from '@/contexts/FileContext'
import { Button } from '@/components/ui/button'
import { Card, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageTransition } from '@/components/ui/page-transition'
import { WalletConnectModal } from '@/components/auth/WalletConnectModal'
import { SocialLoginModal } from '@/components/auth/SocialLoginModal'
import { cn } from '@/lib/cn'
import { formatFileSize } from '@/lib/utils'

//  Data 
const FEATURES = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: "Optimized for speed with instant uploads, downloads, and verification on Solana's high-performance network.",
    color: 'text-warning-400',
    bg: 'bg-warning-500/10',
    border: 'border-warning-500/20',
  },
  {
    icon: Lock,
    title: 'Privacy Focused',
    description: 'End-to-end encryption with granular access controls. You own your data, you control who sees it.',
    color: 'text-success-400',
    bg: 'bg-success-500/10',
    border: 'border-success-500/20',
  },
  {
    icon: Share2,
    title: 'Smart Sharing',
    description: 'Share files with advanced permissions, expiration dates, and download limits — all enforced by smart contracts.',
    color: 'text-accent-400',
    bg: 'bg-accent-500/10',
    border: 'border-accent-500/20',
  },
  {
    icon: Globe,
    title: 'Global Access',
    description: 'Access your files from anywhere in the world with just your wallet. No accounts, no passwords needed.',
    color: 'text-primary-400',
    bg: 'bg-primary-500/10',
    border: 'border-primary-500/20',
  },
]


const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Connect Wallet',
    description: 'Link your Solana wallet to start storing files securely. No email required.',
  },
  {
    step: '02',
    title: 'Upload Files',
    description: "Drag and drop your files. They're encrypted locally, hashed, and stored.",
  },
  {
    step: '03',
    title: 'Share & Verify',
    description: 'Share with custom permissions or verify authenticity anytime, anywhere.',
  },
]

//  Components 

export function Home() {
  const navigate = useNavigate()
  const { isConnected, isLoading } = useWallet()
  const { publicFiles } = useFiles()

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false)

  const handleGetStarted = () => {
    if (isConnected) {
      navigate('/dashboard')
    } else {
      setIsWalletModalOpen(true)
    }
  }

  return (
    <PageTransition>
      <div className="relative overflow-hidden min-h-screen">
        {/*  Hero Section  */}
        <section className="relative z-10 min-h-[85vh] flex flex-col items-center justify-center text-center px-4 pt-12 pb-24">
          
         
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-neutral-50 mb-6 max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: '100ms' }}>
            Decentralized Storage.<br />
            <span className="">Zero Compromises.</span>
          </h1>

          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '200ms' }}>
            Secure file storage with blockchain-backed authenticity and user control.
            Your keys, your data.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <Button
              size="xl"
              variant="primary"
              onClick={handleGetStarted}
              isLoading={isLoading}
              rightIcon={<ArrowRight className="h-5 w-5" />}
              className="w-full sm:w-auto shadow-xl shadow-primary-500/20"
            >
              {isConnected ? 'Go to Dashboard' : 'Connect Wallet'}
            </Button>
            
            {!isConnected && (
              <Button
                size="xl"
                variant="outline"
                onClick={() => setIsSocialModalOpen(true)}
                className="w-full sm:w-auto"
              >
                Social Login
              </Button>
            )}
          </div>
        </section>

        
        

        {/*  How It Works  */}
        <section className="relative z-10">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-50 mb-4">
                How It Works
              </h2>
              <p className="text-neutral-400 text-lg">Simple, secure, and decentralized in three steps</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {/* Connector Lines (Desktop) */}
              <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-px bg-gradient-to-r from-neutral-800/0 via-neutral-500/50 to-neutral-800/0 z-0" aria-hidden="true" />

              {HOW_IT_WORKS.map((step) => (
                <div key={step.step} className="relative text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-neutral-700 bg-neutral-900 shadow-xl mb-6 relative z-10">
                    <span className="text-2xl font-bold text-primary-400 font-mono">{step.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-100 mb-3">{step.title}</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/*  Public Files Preview  */}
        {publicFiles && publicFiles.length > 0 && (
          <section className="relative z-10 py-24">
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-12">
                <div>
                  <h2 className="text-3xl font-bold text-neutral-50 mb-2">Public Vault</h2>
                  <p className="text-neutral-400">Discover files shared by the community</p>
                </div>
                <Button variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  View All Files
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicFiles.slice(0, 3).map((file) => (
                  <Card key={file.fileId} variant="default">
                    <CardBody className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0 pr-4">
                          <h3 className="font-medium text-neutral-100 truncate">
                            {file.fileName || `File ${file.fileId.slice(0, 8)}`}
                          </h3>
                          <p className="text-xs text-neutral-500 mt-1 truncate">
                            {file.description || 'No description'}
                          </p>
                        </div>
                        <Badge variant="success" size="sm" className="shrink-0">Verified</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-neutral-500 border-t border-neutral-800 pt-4">
                        <span>{file.fileSize ? formatFileSize(Number(file.fileSize)) : 'Unknown size'}</span>
                        <div className="flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5" />
                          <span>{file.accessCount} views</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}



        {/*  Modals  */}
        <WalletConnectModal 
          isOpen={isWalletModalOpen} 
          onClose={() => setIsWalletModalOpen(false)} 
        />
        
        <SocialLoginModal 
          isOpen={isSocialModalOpen} 
          onClose={() => setIsSocialModalOpen(false)} 
        />
      </div>
    </PageTransition>
  )
}