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
public class CollaboratorPresence {

    private UUID userId;
    private String username;
    private String displayName;
    private String profileImageUrl;
    private String role;
    private boolean isOnline;
    private LocalDateTime lastSeenAt;
    private String cursorPosition; // JSON string representing cursor position
    private String selectionRange; // JSON string representing selected text range
    private String color; // Assigned color for this collaborator
}