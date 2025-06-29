package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.dto.monetization.GiftResponse;
import com.app.nomanweb_backend.entity.Gift;
import com.app.nomanweb_backend.repository.GiftRepository;
import com.app.nomanweb_backend.service.GiftService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GiftServiceImpl implements GiftService {

    private final GiftRepository giftRepository;

    @Override
    public List<GiftResponse> getAllActiveGifts() {
        return giftRepository.findActiveGifts().stream()
                .map(this::convertToGiftResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<GiftResponse> getAllGifts() {
        return giftRepository.findAllByOrderByCoinCostAsc().stream()
                .map(this::convertToGiftResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public GiftResponse createGift(String name, String description, String iconUrl, BigDecimal coinCost) {
        if (giftRepository.existsByName(name)) {
            throw new RuntimeException("Gift with this name already exists");
        }

        Gift gift = Gift.builder()
                .name(name)
                .description(description)
                .iconUrl(iconUrl)
                .coinCost(coinCost)
                .isActive(true)
                .build();

        gift = giftRepository.save(gift);
        log.info("Created new gift: {} with cost: {}", name, coinCost);

        return convertToGiftResponse(gift);
    }

    @Override
    @Transactional
    public GiftResponse updateGift(UUID giftId, String name, String description, String iconUrl,
            BigDecimal coinCost, Boolean isActive) {
        Gift gift = giftRepository.findById(giftId)
                .orElseThrow(() -> new RuntimeException("Gift not found"));

        // Check if name is being changed and if it conflicts
        if (!gift.getName().equals(name) && giftRepository.existsByName(name)) {
            throw new RuntimeException("Gift with this name already exists");
        }

        gift.setName(name);
        gift.setDescription(description);
        gift.setIconUrl(iconUrl);
        gift.setCoinCost(coinCost);
        gift.setIsActive(isActive);

        gift = giftRepository.save(gift);
        log.info("Updated gift: {} (ID: {})", name, giftId);

        return convertToGiftResponse(gift);
    }

    @Override
    @Transactional
    public void deleteGift(UUID giftId) {
        Gift gift = giftRepository.findById(giftId)
                .orElseThrow(() -> new RuntimeException("Gift not found"));

        // Instead of hard delete, we'll just deactivate
        gift.setIsActive(false);
        giftRepository.save(gift);

        log.info("Deactivated gift: {} (ID: {})", gift.getName(), giftId);
    }

    @Override
    public Gift findGiftById(UUID giftId) {
        return giftRepository.findById(giftId)
                .orElseThrow(() -> new RuntimeException("Gift not found"));
    }

    private GiftResponse convertToGiftResponse(Gift gift) {
        return GiftResponse.builder()
                .id(gift.getId())
                .name(gift.getName())
                .description(gift.getDescription())
                .iconUrl(gift.getIconUrl())
                .coinCost(gift.getCoinCost())
                .isActive(gift.getIsActive())
                .createdAt(gift.getCreatedAt())
                .build();
    }
}