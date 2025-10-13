package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.dto.chapter.*;
import com.app.nomanweb_backend.entity.Chapter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface ChapterService {

    // Chapter CRUD operations
    ChapterResponse createChapter(CreateChapterRequest request, UUID authorId);

    ChapterResponse getChapterById(UUID chapterId, UUID currentUserId);

    ChapterResponse getChapterByStoryAndNumber(UUID storyId, Integer chapterNumber, UUID currentUserId);

    ChapterResponse updateChapter(UUID chapterId, UpdateChapterRequest request, UUID authorId);

    void deleteChapter(UUID chapterId, UUID authorId);

    // Bulk delete chapters
    void bulkDeleteChapters(List<UUID> chapterIds, UUID authorId);

    // Chapter listing and navigation
    List<ChapterPreviewResponse> getChaptersByStory(UUID storyId, UUID currentUserId);

    Page<ChapterPreviewResponse> getChaptersByStory(UUID storyId, UUID currentUserId, Pageable pageable);

    ChapterResponse getNextChapter(UUID currentChapterId, UUID currentUserId);

    ChapterResponse getPreviousChapter(UUID currentChapterId, UUID currentUserId);

    ChapterResponse getFirstChapter(UUID storyId, UUID currentUserId);

    ChapterResponse getLastChapter(UUID storyId, UUID currentUserId);

    // Chapter management
    ChapterResponse publishChapter(UUID chapterId, UUID authorId);

    ChapterResponse unpublishChapter(UUID chapterId, UUID authorId, boolean confirmRefund);

    // Bulk chapter publishing
    void bulkPublishChaptersByStory(UUID storyId, UUID authorId);

    // Bulk chapter unpublishing
    void bulkUnpublishChaptersByStory(UUID storyId, UUID authorId);

    // Unpublish whole book with refunds
    void unpublishWholeBook(UUID storyId, UUID authorId, boolean confirmRefund);

    void reorderChapters(UUID storyId, List<UUID> chapterIds, UUID authorId);

    // Chapter content and statistics
    void incrementChapterViews(UUID chapterId);

    void updateChapterWordCount(UUID chapterId);

    Integer calculateReadingTime(String content);

    // Chapter validation and helpers
    boolean canUserAccessChapter(UUID chapterId, UUID userId);

    boolean hasUserPurchasedChapter(UUID chapterId, UUID userId);

    List<ChapterPreviewResponse> getChaptersBetween(UUID storyId, Integer startChapter, Integer endChapter,
            UUID currentUserId);

    // Auto-save functionality
    ChapterResponse autoSaveChapter(UUID chapterId, UpdateChapterRequest request, UUID authorId);

    // Search within story chapters
    List<ChapterPreviewResponse> searchChaptersInStory(UUID storyId, String query, UUID currentUserId);

    // Moderation
    Page<ChapterResponse> getChaptersForModeration(Pageable pageable);

    ChapterResponse moderateChapter(UUID chapterId, String moderationNotes, boolean approved, UUID moderatorId);

    // Writer feedback on moderation decisions
    void submitModerationFeedback(UUID chapterId, UUID writerId, String feedback);

    // Admin feedback management
    Page<ChapterResponse> getFeedbackSubmissions(Pageable pageable, String status);
    
    Page<Chapter> getChaptersWithFeedback(Pageable pageable);
    Page<Chapter> getChaptersWithFeedbackByStatus(List<Chapter.ModerationStatus> statuses, Pageable pageable);
    void markFeedbackAsReviewed(UUID chapterId);
    void respondToFeedback(UUID chapterId, String response);

    // Admin-specific chapter access (bypasses ownership checks)
    ChapterResponse getChapterByIdForAdmin(UUID chapterId);

    // Trash management
    void moveChapterToTrash(UUID chapterId, UUID authorId);

    void restoreChapterFromTrash(UUID chapterId, UUID authorId);

    void permanentlyDeleteChapter(UUID chapterId, UUID authorId);

    List<ChapterPreviewResponse> getTrashByStory(UUID storyId, UUID authorId);

    void bulkMoveToTrash(List<UUID> chapterIds, UUID authorId);

    void bulkRestoreFromTrash(List<UUID> chapterIds, UUID authorId);

    void bulkPermanentlyDelete(List<UUID> chapterIds, UUID authorId);

    void emptyTrash(UUID storyId, UUID authorId);
}