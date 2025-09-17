package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.dto.withdraw.WithdrawRequest;
import com.app.nomanweb_backend.dto.withdraw.WithdrawResponse;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.entity.Withdraw;
import com.app.nomanweb_backend.repository.UserRepository;
import com.app.nomanweb_backend.repository.WithdrawRepository;
import com.app.nomanweb_backend.service.WithdrawService;
import com.app.nomanweb_backend.service.StripeWithdrawService;
import com.stripe.exception.StripeException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class WithdrawServiceImpl implements WithdrawService {

    private final WithdrawRepository withdrawRepository;
    private final UserRepository userRepository;
    private final StripeWithdrawService stripeWithdrawService;

    // Minimum withdrawal amount
    private static final BigDecimal MIN_WITHDRAW_AMOUNT = new BigDecimal("50.00");
    // Maximum withdrawal amount per request
    private static final BigDecimal MAX_WITHDRAW_AMOUNT = new BigDecimal("1000.00");

    @Override
    public WithdrawResponse createWithdrawRequest(WithdrawRequest request, UUID userId) {
        log.info("Creating withdrawal request for user: {} amount: {}", userId, request.getAmount());

        // Get user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate withdrawal amount
        validateWithdrawAmount(request.getAmount());

        // Validate bank account details
        if (!stripeWithdrawService.validateBankAccount(request.getBankName(),
                request.getAccountNumber(), request.getRoutingNumber())) {
            throw new RuntimeException("Invalid bank account details");
        }

        // Check if user can withdraw
        if (!canUserWithdraw(userId, request.getAmount())) {
            throw new RuntimeException("Insufficient balance or pending withdrawal exists");
        }

        // Check user has sufficient balance
        if (user.getCoinBalance().compareTo(request.getAmount()) < 0) {
            throw new RuntimeException("Insufficient coin balance");
        }

        // Create withdrawal entity
        Withdraw withdraw = Withdraw.builder()
                .user(user)
                .amount(request.getAmount())
                .bankName(request.getBankName())
                .accountNumber(request.getAccountNumber())
                .accountHolderName(request.getAccountHolderName())
                .routingNumber(request.getRoutingNumber())
                .status(Withdraw.WithdrawStatus.PENDING)
                .build();

        withdraw = withdrawRepository.save(withdraw);

        // Deduct amount from user's balance (hold it)
        user.setCoinBalance(user.getCoinBalance().subtract(request.getAmount()));
        userRepository.save(user);

        log.info("Withdrawal request created successfully: {}", withdraw.getId());
        return convertToResponse(withdraw);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WithdrawResponse> getWithdrawHistory(UUID userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Withdraw> withdrawals = withdrawRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return withdrawals.map(this::convertToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public WithdrawResponse getWithdrawById(UUID withdrawId, UUID userId) {
        Withdraw withdraw = withdrawRepository.findByIdAndUserId(withdrawId, userId);
        if (withdraw == null) {
            throw new RuntimeException("Withdrawal not found");
        }
        return convertToResponse(withdraw);
    }

    @Override
    public WithdrawResponse cancelWithdraw(UUID withdrawId, UUID userId) {
        log.info("Cancelling withdrawal: {} for user: {}", withdrawId, userId);

        Withdraw withdraw = withdrawRepository.findByIdAndUserId(withdrawId, userId);
        if (withdraw == null) {
            throw new RuntimeException("Withdrawal not found");
        }

        if (!withdraw.isPending()) {
            throw new RuntimeException("Can only cancel pending withdrawals");
        }

        // Update status
        withdraw.setStatus(Withdraw.WithdrawStatus.CANCELLED);
        withdraw.setUpdatedAt(LocalDateTime.now());
        withdraw = withdrawRepository.save(withdraw);

        // Refund amount to user's balance
        User user = withdraw.getUser();
        user.setCoinBalance(user.getCoinBalance().add(withdraw.getAmount()));
        userRepository.save(user);

        log.info("Withdrawal cancelled successfully: {}", withdrawId);
        return convertToResponse(withdraw);
    }

    @Override
    public WithdrawResponse processWithdraw(UUID withdrawId) {
        log.info("Processing withdrawal: {}", withdrawId);

        Optional<Withdraw> withdrawOpt = withdrawRepository.findById(withdrawId);
        if (withdrawOpt.isEmpty()) {
            throw new RuntimeException("Withdrawal not found");
        }
        Withdraw withdraw = withdrawOpt.get();

        if (!withdraw.isPending()) {
            throw new RuntimeException("Can only process pending withdrawals");
        }

        try {
            // Process withdrawal through Stripe
            String transferId = stripeWithdrawService.processWithdrawal(withdraw);

            // Update withdrawal with transfer details
            withdraw.setStatus(Withdraw.WithdrawStatus.COMPLETED);
            withdraw.setProcessedAt(LocalDateTime.now());
            withdraw.setUpdatedAt(LocalDateTime.now());
            withdraw.setStripeTransferId(transferId);
            withdraw = withdrawRepository.save(withdraw);

        } catch (StripeException e) {
            log.error("Stripe processing failed for withdrawal {}: {}", withdrawId, e.getMessage());

            // Mark as failed due to processing failure
            withdraw.setStatus(Withdraw.WithdrawStatus.FAILED);
            withdraw.setFailureReason("Payment processing failed: " + e.getMessage());
            withdraw.setUpdatedAt(LocalDateTime.now());
            withdraw = withdrawRepository.save(withdraw);

            // Refund amount to user's balance
            User user = withdraw.getUser();
            user.setCoinBalance(user.getCoinBalance().add(withdraw.getAmount()));
            userRepository.save(user);

            throw new RuntimeException("Failed to process withdrawal: " + e.getMessage());
        }

        log.info("Withdrawal processed successfully: {}", withdrawId);
        return convertToResponse(withdraw);
    }

    @Override
    public WithdrawResponse rejectWithdraw(UUID withdrawId, String reason) {
        log.info("Rejecting withdrawal: {} with reason: {}", withdrawId, reason);

        Optional<Withdraw> withdrawOpt = withdrawRepository.findById(withdrawId);
        if (withdrawOpt.isEmpty()) {
            throw new RuntimeException("Withdrawal not found");
        }
        Withdraw withdraw = withdrawOpt.get();

        if (!withdraw.isPending()) {
            throw new RuntimeException("Can only reject pending withdrawals");
        }

        // Update status
        withdraw.setStatus(Withdraw.WithdrawStatus.FAILED);
        withdraw.setFailureReason(reason);
        withdraw.setUpdatedAt(LocalDateTime.now());
        withdraw = withdrawRepository.save(withdraw);

        // Refund amount to user's balance
        User user = withdraw.getUser();
        user.setCoinBalance(user.getCoinBalance().add(withdraw.getAmount()));
        userRepository.save(user);

        log.info("Withdrawal rejected successfully: {}", withdrawId);
        return convertToResponse(withdraw);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WithdrawResponse> getAllWithdrawals(int page, int size, Withdraw.WithdrawStatus status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Withdraw> withdrawals;

        if (status != null) {
            withdrawals = withdrawRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        } else {
            withdrawals = withdrawRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        return withdrawals.map(this::convertToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getUserPendingWithdrawAmount(UUID userId) {
        return withdrawRepository.getTotalPendingAmountByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canUserWithdraw(UUID userId, BigDecimal amount) {
        // Check if user has any pending withdrawals
        boolean hasPendingWithdrawals = withdrawRepository.existsByUserIdAndStatus(userId,
                Withdraw.WithdrawStatus.PENDING);
        if (hasPendingWithdrawals) {
            return false;
        }

        // Check if user has sufficient balance
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getCoinBalance().compareTo(amount) < 0) {
            return false;
        }

        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public WithdrawStats getWithdrawStats(LocalDateTime startDate, LocalDateTime endDate) {
        long totalRequests = withdrawRepository.countByCreatedAtBetween(startDate, endDate);
        BigDecimal totalAmount = withdrawRepository.getTotalAmountByDateRange(startDate, endDate);
        long pendingCount = withdrawRepository.countByStatusAndCreatedAtBetween(Withdraw.WithdrawStatus.PENDING,
                startDate, endDate);
        long processedCount = withdrawRepository.countByStatusAndCreatedAtBetween(Withdraw.WithdrawStatus.COMPLETED,
                startDate, endDate);
        long rejectedCount = withdrawRepository.countByStatusAndCreatedAtBetween(Withdraw.WithdrawStatus.FAILED,
                startDate, endDate);

        return new WithdrawStats(totalRequests, totalAmount != null ? totalAmount : BigDecimal.ZERO,
                pendingCount, processedCount, rejectedCount);
    }

    private void validateWithdrawAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Withdrawal amount must be greater than zero");
        }

        if (amount.compareTo(MIN_WITHDRAW_AMOUNT) < 0) {
            throw new RuntimeException("Minimum withdrawal amount is $" + MIN_WITHDRAW_AMOUNT);
        }

        if (amount.compareTo(MAX_WITHDRAW_AMOUNT) > 0) {
            throw new RuntimeException("Maximum withdrawal amount is $" + MAX_WITHDRAW_AMOUNT);
        }
    }

    private WithdrawResponse convertToResponse(Withdraw withdraw) {
        return WithdrawResponse.builder()
                .id(withdraw.getId())
                .userId(withdraw.getUser().getId())
                .amount(withdraw.getAmount())
                .bankName(withdraw.getBankName())
                .accountNumber(withdraw.getMaskedAccountNumber())
                .accountHolderName(withdraw.getAccountHolderName())
                .routingNumber(withdraw.getRoutingNumber())
                .notes(withdraw.getNotes())
                .status(withdraw.getStatus().name())
                .failureReason(withdraw.getFailureReason())
                .createdAt(withdraw.getCreatedAt())
                .updatedAt(withdraw.getUpdatedAt())
                .build();
    }
}