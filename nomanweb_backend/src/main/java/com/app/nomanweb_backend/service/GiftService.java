package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.dto.monetization.GiftResponse;
import com.app.nomanweb_backend.entity.Gift;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface GiftService {

    List<GiftResponse> getAllActiveGifts();

    List<GiftResponse> getAllGifts();

    GiftResponse createGift(String name, String description, String iconUrl, BigDecimal coinCost);

    GiftResponse updateGift(UUID giftId, String name, String description, String iconUrl, BigDecimal coinCost,
            Boolean isActive);

    void deleteGift(UUID giftId);

    Gift findGiftById(UUID giftId);
}