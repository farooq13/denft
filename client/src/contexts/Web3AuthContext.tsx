import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { Web3AuthNoModal } from '@web3auth/no-modal';
import { SolanaPrivateKeyProvider } from '@web3auth/solana-provider';
import { useWallet } from './WalletContext';

interface Web3AuthContextType {
  web3auth: Web3AuthNoModal | null;
  provider: any | null;
  isLoading: boolean;
  loginWithSocial: (provider: 'google' | 'twitter' | 'github') => Promise<any>;
  logout: () => Promise<void>;
}

const Web3AuthContext = createContext<Web3AuthContextType | undefined>(undefined);

const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID || 'BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiIQFACvvPvwb1pL1E1w318GIXxHdbw9jHkUo';

const chainConfig = {
  chainNamespace: 'solana' as const,
  chainId: '0x3', // Devnet
  rpcTarget: 'https://api.devnet.solana.com',
  displayName: 'Solana Devnet',
  blockExplorer: 'https://explorer.solana.com/?cluster=devnet',
  ticker: 'SOL',
  tickerName: 'Solana',
};

// Map our UI provider names to the Web3Auth v9+ API parameters.
// `authConnection` = the provider type (e.g. "google")
// `authConnectionId` = the ID you set in the Web3Auth Dashboard (only needed for custom connections)
// Twitter & GitHub use built-in defaults, so no authConnectionId is needed.
const AUTH_CONNECTION_MAP: Record<string, { authConnection: string; authConnectionId?: string }> = {
  google: { authConnection: 'google', authConnectionId: 'denft-google-web3auth' },
  twitter: { authConnection: 'twitter' },
  github: { authConnection: 'github' },
};

export const Web3AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null);
  const [provider, setProvider] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use existing wallet context functions to show toast
  const { showToast } = useWallet();

  useEffect(() => {
    const init = async () => {
      try {
        const privateKeyProvider = new SolanaPrivateKeyProvider({ config: { chainConfig } });
        
        const web3authInstance = new Web3AuthNoModal({
          clientId,
          web3AuthNetwork: 'sapphire_devnet',
          privateKeyProvider: privateKeyProvider as any,
        });

        setWeb3auth(web3authInstance);

        await web3authInstance.init();
        if (web3authInstance.provider) {
          setProvider(web3authInstance.provider);
        }
      } catch (error) {
        console.error('Error initializing Web3Auth', error);
      }
    };
    init();
  }, []);

  const loginWithSocial = useCallback(async (loginProvider: 'google' | 'twitter' | 'github') => {
    if (!web3auth) {
      showToast('Web3Auth is not initialized yet', 'error');
      return;
    }
    try {
      setIsLoading(true);
      const connectionParams = AUTH_CONNECTION_MAP[loginProvider];
      const web3authProvider = await web3auth.connectTo('auth', {
        authConnection: connectionParams.authConnection,
        authConnectionId: connectionParams.authConnectionId,
      } as any);
      setProvider(web3authProvider);
      return web3authProvider;
    } catch (error: any) {
      console.error('Login failed:', error);
      showToast(error.message || 'Social login failed', 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [web3auth, showToast]);

  const logout = useCallback(async () => {
    if (!web3auth) return;
    try {
      await web3auth.logout();
      setProvider(null);
    } catch (error) {
      console.error('Logout error', error);
    }
  }, [web3auth]);

  return (
    <Web3AuthContext.Provider value={{ web3auth, provider, isLoading, loginWithSocial, logout }}>
      {children}
    </Web3AuthContext.Provider>
  );
};

export const useWeb3Auth = () => {
  const context = useContext(Web3AuthContext);
  if (context === undefined) {
    throw new Error('useWeb3Auth must be used within a Web3AuthProvider');
  }
  return context;
};

