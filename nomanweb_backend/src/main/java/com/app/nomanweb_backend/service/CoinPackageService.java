package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.entity.CoinPackage;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CoinPackageService {

    // Get all packages
    List<CoinPackage> getAllPackages();

    // Get all active packages
    List<CoinPackage> getActivePackages();

    // Get package by ID
    Optional<CoinPackage> getPackageById(UUID id);

    // Create new package
    CoinPackage createPackage(String name, Integer coinAmount, BigDecimal priceThb,
            Integer bonusCoins, BigDecimal serviceFeePercentage, Boolean isActive);

    // Update existing package
    CoinPackage updatePackage(UUID id, String name, Integer coinAmount, BigDecimal priceThb,
            Integer bonusCoins, BigDecimal serviceFeePercentage, Boolean isActive);

    // Delete package
    void deletePackage(UUID id);

    // Toggle package active status
    CoinPackage togglePackageStatus(UUID id);

    // Validate package name uniqueness
    boolean isPackageNameUnique(String name, UUID excludeId);

    // Get packages by price range
    List<CoinPackage> getPackagesByPriceRange(BigDecimal minPrice, BigDecimal maxPrice);

    // Get package statistics
    long getActivePackageCount();
}