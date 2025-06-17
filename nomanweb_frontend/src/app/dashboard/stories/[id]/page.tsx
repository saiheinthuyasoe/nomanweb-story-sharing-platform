'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  useStory, 
  usePublishStory, 
  useUnpublishStory, 
  useDeleteStory 
} from '@/hooks/useStories';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { 
  EyeIcon, 
  HeartIcon, 
  BookOpenIcon,
  StarIcon,
  UserIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  CalendarIcon,
  TagIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import ChapterManagement from '@/components/chapters/ChapterManagement';

export default function StoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const storyId = params.id as string;
  
  const { data: story, isLoading, error } = useStory(storyId);
  const { mutate: publishStory, isPending: isPublishing } = usePublishStory();
  const { mutate: unpublishStory, isPending: isUnpublishing } = useUnpublishStory();
  const { mutate: deleteStory, isPending: isDeleting } = useDeleteStory();
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Check if current user is the story author
  const isAuthor = user && story && user.id === story.author.id;

  if (isLoading) {
    return <StoryDetailSkeleton />;
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center card-elevated p-8 max-w-md mx-4">
          <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <BookOpenIcon className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-nomanweb-primary mb-2">Story Not Found</h2>
          <p className="text-gray-600 mb-6">The story you're looking for doesn't exist or has been removed.</p>
          <Link 
            href="/stories"
            className="btn-gradient px-6 py-3 rounded-lg font-semibold hover-lift inline-flex items-center space-x-2"
          >
            <BookOpenIcon className="w-4 h-4" />
            <span>Browse Stories</span>
          </Link>
        </div>
      </div>
    );
  }

  const handlePublish = () => {
    publishStory(storyId);
  };

  const handleUnpublish = () => {
    unpublishStory(storyId);
  };

  const handleDelete = () => {
    deleteStory(storyId, {
      onSuccess: () => {
        router.push('/dashboard');
      }
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: story.title,
          text: story.description,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Story Header */}
        <div className="card-elevated overflow-hidden mb-8">
          <div className="md:flex">
            {/* Cover Image */}
            <div className="md:w-1/3">
              <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-200 to-gray-300">
                {story.coverImageUrl ? (
                  <Image
                    src={story.coverImageUrl}
                    alt={story.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-nomanweb-gradient">
                    <BookOpenIcon className="w-24 h-24 text-white/80" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full backdrop-blur-sm ${
                    story.status === 'PUBLISHED' 
                      ? 'bg-green-500/90 text-white' 
                      : story.status === 'DRAFT'
                      ? 'bg-yellow-500/90 text-white'
                      : 'bg-gray-500/90 text-white'
                  }`}>
                    {story.status}
                  </span>
                </div>

                {/* Featured Badge */}
                {story.isFeatured && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-yellow-500/90 backdrop-blur-sm p-2 rounded-full">
                      <StarIcon className="w-5 h-5 text-white fill-current" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Story Info */}
            <div className="md:w-2/3 p-6 lg:p-8">
              <div className="mb-4">
                <h1 className="text-3xl lg:text-4xl font-bold text-nomanweb-primary mb-4">{story.title}</h1>
                
                {/* Author */}
                <div className="flex items-center space-x-3 mb-6">
                  {story.author.profileImageUrl ? (
                    <Image
                      src={story.author.profileImageUrl}
                      alt={story.author.displayName || story.author.username}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-nomanweb-gradient rounded-full flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div>
                    <Link 
                      href={`/authors/${story.author.id}`}
                      className="text-lg font-semibold text-nomanweb-primary hover:text-nomanweb-secondary transition-colors"
                    >
                      {story.author.displayName || story.author.username}
                    </Link>
                    <p className="text-sm text-gray-500">Author</p>
                  </div>
                </div>

                {/* Description */}
                {story.description && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-gray-700 leading-relaxed">{story.description}</p>
                  </div>
                )}

                {/* Category */}
                {story.category && (
                  <div className="mb-4">
                    <Link 
                      href={`/categories/${story.category.id}`}
                      className="inline-block px-4 py-2 text-sm font-medium text-white bg-nomanweb-gradient rounded-full hover:scale-105 transition-transform"
                    >
                      {story.category.name}
                    </Link>
                  </div>
                )}

                {/* Tags */}
                {story.tags && story.tags.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <TagIcon className="w-4 h-4 text-nomanweb-primary" />
                      <span className="text-sm font-medium text-nomanweb-primary">Tags</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {story.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 text-xs text-nomanweb-primary bg-blue-50 rounded-full border border-blue-200"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <StatCard
                    icon={EyeIcon}
                    value={story.totalViews.toLocaleString()}
                    label="Views"
                    gradient="from-blue-500 to-purple-600"
                  />
                  <StatCard
                    icon={HeartIcon}
                    value={story.totalLikes.toLocaleString()}
                    label="Likes"
                    gradient="from-pink-500 to-red-600"
                  />
                  <StatCard
                    icon={BookOpenIcon}
                    value={story.totalChapters.toString()}
                    label="Chapters"
                    gradient="from-green-500 to-teal-600"
                  />
                  <StatCard
                    icon={CalendarIcon}
                    value={story.totalComments.toLocaleString()}
                    label="Comments"
                    gradient="from-yellow-500 to-orange-600"
                  />
                </div>

                {/* Dates */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Created {formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })}</span>
                  </div>
                  {story.publishedAt && (
                    <div className="flex items-center space-x-1">
                      <CalendarIcon className="w-4 h-4" />
                      <span>Published {formatDistanceToNow(new Date(story.publishedAt), { addSuffix: true })}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  {/* Read/Start Reading Button */}
                  {story.totalChapters > 0 ? (
                    <Link
                      href={`/stories/${story.id}/chapters/1`}
                      className="btn-gradient px-6 py-3 rounded-lg font-semibold hover-lift flex items-center space-x-2"
                    >
                      <BookOpenIcon className="w-4 h-4" />
                      <span>Start Reading</span>
                    </Link>
                  ) : (
                    <div className="px-6 py-3 bg-gray-300 text-gray-600 rounded-lg font-medium cursor-not-allowed">
                      No Chapters Yet
                    </div>
                  )}

                  {/* Author Actions */}
                  {isAuthor && (
                    <>
                      <Link
                        href={`/stories/${story.id}/chapters/create`}
                        className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        <PlusIcon className="w-4 h-4" />
                        <span>Add Chapter</span>
                      </Link>

                      <Link
                        href={`/stories/${story.id}/edit`}
                        className="px-4 py-3 border-2 border-nomanweb-primary text-nomanweb-primary rounded-lg hover:bg-nomanweb-primary hover:text-white transition-colors flex items-center space-x-2"
                      >
                        <PencilIcon className="w-4 h-4" />
                        <span>Edit Story</span>
                      </Link>

                      {story.status === 'DRAFT' ? (
                        <button
                          onClick={handlePublish}
                          disabled={isPublishing}
                          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {isPublishing ? 'Publishing...' : 'Publish Story'}
                        </button>
                      ) : (
                        <button
                          onClick={handleUnpublish}
                          disabled={isUnpublishing}
                          className="px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                        >
                          {isUnpublishing ? 'Unpublishing...' : 'Unpublish Story'}
                        </button>
                      )}

                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-3 border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors flex items-center space-x-2"
                      >
                        <TrashIcon className="w-4 h-4" />
                        <span>Delete Story</span>
                      </button>
                    </>
                  )}

                  {/* Public Actions */}
                  <button
                    onClick={handleShare}
                    className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <ShareIcon className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Type and Moderation Status */}
        <div className="card-elevated p-6 mb-8">
          <h3 className="text-lg font-semibold text-nomanweb-primary mb-6 flex items-center space-x-2">
            <BookOpenIcon className="w-5 h-5" />
            <span>Story Details</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DetailCard
              title="Content Type"
              value={story.contentType}
              color={story.contentType === 'FREE' ? 'green' : story.contentType === 'PAID' ? 'blue' : 'purple'}
            />
            <DetailCard
              title="Moderation Status"
              value={story.moderationStatus}
              color={story.moderationStatus === 'APPROVED' ? 'green' : story.moderationStatus === 'PENDING' ? 'yellow' : 'red'}
            />
            <DetailCard
              title="Total Earnings"
              value={`${story.totalCoinsEarned} coins`}
              color="yellow"
            />
          </div>
        </div>

        {/* Chapter Management */}
        <div className="mb-8">
          <ChapterManagement storyId={storyId} isAuthor={isAuthor} />
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="card-elevated p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-nomanweb-primary mb-4">Delete Story</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this story? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
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
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  icon: Icon, 
  value, 
  label, 
  gradient 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  value: string; 
  label: string;
  gradient: string;
}) {
  return (
    <div className="text-center">
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${gradient} text-white mb-2`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold text-nomanweb-primary">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

// Detail Card Component
function DetailCard({ 
  title, 
  value, 
  color 
}: { 
  title: string; 
  value: string; 
  color: string;
}) {
  const colorClasses = {
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800'
  };

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
        {value}
      </span>
    </div>
  );
}

function StoryDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card-elevated overflow-hidden animate-pulse">
          <div className="md:flex">
            <div className="md:w-1/3">
              <div className="aspect-[3/4] bg-gray-200" />
            </div>
            <div className="md:w-2/3 p-6 lg:p-8">
              <div className="h-8 bg-gray-200 rounded mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-6" />
              <div className="h-20 bg-gray-200 rounded mb-6" />
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}