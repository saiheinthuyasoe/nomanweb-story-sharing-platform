package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.Gift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GiftRepository extends JpaRepository<Gift, UUID> {

    List<Gift> findByIsActiveTrueOrderByCoinCostAsc();

    List<Gift> findAllByOrderByCoinCostAsc();

    @Query("SELECT g FROM Gift g WHERE g.isActive = true ORDER BY g.coinCost ASC")
    List<Gift> findActiveGifts();

    boolean existsByName(String name);
}