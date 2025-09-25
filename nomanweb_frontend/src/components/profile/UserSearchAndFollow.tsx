'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Search, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useFollowUser, useUnfollowUser } from '@/hooks/useFollowActions';
import { useIsFollowing } from '@/hooks/useUserProfile';
import { SearchUser } from '@/lib/api/users';
import { useAuth } from '@/contexts/AuthContext';

interface UserSearchAndFollowProps {
  onUserFollowed?: (userId: string) => void;
  onUserUnfollowed?: (userId: string) => void;
}

export default function UserSearchAndFollow({ onUserFollowed, onUserUnfollowed }: UserSearchAndFollowProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: searchResults, isLoading: isSearching } = useUserSearch(searchQuery, showResults);
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowResults(query.length >= 2);
  };

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

  const FollowButton = ({ searchUser }: { searchUser: SearchUser }) => {
    const { data: isFollowing } = useIsFollowing(searchUser.id);
    const isCurrentUser = user?.id === searchUser.id;

    if (isCurrentUser) {
      return (
        <span className="text-sm text-gray-500 px-3 py-1 bg-gray-100 rounded-full">
          You
        </span>
      );
    }

    if (isFollowing) {
      return (
        <button
          onClick={() => handleUnfollow(searchUser.id)}
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

    return (
      <button
        onClick={() => handleFollow(searchUser.id)}
        disabled={followUser.isPending}
        className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
      >
        {followUser.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <UserPlus className="h-3 w-3" />
        )}
        <span>Follow</span>
      </button>
    );
  };

  return (
    <div className="relative" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search users by email, username, or display name..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Search Results */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
              <p className="text-sm text-gray-500 mt-2">Searching...</p>
            </div>
          ) : searchResults?.content && searchResults.content.length > 0 ? (
            <div className="py-2">
              {searchResults.content.map((searchUser) => (
                <div
                  key={searchUser.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {searchUser.profileImageUrl ? (
                        <Image
                          src={searchUser.profileImageUrl}
                          alt={searchUser.displayName || searchUser.username}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-gray-600">
                          {(searchUser.displayName || searchUser.username).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {searchUser.displayName || searchUser.username}
                      </div>
                      <div className="text-sm text-gray-500">@{searchUser.username}</div>
                      {searchUser.email && (
                        <div className="text-xs text-gray-400">{searchUser.email}</div>
                      )}
                    </div>
                  </div>
                  <FollowButton searchUser={searchUser} />
                </div>
              ))}
            </div>
          ) : searchQuery.length >= 2 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">No users found</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
} 