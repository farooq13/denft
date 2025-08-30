import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Progress,
  Chip,
  Avatar,
  Divider,
} from '@nextui-org/react';
import {
  Upload,
  Files,
  Share2,
  Shield,
  TrendingUp,
  Download,
  Eye,
  Clock,
  HardDrive,
  Activity,
  Users,
  Star,
  ArrowRight,
  Plus,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Zap,
} from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useFiles } from '../contexts/FileContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Mock analytics data (replace with real API calls)
const generateMockAnalytics = () => {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      uploads: Math.floor(Math.random() * 10) + 1,
      downloads: Math.floor(Math.random() * 20) + 5,
      views: Math.floor(Math.random() * 50) + 10,
    };
  });
  return days;
};

// Storage breakdown data
const storageBreakdown = [
  { name: 'Documents', value: 35, color: '#3B82F6' },
  { name: 'Images', value: 28, color: '#8B5CF6' },
  { name: 'Videos', value: 20, color: '#EC4899' },
  { name: 'Audio', value: 12, color: '#10B981' },
  { name: 'Other', value: 5, color: '#F59E0B' },
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { walletAddress, balance, walletName } = useWallet();
  const { 
    files, 
    recentFiles, 
    favoriteFiles, 
    isLoading, 
    totalStorage, 
    usedStorage,
    fetchFiles,
    getStorageAnalytics 
  } = useFiles();

  const [analyticsData, setAnalyticsData] = useState(generateMockAnalytics());
  const [storageAnalytics, setStorageAnalytics] = useState<any>(null);
  const [quickStats, setQuickStats] = useState({
    totalFiles: 0,
    totalDownloads: 0,
    totalViews: 0,
    filesShared: 0,
  });

  // Calculate storage percentage
  const storagePercentage = totalStorage > 0 ? (usedStorage / totalStorage) * 100 : 0;

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        await fetchFiles(true);
        
        // Load storage analytics
        const analytics = await getStorageAnalytics();
        if (analytics) {
          setStorageAnalytics(analytics);
        }

        // Calculate quick stats from files
        const stats = files.reduce((acc, file) => ({
          totalFiles: acc.totalFiles + 1,
          totalDownloads: acc.totalDownloads + parseInt(file.downloadCount || '0'),
          totalViews: acc.totalViews + parseInt(file.accessCount || '0'),
          filesShared: acc.filesShared + (file.sharingSettings.isShared ? 1 : 0),
        }), {
          totalFiles: 0,
          totalDownloads: 0,
          totalViews: 0,
          filesShared: 0,
        });

        setQuickStats(stats);

      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };

    if (walletAddress) {
      loadDashboardData();
    }
  }, [walletAddress, fetchFiles, getStorageAnalytics]);

  // Quick action cards
  const quickActions = [
    {
      title: 'Upload Files',
      description: 'Add new files to your secure storage',
      icon: Upload,
      color: 'from-blue-500 to-cyan-500',
      action: () => navigate('/upload'),
    },
    {
      title: 'Verify File',
      description: 'Check file authenticity on blockchain',
      icon: Shield,
      color: 'from-green-500 to-emerald-500',
      action: () => navigate('/verify'),
    },
    {
      title: 'Browse Files',
      description: 'Manage your uploaded files',
      icon: Files,
      color: 'from-purple-500 to-pink-500',
      action: () => navigate('/files'),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="relative">
        <Card className="border border-slate-700 bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-xl overflow-hidden">
          <CardBody className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <Avatar
                  size="lg"
                  src={`https://ui-avatars.com/api/?name=${walletName}&background=3B82F6&color=fff`}
                  className="ring-4 ring-blue-500/30"
                />
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Welcome back! 👋
                  </h1>
                  <p className="text-slate-400">
                    Connected as <span className="text-blue-400 font-mono">{walletAddress?.slice(0, 8)}...{walletAddress?.slice(-4)}</span>
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <Chip size="sm" color="success" variant="flat">
                      {walletName}
                    </Chip>
                    <span className="text-sm text-slate-400">
                      Balance: <span className="text-blue-400 font-semibold">{balance.toFixed(4)} SOL</span>
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  color="primary"
                  variant="solid"
                  startContent={<Upload className="w-4 h-4" />}
                  onPress={() => navigate('/upload')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Upload Files
                </Button>
              </div>
            </div>

            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          </CardBody>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Files', value: quickStats.totalFiles, icon: Files, color: 'text-blue-400', bg: 'from-blue-600/20 to-cyan-600/20' },
          { label: 'Total Downloads', value: quickStats.totalDownloads, icon: Download, color: 'text-green-400', bg: 'from-green-600/20 to-emerald-600/20' },
          { label: 'Total Views', value: quickStats.totalViews, icon: Eye, color: 'text-purple-400', bg: 'from-purple-600/20 to-pink-600/20' },
          { label: 'Files Shared', value: quickStats.filesShared, icon: Share2, color: 'text-orange-400', bg: 'from-orange-600/20 to-red-600/20' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          
          return (
            <Card key={stat.label} className="border border-slate-700 bg-slate-800/30 backdrop-blur-xl hover:bg-slate-800/50 transition-all duration-300 hover:scale-105">
              <CardBody className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.bg}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Storage Overview */}
          <Card className="border border-slate-700 bg-slate-800/30 backdrop-blur-xl">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg">
                    <HardDrive className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Storage Usage</h3>
                    <p className="text-sm text-slate-400">
                      {formatFileSize(usedStorage)} of {formatFileSize(totalStorage)} used
                    </p>
                  </div>
                </div>
                <Chip color={storagePercentage > 80 ? 'danger' : storagePercentage > 60 ? 'warning' : 'success'}>
                  {storagePercentage.toFixed(1)}%
                </Chip>
              </div>
            </CardHeader>
            <CardBody className="pt-4">
              <Progress
                value={storagePercentage}
                className="mb-4"
                color={storagePercentage > 80 ? 'danger' : storagePercentage > 60 ? 'warning' : 'success'}
                size="lg"
              />
              
              {/* Storage breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                {storageBreakdown.map((item) => (
                  <div key={item.name} className="text-center">
                    <div 
                      className="w-4 h-4 rounded-full mx-auto mb-2"
                      style={{ backgroundColor: item.color }}
                    />
                    <p className="text-xs text-slate-400">{item.name}</p>
                    <p className="text-sm font-semibold text-white">{item.value}%</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Activity Chart */}
          <Card className="border border-slate-700 bg-slate-800/30 backdrop-blur-xl">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-lg">
                    <Activity className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Activity Overview</h3>
                    <p className="text-sm text-slate-400">Last 7 days</p>
                  </div>
                </div>
                <Button size="sm" variant="flat" startContent={<TrendingUp className="w-4 h-4" />}>
                  View Details
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1E293B', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="uploads" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="downloads" 
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#EC4899" 
                    strokeWidth={3}
                    dot={{ fill: '#EC4899', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          {/* Recent Files */}
          <Card className="border border-slate-700 bg-slate-800/30 backdrop-blur-xl">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg">
                    <Clock className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Recent Files</h3>
                    <p className="text-sm text-slate-400">Your latest uploads</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="flat" 
                  endContent={<ArrowRight className="w-4 h-4" />}
                  onPress={() => navigate('/files')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {recentFiles.length > 0 ? (
                <div className="space-y-4">
                  {recentFiles.slice(0, 5).map((file) => {
                    const getFileIcon = () => {
                      switch (file.category) {
                        case 'image': return Image;
                        case 'video': return Video;
                        case 'audio': return Music;
                        case 'document': return FileText;
                        default: return Archive;
                      }
                    };
                    
                    const FileIcon = getFileIcon();
                    
                    return (
                      <div key={file.fileId} className="flex items-center space-x-4 p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-all duration-300 group cursor-pointer">
                        <div className="p-2 bg-gradient-to-r from-slate-600 to-slate-500 rounded-lg group-hover:from-blue-600/20 group-hover:to-purple-600/20 transition-all duration-300">
                          <FileIcon className="w-5 h-5 text-slate-300 group-hover:text-blue-400 transition-colors duration-300" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white truncate">
                            {file.fileName || `File ${file.fileId.slice(0, 8)}...`}
                          </h4>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-slate-400">{file.fileSize}</span>
                            <span className="text-sm text-slate-400">
                              {new Date(file.uploadedAt).toLocaleDateString()}
                            </span>
                            {file.isPublic && (
                              <Chip size="sm" color="success" variant="flat">Public</Chip>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1 text-slate-500">
                            <Eye className="w-4 h-4" />
                            <span className="text-sm">{file.accessCount}</span>
                          </div>
                          {file.isFavorite && (
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex p-4 bg-slate-700/30 rounded-full mb-4">
                    <Files className="w-8 h-8 text-slate-400" />
                  </div>
                  <h4 className="text-lg font-medium text-white mb-2">No files yet</h4>
                  <p className="text-slate-400 mb-6">Upload your first file to get started</p>
                  <Button
                    color="primary"
                    startContent={<Upload className="w-4 h-4" />}
                    onPress={() => navigate('/upload')}
                  >
                    Upload Now
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <Card className="border border-slate-700 bg-slate-800/30 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-lg">
                  <Zap className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
                  <p className="text-sm text-slate-400">Common tasks</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                
                return (
                  <Button
                    key={action.title}
                    variant="flat"
                    className="w-full h-auto p-4 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600 hover:border-slate-500 transition-all duration-300 group"
                    onPress={action.action}
                  >
                    <div className="flex items-center space-x-4 w-full">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${action.color} bg-opacity-20 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-medium text-white">{action.title}</h4>
                        <p className="text-sm text-slate-400">{action.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors duration-300" />
                    </div>
                  </Button>
                );
              })}
            </CardBody>
          </Card>

          {/* Storage Breakdown Chart */}
          <Card className="border border-slate-700 bg-slate-800/30 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-indigo-600/20 to-blue-600/20 rounded-lg">
                  <HardDrive className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Storage Breakdown</h3>
                  <p className="text-sm text-slate-400">By file type</p>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={storageBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {storageBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1E293B', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {storageBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-slate-400">{item.name}</span>
                    <span className="text-sm font-medium text-white">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Favorite Files */}
          {favoriteFiles.length > 0 && (
            <Card className="border border-slate-700 bg-slate-800/30 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-lg">
                      <Star className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Favorite Files</h3>
                      <p className="text-sm text-slate-400">Your starred files</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="flat" 
                    endContent={<ArrowRight className="w-4 h-4" />}
                    onPress={() => navigate('/files?filter=favorites')}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {favoriteFiles.slice(0, 3).map((file) => {
                    const getFileIcon = () => {
                      switch (file.category) {
                        case 'image': return Image;
                        case 'video': return Video;
                        case 'audio': return Music;
                        case 'document': return FileText;
                        default: return Archive;
                      }
                    };
                    
                    const FileIcon = getFileIcon();
                    
                    return (
                      <div key={file.fileId} className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-all duration-300 group cursor-pointer">
                        <div className="p-2 bg-gradient-to-r from-slate-600 to-slate-500 rounded-lg group-hover:from-yellow-600/20 group-hover:to-orange-600/20 transition-all duration-300">
                          <FileIcon className="w-4 h-4 text-slate-300 group-hover:text-yellow-400 transition-colors duration-300" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white truncate text-sm">
                            {file.fileName || `File ${file.fileId.slice(0, 8)}...`}
                          </h4>
                          <p className="text-xs text-slate-400">{file.fileSize}</p>
                        </div>
                        
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
          {/* Quick Upload */}
          <Card className="border border-slate-700 bg-gradient-to-br from-blue-600/10 to-purple-600/10 backdrop-blur-xl border-blue-500/30">
            <CardBody className="p-6 text-center">
              <div className="inline-flex p-4 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-full mb-4">
                <Upload className="w-8 h-8 text-blue-300" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Quick Upload</h3>
              <p className="text-sm text-slate-400 mb-6">
                Drag & drop files or click to browse
              </p>
              <Button
                color="primary"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                startContent={<Plus className="w-4 h-4" />}
                onPress={() => navigate('/upload')}
              >
                Upload Files
              </Button>
            </CardBody>
          </Card>

          {/* Network Status */}
          <Card className="border border-slate-700 bg-slate-800/30 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-lg">
                  <Activity className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Network Status</h3>
                  <p className="text-sm text-slate-400">Solana & IPFS</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              {/* Solana Status */}
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-white">Solana</span>
                </div>
                <Chip size="sm" color="success" variant="flat">Online</Chip>
              </div>

              {/* IPFS Status */}
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-white">IPFS</span>
                </div>
                <Chip size="sm" color="primary" variant="flat">Connected</Chip>
              </div>

              {/* Performance metrics */}
              <Divider className="bg-slate-600" />
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Upload Speed</span>
                  <span className="text-white font-medium">Fast</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Network Latency</span>
                  <span className="text-green-400 font-medium">45ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">IPFS Peers</span>
                  <span className="text-blue-400 font-medium">2,847</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Tips & Features */}
          <Card className="border border-slate-700 bg-slate-800/30 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-teal-600/20 to-cyan-600/20 rounded-lg">
                  <Shield className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Pro Tips</h3>
                  <p className="text-sm text-slate-400">Maximize your Denft experience</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              {[
                {
                  icon: Shield,
                  title: 'Enable 2FA',
                  description: 'Add extra security to your account',
                  action: 'Set up',
                },
                {
                  icon: Share2,
                  title: 'Smart Sharing',
                  description: 'Use expiring links for sensitive files',
                  action: 'Learn more',
                },
                {
                  icon: Users,
                  title: 'Team Collaboration',
                  description: 'Invite team members to shared folders',
                  action: 'Invite',
                },
              ].map((tip, index) => {
                const Icon = tip.icon;
                
                return (
                  <div key={index} className="p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-all duration-300 group">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-gradient-to-r from-slate-600 to-slate-500 rounded-lg group-hover:from-teal-600/20 group-hover:to-cyan-600/20 transition-all duration-300">
                        <Icon className="w-4 h-4 text-slate-300 group-hover:text-teal-400 transition-colors duration-300" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white text-sm">{tip.title}</h4>
                        <p className="text-xs text-slate-400 mb-2">{tip.description}</p>
                        <Button size="sm" variant="flat" className="text-xs h-6">
                          {tip.action}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardBody>
          </Card>

          {/* Recent Activity */}
          <Card className="border border-slate-700 bg-slate-800/30 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-pink-600/20 to-red-600/20 rounded-lg">
                  <Clock className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                  <p className="text-sm text-slate-400">Latest actions</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              {/* Mock activity items */}
              {[
                { action: 'Uploaded', file: 'document.pdf', time: '2 hours ago', icon: Upload, color: 'text-blue-400' },
                { action: 'Shared', file: 'image.jpg', time: '1 day ago', icon: Share2, color: 'text-purple-400' },
                { action: 'Downloaded', file: 'video.mp4', time: '2 days ago', icon: Download, color: 'text-green-400' },
              ].map((activity, index) => {
                const Icon = activity.icon;
                
                return (
                  <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-700/30 transition-colors duration-300">
                    <Icon className={`w-4 h-4 ${activity.color}`} />
                    <div className="flex-1">
                      <p className="text-sm text-white">
                        <span className="font-medium">{activity.action}</span> {activity.file}
                      </p>
                      <p className="text-xs text-slate-500">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};