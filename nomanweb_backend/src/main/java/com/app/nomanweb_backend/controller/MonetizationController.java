package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.dto.monetization.*;
import com.app.nomanweb_backend.dto.refund.RefundTransactionResponse;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.service.MonetizationService;
import com.app.nomanweb_backend.service.AuthService;
import com.app.nomanweb_backend.util.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/monetization")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Monetization", description = "Monetization and coin management APIs")
public class MonetizationController {

    private final MonetizationService monetizationService;
    private final AuthService authService;
    private final JwtUtil jwtUtil;

    @GetMapping("/gifts")
    @Operation(summary = "Get available gifts")
    public ResponseEntity<List<GiftResponse>> getAvailableGifts() {
        List<GiftResponse> gifts = monetizationService.getAvailableGifts();
        return ResponseEntity.ok(gifts);
    }

    @PostMapping("/gifts/send")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Send a gift to another user")
    public ResponseEntity<GiftTransactionResponse> sendGift(
            @Valid @RequestBody SendGiftRequest request,
            HttpServletRequest httpRequest) {

        User currentUser = getCurrentUser(httpRequest);
        GiftTransactionResponse response = monetizationService.sendGift(currentUser, request);

        log.info("User {} sent gift {} to user {}",
                currentUser.getId(), request.getGiftId(), request.getRecipientId());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/gifts/received")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get gifts received by current user")
    public ResponseEntity<Page<GiftTransactionResponse>> getReceivedGifts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest httpRequest) {

        User currentUser = getCurrentUser(httpRequest);
        Pageable pageable = PageRequest.of(page, size);
        Page<GiftTransactionResponse> gifts = monetizationService.getReceivedGifts(currentUser, pageable);

        return ResponseEntity.ok(gifts);
    }

    @GetMapping("/gifts/sent")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get gifts sent by current user")
    public ResponseEntity<Page<GiftTransactionResponse>> getSentGifts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest httpRequest) {

        User currentUser = getCurrentUser(httpRequest);
        Pageable pageable = PageRequest.of(page, size);
        Page<GiftTransactionResponse> gifts = monetizationService.getSentGifts(currentUser, pageable);

        return ResponseEntity.ok(gifts);
    }

    @PostMapping("/chapters/purchase")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Purchase a chapter")
    public ResponseEntity<GiftTransactionResponse> purchaseChapter(
            @Valid @RequestBody PurchaseChapterRequest request,
            @RequestHeader("Authorization") String token) {

        UUID userId = jwtUtil.getUserIdFromToken(token.substring(7));
        User currentUser = authService.getCurrentUser(userId);
        GiftTransactionResponse response = monetizationService.purchaseChapter(currentUser, request);

        log.info("User {} purchased chapter {}", currentUser.getId(), request.getChapterId());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/chapters/access/{chapterId}")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Check if user can access a chapter")
    public ResponseEntity<Boolean> canAccessChapter(
            @PathVariable String chapterId,
            HttpServletRequest httpRequest) {

        try {
            User currentUser = getCurrentUser(httpRequest);
            UUID chapterUuid = UUID.fromString(chapterId);
            boolean canAccess = monetizationService.canAccessChapter(currentUser, chapterUuid);
            return ResponseEntity.ok(canAccess);
        } catch (IllegalArgumentException e) {
            log.error("Invalid chapter ID format: {}", chapterId, e);
            return ResponseEntity.badRequest().body(false);
        }
    }

    @PostMapping("/books/purchase")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Purchase a whole book")
    public ResponseEntity<GiftTransactionResponse> purchaseBook(
            @Valid @RequestBody PurchaseBookRequest request,
            @RequestHeader("Authorization") String token) {

        UUID userId = jwtUtil.getUserIdFromToken(token.substring(7));
        User currentUser = authService.getCurrentUser(userId);
        GiftTransactionResponse response = monetizationService.purchaseBook(currentUser, request);

        log.info("User {} purchased book {}", currentUser.getId(), request.getStoryId());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/books/access/{storyId}")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Check if user can access a book")
    public ResponseEntity<Boolean> canAccessBook(
            @PathVariable String storyId,
            HttpServletRequest httpRequest) {

        User currentUser = getCurrentUser(httpRequest);
        boolean canAccess = monetizationService.canAccessBook(currentUser, java.util.UUID.fromString(storyId));

        return ResponseEntity.ok(canAccess);
    }

    @GetMapping("/purchases/history")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get purchase history")
    public ResponseEntity<Page<GiftTransactionResponse>> getPurchaseHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest httpRequest) {

        User currentUser = getCurrentUser(httpRequest);
        Pageable pageable = PageRequest.of(page, size);
        Page<GiftTransactionResponse> history = monetizationService.getPurchaseHistory(currentUser, pageable);

        return ResponseEntity.ok(history);
    }

    @GetMapping("/balance")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get current coin balance")
    public ResponseEntity<BigDecimal> getCoinBalance(HttpServletRequest httpRequest) {
        User currentUser = getCurrentUser(httpRequest);
        BigDecimal balance = monetizationService.getUserCoinBalance(currentUser.getId());
        return ResponseEntity.ok(balance);
    }

    @GetMapping("/revenue")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get revenue analytics")
    public ResponseEntity<RevenueAnalyticsResponse> getRevenue(HttpServletRequest httpRequest) {
        User currentUser = getCurrentUser(httpRequest);
        RevenueAnalyticsResponse revenue = monetizationService.getUserRevenue(currentUser);
        return ResponseEntity.ok(revenue);
    }

    @GetMapping("/earnings")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get user earnings from reader purchases")
    public ResponseEntity<Page<EarnedMoneyResponse>> getUserEarnings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest httpRequest) {

        User currentUser = getCurrentUser(httpRequest);
        Pageable pageable = PageRequest.of(page, size);
        Page<EarnedMoneyResponse> earnings = monetizationService.getUserEarnings(currentUser, pageable);

        return ResponseEntity.ok(earnings);
    }

    @GetMapping("/purchases")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get user purchase history")
    public ResponseEntity<Page<PurchaseHistoryResponse>> getUserPurchases(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest httpRequest) {

        User currentUser = getCurrentUser(httpRequest);
        Pageable pageable = PageRequest.of(page, size);
        Page<PurchaseHistoryResponse> purchases = monetizationService.getUserPurchaseHistory(currentUser, pageable);

        return ResponseEntity.ok(purchases);
    }

    @GetMapping("/refunds/earned")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get refunds earned by current user")
    public ResponseEntity<Page<RefundTransactionResponse>> getRefundsEarned(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest httpRequest) {

        User currentUser = getCurrentUser(httpRequest);
        Pageable pageable = PageRequest.of(page, size);
        Page<RefundTransactionResponse> refunds = monetizationService.getRefundsEarned(currentUser, pageable);

        return ResponseEntity.ok(refunds);
    }

    @GetMapping("/refunds/paid")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get refunds paid by current user")
    public ResponseEntity<Page<RefundTransactionResponse>> getRefundsPaid(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest httpRequest) {

        User currentUser = getCurrentUser(httpRequest);
        Pageable pageable = PageRequest.of(page, size);
        Page<RefundTransactionResponse> refunds = monetizationService.getRefundsPaid(currentUser, pageable);

        return ResponseEntity.ok(refunds);
    }

    private User getCurrentUser(HttpServletRequest request) {
        UUID userId = getCurrentUserId(request);
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