'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  HeartIcon,
  EllipsisHorizontalIcon,
  BookOpenIcon,
  EyeIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  AtSymbolIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { 
  Mail, 
  Calendar, 
  BookOpen, 
  Heart, 
  Users, 
  UserPlus,
  Loader2,
  Check,
  X,
  Gift
} from 'lucide-react';
import { usersApi, UserProfile } from '@/lib/api/users';
import { storiesApi } from '@/lib/api/stories';
import { StoryPreview } from '@/types/story';
import { StoryCard } from '@/components/stories/StoryCard';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import EnhancedGiftModal from '@/components/monetization/EnhancedGiftModal';

export default function AuthorProfile() {
  const params = useParams();
  const authorId = params.authorId as string;
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [writtenStories, setWrittenStories] = useState<StoryPreview[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');
  const [booksTab, setBooksTab] = useState<'written' | 'read'>('written');
  const [followLoading, setFollowLoading] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);

  useEffect(() => {
    const fetchAuthorData = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile
        const profile = await usersApi.getUserProfile(authorId);
        setUserProfile(profile);
        
        // Fetch user's written stories
        const storiesResponse = await storiesApi.getStoriesByAuthor(authorId, { page: 0, size: 12 });
        setWrittenStories(storiesResponse.content);
        
        // Fetch followers and following
        const followersResponse = await usersApi.getFollowers(authorId, 0, 20);
        setFollowers(followersResponse.content);
        
        const followingResponse = await usersApi.getFollowing(authorId, 0, 20);
        setFollowing(followingResponse.content);
        
        // Check if current user follows this author
        try {
          const followStatus = await usersApi.isFollowing(authorId);
          setIsFollowing(followStatus);
        } catch (error) {
          // User might not be logged in
          console.log('Not logged in or error checking follow status');
        }
        
      } catch (error) {
        console.error('Error fetching author data:', error);
        toast.error('Failed to load author profile');
      } finally {
        setLoading(false);
      }
    };

    if (authorId) {
      fetchAuthorData();
    }
  }, [authorId]);

  const handleFollowToggle = async () => {
    if (!userProfile) return;
    
    try {
      setFollowLoading(true);
      
      if (isFollowing) {
        await usersApi.unfollowUser(authorId);
        setIsFollowing(false);
        toast.success(`Unfollowed ${userProfile.displayName || userProfile.username}`);
      } else {
        await usersApi.followUser(authorId);
        setIsFollowing(true);
        toast.success(`Following ${userProfile.displayName || userProfile.username}`);
      }
      
      // Update followers count in profile
      setUserProfile(prev => prev ? {
        ...prev,
        stats: {
          ...prev.stats,
          followers: prev.stats.followers + (isFollowing ? -1 : 1)
        }
      } : null);
      
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to follow/unfollow user');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Author not found</h1>
          <p className="text-gray-600">The author you're looking for doesn't exist.</p>
          <Link 
            href="/"
            className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Header Section */}
      <div className="relative">
        {/* Cover Image - Decorative Gradient */}
        <div className="h-64 sm:h-80 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          
          {/* Decorative Pattern Overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" 
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '40px 40px'
              }} 
            />
          </div>
        </div>

        {/* Profile Info Overlay */}
        <div className="relative px-4 sm:px-6 lg:px-8 -mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
                {/* Profile Picture */}
                <div className="relative flex-shrink-0">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200">
                    {userProfile.profileImageUrl ? (
                      <Image
                        src={userProfile.profileImageUrl}
                        alt={userProfile.displayName || userProfile.username}
                        width={160}
                        height={160}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300">
                        <span className="text-2xl sm:text-3xl font-semibold text-gray-600">
                          {(userProfile.displayName || userProfile.username).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                        {userProfile.displayName || userProfile.username}
                      </h1>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>{userProfile.email}</span>
                          {userProfile.emailVerified ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">@{userProfile.username}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Joined {formatDistanceToNow(new Date(userProfile.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                      <button
                        onClick={handleFollowToggle}
                        disabled={followLoading}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          isFollowing
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isFollowing ? (
                          <HeartSolidIcon className="w-5 h-5" />
                        ) : (
                          <HeartIcon className="w-5 h-5" />
                        )}
                        <span>{followLoading ? 'Loading...' : (isFollowing ? 'Following' : 'Follow')}</span>
                      </button>
                      
                      <button
                        onClick={() => setShowGiftModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                      >
                        <Gift className="w-5 h-5" />
                        <span>Send Gift</span>
                      </button>
                      
                      <button className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors">
                        <EllipsisHorizontalIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <BookOpen className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{userProfile.stats.writtenBooks}</div>
                      <div className="text-sm text-gray-600">Written Books</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Heart className="h-6 w-6 text-red-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{userProfile.stats.readBooks}</div>
                      <div className="text-sm text-gray-600">Read Books</div>
                    </div>
                    
                    <button 
                      onClick={() => setActiveTab('followers')}
                      className={`text-center p-4 rounded-lg transition-colors ${
                        activeTab === 'followers' 
                          ? 'bg-blue-100 border-2 border-blue-300' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{userProfile.stats.followers}</div>
                      <div className="text-sm text-gray-600">Followers</div>
                    </button>
                    
                    <button 
                      onClick={() => setActiveTab('following')}
                      className={`text-center p-4 rounded-lg transition-colors ${
                        activeTab === 'following' 
                          ? 'bg-blue-100 border-2 border-blue-300' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <UserPlus className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{userProfile.stats.following}</div>
                      <div className="text-sm text-gray-600">Following</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bio Section */}
      <div className="px-4 sm:px-6 lg:px-8 mt-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Bio</h2>
            </div>
            
            <div className="prose max-w-none">
              {userProfile.bio ? (
                <p className="text-gray-700 leading-relaxed">{userProfile.bio}</p>
              ) : (
                <p className="text-gray-500 italic">No bio available.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Books Section with Tabs */}
      <div className="px-4 sm:px-6 lg:px-8 mt-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            {/* Tab Navigation */}
            <div className="flex items-center space-x-4 mb-6">
              <button 
                onClick={() => setBooksTab('written')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  booksTab === 'written' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Written Books ({userProfile.stats.writtenBooks})
              </button>
              <button 
                onClick={() => setBooksTab('read')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  booksTab === 'read' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Read Books ({userProfile.stats.readBooks})
              </button>
            </div>

            {/* Tab Content */}
            <div>
              {booksTab === 'written' && (
                <div>
                  {writtenStories.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {writtenStories.map((story) => (
                        <StoryCard 
                          key={story.id} 
                          story={story} 
                          showAuthor={false}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BookOpenIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No stories yet</h3>
                      <p className="text-gray-500">
                        {userProfile.displayName || userProfile.username} hasn't published any stories yet.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {booksTab === 'read' && (
                <div>
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Reading history coming soon</h3>
                    <p className="text-gray-500">
                      Reading history feature will be available in a future update.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Followers/Following Section */}
      <div className="px-4 sm:px-6 lg:px-8 mt-8 mb-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <div className="flex items-center space-x-4 mb-6">
              <button 
                onClick={() => setActiveTab('followers')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'followers' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Followers ({userProfile.stats.followers})
              </button>
              <button 
                onClick={() => setActiveTab('following')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'following' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Following ({userProfile.stats.following})
              </button>
            </div>

            <div className="space-y-4">
              {/* Followers/Following List */}
              {activeTab === 'followers' && (
                <div>
                  {followers && followers.length > 0 ? (
                    <>
                      {followers.map((follower) => (
                        <div key={follower.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                              {follower.profileImageUrl ? (
                                <Image
                                  src={follower.profileImageUrl}
                                  alt={follower.displayName || follower.username}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-lg font-semibold text-gray-600">
                                  {(follower.displayName || follower.username).charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {follower.displayName || follower.username}
                              </div>
                              <div className="text-sm text-gray-500">@{follower.username}</div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(follower.followedAt), { addSuffix: true })}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No followers yet.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'following' && (
                <div>
                  {following && following.length > 0 ? (
                    <>
                      {following.map((followingUser) => (
                        <div key={followingUser.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                              {followingUser.profileImageUrl ? (
                                <Image
                                  src={followingUser.profileImageUrl}
                                  alt={followingUser.displayName || followingUser.username}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-lg font-semibold text-gray-600">
                                  {(followingUser.displayName || followingUser.username).charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {followingUser.displayName || followingUser.username}
                              </div>
                              <div className="text-sm text-gray-500">@{followingUser.username}</div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(followingUser.followedAt), { addSuffix: true })}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>Not following anyone yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gift Modal */}
      <EnhancedGiftModal
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        recipientId={authorId}
        recipientName={userProfile?.displayName || userProfile?.username || 'Author'}
        onGiftSent={() => {
          toast.success('Gift sent successfully!');
        }}
      />
    </div>
  );
} 