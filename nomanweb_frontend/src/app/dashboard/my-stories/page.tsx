'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useMyStories } from '@/hooks/useStories';
import { useAuth } from '@/contexts/AuthContext';
import { StoryPreview } from '@/types/story';

import { 
  Plus,
  MoreVertical,
  Eye,
  Settings,
  Trash2,
  BookOpen,
  Calendar,
  Heart,
  Bookmark,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import './ant-table.css';

type StoryTab = 'stories' | 'drafts' | 'trash';
type StoryStatus = 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'SUSPENDED';
type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export default function MyStoriesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<StoryTab>('stories');

  const { data: storiesPage, isLoading, error } = useMyStories({ 
    page: 0, 
    size: 1000 // Large number to get all stories
  });

  const handleCreateNew = () => {
    router.push('/stories/create');
  };

  const handleExplore = (storyId: string) => {
    // Navigate to Writer View (dashboard)
    router.push(`/dashboard/stories/${storyId}`);
  };

  const handleStoryClick = (storyId: string) => {
    // Navigate to Reader View (public)
    router.push(`/stories/${storyId}`);
  };

  const handleSettings = (storyId: string) => {
    router.push(`/stories/${storyId}/settings`);
  };

  const handleDelete = (storyId: string) => {
    // TODO: Implement delete functionality
    console.log('Delete story:', storyId);
    setOpenDropdown(null);
  };

  const getContentStatusBadge = (status: StoryStatus) => {
    // Map story status to content status
    const statusConfig = {
      DRAFT: { text: 'Ongoing', className: 'bg-yellow-100 text-yellow-700' },
      PUBLISHED: { text: 'Ongoing', className: 'bg-yellow-100 text-yellow-700' },
      COMPLETED: { text: 'Completed', className: 'bg-green-100 text-green-700' },
      SUSPENDED: { text: 'Ongoing', className: 'bg-yellow-100 text-yellow-700' }
    };
    
    const config = statusConfig[status] || statusConfig.DRAFT;
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const getModerationBadge = (status: ModerationStatus) => {
    const statusConfig = {
      PENDING: { text: 'Pending', className: 'bg-yellow-100 text-yellow-700', icon: Clock },
      APPROVED: { text: 'Approved', className: 'bg-green-100 text-green-700', icon: CheckCircle },
      REJECTED: { text: 'Rejected', className: 'bg-red-100 text-red-700', icon: XCircle }
    };
    
    const config = statusConfig[status] || statusConfig.PENDING;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Mock data for demonstration - would come from API based on activeTab
  const getMockModerationStatus = (): ModerationStatus => {
    const statuses: ModerationStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const stories = storiesPage?.content || [];
  const filteredStories = stories.filter(story => {
    switch (activeTab) {
      case 'stories':
        return story.status === 'PUBLISHED' || story.status === 'COMPLETED';
      case 'drafts':
        return story.status === 'DRAFT';
      case 'trash':
        return story.status === 'SUSPENDED';
      default:
        return true;
    }
  });

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 overflow-y-auto">
        <div className="p-8">
          <div className="text-center text-red-600">
            Error loading your stories. Please try again.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stories</h1>
            <p className="text-gray-600 mt-2">Manage your stories, drafts, and publications</p>
          </div>
          <button
            onClick={handleCreateNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create a Story</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'stories', label: 'Stories', count: stories.filter(s => s.status === 'PUBLISHED' || s.status === 'COMPLETED').length },
                { id: 'drafts', label: 'Drafts', count: stories.filter(s => s.status === 'DRAFT').length },
                { id: 'trash', label: 'Trash', count: stories.filter(s => s.status === 'SUSPENDED').length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as StoryTab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

                 {/* Stories Table - Ant Design Style */}
         <div className="ant-table-wrapper">
           <div className="ant-spin-nested-loading">
             <div className="ant-spin-container">
               <div className="ant-table">
                 <div className="ant-table-container">
                   <div className="ant-table-content">
                     {filteredStories.length === 0 ? (
                       <div className="ant-empty ant-empty-normal">
                         <div className="ant-empty-image">
                           <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                         </div>
                         <div className="ant-empty-description">
                           <h3 className="text-lg font-medium text-gray-900 mb-2">
                             {activeTab === 'stories' ? 'No published stories' : 
                              activeTab === 'drafts' ? 'No drafts' : 'No stories in trash'}
                           </h3>
                           <p className="text-gray-500 mb-6">
                             {activeTab === 'stories' ? 'Start writing and publish your first story.' :
                              activeTab === 'drafts' ? 'Create a new story to start writing.' :
                              'Deleted stories will appear here.'}
                           </p>
                           {activeTab !== 'trash' && (
                             <button
                               onClick={handleCreateNew}
                               className="ant-btn ant-btn-primary"
                             >
                               Create Your First Story
                             </button>
                           )}
                         </div>
                       </div>
                     ) : (
                       <table className="ant-table-tbody">
                         <thead className="ant-table-thead">
                           <tr>
                             <th className="ant-table-cell" style={{ width: '320px' }}>
                               <div className="ant-table-column-title">Story</div>
                             </th>
                             <th className="ant-table-cell" style={{ width: '96px' }}>
                               <div className="ant-table-column-title">Status</div>
                             </th>
                             <th className="ant-table-cell" style={{ width: '112px' }}>
                               <div className="ant-table-column-title">Moderation</div>
                             </th>
                             <th className="ant-table-cell ant-table-cell-align-center" style={{ width: '80px' }}>
                               <div className="ant-table-column-title">Chapters</div>
                             </th>
                             <th className="ant-table-cell ant-table-cell-align-center" style={{ width: '80px' }}>
                               <div className="ant-table-column-title">Words</div>
                             </th>
                             <th className="ant-table-cell ant-table-cell-align-center" style={{ width: '80px' }}>
                               <div className="ant-table-column-title">Views</div>
                             </th>
                             <th className="ant-table-cell ant-table-cell-align-center" style={{ width: '96px' }}>
                               <div className="ant-table-column-title">Collections</div>
                             </th>
                             <th className="ant-table-cell ant-table-cell-align-center" style={{ width: '80px' }}>
                               <div className="ant-table-column-title">Likes</div>
                             </th>
                             <th className="ant-table-cell ant-table-cell-align-center" style={{ width: '128px' }}>
                               <div className="ant-table-column-title">Operation</div>
                             </th>
                           </tr>
                         </thead>
                         <tbody className="ant-table-tbody">
                           {filteredStories.map((story: StoryPreview) => (
                             <tr key={story.id} className="ant-table-row ant-table-row-level-0">
                               {/* Story Column */}
                               <td className="ant-table-cell">
                                 <div className="flex items-start space-x-3">
                                   <div className="flex-shrink-0">
                                     {story.coverImageUrl ? (
                                       <div className="relative w-14 h-20 overflow-hidden rounded-lg shadow-md border border-gray-200">
                                         <Image
                                           src={story.coverImageUrl}
                                           alt={story.title}
                                           fill
                                           className="object-cover"
                                         />
                                         {/* Book spine effect */}
                                         <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-r from-black/20 to-black/40"></div>
                                       </div>
                                     ) : (
                                       <div className="relative w-14 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center shadow-md border border-gray-300 overflow-hidden">
                                         {/* Book cover design */}
                                         <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100"></div>
                                         <div className="absolute top-2 left-2 right-2 bottom-2 border border-blue-200 rounded-md bg-white/50"></div>
                                         <BookOpen className="h-6 w-6 text-blue-600 relative z-10" />
                                         {/* Book spine shadow */}
                                         <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-l from-gray-400/30 to-transparent"></div>
                                       </div>
                                     )}
                                   </div>
                                   <div className="min-w-0 flex-1">
                                     <p 
                                       className="text-sm font-medium text-gray-900 truncate max-w-[200px] cursor-pointer hover:text-blue-600 transition-colors" 
                                       title={story.title}
                                       onClick={() => handleStoryClick(story.id)}
                                     >
                                       {story.title}
                                     </p>
                                     <p className="text-xs text-gray-500 mt-1">
                                       {formatDate(story.createdAt)}
                                     </p>
                                     <div className="flex flex-wrap gap-1 mt-1.5">
                                       {story.tags?.slice(0, 2).map((tag, index) => (
                                         <span
                                           key={index}
                                           className="ant-tag ant-tag-default"
                                         >
                                           {tag}
                                         </span>
                                       ))}
                                       {story.tags && story.tags.length > 2 && (
                                         <span className="ant-tag ant-tag-default">
                                           +{story.tags.length - 2}
                                         </span>
                                       )}
                                     </div>
                                   </div>
                                 </div>
                               </td>

                               {/* Status Column */}
                               <td className="ant-table-cell">
                                 {getContentStatusBadge(story.status as StoryStatus)}
                               </td>

                               {/* Moderation Status Column */}
                               <td className="ant-table-cell">
                                 {getModerationBadge(getMockModerationStatus())}
                               </td>

                               {/* Chapters Column */}
                               <td className="ant-table-cell ant-table-cell-align-center">
                                 {story.totalChapters || 0}
                               </td>

                               {/* Words Column */}
                               <td className="ant-table-cell ant-table-cell-align-center">
                                 {formatNumber(0)} {/* TODO: Add totalWords to StoryPreview type */}
                               </td>

                               {/* Views Column */}
                               <td className="ant-table-cell ant-table-cell-align-center">
                                 {formatNumber(story.totalViews || 0)}
                               </td>

                               {/* Collections Column */}
                               <td className="ant-table-cell ant-table-cell-align-center">
                                 {formatNumber(0)} {/* TODO: Add totalBookmarks to StoryPreview type */}
                               </td>

                               {/* Likes Column */}
                               <td className="ant-table-cell ant-table-cell-align-center">
                                 {formatNumber(story.totalLikes || 0)}
                               </td>

                               {/* Operation Column */}
                               <td className="ant-table-cell ant-table-cell-align-center">
                                 <div className="ant-space ant-space-horizontal ant-space-align-center">
                                   {/* Explorer Button */}
                                   <div className="ant-space-item">
                                     <button
                                       onClick={() => handleExplore(story.id)}
                                       className="ant-btn ant-btn-primary ant-btn-sm"
                                     >
                                       <span className="ant-btn-icon">
                                         <Eye className="h-3 w-3" />
                                       </span>
                                       <span>Explorer</span>
                                     </button>
                                   </div>
                                   
                                   {/* Menu Dropdown */}
                                   <div className="ant-space-item">
                                     <div className="ant-dropdown-trigger">
                                       <button
                                         onClick={() => setOpenDropdown(openDropdown === story.id ? null : story.id)}
                                         className="ant-btn ant-btn-default ant-btn-sm ant-btn-icon-only"
                                       >
                                         <MoreVertical className="h-4 w-4" />
                                       </button>
                                       
                                       {openDropdown === story.id && (
                                         <div className="ant-dropdown ant-dropdown-placement-bottomRight">
                                           <ul className="ant-dropdown-menu">
                                             <li className="ant-dropdown-menu-item">
                                               <button
                                                 onClick={() => {
                                                   handleSettings(story.id);
                                                   setOpenDropdown(null);
                                                 }}
                                                 className="ant-dropdown-menu-title-content"
                                               >
                                                 <Settings className="h-4 w-4 mr-2" />
                                                 Settings
                                               </button>
                                             </li>
                                             <li className="ant-dropdown-menu-item ant-dropdown-menu-item-danger">
                                               <button
                                                 onClick={() => handleDelete(story.id)}
                                                 className="ant-dropdown-menu-title-content"
                                               >
                                                 <Trash2 className="h-4 w-4 mr-2" />
                                                 Delete
                                               </button>
                                             </li>
                                           </ul>
                                         </div>
                                       )}
                                     </div>
                                   </div>
                                 </div>
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     )}
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>

               </div>

       {/* Click outside to close dropdown */}
       {openDropdown && (
         <div
           className="fixed inset-0 z-0"
           onClick={() => setOpenDropdown(null)}
         />
       )}
     </div>
  );
} 