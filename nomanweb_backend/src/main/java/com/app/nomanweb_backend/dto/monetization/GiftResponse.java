package com.app.nomanweb_backend.dto.monetization;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GiftResponse {
    private UUID id;
    private String name;
    private String description;
    private String iconUrl;
    private BigDecimal coinCost;
    private Boolean isActive;
    private LocalDateTime createdAt;
}