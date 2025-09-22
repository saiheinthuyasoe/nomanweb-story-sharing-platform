package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.dto.withdraw.WithdrawRequest;
import com.app.nomanweb_backend.dto.withdraw.WithdrawResponse;
import com.app.nomanweb_backend.service.WithdrawService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.UUID;

@RestController
@RequestMapping("/api/withdraw")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "https://nomanweb-story-sharing-platform-pbc.vercel.app" })
@Slf4j
public class WithdrawController {

    private final WithdrawService withdrawService;

    @PostMapping("/request")
    public ResponseEntity<WithdrawResponse> createWithdrawRequest(
            @Valid @RequestBody WithdrawRequest request,
            Authentication authentication) {

        UUID userId = getCurrentUserId(authentication);
        log.info("Creating withdrawal request for user: {}", userId);

        WithdrawResponse response = withdrawService.createWithdrawRequest(request, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<Page<WithdrawResponse>> getWithdrawHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {

        UUID userId = getCurrentUserId(authentication);
        log.info("Getting withdrawal history for user: {}", userId);

        Page<WithdrawResponse> history = withdrawService.getWithdrawHistory(userId, page, size);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/{withdrawId}")
    public ResponseEntity<WithdrawResponse> getWithdrawStatus(
            @PathVariable UUID withdrawId,
            Authentication authentication) {

        UUID userId = getCurrentUserId(authentication);
        log.info("Getting withdrawal status for: {} by user: {}", withdrawId, userId);

        WithdrawResponse response = withdrawService.getWithdrawById(withdrawId, userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{withdrawId}/cancel")
    public ResponseEntity<WithdrawResponse> cancelWithdraw(
            @PathVariable UUID withdrawId,
            Authentication authentication) {

        UUID userId = getCurrentUserId(authentication);
        log.info("Cancelling withdrawal: {} for user: {}", withdrawId, userId);

        WithdrawResponse response = withdrawService.cancelWithdraw(withdrawId, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint() {
        return ResponseEntity.ok("Withdraw controller is working!");
    }

    private UUID getCurrentUserId(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated() &&
                !authentication.getPrincipal().equals("anonymousUser")) {
            return UUID.fromString(authentication.getName());
        }
        throw new RuntimeException("No valid authentication found");
    }
}