import { useQuery } from '@tanstack/react-query';
import { Notification } from '@/types/user';
import { storiesApi } from '@/lib/api/stories';
import { commentsApi } from '@/lib/api/comments';
import { chaptersApi } from '@/lib/api/chapters';

export interface EnhancedNotification extends Notification {
  storyTitle?: string;
  commentContent?: string;
  chapterTitle?: string;
}

export const useEnhancedNotifications = (notifications: Notification[]) => {
  // Extract unique story IDs and comment IDs from notifications
  const storyIds = Array.from(new Set(
    notifications
      .filter(n => n.relatedType === 'STORY')
      .map(n => n.relatedId)
      .filter(Boolean)
  ));

  const commentIds = Array.from(new Set(
    notifications
      .filter(n => n.relatedType === 'COMMENT')
      .map(n => n.relatedId)
      .filter(Boolean)
  ));

  const chapterIds = Array.from(new Set(
    notifications
      .filter(n => n.relatedType === 'CHAPTER')
      .map(n => n.relatedId)
      .filter(Boolean)
  ));

  // Fetch stories data
  const storiesQueries = useQuery({
    queryKey: ['stories-for-notifications', storyIds],
    queryFn: async () => {
      const stories = await Promise.allSettled(
        storyIds.map(id => storiesApi.getStory(id))
      );
      const storyMap = new Map();
      stories.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          storyMap.set(storyIds[index], result.value);
        }
      });
      return storyMap;
    },
    enabled: storyIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch comments data
  const commentsQueries = useQuery({
    queryKey: ['comments-for-notifications', commentIds],
    queryFn: async () => {
      const comments = await Promise.allSettled(
        commentIds.map(id => commentsApi.getComment(id))
      );
      const commentMap = new Map();
      comments.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          commentMap.set(commentIds[index], result.value);
        }
      });
      return commentMap;
    },
    enabled: commentIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch chapters data
  const chaptersQueries = useQuery({
    queryKey: ['chapters-for-notifications', chapterIds],
    queryFn: async () => {
      const chapters = await Promise.allSettled(
        chapterIds.map(id => chaptersApi.getChapter(id))
      );
      const chapterMap = new Map();
      chapters.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          chapterMap.set(chapterIds[index], result.value);
        }
      });
      return chapterMap;
    },
    enabled: chapterIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Enhance notifications with additional data
  const enhancedNotifications: EnhancedNotification[] = notifications.map(notification => {
    const enhanced: EnhancedNotification = { ...notification };

    // Add story title for story-related notifications
    if (notification.relatedType === 'STORY' && notification.relatedId && storiesQueries.data) {
      const story = storiesQueries.data.get(notification.relatedId);
      if (story) {
        enhanced.storyTitle = story.title;
      }
    }

    // Add story title for chapter-related notifications
    if (notification.relatedType === 'CHAPTER' && notification.relatedId && chaptersQueries.data) {
      const chapter = chaptersQueries.data.get(notification.relatedId);
      if (chapter) {
        enhanced.storyTitle = chapter.story.title;
        enhanced.chapterTitle = chapter.title;
      }
    }

    // Add comment content for comment-related notifications
    if (notification.relatedType === 'COMMENT' && notification.relatedId && commentsQueries.data) {
      const comment = commentsQueries.data.get(notification.relatedId);
      if (comment) {
        enhanced.commentContent = comment.content;
        // Also add story title if the comment has story info
        if (comment.story) {
          enhanced.storyTitle = comment.story.title;
        }
      }
    }

    return enhanced;
  });

  return {
    enhancedNotifications,
    isLoading: storiesQueries.isLoading || commentsQueries.isLoading || chaptersQueries.isLoading,
    error: storiesQueries.error || commentsQueries.error || chaptersQueries.error,
  };
};