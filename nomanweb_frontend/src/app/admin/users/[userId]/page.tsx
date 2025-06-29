'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  FlagIcon,
  ChartBarIcon,
  ClockIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  PencilIcon,
  ShieldExclamationIcon,
  TrashIcon,
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface UserDetail {
  id: string;
  username: string;
  displayName?: string;
  email: string;
  role: 'USER' | 'ADMIN';
  status: 'active' | 'suspended' | 'banned';
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
  emailVerified: boolean;
  profileImageUrl?: string;
  bio?: string;
  coinBalance: number;
  totalEarnedCoins: number;
  totalStories: number;
  totalFollowers: number;
  totalFollowing: number;
  totalComments: number;
  reportedCount: number;
  lastPasswordChange?: string;
  passwordResetToken?: string;
  passwordResetExpires?: string;
  lineUserId?: string;
  googleId?: string;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

interface Report {
  id: string;
  type: 'user' | 'story' | 'comment' | 'chapter';
  reason: string;
  description: string;
  reportedBy: string;
  reportedAt: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
      fetchActivityLogs();
      fetchReports();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user details:', error);
      // Mock data for development
      setUser({
        id: userId,
        username: 'john_doe',
        displayName: 'John Doe',
        email: 'john.doe@example.com',
        role: 'USER',
        status: 'active',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T14:22:00Z',
        lastLoginAt: '2024-01-21T09:15:00Z',
        lastLoginIp: '192.168.1.100',
        emailVerified: true,
        profileImageUrl: '',
        bio: 'Love reading and writing stories about adventure and mystery.',
        coinBalance: 150.50,
        totalEarnedCoins: 300.75,
        totalStories: 8,
        totalFollowers: 245,
        totalFollowing: 67,
        totalComments: 124,
        reportedCount: 1,
        lastPasswordChange: '2024-01-10T12:00:00Z',
        lineUserId: 'U1234567890abcdef',
        googleId: null
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/users/${userId}/activity`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch activity logs');
      }

      const logs = await response.json();
      setActivityLogs(logs);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      // Mock data
      setActivityLogs([
        {
          id: '1',
          action: 'LOGIN',
          description: 'User logged in',
          timestamp: '2024-01-21T09:15:00Z',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        {
          id: '2',
          action: 'STORY_CREATE',
          description: 'Created story "The Mystery of the Lost Castle"',
          timestamp: '2024-01-20T16:30:00Z',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        {
          id: '3',
          action: 'PROFILE_UPDATE',
          description: 'Updated profile information',
          timestamp: '2024-01-19T14:22:00Z',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      ]);
    }
  };

  const fetchReports = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/users/${userId}/reports`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const reportsData = await response.json();
      setReports(reportsData);
    } catch (error) {
      console.error('Error fetching reports:', error);
      // Mock data
      setReports([
        {
          id: '1',
          type: 'story',
          reason: 'Inappropriate Content',
          description: 'Story contains violent content not suitable for all audiences',
          reportedBy: 'user123',
          reportedAt: '2024-01-18T10:30:00Z',
          status: 'pending'
        }
      ]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Active
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
            Suspended
          </span>
        );
      case 'banned':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircleIcon className="w-4 h-4 mr-1" />
            Banned
          </span>
        );
      default:
        return status;
    }
  };

  const getRoleBadge = (role: string) => {
    return role === 'ADMIN' ? (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
        <ShieldCheckIcon className="w-4 h-4 mr-1" />
        Administrator
      </span>
    ) : (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
        <UserIcon className="w-4 h-4 mr-1" />
        User
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-4">The requested user could not be found.</p>
          <button
            onClick={() => router.push('/admin/users')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/admin/users')}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
              <p className="text-gray-600">Manage user account and permissions</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => router.push(`/admin/users/${userId}/edit`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit User
            </button>
            
            {user.status === 'active' && user.role !== 'ADMIN' && (
              <button
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center"
              >
                <ShieldExclamationIcon className="h-4 w-4 mr-2" />
                Suspend
              </button>
            )}
            
            {user.role !== 'ADMIN' && (
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* User Profile Header */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="flex items-start space-x-6">
          <div className="flex-shrink-0">
            {user.profileImageUrl ? (
              <img 
                className="h-24 w-24 rounded-full" 
                src={user.profileImageUrl} 
                alt={user.username} 
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center">
                <UserIcon className="h-12 w-12 text-gray-600" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {user.displayName || user.username}
                </h2>
                <p className="text-gray-600">@{user.username}</p>
              </div>
              
              <div className="flex space-x-3">
                {getRoleBadge(user.role)}
                {getStatusBadge(user.status)}
              </div>
            </div>
            
            <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center">
                <EnvelopeIcon className="h-4 w-4 mr-1" />
                {user.email}
                {user.emailVerified && (
                  <CheckCircleIcon className="h-4 w-4 ml-2 text-green-500" />
                )}
              </div>
              
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Joined {formatDate(user.createdAt)}
              </div>
              
              {user.reportedCount > 0 && (
                <div className="flex items-center text-red-600">
                  <FlagIcon className="h-4 w-4 mr-1" />
                  {user.reportedCount} reports
                </div>
              )}
            </div>
            
            {user.bio && (
              <p className="mt-4 text-gray-700">{user.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Stories</p>
              <p className="text-2xl font-bold text-gray-900">{user.totalStories}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Followers</p>
              <p className="text-2xl font-bold text-gray-900">{user.totalFollowers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Following</p>
              <p className="text-2xl font-bold text-gray-900">{user.totalFollowing}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <EnvelopeIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Comments</p>
              <p className="text-2xl font-bold text-gray-900">{user.totalComments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: UserIcon },
              { id: 'security', name: 'Security', icon: ShieldCheckIcon },
              { id: 'activity', name: 'Activity Log', icon: ClockIcon },
              { id: 'reports', name: 'Reports', icon: FlagIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Username</dt>
                      <dd className="text-sm text-gray-900">{user.username}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Display Name</dt>
                      <dd className="text-sm text-gray-900">{user.displayName || 'Not set'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="text-sm text-gray-900 flex items-center">
                        {user.email}
                        {user.emailVerified ? (
                          <CheckCircleIcon className="h-4 w-4 ml-2 text-green-500" />
                        ) : (
                          <XCircleIcon className="h-4 w-4 ml-2 text-red-500" />
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Role</dt>
                      <dd className="text-sm text-gray-900">{user.role}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="text-sm text-gray-900">{user.status}</dd>
                    </div>
                  </dl>
                </div>

                {/* Account Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Account Details</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created</dt>
                      <dd className="text-sm text-gray-900">{formatDate(user.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                      <dd className="text-sm text-gray-900">{formatDate(user.updatedAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Login</dt>
                      <dd className="text-sm text-gray-900">
                        {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Coin Balance</dt>
                      <dd className="text-sm text-gray-900">{user.coinBalance} coins</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Total Earned</dt>
                      <dd className="text-sm text-gray-900">{user.totalEarnedCoins} coins</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* OAuth Connections */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">OAuth Connections</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-green-500 rounded mr-3"></div>
                      <span className="text-sm font-medium">LINE</span>
                    </div>
                    <span className={`text-sm ${user.lineUserId ? 'text-green-600' : 'text-gray-500'}`}>
                      {user.lineUserId ? 'Connected' : 'Not connected'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-blue-500 rounded mr-3"></div>
                      <span className="text-sm font-medium">Google</span>
                    </div>
                    <span className={`text-sm ${user.googleId ? 'text-green-600' : 'text-gray-500'}`}>
                      {user.googleId ? 'Connected' : 'Not connected'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Security Information</h3>
                <button
                  onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                  {showSensitiveInfo ? (
                    <>
                      <EyeSlashIcon className="h-4 w-4 mr-1" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Show Details
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Login Information</h4>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Login</dt>
                      <dd className="text-sm text-gray-900">
                        {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Login IP</dt>
                      <dd className="text-sm text-gray-900 font-mono">
                        {showSensitiveInfo ? (user.lastLoginIp || 'Unknown') : '•••.•••.•••.•••'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email Verified</dt>
                      <dd className="text-sm text-gray-900">
                        {user.emailVerified ? (
                          <span className="text-green-600 flex items-center">
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center">
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            Not verified
                          </span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Password Security</h4>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Password Change</dt>
                      <dd className="text-sm text-gray-900">
                        {user.lastPasswordChange ? formatDate(user.lastPasswordChange) : 'Unknown'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Password Reset Token</dt>
                      <dd className="text-sm text-gray-900">
                        {user.passwordResetToken ? (
                          <span className="text-yellow-600">Active reset token</span>
                        ) : (
                          <span className="text-gray-500">None</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Security Actions */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Security Actions</h4>
                <div className="space-y-3">
                  <button className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Force Password Reset
                  </button>
                  <button className="w-full md:w-auto px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 ml-0 md:ml-3">
                    Send Verification Email
                  </button>
                  <button className="w-full md:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 ml-0 md:ml-3">
                    Revoke All Sessions
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Activity Log Tab */}
          {activeTab === 'activity' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {activityLogs.map((log) => (
                  <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">{log.action}</span>
                          <span className="text-xs text-gray-500">{formatDate(log.timestamp)}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{log.description}</p>
                        {showSensitiveInfo && (
                          <div className="text-xs text-gray-500 mt-2 space-y-1">
                            {log.ipAddress && (
                              <div className="flex items-center">
                                <GlobeAltIcon className="h-3 w-3 mr-1" />
                                <span className="font-mono">{log.ipAddress}</span>
                              </div>
                            )}
                            {log.userAgent && (
                              <div className="flex items-center">
                                <ComputerDesktopIcon className="h-3 w-3 mr-1" />
                                <span className="truncate">{log.userAgent}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Reports ({reports.length})
              </h3>
              {reports.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No reports found for this user.</p>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              {report.type}
                            </span>
                            <span className="text-sm font-medium text-gray-900">{report.reason}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              report.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {report.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{report.description}</p>
                          <div className="text-xs text-gray-500 mt-2">
                            Reported by {report.reportedBy} on {formatDate(report.reportedAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}