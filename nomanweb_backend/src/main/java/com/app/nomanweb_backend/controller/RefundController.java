package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.service.PurchaseProtectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/refunds")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "https://nomanweb-story-sharing-platform-pbc.vercel.app" })
@Slf4j
public class RefundController {

    private final PurchaseProtectionService purchaseProtectionService;

    // Simple test endpoint to verify controller is working
    @GetMapping("/test")
    public ResponseEntity<?> testEndpoint() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "RefundController is working!");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stories/{storyId}/has-purchases")
    public ResponseEntity<?> checkStoryHasPurchases(
            @PathVariable UUID storyId,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getCurrentUserId(httpRequest);
            log.info("🔍 RefundController: Checking purchases for story: {} by author: {}", storyId, authorId);

            boolean hasPurchases = purchaseProtectionService.storyHasPurchases(storyId);

            Map<String, Object> response = new HashMap<>();
            response.put("hasPurchases", hasPurchases);
            response.put("storyId", storyId.toString());
            response.put("authorId", authorId.toString());

            log.info("✅ RefundController: Story {} has purchases: {}", storyId, hasPurchases);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("❌ Authentication error checking story purchases: {}", e.getMessage());

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "AUTHENTICATION_ERROR");
            errorResponse.put("message", "No valid authentication found");

            return ResponseEntity.status(401).body(errorResponse);
        } catch (Exception e) {
            log.error("❌ Error checking story purchases: {}", e.getMessage());

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "CHECK_PURCHASES_ERROR");
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping("/chapters/{chapterId}/has-purchases")
    public ResponseEntity<?> checkChapterHasPurchases(
            @PathVariable UUID chapterId,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getCurrentUserId(httpRequest);
            log.info("🔍 RefundController: Checking purchases for chapter: {} by author: {}", chapterId, authorId);

            boolean hasPurchases = purchaseProtectionService.chapterHasPurchases(chapterId);

            Map<String, Object> response = new HashMap<>();
            response.put("hasPurchases", hasPurchases);
            response.put("chapterId", chapterId.toString());
            response.put("authorId", authorId.toString());

            log.info("✅ RefundController: Chapter {} has purchases: {}", chapterId, hasPurchases);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("❌ Authentication error checking chapter purchases: {}", e.getMessage());

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "AUTHENTICATION_ERROR");
            errorResponse.put("message", "No valid authentication found");

            return ResponseEntity.status(401).body(errorResponse);
        } catch (Exception e) {
            log.error("❌ Error checking chapter purchases: {}", e.getMessage());

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "CHECK_PURCHASES_ERROR");
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping("/chapters/{chapterId}/calculate-refund")
    public ResponseEntity<?> calculateChapterRefund(
            @PathVariable UUID chapterId,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getCurrentUserId(httpRequest);
            log.info("🔍 RefundController: Calculating refund for chapter: {} by author: {}", chapterId, authorId);

            PurchaseProtectionService.RefundCalculationResult result = purchaseProtectionService
                    .calculateChapterRefund(chapterId);

            Map<String, Object> response = new HashMap<>();
            response.put("hasPurchases", result.isHasPurchases());
            response.put("totalRefundAmount", result.getTotalRefundAmount());
            response.put("affectedPurchasers", result.getAffectedPurchasers());
            response.put("requiresRefunds", result.isRequiresRefunds());
            response.put("pricingType", result.getPricingType());
            response.put("chapterId", chapterId.toString());
            response.put("authorId", authorId.toString());

            log.info("✅ RefundController: Chapter {} refund calculation - Amount: {}, Affected: {}, Requires: {}",
                    chapterId, result.getTotalRefundAmount(), result.getAffectedPurchasers(),
                    result.isRequiresRefunds());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("❌ Authentication error calculating chapter refund: {}", e.getMessage());

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "AUTHENTICATION_ERROR");
            errorResponse.put("message", "No valid authentication found");

            return ResponseEntity.status(401).body(errorResponse);
        } catch (Exception e) {
            log.error("❌ Error calculating chapter refund: {}", e.getMessage());

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "CALCULATE_REFUND_ERROR");
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping("/stories/{storyId}/calculate-refund")
    public ResponseEntity<?> calculateStoryRefund(
            @PathVariable UUID storyId,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getCurrentUserId(httpRequest);
            log.info("🔍 RefundController: Calculating refund for story: {} by author: {}", storyId, authorId);

            PurchaseProtectionService.RefundCalculationResult result = purchaseProtectionService
                    .calculateStoryRefund(storyId);

            Map<String, Object> response = new HashMap<>();
            response.put("hasPurchases", result.isHasPurchases());
            response.put("totalRefundAmount", result.getTotalRefundAmount());
            response.put("affectedPurchasers", result.getAffectedPurchasers());
            response.put("requiresRefunds", result.isRequiresRefunds());
            response.put("pricingType", result.getPricingType());
            response.put("storyId", storyId.toString());
            response.put("authorId", authorId.toString());

            log.info("✅ RefundController: Story {} refund calculation - Amount: {}, Affected: {}, Requires: {}",
                    storyId, result.getTotalRefundAmount(), result.getAffectedPurchasers(), result.isRequiresRefunds());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("❌ Authentication error calculating story refund: {}", e.getMessage());

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "AUTHENTICATION_ERROR");
            errorResponse.put("message", "No valid authentication found");

            return ResponseEntity.status(401).body(errorResponse);
        } catch (Exception e) {
            log.error("❌ Error calculating story refund: {}", e.getMessage());

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "CALCULATE_REFUND_ERROR");
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    // Utility method to get current user ID
    private UUID getCurrentUserId(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() &&
                !authentication.getPrincipal().equals("anonymousUser")) {
            return UUID.fromString(authentication.getName());
        }
        throw new IllegalArgumentException("No valid authentication found");
    }
}