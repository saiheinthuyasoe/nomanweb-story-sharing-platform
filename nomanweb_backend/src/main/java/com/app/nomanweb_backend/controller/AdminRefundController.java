package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.entity.RefundTransaction;
import com.app.nomanweb_backend.service.RefundService;
import com.app.nomanweb_backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/refunds")
@RequiredArgsConstructor
@Slf4j
public class AdminRefundController {

    private final RefundService refundService;
    private final JwtUtil jwtUtil;

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<RefundTransaction>> getPendingRefunds(
            @RequestHeader("Authorization") String token,
            Pageable pageable) {
        try {
            UUID adminId = jwtUtil.getUserIdFromToken(token.substring(7));
            Page<RefundTransaction> refunds = refundService.getPendingRefunds(pageable);
            return ResponseEntity.ok(refunds);
        } catch (Exception e) {
            log.error("Error getting pending refunds", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{refundId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RefundTransaction> approveRefund(
            @PathVariable UUID refundId,
            @RequestHeader("Authorization") String token) {
        try {
            UUID adminId = jwtUtil.getUserIdFromToken(token.substring(7));
            RefundTransaction refund = refundService.approveRefund(refundId, adminId);
            return ResponseEntity.ok(refund);
        } catch (Exception e) {
            log.error("Error approving refund", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{refundId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RefundTransaction> rejectRefund(
            @PathVariable UUID refundId,
            @RequestBody Map<String, String> requestBody,
            @RequestHeader("Authorization") String token) {
        try {
            UUID adminId = jwtUtil.getUserIdFromToken(token.substring(7));
            String reason = requestBody.get("reason");
            RefundTransaction refund = refundService.rejectRefund(refundId, adminId, reason);
            return ResponseEntity.ok(refund);
        } catch (Exception e) {
            log.error("Error rejecting refund", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{refundId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RefundTransaction> getRefundById(
            @PathVariable UUID refundId,
            @RequestHeader("Authorization") String token) {
        try {
            UUID adminId = jwtUtil.getUserIdFromToken(token.substring(7));
            RefundTransaction refund = refundService.getRefundById(refundId);
            return ResponseEntity.ok(refund);
        } catch (Exception e) {
            log.error("Error getting refund", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{refundId}/execute")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> executeRefund(
            @PathVariable UUID refundId,
            @RequestHeader("Authorization") String token) {
        try {
            UUID adminId = jwtUtil.getUserIdFromToken(token.substring(7));
            refundService.executeRefund(refundId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error executing refund", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}