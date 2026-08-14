import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Share2, Copy, CheckCircle, AlertTriangle, Globe, Lock } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { type FileData } from './FileDetailModal'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  file: FileData | null
}

export function ShareModal({ isOpen, onClose, file }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setCopied(false)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen || !file) return null

  // Generate a mock share link (In a real app, this would be an actual public route)
  const shareLink = `${window.location.origin}/share/${file.fileId}`

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500/10 rounded-lg">
              <Share2 className="h-5 w-5 text-primary-400" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-50">Share File</h2>
          </div>
          <Button variant="ghost-neutral" size="icon-sm" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-neutral-200 truncate">{file.fileName}</h3>
              <p className="text-xs text-neutral-500 mt-0.5">ID: {file.fileId.slice(0, 12)}...</p>
            </div>
            {file.isPublic ? (
              <Badge variant="success" size="sm"><Globe className="h-3 w-3 mr-1" /> Public</Badge>
            ) : (
              <Badge variant="secondary" size="sm"><Lock className="h-3 w-3 mr-1" /> Private</Badge>
            )}
          </div>

          {!file.isPublic && (
            <Card variant="ghost" className="border-warning-500/30 bg-warning-500/5">
              <CardBody className="p-4 flex gap-3">
                <AlertTriangle className="h-5 w-5 text-warning-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-warning-400 mb-1">Private File Warning</h4>
                  <p className="text-xs text-warning-500/80 leading-relaxed">
                    This file is marked as private. Only you can view or decrypt it. Anyone with this link will not be able to access the file unless you change its privacy settings to Public.
                  </p>
                </div>
              </CardBody>
            </Card>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Share Link</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 flex items-center overflow-hidden">
                <span className="text-sm text-neutral-300 truncate select-all">{shareLink}</span>
              </div>
              <Button variant="primary" onClick={handleCopy} className="shrink-0 w-24">
                {copied ? (
                  <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Copied</span>
                ) : (
                  <span className="flex items-center gap-2"><Copy className="h-4 w-4" /> Copy</span>
                )}
              </Button>
            </div>
          </div>

          <div className="pt-2">
             <Button variant="outline" className="w-full" onClick={onClose}>
               Done
             </Button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  )
}
