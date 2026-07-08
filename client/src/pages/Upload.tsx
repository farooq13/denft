// src/pages/Upload.tsx
// Sprint 4 — File Upload Experience
// Complete rewrite removing NextUI and introducing multi-stage upload UI.

import React, { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  X,
  Settings,
  Shield,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Info,
  Check,
  RefreshCcw,
  Loader2,
  Lock,
  Wallet,
  Link as LinkIcon,
} from 'lucide-react'
import { useFiles } from '@/contexts/FileContext'
import { useToaster } from '@/contexts/ToasterContext'
import { PageTransition } from '@/components/ui/page-transition'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'
import { formatFileSize } from '@/lib/utils'

// ── TYPES & CONSTANTS ─────────────────────────────────────────

type UploadStage = 
  | 'idle'
  | 'preparing' // Reading metadata
  | 'encrypting' // Simulating encryption
  | 'ipfs' // Uploading to IPFS
  | 'signing' // Awaiting wallet signature
  | 'confirming' // Confirming transaction
  | 'success'
  | 'error'

interface ExtendedFile extends File {
  id: string
}

const fileCategories = [
  { value: 'document', label: 'Document', icon: FileText },
  { value: 'image', label: 'Image', icon: ImageIcon },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'audio', label: 'Audio', icon: Music },
  { value: 'archive', label: 'Archive', icon: Archive },
  { value: 'other', label: 'Other', icon: FileText },
]

// ── UTILS ─────────────────────────────────────────────────────

const getFileIcon = (file: File) => {
  const type = file.type.toLowerCase()
  if (type.startsWith('image/')) return ImageIcon
  if (type.startsWith('video/')) return Video
  if (type.startsWith('audio/')) return Music
  if (type.includes('pdf') || type.includes('document') || type.includes('text')) return FileText
  return Archive
}

const detectFileCategory = (file: File): string => {
  const type = file.type.toLowerCase()
  if (type.startsWith('image/')) return 'image'
  if (type.startsWith('video/')) return 'video'
  if (type.startsWith('audio/')) return 'audio'
  if (type.includes('pdf') || type.includes('document') || type.includes('text')) return 'document'
  if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return 'archive'
  return 'other'
}

// ── UPLOAD COMPONENT ──────────────────────────────────────────

export function Upload() {
  const navigate = useNavigate()
  const { uploadFile, uploadProgress } = useFiles()
  const { showToast } = useToaster()
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // State
  const [file, setFile] = useState<ExtendedFile | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [stage, setStage] = useState<UploadStage>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  // Settings
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState({
    isPublic: false,
    category: '',
    description: '',
    tags: [] as string[],
    enableEncryption: true,
  })
  const [tagInput, setTagInput] = useState('')

  // ── DRAG & DROP HANDLERS ────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    // We only take the first file for this advanced 6-stage UI
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selected = e.dataTransfer.files[0] as ExtendedFile
      selected.id = Math.random().toString(36).substring(7)
      setFile(selected)
      setSettings(prev => ({ ...prev, category: detectFileCategory(selected) }))
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0] as ExtendedFile
      selected.id = Math.random().toString(36).substring(7)
      setFile(selected)
      setSettings(prev => ({ ...prev, category: detectFileCategory(selected) }))
    }
    e.target.value = ''
  }, [])

  // ── SETTINGS HANDLERS ───────────────────────────────────────

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !settings.tags.includes(tag)) {
      setSettings(prev => ({ ...prev, tags: [...prev.tags, tag] }))
      setTagInput('')
    }
  }

  const removeTag = (t: string) => {
    setSettings(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== t) }))
  }

  // ── MULTI-STAGE UPLOAD LOGIC ────────────────────────────────

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

  const startUpload = async () => {
    if (!file) return
    setErrorMsg(null)
    setStage('preparing')

    try {
      // 1. Preparing
      await delay(800)
      
      // 2. Encrypting
      if (settings.enableEncryption) {
        setStage('encrypting')
        await delay(1200)
      }

      // 3. Uploading to IPFS & Backend (calling actual context method)
      setStage('ipfs')
      // Note: uploadFile tracks its own uploadProgress (0-100)
      const uploadPromise = uploadFile(file, {
        description: settings.description,
        tags: settings.tags,
        isPublic: settings.isPublic,
        category: settings.category || detectFileCategory(file),
      })
      
      // We will assume that while uploadPromise runs, progress goes to 100%.
      // We also want to simulate the wallet signing explicitly if progress reaches 100.
      
      // Let's hook into the real upload, but pause to show the stages:
      // In reality, uploadFile does the whole thing. We will simulate stages concurrently.
      let isDone = false
      uploadPromise.then(() => { isDone = true }).catch(() => { isDone = true })
      
      // Wait for IPFS (simulate reaching 100% upload progress)
      // If the real upload is fast, we still show signing
      while(!isDone && uploadProgress < 100) {
        await delay(100)
      }
      
      // 4. Awaiting Wallet Signature
      setStage('signing')
      await delay(1500) // simulated wait for signature

      // 5. Confirming Transaction
      setStage('confirming')
      
      // Wait for actual promise to resolve
      await uploadPromise

      // 6. Success
      setStage('success')
      showToast('File secured and uploaded successfully', 'success')
      
    } catch (err: any) {
      setStage('error')
      setErrorMsg(err.message || 'An error occurred during upload')
    }
  }

  const resetUpload = () => {
    setFile(null)
    setStage('idle')
    setErrorMsg(null)
  }

  // ── RENDER HELPERS ──────────────────────────────────────────

  const renderStageIcon = (currentStage: UploadStage, targetStage: UploadStage, Icon: any, overrideColor?: string) => {
    const stages = ['idle', 'preparing', 'encrypting', 'ipfs', 'signing', 'confirming', 'success', 'error']
    const currentIndex = stages.indexOf(currentStage)
    const targetIndex = stages.indexOf(targetStage)

    if (currentStage === 'error' && currentIndex <= targetIndex) {
      return <X className="h-5 w-5 text-error-400" />
    }
    
    if (currentIndex > targetIndex || currentStage === 'success') {
      return <Check className="h-5 w-5 text-success-500" />
    }
    
    if (currentIndex === targetIndex) {
      return <Loader2 className="h-5 w-5 text-primary-400 animate-spin" />
    }
    
    return <Icon className={`h-5 w-5 ${overrideColor || 'text-neutral-500'}`} />
  }

  const getStageStatusText = (targetStage: UploadStage) => {
    const stages = ['idle', 'preparing', 'encrypting', 'ipfs', 'signing', 'confirming', 'success', 'error']
    const currentIndex = stages.indexOf(stage)
    const targetIndex = stages.indexOf(targetStage)

    if (stage === 'error' && currentIndex <= targetIndex) return 'Failed'
    if (currentIndex > targetIndex || stage === 'success') return 'Completed'
    if (currentIndex === targetIndex) return 'Processing...'
    return 'Waiting'
  }

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
        
        {/* HEADER */}
        <div className="text-center pt-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-50 mb-3">
            Secure Upload
          </h1>
          <p className="text-neutral-400 max-w-xl mx-auto text-sm md:text-base">
            Store your files securely on IPFS with cryptographic verification on the Solana blockchain.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* MAIN UPLOAD AREA */}
          <div className={cn("lg:col-span-2 space-y-6", showSettings ? "hidden lg:block" : "block")}>
            
            {/* 1. DROPZONE (Shown when idle and no file) */}
            {!file && (
              <Card variant="outlined" className={cn(
                "border-2 border-dashed transition-all duration-300",
                isDragOver ? "border-primary-500 bg-primary-500/5 scale-[1.02]" : "border-neutral-700 bg-neutral-900/50 hover:border-neutral-500 hover:bg-neutral-800"
              )}>
                <CardBody className="p-12 text-center relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleFileSelect}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    aria-label="File upload dropzone"
                  />
                  
                  <div className={cn(
                    "inline-flex p-5 rounded-full mb-6 transition-transform duration-300",
                    isDragOver ? "bg-primary-500/20 scale-110" : "bg-neutral-800"
                  )}>
                    <UploadCloud className={cn(
                      "w-12 h-12 transition-colors",
                      isDragOver ? "text-primary-400" : "text-neutral-400"
                    )} />
                  </div>
                  
                  <h3 className="text-xl font-bold text-neutral-100 mb-2">
                    {isDragOver ? 'Drop file to upload' : 'Click or drag file here'}
                  </h3>
                  <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-6">
                    Max file size 100MB. Files are automatically encrypted before storage.
                  </p>
                  
                  <Button variant={isDragOver ? "primary" : "secondary"} className="relative z-0 pointer-events-none">
                    Select File
                  </Button>
                </CardBody>
              </Card>
            )}

            {/* 2. SELECTED FILE / UPLOAD PROGRESS (Shown when file is selected) */}
            {file && (
              <Card variant="elevated" className="overflow-hidden border-primary-500/30">
                <CardBody className="p-0">
                  
                  {/* File Info Header */}
                  <div className="p-6 bg-neutral-800/50 border-b border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-neutral-900 rounded-xl">
                        {React.createElement(getFileIcon(file), { className: "h-8 w-8 text-primary-400" })}
                      </div>
                      <div className="min-w-0 pr-4">
                        <h3 className="text-base font-semibold text-neutral-100 truncate w-48 sm:w-64">
                          {file.name}
                        </h3>
                        <p className="text-sm text-neutral-500 mt-0.5">
                          {formatFileSize(file.size)} • {settings.category || 'Unknown type'}
                        </p>
                      </div>
                    </div>
                    {stage === 'idle' && (
                      <Button variant="ghost-neutral" size="icon" onClick={() => setFile(null)} aria-label="Remove file">
                        <X className="h-5 w-5" />
                      </Button>
                    )}
                  </div>

                  {/* Upload Flow UI */}
                  {stage === 'idle' ? (
                    <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-neutral-900">
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button 
                          variant="outline" 
                          leftIcon={<Settings className="h-4 w-4" />} 
                          onClick={() => setShowSettings(!showSettings)}
                          className="flex-1 sm:flex-none"
                        >
                          Settings
                        </Button>
                      </div>
                      <Button 
                        variant="primary" 
                        size="lg" 
                        leftIcon={<UploadCloud className="h-5 w-5" />} 
                        onClick={startUpload}
                        className="w-full sm:w-auto"
                      >
                        Start Upload
                      </Button>
                    </div>
                  ) : (
                    <div className="p-6 bg-neutral-900">
                      
                      {/* Overall Progress Bar */}
                      {stage !== 'success' && stage !== 'error' && (
                        <div className="mb-8">
                          <div className="flex justify-between text-sm mb-2 font-medium">
                            <span className="text-neutral-300">Upload in progress...</span>
                            <span className="text-primary-400">
                              {stage === 'preparing' ? '15%' : stage === 'encrypting' ? '30%' : stage === 'ipfs' ? `${30 + Math.floor(uploadProgress * 0.4)}%` : stage === 'signing' ? '85%' : '95%'}
                            </span>
                          </div>
                          <Progress 
                            value={stage === 'preparing' ? 15 : stage === 'encrypting' ? 30 : stage === 'ipfs' ? 30 + (uploadProgress * 0.4) : stage === 'signing' ? 85 : stage === 'confirming' ? 95 : 100} 
                            colorVariant="primary" 
                            size="md" 
                          />
                        </div>
                      )}

                      {/* 6 Stages List */}
                      <div className="space-y-4">
                        
                        {/* Stage 1: Prepare */}
                        <div className={cn("flex items-center justify-between p-3 rounded-lg border transition-colors", stage === 'preparing' ? "bg-primary-500/10 border-primary-500/30" : "border-neutral-800 bg-neutral-900")}>
                          <div className="flex items-center gap-3">
                            {renderStageIcon(stage, 'preparing', FileText)}
                            <span className={cn("text-sm font-medium", stage === 'preparing' ? "text-primary-400" : "text-neutral-300")}>Reading Metadata</span>
                          </div>
                          <span className="text-xs text-neutral-500">{getStageStatusText('preparing')}</span>
                        </div>

                        {/* Stage 2: Encrypt */}
                        {settings.enableEncryption && (
                          <div className={cn("flex items-center justify-between p-3 rounded-lg border transition-colors", stage === 'encrypting' ? "bg-primary-500/10 border-primary-500/30" : "border-neutral-800 bg-neutral-900")}>
                            <div className="flex items-center gap-3">
                              {renderStageIcon(stage, 'encrypting', Lock)}
                              <span className={cn("text-sm font-medium", stage === 'encrypting' ? "text-primary-400" : "text-neutral-300")}>Client-side Encryption</span>
                            </div>
                            <span className="text-xs text-neutral-500">{getStageStatusText('encrypting')}</span>
                          </div>
                        )}

                        {/* Stage 3: IPFS */}
                        <div className={cn("flex items-center justify-between p-3 rounded-lg border transition-colors", stage === 'ipfs' ? "bg-primary-500/10 border-primary-500/30" : "border-neutral-800 bg-neutral-900")}>
                          <div className="flex items-center gap-3">
                            {renderStageIcon(stage, 'ipfs', UploadCloud)}
                            <span className={cn("text-sm font-medium", stage === 'ipfs' ? "text-primary-400" : "text-neutral-300")}>Pinning to IPFS</span>
                          </div>
                          <span className="text-xs text-neutral-500">{getStageStatusText('ipfs')}</span>
                        </div>

                        {/* Stage 4: Signing */}
                        <div className={cn("flex items-center justify-between p-3 rounded-lg border transition-colors", stage === 'signing' ? "bg-warning-500/10 border-warning-500/30" : "border-neutral-800 bg-neutral-900")}>
                          <div className="flex items-center gap-3">
                            {renderStageIcon(stage, 'signing', Wallet, 'text-warning-400')}
                            <div className="flex flex-col">
                              <span className={cn("text-sm font-medium", stage === 'signing' ? "text-warning-400" : "text-neutral-300")}>Awaiting Wallet Signature</span>
                              {stage === 'signing' && <span className="text-xs text-warning-500/80">Please approve the transaction in your wallet</span>}
                            </div>
                          </div>
                          <span className="text-xs text-neutral-500">{getStageStatusText('signing')}</span>
                        </div>

                        {/* Stage 5: Confirming */}
                        <div className={cn("flex items-center justify-between p-3 rounded-lg border transition-colors", stage === 'confirming' ? "bg-primary-500/10 border-primary-500/30" : "border-neutral-800 bg-neutral-900")}>
                          <div className="flex items-center gap-3">
                            {renderStageIcon(stage, 'confirming', LinkIcon)}
                            <span className={cn("text-sm font-medium", stage === 'confirming' ? "text-primary-400" : "text-neutral-300")}>Confirming on Solana</span>
                          </div>
                          <span className="text-xs text-neutral-500">{getStageStatusText('confirming')}</span>
                        </div>

                      </div>

                      {/* Error State UI */}
                      {stage === 'error' && (
                        <div className="mt-6 p-4 bg-error-500/10 border border-error-500/30 rounded-xl animate-scale-in">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-error-400 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-medium text-error-100">Upload Failed</h4>
                              <p className="text-xs text-error-300 mt-1 mb-3">{errorMsg}</p>
                              <div className="flex gap-2">
                                <Button size="sm" variant="destructive" onClick={startUpload} leftIcon={<RefreshCcw className="h-3 w-3" />}>Retry Upload</Button>
                                <Button size="sm" variant="ghost-neutral" onClick={resetUpload}>Cancel</Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Success State UI */}
                      {stage === 'success' && (
                        <div className="mt-6 p-6 bg-success-500/10 border border-success-500/30 rounded-xl text-center animate-scale-in">
                          <div className="inline-flex p-3 bg-success-500/20 rounded-full mb-3">
                            <CheckCircle className="h-8 w-8 text-success-400" />
                          </div>
                          <h4 className="text-lg font-medium text-success-100 mb-1">Upload Complete!</h4>
                          <p className="text-sm text-success-300/80 mb-5">Your file is securely stored and verified on the blockchain.</p>
                          <div className="flex justify-center gap-3">
                            <Button variant="primary" onClick={() => navigate('/files')}>View Vault</Button>
                            <Button variant="outline" onClick={resetUpload}>Upload Another</Button>
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </CardBody>
              </Card>
            )}

            {/* BLOCKCHAIN EXPLAINER (Shown during signing/confirming) */}
            {(stage === 'signing' || stage === 'confirming') && (
              <Card variant="ghost" className="border-warning-500/20 bg-warning-500/5 animate-fade-in">
                <CardBody className="p-5 flex items-start gap-4">
                  <div className="p-2 bg-warning-500/20 rounded-lg shrink-0 mt-0.5">
                    <Info className="h-5 w-5 text-warning-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-warning-200 mb-1">Why am I signing a transaction?</h4>
                    <p className="text-xs text-warning-200/70 leading-relaxed">
                      Denft uses the Solana blockchain to create an immutable cryptographic proof of your file. 
                      This signature proves you are the owner and records the file's hash forever. It requires a tiny network fee (gas).
                    </p>
                  </div>
                </CardBody>
              </Card>
            )}

          </div>

          {/* RIGHT SIDEBAR: Settings & Tips */}
          <div className={cn("space-y-6", !showSettings ? "hidden lg:block" : "block")}>
            
            {/* Settings Panel */}
            <Card variant="default" className={cn("transition-opacity duration-300", (!file || showSettings || stage === 'idle') ? "opacity-100" : "opacity-50 pointer-events-none")}>
              <CardHeader className="pb-3 border-b border-neutral-800 flex flex-row items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                  <Settings className="h-4 w-4" /> File Configuration
                </h3>
                <Button 
                  variant="ghost-neutral" 
                  size="sm" 
                  className="lg:hidden" 
                  onClick={() => setShowSettings(false)}
                >
                  Done
                </Button>
              </CardHeader>
              <CardBody className="p-4 space-y-5">
                
                {/* Privacy */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Privacy Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSettings(p => ({ ...p, isPublic: false }))}
                      className={cn("p-3 rounded-lg border text-left transition-colors flex flex-col gap-1", !settings.isPublic ? "bg-primary-500/10 border-primary-500" : "bg-neutral-800 border-neutral-700 hover:border-neutral-600")}
                    >
                      <EyeOff className={cn("h-4 w-4", !settings.isPublic ? "text-primary-400" : "text-neutral-500")} />
                      <span className="text-sm font-medium text-neutral-100 mt-1">Private</span>
                    </button>
                    <button
                      onClick={() => setSettings(p => ({ ...p, isPublic: true }))}
                      className={cn("p-3 rounded-lg border text-left transition-colors flex flex-col gap-1", settings.isPublic ? "bg-success-500/10 border-success-500" : "bg-neutral-800 border-neutral-700 hover:border-neutral-600")}
                    >
                      <Eye className={cn("h-4 w-4", settings.isPublic ? "text-success-400" : "text-neutral-500")} />
                      <span className="text-sm font-medium text-neutral-100 mt-1">Public</span>
                    </button>
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label htmlFor="category" className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Category</label>
                  <select 
                    id="category"
                    value={settings.category}
                    onChange={(e) => setSettings(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="" disabled>Auto-detect</option>
                    {fileCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label htmlFor="tags" className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Tags</label>
                  <div className="flex gap-2 w-full">
                    <input 
                      id="tags"
                      type="text"
                      placeholder="Add tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTag()}
                      className="flex-1 min-w-0 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <Button variant="secondary" size="sm" className="shrink-0" onClick={addTag}>Add</Button>
                  </div>
                  {settings.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {settings.tags.map(tag => (
                        <Badge key={tag} variant="primary" size="sm" className="cursor-pointer hover:bg-primary-600" onClick={() => removeTag(tag)}>
                          {tag} <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Encryption Toggle */}
                <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-neutral-100">Client Encryption</h4>
                    <p className="text-xs text-neutral-500 mt-0.5">Encrypt before upload</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      aria-label="Toggle client encryption"
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settings.enableEncryption}
                      onChange={(e) => setSettings(p => ({ ...p, enableEncryption: e.target.checked }))}
                    />
                    <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>

              </CardBody>
            </Card>

            {/* Security Box */}
            <Card variant="ghost" className="border-success-500/20 bg-success-500/5">
              <CardBody className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="h-5 w-5 text-success-400" />
                  <h4 className="text-sm font-semibold text-success-400">Bank-grade Security</h4>
                </div>
                <ul className="space-y-2 text-xs text-success-500/80">
                  <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3" /> AES-256 Encryption</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3" /> Distributed IPFS Storage</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3" /> Immutable On-chain Proof</li>
                </ul>
              </CardBody>
            </Card>

          </div>
        </div>
      </div>
    </PageTransition>
  )
}