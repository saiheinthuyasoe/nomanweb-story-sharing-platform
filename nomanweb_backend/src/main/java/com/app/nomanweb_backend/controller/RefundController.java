package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.dto.refund.RefundRequest;
import com.app.nomanweb_backend.dto.refund.RefundCalculationResponse;
import com.app.nomanweb_backend.entity.RefundTransaction;
import com.app.nomanweb_backend.service.RefundService;
import com.app.nomanweb_backend.service.PurchaseProtectionService;
import com.app.nomanweb_backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import com.app.nomanweb_backend.entity.Story;

@RestController
@RequestMapping("/api/refunds")
@RequiredArgsConstructor
@Slf4j
public class RefundController {

    private final RefundService refundService;
    private final PurchaseProtectionService purchaseProtectionService;
    private final JwtUtil jwtUtil;

    @PostMapping("/stories/{storyId}/calculate")
    public ResponseEntity<RefundCalculationResponse> calculateStoryRefund(
            @PathVariable UUID storyId,
            @RequestHeader("Authorization") String token) {
        try {
            UUID userId = jwtUtil.getUserIdFromToken(token.substring(7));
            RefundCalculationResponse calculation = refundService.calculateStoryRefund(storyId);
            return ResponseEntity.ok(calculation);
        } catch (Exception e) {
            log.error("Error calculating story refund", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/chapters/{chapterId}/calculate")
    public ResponseEntity<RefundCalculationResponse> calculateChapterRefund(
            @PathVariable UUID chapterId,
            @RequestHeader("Authorization") String token) {
        try {
            UUID userId = jwtUtil.getUserIdFromToken(token.substring(7));
            RefundCalculationResponse calculation = refundService.calculateChapterRefund(chapterId);
            return ResponseEntity.ok(calculation);
        } catch (Exception e) {
            log.error("Error calculating chapter refund", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/stories/{storyId}/pricing-change/calculate")
    public ResponseEntity<RefundCalculationResponse> calculatePricingChangeRefund(
            @PathVariable UUID storyId,
            @RequestParam String newPricingType,
            @RequestHeader("Authorization") String token) {
        try {
            UUID userId = jwtUtil.getUserIdFromToken(token.substring(7));
            Story.PricingType pricingType = Story.PricingType.valueOf(newPricingType);
            RefundCalculationResponse calculation = purchaseProtectionService
                    .calculatePricingChangeRefundAmount(storyId, pricingType);
            return ResponseEntity.ok(calculation);
        } catch (Exception e) {
            log.error("Error calculating pricing change refund", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/stories/{storyId}/pricing-change/check")
    public ResponseEntity<Boolean> checkPricingChangeRequiresRefund(
            @PathVariable UUID storyId,
            @RequestParam String newPricingType,
            @RequestHeader("Authorization") String token) {
        try {
            UUID userId = jwtUtil.getUserIdFromToken(token.substring(7));
            Story.PricingType pricingType = Story.PricingType.valueOf(newPricingType);
            boolean requiresRefund = purchaseProtectionService.pricingChangeRequiresRefund(storyId, pricingType);
            return ResponseEntity.ok(requiresRefund);
        } catch (Exception e) {
            log.error("Error checking pricing change refund requirement", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/stories/{storyId}/initiate")
    public ResponseEntity<List<RefundTransaction>> initiateStoryRefund(
            @PathVariable UUID storyId,
            @RequestBody RefundRequest request,
            @RequestHeader("Authorization") String token) {
        try {
            UUID userId = jwtUtil.getUserIdFromToken(token.substring(7));
            List<RefundTransaction> refunds = refundService.processStoryRefund(
                    storyId, userId, request.getRefundType(), request.getReason());
            return ResponseEntity.ok(refunds);
        } catch (Exception e) {
            log.error("Error initiating story refund", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/chapters/{chapterId}/initiate")
    public ResponseEntity<List<RefundTransaction>> initiateChapterRefund(
            @PathVariable UUID chapterId,
            @RequestBody RefundRequest request,
            @RequestHeader("Authorization") String token) {
        try {
            UUID userId = jwtUtil.getUserIdFromToken(token.substring(7));
            List<RefundTransaction> refunds = refundService.processChapterRefund(
                    chapterId, userId, request.getRefundType(), request.getReason());
            return ResponseEntity.ok(refunds);
        } catch (Exception e) {
            log.error("Error initiating chapter refund", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/author/my-refunds")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Page<RefundTransaction>> getAuthorRefunds(
            @RequestHeader("Authorization") String token,
            Pageable pageable) {
        try {
            UUID userId = jwtUtil.getUserIdFromToken(token.substring(7));
            Page<RefundTransaction> refunds = refundService.getAuthorRefunds(userId, pageable);
            return ResponseEntity.ok(refunds);
        } catch (Exception e) {
            log.error("Error getting author refunds", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/buyer/my-refunds")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Page<RefundTransaction>> getBuyerRefunds(
            @RequestHeader("Authorization") String token,
            Pageable pageable) {
        try {
            UUID userId = jwtUtil.getUserIdFromToken(token.substring(7));
            Page<RefundTransaction> refunds = refundService.getBuyerRefunds(userId, pageable);
            return ResponseEntity.ok(refunds);
        } catch (Exception e) {
            log.error("Error getting buyer refunds", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{refundId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<RefundTransaction> getRefundById(
            @PathVariable UUID refundId,
            @RequestHeader("Authorization") String token) {
        try {
            UUID userId = jwtUtil.getUserIdFromToken(token.substring(7));
            RefundTransaction refund = refundService.getRefundById(refundId);

            // Check if user is either the author or buyer of this refund
            if (!refund.getAuthor().getId().equals(userId) && !refund.getBuyer().getId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            return ResponseEntity.ok(refund);
        } catch (Exception e) {
            log.error("Error getting refund", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/stories/{storyId}/protection-status")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Boolean> getStoryProtectionStatus(
            @PathVariable UUID storyId,
            @RequestHeader("Authorization") String token) {
        try {
            UUID userId = jwtUtil.getUserIdFromToken(token.substring(7));
            boolean hasPurchases = purchaseProtectionService.storyHasPurchases(storyId);
            return ResponseEntity.ok(hasPurchases);
        } catch (Exception e) {
            log.error("Error checking story protection status", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/chapters/{chapterId}/protection-status")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Boolean> getChapterProtectionStatus(
            @PathVariable UUID chapterId,
            @RequestHeader("Authorization") String token) {
        try {
            UUID userId = jwtUtil.getUserIdFromToken(token.substring(7));
            boolean hasPurchases = purchaseProtectionService.chapterHasPurchases(chapterId);
            return ResponseEntity.ok(hasPurchases);
        } catch (Exception e) {
            log.error("Error checking chapter protection status", e);
            return ResponseEntity.badRequest().build();
        }
    }

}