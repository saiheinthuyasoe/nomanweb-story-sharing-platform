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
import com.app.nomanweb_backend.service.ViewMigrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ViewMigrationServiceImpl implements ViewMigrationService {

    private final ChapterRepository chapterRepository;
    private final StoryRepository storyRepository;
    private final UserRepository userRepository;
    private final ChapterViewRepository chapterViewRepository;
    private final StoryViewRepository storyViewRepository;

    @Override
    public MigrationResult migrateExistingViews() {
        log.info("Starting migration of existing view counts to new tracking system");

        int chaptersMigrated = 0;
        int storiesMigrated = 0;

        try {
            // Get all users (we'll create anonymous view records for existing view counts)
            List<User> users = userRepository.findAll();
            if (users.isEmpty()) {
                log.warn("No users found for migration");
                return new MigrationResult(0, 0, "No users found for migration");
            }

            // Use the first user as a placeholder for existing anonymous views
            User placeholderUser = users.get(0);
            LocalDateTime migrationTime = LocalDateTime.now();

            // Migrate chapter views
            List<Chapter> chaptersWithViews = chapterRepository.findByViewsGreaterThan(0L);
            for (Chapter chapter : chaptersWithViews) {
                if (chapter.getViews() > 0) {
                    // Create a view record for the placeholder user with the existing view count
                    ChapterView view = ChapterView.builder()
                            .user(placeholderUser)
                            .chapter(chapter)
                            .viewCount(chapter.getViews().intValue())
                            .firstViewedAt(migrationTime)
                            .lastViewedAt(migrationTime)
                            .build();

                    chapterViewRepository.save(view);
                    chaptersMigrated++;
                    log.debug("Migrated chapter view: {} with {} views", chapter.getId(), chapter.getViews());
                }
            }

            // Migrate story views
            List<Story> storiesWithViews = storyRepository.findByTotalViewsGreaterThan(0L);
            for (Story story : storiesWithViews) {
                if (story.getTotalViews() > 0) {
                    // Create a view record for the placeholder user with the existing view count
                    StoryView view = StoryView.builder()
                            .user(placeholderUser)
                            .story(story)
                            .viewCount(story.getTotalViews().intValue())
                            .firstViewedAt(migrationTime)
                            .lastViewedAt(migrationTime)
                            .build();

                    storyViewRepository.save(view);
                    storiesMigrated++;
                    log.debug("Migrated story view: {} with {} views", story.getId(), story.getTotalViews());
                }
            }

            String message = String.format("Successfully migrated %d chapters and %d stories",
                    chaptersMigrated, storiesMigrated);
            log.info(message);

            return new MigrationResult(chaptersMigrated, storiesMigrated, message);

        } catch (Exception e) {
            log.error("Error during view migration: {}", e.getMessage(), e);
            return new MigrationResult(chaptersMigrated, storiesMigrated,
                    "Migration failed: " + e.getMessage());
        }
    }
}