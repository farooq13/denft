import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Textarea,
  Switch,
  Chip,
  Progress,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem,
  Checkbox,
} from '@nextui-org/react';
import {
  Upload as UploadIcon,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  X,
  Plus,
  CloudUpload,
  Shield,
  Eye,
  EyeOff,
  Tag,
  Settings,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
} from 'lucide-react';
import { useFiles } from '../contexts/FileContext';
import { useToaster } from '../contexts/ToasterContext';

// File upload interface
interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  result?: any;
}

// File categories for organization
const fileCategories = [
  { value: 'document', label: 'Document', icon: FileText },
  { value: 'image', label: 'Image', icon: Image },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'audio', label: 'Audio', icon: Music },
  { value: 'archive', label: 'Archive', icon: Archive },
  { value: 'other', label: 'Other', icon: FileText },
];

// Privacy options
const privacyOptions = [
  {
    value: 'private',
    label: 'Private',
    description: 'Only you can access this file',
    icon: EyeOff,
  },
  {
    value: 'public',
    label: 'Public',
    description: 'Anyone can view and verify this file',
    icon: Eye,
  },
];

export const Upload: React.FC = () => {
  const navigate = useNavigate();
  const { uploadFile, uploadMultipleFiles, uploadProgress } = useFiles();
  const { showToast } = useToaster();
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSettings, setUploadSettings] = useState({
    isPublic: false,
    category: 'other',
    description: '',
    tags: [] as string[],
    enableEncryption: true,
    generateThumbnail: true,
  });
  const [tagInput, setTagInput] = useState('');

  // Get file icon based on type
  const getFileIcon = (file: File) => {
    const type = file.type.toLowerCase();
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) return FileText;
    return Archive;
  };

  // Get file category based on type
  const detectFileCategory = (file: File): string => {
    const type = file.type.toLowerCase();
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'audio';
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) return 'document';
    if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return 'archive';
    return 'other';
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Add files to upload queue
  const addFiles = useCallback((files: FileList | File[]) => {
    const newFiles: UploadFile[] = Array.from(files).map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      progress: 0,
      status: 'pending',
    }));

    setUploadFiles(prev => [...prev, ...newFiles]);
  }, []);

  // Remove file from queue
  const removeFile = useCallback((id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      addFiles(files);
    }
  }, [addFiles]);

  // Handle file input change
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      addFiles(files);
    }
    // Reset input
    e.target.value = '';
  }, [addFiles]);

  // Add tag
  const addTag = useCallback(() => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !uploadSettings.tags.includes(tag)) {
      setUploadSettings(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  }, [tagInput, uploadSettings.tags]);

  // Remove tag
  const removeTag = useCallback((tagToRemove: string) => {
    setUploadSettings(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  }, []);

  // Start upload process
  const startUpload = useCallback(async () => {
    if (uploadFiles.length === 0) return;

    setIsUploading(true);

    try {
      // Update all files to uploading status
      setUploadFiles(prev => prev.map(f => ({ ...f, status: 'uploading' as const })));

      const results = await Promise.allSettled(
        uploadFiles.map(async (uploadFile) => {
          try {
            const result = await uploadFile(uploadFile.file, {
              description: uploadSettings.description,
              tags: uploadSettings.tags,
              isPublic: uploadSettings.isPublic,
              category: uploadSettings.category || detectFileCategory(uploadFile.file),
            });

            // Update file status to success
            setUploadFiles(prev => prev.map(f => 
              f.id === uploadFile.id 
                ? { ...f, status: 'success', result }
                : f
            ));

            return result;
          } catch (error: any) {
            // Update file status to error
            setUploadFiles(prev => prev.map(f => 
              f.id === uploadFile.id 
                ? { ...f, status: 'error', error: error.message }
                : f
            ));
            throw error;
          }
        })
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const errorCount = results.filter(r => r.status === 'rejected').length;

      if (successCount > 0) {
        showToast(
          `Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}`,
          'success'
        );
      }

      if (errorCount > 0) {
        showToast(
          `Failed to upload ${errorCount} file${errorCount > 1 ? 's' : ''}`,
          'error'
        );
      }

      // Clear successful uploads after a delay
      setTimeout(() => {
        setUploadFiles(prev => prev.filter(f => f.status !== 'success'));
      }, 3000);

    } catch (error: any) {
      showToast('Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  }, [uploadFiles, uploadSettings, uploadFile, showToast]);

  // Clear all files
  const clearAllFiles = useCallback(() => {
    setUploadFiles([]);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Upload Your{' '}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Files
          </span>
        </h1>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto">
          Securely store your files on the blockchain with IPFS distribution and cryptographic verification
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Drag and Drop Zone */}
          <Card className="border border-slate-700 bg-slate-800/30 backdrop-blur-xl">
            <CardBody className="p-0">
              <div
                ref={dropZoneRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`upload-zone p-12 text-center transition-all duration-300 rounded-lg cursor-pointer ${
                  isDragOver 
                    ? 'border-blue-500 bg-blue-500/5 scale-105' 
                    : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={`inline-flex p-6 rounded-full mb-6 transition-all duration-300 ${
                  isDragOver 
                    ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 scale-110' 
                    : 'bg-gradient-to-r from-blue-600/20 to-purple-600/20'
                }`}>
                  <CloudUpload className={`w-16 h-16 transition-all duration-300 ${
                    isDragOver ? 'text-blue-300' : 'text-blue-400'
                  }`} />
                </div>

                <h3 className="text-2xl font-bold text-white mb-4">
                  {isDragOver ? 'Drop files here!' : 'Upload Your Files'}
                </h3>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                  Drag and drop files here, or click to browse. Your files will be encrypted and stored securely on the blockchain.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <Button
                    color="primary"
                    size="lg"
                    startContent={<Plus className="w-5 h-5" />}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Choose Files
                  </Button>
                  <Button
                    variant="bordered"
                    size="lg"
                    startContent={<Settings className="w-5 h-5" />}
                    onPress={onSettingsOpen}
                    className="border-slate-600 text-slate-300 hover:border-slate-500"
                  >
                    Upload Settings
                  </Button>
                </div>

                {/* Supported formats */}
                <div className="mt-8 flex flex-wrap gap-2 justify-center">
                  <span className="text-sm text-slate-500">Supported:</span>
                  {['PDF', 'JPG', 'PNG', 'MP4', 'MP3', 'ZIP', 'DOC', '+more'].map((format) => (
                    <Chip key={format} size="sm" variant="flat" className="text-xs bg-slate-700/50">
                      {format}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                accept="*/*"
              />
            </CardBody>
          </Card>

          {/* Upload Queue */}
          {uploadFiles.length > 0 && (
            <Card className="border border-slate-700 bg-slate-800/30 backdrop-blur-xl">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-lg">
                      <UploadIcon className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Upload Queue</h3>
                      <p className="text-sm text-slate-400">
                        {uploadFiles.length} file{uploadFiles.length > 1 ? 's' : ''} ready
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={clearAllFiles}
                      className="text-slate-400"
                    >
                      Clear All
                    </Button>
                    <Button
                      size="sm"
                      color="primary"
                      onPress={startUpload}
                      isLoading={isUploading}
                      disabled={uploadFiles.length === 0 || isUploading}
                      startContent={!isUploading && <Zap className="w-4 h-4" />}
                    >
                      {isUploading ? 'Uploading...' : 'Start Upload'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardBody className="space-y-4">
                {uploadFiles.map((uploadFile) => {
                  const FileIcon = getFileIcon(uploadFile.file);
                  
                  return (
                    <div key={uploadFile.id} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                      <div className="flex items-center space-x-4">
                        {/* File icon */}
                        <div className="p-2 bg-gradient-to-r from-slate-600 to-slate-500 rounded-lg">
                          <FileIcon className="w-5 h-5 text-slate-300" />
                        </div>

                        {/* File info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white truncate">{uploadFile.file.name}</h4>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-slate-400">{formatFileSize(uploadFile.file.size)}</span>
                            <span className="text-sm text-slate-400">{uploadFile.file.type || 'Unknown'}</span>
                            <Chip 
                              size="sm" 
                              color={
                                uploadFile.status === 'success' ? 'success' :
                                uploadFile.status === 'error' ? 'danger' :
                                uploadFile.status === 'uploading' ? 'primary' : 'default'
                              }
                              variant="flat"
                            >
                              {uploadFile.status === 'pending' && 'Ready'}
                              {uploadFile.status === 'uploading' && 'Uploading...'}
                              {uploadFile.status === 'success' && 'Complete'}
                              {uploadFile.status === 'error' && 'Failed'}
                            </Chip>
                          </div>
                          
                          {/* Progress bar for uploading files */}
                          {uploadFile.status === 'uploading' && (
                            <Progress
                              value={uploadFile.progress}
                              className="mt-2"
                              color="primary"
                              size="sm"
                            />
                          )}
                          
                          {/* Error message */}
                          {uploadFile.status === 'error' && uploadFile.error && (
                            <p className="text-sm text-red-400 mt-2">{uploadFile.error}</p>
                          )}
                        </div>

                        {/* Status icon and remove button */}
                        <div className="flex items-center space-x-2">
                          {uploadFile.status === 'success' && (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          )}
                          {uploadFile.status === 'error' && (
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                          )}
                          {uploadFile.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="flat"
                              isIconOnly
                              onPress={() => removeFile(uploadFile.id)}
                              className="text-slate-400 hover:text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Batch upload progress */}
                {isUploading && (
                  <div className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-blue-600/20 rounded-lg">
                        <Upload className="w-5 h-5 text-blue-400 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">Batch Upload in Progress</h4>
                        <p className="text-sm text-blue-300">
                          Processing {uploadFiles.filter(f => f.status === 'uploading').length} files...
                        </p>
                      </div>
                    </div>
                    <Progress
                      value={uploadProgress}
                      className="mb-2"
                      color="primary"
                    />
                    <p className="text-xs text-blue-400">{uploadProgress}% complete</p>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-6">
          {/* Upload Settings Card */}
          <Card className="border border-slate-700 bg-slate-800/30 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg">
                  <Settings className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Upload Settings</h3>
                  <p className="text-sm text-slate-400">Configure your upload</p>
                </div>
              </div>
            </CardHeader>
            
            <CardBody className="space-y-6">
              {/* Privacy Setting */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">Privacy</label>
                <div className="space-y-3">
                  {privacyOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <div
                        key={option.value}
                        className={`p-3 border rounded-lg cursor-pointer transition-all duration-300 ${
                          (uploadSettings.isPublic && option.value === 'public') || 
                          (!uploadSettings.isPublic && option.value === 'private')
                            ? 'border-blue-500 bg-blue-600/10'
                            : 'border-slate-600 hover:border-slate-500'
                        }`}
                        onClick={() => setUploadSettings(prev => ({ 
                          ...prev, 
                          isPublic: option.value === 'public' 
                        }))}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="w-5 h-5 text-slate-300" />
                          <div>
                            <h4 className="font-medium text-white">{option.label}</h4>
                            <p className="text-sm text-slate-400">{option.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">Category</label>
                <Select
                  placeholder="Auto-detect"
                  selectedKeys={uploadSettings.category ? [uploadSettings.category] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    setUploadSettings(prev => ({ ...prev, category: selectedKey }));
                  }}
                  classNames={{
                    trigger: "bg-slate-700/50 border-slate-600 hover:border-slate-500",
                    popoverContent: "bg-slate-800 border-slate-700",
                  }}
                >
                  {fileCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <SelectItem 
                        key={category.value} 
                        startContent={<Icon className="w-4 h-4" />}
                      >
                        {category.label}
                      </SelectItem>
                    );
                  })}
                </Select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">Description</label>
                <Textarea
                  placeholder="Add a description for your files..."
                  value={uploadSettings.description}
                  onValueChange={(value) => setUploadSettings(prev => ({ ...prev, description: value }))}
                  classNames={{
                    input: "bg-slate-700/50 border-slate-600",
                    inputWrapper: "bg-slate-700/50 border-slate-600 hover:border-slate-500",
                  }}
                  maxRows={3}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">Tags</label>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add tags..."
                      value={tagInput}
                      onValueChange={setTagInput}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      classNames={{
                        input: "bg-slate-700/50 border-slate-600",
                        inputWrapper: "bg-slate-700/50 border-slate-600 hover:border-slate-500",
                      }}
                      endContent={
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={addTag}
                          disabled={!tagInput.trim()}
                        >
                          Add
                        </Button>
                      }
                    />
                  </div>
                  
                  {/* Display tags */}
                  {uploadSettings.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {uploadSettings.tags.map((tag) => (
                        <Chip
                          key={tag}
                          size="sm"
                          variant="flat"
                          onClose={() => removeTag(tag)}
                          className="bg-blue-600/20 text-blue-300"
                        >
                          {tag}
                        </Chip>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Advanced Options */}
              <div className="space-y-4">
                <h4 className="font-medium text-white">Advanced Options</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Enable Encryption</p>
                      <p className="text-xs text-slate-400">Encrypt files before blockchain storage</p>
                    </div>
                    <Switch
                      isSelected={uploadSettings.enableEncryption}
                      onValueChange={(value) => setUploadSettings(prev => ({ ...prev, enableEncryption: value }))}
                      color="primary"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Generate Thumbnails</p>
                      <p className="text-xs text-slate-400">Create previews for images and videos</p>
                    </div>
                    <Switch
                      isSelected={uploadSettings.generateThumbnail}
                      onValueChange={(value) => setUploadSettings(prev => ({ ...prev, generateThumbnail: value }))}
                      color="primary"
                    />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Security Notice */}
          <Card className="border border-green-500/30 bg-gradient-to-r from-green-600/10 to-emerald-600/10 backdrop-blur-xl">
            <CardBody className="p-6">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white mb-2">Security & Privacy</h4>
                  <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Files are encrypted before storage</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Blockchain verification ensures authenticity</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>IPFS distribution prevents data loss</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>You maintain full ownership and control</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Upload Tips */}
          <Card className="border border-slate-700 bg-slate-800/30 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-lg">
                  <Info className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Pro Tips</h3>
                  <p className="text-sm text-slate-400">Optimize your uploads</p>
                </div>
              </div>
            </CardHeader>
            
            <CardBody>
              <div className="space-y-4 text-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">Use descriptive filenames</p>
                    <p className="text-slate-400">Makes files easier to find and manage</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">Add relevant tags</p>
                    <p className="text-slate-400">Improve searchability and organization</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">Consider file privacy</p>
                    <p className="text-slate-400">Public files can be verified by anyone</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">Optimize file sizes</p>
                    <p className="text-slate-400">Smaller files upload faster and cost less</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Upload Settings Modal */}
      <Modal 
        isOpen={isSettingsOpen} 
        onClose={onSettingsClose}
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
              <div className="p-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg">
                <Settings className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Upload Settings</h3>
                <p className="text-sm text-slate-400">Configure default upload behavior</p>
              </div>
            </div>
          </ModalHeader>
          
          <ModalBody className="space-y-6">
            {/* Default Privacy */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">Default Privacy</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {privacyOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Card
                      key={option.value}
                      isPressable
                      onPress={() => setUploadSettings(prev => ({ 
                        ...prev, 
                        isPublic: option.value === 'public' 
                      }))}
                      className={`border transition-all duration-300 ${
                        (uploadSettings.isPublic && option.value === 'public') || 
                        (!uploadSettings.isPublic && option.value === 'private')
                          ? 'border-blue-500 bg-blue-600/10'
                          : 'border-slate-600 bg-slate-800/30 hover:border-slate-500'
                      }`}
                    >
                      <CardBody className="p-4 text-center">
                        <Icon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <h4 className="font-medium text-white">{option.label}</h4>
                        <p className="text-xs text-slate-400 mt-1">{option.description}</p>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* File Processing Options */}
            <div>
              <h4 className="font-medium text-white mb-4">File Processing</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">Automatic Encryption</p>
                    <p className="text-xs text-slate-400">Encrypt all files before storage</p>
                  </div>
                  <Switch
                    isSelected={uploadSettings.enableEncryption}
                    onValueChange={(value) => setUploadSettings(prev => ({ ...prev, enableEncryption: value }))}
                    color="primary"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">Generate Thumbnails</p>
                    <p className="text-xs text-slate-400">Create previews for media files</p>
                  </div>
                  <Switch
                    isSelected={uploadSettings.generateThumbnail}
                    onValueChange={(value) => setUploadSettings(prev => ({ ...prev, generateThumbnail: value }))}
                    color="primary"
                  />
                </div>
              </div>
            </div>

            {/* Upload Limits Info */}
            <Card className="bg-blue-600/10 border border-blue-500/30">
              <CardBody className="p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-300 mb-2">Upload Limits</h4>
                    <div className="space-y-1 text-sm text-blue-200">
                      <p>• Maximum file size: 100 MB per file</p>
                      <p>• Maximum batch size: 50 files</p>
                      <p>• Supported formats: All file types</p>
                      <p>• Storage limit: 1 GB (upgradeable)</p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" onPress={onSettingsClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={onSettingsClose}>
              Save Settings
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};