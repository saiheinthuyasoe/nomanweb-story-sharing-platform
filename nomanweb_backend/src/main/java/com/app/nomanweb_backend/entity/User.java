package com.app.nomanweb_backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Email
    @NotBlank
    @Column(unique = true, nullable = false)
    private String email;

    @NotBlank
    @Size(min = 3, max = 50)
    @Column(unique = true, nullable = false)
    private String username;

    @Size(max = 100)
    @Column(name = "display_name")
    private String displayName;

    @JsonIgnore
    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Role role = Role.USER;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.ACTIVE;

    @Column(name = "coin_balance", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal coinBalance = BigDecimal.ZERO;

    @Column(name = "total_earned_coins", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal totalEarnedCoins = BigDecimal.ZERO;

    @Column(name = "line_user_id", length = 100)
    private String lineUserId;

    @Column(name = "google_id", length = 100)
    private String googleId;

    @Column(name = "email_verified")
    @Builder.Default
    private Boolean emailVerified = false;

    @Column(name = "password_reset_token")
    private String passwordResetToken;

    @Column(name = "password_reset_expires")
    private LocalDateTime passwordResetExpires;

    @Column(name = "last_password_change")
    private LocalDateTime lastPasswordChange;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Relationships
    @OneToMany(mappedBy = "author", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<Story> stories = new ArrayList<>();

    @OneToMany(mappedBy = "follower", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<UserFollow> following = new ArrayList<>();

    @OneToMany(mappedBy = "following", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<UserFollow> followers = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<Reaction> reactions = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<CoinTransaction> coinTransactions = new ArrayList<>();

    // Enums
    public enum Role {
        USER, ADMIN
    }

    public enum Status {
        ACTIVE, SUSPENDED, BANNED
    }

    // Helper methods
    public void addCoins(BigDecimal amount) {
        this.coinBalance = this.coinBalance.add(amount);
    }

    public void subtractCoins(BigDecimal amount) {
        this.coinBalance = this.coinBalance.subtract(amount);
    }

    public boolean hasEnoughCoins(BigDecimal amount) {
        return this.coinBalance.compareTo(amount) >= 0;
    }

    public void addEarnedCoins(BigDecimal amount) {
        this.totalEarnedCoins = this.totalEarnedCoins.add(amount);
        this.addCoins(amount);
    }

    public boolean isActive() {
        return this.status == Status.ACTIVE;
    }

    public boolean isAdmin() {
        return this.role == Role.ADMIN;
    }

    public String getDisplayNameOrUsername() {
        return displayName != null && !displayName.trim().isEmpty() ? displayName : username;
    }
}