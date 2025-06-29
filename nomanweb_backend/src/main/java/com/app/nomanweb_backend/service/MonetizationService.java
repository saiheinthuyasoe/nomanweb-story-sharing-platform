package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.dto.monetization.*;
import com.app.nomanweb_backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface MonetizationService {

    // Gift System
    List<GiftResponse> getAvailableGifts();

    GiftTransactionResponse sendGift(User sender, SendGiftRequest request);

    Page<GiftTransactionResponse> getReceivedGifts(User user, Pageable pageable);

    Page<GiftTransactionResponse> getSentGifts(User user, Pageable pageable);

    // Chapter Purchase System
    boolean canAccessChapter(User user, UUID chapterId);

    GiftTransactionResponse purchaseChapter(User user, PurchaseChapterRequest request);

    Page<GiftTransactionResponse> getPurchaseHistory(User user, Pageable pageable);

    // Coin Management
    void addCoins(User user, BigDecimal amount, String description);

    void deductCoins(User user, BigDecimal amount, String description);

    BigDecimal getUserCoinBalance(UUID userId);

    // Revenue Analytics
    RevenueAnalyticsResponse getUserRevenue(User user);

    BigDecimal calculateTotalEarnings(User user);

    BigDecimal calculateMonthlyEarnings(User user, int year, int month);
}