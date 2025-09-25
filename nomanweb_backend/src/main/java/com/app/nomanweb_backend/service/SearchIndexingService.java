package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import jakarta.persistence.PostPersist;
import jakarta.persistence.PostRemove;
import jakarta.persistence.PostUpdate;
import java.util.UUID;

/**
 * Service responsible for automatically indexing content in Typesense
 * when database entities are created, updated, or deleted.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SearchIndexingService {

    private final SearchService searchService;

    /**
     * Automatically index a story when it's created
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleStoryCreated(StoryCreatedEvent event) {
        log.info("Auto-indexing newly created story: {}", event.getStory().getId());
        try {
            searchService.indexStory(event.getStory());
        } catch (Exception e) {
            log.error("Failed to auto-index story on creation: {}", event.getStory().getId(), e);
        }
    }

    /**
     * Automatically update story index when it's updated
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleStoryUpdated(StoryUpdatedEvent event) {
        log.info("Auto-updating story index: {}", event.getStory().getId());
        try {
            searchService.updateStoryIndex(event.getStory());
        } catch (Exception e) {
            log.error("Failed to auto-update story index: {}", event.getStory().getId(), e);
        }
    }

    /**
     * Automatically remove story from index when it's deleted
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleStoryDeleted(StoryDeletedEvent event) {
        log.info("Auto-removing story from index: {}", event.getStoryId());
        try {
            searchService.removeStoryFromIndex(event.getStoryId());
        } catch (Exception e) {
            log.error("Failed to auto-remove story from index: {}", event.getStoryId(), e);
        }
    }

    /**
     * Automatically index a user when it's created
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleUserCreated(UserCreatedEvent event) {
        log.info("Auto-indexing newly created user: {}", event.getUser().getId());
        try {
            searchService.indexUser(event.getUser());
        } catch (Exception e) {
            log.error("Failed to auto-index user on creation: {}", event.getUser().getId(), e);
        }
    }

    /**
     * Automatically update user index when it's updated
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleUserUpdated(UserUpdatedEvent event) {
        log.info("Auto-updating user index: {}", event.getUser().getId());
        try {
            searchService.updateUserIndex(event.getUser());
        } catch (Exception e) {
            log.error("Failed to auto-update user index: {}", event.getUser().getId(), e);
        }
    }

    /**
     * Automatically remove user from index when it's deleted
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleUserDeleted(UserDeletedEvent event) {
        log.info("Auto-removing user from index: {}", event.getUserId());
        try {
            searchService.removeUserFromIndex(event.getUserId());
        } catch (Exception e) {
            log.error("Failed to auto-remove user from index: {}", event.getUserId(), e);
        }
    }

    // Event classes
    public static class StoryCreatedEvent {
        private final Story story;

        public StoryCreatedEvent(Story story) {
            this.story = story;
        }

        public Story getStory() {
            return story;
        }
    }

    public static class StoryUpdatedEvent {
        private final Story story;

        public StoryUpdatedEvent(Story story) {
            this.story = story;
        }

        public Story getStory() {
            return story;
        }
    }

    public static class StoryDeletedEvent {
        private final UUID storyId;

        public StoryDeletedEvent(UUID storyId) {
            this.storyId = storyId;
        }

        public UUID getStoryId() {
            return storyId;
        }
    }

    public static class UserCreatedEvent {
        private final User user;

        public UserCreatedEvent(User user) {
            this.user = user;
        }

        public User getUser() {
            return user;
        }
    }

    public static class UserUpdatedEvent {
        private final User user;

        public UserUpdatedEvent(User user) {
            this.user = user;
        }

        public User getUser() {
            return user;
        }
    }

    public static class UserDeletedEvent {
        private final UUID userId;

        public UserDeletedEvent(UUID userId) {
            this.userId = userId;
        }

        public UUID getUserId() {
            return userId;
        }
    }
}