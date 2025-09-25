package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.entity.Chapter;
import com.app.nomanweb_backend.entity.ChapterView;
import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.entity.StoryView;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.repository.ChapterRepository;
import com.app.nomanweb_backend.repository.ChapterViewRepository;
import com.app.nomanweb_backend.repository.StoryRepository;
import com.app.nomanweb_backend.repository.StoryViewRepository;
import com.app.nomanweb_backend.repository.UserRepository;
import com.app.nomanweb_backend.service.ViewTrackingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ViewTrackingServiceImpl implements ViewTrackingService {

    private final ChapterViewRepository chapterViewRepository;
    private final StoryViewRepository storyViewRepository;
    private final ChapterRepository chapterRepository;
    private final StoryRepository storyRepository;
    private final UserRepository userRepository;

    // Minimum time between views to count as a new view (24 hours)
    private static final int VIEW_COOLDOWN_HOURS = 24;

    @Override
    public boolean trackChapterView(UUID chapterId, UUID userId) {
        try {
            Chapter chapter = chapterRepository.findById(chapterId)
                    .orElseThrow(() -> new IllegalArgumentException("Chapter not found"));

            // For anonymous users, we can't track individual views, so we'll count them
            if (userId == null) {
                chapter.incrementViews();
                chapterRepository.save(chapter);

                // Also increment story views for anonymous users
                Story story = chapter.getStory();
                story.incrementViews();
                storyRepository.save(story);

                log.debug("Anonymous view tracked for chapter: {}", chapterId);
                return true;
            }

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            // Check if user has already viewed this chapter recently
            Optional<ChapterView> existingView = chapterViewRepository.findByUserAndChapter(user, chapter);

            if (existingView.isPresent()) {
                ChapterView view = existingView.get();
                LocalDateTime lastViewed = view.getLastViewedAt();
                LocalDateTime cooldownTime = lastViewed.plusHours(VIEW_COOLDOWN_HOURS);

                // If within cooldown period, don't count as new view
                if (LocalDateTime.now().isBefore(cooldownTime)) {
                    log.debug("View not counted - within cooldown period for chapter: {}, user: {}", chapterId, userId);
                    return false;
                }

                // Update existing view record
                view.setViewCount(view.getViewCount() + 1);
                view.setLastViewedAt(LocalDateTime.now());
                chapterViewRepository.save(view);
            } else {
                // Create new view record
                ChapterView newView = ChapterView.builder()
                        .user(user)
                        .chapter(chapter)
                        .viewCount(1)
                        .firstViewedAt(LocalDateTime.now())
                        .lastViewedAt(LocalDateTime.now())
                        .build();
                chapterViewRepository.save(newView);
            }

            // Update the chapter's view count
            Long totalViews = chapterViewRepository.countTotalViewsByChapterId(chapterId);
            chapter.setViews(totalViews);
            chapterRepository.save(chapter);

            // Also track story view
            trackStoryView(chapter.getStory().getId(), userId);

            log.debug("Chapter view tracked successfully: chapter={}, user={}", chapterId, userId);
            return true;

        } catch (Exception e) {
            log.error("Error tracking chapter view: chapter={}, user={}, error={}", chapterId, userId, e.getMessage());
            return false;
        }
    }

    @Override
    public boolean trackStoryView(UUID storyId, UUID userId) {
        try {
            Story story = storyRepository.findById(storyId)
                    .orElseThrow(() -> new IllegalArgumentException("Story not found"));

            // For anonymous users, we can't track individual views, so we'll count them
            if (userId == null) {
                story.incrementViews();
                storyRepository.save(story);
                log.debug("Anonymous view tracked for story: {}", storyId);
                return true;
            }

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            // Check if user has already viewed this story recently
            Optional<StoryView> existingView = storyViewRepository.findByUserAndStory(user, story);

            if (existingView.isPresent()) {
                StoryView view = existingView.get();
                LocalDateTime lastViewed = view.getLastViewedAt();
                LocalDateTime cooldownTime = lastViewed.plusHours(VIEW_COOLDOWN_HOURS);

                // If within cooldown period, don't count as new view
                if (LocalDateTime.now().isBefore(cooldownTime)) {
                    log.debug("View not counted - within cooldown period for story: {}, user: {}", storyId, userId);
                    return false;
                }

                // Update existing view record
                view.setViewCount(view.getViewCount() + 1);
                view.setLastViewedAt(LocalDateTime.now());
                storyViewRepository.save(view);
            } else {
                // Create new view record
                StoryView newView = StoryView.builder()
                        .user(user)
                        .story(story)
                        .viewCount(1)
                        .firstViewedAt(LocalDateTime.now())
                        .lastViewedAt(LocalDateTime.now())
                        .build();
                storyViewRepository.save(newView);
            }

            // Update the story's view count
            Long totalViews = storyViewRepository.countTotalViewsByStoryId(storyId);
            story.setTotalViews(totalViews);
            storyRepository.save(story);

            log.debug("Story view tracked successfully: story={}, user={}", storyId, userId);
            return true;

        } catch (Exception e) {
            log.error("Error tracking story view: story={}, user={}, error={}", storyId, userId, e.getMessage());
            return false;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Long getChapterViewCount(UUID chapterId) {
        return chapterViewRepository.countTotalViewsByChapterId(chapterId);
    }

    @Override
    @Transactional(readOnly = true)
    public Long getStoryViewCount(UUID storyId) {
        return storyViewRepository.countTotalViewsByStoryId(storyId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasUserViewedChapter(UUID chapterId, UUID userId) {
        if (userId == null) {
            return false; // Anonymous users can't have viewed status
        }
        return chapterViewRepository.existsByUserIdAndChapterId(userId, chapterId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasUserViewedStory(UUID storyId, UUID userId) {
        if (userId == null) {
            return false; // Anonymous users can't have viewed status
        }
        return storyViewRepository.existsByUserIdAndStoryId(userId, storyId);
    }
}