import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { 
  X, Shield, AlertTriangle, CheckCircle, 
  Copy, Download, FileText, 
  Image as ImageIcon, Video, Music, Archive,
  Loader2, Globe, Lock, Share2
} from 'lucide-react'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/cn'
import { formatFileSize } from '@/lib/utils'

export interface FileData {
  fileId: string
  fileName: string
  fileSize: string | number
  uploadedAt: string
  category: string
  accessCount: number | string
  downloadCount: number | string
  isPublic?: boolean
  isFavorite?: boolean
  ipfsHash: string
  description?: string
  tags?: string[]
}

interface FileDetailModalProps {
  isOpen: boolean
  onClose: () => void
  file: FileData | null
  onDownload: (id: string) => void
  onShare: (file: FileData) => void
  readOnly?: boolean
}

const getFileIcon = (category: string) => {
  switch (category) {
    case 'image': return ImageIcon
    case 'video': return Video
    case 'audio': return Music
    case 'document': return FileText
    case 'archive': return Archive
    default: return FileText
  }
}

export function FileDetailModal({ isOpen, onClose, file, onDownload, onShare, readOnly = false }: FileDetailModalProps) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyProgress, setVerifyProgress] = useState(0)
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'mismatch'>('idle')
  const [copied, setCopied] = useState(false)

  // Reset state when file changes
  useEffect(() => {
    if (isOpen) {
      setIsVerifying(false)
      setVerifyProgress(0)
      setVerifyStatus('idle')
      setCopied(false)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen, file])

  if (!isOpen || !file) return null

  const Icon = getFileIcon(file.category)

  const handleCopy = () => {
    navigator.clipboard.writeText(file.ipfsHash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const runVerification = () => {
    setIsVerifying(true)
    setVerifyProgress(0)
    setVerifyStatus('idle')

    // Simulate verification flow
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5
      if (progress >= 100) {
        clearInterval(interval)
        setVerifyProgress(100)
        setIsVerifying(false)
        // 10% chance to simulate a mismatch for demo purposes
        if (Math.random() > 0.9) {
          setVerifyStatus('mismatch')
        } else {
          setVerifyStatus('success')
        }
      } else {
        setVerifyProgress(progress)
      }
    }, 300)
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-neutral-800 shrink-0 bg-neutral-900/50">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3 bg-neutral-800 rounded-xl shrink-0">
              <Icon className="h-6 w-6 text-primary-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-neutral-50 truncate" title={file.fileName}>
                {file.fileName || 'Untitled File'}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-medium text-neutral-400">
                <span>{formatFileSize(Number(file.fileSize))}</span>
                <span>•</span>
                <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                {file.isPublic ? (
                  <Badge variant="success" size="sm" className="ml-1"><Globe className="h-3 w-3 mr-1" /> Public</Badge>
                ) : (
                  <Badge variant="secondary" size="sm" className="ml-1"><Lock className="h-3 w-3 mr-1" /> Private</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => onDownload(file.fileId)} aria-label="Download">
              <Download className="h-5 w-5 text-primary-400" />
            </Button>
            {!readOnly && (
              <Button variant="ghost-neutral" size="icon" onClick={() => onShare(file)} aria-label="Share">
                <Share2 className="h-5 w-5" />
              </Button>
            )}
            <Button variant="ghost-neutral" size="icon" onClick={onClose} className="ml-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Preview & Metadata */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Preview Panel (Simulated) */}
              <Card variant="ghost" className="aspect-video w-full bg-neutral-900 flex items-center justify-center overflow-hidden border-neutral-800 relative">
                {file.category === 'image' ? (
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80')] bg-cover bg-center opacity-80" />
                ) : (
                  <div className="text-center p-6 relative z-10">
                    <Icon className="h-16 w-16 text-neutral-600 mx-auto mb-4" />
                    <p className="text-neutral-400 font-medium">No preview available for {file.category} files</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
                   <Badge variant="primary" className="shadow-lg backdrop-blur-md bg-primary-500/80">{file.category.toUpperCase()}</Badge>
                </div>
              </Card>

              {/* Description & Tags */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-200 mb-2">Description</h3>
                  <p className="text-sm text-neutral-400 bg-neutral-900/50 p-4 rounded-xl border border-neutral-800/50 leading-relaxed">
                    {file.description || 'No description provided.'}
                  </p>
                </div>

                {file.tags && file.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-200 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {file.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="bg-neutral-800 hover:bg-neutral-700 transition-colors cursor-default">#{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Verification & Blockchain */}
            <div className="space-y-6">
              
              {/* Hash / CID Display */}
              <Card variant="default">
                <CardBody className="p-5 space-y-4">
                  <div className="flex items-center gap-2 text-primary-400 mb-1">
                    <Shield className="h-5 w-5" />
                    <h3 className="font-semibold text-neutral-100">Cryptographic Identity</h3>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">IPFS CID / Hash</label>
                    <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg p-2 group">
                      <span className="text-xs font-mono text-neutral-300 truncate flex-1 select-all pl-1">{file.ipfsHash || 'Qm... (Not uploaded)'}</span>
                      <Button variant="ghost-neutral" size="icon-sm" onClick={handleCopy} className="shrink-0">
                        {copied ? <CheckCircle className="h-4 w-4 text-success-500" /> : <Copy className="h-4 w-4 text-neutral-400 group-hover:text-neutral-200" />}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-800">
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Network</p>
                      <p className="text-sm font-medium text-neutral-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-success-500" /> Solana Devnet
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Storage</p>
                      <p className="text-sm font-medium text-neutral-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary-500" /> IPFS Pinata
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Verification Panel */}
              <Card variant={verifyStatus === 'mismatch' ? 'ghost' : 'elevated'} className={cn(
                "transition-colors duration-500",
                verifyStatus === 'mismatch' && "border-error-500/30 bg-error-500/5",
                verifyStatus === 'success' && "border-success-500/30 bg-success-500/5"
              )}>
                <CardBody className="p-5 flex flex-col items-center text-center space-y-4">
                  {verifyStatus === 'idle' && !isVerifying && (
                    <>
                      <div className="h-12 w-12 rounded-full bg-primary-500/10 flex items-center justify-center">
                        <Shield className="h-6 w-6 text-primary-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-neutral-100 mb-1">Verify Authenticity</h4>
                        <p className="text-xs text-neutral-400 max-w-[220px] mx-auto">
                          Check the blockchain record to ensure this file has not been tampered with.
                        </p>
                      </div>
                      <Button variant="primary" className="w-full mt-2" onClick={runVerification}>
                        Run Verification
                      </Button>
                    </>
                  )}

                  {isVerifying && (
                    <div className="w-full space-y-4 py-2">
                      <Loader2 className="h-8 w-8 text-primary-400 animate-spin mx-auto" />
                      <div>
                        <p className="text-sm font-medium text-neutral-200 mb-2">Verifying Ledger...</p>
                        <Progress value={verifyProgress} colorVariant="primary" className="h-2" />
                      </div>
                      <p className="text-xs text-neutral-500 font-mono">{verifyProgress}% Complete</p>
                    </div>
                  )}

                  {verifyStatus === 'success' && (
                    <div className="space-y-3 animate-fade-in w-full">
                      <div className="h-12 w-12 rounded-full bg-success-500/20 flex items-center justify-center mx-auto">
                        <CheckCircle className="h-6 w-6 text-success-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-success-400 mb-1">Verification Passed</h4>
                        <p className="text-xs text-success-500/80 leading-relaxed">
                          The current file hash matches the immutable record on the Solana blockchain perfectly.
                        </p>
                      </div>
                      <Button variant="outline" className="w-full mt-2" onClick={() => setVerifyStatus('idle')}>
                        Verify Again
                      </Button>
                    </div>
                  )}

                  {verifyStatus === 'mismatch' && (
                    <div className="space-y-3 animate-fade-in w-full">
                      <div className="h-12 w-12 rounded-full bg-error-500/20 flex items-center justify-center mx-auto animate-pulse">
                        <AlertTriangle className="h-6 w-6 text-error-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-error-400 mb-1">Hash Mismatch Detected</h4>
                        <p className="text-xs text-error-400/80 leading-relaxed">
                          The IPFS CID does not match the original signature stored on the blockchain. This file may be corrupted or tampered with.
                        </p>
                      </div>
                      <Button variant="destructive" className="w-full mt-2" onClick={() => setVerifyStatus('idle')}>
                        Retry Verification
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>

            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
