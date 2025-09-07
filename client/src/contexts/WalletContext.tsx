import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
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
  AlphaWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';

// Import CSS for wallet adapter
import '@solana/wallet-adapter-react-ui/styles.css';

// Simple wallet interface
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
  disconnectWallet: () => Promise<void>;
  signTransaction: (transaction: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  refreshBalance: () => Promise<void>;
  clearError: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

// Network configuration
const network = WalletAdapterNetwork.Devnet;
const endpoint = clusterApiUrl(network);

// Supported wallet adapters
const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  new AlphaWalletAdapter(),
  new TorusWalletAdapter(),
];

// Toast functionality (simple implementation)
const useToast = () => {
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    // Simple toast implementation - you can replace with your preferred toast library
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Create a simple DOM notification
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white font-medium transition-opacity duration-300 ${
      type === 'success' ? 'bg-green-500' :
      type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }, []);

  return { showToast };
};

// Main wallet provider component
const WalletProviderInner: React.FC<WalletProviderProps> = ({ children }) => {
  // State management
  const [token, setToken] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  const { showToast } = useToast();
  
  // Use Solana wallet adapter
  const {
    wallet,
    publicKey,
    connected,
    connecting,
    connect,
    disconnect,
    signTransaction: walletSignTransaction,
    signMessage: walletSignMessage,
  } = useSolanaWallet();

  // Solana connection
  const connection = new Connection(endpoint, 'confirmed');

  // Update connection status based on wallet state
  useEffect(() => {
    if (connecting || isLoading) {
      setConnectionStatus('connecting');
    } else if (connected && publicKey) {
      setConnectionStatus('connected');
    } else if (error) {
      setConnectionStatus('error');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [connecting, connected, publicKey, error, isLoading]);

  // Connect wallet function
  const connectWallet = useCallback(async () => {
    if (!wallet) {
      const errorMsg = 'Please select a wallet first';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Connect to the selected wallet
      await connect();
      
      if (!publicKey) {
        throw new Error('Failed to get wallet public key');
      }

      // Authenticate with backend (optional)
      try {
        await authenticateWallet(publicKey, wallet.adapter.name);
      } catch (authError) {
        console.warn('Authentication failed, continuing without backend auth:', authError);
      }
      
      // Get initial balance
      await refreshBalance();
      
      showToast(`Connected to ${wallet.adapter.name}`, 'success');

    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      const errorMessage = err.message || 'Failed to connect wallet';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [wallet, connect, publicKey, showToast]);

  // Disconnect wallet function
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
        } catch (err) {
          console.warn('Failed to logout on backend:', err);
        }
      }

      // Disconnect from wallet
      await disconnect();
      
      // Clear local state
      setToken(null);
      setBalance(0);
      setError(null);

      // Clear localStorage
      localStorage.removeItem('denft-auth');

      showToast('Wallet disconnected', 'info');

    } catch (err: any) {
      console.error('Disconnect error:', err);
      showToast('Error disconnecting wallet', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [disconnect, token, showToast]);

  // Authenticate wallet with backend (optional)
  const authenticateWallet = async (walletPublicKey: PublicKey, walletName: string) => {
    if (!walletSignMessage) {
      throw new Error('Wallet does not support message signing');
    }

    // Create authentication message
    const authMessage = `Welcome to Denft!\n\nSign this message to authenticate your wallet.\n\nTimestamp: ${Date.now()}\nWallet: ${walletPublicKey.toString()}`;
    const encodedMessage = new TextEncoder().encode(authMessage);

    // Sign the message
    const signature = await walletSignMessage(encodedMessage);

    // Send to backend for verification
    const response = await fetch('/api/auth/wallet-connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: walletPublicKey.toString(),
        signature: Array.from(signature),
        message: authMessage,
        walletName,
        network,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Authentication failed');
    }

    const authData = await response.json();

    // Store authentication data
    const tokenData = {
      token: authData.token,
      walletAddress: walletPublicKey.toString(),
      walletName,
      network,
      expiresAt: authData.expiresAt,
    };

    localStorage.setItem('denft-auth', JSON.stringify(tokenData));
    setToken(authData.token);
  };

  // Sign transaction
  const signTransaction = useCallback(async (transaction: Transaction | VersionedTransaction) => {
    try {
      setIsLoading(true);

      if (!walletSignTransaction) {
        throw new Error('Wallet does not support transaction signing');
      }

      const signedTransaction = await walletSignTransaction(transaction);
      showToast('Transaction signed successfully', 'success');
      return signedTransaction;

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sign transaction';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [walletSignTransaction, showToast]);

  // Sign message
  const signMessage = useCallback(async (message: Uint8Array): Promise<Uint8Array> => {
    try {
      setIsLoading(true);

      if (!walletSignMessage) {
        throw new Error('Wallet does not support message signing');
      }

      const signature = await walletSignMessage(message);
      return signature;

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sign message';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [walletSignMessage, showToast]);

  // Refresh wallet balance
  const refreshBalance = useCallback(async () => {
    if (!publicKey || !connected) return;

    try {
      const walletBalance = await connection.getBalance(publicKey);
      setBalance(walletBalance / 1e9); // Convert lamports to SOL
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  }, [publicKey, connected, connection]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-connect when wallet becomes available
  useEffect(() => {
    if (wallet && connected && publicKey && !token) {
      // If wallet is connected but we don't have auth token, try to authenticate
      authenticateWallet(publicKey, wallet.adapter.name).catch(err => {
        console.error('Auto-authentication failed:', err);
      });
    }
  }, [wallet, connected, publicKey, token]);

  // Check for existing authentication on mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        const savedAuth = localStorage.getItem('denft-auth');
        
        if (savedAuth) {
          const authData = JSON.parse(savedAuth);
          
          // Check if token is not expired
          if (authData.expiresAt && Date.now() < authData.expiresAt) {
            // Validate with backend
            try {
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
            } catch (err) {
              console.warn('Backend validation failed:', err);
            }
          }
          
          // Invalid or expired token
          localStorage.removeItem('denft-auth');
        }
      } catch (err) {
        console.error('Failed to check existing auth:', err);
        localStorage.removeItem('denft-auth');
      }
    };

    checkExistingAuth();
  }, []);

  // Update balance when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      refreshBalance();
      
      // Set up balance refresh interval
      const balanceInterval = setInterval(refreshBalance, 30000); // Every 30 seconds
      
      return () => clearInterval(balanceInterval);
    }
  }, [connected, publicKey, refreshBalance]);

  // Clear error when wallet changes
  useEffect(() => {
    if (wallet) {
      setError(null);
    }
  }, [wallet]);

  // Context value
  const value: WalletContextType = {
    isConnected: connected,
    walletAddress: publicKey?.toString() || null,
    publicKey,
    token,
    balance,
    isLoading: isLoading || connecting,
    error,
    walletName: wallet?.adapter.name || null,
    network,
    connectionStatus,
    connectWallet,
    disconnectWallet,
    signTransaction,
    signMessage,
    refreshBalance,
    clearError,
    showToast,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// Main wallet provider with all the Solana setup
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

// Hook to use wallet context
export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};