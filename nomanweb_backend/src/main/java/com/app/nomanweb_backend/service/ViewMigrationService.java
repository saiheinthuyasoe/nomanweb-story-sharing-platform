package com.app.nomanweb_backend.service;

import java.util.UUID;

public interface ViewMigrationService {

    /**
     * Migrate existing view counts to the new tracking system
     * This should be run once after deploying the new view tracking system
     * 
     * @return The number of chapters and stories migrated
     */
    MigrationResult migrateExistingViews();

    /**
     * Result of the migration process
     */
    class MigrationResult {
        private final int chaptersMigrated;
        private final int storiesMigrated;
        private final String message;

        public MigrationResult(int chaptersMigrated, int storiesMigrated, String message) {
            this.chaptersMigrated = chaptersMigrated;
            this.storiesMigrated = storiesMigrated;
            this.message = message;
        }

        public int getChaptersMigrated() {
            return chaptersMigrated;
        }

        public int getStoriesMigrated() {
            return storiesMigrated;
        }

        public String getMessage() {
            return message;
        }
    }
}