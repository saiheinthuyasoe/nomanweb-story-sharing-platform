package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.CoinPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CoinPackageRepository extends JpaRepository<CoinPackage, UUID> {

    // Find all active packages
    List<CoinPackage> findByIsActiveTrueOrderByCoinAmountAsc();

    // Find all packages (active and inactive) ordered by coin amount
    List<CoinPackage> findAllByOrderByCoinAmountAsc();

    // Find packages by active status
    List<CoinPackage> findByIsActiveOrderByCoinAmountAsc(Boolean isActive);

    // Check if package name exists (for validation)
    boolean existsByNameIgnoreCase(String name);

    // Check if package name exists excluding current package (for updates)
    boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);

    // Find packages by price range
    @Query("SELECT cp FROM CoinPackage cp WHERE cp.priceThb BETWEEN :minPrice AND :maxPrice AND cp.isActive = true ORDER BY cp.coinAmount ASC")
    List<CoinPackage> findByPriceRangeAndActive(java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice);

    // Count active packages
    long countByIsActiveTrue();
}