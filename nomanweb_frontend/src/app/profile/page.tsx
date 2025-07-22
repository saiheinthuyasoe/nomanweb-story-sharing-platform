'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { authApi } from '@/lib/api/auth';
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
  Loader2,
  Award,
  TrendingUp,
  Eye,
  Star,
  Zap,
  Crown
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser, refreshUser } = useAuth();
  const { stats, followers, following, isLoading, error } = useUserProfile();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');
  const [booksTab, setBooksTab] = useState<'written' | 'read'>('written');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleProfileUpdate = (updatedUser: any) => {
    updateUser(updatedUser);
  };

  const handleProfileImageChange = async (imageUrl: string) => {
    try {
      const updatedUser = await authApi.updateProfile({
        profileImageUrl: imageUrl,
      });
      
      updateUser(updatedUser);
      toast.success('Profile image updated successfully!');
    } catch (error) {
      console.error('Failed to update profile image:', error);
      toast.error('Failed to update profile image. Please try again.');
    }
  };

  const handleProfileImageRemove = async () => {
    try {
      const updatedUser = await authApi.updateProfile({
        profileImageUrl: undefined,
      });
      
      updateUser(updatedUser);
      toast.success('Profile image removed');
    } catch (error) {
      console.error('Failed to remove profile image:', error);
      toast.error('Failed to remove profile image. Please try again.');
    }
  };



  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-gray-200">
          <div className="w-16 h-16 bg-gradient-to-br from-[#18243c] to-[#22325a] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to view your profile.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-gray-200">
          <div className="w-16 h-16 bg-gradient-to-br from-[#18243c] to-[#22325a] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Profile</h2>
          <p className="text-gray-600">Please wait while we fetch your data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-gray-200">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">Failed to load profile data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/40">
      {/* Enhanced Profile Header Section */}
      <div className="relative">
        {/* Enhanced Cover Image with Overlay */}
        <div className="h-48 sm:h-64 relative overflow-hidden">
          {user.coverImageUrl ? (
            <div className="relative h-full">
            <img 
              src={user.coverImageUrl} 
              alt="Profile cover"
              className="w-full h-full object-cover"
            />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
            </div>
          ) : (
            <div className="h-full relative overflow-hidden">
              {/* Beautiful Default Cover Image with Multiple Layers */}
              <div className="absolute inset-0">
                {/* Base gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#18243c] via-[#22325a] to-[#2d4574]" />
                
                {/* Geometric pattern overlay */}
                <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0" 
                  style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='geometric' x='0' y='0' width='80' height='80' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 40L40 0L80 40L40 80Z' fill='%23ffffff' fill-opacity='0.1'/%3E%3Ccircle cx='40' cy='40' r='2' fill='%23ffffff' fill-opacity='0.2'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23geometric)'/%3E%3C/svg%3E")`,
                      backgroundSize: '80px 80px'
                    }} 
                  />
                </div>
                
                {/* Floating geometric shapes */}
                <div className="absolute top-16 left-16 w-16 h-16 border-2 border-white/20 rounded-full animate-pulse" />
                <div className="absolute top-32 right-24 w-8 h-8 bg-white/10 rounded-lg rotate-45 animate-pulse delay-1000" />
                <div className="absolute bottom-24 left-1/4 w-12 h-12 border border-white/15 rounded-full animate-pulse delay-500" />
                <div className="absolute top-1/2 right-16 w-6 h-6 bg-white/20 rounded-full animate-pulse delay-1500" />
                <div className="absolute bottom-16 right-1/3 w-10 h-10 border border-white/10 rounded-lg rotate-12 animate-pulse delay-2000" />
                
                {/* Subtle light rays effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-white/3 to-transparent" />
                
                {/* Central focal point */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-white/30" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
              
              {/* Subtle animated particles */}
              <div className="absolute top-20 left-20 w-2 h-2 bg-white/40 rounded-full animate-ping" />
              <div className="absolute top-40 right-32 w-1.5 h-1.5 bg-white/50 rounded-full animate-ping delay-300" />
              <div className="absolute bottom-32 left-1/3 w-3 h-3 bg-white/30 rounded-full animate-ping delay-700" />
              <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-white/60 rounded-full animate-ping delay-1000" />
            </div>
          )}
          

        </div>

        {/* Enhanced Profile Card */}
        <div className="relative px-4 sm:px-6 lg:px-8 -mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/50 p-6 sm:p-8 transition-all duration-500">
              <div className="flex flex-col lg:flex-row items-start lg:items-end space-y-4 lg:space-y-0 lg:space-x-8">
                
                {/* Enhanced Profile Picture */}
                <div className="relative flex-shrink-0 group">
                  {/* Subtle background glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#18243c]/10 to-[#22325a]/10 rounded-full opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                  
                  {/* Profile image container */}
                  <div className="relative">
                    <ProfileImageUpload
                      value={user.profileImageUrl || undefined}
                      onChange={handleProfileImageChange}
                      onRemove={handleProfileImageRemove}
                      size="xl"
                      className="relative z-10"
                    />
                    
                    {/* Green status indicator - more compact */}
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 border-3 border-white rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between space-y-4 xl:space-y-0">
                    
                    {/* User Details */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#18243c] to-[#22325a] bg-clip-text text-transparent">
                            {user.displayName || user.username}
                          </h1>
                          {user.emailVerified && (
                            <div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 text-base text-gray-600 mb-3">
                          <span className="font-medium">@{user.username}</span>
                          <Crown className="w-4 h-4 text-yellow-500" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center space-x-2 p-2 bg-gray-50/80 rounded-lg backdrop-blur-sm">
                          <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                            <Mail className="w-3 h-3 text-blue-600" />
                          </div>
                          <div>
                            <span className="text-gray-900 font-medium text-xs">{user.email}</span>
                            <div className="flex items-center space-x-1 mt-0.5">
                              {user.emailVerified ? (
                                <>
                                  <Check className="w-2.5 h-2.5 text-green-600" />
                                  <span className="text-green-600 text-xs font-medium">Verified</span>
                                </>
                              ) : (
                                <>
                                  <X className="w-2.5 h-2.5 text-red-600" />
                                  <span className="text-red-600 text-xs font-medium">Unverified</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 p-2 bg-gray-50/80 rounded-lg backdrop-blur-sm">
                          <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center">
                            <Calendar className="w-3 h-3 text-green-600" />
                          </div>
                          <div>
                            <span className="text-gray-900 font-medium text-xs">Member since</span>
                            <div className="text-gray-600 text-xs mt-0.5">
                              {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Action Button */}
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => setIsEditModalOpen(true)}
                        className="group flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#18243c] to-[#22325a] hover:from-[#22325a] hover:to-[#2d4574] text-white rounded-lg font-medium text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                      >
                        <Edit3 className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                        <span>Edit Profile</span>
                      </button>
                    </div>
                  </div>

                  {/* Enhanced Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                    {/* Stories Written Card */}
                    <div className="group relative p-6 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 hover:border-white/50 transition-all duration-500 cursor-pointer transform hover:scale-105 hover:shadow-2xl shadow-xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#18243c]/5 via-[#22325a]/3 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#18243c] to-[#22325a] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <BookOpen className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold bg-gradient-to-r from-[#18243c] to-[#22325a] bg-clip-text text-transparent">
                              {stats?.writtenBooks || 0}
                            </div>
                            <div className="text-xs font-medium text-[#18243c]">Stories</div>
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-800 mb-2">Stories Written</div>
                        <div className="text-xs text-gray-600">Your creative works</div>
                        <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-gradient-to-r from-[#18243c] to-[#22325a] h-1.5 rounded-full transition-all duration-500 group-hover:w-full" style={{ width: `${Math.min((stats?.writtenBooks || 0) * 10, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                    
                    {/* Stories Read Card */}
                    <div className="group relative p-6 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 hover:border-white/50 transition-all duration-500 cursor-pointer transform hover:scale-105 hover:shadow-2xl shadow-xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-red-400/3 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <Heart className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                              {stats?.readBooks || 0}
                            </div>
                            <div className="text-xs font-medium text-red-600">Stories</div>
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-800 mb-2">Stories Read</div>
                        <div className="text-xs text-gray-600">Your reading journey</div>
                        <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-gradient-to-r from-red-500 to-red-600 h-1.5 rounded-full transition-all duration-500 group-hover:w-full" style={{ width: `${Math.min((stats?.readBooks || 0) * 10, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                    
                    {/* Followers Card */}
                    <button 
                      onClick={() => setActiveTab('followers')}
                      className={`group relative p-6 backdrop-blur-xl rounded-2xl border transition-all duration-500 cursor-pointer transform hover:scale-105 hover:shadow-2xl shadow-xl ${
                        activeTab === 'followers' 
                          ? 'bg-white/90 border-white/50 shadow-xl' 
                          : 'bg-white/80 border-white/50 hover:border-white/50'
                      }`}
                    >
                      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-blue-400/5 via-blue-300/3 to-transparent" />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br from-blue-400 to-blue-500">
                            <Users className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                              {stats?.followers || 0}
                            </div>
                            <div className="text-xs font-medium text-blue-500">Followers</div>
                          </div>
                        </div>
                        <div className="text-sm font-semibold mb-2 text-gray-800">Followers</div>
                        <div className="text-xs text-gray-600">Your community</div>
                        <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-gradient-to-r from-blue-400 to-blue-500 h-1.5 rounded-full transition-all duration-500 group-hover:w-full" style={{ width: `${Math.min((stats?.followers || 0) * 10, 100)}%` }} />
                        </div>
                      </div>
                    </button>
                    
                    {/* Following Card */}
                    <button 
                      onClick={() => setActiveTab('following')}
                      className={`group relative p-6 backdrop-blur-xl rounded-2xl border transition-all duration-500 cursor-pointer transform hover:scale-105 hover:shadow-2xl shadow-xl ${
                        activeTab === 'following' 
                          ? 'bg-white/90 border-white/50 shadow-xl' 
                          : 'bg-white/80 border-white/50 hover:border-white/50'
                      }`}
                    >
                      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                        activeTab === 'following' 
                          ? 'bg-gradient-to-br from-[#18243c]/10 via-[#22325a]/5 to-transparent' 
                          : 'bg-gradient-to-br from-green-500/5 via-green-400/3 to-transparent'
                      }`} />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                            activeTab === 'following' 
                              ? 'bg-gradient-to-br from-[#18243c] to-[#22325a]' 
                              : 'bg-gradient-to-br from-green-500 to-green-600'
                          }`}>
                            <UserPlus className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-right">
                            <div className={`text-3xl font-bold bg-clip-text text-transparent ${
                              activeTab === 'following' 
                                ? 'bg-gradient-to-r from-[#18243c] to-[#22325a]' 
                                : 'bg-gradient-to-r from-green-600 to-green-700'
                            }`}>
                              {stats?.following || 0}
                            </div>
                            <div className={`text-xs font-medium ${
                              activeTab === 'following' 
                                ? 'text-[#18243c]' 
                                : 'text-green-600'
                            }`}>Following</div>
                          </div>
                        </div>
                        <div className={`text-sm font-semibold mb-2 ${
                          activeTab === 'following' 
                            ? 'text-[#18243c]' 
                            : 'text-gray-800'
                        }`}>Following</div>
                        <div className="text-xs text-gray-600">People you follow</div>
                        <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full transition-all duration-500 group-hover:w-full ${
                            activeTab === 'following' 
                              ? 'bg-gradient-to-r from-[#18243c] to-[#22325a]' 
                              : 'bg-gradient-to-r from-green-500 to-green-600'
                          }`} style={{ width: `${Math.min((stats?.following || 0) * 10, 100)}%` }} />
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Bio Section */}
      <div className="px-4 sm:px-6 lg:px-8 mt-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#18243c] to-[#22325a] rounded-lg flex items-center justify-center">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-[#18243c] to-[#22325a] bg-clip-text text-transparent">About Me</h2>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="group p-2 text-[#18243c] hover:bg-[#18243c]/10 rounded-lg transition-all duration-200 hover:scale-110"
              >
                <Edit3 className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
              </button>
            </div>
            
            <div className="relative">
              {user.bio ? (
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 leading-relaxed text-sm font-medium bg-gradient-to-r from-gray-50 to-blue-50/30 p-4 rounded-xl border border-gray-200/50">
                    {user.bio}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Edit3 className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-base font-medium mb-1">No bio available</p>
                  <p className="text-gray-400 text-xs">Click edit to add your bio and tell the world about yourself!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Books Section */}
      <div className="px-4 sm:px-6 lg:px-8 mt-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-[#18243c] to-[#22325a] rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-[#18243c] to-[#22325a] bg-clip-text text-transparent">My Library</h2>
            </div>

            {/* Enhanced Tab Navigation */}
            <div className="flex items-center space-x-2 mb-6 p-1 bg-gray-100/80 rounded-xl backdrop-blur-sm">
              <button 
                onClick={() => setBooksTab('written')}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-300 ${
                  booksTab === 'written' 
                    ? 'bg-white text-[#18243c] shadow-md transform scale-105' 
                    : 'text-gray-600 hover:text-[#18243c] hover:bg-white/50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Written ({stats?.writtenBooks || 0})</span>
              </button>
              <button 
                onClick={() => setBooksTab('read')}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-300 ${
                  booksTab === 'read' 
                    ? 'bg-white text-[#18243c] shadow-md transform scale-105' 
                    : 'text-gray-600 hover:text-[#18243c] hover:bg-white/50'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>Read ({stats?.readBooks || 0})</span>
              </button>
            </div>

            {/* Enhanced Tab Content */}
            <div className="min-h-[200px]">
              {booksTab === 'written' && (
                  <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#18243c]/10 to-[#22325a]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 transform hover:scale-110 transition-transform duration-300">
                    <BookOpen className="w-8 h-8 text-[#18243c]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No stories yet</h3>
                  <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
                    Start your writing journey and share your creativity with the world!
                  </p>
                  <button className="group flex items-center space-x-2 mx-auto px-6 py-3 bg-gradient-to-r from-[#18243c] to-[#22325a] hover:from-[#22325a] hover:to-[#2d4574] text-white rounded-xl font-medium text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105">
                    <Zap className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Write Your First Story</span>
                  </button>
                </div>
              )}

              {booksTab === 'read' && (
                  <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mx-auto mb-4 transform hover:scale-110 transition-transform duration-300">
                    <Heart className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No books read yet</h3>
                  <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
                    Discover amazing stories from talented writers in our community!
                  </p>
                  <button className="group flex items-center space-x-2 mx-auto px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105">
                    <TrendingUp className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Browse Stories</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Followers/Following Section */}
      <div className="px-4 sm:px-6 lg:px-8 mt-6 mb-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-[#18243c] to-[#22325a] rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-[#18243c] to-[#22325a] bg-clip-text text-transparent">Community</h2>
            </div>

            {/* Enhanced Tab Navigation */}
            <div className="flex items-center space-x-2 mb-6 p-1 bg-gray-100/80 rounded-xl backdrop-blur-sm">
              <button 
                onClick={() => setActiveTab('followers')}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-300 ${
                  activeTab === 'followers' 
                    ? 'bg-white text-blue-600 shadow-md transform scale-105' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-white/50'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Followers ({stats?.followers || 0})</span>
              </button>
              <button 
                onClick={() => setActiveTab('following')}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-300 ${
                  activeTab === 'following' 
                    ? 'bg-white text-green-600 shadow-md transform scale-105' 
                    : 'text-gray-600 hover:text-green-600 hover:bg-white/50'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Following ({stats?.following || 0})</span>
              </button>
            </div>

            <div className="space-y-4 min-h-[200px]">
              {/* Enhanced Followers Grid */}
              {activeTab === 'followers' && (
                <div>
                  {followers?.content && followers.content.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {followers.content.map((follower) => (
                        <div key={follower.id} className="group relative p-6 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 hover:border-blue-400/20 transition-all duration-500 cursor-pointer transform hover:scale-105 hover:shadow-2xl">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-blue-300/3 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                              <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-300">
                                  {follower.profileImageUrl ? (
                                    <Image
                                      src={follower.profileImageUrl}
                                      alt={follower.displayName || follower.username}
                                      width={48}
                                      height={48}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-lg font-bold text-gray-600">
                                      {(follower.displayName || follower.username).charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-medium text-blue-600 bg-white/80 px-2 py-1 rounded-lg backdrop-blur-sm">
                                  {formatDistanceToNow(new Date(follower.followedAt), { addSuffix: true })}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                                {follower.displayName || follower.username}
                              </div>
                              <div className="text-xs text-gray-500 font-medium">@{follower.username}</div>
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-xs text-green-600 font-medium">Active</span>
                              </div>
                            </div>
                            <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5">
                              <div className="bg-gradient-to-r from-blue-400 to-blue-500 h-1.5 rounded-full transition-all duration-500 group-hover:w-full" style={{ width: '100%' }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-400/10 to-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 transform hover:scale-110 transition-transform duration-300">
                        <Users className="w-10 h-10 text-blue-500" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">No followers yet</h3>
                      <p className="text-gray-600 text-base mb-6 max-w-md mx-auto">
                        Share great content and engage with the community to attract followers!
                      </p>
                      <div className="flex items-center justify-center space-x-4">
                        <div className="flex items-center space-x-2 px-4 py-2 bg-[#18243c]/10 rounded-xl border border-[#18243c]/20">
                          <BookOpen className="w-4 h-4 text-[#18243c]" />
                          <span className="text-sm font-medium text-[#18243c]">Write Stories</span>
                        </div>
                        <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 rounded-xl">
                          <Heart className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">Engage</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Enhanced Following Grid */}
              {activeTab === 'following' && (
                <div>
                  {following?.content && following.content.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {following.content.map((followingUser) => (
                        <div key={followingUser.id} className="group relative p-6 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 hover:border-green-400/20 transition-all duration-500 cursor-pointer transform hover:scale-105 hover:shadow-2xl">
                          <div className="absolute inset-0 bg-gradient-to-br from-green-400/5 via-green-300/3 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                              <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-300">
                                  {followingUser.profileImageUrl ? (
                                    <Image
                                      src={followingUser.profileImageUrl}
                                      alt={followingUser.displayName || followingUser.username}
                                      width={48}
                                      height={48}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-lg font-bold text-gray-600">
                                      {(followingUser.displayName || followingUser.username).charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-medium text-green-600 bg-white/80 px-2 py-1 rounded-lg backdrop-blur-sm">
                                  {formatDistanceToNow(new Date(followingUser.followedAt), { addSuffix: true })}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="font-bold text-sm text-gray-900 group-hover:text-green-600 transition-colors duration-300">
                                {followingUser.displayName || followingUser.username}
                              </div>
                              <div className="text-xs text-gray-500 font-medium">@{followingUser.username}</div>
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-xs text-green-600 font-medium">Active</span>
                              </div>
                            </div>
                            <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5">
                              <div className="bg-gradient-to-r from-green-400 to-green-500 h-1.5 rounded-full transition-all duration-500 group-hover:w-full" style={{ width: '100%' }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-gradient-to-br from-green-400/10 to-green-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 transform hover:scale-110 transition-transform duration-300">
                        <UserPlus className="w-10 h-10 text-green-500" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Not following anyone yet</h3>
                      <p className="text-gray-600 text-base mb-6 max-w-md mx-auto">
                        Discover and follow amazing writers to build your reading community!
                      </p>
                      <div className="flex items-center justify-center space-x-4">
                        <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 rounded-xl">
                          <BookOpen className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">Browse Stories</span>
                        </div>
                        <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-xl">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700">Find Authors</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Edit Profile Modal */}
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