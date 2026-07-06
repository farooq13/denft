// src/pages/Dashboard.tsx
// Sprint 3 — Dashboard with stats, storage breakdown, activity charts.
// Completely removed NextUI. Uses Skeleton during load.

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useWallet } from '@/contexts/WalletContext'
import { useFiles } from '@/contexts/FileContext'
import { PageTransition } from '@/components/ui/page-transition'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { DashboardSkeleton } from '@/components/ui/skeleton'
import { formatFileSize } from '@/lib/utils'

// ── Mock Data ──────────────────────────────────────────────────

const generateMockAnalytics = () => {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      uploads: Math.floor(Math.random() * 10) + 1,
      downloads: Math.floor(Math.random() * 20) + 5,
      views: Math.floor(Math.random() * 50) + 10,
    }
  })
}

const storageBreakdown = [
  { name: 'Documents', value: 35, color: '#3B82F6' },
  { name: 'Images',    value: 28, color: '#8B5CF6' },
  { name: 'Videos',    value: 20, color: '#EC4899' },
  { name: 'Audio',     value: 12, color: '#10B981' },
  { name: 'Other',     value: 5,  color: '#F59E0B' },
]

const QUICK_ACTIONS = [
  {
    title: 'Upload Files',
    description: 'Add new files to your secure storage',
    icon: Upload,
    color: 'from-primary-500 to-primary-600',
    path: '/upload',
  },
  {
    title: 'Verify File',
    description: 'Check file authenticity on blockchain',
    icon: Shield,
    color: 'from-success-500 to-success-600',
    path: '/verify',
  },
  {
    title: 'Browse Files',
    description: 'Manage your uploaded files',
    icon: Files,
    color: 'from-accent-500 to-accent-600',
    path: '/files',
  },
]

// ── Dashboard Component ───────────────────────────────────────

export function Dashboard() {
  const navigate = useNavigate()
  const { walletAddress, balance, walletName } = useWallet()
  const {
    files,
    recentFiles,
    favoriteFiles,
    isLoading,
    error,
    totalStorage,
    usedStorage,
    fetchFiles,
    getStorageAnalytics,
  } = useFiles()

  const [analyticsData] = useState(generateMockAnalytics())
  const [isInitialising, setIsInitialising] = useState(true)
  const [quickStats, setQuickStats] = useState({
    totalFiles: 0,
    totalDownloads: 0,
    totalViews: 0,
    filesShared: 0,
  })

  const storagePercentage = totalStorage > 0 ? (usedStorage / totalStorage) * 100 : 0
  const progressColor = storagePercentage > 80 ? 'error' : storagePercentage > 60 ? 'warning' : 'success'

  useEffect(() => {
    let mounted = true
    const loadDashboardData = async () => {
      try {
        await fetchFiles(true)
        await getStorageAnalytics()
        // Wait an extra tick to ensure Context is fully populated
        await new Promise(r => setTimeout(r, 300))
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        if (mounted) setIsInitialising(false)
      }
    }
    if (walletAddress) loadDashboardData()
    return () => { mounted = false }
  }, [walletAddress, fetchFiles, getStorageAnalytics])

  useEffect(() => {
    if (!files) return
    const stats = files.reduce((acc, file) => ({
      totalFiles: acc.totalFiles + 1,
      totalDownloads: acc.totalDownloads + parseInt(file.downloadCount || '0', 10),
      totalViews: acc.totalViews + parseInt(file.accessCount || '0', 10),
      filesShared: acc.filesShared + (file.sharingSettings?.isShared ? 1 : 0),
    }), { totalFiles: 0, totalDownloads: 0, totalViews: 0, filesShared: 0 })
    setQuickStats(stats)
  }, [files])

  if (isLoading || isInitialising) {
    return <DashboardSkeleton />
  }

  if (error && files.length === 0) {
    return (
      <div className="pt-10">
        <EmptyState 
          icon={<Activity className="h-12 w-12" />}
          title="Failed to load dashboard"
          description={error}
          action={{
            label: "Try Again",
            onClick: () => fetchFiles(true)
          }}
        />
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-8 animate-fade-in">
        
        {/* ── Welcome Header ──────────────────────────────────────── */}
        <Card variant="elevated" className="relative overflow-hidden border-primary-500/20 bg-gradient-to-r from-neutral-900 to-neutral-800">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" aria-hidden="true" />
          <CardBody className="p-8 relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <img
                  src={`https://ui-avatars.com/api/?name=${walletName}&background=3B82F6&color=fff`}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full border-2 border-primary-500/30"
                />
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-neutral-50 mb-1">
                    Welcome back! 👋
                  </h1>
                  <p className="text-neutral-400 text-sm">
                    Connected as <span className="text-primary-400 font-mono">{walletAddress?.slice(0, 8)}…{walletAddress?.slice(-4)}</span>
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <Badge variant="success" size="sm">{walletName}</Badge>
                    <span className="text-sm text-neutral-400 font-medium">
                      Balance: <span className="text-primary-400">{balance.toFixed(4)} SOL</span>
                    </span>
                  </div>
                </div>
              </div>
              
              <Button
                variant="primary"
                leftIcon={<Upload className="h-4 w-4" />}
                onClick={() => navigate('/upload')}
                className="shrink-0"
              >
                Upload Files
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* ── Quick Stats ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Files', value: quickStats.totalFiles, icon: Files, color: 'text-primary-400', bg: 'bg-primary-500/10' },
            { label: 'Total Downloads', value: quickStats.totalDownloads, icon: Download, color: 'text-success-400', bg: 'bg-success-500/10' },
            { label: 'Total Views', value: quickStats.totalViews, icon: Eye, color: 'text-accent-400', bg: 'bg-accent-500/10' },
            { label: 'Files Shared', value: quickStats.filesShared, icon: Share2, color: 'text-warning-400', bg: 'bg-warning-500/10' },
          ].map(stat => (
            <Card key={stat.label} variant="subtle">
              <CardBody className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-neutral-400 text-sm font-medium mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-neutral-50">{stat.value.toLocaleString()}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} aria-hidden="true" />
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* ── Main Grid ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Storage Usage */}
            <Card variant="default">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-500/10 rounded-lg">
                      <HardDrive className="h-5 w-5 text-primary-400" />
                    </div>
                    <div>
                      <CardTitle>Storage Usage</CardTitle>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {formatFileSize(usedStorage)} of {formatFileSize(totalStorage)} used
                      </p>
                    </div>
                  </div>
                  <Badge variant={progressColor} size="sm">
                    {storagePercentage.toFixed(1)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardBody>
                <Progress value={storagePercentage} colorVariant={progressColor} size="lg" className="mb-6" />
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {storageBreakdown.map(item => (
                    <div key={item.name} className="text-center">
                      <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: item.color }} />
                      <p className="text-xs text-neutral-400">{item.name}</p>
                      <p className="text-sm font-semibold text-neutral-100">{item.value}%</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Activity Chart */}
            <Card variant="default">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-success-500/10 rounded-lg">
                      <Activity className="h-5 w-5 text-success-400" />
                    </div>
                    <div>
                      <CardTitle>Activity Overview</CardTitle>
                      <p className="text-xs text-neutral-400 mt-0.5">Last 7 days</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost-neutral" leftIcon={<TrendingUp className="h-4 w-4" />}>
                    Details
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="date" stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '14px' }}
                      />
                      <Line type="monotone" dataKey="uploads" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="downloads" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="views" stroke="#F43F5E" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            {/* Recent Files */}
            <Card variant="default">
              <CardHeader className="pb-4 border-b border-neutral-800">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent-500/10 rounded-lg">
                      <Clock className="h-5 w-5 text-accent-400" />
                    </div>
                    <div>
                      <CardTitle>Recent Files</CardTitle>
                      <p className="text-xs text-neutral-400 mt-0.5">Your latest uploads</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost-neutral" rightIcon={<ArrowRight className="h-4 w-4" />} onClick={() => navigate('/files')}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                {recentFiles.length > 0 ? (
                  <div className="divide-y divide-neutral-800">
                    {recentFiles.slice(0, 5).map(file => {
                      const FileIcon = file.category === 'image' ? Image : file.category === 'video' ? Video : file.category === 'audio' ? Music : file.category === 'document' ? FileText : Archive
                      
                      return (
                        <div key={file.fileId} className="flex items-center gap-4 p-4 hover:bg-neutral-800/50 transition-colors cursor-pointer" onClick={() => navigate('/files')}>
                          <div className="p-2.5 bg-neutral-800 rounded-lg text-neutral-400">
                            <FileIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-neutral-100 truncate">
                              {file.fileName || `File ${file.fileId.slice(0, 8)}`}
                            </h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                              <span>{formatFileSize(Number(file.fileSize))}</span>
                              <span>•</span>
                              <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                              {file.isPublic && <Badge variant="success" size="xs">Public</Badge>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                              <Eye className="h-3.5 w-3.5" />
                              <span>{file.accessCount}</span>
                            </div>
                            {file.isFavorite && <Star className="h-4 w-4 text-warning-400 fill-warning-400" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 px-4">
                    <div className="inline-flex p-4 bg-neutral-800 rounded-full mb-4">
                      <Files className="h-8 w-8 text-neutral-500" />
                    </div>
                    <h4 className="text-lg font-medium text-neutral-100 mb-1">No files yet</h4>
                    <p className="text-sm text-neutral-400 mb-5">Upload your first file to get started</p>
                    <Button variant="primary" leftIcon={<Upload className="h-4 w-4" />} onClick={() => navigate('/upload')}>
                      Upload Now
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-8">
            
            {/* Quick Upload Banner */}
            <Card variant="interactive" className="bg-gradient-to-br from-primary-600/10 to-accent-600/10 border-primary-500/20" onClick={() => navigate('/upload')}>
              <CardBody className="p-6 text-center">
                <div className="inline-flex p-4 bg-primary-500/20 rounded-full mb-4">
                  <Upload className="h-8 w-8 text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-50 mb-1">Quick Upload</h3>
                <p className="text-sm text-neutral-400 mb-5">
                  Drag & drop files or click to browse
                </p>
                <Button variant="primary" fullWidth leftIcon={<Plus className="h-4 w-4" />} onClick={(e) => { e.stopPropagation(); navigate('/upload'); }}>
                  Select Files
                </Button>
              </CardBody>
            </Card>

            {/* Quick Actions List */}
            <Card variant="default">
              <CardHeader className="pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning-500/10 rounded-lg">
                    <Zap className="h-5 w-5 text-warning-400" />
                  </div>
                  <div>
                    <CardTitle>Quick Actions</CardTitle>
                    <p className="text-xs text-neutral-400 mt-0.5">Common tasks</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <div className="divide-y divide-neutral-800">
                  {QUICK_ACTIONS.map(action => (
                    <div key={action.title} className="flex items-center gap-4 p-4 hover:bg-neutral-800/50 transition-colors cursor-pointer group" onClick={() => navigate(action.path)}>
                      <div className={`p-2.5 rounded-lg bg-gradient-to-r ${action.color} bg-opacity-20`}>
                        <action.icon className="h-4 w-4 text-neutral-50" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-neutral-100">{action.title}</h4>
                        <p className="text-xs text-neutral-500 mt-0.5">{action.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-neutral-600 group-hover:text-neutral-300 transition-colors" />
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Storage Breakdown Chart */}
            <Card variant="default">
              <CardHeader className="pb-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-500/10 rounded-lg">
                    <HardDrive className="h-5 w-5 text-accent-400" />
                  </div>
                  <div>
                    <CardTitle>Storage by Type</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={storageBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {storageBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            {/* Network Status */}
            <Card variant="default">
              <CardHeader className="pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success-500/10 rounded-lg">
                    <Activity className="h-5 w-5 text-success-400" />
                  </div>
                  <div>
                    <CardTitle>Network Status</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="p-4 space-y-4">
                <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 bg-success-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-neutral-100">Solana Devnet</span>
                  </div>
                  <Badge variant="success" size="sm">Online</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-neutral-100">IPFS Gateway</span>
                  </div>
                  <Badge variant="primary" size="sm">Connected</Badge>
                </div>
              </CardBody>
            </Card>

          </div>
        </div>
      </div>
    </PageTransition>
  )
}