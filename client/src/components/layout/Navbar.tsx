import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Chip,
} from '@heroui/react';
import {
  Cloud,
  Upload,
  Shield,
  Files,
  Share2,
  User,
  LogOut,
  Copy,
  ExternalLink,
  Sun,
  Moon,
  Monitor,
  Bell,
  Search,
  Menu,
  X,
} from 'lucide-react';
import { useWallet } from '../../contexts/WalletContext';
import { useFiles } from '../../contexts/FileContext';
import { useTheme } from '../../contexts/ThemeContext';
import { WalletButton } from '../wallet/WalletButton';

// Define Theme type
type Theme = 'light' | 'dark' | 'system';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isConnected, walletAddress, balance, disconnectWallet, walletName } = useWallet();
  const { files } = useFiles();
  const { theme, setTheme } = useTheme();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications] = useState(3); // Mock notification count
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle scroll effect for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigation items configuration
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Files, protected: true },
    { href: '/upload', label: 'Upload', icon: Upload, protected: true },
    { href: '/files', label: 'My Files', icon: Files, protected: true },
    { href: '/shared', label: 'Shared', icon: Share2, protected: true },
    { href: '/verify', label: 'Verify', icon: Shield, protected: false },
  ];

  // Copy wallet address to clipboard
  const copyWalletAddress = async () => {
    if (walletAddress) {
      await navigator.clipboard.writeText(walletAddress);
      // You would show a toast here
    }
  };

  // Format wallet address for display
  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Get current page title
  const getCurrentPageTitle = () => {
    const currentItem = navItems.find(item => item.href === location.pathname);
    return currentItem?.label || 'Denft';
  };

  // Handle theme change - moved logic to apply globally
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  // Apply theme globally on component mount and theme change
  useEffect(() => {
    const applyTheme = (themeToApply: Theme) => {
      // Remove existing theme classes
      document.documentElement.classList.remove('light', 'dark');
      
      if (themeToApply === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.setAttribute('data-theme', 'light');
        document.body.style.backgroundColor = '#ffffff';
        document.body.style.color = '#1e293b';
      } else if (themeToApply === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.style.backgroundColor = '#0f172a';
        document.body.style.color = '#ffffff';
      } else {
        // System theme
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.classList.add(systemTheme);
        document.documentElement.setAttribute('data-theme', systemTheme);
        if (systemTheme === 'dark') {
          document.body.style.backgroundColor = '#0f172a';
          document.body.style.color = '#ffffff';
        } else {
          document.body.style.backgroundColor = '#ffffff';
          document.body.style.color = '#1e293b';
        }
      }
    };

    applyTheme(theme);

    // Listen for system theme changes when theme is 'system'
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <HeroUINavbar
        isBordered={false}
        maxWidth="full"
        className={`transition-all duration-300 ${
          isScrolled 
            ? 'bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 shadow-lg' 
            : theme === 'light' 
              ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/50' 
              : 'bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50'
        }`}
        classNames={{
          wrapper: "px-4 sm:px-6 max-w-7xl mx-auto",
          brand: theme === 'light' ? "text-slate-900" : "text-white",
          content: theme === 'light' ? "text-slate-900" : "text-white",
          item: theme === 'light' ? "text-slate-900" : "text-white",
        }}
        height="4rem"
      >
        {/* Left Section - Brand and Navigation */}
        <NavbarContent className="gap-2" justify="start">
          {/* Mobile Menu Toggle - Only visible on mobile */}
          <div className="md:hidden">
            <Button
              variant="light"
              isIconOnly
              className={`${
                theme === 'light' ? 'text-slate-900 hover:text-blue-600' : 'text-white hover:text-blue-400'
              } transition-colors p-0 min-w-8 w-8 h-8`}
              onPress={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Brand - Always visible */}
          <NavbarBrand className="mr-4 sm:mr-8">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group" onClick={closeMobileMenu}>
              <div className="relative">
                <Cloud className="w-7 sm:w-10 h-7 sm:h-10 text-blue-400 group-hover:text-blue-300 transition-all duration-300 group-hover:scale-110" />
                <div className="absolute -top-1 -right-1 w-2 sm:w-4 h-2 sm:h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg sm:text-2xl bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Denft
                </span>
                <span className={`text-xs -mt-1 hidden sm:block ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                  Decentralized Storage
                </span>
              </div>
            </Link>
          </NavbarBrand>

          {/* Desktop Navigation Items - Hidden on mobile */}
          <div className="hidden md:flex gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              if (item.protected && !isConnected) return null;

              return (
                <NavbarItem key={item.href} isActive={isActive}>
                  <Link
                    to={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 group ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30'
                        : theme === 'light'
                          ? 'text-slate-700 hover:text-blue-600 hover:bg-slate-100'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    } ${
                      isActive 
                        ? theme === 'light' ? 'text-blue-600' : 'text-white'
                        : ''
                    }`}
                  >
                    <Icon className={`w-4 h-4 transition-all duration-300 ${
                      isActive ? 'text-blue-400' : 'group-hover:text-blue-400'
                    }`} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </NavbarItem>
              );
            })}
          </div>
        </NavbarContent>

        {/* Right Section - Search, Theme, Notifications, Wallet */}
        <NavbarContent justify="end" className="gap-2 sm:gap-4">
          {/* Search Bar (desktop only) */}
          <NavbarItem className="hidden lg:flex">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                theme === 'light' ? 'text-slate-400' : 'text-slate-400'
              }`} />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 pr-4 py-2 w-64 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                  theme === 'light'
                    ? 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-500'
                    : 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-400'
                }`}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/files?search=${encodeURIComponent(searchQuery)}`);
                  }
                }}
              />
            </div>
          </NavbarItem>

          {/* Theme Toggle */}
          <NavbarItem>
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button
                  variant="light"
                  size="sm"
                  className={`min-w-8 w-8 h-8 ${
                    theme === 'light' 
                      ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                  isIconOnly
                >
                  {theme === 'light' && <Sun className="w-4 h-4" />}
                  {theme === 'dark' && <Moon className="w-4 h-4" />}
                  {theme === 'system' && <Monitor className="w-4 h-4" />}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                variant="faded"
                aria-label="Theme selection"
                className="w-36"
                selectedKeys={new Set([theme])}
                selectionMode="single"
                onSelectionChange={(keys) => {
                  const selectedTheme = Array.from(keys)[0] as Theme;
                  if (selectedTheme) {
                    handleThemeChange(selectedTheme);
                  }
                }}
              >
                <DropdownItem key="light" startContent={<Sun className="w-4 h-4" />}>
                  Light
                </DropdownItem>
                <DropdownItem key="dark" startContent={<Moon className="w-4 h-4" />}>
                  Dark
                </DropdownItem>
                <DropdownItem key="system" startContent={<Monitor className="w-4 h-4" />}>
                  System
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarItem>

          {/* Notifications */}
          {isConnected && (
            <NavbarItem>
              <Button
                variant="light"
                size="sm"
                className={`min-w-8 w-8 h-8 relative ${
                  theme === 'light' 
                    ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
                isIconOnly
                onPress={() => navigate('/notifications')}
              >
                <Bell className="w-4 h-4" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </Button>
            </NavbarItem>
          )}

          {/* Wallet Section */}
          <NavbarItem>
            {isConnected ? (
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group">
                    <div className="hidden sm:flex flex-col items-end">
                      <span className={`text-sm font-medium ${
                        theme === 'light' ? 'text-slate-900' : 'text-white'
                      }`}>
                        {balance.toFixed(4)} SOL
                      </span>
                      <span className={`text-xs ${
                        theme === 'light' ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        {formatWalletAddress(walletAddress!)}
                      </span>
                    </div>
                    <div className="relative">
                      <Avatar
                        size="sm"
                        src={`https://ui-avatars.com/api/?name=${walletName}&background=3B82F6&color=fff`}
                        className="ring-2 ring-blue-500/30 group-hover:ring-blue-400/50 transition-all duration-300"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
                    </div>
                  </div>
                </DropdownTrigger>
                <DropdownMenu
                  variant="faded"
                  aria-label="Profile actions"
                  className="w-64"
                >
                  <DropdownItem
                    key="wallet-info"
                    className="h-14 gap-2"
                    textValue="Wallet Info"
                  >
                    <div className="flex flex-col">
                      <p className="font-semibold text-foreground">{walletName}</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-small text-default-500 font-mono">
                          {formatWalletAddress(walletAddress!)}
                        </p>
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          className="w-6 h-6 min-w-6"
                          onPress={copyWalletAddress}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </DropdownItem>
                  
                  <DropdownItem
                    key="balance"
                    className="gap-2"
                    textValue="Balance"
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-default-600">Balance</span>
                      <Chip size="sm" variant="flat" color="primary">
                        {balance.toFixed(4)} SOL
                      </Chip>
                    </div>
                  </DropdownItem>

                  <DropdownItem
                    key="storage"
                    className="gap-2"
                    textValue="Storage"
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-default-600">Files Stored</span>
                      <Chip size="sm" variant="flat" color="secondary">
                        {files.length}
                      </Chip>
                    </div>
                  </DropdownItem>

                  <DropdownItem key="divider" className="p-0">
                    <div className="border-t border-divider my-1" />
                  </DropdownItem>

                  <DropdownItem
                    key="profile"
                    startContent={<User className="w-4 h-4" />}
                    onPress={() => navigate('/profile')}
                  >
                    Profile Settings
                  </DropdownItem>

                  <DropdownItem
                    key="explorer"
                    startContent={<ExternalLink className="w-4 h-4" />}
                    onPress={() => window.open(`https://explorer.solana.com/address/${walletAddress}?cluster=devnet`, '_blank')}
                  >
                    View on Explorer
                  </DropdownItem>

                  <DropdownItem
                    key="disconnect"
                    color="danger"
                    startContent={<LogOut className="w-4 h-4" />}
                    onPress={disconnectWallet}
                  >
                    Disconnect Wallet
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            ) : (
              <WalletButton />
            )}
          </NavbarItem>
        </NavbarContent>
      </HeroUINavbar>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeMobileMenu} />
      )}

      {/* Mobile Menu */}
      <div className={`fixed top-0 left-0 h-full w-80 backdrop-blur-xl border-r transform transition-transform duration-300 z-50 md:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } ${
        theme === 'light' 
          ? 'bg-white/98 border-slate-200 text-slate-900' 
          : 'bg-slate-900/98 border-slate-700 text-white'
      }`}>
        <div className="flex flex-col h-full pt-20 px-6">
          {/* Mobile Search */}
          <div className="relative w-full mb-6">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              theme === 'light' ? 'text-slate-400' : 'text-slate-400'
            }`} />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 pr-4 py-3 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                theme === 'light'
                  ? 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-500'
                  : 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-400'
              }`}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  navigate(`/files?search=${encodeURIComponent(searchQuery)}`);
                  closeMobileMenu();
                }
              }}
            />
          </div>

          {/* Mobile Navigation Items */}
          <div className="space-y-2 mb-6">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              if (item.protected && !isConnected) return null;

              return (
                <Link
                  key={`${item.href}-${index}`}
                  to={item.href}
                  onClick={closeMobileMenu}
                  className={`flex items-center space-x-3 w-full p-4 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30'
                      : theme === 'light'
                        ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  } ${
                    isActive 
                      ? theme === 'light' ? 'text-blue-600' : 'text-white'
                      : ''
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : ''}`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Theme Toggle */}
          <div className={`border-t pt-4 mb-6 ${
            theme === 'light' ? 'border-slate-200' : 'border-slate-600'
          }`}>
            <div className={`flex items-center justify-between p-4 rounded-lg ${
              theme === 'light' ? 'bg-slate-100' : 'bg-slate-800/30'
            }`}>
              <span className={`font-medium ${
                theme === 'light' ? 'text-slate-900' : 'text-white'
              }`}>Theme</span>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant={theme === 'light' ? 'solid' : 'light'}
                  color={theme === 'light' ? 'primary' : 'default'}
                  isIconOnly
                  onPress={() => handleThemeChange('light')}
                >
                  <Sun className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={theme === 'dark' ? 'solid' : 'light'}
                  color={theme === 'dark' ? 'primary' : 'default'}
                  isIconOnly
                  onPress={() => handleThemeChange('dark')}
                >
                  <Moon className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={theme === 'system' ? 'solid' : 'light'}
                  color={theme === 'system' ? 'primary' : 'default'}
                  isIconOnly
                  onPress={() => handleThemeChange('system')}
                >
                  <Monitor className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Wallet Section */}
          {isConnected ? (
            <div className={`border-t pt-4 space-y-4 ${
              theme === 'light' ? 'border-slate-200' : 'border-slate-600'
            }`}>
              <div className={`flex items-center space-x-3 p-4 rounded-lg ${
                theme === 'light' ? 'bg-slate-100' : 'bg-slate-800/30'
              }`}>
                <Avatar
                  size="md"
                  src={`https://ui-avatars.com/api/?name=${walletName}&background=3B82F6&color=fff`}
                  className="ring-2 ring-blue-500/30"
                />
                <div className="flex-1">
                  <p className={`font-semibold ${
                    theme === 'light' ? 'text-slate-900' : 'text-white'
                  }`}>{walletName}</p>
                  <div className="flex items-center space-x-2">
                    <p className={`text-sm font-mono ${
                      theme === 'light' ? 'text-slate-600' : 'text-slate-400'
                    }`}>
                      {formatWalletAddress(walletAddress!)}
                    </p>
                    <Button
                      size="sm"
                      variant="light"
                      isIconOnly
                      className="w-6 h-6 min-w-6"
                      onPress={copyWalletAddress}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-blue-400">{balance.toFixed(4)} SOL</p>
                </div>
              </div>

              <Button
                color="danger"
                variant="flat"
                startContent={<LogOut className="w-4 h-4" />}
                onPress={() => {
                  disconnectWallet();
                  closeMobileMenu();
                }}
                className="w-full"
              >
                Disconnect Wallet
              </Button>
            </div>
          ) : (
            <div className={`border-t pt-4 ${
              theme === 'light' ? 'border-slate-200' : 'border-slate-600'
            }`}>
              <WalletButton />
            </div>
          )}
        </div>
      </div>

      {/* Page Title Banner (visible on mobile) */}
      <div className={`block md:hidden border-b px-6 py-3 ${
        theme === 'light'
          ? 'bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-slate-200/50'
          : 'bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-blue-500/20'
      }`}>
        <h1 className={`text-lg font-semibold ${
          theme === 'light' ? 'text-slate-900' : 'text-white'
        }`}>
          {getCurrentPageTitle()}
        </h1>
      </div>
    </>
  );
};