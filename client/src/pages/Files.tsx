import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Checkbox,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
  Spinner,
  Avatar,
  Tooltip,
} from '@nextui-org/react';
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Download,
  Share2,
  Eye,
  Star,
  MoreVertical,
  Trash2,
  Edit,
  Copy,
  ExternalLink,
  Calendar,
  HardDrive,
  Users,
  Lock,
  Globe,
  CheckCircle,
} from 'lucide-react';
import { useFiles } from '../contexts/FileContext';
import { useToaster } from '../contexts/ToasterContext';

// View modes
type ViewMode = 'grid' | 'list';

// Sort options
const sortOptions = [
  { key: 'name', label: 'Name', icon: SortAsc },
  { key: 'uploadedAt', label: 'Date Uploaded', icon: Calendar },
  { key: 'fileSize', label: 'File Size', icon: HardDrive },
  { key: 'accessCount', label: 'Views', icon: Eye },
  { key: 'downloadCount', label: 'Downloads', icon: Download },
];

// Filter categories
const filterCategories = [
  { key: 'all', label: 'All Files', icon: FileText },
  { key: 'document', label: 'Documents', icon: FileText },
  { key: 'image', label: 'Images', icon: Image },
  { key: 'video', label: 'Videos', icon: Video },
  { key: 'audio', label: 'Audio', icon: Music },
  { key: 'archive', label: 'Archives', icon: Archive },
];

export const Files: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    files, 
    isLoading, 
    downloadFile, 
    deleteFile, 
    toggleFavorite,
    shareFile,
    searchFiles,
    bulkOperation,
  } = useFiles();
  const { showToast } = useToaster();
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'uploadedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    (searchParams.get('direction') as 'asc' | 'desc') || 'desc'
  );
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  
  // Modal states
  const { isOpen: isShareOpen, onOpen: onShareOpen, onClose: onShareClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [selectedFile, setSelectedFile] = useState<any>(null);

  // Format file size
  const formatFileSize = (sizeStr: string): string => {
    const bytes = parseInt(sizeStr);
    if (isNaN(bytes) || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Get file icon based on category
  const getFileIcon = (category: string) => {
    switch (category) {
      case 'image': return Image;
      case 'video': return Video;
      case 'audio': return Music;
      case 'document': return FileText;
      case 'archive': return Archive;
      default: return FileText;
    }
  };

  // Filter and sort files
  const filteredAndSortedFiles = useMemo(() => {
    let filtered = [...files];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(file =>
        (file.fileName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(file => file.category === selectedCategory);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof typeof a];
      let bValue: any = b[sortBy as keyof typeof b];

      // Handle different data types
      if (sortBy === 'uploadedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortBy === 'fileSize') {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      } else if (sortBy === 'accessCount' || sortBy === 'downloadCount') {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      }

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [files, searchQuery, selectedCategory, sortBy, sortDirection]);

  // Paginated files
  const paginatedFiles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedFiles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedFiles, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedFiles.length / itemsPerPage);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (sortBy !== 'uploadedAt') params.set('sort', sortBy);
    if (sortDirection !== 'desc') params.set('direction', sortDirection);
    
    setSearchParams(params);
  }, [searchQuery, selectedCategory, sortBy, sortDirection, setSearchParams]);

  // Handle file selection
  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  // Select all files
  const selectAllFiles = () => {
    if (selectedFiles.size === paginatedFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(paginatedFiles.map(f => f.fileId)));
    }
  };

  // Handle bulk operations
  const handleBulkOperation = async (operation: string) => {
    if (selectedFiles.size === 0) return;

    try {
      await bulkOperation(Array.from(selectedFiles), operation as any);
      setSelectedFiles(new Set());
      showToast(`Bulk ${operation} completed`, 'success');
    } catch (error) {
      showToast(`Bulk ${operation} failed`, 'error');
    }
  };

  // Handle individual file actions
  const handleFileAction = async (action: string, file: any) => {
    try {
      switch (action) {
        case 'download':
          await downloadFile(file.fileId);
          break;
        case 'favorite':
          await toggleFavorite(file.fileId);
          break;
        case 'share':
          setSelectedFile(file);
          onShareOpen();
          break;
        case 'delete':
          setSelectedFile(file);
          onDeleteOpen();
          break;
      }
    } catch (error: any) {
      showToast(error.message || `Failed to ${action} file`, 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            My Files
          </h1>
          <p className="text-slate-400">
            {filteredAndSortedFiles.length} of {files.length} files
            {selectedFiles.size > 0 && (
              <span className="ml-2 text-blue-400">
                • {selectedFiles.size} selected
              </span>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {selectedFiles.size > 0 && (
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="flat"
                onPress={() => handleBulkOperation('favorite')}
                startContent={<Star className="w-4 h-4" />}
              >
                Favorite
              </Button>
              <Button
                size="sm"
                variant="flat"
                color="danger"
                onPress={() => handleBulkOperation('delete')}
                startContent={<Trash2 className="w-4 h-4" />}
              >
                Delete
              </Button>
            </div>
          )}

          <Button
            variant="bordered"
            size="sm"
            startContent={<Filter className="w-4 h-4" />}
            onPress={() => setShowFilters(!showFilters)}
            className="border-slate-600"
          >
            Filters
          </Button>

          <div className="flex bg-slate-800 rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'solid' : 'flat'}
              isIconOnly
              onPress={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-blue-600' : ''}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'solid' : 'flat'}
              isIconOnly
              onPress={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-blue-600' : ''}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="border border-slate-700 bg-slate-800/30 backdrop-blur-xl">
          <CardBody className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                startContent={<Search className="w-4 h-4 text-slate-400" />}
                classNames={{
                  input: "bg-slate-700/50",
                  inputWrapper: "bg-slate-700/50 border-slate-600 hover:border-slate-500",
                }}
              />

              {/* Category Filter */}
              <Select
                placeholder="All Categories"
                selectedKeys={selectedCategory ? [selectedCategory] : []}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as string;
                  setSelectedCategory(key || 'all');
                  setCurrentPage(1);
                }}
                classNames={{
                  trigger: "bg-slate-700/50 border-slate-600",
                  popoverContent: "bg-slate-800 border-slate-700",
                }}
              >
                {filterCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <SelectItem 
                      key={category.key}
                      startContent={<Icon className="w-4 h-4" />}
                    >
                      {category.label}
                    </SelectItem>
                  );
                })}
              </Select>

              {/* Sort By */}
              <Select
                placeholder="Sort by..."
                selectedKeys={sortBy ? [sortBy] : []}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as string;
                  setSortBy(key);
                }}
                classNames={{
                  trigger: "bg-slate-700/50 border-slate-600",
                  popoverContent: "bg-slate-800 border-slate-700",
                }}
              >
                {sortOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem 
                      key={option.key}
                      startContent={<Icon className="w-4 h-4" />}
                    >
                      {option.label}
                    </SelectItem>
                  );
                })}
              </Select>

              {/* Sort Direction */}
              <div className="flex space-x-2">
                <Button
                  variant={sortDirection === 'asc' ? 'solid' : 'flat'}
                  size="sm"
                  onPress={() => setSortDirection('asc')}
                  startContent={<SortAsc className="w-4 h-4" />}
                  className={sortDirection === 'asc' ? 'bg-blue-600' : ''}
                >
                  Ascending
                </Button>
                <Button
                  variant={sortDirection === 'desc' ? 'solid' : 'flat'}
                  size="sm"
                  onPress={() => setSortDirection('desc')}
                  startContent={<SortDesc className="w-4 h-4" />}
                  className={sortDirection === 'desc' ? 'bg-blue-600' : ''}
                >
                  Descending
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Files Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Spinner size="lg" color="primary" />
            <p className="text-slate-400 mt-4">Loading your files...</p>
          </div>
        </div>
      ) : filteredAndSortedFiles.length === 0 ? (
        <Card className="border border-slate-700 bg-slate-800/30 backdrop-blur-xl">
          <CardBody className="p-12 text-center">
            <div className="inline-flex p-4 bg-slate-700/30 rounded-full mb-6">
              <FileText className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">
              {searchQuery || selectedCategory !== 'all' ? 'No files found' : 'No files yet'}
            </h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'Upload your first file to get started with decentralized storage.'
              }
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Button
                color="primary"
                onPress={() => window.location.href = '/upload'}
                startContent={<FileText className="w-4 h-4" />}
              >
                Upload Files
              </Button>
              {(searchQuery || selectedCategory !== 'all') && (
                <Button
                  variant="flat"
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setCurrentPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Bulk Actions */}
          {paginatedFiles.length > 0 && (
            <div className="flex items-center justify-between py-2">
              <Checkbox
                isSelected={selectedFiles.size === paginatedFiles.length && paginatedFiles.length > 0}
                isIndeterminate={selectedFiles.size > 0 && selectedFiles.size < paginatedFiles.length}
                onValueChange={selectAllFiles}
              >
                <span className="text-sm text-slate-400">
                  Select all {paginatedFiles.length} files
                </span>
              </Checkbox>

              {selectedFiles.size > 0 && (
                <div className="text-sm text-blue-400">
                  {selectedFiles.size} file{selectedFiles.size > 1 ? 's' : ''} selected
                </div>
              )}
            </div>
          )}

          {/* Files Grid/List */}
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {paginatedFiles.map((file) => {
              const FileIcon = getFileIcon(file.category);
              const isSelected = selectedFiles.has(file.fileId);

              if (viewMode === 'list') {
                return (
                  <Card
                    key={file.fileId}
                    className={`border transition-all duration-300 hover:scale-[1.01] hover:shadow-lg cursor-pointer ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-600/10' 
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                    }`}
                  >
                    <CardBody className="p-4">
                      <div className="flex items-center space-x-4">
                        <Checkbox
                          isSelected={isSelected}
                          onValueChange={() => toggleFileSelection(file.fileId)}
                          onClick={(e) => e.stopPropagation()}
                        />

                        <div className="p-2 bg-gradient-to-r from-slate-600 to-slate-500 rounded-lg">
                          <FileIcon className="w-5 h-5 text-slate-300" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-white truncate">
                              {file.fileName || `File ${file.fileId.slice(0, 8)}...`}
                            </h3>
                            {file.isFavorite && <Star className="w-4 h-4 text-yellow-400 fill-current" />}
                            {file.isPublic ? (
                              <Globe className="w-4 h-4 text-green-400" />
                            ) : (
                              <Lock className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-slate-400">
                            <span>{formatFileSize(file.fileSize)}</span>
                            <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                            <div className="flex items-center space-x-1">
                              <Eye className="w-3 h-3" />
                              <span>{file.accessCount}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Download className="w-3 h-3" />
                              <span>{file.downloadCount}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Tooltip content="Download">
                            <Button
                              size="sm"
                              variant="flat"
                              isIconOnly
                              onPress={() => handleFileAction('download', file)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </Tooltip>

                          <Dropdown>
                            <DropdownTrigger>
                              <Button size="sm" variant="flat" isIconOnly>
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                              variant="faded"
                              className="bg-slate-800 border-slate-700"
                            >
                              <DropdownItem
                                key="favorite"
                                startContent={<Star className="w-4 h-4" />}
                                onPress={() => handleFileAction('favorite', file)}
                              >
                                {file.isFavorite ? 'Unfavorite' : 'Favorite'}
                              </DropdownItem>
                              <DropdownItem
                                key="share"
                                startContent={<Share2 className="w-4 h-4" />}
                                onPress={() => handleFileAction('share', file)}
                              >
                                Share
                              </DropdownItem>
                              <DropdownItem
                                key="copy"
                                startContent={<Copy className="w-4 h-4" />}
                                onPress={() => navigator.clipboard.writeText(file.ipfsHash)}
                              >
                                Copy IPFS Hash
                              </DropdownItem>
                              <DropdownItem
                                key="delete"
                                color="danger"
                                startContent={<Trash2 className="w-4 h-4" />}
                                onPress={() => handleFileAction('delete', file)}
                              >
                                Delete
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              }

              // Grid view
              return (
                <Card
                  key={file.fileId}
                  className={`border transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-600/10' 
                      : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                  }`}
                >
                  <CardBody className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <Checkbox
                        isSelected={isSelected}
                        onValueChange={() => toggleFileSelection(file.fileId)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex items-center space-x-1">
                        {file.isFavorite && <Star className="w-4 h-4 text-yellow-400 fill-current" />}
                        {file.isPublic ? (
                          <Globe className="w-4 h-4 text-green-400" />
                        ) : (
                          <Lock className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    <div className="text-center mb-4">
                      <div className="inline-flex p-4 bg-gradient-to-r from-slate-600 to-slate-500 rounded-2xl mb-3">
                        <FileIcon className="w-12 h-12 text-slate-300" />
                      </div>
                      <h3 className="font-medium text-white mb-1 truncate">
                        {file.fileName || `File ${file.fileId.slice(0, 8)}...`}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {formatFileSize(file.fileSize)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>{file.accessCount}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Download className="w-3 h-3" />
                        <span>{file.downloadCount}</span>
                      </div>
                      <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="flat"
                        className="flex-1"
                        startContent={<Download className="w-3 h-3" />}
                        onPress={() => handleFileAction('download', file)}
                      >
                        Download
                      </Button>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button size="sm" variant="flat" isIconOnly>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                          variant="faded"
                          className="bg-slate-800 border-slate-700"
                        >
                          <DropdownItem
                            key="favorite"
                            startContent={<Star className="w-4 h-4" />}
                            onPress={() => handleFileAction('favorite', file)}
                          >
                            {file.isFavorite ? 'Unfavorite' : 'Favorite'}
                          </DropdownItem>
                          <DropdownItem
                            key="share"
                            startContent={<Share2 className="w-4 h-4" />}
                            onPress={() => handleFileAction('share', file)}
                          >
                            Share
                          </DropdownItem>
                          <DropdownItem
                            key="copy"
                            startContent={<Copy className="w-4 h-4" />}
                            onPress={() => navigator.clipboard.writeText(file.ipfsHash)}
                          >
                            Copy Hash
                          </DropdownItem>
                          <DropdownItem
                            key="delete"
                            color="danger"
                            startContent={<Trash2 className="w-4 h-4" />}
                            onPress={() => handleFileAction('delete', file)}
                          >
                            Delete
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setCurrentPage}
                color="primary"
                variant="bordered"
                showControls
                classNames={{
                  wrapper: "gap-0 overflow-visible h-8",
                  item: "w-8 h-8 text-small border-slate-600 bg-slate-800/30",
                  cursor: "bg-blue-600 border-blue-600 text-white font-bold",
                }}
              />
            </div>
          )}
        </>
      )}

      {/* Share Modal */}
      <Modal 
        isOpen={isShareOpen} 
        onClose={onShareClose}
        size="2xl"
        backdrop="blur"
        classNames={{
          base: "bg-slate-900/95 backdrop-blur-xl border border-slate-700",
          header: "border-b border-slate-700",
          body: "py-6",
        }}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg">
                <Share2 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Share File</h3>
                <p className="text-sm text-slate-400">
                  {selectedFile?.fileName || 'Unknown file'}
                </p>
              </div>
            </div>
          </ModalHeader>
          
          <ModalBody>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Share with wallet address
                </label>
                <Input
                  placeholder="Enter Solana wallet address..."
                  classNames={{
                    input: "bg-slate-700/50",
                    inputWrapper: "bg-slate-700/50 border-slate-600",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Permissions
                </label>
                <div className="space-y-3">
                  <Checkbox defaultSelected>View file</Checkbox>
                  <Checkbox>Download file</Checkbox>
                  <Checkbox>Share with others</Checkbox>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Expiration (optional)
                </label>
                <Input
                  type="datetime-local"
                  classNames={{
                    input: "bg-slate-700/50",
                    inputWrapper: "bg-slate-700/50 border-slate-600",
                  }}
                />
              </div>
            </div>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" onPress={onShareClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={onShareClose}>
              Share File
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteOpen} 
        onClose={onDeleteClose}
        backdrop="blur"
        classNames={{
          base: "bg-slate-900/95 backdrop-blur-xl border border-slate-700",
          header: "border-b border-slate-700",
        }}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-600/20 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Delete File</h3>
                <p className="text-sm text-slate-400">This action cannot be undone</p>
              </div>
            </div>
          </ModalHeader>
          
          <ModalBody>
            <p className="text-slate-300">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-white">
                {selectedFile?.fileName || 'this file'}
              </span>
              ? This will permanently remove it from the blockchain and IPFS.
            </p>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" onPress={onDeleteClose}>
              Cancel
            </Button>
            <Button 
              color="danger" 
              onPress={async () => {
                if (selectedFile) {
                  await deleteFile(selectedFile.fileId);
                  onDeleteClose();
                }
              }}
            >
              Delete File
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};