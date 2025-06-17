'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, 
  Menu, 
  X, 
  User, 
  LogOut, 
  PlusIcon, 
  Home,
  BookOpen,
  Coins,
  Bell,
  ShoppingCart,
  History,
  BookmarkIcon,
  Library
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside (desktop only)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only handle desktop dropdowns on desktop view
      if (window.innerWidth >= 1024) {
        if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
          setIsUserDropdownOpen(false);
        }
        if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
          setIsSearchOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scrolling when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    setIsUserDropdownOpen(false);
    router.push('/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // Close any open dropdowns when opening mobile menu
    if (!isMobileMenuOpen) {
      setIsUserDropdownOpen(false);
      setIsSearchOpen(false);
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setTimeout(() => {
        const input = document.getElementById('search-input');
        if (input) input.focus();
      }, 100);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/stories?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
      closeMobileMenu();
    }
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <>
      <nav className="navbar-fixed">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
            
            {/* Left Section - Logo */}
            <div className="flex items-center flex-shrink-0">
              {/* Logo */}
              <Link href="/" className="flex items-center group">
                <div className="relative w-20 h-20 sm:w-20 sm:h-20 md:w-25 md:h-25 lg:w-30 lg:h-30">
                  <Image
                    src="/logo.png"
                    alt="NoManWeb Logo"
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
              </Link>

              {/* Desktop Navigation Links */}
              <div className="hidden lg:flex items-center space-x-1 ml-4 xl:ml-6">
                <NavLink href="/" active={isActive('/')} icon={Home}>
                  Home
                </NavLink>
                <NavLink href="/stories" active={isActive('/stories')} icon={BookOpen}>
                  Browse
                </NavLink>
                
                {user && (
                  <>
                    <NavLink href="/stories/create" active={isActive('/stories/create')} icon={PlusIcon}>
                      Write
                    </NavLink>
                    <NavLink href="/dashboard" active={isActive('/dashboard')} icon={BookmarkIcon}>
                      Dashboard
                    </NavLink>
                  </>
                )}
              </div>
            </div>

            {/* Center Section - Mobile Search */}
            <div className="flex-1 mx-1 sm:mx-2 lg:hidden max-w-xs">
              <form onSubmit={handleSearch} className="flex items-center bg-white/20 rounded-md sm:rounded-lg">
                <Search className="h-3 w-3 sm:h-4 sm:w-4 text-white ml-2" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-white placeholder-white/70 px-1 sm:px-2 py-1.5 sm:py-2 flex-1 focus:outline-none text-xs sm:text-sm min-w-0"
                />
              </form>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              
              {/* Desktop Search */}
              <div className="hidden lg:block relative" ref={searchRef}>
                {isSearchOpen ? (
                  <form onSubmit={handleSearch} className="flex items-center bg-white/20 rounded-lg">
                    <input
                      id="search-input"
                      type="text"
                      placeholder="Search stories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent text-white placeholder-white/70 px-4 py-2 w-64 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setIsSearchOpen(false)}
                      className="p-2 text-white hover:bg-white/20 rounded-r-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={toggleSearch}
                    className="p-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all-smooth"
                    title="Search"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Desktop User Section */}
              {user ? (
                <div className="hidden lg:flex items-center space-x-3">
                  {/* Notifications */}
                  <button className="p-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all-smooth relative">
                    <Bell className="h-5 w-5" />
                    {/* Notification badge could be added here */}
                  </button>

                  {/* User Avatar Dropdown */}
                  <div className="relative" ref={userDropdownRef}>
                    <button
                      onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                      className="flex items-center space-x-2 bg-white/20 text-white rounded-lg px-3 py-2 hover:bg-white/30 transition-all-smooth"
                    >
                      <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
                        {user.profileImageUrl ? (
                          <Image
                            src={user.profileImageUrl}
                            alt="Profile"
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                    </button>

                    {/* User Dropdown Menu - Desktop Only */}
                    {isUserDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl z-[70] py-2 hidden lg:block">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              {user.profileImageUrl ? (
                                <Image
                                  src={user.profileImageUrl}
                                  alt="Profile"
                                  width={48}
                                  height={48}
                                  className="rounded-full"
                                />
                              ) : (
                                <User className="h-6 w-6 text-gray-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {user.displayName || user.username}
                              </div>
                              <div className="text-sm text-gray-500">@{user.username}</div>
                            </div>
                          </div>
                          
                          {/* Coin Balance */}
                          <div className="flex items-center justify-between mt-3 bg-yellow-50 rounded-lg p-2">
                            <div className="flex items-center space-x-2">
                              <Coins className="h-4 w-4 text-yellow-600" />
                              <span className="text-sm font-medium text-gray-700">{user.coinBalance}</span>
                            </div>
                            <button className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md hover:bg-yellow-200 transition-colors">
                              Buy
                            </button>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          <DropdownLink href="/dashboard/my-stories" icon={BookOpen}>
                            My Stories
                          </DropdownLink>
                          <DropdownLink href="/library" icon={Library}>
                            Library
                          </DropdownLink>
                          <DropdownLink href="/purchase-history" icon={History}>
                            Purchase History
                          </DropdownLink>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="hidden lg:flex items-center space-x-3">
                  <Link
                    href="/login"
                    className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all-smooth font-medium"
                  >
                    Login
                  </Link>
                </div>
              )}

              {/* Mobile: Notification & Menu Button */}
              <div className="lg:hidden flex items-center space-x-1 flex-shrink-0">
                {user && (
                  <button className="p-1.5 sm:p-2 bg-white/20 text-white rounded-md sm:rounded-lg hover:bg-white/30 transition-all-smooth relative">
                    <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                )}
                <button
                  onClick={toggleMobileMenu}
                  className="p-1.5 sm:p-2 bg-white/20 text-white rounded-md sm:rounded-lg hover:bg-white/30 transition-all-smooth"
                  aria-label="Toggle mobile menu"
                >
                  <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Offcanvas Menu */}
      <div 
        className={`fixed inset-y-0 right-0 w-72 sm:w-80 md:w-84 bg-nomanweb-gradient shadow-2xl transform transition-transform duration-300 ease-in-out z-50 lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
                    {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/20">
            <div className="flex items-center space-x-2">
                <span className="text-base sm:text-lg font-bold text-white">NOMANWEB</span>
            </div>
            <button
              onClick={closeMobileMenu}
              className="p-1.5 sm:p-2 bg-white/20 text-white rounded-md sm:rounded-lg hover:bg-white/30 transition-all-smooth"
              aria-label="Close menu"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          {/* User Profile Section (Mobile) - Only shown when user is logged in */}
          {user && (
            <div className="border-b border-white/20 p-3 sm:p-4 bg-gradient-to-b from-transparent to-black/10">
              <div className="space-y-2 sm:space-y-3">
                {/* User Info Card */}
                <div className="bg-white/20 rounded-md sm:rounded-lg p-2.5 sm:p-3 backdrop-blur-sm">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/30 rounded-full flex items-center justify-center flex-shrink-0">
                      {user.profileImageUrl ? (
                        <Image
                          src={user.profileImageUrl}
                          alt="Profile"
                          width={48}
                          height={48}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-medium text-white truncate">
                        {user.displayName || user.username}
                      </div>
                      <div className="text-xs text-white/70 truncate">@{user.username}</div>
                    </div>
                  </div>

                  {/* Coin Balance */}
                  <div className="flex items-center justify-between mt-2 sm:mt-3 bg-yellow-500/20 rounded-md sm:rounded-lg p-1.5 sm:p-2">
                    <div className="flex items-center space-x-1.5 sm:space-x-2">
                      <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-300" />
                      <span className="text-xs sm:text-sm font-medium text-white">{user.coinBalance}</span>
                    </div>
                    <button className="text-xs bg-yellow-400/30 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-sm sm:rounded-md hover:bg-yellow-400/40 transition-colors">
                      Buy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="flex-1 py-3 sm:py-4 overflow-y-auto">
            <div className="space-y-1.5 sm:space-y-2 px-3 sm:px-4">
              <MobileNavLink href="/" active={isActive('/')} icon={Home} onClick={closeMobileMenu}>
                Home
              </MobileNavLink>
              <MobileNavLink href="/dashboard/my-stories" active={isActive('/dashboard/my-stories')} icon={BookOpen} onClick={closeMobileMenu}>
                Browse
              </MobileNavLink>
              
              {user ? (
                <>
                  <MobileNavLink href="/stories/create" active={isActive('/stories/create')} icon={PlusIcon} onClick={closeMobileMenu}>
                    Write
                  </MobileNavLink>
                  <MobileNavLink href="/dashboard" active={isActive('/dashboard')} icon={BookmarkIcon} onClick={closeMobileMenu}>
                    Dashboard
                  </MobileNavLink>
                  <MobileNavLink href="/purchase-history" icon={History} onClick={closeMobileMenu}>
                    Purchase History
                  </MobileNavLink>
                  <MobileNavLink href="/stories" icon={BookOpen} onClick={closeMobileMenu}>
                    Stories
                  </MobileNavLink>
                  <MobileNavLink href="/library" icon={Library} onClick={closeMobileMenu}>
                    Library
                  </MobileNavLink>
                  
                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 sm:space-x-3 px-2.5 sm:px-3 py-2.5 sm:py-3 rounded-md sm:rounded-lg font-medium transition-all-smooth bg-red-500/20 text-white hover:bg-red-500/30 border border-red-400/30 mt-1.5 sm:mt-2"
                  >
                    <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base font-medium">Logout</span>
                  </button>
                </>
              ) : (
                <MobileNavLink href="/login" active={isActive('/login')} onClick={closeMobileMenu}>
                  Sign in
                </MobileNavLink>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click-outside overlay (transparent) - only for closing menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
    </>
  );
}

// Desktop Navigation Link Component
function NavLink({ 
  href, 
  children, 
  active = false, 
  icon: Icon 
}: { 
  href: string; 
  children: React.ReactNode; 
  active?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all-smooth ${
        active
          ? 'bg-white/30 text-white'
          : 'text-white/90 hover:text-white hover:bg-white/20'
      }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      <span>{children}</span>
    </Link>
  );
}

// Mobile Navigation Link Component
function MobileNavLink({ 
  href, 
  children, 
  active = false, 
  icon: Icon,
  onClick 
}: { 
  href: string; 
  children: React.ReactNode; 
  active?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center space-x-2 sm:space-x-3 px-2.5 sm:px-3 py-2.5 sm:py-3 rounded-md sm:rounded-lg font-medium transition-all-smooth ${
        active
          ? 'bg-white/30 text-white'
          : 'text-white/90 hover:text-white hover:bg-white/20'
      }`}
    >
      {Icon && <Icon className="h-4 w-4 sm:h-5 sm:w-5" />}
      <span className="text-sm sm:text-base">{children}</span>
    </Link>
  );
}

// Dropdown Link Component
function DropdownLink({ 
  href, 
  children, 
  icon: Icon 
}: { 
  href: string; 
  children: React.ReactNode; 
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
    >
      {Icon && <Icon className="h-4 w-4" />}
      <span>{children}</span>
    </Link>
  );
} 