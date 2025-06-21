'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import EditProfileModal from '@/components/profile/EditProfileModal';
import { ProfileImageUpload } from '@/components/upload/ProfileImageUpload';
import { 
  Mail, 
  MapPin, 
  Calendar, 
  BookOpen, 
  Heart, 
  Users, 
  UserPlus,
  Settings,
  Camera,
  Check,
  X,
  Edit3,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { stats, followers, following, isLoading, error } = useUserProfile();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleProfileUpdate = (updatedUser: any) => {
    // Update user data in context
    updateUser(updatedUser);
  };

  const handleProfileImageChange = (imageUrl: string) => {
    // Update user profile image
    updateUser({ ...user, profileImageUrl: imageUrl });
    toast.success('Profile image updated successfully!');
  };

  const handleProfileImageRemove = () => {
    // Remove profile image
    updateUser({ ...user, profileImageUrl: null });
    toast.success('Profile image removed');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to view your profile.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">Failed to load profile data. Please try again.</p>
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
                  <ProfileImageUpload
                    value={user.profileImageUrl || ''}
                    onChange={handleProfileImageChange}
                    onRemove={handleProfileImageRemove}
                    size="lg"
                  />
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                        {user.displayName || user.username}
                      </h1>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>{user.email}</span>
                          {user.emailVerified ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">@{user.username}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                      <button 
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                        <span>Edit Profile</span>
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <BookOpen className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{stats?.writtenBooks || 0}</div>
                      <div className="text-sm text-gray-600">Written Books</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Heart className="h-6 w-6 text-red-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{stats?.booksCompleted || 0}</div>
                      <div className="text-sm text-gray-600">Books Completed</div>
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
                      <div className="text-2xl font-bold text-gray-900">{stats?.followers || 0}</div>
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
                      <div className="text-2xl font-bold text-gray-900">{stats?.following || 0}</div>
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
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="text-blue-600 hover:text-blue-700 p-2"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            </div>
            
            <div className="prose max-w-none">
              {user.bio ? (
                <p className="text-gray-700 leading-relaxed">{user.bio}</p>
              ) : (
                <p className="text-gray-500 italic">No bio available. Click edit to add your bio.</p>
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
                Followers ({stats?.followers || 0})
              </button>
              <button 
                onClick={() => setActiveTab('following')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'following' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Following ({stats?.following || 0})
              </button>
            </div>

            <div className="space-y-4">
              {/* Followers/Following List */}
              {activeTab === 'followers' && (
                <div>
                  {followers?.content && followers.content.length > 0 ? (
                    <>
                      {followers.content.map((follower) => (
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
                  {following?.content && following.content.length > 0 ? (
                    <>
                      {following.content.map((followingUser) => (
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

      {/* Edit Profile Modal */}
      {user && (
        <EditProfileModal
          user={user}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleProfileUpdate}
        />
      )}
    </div>
  );
} 