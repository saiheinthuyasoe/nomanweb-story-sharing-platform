package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.entity.CoinPackage;
import com.app.nomanweb_backend.repository.UserRepository;
import com.app.nomanweb_backend.service.CoinPackageService;
import com.app.nomanweb_backend.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/coins")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminCoinController {

    private final UserRepository userRepository;
    private final CoinPackageService coinPackageService;
    private final JwtUtil jwtUtil;

    // Coin Transaction Statistics
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getCoinStats() {
        try {
            log.info("Admin getting coin statistics");

            // Calculate real statistics from database
            List<User> allUsers = userRepository.findAll();

            BigDecimal totalIssued = allUsers.stream()
                    .map(User::getTotalEarnedCoins)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalBalance = allUsers.stream()
                    .map(User::getCoinBalance)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalIssued", totalIssued.longValue());
            stats.put("totalPurchases", totalIssued.longValue()); // Mock: same as issued for now
            stats.put("totalWithdrawals", totalIssued.subtract(totalBalance).longValue());
            stats.put("currentBalance", totalBalance.longValue());
            stats.put("totalUsers", allUsers.size());

            log.info("Coin stats: Issued={}, Balance={}, Users={}",
                    totalIssued, totalBalance, allUsers.size());

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error getting coin statistics", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Get Coin Transactions
    @GetMapping("/transactions")
    public ResponseEntity<List<Map<String, Object>>> getCoinTransactions(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            log.info("Admin getting coin transactions - search: {}, type: {}, status: {}",
                    search, type, status);

            // For now, return mock transaction data
            // TODO: Implement real transaction logging system
            List<Map<String, Object>> transactions = new ArrayList<>();

            // Mock transactions based on users
            List<User> users = userRepository.findAll();
            int transactionId = 1;

            for (User user : users.stream().limit(10).collect(Collectors.toList())) {
                // Mock purchase transaction
                Map<String, Object> purchaseTransaction = new HashMap<>();
                purchaseTransaction.put("id", String.valueOf(transactionId++));

                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("id", user.getId().toString());
                userInfo.put("username", user.getUsername());
                userInfo.put("email", user.getEmail());
                purchaseTransaction.put("user", userInfo);

                purchaseTransaction.put("type", "purchase");
                purchaseTransaction.put("amount", 100);
                purchaseTransaction.put("status", "completed");
                purchaseTransaction.put("date", LocalDateTime.now().minusDays(1));
                purchaseTransaction.put("description", "Coin package purchase");
                purchaseTransaction.put("reference", "TXN" + String.format("%03d", transactionId - 1));

                transactions.add(purchaseTransaction);

                // Mock transfer transaction if user has coins
                if (user.getCoinBalance() != null && user.getCoinBalance().compareTo(BigDecimal.ZERO) > 0) {
                    Map<String, Object> transferTransaction = new HashMap<>();
                    transferTransaction.put("id", String.valueOf(transactionId++));
                    transferTransaction.put("user", userInfo);
                    transferTransaction.put("type", "transfer_in");
                    transferTransaction.put("amount", user.getCoinBalance().intValue());
                    transferTransaction.put("status", "completed");
                    transferTransaction.put("date", LocalDateTime.now().minusHours(2));
                    transferTransaction.put("description", "Admin coin transfer");
                    transferTransaction.put("reference", "TXN" + String.format("%03d", transactionId - 1));

                    transactions.add(transferTransaction);
                }
            }

            // Apply filters
            List<Map<String, Object>> filteredTransactions = transactions.stream()
                    .filter(transaction -> {
                        if (search != null && !search.trim().isEmpty()) {
                            Map<String, Object> userInfo = (Map<String, Object>) transaction.get("user");
                            String username = (String) userInfo.get("username");
                            String email = (String) userInfo.get("email");
                            return username.toLowerCase().contains(search.toLowerCase()) ||
                                    email.toLowerCase().contains(search.toLowerCase());
                        }
                        return true;
                    })
                    .filter(transaction -> {
                        if (type != null && !type.trim().isEmpty()) {
                            return type.equals(transaction.get("type"));
                        }
                        return true;
                    })
                    .filter(transaction -> {
                        if (status != null && !status.trim().isEmpty()) {
                            return status.equals(transaction.get("status"));
                        }
                        return true;
                    })
                    .collect(Collectors.toList());

            // Apply pagination
            int start = page * size;
            int end = Math.min(start + size, filteredTransactions.size());
            List<Map<String, Object>> pageTransactions = start < filteredTransactions.size()
                    ? filteredTransactions.subList(start, end)
                    : new ArrayList<>();

            log.info("Returning {} transactions out of {} total",
                    pageTransactions.size(), filteredTransactions.size());

            return ResponseEntity.ok(pageTransactions);
        } catch (Exception e) {
            log.error("Error getting coin transactions", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Get Coin Packages
    @GetMapping("/packages")
    public ResponseEntity<List<Map<String, Object>>> getCoinPackages() {
        try {
            log.info("Admin getting coin packages");

            List<CoinPackage> packages = coinPackageService.getAllPackages();
            List<Map<String, Object>> response = packages.stream()
                    .map(this::convertCoinPackageToMap)
                    .collect(Collectors.toList());

            log.info("Returning {} coin packages", response.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting coin packages", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Create Coin Package
    @PostMapping("/packages")
    public ResponseEntity<Map<String, Object>> createCoinPackage(
            @RequestBody Map<String, Object> packageData,
            HttpServletRequest httpRequest) {
        try {
            log.info("Received coin package creation request: {}", packageData);
            UUID adminId = getCurrentUserId(httpRequest);
            log.info("Admin {} creating coin package: {}", adminId, packageData.get("name"));

            // Validate required fields
            String name = (String) packageData.get("name");
            Object coinsObj = packageData.get("coins");
            Object priceObj = packageData.get("price");

            if (name == null || coinsObj == null || priceObj == null) {
                log.error("Missing required fields in package data: {}", packageData);
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Missing required fields: name, coins, and price are required"));
            }

            // Parse and validate data
            Integer coins = coinsObj instanceof Number ? ((Number) coinsObj).intValue()
                    : Integer.parseInt(coinsObj.toString());
            BigDecimal priceUsd = priceObj instanceof Number ? BigDecimal.valueOf(((Number) priceObj).doubleValue())
                    : new BigDecimal(priceObj.toString());

            // Convert USD to THB (assuming 1 USD = 35 THB)
            BigDecimal priceThb = priceUsd.multiply(BigDecimal.valueOf(35));

            Integer bonusCoins = packageData.get("bonusCoins") != null
                    ? ((Number) packageData.get("bonusCoins")).intValue()
                    : 0;
            Boolean isActive = packageData.get("isActive") != null ? (Boolean) packageData.get("isActive") : true;

            // Create package
            CoinPackage createdPackage = coinPackageService.createPackage(
                    name, coins, priceThb, bonusCoins, BigDecimal.ZERO, isActive);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Coin package created successfully");
            response.put("packageId", createdPackage.getId().toString());
            response.put("package", convertCoinPackageToMap(createdPackage));

            log.info("Coin package created successfully: {}", response);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Validation error creating coin package: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating coin package", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Internal server error: " + e.getMessage()));
        }
    }

    // Update Coin Package
    @PutMapping("/packages/{packageId}")
    public ResponseEntity<Map<String, Object>> updateCoinPackage(
            @PathVariable String packageId,
            @RequestBody Map<String, Object> packageData,
            HttpServletRequest httpRequest) {
        try {
            UUID adminId = getCurrentUserId(httpRequest);
            log.info("Admin {} updating coin package {}: {}", adminId, packageId, packageData.get("name"));

            // Parse package ID
            UUID id = UUID.fromString(packageId);

            // Validate required fields
            String name = (String) packageData.get("name");
            Object coinsObj = packageData.get("coins");
            Object priceObj = packageData.get("price");

            if (name == null || coinsObj == null || priceObj == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Missing required fields: name, coins, and price are required"));
            }

            // Parse and validate data
            Integer coins = coinsObj instanceof Number ? ((Number) coinsObj).intValue()
                    : Integer.parseInt(coinsObj.toString());
            BigDecimal priceUsd = priceObj instanceof Number ? BigDecimal.valueOf(((Number) priceObj).doubleValue())
                    : new BigDecimal(priceObj.toString());

            // Convert USD to THB
            BigDecimal priceThb = priceUsd.multiply(BigDecimal.valueOf(35));

            Integer bonusCoins = packageData.get("bonusCoins") != null
                    ? ((Number) packageData.get("bonusCoins")).intValue()
                    : 0;
            Boolean isActive = packageData.get("isActive") != null ? (Boolean) packageData.get("isActive") : true;

            // Update package
            CoinPackage updatedPackage = coinPackageService.updatePackage(
                    id, name, coins, priceThb, bonusCoins, BigDecimal.ZERO, isActive);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Coin package updated successfully");
            response.put("packageId", packageId);
            response.put("package", convertCoinPackageToMap(updatedPackage));

            log.info("Coin package {} updated successfully", packageId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Validation error updating coin package: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating coin package", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Internal server error: " + e.getMessage()));
        }
    }

    // Delete Coin Package
    @DeleteMapping("/packages/{packageId}")
    public ResponseEntity<Map<String, Object>> deleteCoinPackage(
            @PathVariable String packageId,
            HttpServletRequest httpRequest) {
        try {
            UUID adminId = getCurrentUserId(httpRequest);
            log.info("Admin {} deleting coin package {}", adminId, packageId);

            // Parse package ID and delete
            UUID id = UUID.fromString(packageId);
            coinPackageService.deletePackage(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Coin package deleted successfully");

            log.info("Coin package {} deleted successfully", packageId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Validation error deleting coin package: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error deleting coin package", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Internal server error: " + e.getMessage()));
        }
    }

    // Coin Transfer
    @PostMapping("/transfer")
    public ResponseEntity<Map<String, Object>> transferCoins(
            @RequestBody Map<String, Object> transferData,
            HttpServletRequest httpRequest) {
        try {
            UUID adminId = getCurrentUserId(httpRequest);
            String userId = (String) transferData.get("userId");
            Object amountObj = transferData.get("amount");
            String type = (String) transferData.get("type");
            String reason = (String) transferData.get("reason");

            log.info("Admin {} processing coin {} for user {}, amount: {}, reason: {}",
                    adminId, type, userId, amountObj, reason);

            // Validate input
            if (userId == null || amountObj == null || type == null || reason == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Missing required fields"));
            }

            BigDecimal amount;
            if (amountObj instanceof Number) {
                amount = BigDecimal.valueOf(((Number) amountObj).doubleValue());
            } else {
                amount = new BigDecimal(amountObj.toString());
            }

            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Amount must be positive"));
            }

            // Find user
            User user = userRepository.findById(UUID.fromString(userId))
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Process transfer
            if ("transfer".equals(type)) {
                // Add coins
                user.addCoins(amount);
                log.info("Added {} coins to user {}", amount, userId);
            } else if ("withdraw".equals(type)) {
                // Remove coins
                if (!user.hasEnoughCoins(amount)) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "User does not have enough coins"));
                }
                user.subtractCoins(amount);
                log.info("Removed {} coins from user {}", amount, userId);
            } else {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid transfer type"));
            }

            // Update timestamp and save
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);

            // TODO: Create transaction log entry

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Coin " + type + " completed successfully");
            response.put("newBalance", user.getCoinBalance());

            log.info("Coin {} completed for user {}, new balance: {}",
                    type, userId, user.getCoinBalance());

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("User not found or validation error: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error processing coin transfer", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Internal server error"));
        }
    }

    private UUID getCurrentUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return jwtUtil.getUserIdFromToken(token);
        }
        throw new RuntimeException("No valid authorization token found");
    }

    private Map<String, Object> convertCoinPackageToMap(CoinPackage coinPackage) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", coinPackage.getId().toString());
        map.put("name", coinPackage.getName());
        map.put("coins", coinPackage.getTotalCoins()); // Include bonus coins
        map.put("price", coinPackage.getPriceUsd().doubleValue()); // Convert to USD
        map.put("currency", "USD");
        map.put("description", ""); // Add description field if needed
        map.put("isActive", coinPackage.getIsActive());
        map.put("createdAt", coinPackage.getCreatedAt());
        map.put("updatedAt", coinPackage.getCreatedAt()); // No updatedAt field in entity yet
        map.put("coinAmount", coinPackage.getCoinAmount());
        map.put("bonusCoins", coinPackage.getBonusCoins());
        map.put("priceThb", coinPackage.getPriceThb().doubleValue());
        return map;
    }
}