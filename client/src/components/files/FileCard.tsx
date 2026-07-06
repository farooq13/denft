// src/components/files/FileCard.tsx
// Sprint 3 — File Card and List Row components for the File Vault.
// Includes Checkbox integration, Dropdown actions, and visual polish.

import React from 'react'
import {
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  Download,
  Share2,
  Eye,
  Star,
  MoreVertical,
  Trash2,
  Copy,
  Globe,
  Lock,
} from 'lucide-react'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatFileSize } from '@/lib/utils'

// Types
interface FileData {
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
}

interface FileCardProps {
  file: FileData
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onAction: (action: 'download' | 'favorite' | 'share' | 'delete' | 'copy', file: FileData) => void
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

// Custom Checkbox
const CardCheckbox = ({ checked, onChange, onClick }: { checked: boolean; onChange: () => void; onClick?: (e: React.MouseEvent) => void }) => (
  <div 
    onClick={onClick}
    className="relative flex items-center justify-center w-5 h-5 cursor-pointer"
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="peer sr-only"
      aria-label="Select file"
    />
    <div className={`w-5 h-5 rounded border ${checked ? 'bg-primary-500 border-primary-500' : 'bg-transparent border-neutral-600'} transition-colors flex items-center justify-center`}>
      {checked && (
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  </div>
)

// ── GRID VIEW CARD ──────────────────────────────────────────────

export function FileCard({ file, isSelected, onToggleSelect, onAction }: FileCardProps) {
  const FileIcon = getFileIcon(file.category)
  
  // Custom dropdown implementation (since we removed NextUI Dropdown)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  return (
    <Card 
      variant={isSelected ? 'accent' : 'interactive'} 
      className={`relative overflow-visible ${isSelected ? 'ring-2 ring-primary-500 border-primary-500/50' : ''}`}
      onClick={() => onToggleSelect(file.fileId)}
    >
      <CardBody className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <CardCheckbox 
            checked={isSelected} 
            onChange={() => {}} 
            onClick={(e) => { e.stopPropagation(); onToggleSelect(file.fileId) }} 
          />
          <div className="flex items-center gap-2">
            {file.isFavorite && <Star className="h-4 w-4 text-warning-400 fill-warning-400" aria-label="Favorite" />}
            {file.isPublic ? (
              <Globe className="h-4 w-4 text-success-400" aria-label="Public" />
            ) : (
              <Lock className="h-4 w-4 text-neutral-500" aria-label="Private" />
            )}
          </div>
        </div>

        {/* Icon & Title */}
        <div className="text-center mb-5">
          <div className="inline-flex p-4 rounded-2xl bg-neutral-800 mb-3 text-neutral-400">
            <FileIcon className="h-10 w-10" strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-medium text-neutral-100 truncate w-full px-2" title={file.fileName}>
            {file.fileName || `File ${file.fileId.slice(0, 8)}`}
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            {formatFileSize(Number(file.fileSize))}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-neutral-500 mb-5 pb-5 border-b border-neutral-800">
          <div className="flex gap-3">
            <span className="flex items-center gap-1" title="Views"><Eye className="h-3.5 w-3.5" /> {file.accessCount}</span>
            <span className="flex items-center gap-1" title="Downloads"><Download className="h-3.5 w-3.5" /> {file.downloadCount}</span>
          </div>
          <span>{new Date(file.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="ghost-primary" 
            className="flex-1"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={(e) => { e.stopPropagation(); onAction('download', file) }}
          >
            Download
          </Button>

          {/* Simple Dropdown Menu */}
          <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <Button 
              size="sm" 
              variant="ghost-neutral" 
              className="px-2"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-label="More options"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
            
            {menuOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-48 rounded-xl border border-neutral-700 bg-neutral-900 shadow-xl py-1 z-50 animate-fade-in origin-bottom-right">
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
                  onClick={() => { setMenuOpen(false); onAction('favorite', file) }}
                >
                  <Star className="h-4 w-4" /> {file.isFavorite ? 'Unfavorite' : 'Favorite'}
                </button>
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
                  onClick={() => { setMenuOpen(false); onAction('share', file) }}
                >
                  <Share2 className="h-4 w-4" /> Share
                </button>
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
                  onClick={() => { setMenuOpen(false); onAction('copy', file) }}
                >
                  <Copy className="h-4 w-4" /> Copy Hash
                </button>
                <div className="h-px bg-neutral-800 my-1 mx-2" />
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-error-400 hover:bg-error-500/10 transition-colors"
                  onClick={() => { setMenuOpen(false); onAction('delete', file) }}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

// ── LIST VIEW ROW ───────────────────────────────────────────────

export function FileListRow({ file, isSelected, onToggleSelect, onAction }: FileCardProps) {
  const FileIcon = getFileIcon(file.category)
  
  const [menuOpen, setMenuOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  return (
    <div 
      className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
        isSelected 
          ? 'bg-primary-500/10 border-primary-500/50' 
          : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800'
      }`}
      onClick={() => onToggleSelect(file.fileId)}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <CardCheckbox 
          checked={isSelected} 
          onChange={() => {}} 
          onClick={(e) => { e.stopPropagation(); onToggleSelect(file.fileId) }} 
        />
        
        <div className="p-2.5 bg-neutral-800 rounded-lg text-neutral-400 shrink-0">
          <FileIcon className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-neutral-100 truncate max-w-[200px] sm:max-w-xs" title={file.fileName}>
              {file.fileName || `File ${file.fileId.slice(0, 8)}`}
            </h3>
            {file.isFavorite && <Star className="h-3 w-3 text-warning-400 fill-warning-400 shrink-0" />}
            {file.isPublic ? <Globe className="h-3 w-3 text-success-400 shrink-0" /> : <Lock className="h-3 w-3 text-neutral-500 shrink-0" />}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
            <span>{formatFileSize(Number(file.fileSize))}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">{new Date(file.uploadedAt).toLocaleDateString()}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:flex items-center gap-1" title="Views"><Eye className="h-3 w-3" /> {file.accessCount}</span>
            <span className="hidden sm:flex items-center gap-1" title="Downloads"><Download className="h-3 w-3" /> {file.downloadCount}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-4">
        <Button 
          size="sm" 
          variant="ghost-neutral" 
          className="hidden sm:flex"
          leftIcon={<Download className="h-4 w-4" />}
          onClick={(e) => { e.stopPropagation(); onAction('download', file) }}
        >
          Download
        </Button>
        <Button 
          size="sm" 
          variant="ghost-neutral" 
          className="px-2 sm:hidden"
          onClick={(e) => { e.stopPropagation(); onAction('download', file) }}
          aria-label="Download"
        >
          <Download className="h-4 w-4" />
        </Button>

        <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <Button 
            size="sm" 
            variant="ghost-neutral" 
            className="px-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
          
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-neutral-700 bg-neutral-900 shadow-xl py-1 z-50 animate-fade-in origin-top-right">
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
                onClick={() => { setMenuOpen(false); onAction('favorite', file) }}
              >
                <Star className="h-4 w-4" /> {file.isFavorite ? 'Unfavorite' : 'Favorite'}
              </button>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
                onClick={() => { setMenuOpen(false); onAction('share', file) }}
              >
                <Share2 className="h-4 w-4" /> Share
              </button>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
                onClick={() => { setMenuOpen(false); onAction('copy', file) }}
              >
                <Copy className="h-4 w-4" /> Copy Hash
              </button>
              <div className="h-px bg-neutral-800 my-1 mx-2" />
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-error-400 hover:bg-error-500/10 transition-colors"
                onClick={() => { setMenuOpen(false); onAction('delete', file) }}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
