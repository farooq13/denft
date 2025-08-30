import React, { useState, useEffect } from 'react';
import { Cloud, Shield, Zap, Globe } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const loadingSteps = [
    { icon: Cloud, text: 'Initializing Denft...', duration: 600 },
    { icon: Shield, text: 'Securing connections...', duration: 500 },
    { icon: Globe, text: 'Connecting to Solana...', duration: 500 },
    { icon: Zap, text: 'Almost ready...', duration: 400 },
  ];

  useEffect(() => {
    let currentProgress = 0;
    let stepIndex = 0;
    
    const progressInterval = setInterval(() => {
      currentProgress += 2;
      setProgress(currentProgress);
      
      // Update step based on progress
      const stepProgress = (currentProgress / 100) * loadingSteps.length;
      const newStepIndex = Math.min(Math.floor(stepProgress), loadingSteps.length - 1);
      
      if (newStepIndex !== stepIndex) {
        setLoadingStep(newStepIndex);
        stepIndex = newStepIndex;
      }
      
      if (currentProgress >= 100) {
        clearInterval(progressInterval);
      }
    }, 40);

    return () => clearInterval(progressInterval);
  }, []);

  const currentStep = loadingSteps[loadingStep];
  const Icon = currentStep?.icon || Cloud;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center z-50">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-pink-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Loading content */}
      <div className="relative z-10 text-center">
        {/* Logo */}
        <div className="mb-8 animate-bounce">
          <div className="relative inline-block">
            <Cloud className="w-24 h-24 text-blue-400 drop-shadow-2xl" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-ping" />
          </div>
        </div>

        {/* Brand name */}
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
          Denft
        </h1>
        
        <p className="text-xl text-slate-300 mb-12 font-light">
          Decentralized Cloud Storage on Solana
        </p>

        {/* Loading indicator */}
        <div className="max-w-md mx-auto">
          {/* Current step */}
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full border border-blue-500/30">
              <Icon className="w-6 h-6 text-blue-400 animate-spin" style={{ animationDuration: '2s' }} />
            </div>
            <span className="text-white font-medium">
              {currentStep?.text || 'Loading...'}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800/50 rounded-full h-2 mb-4 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
          </div>

          {/* Progress percentage */}
          <p className="text-sm text-slate-400 font-mono">
            {progress}% Complete
          </p>
        </div>

        {/* Feature highlights */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
          <div className="flex flex-col items-center space-y-2 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 backdrop-blur-sm">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm font-medium text-white">Secure</span>
            <span className="text-xs text-slate-400 text-center">Blockchain verified authenticity</span>
          </div>
          
          <div className="flex flex-col items-center space-y-2 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 backdrop-blur-sm">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-sm font-medium text-white">Fast</span>
            <span className="text-xs text-slate-400 text-center">Lightning-fast IPFS storage</span>
          </div>
          
          <div className="flex flex-col items-center space-y-2 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 backdrop-blur-sm">
            <div className="p-2 bg-green-600/20 rounded-lg">
              <Globe className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm font-medium text-white">Decentralized</span>
            <span className="text-xs text-slate-400 text-center">No single point of failure</span>
          </div>
        </div>
      </div>
    </div>
  );
};