package com.app.nomanweb_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "coin_packages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoinPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "UUID")
    private UUID id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "coin_amount", nullable = false)
    private Integer coinAmount;

    @Column(name = "price_thb", nullable = false, precision = 10, scale = 2)
    private BigDecimal priceThb;

    @Column(name = "bonus_coins", nullable = false)
    private Integer bonusCoins = 0;

    @Column(name = "service_fee_percentage", precision = 5, scale = 2)
    private BigDecimal serviceFeePercentage = BigDecimal.ZERO;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Helper method to get total coins (base + bonus)
    public Integer getTotalCoins() {
        return coinAmount + (bonusCoins != null ? bonusCoins : 0);
    }

    // Getter for price (THB only)
    public BigDecimal getPrice() {
        return priceThb;
    }
}