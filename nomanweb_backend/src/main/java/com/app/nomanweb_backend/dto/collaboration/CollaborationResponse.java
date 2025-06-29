package com.app.nomanweb_backend.dto.collaboration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollaborationResponse {

    private UUID id;
    private UUID chapterId;
    private String chapterTitle;
    private Integer chapterNumber;
    private UUID storyId;
    private String storyTitle;
    private UserInfo user;
    private String role;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Invitation details
    private String invitationToken;
    private LocalDateTime invitationExpiresAt;
    private LocalDateTime invitationAcceptedAt;
    private UserInfo invitedBy;
    private boolean isPending;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private UUID id;
        private String username;
        private String displayName;
        private String email;
        private String profileImageUrl;
    }
}