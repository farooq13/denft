import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode, useCallback } from 'react';
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
  isAuthReady: boolean;
  error: string | null;
  walletName: string | null;
  network: WalletAdapterNetwork;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  signTransaction: (transaction: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  authenticateWallet: (walletPublicKey: PublicKey, walletName: string, customSignMessage?: (msg: Uint8Array) => Promise<Uint8Array>) => Promise<void>;
  refreshBalance: () => Promise<void>;
  clearError: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  refreshTokenFromBackend: () => Promise<string | null>;
  hasPasscode: boolean;
  setHasPasscode: (hasPasscode: boolean) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

// Network configuration
const network = WalletAdapterNetwork.Devnet;
const endpoint = import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl(network);

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
  const [hasPasscode, setHasPasscode] = useState(false);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  // Ref guard to prevent StrictMode double-mount from triggering concurrent auth
  const authAttemptedRef = useRef(false);
  const authInitCheckedRef = useRef(false);
  
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
      
      // Use the adapter's publicKey as the state might not be updated in this closure yet
      const currentPublicKey = wallet.adapter.publicKey || publicKey;
      
      if (!currentPublicKey) {
        throw new Error('Failed to get wallet public key');
      }

      // Authenticate with backend
      await authenticateWallet(currentPublicKey, wallet.adapter.name);
      
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

  // Authenticate wallet with backend
  const authenticateWallet = async (
    walletPublicKey: PublicKey, 
    walletName: string, 
    customSignMessage?: (msg: Uint8Array) => Promise<Uint8Array>
  ) => {
    const signer = customSignMessage || walletSignMessage;
    if (!signer) {
      throw new Error('Wallet does not support message signing');
    }

    // Step 1: Request Nonce
    const nonceRes = await fetch('/api/auth/nonce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: walletPublicKey.toString() }),
    });

    if (!nonceRes.ok) {
      const errorData = await nonceRes.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to get nonce');
    }

    const { data: { message: authMessage } } = await nonceRes.json();
    const encodedMessage = new TextEncoder().encode(authMessage);

    // Step 2: Sign the message
    const signature = await signer(encodedMessage);

    // Step 3: Send to backend for verification
    const response = await fetch('/api/auth/verify', {
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
      throw new Error(errorData.error?.message || 'Authentication failed');
    }

    const { data: authData } = await response.json();

    // Store authentication data
    const tokenData = {
      token: authData.accessToken,
      walletAddress: walletPublicKey.toString(),
      walletName,
      network,
    };

    localStorage.setItem('denft-auth', JSON.stringify(tokenData));
    setToken(authData.accessToken);
    
    // Fetch user settings
    try {
      const settingsRes = await fetch('/api/user/settings', {
        headers: { 'Authorization': `Bearer ${authData.accessToken}` }
      });
      const settingsData = await settingsRes.json();
      if (settingsData.success) {
        setHasPasscode(settingsData.data.hasPasscode);
      }
    } catch (e) {
      console.warn('Failed to fetch user settings', e);
    }
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

  // Refresh token
  const refreshTokenFromBackend = useCallback(async (): Promise<string | null> => {
    // First, try the cookie-based refresh
    try {
      const response = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
      if (!response.ok) throw new Error('Failed to refresh token');
      
      const data = await response.json();
      const newToken = data.data.accessToken;
      
      setToken(newToken);
      
      const stored = localStorage.getItem('denft-auth');
      if (stored) {
         const parsed = JSON.parse(stored);
         parsed.token = newToken;
         localStorage.setItem('denft-auth', JSON.stringify(parsed));
      }
      
      return newToken;
    } catch (err) {
      console.warn('Cookie refresh failed, attempting full re-authentication...');
    }

    // Fallback: if the wallet is still connected, do a full re-auth silently
    const currentPublicKey = publicKey || wallet?.adapter.publicKey;
    if (currentPublicKey && walletSignMessage && wallet) {
      try {
        await authenticateWallet(currentPublicKey, wallet.adapter.name);
        // authenticateWallet sets the token state and localStorage
        const stored = localStorage.getItem('denft-auth');
        if (stored) {
          return JSON.parse(stored).token;
        }
      } catch (authErr) {
        console.warn('Full re-authentication also failed:', authErr);
      }
    }

    return null;
  }, [publicKey, wallet, walletSignMessage]);

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
    if (wallet && connected && publicKey && !token && isAuthReady) {
      // Guard against StrictMode double-invocation
      if (authAttemptedRef.current) return;
      authAttemptedRef.current = true;

      // If wallet is connected but we don't have auth token, try to authenticate
      authenticateWallet(publicKey, wallet.adapter.name).catch(err => {
        console.error('Auto-authentication failed:', err);
      }).finally(() => {
        // Reset after a delay to allow future re-auth attempts (e.g. after disconnect/reconnect)
        setTimeout(() => { authAttemptedRef.current = false; }, 2000);
      });
    }
  }, [wallet, connected, publicKey, token, isAuthReady]);

  // Check for existing authentication on mount
  useEffect(() => {
    // Guard against StrictMode double-invocation
    if (authInitCheckedRef.current) return;
    authInitCheckedRef.current = true;

    const checkExistingAuth = async () => {
      try {
        const savedAuth = localStorage.getItem('denft-auth');
        
        if (savedAuth) {
          const authData = JSON.parse(savedAuth);
          
          if (authData.token) {
            // Validate token by calling /api/auth/me (which exists, unlike /api/auth/validate)
            try {
              const response = await fetch('/api/auth/me', {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${authData.token}`,
                },
              });

              if (response.ok) {
                const data = await response.json();
                if (data.success) {
                  setToken(authData.token);
                  
                  // Fetch user settings
                  try {
                    const settingsRes = await fetch('/api/user/settings', {
                      headers: { 'Authorization': `Bearer ${authData.token}` }
                    });
                    const settingsData = await settingsRes.json();
                    if (settingsData.success) {
                      setHasPasscode(settingsData.data.hasPasscode);
                    }
                  } catch (e) {
                    console.warn('Failed to fetch user settings on init', e);
                  }
                  return;
                }
              }

              // If token expired (401), try cookie-based refresh before discarding
              if (response.status === 401) {
                try {
                  const refreshRes = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
                  if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    const newToken = refreshData.data.accessToken;
                    setToken(newToken);
                    // Update localStorage
                    authData.token = newToken;
                    localStorage.setItem('denft-auth', JSON.stringify(authData));
                    return;
                  }
                } catch (refreshErr) {
                  console.warn('Cookie refresh during init failed:', refreshErr);
                }
              }
            } catch (err) {
              console.warn('Backend validation failed:', err);
            }
          }
          
          // Invalid or expired token and refresh failed
          localStorage.removeItem('denft-auth');
        }
      } catch (err) {
        console.error('Failed to check existing auth:', err);
        localStorage.removeItem('denft-auth');
      } finally {
        setIsAuthReady(true);
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
    isAuthReady,
    error,
    walletName: wallet?.adapter.name || null,
    network,
    connectionStatus,
    connectWallet,
    disconnectWallet,
    signTransaction,
    signMessage,
    authenticateWallet,
    refreshBalance,
    clearError,
    showToast,
    refreshTokenFromBackend,
    hasPasscode,
    setHasPasscode,
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