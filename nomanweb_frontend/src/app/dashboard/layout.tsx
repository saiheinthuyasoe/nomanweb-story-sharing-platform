'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  BookOpen, 
  DollarSign, 
  Gift, 
  Bell,
  ChevronRight,
  User,
  LogOut
} from 'lucide-react';

// Dashboard Sidebar Navigation Items
const sidebarItems = [
  { id: 'statistics', label: 'Statistics Centre', icon: BarChart3, href: '/dashboard' },
  { id: 'stories', label: 'Stories', icon: BookOpen, href: '/dashboard/my-stories' },
  { id: 'income', label: 'Income', icon: DollarSign, href: '/dashboard/income' },
  { id: 'gift', label: 'Gift', icon: Gift, href: '/dashboard/gifts' },
  { id: 'alert', label: 'Alert', icon: Bell, href: '/dashboard/alerts' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Determine active tab based on current pathname
  const getActiveTab = () => {
    if (pathname === '/dashboard') return 'statistics';
    if (pathname.includes('/my-stories')) return 'stories';
    if (pathname.includes('/income')) return 'income';
    if (pathname.includes('/gifts')) return 'gift';
    if (pathname.includes('/alerts')) return 'alert';
    return 'statistics';
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-50 bg-white shadow-xl border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user.displayName?.charAt(0) || user.username?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-gray-900 truncate">
                {user.displayName || user.username}
              </h2>
              <p className="text-xs text-gray-600">Writer Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-3">
            <ul className="space-y-2">
              {sidebarItems.map((item) => {
                const isActive = getActiveTab() === item.id;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                                              <div className="flex items-center space-x-2.5">
                          <item.icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                          <span className="text-sm font-medium">{item.label}</span>
                      </div>
                                              <ChevronRight className={`h-3 w-3 transition-transform ${isActive ? 'rotate-90 text-blue-600' : 'text-gray-400'}`} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-gray-200">
          <div className="space-y-2">
            <Link
              href="/profile"
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                          >
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Profile Settings</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <LogOut className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
} 