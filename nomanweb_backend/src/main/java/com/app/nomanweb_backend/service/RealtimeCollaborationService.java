package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.dto.collaboration.RealtimeCollaborationMessage;

import java.util.UUID;

public interface RealtimeCollaborationService {
    
    /**
     * Broadcast content update to all collaborators of a chapter
     */
    void broadcastContentUpdate(UUID chapterId, UUID userId, String content, Integer position, Integer length, String operation);
    
    /**
     * Broadcast cursor position update to other collaborators
     */
    void broadcastCursorPosition(UUID chapterId, UUID userId, Integer cursorPosition);
    
    /**
     * Broadcast selection range update to other collaborators
     */
    void broadcastSelectionRange(UUID chapterId, UUID userId, Integer selectionStart, Integer selectionEnd);
    
    /**
     * Notify when a user joins a chapter collaboration
     */
    void notifyUserJoined(UUID chapterId, UUID userId, String username, String displayName, String profileImageUrl);
    
    /**
     * Notify when a user leaves a chapter collaboration
     */
    void notifyUserLeft(UUID chapterId, UUID userId);
    
    /**
     * Update user presence and broadcast to other collaborators
     */
    void updatePresence(UUID chapterId, UUID userId, boolean isOnline);
    
    /**
     * Get the number of active collaborators for a chapter
     */
    int getActiveCollaboratorCount(UUID chapterId);
} 