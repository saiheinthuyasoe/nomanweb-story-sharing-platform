"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { authApi } from "@/lib/api/auth";
import EditProfileModal from "@/components/profile/EditProfileModal";
import { ProfileImageUpload } from "@/components/upload/ProfileImageUpload";
import { useFollowers, useFollowing, useToggleFollow } from "@/hooks/useFollow";
import NotificationPreferences from "@/components/profile/NotificationPreferences";
import FollowerFollowingList from "@/components/profile/FollowerFollowingList";
import { useMyStories } from "@/hooks/useStories";
import { useCurrentlyReading, useCompletedStories } from "@/hooks/useLibraries";
import Link from "next/link";
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
  Eye,
  Bell,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, updateUser, refreshUser } = useAuth();
  const { stats, followers, following, isLoading, error } = useUserProfile();
  const [activeTab, setActiveTab] = useState<"followers" | "following">(
    "followers"
  );
  const [booksTab, setBooksTab] = useState<"written" | "read">("written");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);

  // Books data
  const { data: myStoriesData } = useMyStories();
  const { data: currentlyReadingData = [] } = useCurrentlyReading();
  const { data: completedStoriesData = [] } = useCompletedStories();

  // Combine reading data
  const readBooksData = [...currentlyReadingData, ...completedStoriesData];

  const handleUserFollowed = (userId: string) => {
    // Refresh user profile data when a user is followed
    refreshUser();
  };

  const handleUserUnfollowed = (userId: string) => {
    // Refresh user profile data when a user is unfollowed
    refreshUser();
  };

  const handleProfileUpdate = (updatedUser: any) => {
    // Update user data in context
    updateUser(updatedUser);
  };

  const handleProfileImageChange = async (imageUrl: string) => {
    try {
      // Update user profile image on the backend
      const updatedUser = await authApi.updateProfile({
        profileImageUrl: imageUrl,
      });

      // Update user data in context
      updateUser(updatedUser);
      toast.success("Profile image updated successfully!");
    } catch (error) {
      console.error("Failed to update profile image:", error);
      toast.error("Failed to update profile image. Please try again.");
    }
  };

  const handleProfileImageRemove = async () => {
    try {
      // Remove profile image on the backend
      const updatedUser = await authApi.updateProfile({
        profileImageUrl: null,
      });

      // Update user data in context
      updateUser(updatedUser);
      toast.success("Profile image removed");
    } catch (error) {
      console.error("Failed to remove profile image:", error);
      toast.error("Failed to remove profile image. Please try again.");
    }
  };

  // Debug logging (can be removed in production)
  // console.log('User profile data:', user);
  // console.log('Profile image URL:', user?.profileImageUrl);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Please log in
          </h2>
          <p className="text-gray-600">
            You need to be logged in to view your profile.
          </p>
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
          <p className="text-gray-600">
            Failed to load profile data. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Header Section */}
      <div className="relative">
        {/* Removed Cover Image Section */}

        {/* Profile Info Section */}
        <div className="relative px-3 sm:px-4 md:px-6 lg:px-8 pt-4 sm:pt-6 md:pt-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-4 md:space-x-6">
                {/* Profile Picture */}
                <div className="relative flex-shrink-0 w-full sm:w-auto flex justify-center sm:justify-start">
                  <ProfileImageUpload
                    value={user.profileImageUrl || undefined}
                    onChange={handleProfileImageChange}
                    onRemove={handleProfileImageRemove}
                    size="lg"
                  />
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                        {user.displayName || user.username}
                      </h1>

                      <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{user.email}</span>
                          {user.emailVerified ? (
                            <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                          ) : (
                            <X className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                          )}
                        </div>

                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <span className="text-gray-500">
                            @{user.username}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-2 sm:mt-0">
                      <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center space-x-1 px-2 sm:px-3 py-1 sm:py-1.5 text-white rounded-md text-xs sm:text-sm font-medium transition-colors"
                        style={{ backgroundColor: "#18243c" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#1a2a47")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = "#18243c")
                        }
                      >
                        <Edit3 className="h-3 w-3" />
                        <span className="hidden xs:inline">Edit Profile</span>
                        <span className="xs:hidden">Edit</span>
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mt-4 sm:mt-6">
                    <div className="text-center py-1 sm:py-2">
                      <div className="text-lg sm:text-xl font-semibold text-gray-900">
                        {stats?.writtenBooks || 0}
                      </div>
                      <div className="text-xs text-gray-500">Written Books</div>
                    </div>

                    <div className="text-center py-1 sm:py-2">
                      <div className="text-lg sm:text-xl font-semibold text-gray-900">
                        {stats?.readBooks || 0}
                      </div>
                      <div className="text-xs text-gray-500">Read Books</div>
                    </div>

                    <button
                      onClick={() => setActiveTab("followers")}
                      className="text-center py-1 sm:py-2 transition-colors hover:text-gray-700"
                    >
                      <div className="text-lg sm:text-xl font-semibold text-gray-900">
                        {stats?.followers || 0}
                      </div>
                      <div className="text-xs text-gray-500">Followers</div>
                    </button>

                    <button
                      onClick={() => setActiveTab("following")}
                      className="text-center py-1 sm:py-2 transition-colors hover:text-gray-700"
                    >
                      <div className="text-lg sm:text-xl font-semibold text-gray-900">
                        {stats?.following || 0}
                      </div>
                      <div className="text-xs text-gray-500">Following</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bio Section */}
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 mt-6 sm:mt-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Bio</h2>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="text-black hover:text-gray-700 p-1.5 sm:p-2"
              >
                <Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>

            <div className="prose max-w-none">
              {user.bio ? (
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{user.bio}</p>
              ) : (
                <p className="text-sm sm:text-base text-gray-500 italic">
                  No bio available. Click edit to add your bio.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Preferences Section */}
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 mt-6 sm:mt-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
            <NotificationPreferences userId={user.id} />
          </div>
        </div>
      </div>

      {/* Books Section with Tabs */}
      <div className="px-4 sm:px-6 lg:px-8 mt-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="flex items-center justify-between border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {[
                    {
                      id: "written",
                      label: "Written Books",
                      count: stats?.writtenBooks || 0,
                    },
                    {
                      id: "read",
                      label: "Reading Books",
                      count: readBooksData?.length || 0,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setBooksTab(tab.id as "written" | "read")}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        booksTab === tab.id
                          ? "border-transparent"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                      style={{
                        borderBottomColor:
                          booksTab === tab.id ? "#18243c" : "transparent",
                        color: booksTab === tab.id ? "#18243c" : undefined,
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <span>{tab.label}</span>
                        <span className="text-black px-2 py-0.5 rounded-full text-xs font-medium">
                          {tab.count}
                        </span>
                      </div>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div>
              {booksTab === "written" && (
                <div>
                  {myStoriesData?.content &&
                  myStoriesData.content.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                      {myStoriesData.content.map((story: any) => (
                        <div
                          key={story.id}
                          className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start space-x-3">
                            {story.coverImageUrl && (
                              <Image
                                src={story.coverImageUrl}
                                alt={story.title}
                                width={60}
                                height={80}
                                className="rounded object-cover flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/stories/${story.id}`}
                                className="block"
                              >
                                <h4 className="font-medium text-gray-900 truncate hover:text-blue-600">
                                  {story.title}
                                </h4>
                              </Link>
                              <p className="text-sm text-gray-500 mt-1">
                                {story.genre}
                              </p>
                              <div className="mt-2">
                                <div className="flex items-center space-x-1 text-sm text-gray-500 mb-1">
                                  <BookOpen className="w-3 h-3" />
                                  <span>
                                    {story.totalChapters || 0} chapters
                                  </span>
                                </div>
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                                    <Eye className="w-3 h-3" />
                                    <span>{story.totalViews || 0} views</span>
                                  </div>
                                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                                    <Heart className="w-3 h-3" />
                                    <span>{story.totalLikes || 0} likes</span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-gray-400 mt-2">
                                Status: {story.publishStatus || "Draft"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No stories yet
                      </h3>
                      <p className="text-gray-500 mb-4">
                        You haven't published any stories yet.
                      </p>
                      <Link
                        href="/dashboard/stories/new"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-block"
                      >
                        Write Your First Story
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {booksTab === "read" && (
                <div>
                  {readBooksData && readBooksData.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                      {readBooksData.map((item: any) => {
                        const story = item.story;
                        const isCompleted = completedStoriesData.some(
                          (completed: any) => completed.story.id === story.id
                        );
                        return (
                          <div
                            key={story.id}
                            className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start space-x-3">
                              {story.coverImageUrl && (
                                <Image
                                  src={story.coverImageUrl}
                                  alt={story.title}
                                  width={60}
                                  height={80}
                                  className="rounded object-cover flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/stories/${story.id}`}
                                  className="block"
                                >
                                  <h4 className="font-medium text-gray-900 truncate hover:text-blue-600">
                                    {story.title}
                                  </h4>
                                </Link>
                                <p className="text-sm text-gray-500 mt-1">
                                  {story.genre}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  @{story.author?.username || "unknown"}
                                </p>
                                <div className="flex items-center text-sm text-gray-500 space-x-3 mt-1">
                                  <div className="flex items-center space-x-1">
                                    <BookOpen className="w-3 h-3" />
                                    <span>
                                      {story.totalChapters || 0} chapters
                                    </span>
                                  </div>
                                  {story.totalViews && (
                                    <div className="flex items-center space-x-1">
                                      <Eye className="w-3 h-3" />
                                      <span>{story.totalViews} views</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full ${
                                      isCompleted
                                        ? "bg-green-100 text-green-800"
                                        : "bg-blue-100 text-blue-800"
                                    }`}
                                  >
                                    {isCompleted ? "Completed" : "Reading"}
                                  </span>
                                  <p className="text-xs text-gray-400">
                                    Added{" "}
                                    {new Date(
                                      item.addedAt
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No books read yet
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Start reading stories to see them here.
                      </p>
                      <Link
                        href="/"
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-block"
                      >
                        Browse Stories
                      </Link>
                    </div>
                  )}
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
            {/* Header */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Followers & Following
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage your connections and discover new users
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="flex items-center justify-between border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {[
                    {
                      id: "followers",
                      label: "Followers",
                      count: stats?.followers || 0,
                    },
                    {
                      id: "following",
                      label: "Following",
                      count: stats?.following || 0,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() =>
                        setActiveTab(tab.id as "followers" | "following")
                      }
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? "border-transparent"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                      style={{
                        borderBottomColor:
                          activeTab === tab.id ? "#18243c" : "transparent",
                        color: activeTab === tab.id ? "#18243c" : undefined,
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <span>{tab.label}</span>
                        <span className="text-black px-2 py-0.5 rounded-full text-xs font-medium">
                          {tab.count}
                        </span>
                      </div>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === "followers" && (
                <div>
                  {followers?.content && followers.content.length > 0 ? (
                    <FollowerFollowingList
                      users={followers.content}
                      type="followers"
                      onUserFollowed={handleUserFollowed}
                      onUserUnfollowed={handleUserUnfollowed}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No followers yet.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "following" && (
                <div>
                  {following?.content && following.content.length > 0 ? (
                    <FollowerFollowingList
                      users={following.content}
                      type="following"
                      onUserFollowed={handleUserFollowed}
                      onUserUnfollowed={handleUserUnfollowed}
                    />
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
