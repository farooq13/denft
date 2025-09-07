import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Navbar as NextUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Badge,
  Chip,
} from '@nextui-org/react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  // Handle menu toggle
  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close menu
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <NextUINavbar
        isBordered
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
        classNames={{
          base: `transition-all duration-300 ${
            isScrolled 
              ? 'backdrop-blur-xl bg-slate-900/90 shadow-2xl border-blue-500/30' 
              : 'backdrop-blur-lg bg-slate-900/70 border-blue-500/20'
          }`,
          wrapper: "px-6 max-w-7xl",
          brand: "text-white",
          content: "text-white",
          menu: "bg-slate-900/95 backdrop-blur-xl border-r border-slate-700 pt-6",
          menuItem: "text-white",
        }}
        height="4rem"
      >
        {/* Mobile Menu Toggle */}
        <NavbarContent className="sm:hidden" justify="start">
          <NavbarMenuToggle 
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="text-white hover:text-blue-400 transition-colors"
          />
        </NavbarContent>

        {/* Mobile Brand */}
        <NavbarContent className="sm:hidden pr-3" justify="center">
          <NavbarBrand>
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <Cloud className="w-8 h-8 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Denft
              </span>
            </Link>
          </NavbarBrand>
        </NavbarContent>

        {/* Desktop Navigation */}
        <NavbarContent className="hidden sm:flex gap-8" justify="center">
          <NavbarBrand>
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <Cloud className="w-10 h-10 text-blue-400 group-hover:text-blue-300 transition-all duration-300 group-hover:scale-110" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-2xl bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Denft
                </span>
                <span className="text-xs text-slate-400 -mt-1">Decentralized Storage</span>
              </div>
            </Link>
          </NavbarBrand>

          {/* Navigation Items */}
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
                      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border border-blue-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
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
        </NavbarContent>

        {/* Right Section */}
        <NavbarContent justify="end" className="gap-4">
          {/* Search Bar (desktop only) */}
          <NavbarItem className="hidden lg:flex">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
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
            <Dropdown>
              <DropdownTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-300 hover:text-white hover:bg-slate-800/50"
                  isIconOnly
                >
                  {theme === 'light' && <Sun className="w-4 h-4" />}
                  {theme === 'dark' && <Moon className="w-4 h-4" />}
                  {theme === 'system' && <Monitor className="w-4 h-4" />}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                variant="faded"
                className="bg-slate-800/90 backdrop-blur-xl border border-slate-700"
                onAction={(key) => setTheme(key as Theme)}
                selectedKeys={[theme]}
                selectionMode="single"
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
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-800/50 relative"
                isIconOnly
                onPress={() => navigate('/notifications')}
              >
                <Bell className="w-4 h-4" />
                {notifications > 0 && (
                  <Badge
                    color="danger"
                    className="absolute -top-1 -right-1 min-w-5 h-5"
                    size="sm"
                  >
                    {notifications}
                  </Badge>
                )}
              </Button>
            </NavbarItem>
          )}

          {/* Wallet Section */}
          <NavbarItem>
            {isConnected ? (
              <Dropdown>
                <DropdownTrigger>
                  <div className="flex items-center space-x-3 cursor-pointer group">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-medium text-white">
                        {balance.toFixed(4)} SOL
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatWalletAddress(walletAddress!)}
                      </span>
                    </div>
                    <div className="relative">
                      <Avatar
                        size="sm"
                        src={`https://ui-avatars.com/api/?name=${walletName}&background=3B82F6&color=fff`}
                        className="ring-2 ring-blue-500/30 group-hover:ring-blue-400/50 transition-all duration-300"
                      />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
                    </div>
                  </div>
                </DropdownTrigger>
                <DropdownMenu
                  variant="faded"
                  className="w-64 bg-slate-800/95 backdrop-blur-xl border border-slate-700"
                >
                  <DropdownItem
                    key="wallet-info"
                    className="h-14 gap-2"
                    textValue="Wallet Info"
                  >
                    <div className="flex flex-col">
                      <p className="font-semibold text-white">{walletName}</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-small text-slate-400 font-mono">
                          {formatWalletAddress(walletAddress!)}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
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
                      <span className="text-slate-300">Balance</span>
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
                      <span className="text-slate-300">Files Stored</span>
                      <Chip size="sm" variant="flat" color="secondary">
                        {files.length}
                      </Chip>
                    </div>
                  </DropdownItem>

                  <DropdownItem key="divider" className="p-0">
                    <div className="border-t border-slate-600 my-1" />
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

        {/* Mobile Menu */}
        <NavbarMenu>
          {/* Mobile Search */}
          <NavbarMenuItem>
            <div className="relative w-full mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 w-full bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/files?search=${encodeURIComponent(searchQuery)}`);
                    closeMenu();
                  }
                }}
              />
            </div>
          </NavbarMenuItem>

          {/* Mobile Navigation Items */}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            if (item.protected && !isConnected) return null;

            return (
              <NavbarMenuItem key={item.href}>
                <Link
                  to={item.href}
                  onClick={closeMenu}
                  className={`flex items-center space-x-3 w-full p-4 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border border-blue-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : ''}`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </NavbarMenuItem>
            );
          })}

          {/* Mobile Theme Toggle */}
          <NavbarMenuItem>
            <div className="border-t border-slate-600 my-4" />
            <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
              <span className="text-white font-medium">Theme</span>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant={theme === 'light' ? 'solid' : 'ghost'}
                  color={theme === 'light' ? 'primary' : 'default'}
                  isIconOnly
                  onPress={() => setTheme('light')}
                >
                  <Sun className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={theme === 'dark' ? 'solid' : 'ghost'}
                  color={theme === 'dark' ? 'primary' : 'default'}
                  isIconOnly
                  onPress={() => setTheme('dark')}
                >
                  <Moon className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={theme === 'system' ? 'solid' : 'ghost'}
                  color={theme === 'system' ? 'primary' : 'default'}
                  isIconOnly
                  onPress={() => setTheme('system')}
                >
                  <Monitor className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </NavbarMenuItem>

          {/* Mobile Wallet Section */}
          {isConnected && (
            <>
              <NavbarMenuItem>
                <div className="border-t border-slate-600 my-4" />
              </NavbarMenuItem>
              
              <NavbarMenuItem>
                <div className="flex items-center space-x-3 p-4 bg-slate-800/30 rounded-lg">
                  <Avatar
                    size="md"
                    src={`https://ui-avatars.com/api/?name=${walletName}&background=3B82F6&color=fff`}
                    className="ring-2 ring-blue-500/30"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-white">{walletName}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-slate-400 font-mono">
                        {formatWalletAddress(walletAddress!)}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
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
              </NavbarMenuItem>

              <NavbarMenuItem>
                <Button
                  color="danger"
                  variant="flat"
                  startContent={<LogOut className="w-4 h-4" />}
                  onPress={() => {
                    disconnectWallet();
                    closeMenu();
                  }}
                  className="w-full"
                >
                  Disconnect Wallet
                </Button>
              </NavbarMenuItem>
            </>
          )}
        </NavbarMenu>
      </NextUINavbar>

      {/* Page Title Banner (visible on mobile) */}
      <div className="sm:hidden bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-b border-blue-500/20 px-6 py-3">
        <h1 className="text-lg font-semibold text-white">
          {getCurrentPageTitle()}
        </h1>
      </div>
    </>
  );
};