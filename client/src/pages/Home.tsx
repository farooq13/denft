import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  CardBody,
  Chip,
} from '@heroui/react';
import {
  Cloud,
  Shield,
  Zap,
  Globe,
  Upload,
  Download,
  Share2,
  Lock,
  Users,
  Smartphone,
  ArrowRight,
  CheckCircle,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Eye,
} from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useFiles } from '../contexts/FileContext';

// Feature cards data
const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized for speed with instant uploads, downloads, and verification on Solana\'s high-performance network.',
    color: 'from-yellow-500 to-orange-500',
    bgGlow: 'bg-yellow-500/20',
  },
  {
    icon: Lock,
    title: 'Privacy Focused',
    description: 'End-to-end encryption with granular access controls. You own your data, you control who sees it.',
    color: 'from-green-500 to-emerald-500',
    bgGlow: 'bg-green-500/20',
  },
  {
    icon: Share2,
    title: 'Smart Sharing',
    description: 'Share files with advanced permissions, expiration dates, and download limits - all enforced by smart contracts.',
    color: 'from-indigo-500 to-blue-500',
    bgGlow: 'bg-indigo-500/20',
  },
  {
    icon: Globe,
    title: 'Global Access',
    description: 'Access your files from anywhere in the world with just your wallet. No accounts, no passwords needed.',
    color: 'from-teal-500 to-cyan-500',
    bgGlow: 'bg-teal-500/20',
  },
];

// Statistics data
const stats = [
  { label: 'Files Stored', value: '2.4M+', icon: FileText },
  { label: 'Active Users', value: '15K+', icon: Users },
  { label: 'Data Secured', value: '500TB+', icon: Shield },
  { label: 'Verifications', value: '1.2M+', icon: CheckCircle },
];

// Supported file types
const supportedTypes = [
  { icon: FileText, label: 'Documents', types: ['PDF', 'DOC', 'TXT', 'MD'] },
  { icon: Image, label: 'Images', types: ['JPG', 'PNG', 'GIF', 'SVG'] },
  { icon: Video, label: 'Videos', types: ['MP4', 'AVI', 'MOV', 'WEBM'] },
  { icon: Music, label: 'Audio', types: ['MP3', 'WAV', 'FLAC', 'AAC'] },
  { icon: Archive, label: 'Archives', types: ['ZIP', 'RAR', '7Z', 'TAR'] },
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, connectWallet, isLoading } = useWallet();
  const { publicFiles } = useFiles();
  
  const [animationStep, setAnimationStep] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Animated counter hook
  const useAnimatedCounter = (target: number, duration: number = 2000) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
      let start = 0;
      const increment = target / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      
      return () => clearInterval(timer);
    }, [target, duration]);
    
    return count;
  };

  // Handle mouse movement for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Staggered animation on mount
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimationStep(prev => prev + 1);
    }, 200);

    return () => clearInterval(timer);
  }, []);

  const handleGetStarted = async () => {
    try {
      if (isConnected) {
        navigate('/dashboard');
      } else {
        await connectWallet();
      }
    } catch (error) {
      console.error('Error in handleGetStarted:', error);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center text-center px-4">
        {/* Interactive mouse follower */}
        <div 
          className="fixed w-64 h-64 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ease-out"
          style={{
            left: mousePosition.x - 128,
            top: mousePosition.y - 128,
          }}
        />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Main hero content */}
          <div className={`transition-all duration-1000 ${animationStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
              Secure file storage {' '}
              <span className="text-blue-400 font-semibold">with blockchain-backed</span> authenticity{' '}
              <span className="text-purple-400 font-semibold">and </span>
              user control.
            </p>

            {/* CTA buttons */}
            <div className={`flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12 transition-all duration-700 delay-300 ${animationStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
              <Button
                size="lg"
                onPress={handleGetStarted}
                isLoading={isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                endContent={<ArrowRight className="w-5 h-5 ml-2" />}
              >
                {isConnected ? 'Go to Dashboard' : 'Get Started Free'}
              </Button> 
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-[150px] left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-slate-500 rounded-full">
            <div className="w-1 h-3 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full mx-auto mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              const animatedValue = useAnimatedCounter(
                parseInt(stat.value.replace(/[^\d]/g, '')), 
                2000 + index * 200
              );
              
              return (
                <div key={stat.label} className="text-center group">
                  <div className="mb-4 inline-flex p-4 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl border border-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {stat.value.includes('M') ? `${(animatedValue / 1000000).toFixed(1)}M` :
                     stat.value.includes('K') ? `${(animatedValue / 1000).toFixed(0)}K` :
                     stat.value.includes('TB') ? `${(animatedValue / 1000).toFixed(0)}TB` :
                     animatedValue.toLocaleString()}
                    {stat.value.includes('+') ? '+' : ''}
                  </h3>
                  <p className="text-slate-400 font-medium">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Choose{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Denft?
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Experience the future of file storage with cutting-edge blockchain technology, 
              unmatched security, and true data ownership.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              
              return (
                <Card
                  key={feature.title}
                  className={`group border border-slate-700 bg-slate-800/30 backdrop-blur-xl hover:border-slate-600 hover:bg-slate-800/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
                    index % 2 === 0 ? 'hover:shadow-blue-500/25' : 'hover:shadow-purple-500/25'
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <CardBody className="p-8">
                    {/* Feature icon with glow effect */}
                    <div className={`inline-flex p-4 rounded-2xl mb-6 bg-gradient-to-r ${feature.color} bg-opacity-20 relative`}>
                      <div className={`absolute inset-0 ${feature.bgGlow} rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500`} />
                      <Icon className="w-8 h-8 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
                    </div>

                    {/* Feature content */}
                    <h3 className="text-xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors duration-300">
                      {feature.description}
                    </p>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-b from-slate-900/50 to-slate-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              How It{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Works
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Simple, secure, and decentralized file storage in just three steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection lines for desktop */}
            <div className="hidden md:block absolute top-1/2 left-1/3 w-1/3 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform -translate-y-1/2" />
            <div className="hidden md:block absolute top-1/2 right-1/3 w-1/3 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 transform -translate-y-1/2" />

            {/* Steps */}
            {[
              {
                step: '01',
                title: 'Connect Wallet',
                description: 'Link your Solana wallet to start storing files securely.',
                color: 'from-blue-500 to-cyan-500',
              },
              {
                step: '02',
                title: 'Upload Files',
                description: 'Drag and drop your files. They\'re encrypted, hashed, and stored.',
                color: 'from-purple-500 to-pink-500',
              },
              {
                step: '03',
                title: 'Share & Verify',
                description: 'Share with custom permissions or verify authenticity anytime, anywhere.',
                color: 'from-pink-500 to-red-500',
              },
            ].map((step, index) => {
              return (
                <div key={step.step} className="relative text-center group">
                  {/* Step number */}
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-slate-800 to-slate-700 border-2 border-slate-600 rounded-full text-2xl font-bold text-white mb-6 group-hover:border-blue-500 transition-all duration-300">
                    {step.step}
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                  <p className="text-slate-400 leading-relaxed max-w-sm mx-auto">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recent Public Files */}
      {publicFiles && publicFiles.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-slate-800/30 to-slate-900/30">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Recently Shared{' '}
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Public Files
                  </span>
                </h2>
                <p className="text-slate-300">Discover files shared by the community</p>
              </div>
              <Link to="/verify">
                <Button
                  variant="bordered"
                  className="border-slate-600 text-slate-300 hover:border-blue-500 hover:text-blue-400"
                  endContent={<ArrowRight className="w-4 h-4" />}
                >
                  Verify Files
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicFiles.slice(0, 6).map((file, index) => (
                <Card
                  key={file.fileId}
                  className="group border border-slate-700 bg-slate-800/30 backdrop-blur-xl hover:border-slate-600 hover:bg-slate-800/50 transition-all duration-300 hover:scale-105"
                >
                  <CardBody className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-2 truncate">
                          {file.fileName || `File ${file.fileId.slice(0, 8)}...`}
                        </h3>
                        <p className="text-sm text-slate-400 mb-3">
                          {file.description || 'No description'}
                        </p>
                      </div>
                      <Chip size="sm" color="success" variant="flat">
                        Verified
                      </Chip>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{file.fileSize}</span>
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>{file.accessCount} views</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/30 rounded-3xl p-12 backdrop-blur-xl">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Secure Your{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Digital Assets?
              </span>
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Join thousands of users who trust Denft for decentralized, secure, and verifiable file storage.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Button
                size="lg"
                onPress={handleGetStarted}
                isLoading={isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                endContent={<ArrowRight className="w-5 h-5" />}
              >
                Start Storing Securely
              </Button>
              
              <Link to="/verify">
                <Button
                  size="lg"
                  variant="bordered"
                  className="border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white px-8 py-3 rounded-lg transition-all duration-300"
                  startContent={<Shield className="w-5 h-5" />}
                >
                  Verify a File
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};