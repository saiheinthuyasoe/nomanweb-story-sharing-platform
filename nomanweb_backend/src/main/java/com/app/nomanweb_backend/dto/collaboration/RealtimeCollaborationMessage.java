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
public class RealtimeCollaborationMessage {

    public enum MessageType {
        CONTENT_UPDATE,
        CURSOR_POSITION,
        SELECTION_RANGE,
        USER_JOINED,
        USER_LEFT,
        PRESENCE_UPDATE
    }

    private MessageType type;
    private UUID chapterId;
    private UUID userId;
    private String username;
    private String displayName;
    private String profileImageUrl;
    private LocalDateTime timestamp;

    // Content update specific fields
    private String content;
    private Integer position;
    private Integer length;
    private String operation; // "insert", "delete", "replace"

    // Cursor and selection specific fields
    private Integer cursorPosition;
    private Integer selectionStart;
    private Integer selectionEnd;

    // Presence specific fields
    private boolean isOnline;
    private String color;
}