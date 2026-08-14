import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { useWallet } from './WalletContext';
import { useToaster } from './ToasterContext';
import * as anchor from '@coral-xyz/anchor';
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import idl from '../idl/denft.json';

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
  fileHash: string;
  onChainStatus: string;
  transactionSignature?: string;
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
  totalVaultFiles: number;
  totalPublicFiles: number;
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
  fetchFiles: (skip?: number, take?: number, search?: string, category?: string, sortBy?: string) => Promise<void>;
  fetchSharedFiles: () => Promise<void>;
  fetchPublicFiles: (skip?: number, take?: number, search?: string, sortBy?: string) => Promise<void>;
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
  getDashboardAnalytics: () => Promise<any>;
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
  const [totalVaultFiles, setTotalVaultFiles] = useState(0);
  const [totalPublicFiles, setTotalPublicFiles] = useState(0);
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

  const { token, walletAddress, isConnected, refreshTokenFromBackend } = useWallet();
  const { showToast } = useToaster();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const makeAuthenticatedRequest = useCallback(async (url: string, options: RequestInit = {}) => {
    let currentToken = token;
    
    // Fallback: read from localStorage if React state is stale
    if (!currentToken) {
      try {
        const stored = localStorage.getItem('denft-auth');
        if (stored) currentToken = JSON.parse(stored).token;
      } catch {}
    }

    if (!currentToken && refreshTokenFromBackend) {
      currentToken = await refreshTokenFromBackend();
    }

    if (!currentToken || !walletAddress) {
      throw new Error('Authentication required. Please disconnect and reconnect your wallet.');
    }

    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${currentToken}`,
        'X-Wallet-Address': walletAddress,
        ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
      },
    });

    if (response.status === 401 && refreshTokenFromBackend) {
      const errorData = await response.clone().json().catch(() => ({}));
      if (errorData.error?.code === 'TOKEN_EXPIRED') {
        const newToken = await refreshTokenFromBackend();
        if (newToken) {
          response = await fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${newToken}`,
              'X-Wallet-Address': walletAddress,
              ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
            },
          });
        }
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error && typeof errorData.error === 'object' 
        ? errorData.error.message 
        : errorData.error;
      throw new Error(errorMsg || `Request failed with status: ${response.status}`);
    }

    return response;
  }, [token, walletAddress, refreshTokenFromBackend]);

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

      let currentToken = token;
      
      // Fallback: read from localStorage if React state is stale
      if (!currentToken) {
        try {
          const stored = localStorage.getItem('denft-auth');
          if (stored) currentToken = JSON.parse(stored).token;
        } catch {}
      }

      if (!currentToken && refreshTokenFromBackend) {
        currentToken = await refreshTokenFromBackend();
      }

      if (!currentToken) {
        throw new Error('Authentication required. Please disconnect and reconnect your wallet.');
      }
      
      const executeUpload = () => new Promise<UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
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
              const errorMsg = errorData.error && typeof errorData.error === 'object'
                ? errorData.error.message
                : errorData.error;
              reject(new Error(errorMsg || 'Upload failed'));
            } catch (error) {
              reject(new Error(`Upload failed with status: ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.open('POST', '/api/files/upload');
        xhr.setRequestHeader('Authorization', `Bearer ${currentToken}`);
        xhr.setRequestHeader('X-Wallet-Address', walletAddress!);
        xhr.send(formData);
      });

      let result: UploadResult;
      try {
        result = await executeUpload();
      } catch (err: any) {
        if (err.message.includes('expired') && refreshTokenFromBackend) {
          showToast('Session expired, refreshing...', 'info');
          const newToken = await refreshTokenFromBackend();
          if (newToken) {
            currentToken = newToken;
            result = await executeUpload();
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }
      
      showToast(`${file.name} uploaded successfully off-chain!`, 'success');

      if (result.fileHash && anchorWallet) {
        showToast('Initiating Solana transaction...', 'info');
        try {
          const provider = new anchor.AnchorProvider(
            connection,
            anchorWallet as any,
            { commitment: 'confirmed' }
          );
          
          const program = new anchor.Program(idl as any, provider);
          
          // fileHash from backend is hex string, convert to Buffer/Array
          const fileHashBuffer = Buffer.from(result.fileHash, 'hex');
          const fileHashArray = Array.from(fileHashBuffer);
          
          const [userAccountPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("user"), anchorWallet.publicKey.toBuffer()],
            program.programId
          );
          
          const [fileRecordPDA] = PublicKey.findProgramAddressSync(
            [
              Buffer.from("file"),
              anchorWallet.publicKey.toBuffer(),
              fileHashBuffer
            ],
            program.programId
          );
          
          const tx = await program.methods.uploadFile(
            fileHashArray,
            result.ipfsHash,
            "", // encrypted metadata (not fully implemented yet)
            new anchor.BN(result.fileSize),
            result.contentType || "application/octet-stream",
            metadata.description || ""
          ).accounts({
            // @ts-ignore
            userAccount: userAccountPDA,
            fileRecord: fileRecordPDA,
            authority: anchorWallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          }).rpc();

          showToast(`Transaction successful!`, 'success');
          result.transactionSignature = tx;
        } catch (txError: any) {
          console.error("Solana tx failed", txError);
          showToast(`Solana transaction failed: ${txError.message}. File is still stored off-chain.`, 'warning');
        }
      }
      
      // Refresh files list
      await fetchFiles();
      
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
  }, [token, walletAddress, showToast, refreshTokenFromBackend]);

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

  // Enhanced fetch files with server-side pagination and filtering
  const fetchFiles = useCallback(async (
    skip = 0, 
    take = 50, 
    search?: string, 
    category?: string, 
    sortBy?: string
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('skip', skip.toString());
      params.append('take', take.toString());
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (sortBy) params.append('sortBy', sortBy);

      const response = await makeAuthenticatedRequest(`/api/files/my-files?${params.toString()}`);
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
      setTotalVaultFiles(data.total || 0);
      setUsedStorage(data.usedStorage || 0);
      setTotalStorage(data.totalStorage || 1073741824); // 1GB default

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch files';
      setError(errorMessage);
      console.error('Failed to fetch files:', error);
    } finally {
      setIsLoading(false);
    }
  }, [makeAuthenticatedRequest]);

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

  // Fetch public files with server-side pagination
  const fetchPublicFiles = useCallback(async (
    skip = 0, 
    take = 50, 
    search?: string, 
    sortBy?: string
  ): Promise<void> => {
    try {
      const params = new URLSearchParams();
      params.append('skip', skip.toString());
      params.append('take', take.toString());
      if (search) params.append('search', search);
      if (sortBy) params.append('sortBy', sortBy);

      const response = await fetch(`/api/files/public?${params.toString()}`);
      const data = await response.json();
      
      setPublicFiles(data.files || []);
      setTotalPublicFiles(data.total || 0);

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

      await response.json();
      
      showToast('File shared successfully!', 'success');
      
      // Refresh files to update sharing status
      await fetchFiles();

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to share file';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [makeAuthenticatedRequest, showToast, fetchFiles]);

  // Enhanced download with tracking
  const downloadFile = useCallback(async (fileId: string): Promise<void> => {
    try {
      // Track download silently
      await makeAuthenticatedRequest(`/api/files/${fileId}/download`, { method: 'POST' }).catch(() => {});
      
      // Open stream - browser will automatically download it because backend sets Content-Disposition: attachment
      window.open(`/api/files/${fileId}/stream`, '_blank');
      showToast('Download started', 'success');
      
      // Refresh files list to update download count
      await fetchFiles();
    } catch (error: any) {
      console.error('Download failed:', error);
      showToast('Failed to start download', 'error');
    }
  }, [makeAuthenticatedRequest, showToast, fetchFiles]);

  // Enhanced delete with confirmation
  const deleteFile = useCallback(async (fileId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await makeAuthenticatedRequest(`/api/files/${fileId}`, {
        method: 'DELETE',
      });

      showToast('File deleted successfully!', 'success');
      
      // Update local state immediately for better UX
      setFiles(prev => prev.filter(f => f.fileId !== fileId));
      
      // Refresh files list
      await fetchFiles();

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
      await makeAuthenticatedRequest(`/api/files/${fileId}/metadata`, {
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
      let action = operation;
      let value: boolean | undefined = undefined;

      if (operation === 'favorite') {
        action = 'favorite';
        value = true;
      } else if (operation === 'unfavorite') {
        action = 'favorite';
        value = false;
      } else if (operation === 'share') {
        action = 'visibility';
        value = true;
      }

      await makeAuthenticatedRequest('/api/files/bulk', {
        method: 'POST',
        body: JSON.stringify({ fileIds, action, value }),
      });

      showToast(`Bulk ${operation} completed successfully!`, 'success');
      await fetchFiles();

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

  // Get dashboard analytics
  const getDashboardAnalytics = useCallback(async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/analytics/dashboard');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch dashboard analytics:', error);
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
    getDashboardAnalytics,
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