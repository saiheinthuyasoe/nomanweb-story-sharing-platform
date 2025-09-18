"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  HeartIcon,
  EllipsisHorizontalIcon,
  BookOpenIcon,
  EyeIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  AtSymbolIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
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
  Gift,
  Eye,
} from "lucide-react";
import { usersApi, UserProfile } from "@/lib/api/users";
import { storiesApi } from "@/lib/api/stories";
import { libraryApi, LibraryItem } from "@/lib/api/libraries";
import { StoryPreview } from "@/types/story";
import { StoryCard } from "@/components/stories/StoryCard";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";
import { useSocialRealtime } from "@/hooks/useSocialRealtime";
import EnhancedGiftModal from "@/components/monetization/EnhancedGiftModal";

export default function AuthorProfile() {
  const params = useParams();
  const authorId = params.authorId as string;
  const queryClient = useQueryClient();

  // Use React Query for user profile data
  const {
    data: userProfile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ["userProfile", authorId],
    queryFn: () => usersApi.getUserProfile(authorId),
    enabled: !!authorId,
    staleTime: 10 * 1000, // 10 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Use React Query for followers data
  const { data: followersData } = useQuery({
    queryKey: ["followers", authorId, 0],
    queryFn: () => usersApi.getFollowers(authorId, 0, 20),
    enabled: !!authorId,
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Use React Query for following data
  const { data: followingData } = useQuery({
    queryKey: ["following", authorId, 0],
    queryFn: () => usersApi.getFollowing(authorId, 0, 20),
    enabled: !!authorId,
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Use React Query for follow status
  const { data: isFollowing, isLoading: followStatusLoading } = useQuery({
    queryKey: ["isFollowing", authorId],
    queryFn: () => usersApi.isFollowing(authorId),
    enabled: !!authorId,
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const [writtenStories, setWrittenStories] = useState<StoryPreview[]>([]);
  const [readingData, setReadingData] = useState<LibraryItem[]>([]);
  const [completedData, setCompletedData] = useState<LibraryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"followers" | "following">(
    "followers"
  );
  const [booksTab, setBooksTab] = useState<"written" | "read">("written");
  const [followLoading, setFollowLoading] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);

  // Extract data from queries
  const followers = followersData?.content || [];
  const following = followingData?.content || [];
  const loading = profileLoading;

  // Real-time updates for follow/unfollow
  useSocialRealtime();

  const fetchAuthorData = async () => {
    try {
      // Fetch user's written stories
      const storiesResponse = await storiesApi.getStoriesByAuthor(authorId, {
        page: 0,
        size: 12,
      });
      setWrittenStories(storiesResponse.content);

      // Fetch reading data
      try {
        const readingResponse = await libraryApi.getUserLibraries(
          authorId,
          "READING"
        );
        setReadingData(readingResponse);

        const completedResponse = await libraryApi.getUserLibraries(
          authorId,
          "COMPLETED"
        );
        setCompletedData(completedResponse);
      } catch (error) {
        console.error("Error fetching reading data:", error);
        // Don't show error toast for reading data as it's not critical
      }
    } catch (error) {
      console.error("Error fetching author data:", error);
      toast.error("Failed to load author profile");
    }
  };

  useEffect(() => {
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
        toast.success(
          `Unfollowed ${userProfile.displayName || userProfile.username}`
        );
      } else {
        await usersApi.followUser(authorId);
        toast.success(
          `Following ${userProfile.displayName || userProfile.username}`
        );
      }

      // Invalidate and refetch queries to update UI immediately
      queryClient.invalidateQueries({ queryKey: ["isFollowing", authorId] });
      queryClient.invalidateQueries({ queryKey: ["followers", authorId] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
      queryClient.refetchQueries({ queryKey: ["isFollowing", authorId] });
      queryClient.refetchQueries({ queryKey: ["followers", authorId] });
      queryClient.refetchQueries({ queryKey: ["userStats"] });
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("Failed to follow/unfollow user");
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Author not found
          </h1>
          <p className="text-gray-600">
            The author you're looking for doesn't exist.
          </p>
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
        {/* Removed Cover Image Section */}

        {/* Profile Info Section */}
        <div className="relative px-4 sm:px-6 lg:px-8 pt-8">
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
                          {(userProfile.displayName || userProfile.username)
                            .charAt(0)
                            .toUpperCase()}
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
                          <span className="text-gray-500">
                            @{userProfile.username}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Joined{" "}
                            {formatDistanceToNow(
                              new Date(userProfile.createdAt),
                              { addSuffix: true }
                            )}
                          </span>
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
                            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        } ${
                          followLoading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        {isFollowing ? (
                          <HeartSolidIcon className="w-5 h-5" />
                        ) : (
                          <HeartIcon className="w-5 h-5" />
                        )}
                        <span>
                          {followLoading
                            ? "Loading..."
                            : isFollowing
                            ? "Following"
                            : "Follow"}
                        </span>
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-6">
                    <div className="text-center py-2">
                      <div className="text-xl font-semibold text-gray-900">
                        {userProfile.stats.writtenBooks}
                      </div>
                      <div className="text-xs text-gray-500">Written Books</div>
                    </div>

                    <div className="text-center py-2">
                      <div className="text-xl font-semibold text-gray-900">
                        {userProfile.stats.booksCompleted || 0}
                      </div>
                      <div className="text-xs text-gray-500">Read Books</div>
                    </div>

                    <button
                      onClick={() => setActiveTab("followers")}
                      className="text-center py-2 transition-colors hover:text-gray-700"
                    >
                      <div className="text-xl font-semibold text-gray-900">
                        {userProfile.stats.followers}
                      </div>
                      <div className="text-xs text-gray-500">Followers</div>
                    </button>

                    <button
                      onClick={() => setActiveTab("following")}
                      className="text-center py-2 transition-colors hover:text-gray-700"
                    >
                      <div className="text-xl font-semibold text-gray-900">
                        {userProfile.stats.following}
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
      <div className="px-4 sm:px-6 lg:px-8 mt-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Bio</h2>
            </div>

            <div className="prose max-w-none">
              {userProfile.bio ? (
                <p className="text-gray-700 leading-relaxed">
                  {userProfile.bio}
                </p>
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
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setBooksTab("written")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    booksTab === "written"
                      ? "border-[#18243c] text-[#18243c]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Written Books{" "}
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium">
                    {userProfile.stats.writtenBooks}
                  </span>
                </button>
                <button
                  onClick={() => setBooksTab("read")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    booksTab === "read"
                      ? "border-[#18243c] text-[#18243c]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>Reading Books</span>
                    <span className="text-black px-2 py-0.5 rounded-full text-xs font-medium">
                      {(readingData?.length || 0) +
                        (completedData?.length || 0)}
                    </span>
                  </div>
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div>
              {booksTab === "written" && (
                <div>
                  {writtenStories.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No stories yet
                      </h3>
                      <p className="text-gray-500">
                        {userProfile.displayName || userProfile.username} hasn't
                        published any stories yet.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {booksTab === "read" && (
                <div>
                  {(() => {
                    const allReadBooks = [...readingData, ...completedData];
                    return allReadBooks.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allReadBooks.map((item) => {
                          const story = item.story;
                          const isCompleted = item.listType === "COMPLETED";
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
                        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No books read yet
                        </h3>
                        <p className="text-gray-500">
                          {userProfile?.displayName || userProfile?.username}{" "}
                          hasn't read any books yet.
                        </p>
                      </div>
                    );
                  })()}
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
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab("followers")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "followers"
                      ? "border-[#18243c] text-[#18243c]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Followers{" "}
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium">
                    {userProfile.stats.followers}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("following")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "following"
                      ? "border-[#18243c] text-[#18243c]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Following{" "}
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium">
                    {userProfile.stats.following}
                  </span>
                </button>
              </nav>
            </div>

            <div className="space-y-4">
              {/* Followers/Following List */}
              {activeTab === "followers" && (
                <div>
                  {followers && followers.length > 0 ? (
                    <>
                      {followers.map((follower) => (
                        <div
                          key={follower.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-3"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                              {follower.profileImageUrl ? (
                                <Image
                                  src={follower.profileImageUrl}
                                  alt={
                                    follower.displayName || follower.username
                                  }
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-lg font-semibold text-gray-600">
                                  {(follower.displayName || follower.username)
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {follower.displayName || follower.username}
                              </div>
                              <div className="text-sm text-gray-500">
                                @{follower.username}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDistanceToNow(
                              new Date(follower.followedAt),
                              { addSuffix: true }
                            )}
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

              {activeTab === "following" && (
                <div>
                  {following && following.length > 0 ? (
                    <>
                      {following.map((followingUser) => (
                        <div
                          key={followingUser.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-3"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                              {followingUser.profileImageUrl ? (
                                <Image
                                  src={followingUser.profileImageUrl}
                                  alt={
                                    followingUser.displayName ||
                                    followingUser.username
                                  }
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-lg font-semibold text-gray-600">
                                  {(
                                    followingUser.displayName ||
                                    followingUser.username
                                  )
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {followingUser.displayName ||
                                  followingUser.username}
                              </div>
                              <div className="text-sm text-gray-500">
                                @{followingUser.username}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDistanceToNow(
                              new Date(followingUser.followedAt),
                              { addSuffix: true }
                            )}
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
        recipientName={
          userProfile?.displayName || userProfile?.username || "Author"
        }
        onGiftSent={() => {
          toast.success("Gift sent successfully!");
        }}
      />
    </div>
  );
}
