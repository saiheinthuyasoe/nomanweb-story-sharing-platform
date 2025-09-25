package com.app.nomanweb_backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OAuthEmailChangeRequest {

    @NotBlank(message = "New email is required")
    @Email(message = "Valid email format is required")
    private String newEmail;
}