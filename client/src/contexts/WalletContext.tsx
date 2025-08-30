import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { 
  ConnectionProvider, 
  WalletProvider as SolanaWalletProvider, 
  useWallet as useSolanaWallet 
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  AlphaWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { useToaster } from './ToasterContext';

// Enhanced wallet interface with more features
interface WalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  publicKey: PublicKey | null;
  token: string | null;
  balance: number;
  isLoading: boolean;
  error: string | null;
  walletName: string | null;
  network: WalletAdapterNetwork;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  refreshBalance: () => Promise<void>;
  switchNetwork: (network: WalletAdapterNetwork) => Promise<void>;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

// Network configuration
const network = WalletAdapterNetwork.Devnet;
const endpoint = clusterApiUrl(network);

// Supported wallet adapters with enhanced configuration
const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  new AlphaWalletAdapter(),
  // new TorusWalletAdapter({
  //   clientId: process.env.REACT_APP_TORUS_CLIENT_ID || 'demo-client-id',
  // }),
];

// Inner wallet provider component that uses Solana wallet adapter
const WalletProviderInner: React.FC<WalletProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [currentNetwork, setCurrentNetwork] = useState<WalletAdapterNetwork>(network);
  
  const { showToast } = useToaster();
  const solanaWallet = useSolanaWallet();
  const {
    wallet,
    publicKey,
    connected,
    connecting,
    disconnect,
    signTransaction,
    signMessage,
  } = solanaWallet;

  // Connection instance for balance and network operations
  const connection = new Connection(endpoint, 'confirmed');

  // Update connection status based on wallet state
  useEffect(() => {
    if (connecting) {
      setConnectionStatus('connecting');
    } else if (connected && publicKey) {
      setConnectionStatus('connected');
    } else if (error) {
      setConnectionStatus('error');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [connecting, connected, publicKey, error]);

  // Enhanced wallet connection with authentication
  const connectWallet = useCallback(async () => {
    if (!wallet) {
      setError('No wallet selected. Please install a Solana wallet extension.');
      showToast('Please install a Solana wallet extension', 'error');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setConnectionStatus('connecting');
      
      // Connect to wallet (this triggers the wallet connection)
      await wallet.adapter.connect();
      
      if (!publicKey) {
        throw new Error('Failed to get public key from wallet');
      }

      // Create authentication message
      const authMessage = `Welcome to Denft!\n\nSign this message to authenticate your wallet.\n\nTimestamp: ${Date.now()}\nWallet: ${publicKey.toString()}`;
      const encodedMessage = new TextEncoder().encode(authMessage);

      // Sign the message for authentication
      if (!signMessage) {
        throw new Error('Wallet does not support message signing');
      }

      const signature = await signMessage(encodedMessage);

      // Send authentication request to backend
      const authResponse = await fetch('/api/auth/wallet-connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          signature: Array.from(signature),
          message: authMessage,
          walletName: wallet.adapter.name,
          network: currentNetwork,
        }),
      });

      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const authData = await authResponse.json();

      // Store credentials securely
      const tokenData = {
        token: authData.token,
        walletAddress: publicKey.toString(),
        walletName: wallet.adapter.name,
        network: currentNetwork,
        expiresAt: authData.expiresAt,
      };

      localStorage.setItem('denft-auth', JSON.stringify(tokenData));
      setToken(authData.token);
      
      // Fetch initial balance
      await refreshBalance();
      
      setConnectionStatus('connected');
      showToast(`Connected to ${wallet.adapter.name}`, 'success');

    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      const errorMessage = error.message || 'Failed to connect wallet';
      setError(errorMessage);
      setConnectionStatus('error');
      showToast(errorMessage, 'error');
      
      // Cleanup on error
      await disconnect();
    } finally {
      setIsLoading(false);
    }
  }, [wallet, publicKey, signMessage, currentNetwork, showToast, disconnect]);

  // Enhanced disconnect with cleanup
  const disconnectWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Clear backend session if token exists
      if (token) {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.warn('Failed to logout on backend:', error);
        }
      }

      // Disconnect wallet
      await disconnect();
      
      // Clear local state
      setToken(null);
      setBalance(0);
      setError(null);
      setConnectionStatus('disconnected');

      // Clear storage
      localStorage.removeItem('denft-auth');

      showToast('Wallet disconnected', 'info');

    } catch (error: any) {
      console.error('Disconnect error:', error);
      showToast('Error disconnecting wallet', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [disconnect, token, showToast]);

  // Refresh wallet balance
  const refreshBalance = useCallback(async () => {
    if (!publicKey || !connected) return;

    try {
      const balance = await connection.getBalance(publicKey);
      setBalance(balance / 1e9); // Convert lamports to SOL
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  }, [publicKey, connected, connection]);

  // Switch network functionality
  const switchNetwork = useCallback(async (newNetwork: WalletAdapterNetwork) => {
    try {
      setIsLoading(true);
      
      if (connected) {
        // Disconnect current wallet before switching
        await disconnectWallet();
      }
      
      setCurrentNetwork(newNetwork);
      showToast(`Switched to ${newNetwork}`, 'info');
      
    } catch (error: any) {
      setError(error.message || 'Failed to switch network');
      showToast('Failed to switch network', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [connected, disconnectWallet, showToast]);

  // Enhanced sign transaction with error handling
  const signTransactionWrapper = useCallback(async (transaction: Transaction): Promise<Transaction> => {
    if (!signTransaction) {
      throw new Error('Wallet does not support transaction signing');
    }
    
    try {
      setIsLoading(true);
      const signedTransaction = await signTransaction(transaction);
      showToast('Transaction signed successfully', 'success');
      return signedTransaction;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to sign transaction';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [signTransaction, showToast]);

  // Enhanced sign message with error handling
  const signMessageWrapper = useCallback(async (message: Uint8Array): Promise<Uint8Array> => {
    if (!signMessage) {
      throw new Error('Wallet does not support message signing');
    }
    
    try {
      setIsLoading(true);
      const signature = await signMessage(message);
      return signature;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to sign message';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [signMessage, showToast]);

  // Check for existing authentication on mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        const savedAuth = localStorage.getItem('denft-auth');
        
        if (savedAuth) {
          const authData = JSON.parse(savedAuth);
          
          // Check if token is not expired
          if (authData.expiresAt && Date.now() < authData.expiresAt) {
            // Validate token with backend
            const response = await fetch('/api/auth/validate', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${authData.token}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const data = await response.json();
              if (data.valid) {
                setToken(authData.token);
                return;
              }
            }
          }
          
          // Invalid or expired token, clear storage
          localStorage.removeItem('denft-auth');
        }
      } catch (error) {
        console.error('Failed to check existing auth:', error);
        localStorage.removeItem('denft-auth');
      }
    };

    checkExistingAuth();
  }, []);

  // Refresh balance when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      refreshBalance();
      
      // Set up periodic balance refresh
      const balanceInterval = setInterval(refreshBalance, 30000); // Every 30 seconds
      
      return () => clearInterval(balanceInterval);
    }
  }, [connected, publicKey, refreshBalance]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: WalletContextType = {
    isConnected: connected,
    walletAddress: publicKey?.toString() || null,
    publicKey,
    token,
    balance,
    isLoading: isLoading || connecting,
    error,
    walletName: wallet?.adapter.name || null,
    network: currentNetwork,
    connectionStatus,
    connectWallet,
    disconnectWallet,
    signTransaction: signTransactionWrapper,
    signMessage: signMessageWrapper,
    refreshBalance,
    switchNetwork,
    clearError,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// Main wallet provider with Solana wallet adapter setup
export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <WalletProviderInner>
            {children}
          </WalletProviderInner>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};

// Enhanced hook with better error handling
export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};