import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Card, CardBody, Button, Spinner } from '@nextui-org/react';
import { Shield, Wallet, AlertCircle, ArrowRight } from 'lucide-react';
import { useWallet } from '../../contexts/WalletContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Custom access denied component
const AccessDenied: React.FC<{ onConnect: () => void; isLoading: boolean }> = ({ 
  onConnect, 
  isLoading 
}) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="max-w-md w-full border border-slate-700 bg-slate-800/50 backdrop-blur-xl">
        <CardBody className="p-8 text-center">
          {/* Icon */}
          <div className="inline-flex p-4 bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-full mb-6">
            <Shield className="w-12 h-12 text-red-400" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-4">
            Wallet Connection Required
          </h2>

          {/* Description */}
          <p className="text-slate-400 mb-6 leading-relaxed">
            This page requires a connected Solana wallet to access your secure files and interact with the blockchain.
          </p>

          {/* Features list */}
          <div className="space-y-3 mb-8 text-left">
            {[
              'Secure blockchain authentication',
              'Access your encrypted files',
              'Manage sharing permissions',
              'Verify file authenticity',
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                <span className="text-sm text-slate-300">{feature}</span>
              </div>
            ))}
          </div>

          {/* Connect button */}
          <Button
            size="lg"
            onPress={onConnect}
            isLoading={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            startContent={
              isLoading ? <Spinner size="sm" color="white" /> : <Wallet className="w-5 h-5" />
            }
            endContent={!isLoading && <ArrowRight className="w-5 h-5" />}
          >
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </Button>

          {/* Help text */}
          <p className="text-xs text-slate-500 mt-4">
            Don't have a wallet?{' '}
            <a 
              href="https://phantom.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Get Phantom Wallet
            </a>
          </p>
        </CardBody>
      </Card>
    </div>
  );
};

// Loading state component
const LoadingState: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full mb-4 animate-pulse">
          <Wallet className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Checking Wallet Connection...
        </h3>
        <p className="text-slate-400">
          Please wait while we verify your authentication
        </p>
        <Spinner size="lg" color="primary" className="mt-4" />
      </div>
    </div>
  );
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { isConnected, connectWallet, isLoading, connectionStatus } = useWallet();
  const location = useLocation();

  // Show loading state while checking connection
  if (connectionStatus === 'connecting' || isLoading) {
    return <LoadingState />;
  }

  // Show access denied if not connected
  if (!isConnected) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <AccessDenied 
        onConnect={connectWallet} 
        isLoading={isLoading} 
      />
    );
  }

  // Render protected content
  return <>{children}</>;
};