import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { Web3AuthNoModal } from '@web3auth/no-modal';
import { AuthAdapter } from '@web3auth/auth-adapter';
import { SolanaPrivateKeyProvider } from '@web3auth/solana-provider';
import { CHAIN_NAMESPACES, WALLET_ADAPTERS } from '@web3auth/base';
import type { IProvider } from '@web3auth/base';
import { useWallet } from './WalletContext';

interface Web3AuthContextType {
  web3auth: Web3AuthNoModal | null;
  isLoading: boolean;
  loginWithSocial: (provider: 'google' | 'twitter' | 'github') => Promise<Web3AuthSocialResult | undefined>;
  logout: () => Promise<void>;
}

/**
 * The result returned after a successful social login.
 * Contains the wallet address and a signer function that the
 * WalletContext can use for backend SIWS authentication.
 */
export interface Web3AuthSocialResult {
  /** Base58-encoded Solana public key derived from the social account */
  address: string;
  /** Signs an arbitrary message using the Web3Auth Solana wallet */
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
}

const Web3AuthContext = createContext<Web3AuthContextType | undefined>(undefined);

const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID || 'BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiIQFACvvPvwb1pL1E1w318GIXxHdbw9jHkUo';

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  chainId: '0x3', // Devnet
  rpcTarget: 'https://api.devnet.solana.com',
  displayName: 'Solana Devnet',
  blockExplorerUrl: 'https://explorer.solana.com/?cluster=devnet',
  ticker: 'SOL',
  tickerName: 'Solana',
};

export const Web3AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use existing wallet context functions to show toast
  const { showToast } = useWallet();

  useEffect(() => {
    const init = async () => {
      try {
        console.log('Web3Auth init: Starting initialization...');
        
        console.log('Web3Auth init: Creating SolanaPrivateKeyProvider...');
        const privateKeyProvider = new SolanaPrivateKeyProvider({
          config: { chainConfig },
        });

        console.log('Web3Auth init: Creating Web3AuthNoModal instance...');
        const web3authInstance = new Web3AuthNoModal({
          clientId,
          web3AuthNetwork: 'sapphire_devnet',
          privateKeyProvider, // Missing in v9 constructor options
        });

        console.log('Web3Auth init: Creating AuthAdapter...');
        // v9 API: configure the auth adapter with the private key provider
        const authAdapter = new AuthAdapter({
          privateKeyProvider,
          adapterSettings: {
            uxMode: 'popup',
          },
        });
        
        console.log('Web3Auth init: Configuring adapter...');
        web3authInstance.configureAdapter(authAdapter);

        console.log('Web3Auth init: Calling web3authInstance.init()...');
        await web3authInstance.init();
        
        console.log('Web3Auth init: Initialization successful, setting state.');
        setWeb3auth(web3authInstance);
      } catch (error) {
        console.error('Error initializing Web3Auth details:', error);
      }
    };
    init();
  }, []);

  const loginWithSocial = useCallback(async (loginProvider: 'google' | 'twitter' | 'github'): Promise<Web3AuthSocialResult | undefined> => {
    if (!web3auth) {
      showToast('Web3Auth is not initialized yet', 'error');
      return;
    }
    try {
      setIsLoading(true);

      // v9 API: connectTo with WALLET_ADAPTERS.AUTH and loginProvider string
      const web3authProvider = await web3auth.connectTo(WALLET_ADAPTERS.AUTH, {
        loginProvider,
      });

      if (!web3authProvider) {
        throw new Error('Web3Auth login failed — no provider returned');
      }

      // Extract Solana wallet from the v9 provider
      const { SolanaWallet } = await import('@web3auth/solana-provider');
      const solanaWallet = new SolanaWallet(web3authProvider as IProvider);
      const accounts = await solanaWallet.requestAccounts();

      if (!accounts || accounts.length === 0) {
        throw new Error('No Solana account found');
      }

      const address = accounts[0];

      // Build signMessage function
      const signMessage = async (message: Uint8Array): Promise<Uint8Array> => {
        return await solanaWallet.signMessage(message);
      };

      return { address, signMessage };

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
    } catch (error) {
      console.error('Logout error', error);
    }
  }, [web3auth]);

  return (
    <Web3AuthContext.Provider value={{ web3auth, isLoading, loginWithSocial, logout }}>
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
