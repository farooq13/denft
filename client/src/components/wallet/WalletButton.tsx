import React, { useState } from 'react';
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Card,
  CardBody,
  useDisclosure,
  Spinner,
  Chip,
} from '@nextui-org/react';
import { 
  Wallet, 
  Shield, 
  Zap, 
  ExternalLink, 
  CheckCircle,
  AlertCircle,
  Smartphone,
  Globe,
  Key,
} from 'lucide-react';
import { useWallet } from '../../contexts/WalletContext';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

// Wallet options with enhanced styling and features
const walletOptions = [
  {
    name: 'Phantom',
    icon: 'https://phantom.app/img/phantom-icon.svg',
    description: 'The most popular Solana wallet',
    features: ['Easy Setup', 'Mobile App', 'Hardware Support'],
    recommended: true,
    installUrl: 'https://phantom.app/',
  },
  {
    name: 'Solflare',
    icon: 'https://solflare.com/favicon.ico',
    description: 'Feature-rich Solana wallet',
    features: ['Portfolio Tracking', 'Staking', 'NFT Support'],
    recommended: false,
    installUrl: 'https://solflare.com/',
  },
  {
    name: 'Backpack',
    icon: 'https://assets.website-files.com/63bdf35a98e26f5c05a4de0b/63c4fac12d03b72d5dc1b5f6_backpack-favicon.png',
    description: 'Modern multi-chain wallet',
    features: ['Multi-chain', 'Clean UI', 'Fast Sync'],
    recommended: false,
    installUrl: 'https://backpack.app/',
  },
  {
    name: 'Torus',
    icon: 'https://tor.us/favicon.ico',
    description: 'Web3 wallet with social login',
    features: ['Social Login', 'No Extension', 'Beginner Friendly'],
    recommended: false,
    installUrl: 'https://tor.us/',
  },
];

export const WalletButton: React.FC = () => {
  const { connectWallet, isLoading, error, connectionStatus } = useWallet();
  const { visible, setVisible } = useWalletModal();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  // Check if wallet is installed
  const isWalletInstalled = (walletName: string): boolean => {
    const { solana } = window as any;
    
    switch (walletName.toLowerCase()) {
      case 'phantom':
        return !!(solana?.isPhantom);
      case 'solflare':
        return !!(solana?.isSolflare);
      case 'backpack':
        return !!(solana?.isBackpack);
      case 'torus':
        return true; // Torus doesn't require installation
      default:
        return false;
    }
  };

  // Handle wallet connection
  const handleWalletConnect = async (walletName: string) => {
    setSelectedWallet(walletName);
    
    if (!isWalletInstalled(walletName) && walletName !== 'Torus') {
      // Show install prompt
      return;
    }

    try {
      await connectWallet();
      onClose();
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setSelectedWallet(null);
    }
  };

  // Install wallet
  const installWallet = (installUrl: string) => {
    window.open(installUrl, '_blank');
  };

  return (
    <>
      {/* Main Connect Button */}
      <Button
        onPress={onOpen}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        startContent={
          connectionStatus === 'connecting' ? (
            <Spinner size="sm" color="white" />
          ) : (
            <Wallet className="w-4 h-4" />
          )
        }
        isLoading={connectionStatus === 'connecting'}
        disabled={isLoading}
      >
        {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect Wallet'}
      </Button>

      {/* Wallet Selection Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        size="2xl"
        backdrop="blur"
        classNames={{
          base: "bg-slate-900/95 backdrop-blur-xl border border-slate-700",
          header: "border-b border-slate-700",
          body: "py-6",
          footer: "border-t border-slate-700",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg">
                <Wallet className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Connect Your Wallet</h2>
                <p className="text-sm text-slate-400">Choose a wallet to connect to Denft</p>
              </div>
            </div>
          </ModalHeader>
          
          <ModalBody>
            {/* Security Notice */}
            <Card className="bg-blue-600/10 border border-blue-500/30 mb-6">
              <CardBody className="flex flex-row items-center space-x-3 py-4">
                <Shield className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-300">Secure Connection</p>
                  <p className="text-xs text-blue-200/80">
                    Your wallet connection is secured by blockchain cryptography. We never store your private keys.
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Wallet Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {walletOptions.map((wallet) => {
                const isInstalled = isWalletInstalled(wallet.name);
                const isConnecting = selectedWallet === wallet.name;
                
                return (
                  <Card
                    key={wallet.name}
                    isPressable={!isConnecting}
                    onPress={() => handleWalletConnect(wallet.name)}
                    className={`border transition-all duration-300 hover:scale-[1.02] ${
                      wallet.recommended 
                        ? 'border-blue-500/50 bg-gradient-to-br from-blue-600/10 to-purple-600/10' 
                        : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
                    } ${isConnecting ? 'opacity-50' : ''}`}
                  >
                    <CardBody className="p-6">
                      {/* Wallet Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={wallet.icon} 
                            alt={wallet.name}
                            className="w-10 h-10 rounded-lg"
                            onError={(e) => {
                              // Fallback to default wallet icon
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${wallet.name}&background=3B82F6&color=fff`;
                            }}
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-white">{wallet.name}</h3>
                              {wallet.recommended && (
                                <Chip size="sm" color="primary" variant="flat">
                                  Recommended
                                </Chip>
                              )}
                            </div>
                            <p className="text-sm text-slate-400">{wallet.description}</p>
                          </div>
                        </div>

                        {/* Installation Status */}
                        <div className="flex flex-col items-end">
                          {isInstalled ? (
                            <div className="flex items-center space-x-1 text-green-400">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-xs">Installed</span>
                            </div>
                          ) : wallet.name === 'Torus' ? (
                            <div className="flex items-center space-x-1 text-blue-400">
                              <Globe className="w-4 h-4" />
                              <span className="text-xs">Web-based</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 text-orange-400">
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-xs">Not Installed</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Features */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {wallet.features.map((feature, index) => (
                          <Chip
                            key={index}
                            size="sm"
                            variant="flat"
                            className="text-xs bg-slate-700/50 text-slate-300"
                          >
                            {feature}
                          </Chip>
                        ))}
                      </div>

                      {/* Action Button */}
                      <div className="flex space-x-2">
                        {isInstalled || wallet.name === 'Torus' ? (
                          <Button
                            fullWidth
                            color="primary"
                            variant={wallet.recommended ? "solid" : "bordered"}
                            startContent={
                              isConnecting ? (
                                <Spinner size="sm" color="white" />
                              ) : (
                                <Key className="w-4 h-4" />
                              )
                            }
                            onPress={() => handleWalletConnect(wallet.name)}
                            isLoading={isConnecting}
                            disabled={isConnecting}
                          >
                            {isConnecting ? 'Connecting...' : 'Connect'}
                          </Button>
                        ) : (
                          <>
                            <Button
                              fullWidth
                              variant="bordered"
                              startContent={<ExternalLink className="w-4 h-4" />}
                              onPress={() => installWallet(wallet.installUrl)}
                              className="border-slate-600 text-slate-300 hover:border-slate-500"
                            >
                              Install
                            </Button>
                          </>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>

            {/* Connection Error */}
            {error && (
              <Card className="bg-red-600/10 border border-red-500/30 mt-4">
                <CardBody className="flex flex-row items-center space-x-3 py-4">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-300">Connection Failed</p>
                    <p className="text-xs text-red-200/80">{error}</p>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Help Section */}
            <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-purple-600/20 rounded-lg">
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-white mb-2">New to Solana Wallets?</h4>
                  <p className="text-sm text-slate-400 mb-3">
                    Wallets are your gateway to the decentralized web. They store your digital assets and enable secure interactions with blockchain applications.
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <div className="flex items-center space-x-1">
                      <Key className="w-3 h-3" />
                      <span>Your keys, your crypto</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Shield className="w-3 h-3" />
                      <span>Bank-grade security</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Zap className="w-3 h-3" />
                      <span>Lightning fast</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
          
          <ModalFooter className="flex justify-between">
            <Button 
              variant="ghost" 
              onPress={onClose}
              className="text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              startContent={<ExternalLink className="w-4 h-4" />}
              onPress={() => window.open('https://docs.solana.com/wallet-guide', '_blank')}
              className="text-blue-400 hover:text-blue-300"
            >
              Learn More
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};