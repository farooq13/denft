import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { useWallet } from './WalletContext';
import { useToaster } from './ToasterContext';

// Enhanced file interface with more metadata
interface FileInfo {
  fileId: string;
  fileName: string;
  fileHash: string;
  ipfsHash: string;
  fileSize: string;
  contentType: string;
  description: string;
  tags: string[];
  uploadedAt: string;
  accessCount: string;
  downloadCount: string;
  lastAccessed: string;
  isActive: boolean;
  isPublic: boolean;
  isFavorite: boolean;
  verificationId: string;
  thumbnail?: string;
  category: 'document' | 'image' | 'video' | 'audio' | 'other';
  sharingSettings: {
    isShared: boolean;
    sharedWith: string[];
    permissions: {
      read: boolean;
      download: boolean;
      share: boolean;
    };
    expiresAt?: string;
    maxDownloads?: number;
    currentDownloads: number;
  };
}

// Enhanced upload result with more details
interface UploadResult {
  success: boolean;
  fileId: string;
  transactionSignature: string;
  ipfsHash: string;
  fileSize: number;
  contentType: string;
  uploadedAt: number;
  verificationId: string;
  thumbnail?: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
}


interface VerificationResult {
  isAuthentic: boolean;
  confidence: number;
  fileHash: string;
  originalFileSize: string;
  originalUploadDate: string;
  verificationDate: string;
  verificationId: string;
  blockchainProof: {
    owner: string;
    ipfsHash: string;
    contentType: string;
    transactionSignature: string;
    blockHeight: number;
  };
  integrityChecks: {
    hashMatch: boolean;
    sizeMatch: boolean;
    timestampValid: boolean;
  };
}

// File sharing permissions
interface SharingPermissions {
  read: boolean;
  download: boolean;
  share: boolean;
  comment?: boolean;
  edit?: boolean;
}

// File filter and sorting options
interface FileFilters {
  category?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  sizeRange?: {
    min: number;
    max: number;
  };
  isPublic?: boolean;
  isFavorite?: boolean;
  hasAccess?: boolean;
}

interface FileSortOptions {
  field: 'name' | 'size' | 'uploadedAt' | 'lastAccessed' | 'downloadCount';
  direction: 'asc' | 'desc';
}

// Enhanced context interface
interface FileContextType {
  files: FileInfo[];
  sharedFiles: FileInfo[];
  publicFiles: FileInfo[];
  favoriteFiles: FileInfo[];
  recentFiles: FileInfo[];
  isLoading: boolean;
  uploadProgress: number;
  error: string | null;
  filters: FileFilters;
  sortOptions: FileSortOptions;
  totalStorage: number;
  usedStorage: number;
  
  // File operations
  uploadFile: (file: File, metadata?: {
    description?: string;
    tags?: string[];
    isPublic?: boolean;
    category?: string;
  }) => Promise<UploadResult>;
  uploadMultipleFiles: (files: File[], metadata?: any) => Promise<UploadResult[]>;
  fetchFiles: (forceRefresh?: boolean) => Promise<void>;
  fetchSharedFiles: () => Promise<void>;
  fetchPublicFiles: () => Promise<void>;
  verifyFile: (file: File, ownerAddress?: string) => Promise<VerificationResult>;
  shareFile: (fileId: string, accessorWallet: string, permissions: SharingPermissions, options?: {
    expiresAt?: string;
    maxDownloads?: number;
    allowResharing?: boolean;
  }) => Promise<void>;
  downloadFile: (fileId: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  toggleFavorite: (fileId: string) => Promise<void>;
  updateFileMetadata: (fileId: string, metadata: Partial<FileInfo>) => Promise<void>;
  
  // File management
  bulkOperation: (fileIds: string[], operation: 'delete' | 'favorite' | 'unfavorite' | 'share') => Promise<void>;
  searchFiles: (query: string) => Promise<FileInfo[]>;
  filterFiles: (filters: FileFilters) => void;
  sortFiles: (sortOptions: FileSortOptions) => void;
  clearError: () => void;
  resetFilters: () => void;
  
  // Storage analytics
  getStorageAnalytics: () => Promise<any>;
  getFileAnalytics: (fileId: string) => Promise<any>;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

interface FileProviderProps {
  children: ReactNode;
}

// File category detection utility
const detectFileCategory = (contentType: string): FileInfo['category'] => {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';
  if (contentType.startsWith('audio/')) return 'audio';
  if (contentType.includes('pdf') || contentType.includes('document') || contentType.includes('text')) {
    return 'document';
  }
  return 'other';
};

export const FileProvider: React.FC<FileProviderProps> = ({ children }) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [sharedFiles, setSharedFiles] = useState<FileInfo[]>([]);
  const [publicFiles, setPublicFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [totalStorage, setTotalStorage] = useState(0);
  const [usedStorage, setUsedStorage] = useState(0);
  const [filters, setFilters] = useState<FileFilters>({});
  const [sortOptions, setSortOptions] = useState<FileSortOptions>({
    field: 'uploadedAt',
    direction: 'desc'
  });

  const { token, walletAddress, isConnected } = useWallet();
  const { showToast } = useToaster();

  // Enhanced authenticated request helper
  const makeAuthenticatedRequest = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!token || !walletAddress) {
      throw new Error('Authentication required. Please connect your wallet.');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'X-Wallet-Address': walletAddress,
        ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status: ${response.status}`);
    }

    return response;
  }, [token, walletAddress]);

  // Enhanced file upload with progress tracking
  const uploadFile = useCallback(async (
    file: File,
    metadata: {
      description?: string;
      tags?: string[];
      isPublic?: boolean;
      category?: string;
    } = {}
  ): Promise<UploadResult> => {
    setIsLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', metadata.description || '');
      formData.append('tags', JSON.stringify(metadata.tags || []));
      formData.append('isPublic', (metadata.isPublic || false).toString());
      formData.append('category', metadata.category || detectFileCategory(file.type));

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise<UploadResult>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result);
            } catch (error) {
              reject(new Error('Invalid response format'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || 'Upload failed'));
            } catch (error) {
              reject(new Error(`Upload failed with status: ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.open('POST', '/api/files/upload');
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('X-Wallet-Address', walletAddress!);
        xhr.send(formData);
      });

      const result = await uploadPromise;
      
      showToast(`${file.name} uploaded successfully!`, 'success');
      
      // Refresh files list
      await fetchFiles(true);
      
      return result;

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to upload file';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw error;
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  }, [token, walletAddress, showToast]);

  // Upload multiple files with batch processing
  const uploadMultipleFiles = useCallback(async (
    files: File[],
    metadata: any = {}
  ): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];
    setIsLoading(true);
    
    try {
      showToast(`Uploading ${files.length} files...`, 'info');
      
      // Process files in batches of 3 for optimal performance
      const batchSize = 3;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        
        const batchPromises = batch.map(file => 
          uploadFile(file, {
            ...metadata,
            description: metadata.description || `Batch upload: ${file.name}`
          })
        );
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            console.error(`Failed to upload ${batch[index].name}:`, result.reason);
            showToast(`Failed to upload ${batch[index].name}`, 'error');
          }
        });
      }
      
      showToast(`Successfully uploaded ${results.length} of ${files.length} files`, 'success');
      return results;
      
    } catch (error: any) {
      const errorMessage = error.message || 'Batch upload failed';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [uploadFile, showToast]);

  // Enhanced fetch files with caching and filtering
  const fetchFiles = useCallback(async (forceRefresh: boolean = false): Promise<void> => {
    // Check cache first if not forcing refresh
    if (!forceRefresh && files.length > 0) {
      const lastFetch = localStorage.getItem('denft-last-fetch');
      if (lastFetch && Date.now() - parseInt(lastFetch) < 30000) { // 30 second cache
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await makeAuthenticatedRequest('/api/files/my-files');
      const data = await response.json();
      
      const filesData = (data.files || []).map((file: any) => ({
        ...file,
        category: detectFileCategory(file.contentType),
        isFavorite: file.isFavorite || false,
        tags: file.tags || [],
        sharingSettings: file.sharingSettings || {
          isShared: false,
          sharedWith: [],
          permissions: { read: true, download: false, share: false },
          currentDownloads: 0,
        }
      }));
      
      setFiles(filesData);
      setUsedStorage(data.usedStorage || 0);
      setTotalStorage(data.totalStorage || 1073741824); // 1GB default
      
      // Cache timestamp
      localStorage.setItem('denft-last-fetch', Date.now().toString());

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch files';
      setError(errorMessage);
      console.error('Failed to fetch files:', error);
    } finally {
      setIsLoading(false);
    }
  }, [makeAuthenticatedRequest, files.length]);

  // Fetch shared files
  const fetchSharedFiles = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await makeAuthenticatedRequest('/api/files/shared-with-me');
      const data = await response.json();
      
      setSharedFiles(data.files || []);

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch shared files';
      setError(errorMessage);
      console.error('Failed to fetch shared files:', error);
    } finally {
      setIsLoading(false);
    }
  }, [makeAuthenticatedRequest]);

  // Fetch public files
  const fetchPublicFiles = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/files/public');
      const data = await response.json();
      
      setPublicFiles(data.files || []);

    } catch (error: any) {
      console.error('Failed to fetch public files:', error);
    }
  }, []);

  // Enhanced file verification with detailed analysis
  const verifyFile = useCallback(async (
    file: File,
    ownerAddress?: string
  ): Promise<VerificationResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (ownerAddress) {
        formData.append('ownerAddress', ownerAddress);
      }

      const response = await fetch('/api/verify/file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Verification failed');
      }

      const data = await response.json();
      const verification = data.verification;
      
      // Enhanced toast with confidence level
      const confidenceText = verification.confidence > 0.9 ? 'High confidence' : 
                           verification.confidence > 0.7 ? 'Medium confidence' : 'Low confidence';
      
      showToast(
        verification.isAuthentic 
          ? `File is authentic! (${confidenceText})`
          : `File authenticity could not be verified (${confidenceText})`,
        verification.isAuthentic ? 'success' : 'warning'
      );
      
      return verification;

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to verify file';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Enhanced file sharing with advanced permissions
  const shareFile = useCallback(async (
    fileId: string,
    accessorWallet: string,
    permissions: SharingPermissions,
    options: {
      expiresAt?: string;
      maxDownloads?: number;
      allowResharing?: boolean;
      message?: string;
    } = {}
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await makeAuthenticatedRequest(`/api/files/${fileId}/share`, {
        method: 'POST',
        body: JSON.stringify({
          accessorWallet,
          permissions,
          ...options,
        }),
      });

      const data = await response.json();
      
      showToast('File shared successfully!', 'success');
      
      // Refresh files to update sharing status
      await fetchFiles(true);

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to share file';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [makeAuthenticatedRequest, showToast, fetchFiles]);

  // Enhanced download with progress tracking
  const downloadFile = useCallback(async (fileId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/files/${fileId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Wallet-Address': walletAddress!,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }

      // Get file metadata from headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const contentType = response.headers.get('Content-Type');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `file-${fileId}`;

      // Create blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast(`${filename} downloaded successfully!`, 'success');
      
      // Refresh files to update download count
      await fetchFiles(true);

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to download file';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [token, walletAddress, showToast, fetchFiles]);

  // Enhanced delete with confirmation
  const deleteFile = useCallback(async (fileId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await makeAuthenticatedRequest(`/api/files/${fileId}`, {
        method: 'DELETE',
      });

      showToast('File deleted successfully!', 'success');
      
      // Update local state immediately for better UX
      setFiles(prev => prev.filter(f => f.fileId !== fileId));
      
      // Refresh files list
      await fetchFiles(true);

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete file';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [makeAuthenticatedRequest, showToast, fetchFiles]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (fileId: string): Promise<void> => {
    try {
      const response = await makeAuthenticatedRequest(`/api/files/${fileId}/favorite`, {
        method: 'POST',
      });

      const data = await response.json();
      
      // Update local state
      setFiles(prev => prev.map(f => 
        f.fileId === fileId ? { ...f, isFavorite: data.isFavorite } : f
      ));
      
      showToast(
        data.isFavorite ? 'Added to favorites' : 'Removed from favorites', 
        'success'
      );

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update favorite status';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  }, [makeAuthenticatedRequest, showToast]);

  // Update file metadata
  const updateFileMetadata = useCallback(async (
    fileId: string, 
    metadata: Partial<FileInfo>
  ): Promise<void> => {
    try {
      const response = await makeAuthenticatedRequest(`/api/files/${fileId}/metadata`, {
        method: 'PATCH',
        body: JSON.stringify(metadata),
      });

      showToast('File metadata updated successfully!', 'success');
      
      // Update local state
      setFiles(prev => prev.map(f => 
        f.fileId === fileId ? { ...f, ...metadata } : f
      ));

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update metadata';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw error;
    }
  }, [makeAuthenticatedRequest, showToast]);

  // Bulk operations for multiple files
  const bulkOperation = useCallback(async (
    fileIds: string[], 
    operation: 'delete' | 'favorite' | 'unfavorite' | 'share'
  ): Promise<void> => {
    setIsLoading(true);
    
    try {
      const response = await makeAuthenticatedRequest('/api/files/bulk', {
        method: 'POST',
        body: JSON.stringify({ fileIds, operation }),
      });

      showToast(`Bulk ${operation} completed successfully!`, 'success');
      await fetchFiles(true);

    } catch (error: any) {
      const errorMessage = error.message || `Bulk ${operation} failed`;
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [makeAuthenticatedRequest, showToast, fetchFiles]);

  // Search files
  const searchFiles = useCallback(async (query: string): Promise<FileInfo[]> => {
    try {
      const response = await makeAuthenticatedRequest(`/api/files/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      return data.files || [];

    } catch (error: any) {
      console.error('Search failed:', error);
      return [];
    }
  }, [makeAuthenticatedRequest]);

  // Filter files locally
  const filterFiles = useCallback((newFilters: FileFilters) => {
    setFilters(newFilters);
  }, []);

  // Sort files locally
  const sortFiles = useCallback((newSortOptions: FileSortOptions) => {
    setSortOptions(newSortOptions);
  }, []);

  // Get storage analytics
  const getStorageAnalytics = useCallback(async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/analytics/storage');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch storage analytics:', error);
      return null;
    }
  }, [makeAuthenticatedRequest]);

  // Get file analytics
  const getFileAnalytics = useCallback(async (fileId: string) => {
    try {
      const response = await makeAuthenticatedRequest(`/api/analytics/file/${fileId}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch file analytics:', error);
      return null;
    }
  }, [makeAuthenticatedRequest]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
    setSortOptions({ field: 'uploadedAt', direction: 'desc' });
  }, []);

  // Computed values for filtered and sorted files
  const filteredAndSortedFiles = React.useMemo(() => {
    let filtered = [...files];
    
    // Apply filters
    if (filters.category) {
      filtered = filtered.filter(f => f.category === filters.category);
    }
    if (filters.isPublic !== undefined) {
      filtered = filtered.filter(f => f.isPublic === filters.isPublic);
    }
    if (filters.isFavorite) {
      filtered = filtered.filter(f => f.isFavorite);
    }
    if (filters.dateRange) {
      filtered = filtered.filter(f => {
        const uploadDate = new Date(f.uploadedAt);
        const start = new Date(filters.dateRange!.start);
        const end = new Date(filters.dateRange!.end);
        return uploadDate >= start && uploadDate <= end;
      });
    }
    
    // Apply sorting
    // filtered.sort((a, b) => {
    //   const aValue = a[sortOptions.field];
    //   const bValue = b[sortOptions.field];
      
      
    //   let comparison = 0;
    //   if (aValue < bValue) comparison = -1;
    //   if (aValue > bValue) comparison = 1;
      
    //   return sortOptions.direction === 'desc' ? -comparison : comparison;
    // });
    
    return filtered;
  }, [files, filters, sortOptions]);

  // Computed values for different file categories
  const favoriteFiles = React.useMemo(() => 
    files.filter(f => f.isFavorite), [files]
  );

  const recentFiles = React.useMemo(() => 
    files
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, 10), [files]
  );

  // Auto-fetch files when wallet connects
  useEffect(() => {
    if (isConnected && token) {
      fetchFiles();
      fetchSharedFiles();
      fetchPublicFiles();
    }
  }, [isConnected, token, fetchFiles, fetchSharedFiles, fetchPublicFiles]);

  // Context value with all enhanced features
  const value: FileContextType = {
    files: filteredAndSortedFiles,
    sharedFiles,
    publicFiles,
    favoriteFiles,
    recentFiles,
    isLoading,
    uploadProgress,
    error,
    filters,
    sortOptions,
    totalStorage,
    usedStorage,
    uploadFile,
    uploadMultipleFiles,
    fetchFiles,
    fetchSharedFiles,
    fetchPublicFiles,
    verifyFile,
    shareFile,
    downloadFile,
    deleteFile,
    toggleFavorite,
    updateFileMetadata,
    bulkOperation,
    searchFiles,
    filterFiles,
    sortFiles,
    clearError,
    resetFilters,
    getStorageAnalytics,
    getFileAnalytics,
  };

  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  );
};

// Enhanced hook with better error handling
export const useFiles = (): FileContextType => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFiles must be used within a FileProvider');
  }
  return context;
};