package com.app.nomanweb_backend.dto.collaboration;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateCollaborationRequest {

    @NotNull(message = "Chapter ID is required")
    private UUID chapterId;

    @Email(message = "Valid email is required")
    private String inviteeEmail;

    @NotNull(message = "Role is required")
    private String role; // "EDIT" or "VIEW"

    private String message; // Optional invitation message
}