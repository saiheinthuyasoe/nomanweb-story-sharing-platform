import React, { useState } from 'react';
import Link from 'next/link';
import { ChapterPreview } from '@/lib/api/chapters';
import { useChaptersByStory, usePublishChapter, useUnpublishChapter, useDeleteChapter } from '@/hooks/useChapters';
import { formatDistanceToNow } from 'date-fns';
import {
  EyeIcon,
  HeartIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  ClockIcon,
  GlobeAltIcon,
  ArchiveBoxIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface ChapterManagementProps {
  storyId: string;
  isAuthor: boolean;
}

export default function ChapterManagement({ storyId, isAuthor }: ChapterManagementProps) {
  const { data: chapters = [], isLoading, error } = useChaptersByStory(storyId, isAuthor);
  const { mutate: publishChapter, isPending: isPublishing } = usePublishChapter();
  const { mutate: unpublishChapter, isPending: isUnpublishing } = useUnpublishChapter();
  const { mutate: deleteChapter, isPending: isDeleting } = useDeleteChapter();
  
  const [activeTab, setActiveTab] = useState<'published' | 'draft' | 'all'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  if (!isAuthor) {
    // For non-authors, show only published chapters
    const publishedChapters = chapters.filter(chapter => chapter.status === 'PUBLISHED');
    
    return (
      <div className="card-elevated p-6">
        <h3 className="text-lg font-semibold text-nomanweb-primary mb-6 flex items-center space-x-2">
          <DocumentTextIcon className="w-5 h-5" />
          <span>Chapters ({publishedChapters.length})</span>
        </h3>
        
        {publishedChapters.length === 0 ? (
          <div className="text-center py-8">
            <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No published chapters yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {publishedChapters.map((chapter) => (
              <PublicChapterCard key={chapter.id} chapter={chapter} storyId={storyId} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card-elevated p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-elevated p-6">
        <div className="text-center text-red-600">
          Failed to load chapters. Please try again.
        </div>
      </div>
    );
  }

  // Filter chapters by status
  const publishedChapters = chapters.filter(chapter => chapter.status === 'PUBLISHED');
  const draftChapters = chapters.filter(chapter => chapter.status === 'DRAFT');

  const getActiveChapters = () => {
    switch (activeTab) {
      case 'published':
        return publishedChapters;
      case 'draft':
        return draftChapters;
      case 'all':
      default:
        return chapters;
    }
  };

  const handlePublish = (chapterId: string) => {
    publishChapter(chapterId);
  };

  const handleUnpublish = (chapterId: string) => {
    unpublishChapter(chapterId);
  };

  const handleDelete = (chapterId: string) => {
    deleteChapter(chapterId);
    setDeleteConfirm(null);
  };

  return (
    <div className="card-elevated p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <DocumentTextIcon className="w-5 h-5 text-nomanweb-primary" />
          <h3 className="text-lg font-semibold text-nomanweb-primary">Chapter Management</h3>
        </div>
        
        <Link
          href={`/stories/${storyId}/chapters/create`}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 text-sm"
        >
          <PlusIcon className="w-4 h-4" />
          <span>New Chapter</span>
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-white text-nomanweb-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All ({chapters.length})
        </button>
        <button
          onClick={() => setActiveTab('published')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
            activeTab === 'published'
              ? 'bg-white text-nomanweb-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <GlobeAltIcon className="w-4 h-4" />
          <span>Published ({publishedChapters.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('draft')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
            activeTab === 'draft'
              ? 'bg-white text-nomanweb-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ClockIcon className="w-4 h-4" />
          <span>Drafts ({draftChapters.length})</span>
        </button>
      </div>

      {/* Chapter List */}
      <div className="space-y-3">
        {getActiveChapters().length === 0 ? (
          <div className="text-center py-8">
            <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {activeTab === 'published' && 'No published chapters yet.'}
              {activeTab === 'draft' && 'No draft chapters yet.'}
              {activeTab === 'all' && 'No chapters yet.'}
            </p>
            <Link
              href={`/stories/${storyId}/chapters/create`}
              className="btn-gradient px-6 py-3 rounded-lg font-semibold hover-lift inline-flex items-center space-x-2"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Create Your First Chapter</span>
            </Link>
          </div>
        ) : (
          getActiveChapters().map((chapter) => (
            <ChapterManagementCard
              key={chapter.id}
              chapter={chapter}
              storyId={storyId}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
              onDelete={() => setDeleteConfirm(chapter.id)}
              isPublishing={isPublishing}
              isUnpublishing={isUnpublishing}
              isDeleting={isDeleting}
            />
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card-elevated p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-nomanweb-primary mb-4">Delete Chapter</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this chapter? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Chapter Management Card for Authors
function ChapterManagementCard({
  chapter,
  storyId,
  onPublish,
  onUnpublish,
  onDelete,
  isPublishing,
  isUnpublishing,
  isDeleting,
}: {
  chapter: ChapterPreview;
  storyId: string;
  onPublish: (id: string) => void;
  onUnpublish: (id: string) => void;
  onDelete: () => void;
  isPublishing: boolean;
  isUnpublishing: boolean;
  isDeleting: boolean;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Chapter Header */}
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-sm font-medium text-gray-500">
              Chapter {chapter.chapterNumber}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              chapter.status === 'PUBLISHED'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {chapter.status}
            </span>
            {!chapter.isFree && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {chapter.coinPrice} coins
              </span>
            )}
          </div>

          {/* Chapter Title */}
          <h4 className="text-lg font-semibold text-nomanweb-primary mb-2 truncate">
            {chapter.title}
          </h4>

          {/* Chapter Stats */}
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
            <div className="flex items-center space-x-1">
              <DocumentTextIcon className="w-4 h-4" />
              <span>{chapter.wordCount} words</span>
            </div>
            <div className="flex items-center space-x-1">
              <EyeIcon className="w-4 h-4" />
              <span>{chapter.views}</span>
            </div>
            <div className="flex items-center space-x-1">
              <HeartIcon className="w-4 h-4" />
              <span>{chapter.likes}</span>
            </div>
            <div className="flex items-center space-x-1">
              <ClockIcon className="w-4 h-4" />
              <span>{formatDistanceToNow(new Date(chapter.createdAt), { addSuffix: true })}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          {/* Edit */}
          <Link
            href={`/stories/${storyId}/chapters/${chapter.chapterNumber}/edit`}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Chapter"
          >
            <PencilIcon className="w-4 h-4" />
          </Link>

          {/* Publish/Unpublish */}
          {chapter.status === 'DRAFT' ? (
            <button
              onClick={() => onPublish(chapter.id)}
              disabled={isPublishing}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
              title="Publish Chapter"
            >
              <GlobeAltIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => onUnpublish(chapter.id)}
              disabled={isUnpublishing}
              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors disabled:opacity-50"
              title="Unpublish Chapter"
            >
              <ArchiveBoxIcon className="w-4 h-4" />
            </button>
          )}

          {/* Delete */}
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Delete Chapter"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Public Chapter Card for non-authors
function PublicChapterCard({ chapter, storyId }: { chapter: ChapterPreview; storyId: string }) {
  return (
    <Link
      href={`/stories/${storyId}/chapters/${chapter.chapterNumber}`}
      className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white hover:border-nomanweb-primary/30"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Chapter Header */}
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-sm font-medium text-gray-500">
              Chapter {chapter.chapterNumber}
            </span>
            {!chapter.isFree && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {chapter.coinPrice} coins
              </span>
            )}
          </div>

          {/* Chapter Title */}
          <h4 className="text-lg font-semibold text-nomanweb-primary mb-2 truncate">
            {chapter.title}
          </h4>

          {/* Chapter Stats */}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <DocumentTextIcon className="w-4 h-4" />
              <span>{chapter.wordCount} words</span>
            </div>
            <div className="flex items-center space-x-1">
              <EyeIcon className="w-4 h-4" />
              <span>{chapter.views}</span>
            </div>
            <div className="flex items-center space-x-1">
              <HeartIcon className="w-4 h-4" />
              <span>{chapter.likes}</span>
            </div>
            {chapter.publishedAt && (
              <div className="flex items-center space-x-1">
                <ClockIcon className="w-4 h-4" />
                <span>{formatDistanceToNow(new Date(chapter.publishedAt), { addSuffix: true })}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
} 