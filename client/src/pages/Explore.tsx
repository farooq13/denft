import { useState, useEffect, useMemo } from 'react'
import { PageTransition } from '@/components/ui/page-transition'
import { FileCard } from '@/components/files/FileCard'
import { SkeletonFileCard } from '@/components/ui/skeleton'
import { Search, ArrowDownAZ, Ghost } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFiles } from '@/contexts/FileContext'
import { FileDetailModal } from '@/components/files/FileDetailModal'

export function Explore() {
  const { publicFiles, fetchPublicFiles } = useFiles()
  const [isInitialising, setIsInitialising] = useState(true)
  
  // Search and Sort
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size' | 'downloads'>('date')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Modal State
  const [selectedFile, setSelectedFile] = useState<any | null>(null)

  useEffect(() => {
    let mounted = true
    const loadFiles = async () => {
      try {
        await fetchPublicFiles()
      } finally {
        if (mounted) setIsInitialising(false)
      }
    }
    loadFiles()
    return () => { mounted = false }
  }, [fetchPublicFiles])

  // Reset pagination on search
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, sortBy])

  const filteredAndSortedFiles = useMemo(() => {
    let result = [...publicFiles]

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(f => 
        f.fileName?.toLowerCase().includes(q) || 
        f.category?.toLowerCase().includes(q)
      )
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.fileName || '').localeCompare(b.fileName || '')
        case 'size':
          return (Number(b.fileSize) || 0) - (Number(a.fileSize) || 0)
        case 'downloads':
          return (Number(b.downloadCount) || 0) - (Number(a.downloadCount) || 0)
        case 'date':
        default:
          return new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime()
      }
    })

    return result
  }, [publicFiles, searchQuery, sortBy])

  const totalPages = Math.ceil(filteredAndSortedFiles.length / itemsPerPage)
  const currentFiles = filteredAndSortedFiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleAction = (action: string, file: any) => {
    if (action === 'view') {
      setSelectedFile(file)
    } else if (action === 'download') {
      // In a real app, this would trigger a download using the file's IPFS hash
      window.open(`https://ipfs.io/ipfs/${file.ipfsHash}`, '_blank')
    }
  }

  return (
    <PageTransition>
      <div className="space-y-8 animate-fade-in pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-800">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-neutral-50 tracking-tight">Public Explore</h1>
            <p className="text-neutral-400">Discover and download publicly shared files on Denft.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                aria-label="Search files"
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-shadow"
              />
            </div>
            
            {/* Sort Dropdown */}
            <div className="relative group">
              <Button variant="outline" leftIcon={<ArrowDownAZ className="h-4 w-4" />}>
                Sort
              </Button>
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-neutral-700 bg-neutral-900 shadow-xl py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <button 
                  onClick={() => setSortBy('date')}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-800 transition-colors ${sortBy === 'date' ? 'text-primary-400' : 'text-neutral-300'}`}
                >
                  Newest First
                </button>
                <button 
                  onClick={() => setSortBy('name')}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-800 transition-colors ${sortBy === 'name' ? 'text-primary-400' : 'text-neutral-300'}`}
                >
                  Name (A-Z)
                </button>
                <button 
                  onClick={() => setSortBy('size')}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-800 transition-colors ${sortBy === 'size' ? 'text-primary-400' : 'text-neutral-300'}`}
                >
                  Largest Size
                </button>
                <button 
                  onClick={() => setSortBy('downloads')}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-800 transition-colors ${sortBy === 'downloads' ? 'text-primary-400' : 'text-neutral-300'}`}
                >
                  Most Downloaded
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {isInitialising ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonFileCard key={i} />
            ))}
          </div>
        ) : filteredAndSortedFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="inline-flex p-6 rounded-full bg-neutral-900/50 mb-6">
              <Ghost className="h-12 w-12 text-neutral-600" />
            </div>
            <h3 className="text-xl font-bold text-neutral-200 mb-2">No public files found</h3>
            <p className="text-neutral-400 max-w-sm mb-8">
              {searchQuery ? "Try adjusting your search criteria." : "There are currently no public files available."}
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentFiles.map((file) => (
                <FileCard 
                  key={file.fileId} 
                  file={file} 
                  isSelected={false} 
                  onToggleSelect={() => {}} 
                  onAction={handleAction} 
                  readOnly 
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-8">
                <Button 
                  variant="outline" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  Previous
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === i + 1
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* Modals */}
        {selectedFile && (
          <FileDetailModal
            file={selectedFile}
            isOpen={true}
            onClose={() => setSelectedFile(null)}
            onDownload={() => handleAction('download', selectedFile)}
            onShare={() => {}}
            readOnly
          />
        )}
      </div>
    </PageTransition>
  )
}
