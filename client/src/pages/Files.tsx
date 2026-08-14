import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  Star,
  Trash2,
  Files as FilesIcon,
} from 'lucide-react'
import { useFiles } from '@/contexts/FileContext'
import { useWallet } from '@/contexts/WalletContext'
import { PageTransition } from '@/components/ui/page-transition'
import { Button } from '@/components/ui/button'
import { Card, CardBody } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { VaultSkeleton } from '@/components/ui/skeleton'
import { FileCard, FileListRow } from '@/components/files/FileCard'
import { FileDetailModal } from '@/components/files/FileDetailModal'
import { ShareModal } from '@/components/files/ShareModal'
import { toast } from 'sonner'
import { cn } from '@/lib/cn'

type ViewMode = 'grid' | 'list'

const SORT_OPTIONS = [
  { key: 'fileName', label: 'Name' },
  { key: 'uploadedAt', label: 'Date Uploaded' },
  { key: 'fileSize', label: 'File Size' },
  { key: 'accessCount', label: 'Views' },
  { key: 'downloadCount', label: 'Downloads' },
]

const CATEGORIES = [
  { key: 'all', label: 'All Files', icon: FileText },
  { key: 'document', label: 'Documents', icon: FileText },
  { key: 'image', label: 'Images', icon: ImageIcon },
  { key: 'video', label: 'Videos', icon: Video },
  { key: 'audio', label: 'Audio', icon: Music },
  { key: 'archive', label: 'Archives', icon: Archive },
]

export function Files() {
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    files,
    totalVaultFiles,
    isLoading,
    error,
    downloadFile,
    deleteFile,
    toggleFavorite,
    bulkOperation,
    fetchFiles,
  } = useFiles()
  const { isAuthReady } = useWallet()

  // State
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('denft-view-mode') as ViewMode) || 'grid'
  })
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'uploadedAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    (searchParams.get('direction') as 'asc' | 'desc') || 'desc'
  )
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)
  const [isInitialising, setIsInitialising] = useState(true)

  // Modals
  const [shareModalFile, setShareModalFile] = useState<any | null>(null)
  const [detailModalFile, setDetailModalFile] = useState<any | null>(null)
  const [deleteModalFile, setDeleteModalFile] = useState<any | null>(null)
  
  const isBulkDeleting = useRef(false)

  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Initialization & Data Loading
  useEffect(() => {
    if (!isAuthReady) return;
    let mounted = true
    const loadData = async () => {
      setIsInitialising(true)
      try {
        const skip = (currentPage - 1) * itemsPerPage
        const cat = selectedCategory === 'all' ? undefined : selectedCategory
        let backendSort = 'date'
        if (sortBy === 'fileName') backendSort = 'name'
        if (sortBy === 'fileSize') backendSort = 'size'
        if (sortBy === 'downloadCount' || sortBy === 'accessCount') backendSort = 'downloads'

        await fetchFiles(skip, itemsPerPage, debouncedSearch, cat, backendSort)
      } finally {
        if (mounted) setIsInitialising(false)
      }
    }
    loadData()
    return () => { mounted = false }
  }, [isAuthReady, fetchFiles, currentPage, itemsPerPage, debouncedSearch, selectedCategory, sortBy])

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, selectedCategory, sortBy, sortDirection])

  // Persist view mode
  useEffect(() => {
    localStorage.setItem('denft-view-mode', viewMode)
  }, [viewMode])

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (selectedCategory !== 'all') params.set('category', selectedCategory)
    if (sortBy !== 'uploadedAt') params.set('sort', sortBy)
    if (sortDirection !== 'desc') params.set('direction', sortDirection)
    setSearchParams(params, { replace: true })
  }, [searchQuery, selectedCategory, sortBy, sortDirection, setSearchParams])

  const totalPages = Math.max(1, Math.ceil(totalVaultFiles / itemsPerPage))
  const paginatedFiles = files

  // Actions
  const toggleFileSelection = (id: string) => {
    setSelectedFiles(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllFiles = () => {
    if (selectedFiles.size === paginatedFiles.length && paginatedFiles.length > 0) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(paginatedFiles.map(f => f.fileId)))
    }
  }

  const handleBulkOperation = async (operation: 'favorite' | 'delete') => {
    if (selectedFiles.size === 0) return
    const count = selectedFiles.size
    try {
      if (operation === 'delete') {
        isBulkDeleting.current = true
        // Quick mock bulk delete logic for demo
        for (const id of Array.from(selectedFiles)) {
          await deleteFile(id)
        }
        isBulkDeleting.current = false
      } else {
        await bulkOperation(Array.from(selectedFiles), operation)
      }
      setSelectedFiles(new Set())
      toast.success(`Bulk ${operation} completed for ${count} files.`)
    } catch (error: any) {
      toast.error(`Bulk ${operation} failed: ${error.message}`)
    }
  }

  const handleFileAction = async (action: 'view' | 'download' | 'favorite' | 'share' | 'delete' | 'copy', file: any) => {
    try {
      switch (action) {
        case 'view':
          setDetailModalFile(file)
          break
        case 'download':
          await downloadFile(file.fileId)
          toast.success('Download started')
          break
        case 'favorite':
          await toggleFavorite(file.fileId)
          toast.success(file.isFavorite ? 'Removed from favorites' : 'Added to favorites')
          break
        case 'share':
          setShareModalFile(file)
          break
        case 'delete':
          setDeleteModalFile(file)
          break
        case 'copy':
          await navigator.clipboard.writeText(file.ipfsHash)
          toast.success('IPFS hash copied to clipboard')
          break
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} file`)
    }
  }

  const confirmDelete = async () => {
    if (!deleteModalFile) return
    try {
      await deleteFile(deleteModalFile.fileId)
      toast.success('File deleted successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete file')
    } finally {
      setDeleteModalFile(null)
    }
  }

  // Render Loading State
  if (isInitialising || (isLoading && files.length === 0)) {
    return (
      <PageTransition>
        <VaultSkeleton />
      </PageTransition>
    )
  }

  // Render Error State
  if (error && files.length === 0) {
    return (
      <PageTransition>
        <div className="pt-10">
          <EmptyState 
            icon={<FilesIcon className="h-12 w-12" />}
            title="Failed to load files"
            description={error}
            action={{
              label: "Try Again",
              onClick: () => fetchFiles(true)
            }}
          />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        
        {/* ── HEADER ────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-50 mb-1">
              My Vault
            </h1>
            <p className="text-sm text-neutral-400">
              {files.length} of {totalVaultFiles} files
              {selectedFiles.size > 0 && <span className="ml-2 text-primary-400 font-medium">• {selectedFiles.size} selected</span>}
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {selectedFiles.size > 0 && (
              <div className="flex items-center gap-2 mr-2">
                <Button size="sm" variant="outline" leftIcon={<Star className="h-4 w-4" />} onClick={() => handleBulkOperation('favorite')}>
                  Favorite
                </Button>
                <Button size="sm" variant="destructive" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => handleBulkOperation('delete')}>
                  Delete
                </Button>
              </div>
            )}

            <Button size="sm" variant={showFilters ? 'primary' : 'outline'} leftIcon={<Filter className="h-4 w-4" />} onClick={() => setShowFilters(!showFilters)}>
              Filters
            </Button>

            <div className="flex bg-neutral-800 rounded-lg p-1 shrink-0">
              <button
                type="button"
                className={cn('p-1.5 rounded-md transition-colors', viewMode === 'grid' ? 'bg-neutral-700 text-neutral-100 shadow-sm' : 'text-neutral-400 hover:text-neutral-200')}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={cn('p-1.5 rounded-md transition-colors', viewMode === 'list' ? 'bg-neutral-700 text-neutral-100 shadow-sm' : 'text-neutral-400 hover:text-neutral-200')}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── FILTERS ───────────────────────────────────────────── */}
        {showFilters && (
          <Card variant="ghost" className="animate-fade-in border-neutral-700">
            <CardBody className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input 
                  aria-label="Search files"
                  type="text" 
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg py-2 pl-9 pr-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                />
              </div>

              <select 
                aria-label="Select category"
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg py-2 px-3 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
              >
                {CATEGORIES.map(cat => <option key={cat.key} value={cat.key}>{cat.label}</option>)}
              </select>

              <select 
                aria-label="Sort by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg py-2 px-3 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
              >
                {SORT_OPTIONS.map(opt => <option key={opt.key} value={opt.key}>Sort by: {opt.label}</option>)}
              </select>

              <div className="flex gap-2">
                <Button variant={sortDirection === 'desc' ? 'primary' : 'outline'} size="sm" className="flex-1" onClick={() => setSortDirection('desc')} leftIcon={<SortDesc className="h-4 w-4" />}>Desc</Button>
                <Button variant={sortDirection === 'asc' ? 'primary' : 'outline'} size="sm" className="flex-1" onClick={() => setSortDirection('asc')} leftIcon={<SortAsc className="h-4 w-4" />}>Asc</Button>
              </div>

            </CardBody>
          </Card>
        )}

        {/* ── FILES CONTENT ─────────────────────────────────────── */}
        {files.length === 0 ? (
          <div className="pt-10">
            <EmptyState 
              icon={<FilesIcon className="h-12 w-12" />}
              title={files.length === 0 ? "Your vault is empty" : "No files match your filters"}
              description={files.length === 0 ? "Upload your first file to get started." : "Try adjusting your search query or category."}
              action={{
                label: files.length === 0 ? "Upload File" : "Clear Filters",
                onClick: () => {
                  if (files.length === 0) window.location.href = '/upload'
                  else { setSearchQuery(''); setSelectedCategory('all'); }
                }
              }}
            />
          </div>
        ) : (
          <>
            {/* Bulk Actions Header */}
            {paginatedFiles.length > 0 && (
              <div className="flex items-center gap-3 px-1 mb-2">
                <div 
                  onClick={selectAllFiles}
                  className="relative flex items-center justify-center w-5 h-5 cursor-pointer"
                >
                  <input
                    aria-label="Select all files"
                    type="checkbox"
                    checked={selectedFiles.size === paginatedFiles.length && paginatedFiles.length > 0}
                    onChange={() => {}}
                    className="peer sr-only"
                  />
                  <div className={`w-5 h-5 rounded border ${selectedFiles.size === paginatedFiles.length ? 'bg-primary-500 border-primary-500' : selectedFiles.size > 0 ? 'bg-primary-500/50 border-primary-500/50' : 'bg-transparent border-neutral-600'} transition-colors flex items-center justify-center`}>
                    {selectedFiles.size === paginatedFiles.length && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    )}
                    {(selectedFiles.size > 0 && selectedFiles.size < paginatedFiles.length) && (
                      <div className="w-2.5 h-0.5 bg-white rounded-full" />
                    )}
                  </div>
                </div>
                <span className="text-sm text-neutral-400 cursor-pointer select-none" onClick={selectAllFiles}>
                  Select all
                </span>
              </div>
            )}

            {/* Grid / List */}
            <div className={cn(
              viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'flex flex-col gap-3'
            )}>
              {paginatedFiles.map(file => (
                viewMode === 'grid' ? (
                  <FileCard 
                    key={file.fileId} 
                    file={file as any} 
                    isSelected={selectedFiles.has(file.fileId)} 
                    onToggleSelect={toggleFileSelection}
                    onAction={handleFileAction}
                  />
                ) : (
                  <FileListRow 
                    key={file.fileId} 
                    file={file as any} 
                    isSelected={selectedFiles.has(file.fileId)} 
                    onToggleSelect={toggleFileSelection}
                    onAction={handleFileAction}
                  />
                )
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <div className="flex items-center px-4 text-sm text-neutral-400 font-medium">
                  {currentPage} / {totalPages}
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

      </div>

      {/* ── MODALS ────────────────────────────────────────────── */}
      
      {/* Delete Confirmation Modal */}
      {deleteModalFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
            <h3 className="text-lg font-semibold text-neutral-50 mb-2">Delete File?</h3>
            <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
              Are you sure you want to delete <span className="text-neutral-200 font-medium">{deleteModalFile.fileName}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteModalFile(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={confirmDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal 
        isOpen={!!shareModalFile}
        onClose={() => setShareModalFile(null)}
        file={shareModalFile}
      />

      {/* File Detail Modal */}
      <FileDetailModal 
        isOpen={!!detailModalFile}
        onClose={() => setDetailModalFile(null)}
        file={detailModalFile}
        onDownload={async (id) => {
          await downloadFile(id)
          toast.success('Download started')
        }}
        onShare={(f) => {
          setDetailModalFile(null)
          setShareModalFile(f)
        }}
      />

    </PageTransition>
  )
}