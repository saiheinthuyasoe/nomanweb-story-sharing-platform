package com.app.nomanweb_backend.service;

import java.util.UUID;

public interface ViewTrackingService {

    /**
     * Track a chapter view for a user
     * Only increments the view count if the user hasn't viewed this chapter
     * recently
     * 
     * @param chapterId The chapter ID
     * @param userId    The user ID (can be null for anonymous users)
     * @return true if view was counted, false if it was a duplicate view
     */
    boolean trackChapterView(UUID chapterId, UUID userId);

    /**
     * Track a story view for a user
     * Only increments the view count if the user hasn't viewed this story recently
     * 
     * @param storyId The story ID
     * @param userId  The user ID (can be null for anonymous users)
     * @return true if view was counted, false if it was a duplicate view
     */
    boolean trackStoryView(UUID storyId, UUID userId);

    /**
     * Get the total view count for a chapter
     * 
     * @param chapterId The chapter ID
     * @return The total view count
     */
    Long getChapterViewCount(UUID chapterId);

    /**
     * Get the total view count for a story
     * 
     * @param storyId The story ID
     * @return The total view count
     */
    Long getStoryViewCount(UUID storyId);

    /**
     * Check if a user has viewed a chapter
     * 
     * @param chapterId The chapter ID
     * @param userId    The user ID
     * @return true if user has viewed the chapter
     */
    boolean hasUserViewedChapter(UUID chapterId, UUID userId);

    /**
     * Check if a user has viewed a story
     * 
     * @param storyId The story ID
     * @param userId  The user ID
     * @return true if user has viewed the story
     */
    boolean hasUserViewedStory(UUID storyId, UUID userId);
}