'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  PencilSquareIcon, 
  EyeIcon, 
  TrashIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserGroupIcon,
  BookOpenIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalStories: number;
  totalChapters: number;
  pendingModerations: number;
  totalUsers: number;
  recentActivity: number;
}

interface ModerationItem {
  id: string;
  title: string;
  author: string;
  type: 'story' | 'chapter';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  content?: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStories: 0,
    totalChapters: 0,
    pendingModerations: 0,
    totalUsers: 0,
    recentActivity: 0
  });
  
  const [moderationQueue, setModerationQueue] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stories' | 'chapters'>('stories');

  useEffect(() => {
    fetchDashboardData();
    fetchModerationQueue();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  };

  const fetchModerationQueue = async () => {
    try {
      setLoading(true);
      
      // Fetch both stories and chapters pending moderation
      const [storiesResponse, chaptersResponse] = await Promise.all([
        fetch('/api/admin/moderation/stories?size=10', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        }),
        fetch('/api/admin/moderation/chapters?size=10', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        })
      ]);

      const storiesData = storiesResponse.ok ? await storiesResponse.json() : { content: [] };
      const chaptersData = chaptersResponse.ok ? await chaptersResponse.json() : { content: [] };

      // Combine and format the moderation items
      const allItems: ModerationItem[] = [
        ...storiesData.content.map((story: any) => ({
          id: story.id,
          title: story.title,
          author: story.author?.displayName || story.author?.username || 'Unknown',
          type: 'story' as const,
          status: story.moderationStatus,
          createdAt: story.createdAt,
          content: story.description
        })),
        ...chaptersData.content.map((chapter: any) => ({
          id: chapter.id,
          title: chapter.title,
          author: chapter.story?.authorUsername || 'Unknown',
          type: 'chapter' as const,
          status: chapter.moderationStatus,
          createdAt: chapter.createdAt,
          content: chapter.content
        }))
      ];

      setModerationQueue(allItems.filter(item => item.status === 'PENDING'));
    } catch (error) {
      console.error('Failed to fetch moderation queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModeration = async (itemId: string, approved: boolean, notes: string = '') => {
    try {
      const item = moderationQueue.find(i => i.id === itemId);
      if (!item) return;

      const endpoint = item.type === 'story' 
        ? `/api/admin/moderation/stories/${itemId}`
        : `/api/admin/moderation/chapters/${itemId}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: new URLSearchParams({
          approved: approved.toString(),
          notes: notes
        })
      });

      if (response.ok) {
        // Remove item from queue
        setModerationQueue(prev => prev.filter(i => i.id !== itemId));
        // Refresh stats
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Failed to moderate item:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (!content) return '';
    return content.length > maxLength 
      ? content.substring(0, maxLength) + '...'
      : content;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage content and monitor platform activity</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpenIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Stories</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalStories}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Chapters</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalChapters}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="w-8 h-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="w-8 h-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingModerations}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="w-8 h-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.recentActivity}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Moderation Queue */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Content Moderation Queue</h2>
            <div className="flex space-x-2">
              <Button
                variant={activeTab === 'stories' ? 'default' : 'outline'}
                onClick={() => setActiveTab('stories')}
                className="px-4 py-2"
              >
                Stories
              </Button>
              <Button
                variant={activeTab === 'chapters' ? 'default' : 'outline'}
                onClick={() => setActiveTab('chapters')}
                className="px-4 py-2"
              >
                Chapters
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : moderationQueue.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-600">No items pending moderation at the moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {moderationQueue
                .filter(item => activeTab === 'stories' ? item.type === 'story' : item.type === 'chapter')
                .map((item) => (
                <div key={item.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                        <Badge variant="outline">
                          {item.type.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        By <span className="font-medium">{item.author}</span> • 
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                      
                      {item.content && (
                        <p className="text-gray-700 text-sm mb-4">
                          {truncateContent(item.content)}
                        </p>
                      )}
                      
                      <div className="flex space-x-2">
                        <Button 
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => handleModeration(item.id, true, 'Content approved')}
                        >
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        
                        <Button 
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => handleModeration(item.id, false, 'Content rejected - violates guidelines')}
                        >
                          <XCircleIcon className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        
                        <Button 
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          View Full
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
} 