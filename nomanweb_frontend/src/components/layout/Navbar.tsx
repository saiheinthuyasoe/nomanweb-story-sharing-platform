"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
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
  Library,
  Users,
  LogIn,
} from "lucide-react";

import { useUnreadCount } from "@/hooks/useNotifications";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isHydrated = useHydrated();
  const { data: unreadCountData } = useUnreadCount();

  // Check if on chapter edit page
  const isChapterEditPage =
    pathname?.includes("/chapters/") && pathname?.includes("/edit");
  // Extract chapter ID from URL like /stories/[storyId]/chapters/[chapterNumber]/edit
  const getChapterIdFromPath = () => {
    if (!isChapterEditPage) return null;
    const pathParts = pathname?.split("/") || [];
    const storyIndex = pathParts.findIndex(
      (part: string) => part === "stories"
    );
    if (
      storyIndex !== -1 &&
      pathParts[storyIndex + 1] &&
      pathParts[storyIndex + 3]
    ) {
      // For now, we can't get the actual chapter ID from URL since it's story/chapter number
      // We'll need to get it from the edit page component context
      return "edit-page-chapter"; // placeholder
    }
    return null;
  };
  const chapterId = getChapterIdFromPath();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"stories" | "users">("stories");

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside (desktop only)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only handle desktop dropdowns on desktop view
      if (window.innerWidth >= 1024) {
        if (
          userDropdownRef.current &&
          !userDropdownRef.current.contains(event.target as Node)
        ) {
          setIsUserDropdownOpen(false);
        }
        if (
          searchRef.current &&
          !searchRef.current.contains(event.target as Node)
        ) {
          setIsSearchOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scrolling when menu is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    setIsUserDropdownOpen(false);
    router.push("/");
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
        const input = document.getElementById("search-input");
        if (input) input.focus();
      }, 100);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/search?q=${encodeURIComponent(searchQuery.trim())}&type=${searchType}`
      );
      setIsSearchOpen(false);
      setSearchQuery("");
      closeMobileMenu();
    }
  };

  const isActive = (path: string) => {
    if (!isHydrated || !pathname) return false;
    return pathname === path;
  };

  // Don't render until hydrated to prevent hydration mismatches
  if (!isHydrated) {
    return (
      <nav className="navbar-fixed">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-15">
            {/* Placeholder content during SSR */}
            <div className="flex items-center flex-shrink-0">
              <div className="relative w-28 h-28 xs:w-30 xs:h-30 sm:w-32 sm:h-32 md:w-35 md:h-35 lg:w-38 lg:h-38">
                <Image
                  src="/logo.png"
                  alt="NoManWeb Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-base sm:text-lg font-bold text-white">
                NOMANWEB
              </span>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="navbar-fixed">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-15">
            {/* Left Section - Logo */}
            <div className="flex items-center flex-shrink-0">
              {/* Logo */}
              <Link href="/" className="flex items-center group">
                <div className="relative w-28 h-28 xs:w-30 xs:h-30 sm:w-32 sm:h-32 md:w-35 md:h-35 lg:w-38 lg:h-38">
                  <Image
                    src="/logo.png"
                    alt="NoManWeb Logo"
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
              </Link>

              {/* Desktop Navigation Links */}
              <div className="hidden md:flex lg:flex items-center space-x-1 md:space-x-1 lg:space-x-1 ml-3 md:ml-4 xl:ml-6">
                <NavLink href="/" active={isActive("/")} icon={Home}>
                  Home
                </NavLink>

                <NavLink
                  href="/stories"
                  active={isActive("/stories")}
                  icon={BookOpen}
                >
                  Browse
                </NavLink>

                {user && (
                  <>
                    <NavLink
                      href="/stories/create"
                      active={isActive("/stories/create")}
                      icon={PlusIcon}
                    >
                      Write
                    </NavLink>
                    <NavLink
                      href="/dashboard"
                      active={isActive("/dashboard")}
                      icon={BookmarkIcon}
                    >
                      Dashboard
                    </NavLink>
                  </>
                )}
              </div>

              {/* Active Collaborators for Chapter Edit Pages */}
              {isChapterEditPage && (
                <div className="hidden lg:flex items-center ml-6 px-3 py-1 bg-white/10 rounded-lg">
                  <Users className="w-4 h-4 text-white mr-2" />
                  <span className="text-white text-sm font-medium">
                    Collaborating
                  </span>
                  {/* Note: We would need the actual chapter ID here for real functionality */}
                </div>
              )}
            </div>

            {/* Center Section - Mobile Search */}
            <div className="flex-1 mx-1 xs:mx-1.5 sm:mx-2 md:hidden max-w-[200px] xs:max-w-[100px] sm:max-w-[400px]">
              <form
                onSubmit={handleSearch}
                className="flex items-center bg-white rounded-md sm:rounded-lg border border-gray-200 shadow-sm"
              >
                <Search className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 text-gray-500 ml-1 xs:ml-1.5 sm:ml-2" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-gray-900 placeholder-gray-500 px-1 xs:px-1.5 sm:px-2 py-1 xs:py-1.5 sm:py-2 flex-1 focus:outline-none text-xs sm:text-sm min-w-0"
                />
                <select
                  value={searchType}
                  onChange={(e) =>
                    setSearchType(e.target.value as "stories" | "users")
                  }
                  className="bg-transparent text-gray-900 px-1 xs:px-1.5 sm:px-2 py-1 xs:py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none border-l border-gray-200"
                >
                  <option value="stories">Stories</option>
                  <option value="users">Users</option>
                </select>
              </form>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              {/* Desktop Search */}
              <div
                className="hidden md:block lg:block relative"
                ref={searchRef}
              >
                {isSearchOpen ? (
                  <form
                    onSubmit={handleSearch}
                    className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm"
                  >
                    <input
                      id="search-input"
                      type="text"
                      placeholder="Search stories and users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent text-gray-900 placeholder-gray-500 px-4 py-2 w-64 focus:outline-none"
                    />
                    <div className="flex items-center border-l border-gray-200">
                      <select
                        value={searchType}
                        onChange={(e) =>
                          setSearchType(e.target.value as "stories" | "users")
                        }
                        className="bg-transparent text-gray-900 px-3 py-2 text-sm focus:outline-none border-r border-gray-200"
                      >
                        <option value="stories">Stories</option>
                        <option value="users">Users</option>
                      </select>
                      <button
                        type="submit"
                        className="p-2 text-gray-500 hover:bg-gray-100 transition-colors"
                      >
                        <Search className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSearchOpen(false)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-r-lg transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={toggleSearch}
                    className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all-smooth border border-white/20 hover:border-white/30"
                    title="Search"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Desktop User Section */}
              {user ? (
                <div className="hidden md:flex lg:flex items-center space-x-2 md:space-x-3">
                  {/* Library */}
                  <Link
                    href="/library"
                    className="p-2 text-white rounded-lg hover:bg-white/20 transition-all-smooth"
                    title="Library"
                  >
                    <Library className="h-5 w-5" />
                  </Link>

                  {/* Notifications */}
                  <Link
                    href="/dashboard/notifications"
                    className="p-2 text-white rounded-lg hover:bg-white/20 transition-all-smooth relative"
                    title="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCountData?.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                        {unreadCountData.unreadCount > 99
                          ? "99+"
                          : unreadCountData.unreadCount}
                      </span>
                    )}
                  </Link>

                  {/* User Avatar Dropdown */}
                  <div className="relative" ref={userDropdownRef}>
                    <button
                      onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                      className="flex items-center space-x-2 text-white rounded-lg px-3 py-2 hover:bg-white/20 transition-all-smooth"
                    >
                      <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center">
                        {user.profileImageUrl ? (
                          <Image
                            src={user.profileImageUrl}
                            alt="Profile"
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <User className="h-5 w-5" />
                        )}
                      </div>
                    </button>

                    {/* User Dropdown Menu - Desktop Only */}
                    {isUserDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl z-[9999] py-2 hidden lg:block">
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
                              <div className="text-sm text-gray-500">
                                @{user.username}
                              </div>
                            </div>
                          </div>

                          {/* Coin Balance */}
                          <div className="flex items-center justify-between mt-3 bg-yellow-50 rounded-lg p-2">
                            <div className="flex items-center space-x-2">
                              <Coins className="h-4 w-4 text-yellow-600" />
                              <span className="text-sm font-medium text-gray-700">
                                {user.coinBalance}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setIsUserDropdownOpen(false);
                                router.push("/buy-coins");
                              }}
                              className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md hover:bg-yellow-200 transition-colors"
                            >
                              Buy
                            </button>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          <DropdownLink href="/profile" icon={User}>
                            Profile
                          </DropdownLink>
                          <DropdownLink
                            href="/dashboard/my-stories"
                            icon={BookOpen}
                          >
                            My Stories
                          </DropdownLink>
                          <DropdownLink href="/library" icon={Library}>
                            Library
                          </DropdownLink>
                          <DropdownLink
                            href="/library?tab=purchased"
                            icon={History}
                          >
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
                <div className="hidden md:flex lg:flex items-center space-x-2 md:space-x-3">
                  <Link
                    href="/login"
                    className="px-4 py-2 rounded-lg font-medium btn-navbar-purple flex items-center space-x-2"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Login</span>
                  </Link>
                </div>
              )}

              {/* Mobile: Notification & Menu Button */}
              <div className="md:hidden flex items-center space-x-0.5 xs:space-x-1 sm:space-x-1.5 flex-shrink-0">
                {user && (
                  <Link
                    href="/dashboard/notifications"
                    className="p-1 xs:p-1.5 sm:p-2 bg-white/10 text-white rounded-md sm:rounded-lg hover:bg-white/20 transition-all-smooth border border-white/20 hover:border-white/30 relative"
                  >
                    <Bell className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
                    {unreadCountData?.unreadCount > 0 && (
                      <span className="absolute -top-0.5 xs:-top-1 -right-0.5 xs:-right-1 bg-red-500 text-white text-xs rounded-full h-3 w-3 xs:h-4 xs:w-4 flex items-center justify-center font-medium text-[10px] xs:text-xs">
                        {unreadCountData.unreadCount > 99
                          ? "99+"
                          : unreadCountData.unreadCount}
                      </span>
                    )}
                  </Link>
                )}
                <button
                  onClick={toggleMobileMenu}
                  className="p-1 xs:p-1.5 sm:p-2 bg-white/10 text-white rounded-md sm:rounded-lg hover:bg-white/20 transition-all-smooth border border-white/20 hover:border-white/30"
                  aria-label="Toggle mobile menu"
                >
                  <Menu className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Offcanvas Menu */}
      <div
        className={`fixed inset-y-0 right-0 w-64 xs:w-72 sm:w-80 md:w-84 bg-nomanweb-gradient shadow-2xl transform transition-transform duration-300 ease-in-out z-50 md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-2 xs:p-3 sm:p-4 border-b border-white/20">
            <div className="flex items-center space-x-2">
              <span className="text-sm xs:text-base sm:text-lg font-bold text-white">
                NOMANWEB
              </span>
            </div>
            <button
              onClick={closeMobileMenu}
              className="p-1 xs:p-1.5 sm:p-2 bg-white/20 text-white rounded-md sm:rounded-lg hover:bg-white/30 transition-all-smooth"
              aria-label="Close menu"
            >
              <X className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          {/* User Profile Section (Mobile) - Only shown when user is logged in */}
          {user && (
            <div className="border-b border-white/20 p-2 xs:p-3 sm:p-4 bg-gradient-to-b from-transparent to-black/10">
              <div className="space-y-1.5 xs:space-y-2 sm:space-y-3">
                {/* User Info Card */}
                <div className="bg-white/20 rounded-md sm:rounded-lg p-2 xs:p-2.5 sm:p-3 backdrop-blur-sm">
                  <div className="flex items-center space-x-1.5 xs:space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 bg-white/30 rounded-full flex items-center justify-center flex-shrink-0">
                      {user.profileImageUrl ? (
                        <Image
                          src={user.profileImageUrl}
                          alt="Profile"
                          width={48}
                          height={48}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs xs:text-xs sm:text-sm font-medium text-white truncate">
                        {user.displayName || user.username}
                      </div>
                      <div className="text-[10px] xs:text-xs text-white/70 truncate">
                        @{user.username}
                      </div>
                    </div>
                  </div>

                  {/* Coin Balance */}
                  <div className="flex items-center justify-between mt-1.5 xs:mt-2 sm:mt-3 bg-yellow-500/20 rounded-md sm:rounded-lg p-1 xs:p-1.5 sm:p-2">
                    <div className="flex items-center space-x-1 xs:space-x-1.5 sm:space-x-2">
                      <Coins className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 text-yellow-300" />
                      <span className="text-[10px] xs:text-xs sm:text-sm font-medium text-white">
                        {user.coinBalance}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        router.push("/buy-coins");
                      }}
                      className="text-[10px] xs:text-xs bg-yellow-400/30 text-white px-1 xs:px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-sm sm:rounded-md hover:bg-yellow-400/40 transition-colors"
                    >
                      Buy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="flex-1 py-2 xs:py-3 sm:py-4 overflow-y-auto">
            <div className="space-y-1 xs:space-y-1.5 sm:space-y-2 px-2 xs:px-3 sm:px-4">
              <MobileNavLink
                href="/"
                active={isActive("/")}
                icon={Home}
                onClick={closeMobileMenu}
              >
                Home
              </MobileNavLink>
              <MobileNavLink
                href="/search"
                active={isActive("/search")}
                icon={Search}
                onClick={closeMobileMenu}
              >
                Search
              </MobileNavLink>
              <MobileNavLink
                href="/stories"
                active={isActive("/stories")}
                icon={BookOpen}
                onClick={closeMobileMenu}
              >
                Browse
              </MobileNavLink>

              {user ? (
                <>
                  <MobileNavLink
                    href="/profile"
                    active={isActive("/profile")}
                    icon={User}
                    onClick={closeMobileMenu}
                  >
                    Profile
                  </MobileNavLink>
                  <MobileNavLink
                    href="/stories/create"
                    active={isActive("/stories/create")}
                    icon={PlusIcon}
                    onClick={closeMobileMenu}
                  >
                    Write
                  </MobileNavLink>
                  <MobileNavLink
                    href="/dashboard"
                    active={isActive("/dashboard")}
                    icon={BookmarkIcon}
                    onClick={closeMobileMenu}
                  >
                    Dashboard
                  </MobileNavLink>
                  <MobileNavLink
                    href="/purchase-history"
                    icon={History}
                    onClick={closeMobileMenu}
                  >
                    Purchase History
                  </MobileNavLink>
                  <MobileNavLink
                    href="/library"
                    icon={Library}
                    onClick={closeMobileMenu}
                  >
                    Library
                  </MobileNavLink>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-1.5 xs:space-x-2 sm:space-x-3 px-2 xs:px-2.5 sm:px-3 py-2 xs:py-2.5 sm:py-3 rounded-md sm:rounded-lg font-medium transition-all-smooth bg-red-500/20 text-white hover:bg-red-500/30 border border-red-400/30 mt-1 xs:mt-1.5 sm:mt-2"
                  >
                    <LogOut className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
                    <span className="text-xs xs:text-sm sm:text-base font-medium">
                      Logout
                    </span>
                  </button>
                </>
              ) : (
                <MobileNavLink
                  href="/login"
                  active={isActive("/login")}
                  onClick={closeMobileMenu}
                >
                  Log in
                </MobileNavLink>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click-outside overlay (transparent) - only for closing menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
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
  icon: Icon,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className={`relative flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all-smooth ${
        active ? "text-white" : "text-white/90 hover:text-white"
      }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      <span className="relative">
        {children}
        {active && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-white rounded-full active-tab-indicator"></div>
        )}
      </span>
    </Link>
  );
}

// Mobile Navigation Link Component
function MobileNavLink({
  href,
  children,
  active = false,
  icon: Icon,
  onClick,
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
      className={`relative flex items-center space-x-1.5 xs:space-x-2 sm:space-x-3 px-2 xs:px-2.5 sm:px-3 py-2 xs:py-2.5 sm:py-3 rounded-md sm:rounded-lg font-medium transition-all-smooth ${
        active ? "text-white" : "text-white/90 hover:text-white"
      }`}
    >
      {Icon && <Icon className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />}
      <span className="relative text-xs xs:text-sm sm:text-base">
        {children}
        {active && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 xs:w-10 h-0.5 bg-white rounded-full active-tab-indicator"></div>
        )}
      </span>
    </Link>
  );
}

// Dropdown Link Component
function DropdownLink({
  href,
  children,
  icon: Icon,
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
