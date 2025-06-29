package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.entity.CoinPackage;
import com.app.nomanweb_backend.repository.CoinPackageRepository;
import com.app.nomanweb_backend.service.CoinPackageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CoinPackageServiceImpl implements CoinPackageService {

    private final CoinPackageRepository coinPackageRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CoinPackage> getAllPackages() {
        log.debug("Getting all coin packages");
        return coinPackageRepository.findAllByOrderByCoinAmountAsc();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CoinPackage> getActivePackages() {
        log.debug("Getting active coin packages");
        return coinPackageRepository.findByIsActiveTrueOrderByCoinAmountAsc();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<CoinPackage> getPackageById(UUID id) {
        log.debug("Getting coin package by ID: {}", id);
        return coinPackageRepository.findById(id);
    }

    @Override
    public CoinPackage createPackage(String name, Integer coinAmount, BigDecimal priceThb,
            Integer bonusCoins, BigDecimal serviceFeePercentage, Boolean isActive) {
        log.info("Creating new coin package: {}", name);

        // Validate name uniqueness
        if (coinPackageRepository.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Package name already exists: " + name);
        }

        // Validate input
        if (coinAmount <= 0) {
            throw new IllegalArgumentException("Coin amount must be positive");
        }
        if (priceThb.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Price must be positive");
        }

        CoinPackage coinPackage = CoinPackage.builder()
                .name(name)
                .coinAmount(coinAmount)
                .priceThb(priceThb)
                .bonusCoins(bonusCoins != null ? bonusCoins : 0)
                .serviceFeePercentage(serviceFeePercentage != null ? serviceFeePercentage : BigDecimal.ZERO)
                .isActive(isActive != null ? isActive : true)
                .build();

        CoinPackage saved = coinPackageRepository.save(coinPackage);
        log.info("Created coin package with ID: {}", saved.getId());
        return saved;
    }

    @Override
    public CoinPackage updatePackage(UUID id, String name, Integer coinAmount, BigDecimal priceThb,
            Integer bonusCoins, BigDecimal serviceFeePercentage, Boolean isActive) {
        log.info("Updating coin package: {}", id);

        CoinPackage existingPackage = coinPackageRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Package not found: " + id));

        // Validate name uniqueness (excluding current package)
        if (coinPackageRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new IllegalArgumentException("Package name already exists: " + name);
        }

        // Validate input
        if (coinAmount <= 0) {
            throw new IllegalArgumentException("Coin amount must be positive");
        }
        if (priceThb.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Price must be positive");
        }

        // Update fields
        existingPackage.setName(name);
        existingPackage.setCoinAmount(coinAmount);
        existingPackage.setPriceThb(priceThb);
        existingPackage.setBonusCoins(bonusCoins != null ? bonusCoins : 0);
        existingPackage.setServiceFeePercentage(serviceFeePercentage != null ? serviceFeePercentage : BigDecimal.ZERO);
        existingPackage.setIsActive(isActive != null ? isActive : true);

        CoinPackage updated = coinPackageRepository.save(existingPackage);
        log.info("Updated coin package: {}", updated.getId());
        return updated;
    }

    @Override
    public void deletePackage(UUID id) {
        log.info("Deleting coin package: {}", id);

        if (!coinPackageRepository.existsById(id)) {
            throw new IllegalArgumentException("Package not found: " + id);
        }

        coinPackageRepository.deleteById(id);
        log.info("Deleted coin package: {}", id);
    }

    @Override
    public CoinPackage togglePackageStatus(UUID id) {
        log.info("Toggling status for coin package: {}", id);

        CoinPackage coinPackage = coinPackageRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Package not found: " + id));

        coinPackage.setIsActive(!coinPackage.getIsActive());
        CoinPackage updated = coinPackageRepository.save(coinPackage);

        log.info("Toggled package status to: {}", updated.getIsActive());
        return updated;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isPackageNameUnique(String name, UUID excludeId) {
        if (excludeId != null) {
            return !coinPackageRepository.existsByNameIgnoreCaseAndIdNot(name, excludeId);
        } else {
            return !coinPackageRepository.existsByNameIgnoreCase(name);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<CoinPackage> getPackagesByPriceRange(BigDecimal minPrice, BigDecimal maxPrice) {
        log.debug("Getting packages by price range: {} - {}", minPrice, maxPrice);
        return coinPackageRepository.findByPriceRangeAndActive(minPrice, maxPrice);
    }

    @Override
    @Transactional(readOnly = true)
    public long getActivePackageCount() {
        return coinPackageRepository.countByIsActiveTrue();
    }
}