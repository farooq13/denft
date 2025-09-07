import React, { useState, useEffect } from 'react';
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
  Spinner,
} from '@nextui-org/react';
import { 
  Wallet, 
  X,
  ExternalLink,
} from 'lucide-react';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { type WalletName } from '@solana/wallet-adapter-base';
import { useWallet } from '../../contexts/WalletContext';

// Wallet configurations matching the image design
const walletOptions = [
  {
    name: 'Phantom',
    walletName: 'Phantom' as WalletName,
    icon: 'https://phantom.app/img/phantom-icon.svg',
    installUrl: 'https://phantom.app/',
    detectionKey: 'isPhantom',
  },
  {
    name: 'Solflare',
    walletName: 'Solflare' as WalletName,
    icon: 'https://solflare.com/favicon.ico',
    installUrl: 'https://solflare.com/',
    detectionKey: 'isSolflare',
  },
  {
    name: 'Backpack',
    walletName: 'Backpack' as WalletName,
    icon: 'https://assets.website-files.com/63bdf35a98e26f5c05a4de0b/63c4fac12d03b72d5dc1b5f6_backpack-favicon.png',
    installUrl: 'https://backpack.app/',
    detectionKey: 'isBackpack',
  },
  {
    name: 'OKX Wallet',
    walletName: 'OKX' as WalletName,
    icon: 'https://static.okx.com/cdn/assets/imgs/247/58E63FEA47A2B7D7.png',
    installUrl: 'https://www.okx.com/wallet',
    detectionKey: 'isOkxWallet',
  },
  {
    name: 'Torus',
    walletName: 'Torus' as WalletName,
    icon: 'https://tor.us/favicon.ico',
    installUrl: 'https://tor.us/',
    detectionKey: null, // Web-based
  },
];

export const WalletButton: React.FC = () => {
  const { isLoading, error, connectionStatus } = useWallet();
  const { 
    wallets, 
    select, 
    wallet: selectedWallet, 
    connect, 
    connected,
    connecting
  } = useSolanaWallet();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

  // Check if a specific wallet is detected
  const isWalletDetected = (detectionKey: string | null): boolean => {
    if (!detectionKey) return true; // Web-based wallets
    
    const { solana } = window as any;
    return !!(solana && solana[detectionKey]);
  };

  // Handle wallet selection and connection
  const handleWalletSelect = async (walletOption: typeof walletOptions[0]) => {
    const isDetected = isWalletDetected(walletOption.detectionKey);
    
    if (!isDetected) {
      // Open install URL
      window.open(walletOption.installUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setConnectingWallet(walletOption.name);
    
    try {
      // First, select the wallet
      select(walletOption.walletName);
      
      // Wait a moment for the wallet to be selected
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Then connect
      await connect();
      
      // Close modal on successful connection
      if (connected) {
        onClose();
      }
      
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      // Don't close modal on error so user can try again
    } finally {
      setConnectingWallet(null);
    }
  };

  // Close modal when successfully connected
  useEffect(() => {
    if (connected && isOpen) {
      onClose();
    }
  }, [connected, isOpen, onClose]);

  return (
    <>
      {/* Main Connect Button */}
      <Button
        onPress={onOpen}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        startContent={
          (connectionStatus === 'connecting' || connecting) ? (
            <Spinner size="sm" color="white" />
          ) : (
            <Wallet className="w-4 h-4" />
          )
        }
        isLoading={connectionStatus === 'connecting' || connecting}
        disabled={isLoading || connecting}
      >
        {(connectionStatus === 'connecting' || connecting) ? 'Connecting...' : 'Connect Wallet'}
      </Button>

      {/* Wallet Selection Modal - Matching the image design */}
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        size="sm"
        backdrop="blur"
        hideCloseButton
        classNames={{
          base: "bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl max-w-md",
          body: "p-6",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex items-center justify-between p-0 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Connect a wallet on</h2>
              <h3 className="text-xl font-semibold text-white">Solana to continue</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400 hover:text-white" />
            </button>
          </ModalHeader>
          
          <ModalBody className="p-0">
            {/* Wallet Options */}
            <div className="space-y-3">
              {walletOptions.map((walletOption) => {
                const isDetected = isWalletDetected(walletOption.detectionKey);
                const isConnecting = connectingWallet === walletOption.name;
                
                return (
                  <button
                    key={walletOption.name}
                    onClick={() => handleWalletSelect(walletOption)}
                    disabled={isConnecting || connecting}
                    className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 rounded-xl transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center space-x-3">
                      <img 
                        src={walletOption.icon} 
                        alt={walletOption.name}
                        className="w-8 h-8 rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://ui-avatars.com/api/?name=${walletOption.name}&background=3B82F6&color=fff`;
                        }}
                      />
                      <span className="text-white font-medium text-left">
                        {walletOption.name}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      {isConnecting ? (
                        <Spinner size="sm" color="primary" />
                      ) : isDetected ? (
                        <span className="text-slate-400 text-sm font-medium">Detected</span>
                      ) : (
                        <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-slate-400" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* More options */}
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="text-center">
                <button
                  className="text-slate-400 hover:text-white text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-1 mx-auto"
                  onClick={() => {
                    // Show available wallets from the adapter
                    console.log('Available wallets:', wallets.map(w => w.adapter.name));
                  }}
                >
                  <span>More options</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 bg-red-600/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Connection Status */}
            {connecting && (
              <div className="mt-4 p-3 bg-blue-600/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Spinner size="sm" color="primary" />
                  <p className="text-blue-400 text-sm font-medium">
                    Connecting to {selectedWallet?.adapter?.name}...
                  </p>
                </div>
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};