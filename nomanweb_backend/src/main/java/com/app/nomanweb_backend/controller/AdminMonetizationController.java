package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.dto.monetization.GiftResponse;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.service.GiftService;
import com.app.nomanweb_backend.service.MonetizationService;
import com.app.nomanweb_backend.service.SystemSettingService;
import com.app.nomanweb_backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/monetization")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin Monetization", description = "Admin monetization management APIs")
@PreAuthorize("hasRole('ADMIN')")
public class AdminMonetizationController {

    private final GiftService giftService;
    private final MonetizationService monetizationService;
    private final SystemSettingService systemSettingService;
    private final AuthService authService;

    // Gift Management
    @GetMapping("/gifts")
    @Operation(summary = "Get all gifts (admin)")
    public ResponseEntity<List<GiftResponse>> getAllGifts() {
        List<GiftResponse> gifts = giftService.getAllGifts();
        return ResponseEntity.ok(gifts);
    }

    @PostMapping("/gifts")
    @Operation(summary = "Create a new gift")
    public ResponseEntity<GiftResponse> createGift(
            @Valid @RequestBody CreateGiftRequest request,
            HttpServletRequest httpRequest) {

        User currentAdmin = getCurrentUser(httpRequest);
        GiftResponse gift = giftService.createGift(
                request.getName(),
                request.getDescription(),
                request.getIconUrl(),
                request.getCoinCost());

        log.info("Admin {} created new gift: {}", currentAdmin.getId(), gift.getName());
        return ResponseEntity.ok(gift);
    }

    @PutMapping("/gifts/{giftId}")
    @Operation(summary = "Update a gift")
    public ResponseEntity<GiftResponse> updateGift(
            @PathVariable UUID giftId,
            @Valid @RequestBody UpdateGiftRequest request,
            HttpServletRequest httpRequest) {

        User currentAdmin = getCurrentUser(httpRequest);
        GiftResponse gift = giftService.updateGift(
                giftId,
                request.getName(),
                request.getDescription(),
                request.getIconUrl(),
                request.getCoinCost(),
                request.getIsActive());

        log.info("Admin {} updated gift: {}", currentAdmin.getId(), giftId);
        return ResponseEntity.ok(gift);
    }

    @DeleteMapping("/gifts/{giftId}")
    @Operation(summary = "Delete (deactivate) a gift")
    public ResponseEntity<Void> deleteGift(
            @PathVariable UUID giftId,
            HttpServletRequest httpRequest) {

        User currentAdmin = getCurrentUser(httpRequest);
        giftService.deleteGift(giftId);

        log.info("Admin {} deleted gift: {}", currentAdmin.getId(), giftId);
        return ResponseEntity.ok().build();
    }

    // Coin Management
    @PostMapping("/coins/add")
    @Operation(summary = "Add coins to a user's account")
    public ResponseEntity<Void> addCoins(
            @Valid @RequestBody ManageCoinsRequest request,
            HttpServletRequest httpRequest) {

        User currentAdmin = getCurrentUser(httpRequest);
        User targetUser = getUserById(request.getUserId());

        monetizationService.addCoins(targetUser, request.getAmount(), request.getDescription());

        log.info("Admin {} added {} coins to user {}",
                currentAdmin.getId(), request.getAmount(), request.getUserId());

        return ResponseEntity.ok().build();
    }

    @PostMapping("/coins/deduct")
    @Operation(summary = "Deduct coins from a user's account")
    public ResponseEntity<Void> deductCoins(
            @Valid @RequestBody ManageCoinsRequest request,
            HttpServletRequest httpRequest) {

        User currentAdmin = getCurrentUser(httpRequest);
        User targetUser = getUserById(request.getUserId());

        monetizationService.deductCoins(targetUser, request.getAmount(), request.getDescription());

        log.info("Admin {} deducted {} coins from user {}",
                currentAdmin.getId(), request.getAmount(), request.getUserId());

        return ResponseEntity.ok().build();
    }

    // System Settings Management
    @GetMapping("/settings")
    @Operation(summary = "Get all system settings")
    public ResponseEntity<Map<String, String>> getAllSettings() {
        Map<String, String> settings = systemSettingService.getAllSettings();
        return ResponseEntity.ok(settings);
    }

    @PostMapping("/settings")
    @Operation(summary = "Update system setting")
    public ResponseEntity<Void> updateSetting(
            @Valid @RequestBody UpdateSettingRequest request,
            HttpServletRequest httpRequest) {

        User currentAdmin = getCurrentUser(httpRequest);
        systemSettingService.setSetting(request.getKey(), request.getValue(), request.getDescription());

        log.info("Admin {} updated setting: {} = {}",
                currentAdmin.getId(), request.getKey(), request.getValue());

        return ResponseEntity.ok().build();
    }

    // Request DTOs
    public static class CreateGiftRequest {
        public String name;
        public String description;
        public String iconUrl;
        public BigDecimal coinCost;

        // Getters
        public String getName() {
            return name;
        }

        public String getDescription() {
            return description;
        }

        public String getIconUrl() {
            return iconUrl;
        }

        public BigDecimal getCoinCost() {
            return coinCost;
        }
    }

    public static class UpdateGiftRequest extends CreateGiftRequest {
        public Boolean isActive;

        // Getter
        public Boolean getIsActive() {
            return isActive;
        }
    }

    public static class ManageCoinsRequest {
        public UUID userId;
        public BigDecimal amount;
        public String description;

        // Getters
        public UUID getUserId() {
            return userId;
        }

        public BigDecimal getAmount() {
            return amount;
        }

        public String getDescription() {
            return description;
        }
    }

    public static class UpdateSettingRequest {
        public String key;
        public String value;
        public String description;

        // Getters
        public String getKey() {
            return key;
        }

        public String getValue() {
            return value;
        }

        public String getDescription() {
            return description;
        }
    }

    private User getCurrentUser(HttpServletRequest request) {
        UUID userId = getCurrentUserId(request);
        return authService.getCurrentUser(userId);
    }

    private User getUserById(UUID userId) {
        return authService.getCurrentUser(userId);
    }

    private UUID getCurrentUserId(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() &&
                !authentication.getPrincipal().equals("anonymousUser")) {
            return UUID.fromString(authentication.getName());
        }
        throw new IllegalArgumentException("No valid authentication found");
    }
}