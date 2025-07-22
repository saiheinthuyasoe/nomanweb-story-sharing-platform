'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { UserPlus, UserMinus, Loader2, Search, X } from 'lucide-react';
import { useFollowUser, useUnfollowUser } from '@/hooks/useFollowActions';
import { useIsFollowing } from '@/hooks/useUserProfile';
import { FollowerUser } from '@/lib/api/users';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface FollowerFollowingListProps {
  users: FollowerUser[];
  type: 'followers' | 'following';
  onUserFollowed?: (userId: string) => void;
  onUserUnfollowed?: (userId: string) => void;
}

export default function FollowerFollowingList({ 
  users, 
  type, 
  onUserFollowed, 
  onUserUnfollowed 
}: FollowerFollowingListProps) {
  const { user } = useAuth();
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      user.displayName?.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const handleFollow = async (userId: string) => {
    try {
      await followUser.mutateAsync(userId);
      onUserFollowed?.(userId);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      await unfollowUser.mutateAsync(userId);
      onUserUnfollowed?.(userId);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const ActionButton = ({ followerUser }: { followerUser: FollowerUser }) => {
    const { data: isFollowing } = useIsFollowing(followerUser.id);
    const isCurrentUser = user?.id === followerUser.id;

    if (isCurrentUser) {
      return (
        <span className="text-sm text-gray-500 px-3 py-1 bg-gray-100 rounded-full">
          You
        </span>
      );
    }

    if (type === 'followers') {
      // For followers tab, show follow button if not already following
      if (isFollowing) {
        return (
          <button
            onClick={() => handleUnfollow(followerUser.id)}
            disabled={unfollowUser.isPending}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
          >
            {unfollowUser.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <UserMinus className="h-3 w-3" />
            )}
            <span>Unfollow</span>
          </button>
        );
      } else {
        return (
          <button
            onClick={() => handleFollow(followerUser.id)}
            disabled={followUser.isPending}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
          >
            {followUser.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <UserPlus className="h-3 w-3" />
            )}
            <span>Follow Back</span>
          </button>
        );
      }
    } else {
      // For following tab, show unfollow button
      return (
        <button
          onClick={() => handleUnfollow(followerUser.id)}
          disabled={unfollowUser.isPending}
          className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
        >
          {unfollowUser.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <UserMinus className="h-3 w-3" />
          )}
          <span>Unfollow</span>
        </button>
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={`Search ${type}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results Count */}
      {searchQuery && (
        <div className="text-sm text-gray-600">
          Found {filteredUsers.length} {filteredUsers.length === 1 ? type.slice(0, -1) : type} 
          {filteredUsers.length !== users.length && ` out of ${users.length}`}
        </div>
      )}

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? (
              <div>
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No {type} found for "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div>
                <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No {type} yet.</p>
              </div>
            )}
          </div>
        ) : (
          filteredUsers.map((followerUser) => (
            <div key={followerUser.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <Link 
                href={`/authors/${followerUser.id}`}
                className="flex items-center space-x-3 flex-1 hover:bg-gray-100 rounded-lg p-2 -m-2 transition-colors"
              >
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {followerUser.profileImageUrl ? (
                    <Image
                      src={followerUser.profileImageUrl}
                      alt={followerUser.displayName || followerUser.username}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-semibold text-gray-600">
                      {(followerUser.displayName || followerUser.username).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {followerUser.displayName || followerUser.username}
                  </div>
                  <div className="text-sm text-gray-500">@{followerUser.username}</div>
                </div>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(followerUser.followedAt), { addSuffix: true })}
                </div>
                <ActionButton followerUser={followerUser} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 