package com.app.nomanweb_backend.dto.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminInvitationRequest {

    @Email(message = "Please provide a valid email address")
    @NotBlank(message = "Email is required")
    private String email;

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;

    // Optional: Set custom expiration hours (default is 24 hours)
    private Integer expirationHours;

    // Optional: Specify department or role
    private String department;
    private String role;
}