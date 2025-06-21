package com.app.nomanweb_backend.dto.admin;

import com.app.nomanweb_backend.entity.AdminInvitation.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminInvitationResponse {

    private UUID id;
    private String email;
    private Status status;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private LocalDateTime usedAt;
    private String notes;

    // Invited by details
    private String invitedByName;
    private String invitedByEmail;

    // Registered admin details (if used)
    private String registeredAdminName;
    private String registeredAdminEmail;

    // Helper fields
    private boolean isExpired;
    private boolean isValid;
    private long hoursUntilExpiration;
}