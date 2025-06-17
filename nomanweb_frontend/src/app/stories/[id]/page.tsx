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
import { 
  BookOpen, 
  Heart, 
  Share2, 
  Plus, 
  Star, 
  Eye, 
  MessageCircle, 
  ThumbsUp, 
  Flag, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  User,
  Gift,
  Tag
} from 'lucide-react';

interface StoryDetails {
  id: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  author: {
    id: string;
    username: string;
    displayName?: string;
    profileImageUrl?: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'SUSPENDED';
  totalChapters: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  rating: number;
  ratingCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
  views: number;
  likes: number;
  createdAt: string;
}

interface Comment {
  id: string;
  user: {
    id: string;
    username: string;
    profileImageUrl?: string;
  };
  content: string;
  likes: number;
  createdAt: string;
  replies?: Comment[];
}

export default function StoryReaderView() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const storyId = params.id as string;
  
  const { data: story, isLoading, error } = useStory(storyId);
  const { mutate: publishStory, isPending: isPublishing } = usePublishStory();
  const { mutate: unpublishStory, isPending: isUnpublishing } = useUnpublishStory();
  const { mutate: deleteStory, isPending: isDeleting } = useDeleteStory();
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'chapters' | 'comments'>('about');
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [giftAmount, setGiftAmount] = useState('');

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

  const handleReadStory = () => {
    router.push(`/stories/${storyId}/read/1`);
  };

  const handleAddToLibrary = () => {
    setIsInLibrary(!isInLibrary);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleRating = (rating: number) => {
    setUserRating(rating);
    // Submit rating to API
  };

  const handleCommentSubmit = () => {
    if (newComment.trim()) {
      // Submit comment to API
      setNewComment('');
    }
  };

  const getContentStatus = (status: string) => {
    return status === 'COMPLETED' ? 'Completed' : 'Ongoing';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Mock data for chapters and comments since they're not in the Story type
  const chapters = Array.from({ length: 10 }, (_, i) => ({
    id: `chapter-${i + 1}`,
    chapterNumber: i + 1,
    title: `Chapter ${i + 1}: ${['The Beginning', 'First Steps', 'Discovery', 'The Challenge', 'New Allies', 'Dark Secrets', 'The Battle', 'Revelations', 'The Choice', 'New Dawn'][i]}`,
    content: "Chapter content preview...",
    wordCount: 2500 + Math.floor(Math.random() * 1000),
    views: Math.floor(Math.random() * 5000) + 1000,
    likes: Math.floor(Math.random() * 500) + 50,
    createdAt: new Date(2024, 0, 15 + i).toISOString()
  }));

  const comments = Array.from({ length: 5 }, (_, i) => ({
    id: `comment-${i + 1}`,
    user: {
      id: `user-${i + 1}`,
      username: `reader${i + 1}`,
      profileImageUrl: "/api/placeholder/32/32"
    },
    content: [
      "This story is absolutely amazing! The world-building is incredible and the characters feel so real.",
      "I can't wait for the next chapter! The cliffhanger is killing me.",
      "The magic system in this story is so well thought out. Love the attention to detail!",
      "Been following this story from the beginning. It just keeps getting better!",
      "The character development is phenomenal. Aria's growth throughout the story is beautiful."
    ][i],
    likes: Math.floor(Math.random() * 100) + 10,
    createdAt: new Date(2024, 11, 1 - i).toISOString()
  }));

  const recommendedStories = Array.from({ length: 5 }, (_, i) => ({
    id: `rec-${i + 1}`,
    title: ['Realm of Shadows', 'Dragon\'s Legacy', 'The Enchanted Forest', 'Mystic Warriors', 'Kingdom of Light'][i],
    rating: 4.0 + Math.random(),
    genre: ['Fantasy', 'Adventure', 'Romance', 'Sci-Fi', 'Mystery'][i],
    coverImageUrl: "/api/placeholder/150/200"
  }));

  // Mock rating data since it's not in the Story type
  const storyRating = 4.25;
  const storyRatingCount = 1250;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <span>/</span>
            {story.category ? (
              <Link href={`/categories/${story.category.slug}`} className="hover:text-blue-600 transition-colors">
                {story.category.name}
              </Link>
            ) : (
              <span>Uncategorized</span>
            )}
            <span>/</span>
            <span className="text-gray-900 font-medium truncate">{story.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Book Details Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Book Cover */}
            <div className="lg:col-span-1">
              <div className="relative w-full max-w-sm mx-auto">
                {story.coverImageUrl ? (
                  <div className="relative w-full aspect-[3/4] overflow-hidden rounded-lg shadow-xl border border-gray-300">
                    <Image
                      src={story.coverImageUrl}
                      alt={story.title}
                      fill
                      className="object-cover"
                    />
                    {/* Book spine effect */}
                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-l from-black/30 to-transparent"></div>
                    {/* Book depth shadow */}
                    <div className="absolute -right-1 top-2 bottom-2 w-3 bg-gradient-to-r from-gray-400/40 to-gray-600/60 rounded-r-lg -z-10"></div>
                  </div>
                ) : (
                  <div className="relative w-full aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg shadow-xl border border-gray-300 overflow-hidden">
                    {/* Book cover design */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100"></div>
                    <div className="absolute top-4 left-4 right-4 bottom-4 border border-blue-200 rounded-md bg-white/50"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="h-20 w-20 text-blue-600 relative z-10" />
                    </div>
                    {/* Book spine shadow */}
                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-l from-black/20 to-transparent"></div>
                    {/* Book depth shadow */}
                    <div className="absolute -right-1 top-2 bottom-2 w-3 bg-gradient-to-r from-gray-400/40 to-gray-600/60 rounded-r-lg -z-10"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Book Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title and Author */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{story.title}</h1>
                <p className="text-lg text-gray-600 mb-1">{story.category?.name || 'Uncategorized'}</p>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <Link 
                    href={`/authors/${story.author.id}`}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {story.author.displayName || story.author.username}
                  </Link>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Eye className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                  <div className="text-lg font-semibold text-gray-900">{formatNumber(story.totalViews)}</div>
                  <div className="text-xs text-gray-500">Views</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Heart className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                  <div className="text-lg font-semibold text-gray-900">{formatNumber(story.totalLikes)}</div>
                  <div className="text-xs text-gray-500">Likes</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <BookOpen className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                  <div className="text-lg font-semibold text-gray-900">{story.totalChapters}</div>
                  <div className="text-xs text-gray-500">Chapters</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mb-1 ${
                    story.status === 'COMPLETED' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {getContentStatus(story.status)}
                  </div>
                  <div className="text-xs text-gray-500">Status</div>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.floor(storyRating)
                          ? 'text-yellow-400 fill-current'
                          : star <= storyRating
                          ? 'text-yellow-400 fill-current opacity-50'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-lg font-semibold text-gray-900 ml-2">{storyRating}</span>
                  <span className="text-sm text-gray-500">({formatNumber(storyRatingCount)} ratings)</span>
                </div>
              </div>

              {/* Report Link */}
              <div>
                <button className="text-red-600 hover:text-red-700 text-sm flex items-center space-x-1">
                  <Flag className="h-4 w-4" />
                  <span>Report story</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleReadStory}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                >
                  <BookOpen className="h-5 w-5" />
                  <span>Read</span>
                </button>
                <button
                  onClick={handleAddToLibrary}
                  className={`px-6 py-3 rounded-lg transition-colors font-medium flex items-center space-x-2 ${
                    isInLibrary
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Plus className="h-5 w-5" />
                  <span>{isInLibrary ? 'In Library' : 'Add to Library'}</span>
                </button>
                <button
                  onClick={handleShare}
                  className="bg-white text-gray-700 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-medium flex items-center space-x-2"
                >
                  <Share2 className="h-5 w-5" />
                  <span>Share</span>
                </button>
                <button
                  onClick={handleLike}
                  className={`px-6 py-3 rounded-lg transition-colors font-medium flex items-center space-x-2 ${
                    isLiked
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                  <span>Like</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              {[
                { id: 'about', label: 'About' },
                { id: 'chapters', label: `Chapters (${story.totalChapters})` },
                { id: 'comments', label: `Comments (${story.totalComments})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{story.description}</p>
                </div>
                
                {/* Tags */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {story.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'chapters' && (
              <div className="space-y-4">
                {chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/stories/${storyId}/read/${chapter.chapterNumber}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{chapter.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {formatNumber(chapter.wordCount)} words • {formatDate(chapter.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>{formatNumber(chapter.views)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="h-4 w-4" />
                          <span>{formatNumber(chapter.likes)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="space-y-6">
                {/* Comment Input */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={handleCommentSubmit}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {comment.user.profileImageUrl ? (
                            <Image
                              src={comment.user.profileImageUrl}
                              alt={comment.user.username}
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900">{comment.user.username}</span>
                            <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
                          </div>
                          <p className="text-gray-700 mb-2">{comment.content}</p>
                          <div className="flex items-center space-x-4">
                            <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600">
                              <ThumbsUp className="h-4 w-4" />
                              <span>{comment.likes}</span>
                            </button>
                            <button className="text-sm text-gray-500 hover:text-red-600">
                              <Flag className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gift Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Gift className="h-5 w-5 mr-2 text-purple-600" />
            Support the Author
          </h3>
          <div className="flex items-center space-x-4">
            <input
              type="number"
              value={giftAmount}
              onChange={(e) => setGiftAmount(e.target.value)}
              placeholder="Enter amount"
              className="flex-1 max-w-xs p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium">
              Send Gift
            </button>
          </div>
        </div>

        {/* User Rating Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate this Story</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => handleRating(star)}
                  className="transition-colors"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || userRating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-gray-600">
              {userRating > 0 ? `You rated: ${userRating} stars` : 'Click to rate'}
            </span>
          </div>
        </div>

        {/* Recommended Stories */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recommended For You</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {recommendedStories.map((recStory) => (
              <Link
                key={recStory.id}
                href={`/stories/${recStory.id}`}
                className="group block"
              >
                <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                  <div className="aspect-[3/4] bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mb-3 flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-blue-500" />
                  </div>
                  <h4 className="font-medium text-gray-900 text-sm mb-1 group-hover:text-blue-600 transition-colors">
                    {recStory.title}
                  </h4>
                  <div className="flex items-center space-x-1 mb-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-gray-600">{recStory.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-gray-500">{recStory.genre}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
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