package com.app.nomanweb_backend.dto.monetization;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseBookRequest {

    @NotNull(message = "Story ID is required")
    private UUID storyId;
}