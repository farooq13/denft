import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Cloud,
  Upload,
  LayoutDashboard,
  Settings,
  Files,
  LogOut,
  Copy,
  Check,
  ExternalLink,
  Sun,
  Moon,
  Monitor,
  Menu,
  X,
  Wallet,
  ChevronDown,
} from 'lucide-react'
import { useWallet } from '@/contexts/WalletContext'
import { useFiles } from '@/contexts/FileContext'
import { useTheme } from '@/contexts/ThemeContext'
import { WalletButton } from '@/components/wallet/WalletButton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { truncateAddress, copyToClipboard } from '@/lib/utils'
import { STORAGE_KEYS } from '@/lib/constants'

type Theme = 'light' | 'dark' | 'system'

//  Nav item definitions 
const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', protected: true },
  { href: '/upload',    label: 'Upload',    protected: true },
  { href: '/files',     label: 'My Vault',  protected: true },
  { href: '/explore',   label: 'Explore',   protected: false },
  { href: '/settings',  label: 'Settings',  protected: true },
] as const

//  Sub-components 

/** Active-route link with aria-current */
function NavLink({
  href,
  label,
  isActive,
  onClick,
  className,
}: {
  href: string
  label: string
  // icon: React.ElementType
  isActive: boolean
  onClick?: () => void
  className?: string
}) {
  return (
    <Link
      to={href}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium',
        'transition-colors duration-sm',
        isActive
          ? 'bg-primary-500/15 text-primary-400 border border-primary-500/30'
          : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800',
        className
      )}
    >
      {/* <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> */}
      {label}
    </Link>
  )
}

/** Theme toggle button — cycles light → dark → system */
function ThemeMenu({
  theme,
  setTheme,
}: {
  theme: Theme
  setTheme: (t: Theme) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const options: { value: Theme; label: string; icon: React.ElementType }[] = [
    { value: 'light',  label: 'Light',  icon: Sun },
    { value: 'dark',   label: 'Dark',   icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  const CurrentIcon =
    theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost-neutral"
        size="icon-sm"
        onClick={() => setOpen(v => !v)}
        aria-label={`Theme: ${theme}. Click to change.`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <CurrentIcon className="h-4 w-4" aria-hidden="true" />
      </Button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute right-0 top-full mt-2 w-36 z-50',
            'rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl py-1',
            'animate-scale-in origin-top-right'
          )}
        >
          {options.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              role="menuitem"
              type="button"
              onClick={() => { setTheme(value); setOpen(false) }}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors',
                theme === value
                  ? 'text-primary-400 bg-primary-500/10'
                  : 'text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {label}
              {theme === value && (
                <Check className="h-3 w-3 ml-auto text-primary-400" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Connected wallet dropdown */
function WalletMenu({
  walletAddress,
  walletName,
  balance,
  filesCount,
  onDisconnect,
}: {
  walletAddress: string
  walletName: string
  balance: number
  filesCount: number
  onDisconnect: () => void
}) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleCopy = async () => {
    const ok = await copyToClipboard(walletAddress)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Wallet menu — ${truncateAddress(walletAddress)}`}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg',
          'text-sm font-medium transition-colors duration-sm',
          'border border-primary-500/30 bg-primary-500/10 text-primary-400',
          'hover:border-primary-500/60 hover:bg-primary-500/15',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
        )}
      >
        <Wallet className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline font-mono text-xs">
          {truncateAddress(walletAddress)}
        </span>
        <ChevronDown
          className={cn('h-3 w-3 transition-transform duration-sm', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute right-0 top-full mt-2 w-64 z-50',
            'rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl',
            'animate-scale-in origin-top-right overflow-hidden'
          )}
        >
          {/* Wallet info header */}
          <div className="px-4 py-3 border-b border-neutral-800">
            <p className="text-sm font-semibold text-neutral-100 truncate">{walletName}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs text-neutral-400 truncate">
                {truncateAddress(walletAddress, 6)}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                aria-label={copied ? 'Copied!' : 'Copy wallet address'}
                className="text-neutral-500 hover:text-neutral-300 transition-colors shrink-0"
              >
                {copied
                  ? <Check className="h-3 w-3 text-success-500" aria-hidden="true" />
                  : <Copy className="h-3 w-3" aria-hidden="true" />
                }
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="px-4 py-3 grid grid-cols-2 gap-3 border-b border-neutral-800">
            <div>
              <p className="text-xs text-neutral-500">Balance</p>
              <p className="text-sm font-semibold text-neutral-100">
                {balance.toFixed(4)} <span className="text-neutral-400 font-normal">SOL</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Files</p>
              <p className="text-sm font-semibold text-neutral-100">{filesCount}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="p-2">
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              role="menuitem"
              className={cn(
                'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm mb-1',
                'text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 transition-colors'
              )}
            >
              <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
              Settings
            </Link>

            <a
              href={`https://explorer.solana.com/address/${walletAddress}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              className={cn(
                'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm',
                'text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 transition-colors'
              )}
            >
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
              View on Explorer
            </a>

            <button
              type="button"
              role="menuitem"
              onClick={() => { onDisconnect(); setOpen(false) }}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm mt-1',
                'text-error-400 hover:text-error-300 hover:bg-error-500/10 transition-colors'
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              Disconnect Wallet
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

//  Main Navbar 

export function Navbar() {
  const location = useLocation()
  const navigate  = useNavigate()
  const { isConnected, walletAddress, balance, disconnectWallet, walletName } = useWallet()
  const { files } = useFiles()
  const { theme, setTheme, toggleTheme } = useTheme()

  const [isScrolled,      setIsScrolled]      = useState(false)
  const [mobileMenuOpen,  setMobileMenuOpen]  = useState(false)

  // Scroll-aware border
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  const isActive = (href: string) => location.pathname === href

  // Theme cycling for simple toggle (mobile uses full picker)
  void toggleTheme
  void navigate

  return (
    <>
      {/*  Desktop / Tablet Navbar  */}
      <nav
        role="navigation"
        aria-label="Main navigation"
        className={cn(
          'h-16 flex items-center justify-between',
          'px-4 md:px-6 lg:px-8',
          'bg-neutral-900/95 backdrop-blur-xl',
          'border-b transition-colors duration-sm',
          isScrolled
            ? 'border-neutral-700/80 shadow-lg shadow-black/20'
            : 'border-neutral-800/50'
        )}
      >
        {/*  Left: Logo + Desktop Nav  */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-md"
            aria-label="Denft — Home"
          >
            <div className="relative">
              <Cloud className="h-7 w-7 group-hover:text-primary-300 transition-colors duration-sm" aria-hidden="true" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-primary-500 to-primary-500 animate-pulse-sm" aria-hidden="true" />
            </div>
            <span className="font-bold text-xl">Denft</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-1" role="list">
            {NAV_ITEMS.map(item => {
              if (item.protected && !isConnected) return null
              return (
                <div key={item.href} role="listitem">
                  <NavLink
                    href={item.href}
                    label={item.label}
                    isActive={isActive(item.href)}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Right: Theme + Wallet + Hamburger  */}
        <div className="flex items-center gap-2">
          {/* Theme menu */}
          <ThemeMenu theme={theme as Theme} setTheme={setTheme} />

          {/* Wallet: connected state → WalletMenu, else → WalletButton */}
          <div className="hidden sm:block">
            {isConnected && walletAddress ? (
              <WalletMenu
                walletAddress={walletAddress}
                walletName={walletName ?? 'Wallet'}
                balance={balance}
                filesCount={files.length}
                onDisconnect={disconnectWallet}
              />
            ) : (
              <WalletButton />
            )}
          </div>

          {/* Hamburger — tablet & mobile */}
          <Button
            variant="ghost-neutral"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(v => !v)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen
              ? <X     className="h-5 w-5" aria-hidden="true" />
              : <Menu  className="h-5 w-5" aria-hidden="true" />
            }
          </Button>
        </div>
      </nav>

      {/* Mobile Menu Backdrop  */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer  */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={cn(
          'fixed top-0 right-0 h-full w-72 z-50 lg:hidden',
          'bg-neutral-950 border-l border-neutral-800',
          'flex flex-col',
          'transform transition-transform duration-base ease-in-out',
          'shadow-2xl',
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-neutral-800 shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Cloud className="h-6 w-6 text-primary-400" aria-hidden="true" />
            <span className="font-bold text-lg gradient-text">Denft</span>
          </Link>
          <Button
            variant="ghost-neutral"
            size="icon-sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        {/* Drawer nav links */}
        <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map(item => {
            if (item.protected && !isConnected) return null
            return (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                // icon={item.icon}
                isActive={isActive(item.href)}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 px-4 text-base"
              />
            )
          })}

          {/* If not connected, show a connect hint */}
          {!isConnected && (
            <p className="text-xs text-neutral-500 px-4 pt-2">
              Connect your wallet to access Dashboard, Upload, and My Vault.
            </p>
          )}
        </nav>

        {/* Drawer footer: Theme + Wallet */}
        <div className="shrink-0 px-3 py-4 border-t border-neutral-800 space-y-3">
          {/* Theme section */}
          <div className="flex items-center justify-between px-2">
            <span className="text-sm text-neutral-400">Theme</span>
            <div className="flex items-center gap-1">
              {(['light', 'dark', 'system'] as Theme[]).map(t => {
                const Icon = t === 'light' ? Sun : t === 'dark' ? Moon : Monitor
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    aria-label={`Set ${t} theme`}
                    aria-pressed={theme === t}
                    className={cn(
                      'p-2 rounded-md transition-colors duration-sm',
                      theme === t
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Wallet section */}
          {isConnected && walletAddress ? (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary-400 shrink-0" aria-hidden="true" />
                <span className="font-mono text-xs text-neutral-400 truncate">
                  {truncateAddress(walletAddress, 8)}
                </span>
              </div>
              <p className="text-sm font-semibold text-neutral-100">
                {balance.toFixed(4)} <span className="text-neutral-400 text-xs font-normal">SOL</span>
              </p>
              <button
                type="button"
                onClick={() => { disconnectWallet(); setMobileMenuOpen(false) }}
                className="flex items-center gap-2 text-sm text-error-400 hover:text-error-300 transition-colors w-full pt-1"
              >
                <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                Disconnect Wallet
              </button>
            </div>
          ) : (
            <div className="px-1">
              <WalletButton />
            </div>
          )}

          {/* App version */}
          <p className="text-xs text-neutral-600 px-2">
            Denft — Decentralized Storage
          </p>
        </div>
      </div>

     
    </>
  )
}

// Also export as named export matching the old name for backward compat
export { Navbar as default }

// Keep localStorage theme key in sync with constants
void STORAGE_KEYS