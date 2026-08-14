import { useState, useEffect } from 'react'
import { PageTransition } from '@/components/ui/page-transition'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useWallet } from '@/contexts/WalletContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useFiles } from '@/contexts/FileContext'
import { User, Palette, Sliders, AlertTriangle, Monitor, Sun, Moon, LogOut, Trash2, Shield } from 'lucide-react'
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react'
import { truncateAddress } from '@/lib/utils'

type ViewMode = 'grid' | 'list'

export function Settings() {
  const { theme, setTheme } = useTheme()
  const { files, bulkOperation, isLoading } = useFiles()
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [isSavingPasscode, setIsSavingPasscode] = useState(false)
  const { hasPasscode, setHasPasscode, showToast, walletAddress, walletName, balance, disconnectWallet, token, refreshTokenFromBackend } = useWallet()
  const { signMessage } = useSolanaWallet()
  const { fetchFiles } = useFiles()

  // Fetch preferences from backend on mount
  useEffect(() => {
    if (!token) return;
    fetch('/api/user/settings', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.data) {
        if (data.data.viewMode) {
          setViewMode(data.data.viewMode);
          localStorage.setItem('denft-view-mode', data.data.viewMode);
        }
        if (data.data.theme) {
          setTheme(data.data.theme);
        }
      }
    })
    .catch(err => console.error("Failed to load settings", err));
  }, [token, setTheme]);

  // Save preferences when they change
  const handleViewModeChange = async (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('denft-view-mode', mode)
    if (token) {
      fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ viewMode: mode })
      }).catch(console.error);
    }
  }

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme as any)
    if (token) {
      fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ theme: newTheme })
      }).catch(console.error);
    }
  }

  const handleSavePasscode = async () => {
    if (passcode && !/^\d{3,6}$/.test(passcode)) {
      showToast('Passcode must be a 3 to 6 digit number', 'error')
      return
    }

    setIsSavingPasscode(true)
    try {
      const res = await fetch('/api/user/passcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ passcode })
      })
      const data = await res.json()
      if (data.success) {
        showToast(passcode ? 'Passcode set successfully' : 'Passcode removed', 'success')
        setHasPasscode(!!passcode)
        setPasscode('')
      } else {
        showToast(data.error || 'Failed to set passcode', 'error')
      }
    } catch (e) {
      showToast('Error setting passcode', 'error')
    } finally {
      setIsSavingPasscode(false)
    }
  }

  const handleDeleteAll = async () => {
    if (files.length === 0) return
    setIsDeleting(true)
    try {
      if (!signMessage) throw new Error("Wallet does not support signing messages");

      const message = `WIPE_VAULT: I authorize the deletion of all my files on Denft. Timestamp: ${new Date().toISOString()}`;
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes);

      let currentToken = token;
      
      const executeWipe = async () => {
        return await fetch('/api/user/danger/wipe-vault', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`
          },
          body: JSON.stringify({
            message,
            signature: Array.from(signature)
          })
        });
      };

      let res = await executeWipe();
      
      if (res.status === 401 && refreshTokenFromBackend) {
        const newToken = await refreshTokenFromBackend();
        if (newToken) {
          currentToken = newToken;
          res = await executeWipe();
        }
      }

      const data = await res.json();
      if (data.success) {
        showToast('Vault wiped successfully. All files deleted.', 'success');
        setShowDeleteConfirm(false);
        await fetchFiles(); // Refetch to clear the UI
      } else {
        const errorMsg = data.error && typeof data.error === 'object' 
          ? data.error.message 
          : data.error;
        throw new Error(errorMsg || 'Failed to wipe vault');
      }
    } catch (error: any) {
      console.error('Failed to wipe vault', error)
      showToast(error.message || 'Failed to wipe vault', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
        {/* Header */}
        <div className="pb-6 border-b border-neutral-800">
          <h1 className="text-3xl font-bold text-neutral-50 tracking-tight mb-2">Settings</h1>
          <p className="text-neutral-400">Manage your account preferences, appearance, and data.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation (Visual Only for now, but good structure) */}
          <div className="md:col-span-1 space-y-1">
            {[
              { id: 'account', label: 'Account', icon: User },
              { id: 'preferences', label: 'Preferences', icon: Sliders },
              { id: 'security', label: 'Security & Privacy', icon: Shield },
              { id: 'appearance', label: 'Appearance', icon: Palette },
              { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, className: 'text-error-400' },
            ].map((item) => (
              <a 
                key={item.id} 
                href={`#${item.id}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-neutral-800 text-neutral-300 ${item.className || ''}`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </a>
            ))}
          </div>

          {/* Main Content */}
          <div className="md:col-span-3 space-y-8">
            
            {/*  ACCOUNT SECTION  */}
            <section id="account" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl font-semibold text-neutral-100 flex items-center gap-2">
                <User className="h-5 w-5 text-primary-400" /> Account
              </h2>
              <Card variant="default">
                <CardBody className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <img
                        src={`https://ui-avatars.com/api/?name=${walletName || 'Wallet'}&background=3B82F6&color=fff`}
                        alt="Avatar"
                        className="w-16 h-16 rounded-full border border-neutral-700"
                      />
                      <div>
                        <h3 className="text-lg font-medium text-neutral-100">{walletName || 'Connected Wallet'}</h3>
                        <p className="text-sm font-mono text-neutral-400 mt-1" title={walletAddress || undefined}>{walletAddress ? truncateAddress(walletAddress) : 'Not connected'}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="success" size="sm">Active</Badge>
                          <span className="text-xs text-neutral-500">{balance.toFixed(4)} SOL</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      leftIcon={<LogOut className="h-4 w-4" />}
                      onClick={disconnectWallet}
                      className="shrink-0"
                    >
                      Disconnect Wallet
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </section>

            {/*  PREFERENCES SECTION  */}
            <section id="preferences" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl font-semibold text-neutral-100 flex items-center gap-2">
                <Sliders className="h-5 w-5 text-accent-400" /> Preferences
              </h2>
              <Card variant="default">
                <CardBody className="p-0 divide-y divide-neutral-800">
                  <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="font-medium text-neutral-200">Default View Mode</h4>
                      <p className="text-sm text-neutral-400 mt-1">Choose how files are displayed in your vault.</p>
                    </div>
                    <div className="flex bg-neutral-900 rounded-lg p-1 border border-neutral-800 shrink-0">
                      <button
                        onClick={() => handleViewModeChange('grid')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          viewMode === 'grid' 
                            ? 'bg-neutral-800 text-neutral-100 shadow-sm' 
                            : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                      >
                        Grid
                      </button>
                      <button
                        onClick={() => handleViewModeChange('list')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          viewMode === 'list' 
                            ? 'bg-neutral-800 text-neutral-100 shadow-sm' 
                            : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                      >
                        List
                      </button>
                    </div>
                  </div>
                  {/* Additional preferences can be added here */}
                </CardBody>
              </Card>
            </section>

            {/* SECURITY SECTION */}
            <section id="security" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl font-semibold text-neutral-100 flex items-center gap-2">
                <Shield className="h-5 w-5 text-success-400" /> Security & Privacy
              </h2>
              <Card variant="default">
                <CardBody className="p-0 divide-y divide-neutral-800">
                  <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1 mr-4">
                      <h4 className="font-medium text-neutral-200">Viewing Passcode</h4>
                      <p className="text-sm text-neutral-400 mt-1">Set a 3-6 digit passcode to lock your files. You will need to enter this passcode before you can view any file contents in the vault.</p>
                      {hasPasscode && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-500/10 text-success-400 text-xs font-medium border border-success-500/20">
                          <Shield className="h-3.5 w-3.5" /> Passcode is currently active
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      <input 
                        type="password" 
                        placeholder="3-6 digits" 
                        maxLength={6}
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))}
                        className="w-28 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-primary-500"
                      />
                      <Button 
                        variant="primary" 
                        onClick={handleSavePasscode}
                        disabled={isSavingPasscode || (passcode.length > 0 && passcode.length < 3)}
                      >
                        {isSavingPasscode ? 'Saving...' : (hasPasscode && !passcode ? 'Remove' : 'Set Passcode')}
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </section>

            {/* APPEARANCE SECTION */}
            <section id="appearance" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl font-semibold text-neutral-100 flex items-center gap-2">
                <Palette className="h-5 w-5 text-warning-400" /> Appearance
              </h2>
              <Card variant="default">
                <CardBody className="p-6">
                  <div>
                    <h4 className="font-medium text-neutral-200">Theme</h4>
                    <p className="text-sm text-neutral-400 mt-1 mb-4">Customize the interface color scheme.</p>
                    
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: 'light', label: 'Light', icon: Sun },
                        { id: 'dark', label: 'Dark', icon: Moon },
                        { id: 'system', label: 'System', icon: Monitor },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleThemeChange(t.id)}
                          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                            theme === t.id 
                              ? 'border-primary-500 bg-primary-500/10 text-primary-400' 
                              : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-800'
                          }`}
                        >
                          <t.icon className="h-6 w-6 mb-2" />
                          <span className="text-sm font-medium">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardBody>
              </Card>
            </section>

            {/*  DANGER ZONE  */}
            <section id="danger" className="space-y-4 scroll-mt-24 pt-4">
              <h2 className="text-xl font-semibold text-error-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Danger Zone
              </h2>
              <Card variant="default" className="border-error-500/30">
                <CardBody className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="font-medium text-neutral-200">Delete All Files</h4>
                      <p className="text-sm text-neutral-400 mt-1 max-w-md">
                        Permanently remove all your files from the vault. This action cannot be undone.
                      </p>
                    </div>
                    <Button 
                      variant="destructive" 
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={files.length === 0 || isLoading}
                      className="shrink-0"
                    >
                      Delete {files.length > 0 ? `(${files.length})` : ''} Files
                    </Button>
                  </div>

                  {/* Inline Confirmation Area */}
                  {showDeleteConfirm && (
                    <div className="mt-6 p-4 rounded-xl border border-error-500/50 bg-error-500/10 animate-fade-in">
                      <p className="text-sm text-error-300 font-medium mb-4">
                        Are you absolutely sure you want to delete all {files.length} files? This will remove them from your storage and the blockchain ledger permanently.
                      </p>
                      <div className="flex items-center gap-3">
                        <Button 
                          variant="destructive" 
                          onClick={handleDeleteAll}
                          isLoading={isDeleting}
                        >
                          Yes, delete everything
                        </Button>
                        <Button 
                          variant="ghost-neutral" 
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={isDeleting}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </section>

          </div>
        </div>
      </div>
    </PageTransition>
  )
}
