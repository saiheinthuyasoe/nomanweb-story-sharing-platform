package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.entity.CoinPackage;
import com.app.nomanweb_backend.entity.CoinTransaction;
import com.app.nomanweb_backend.repository.UserRepository;
import com.app.nomanweb_backend.repository.CoinTransactionRepository;
import com.app.nomanweb_backend.service.CoinPackageService;
import com.app.nomanweb_backend.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/coins")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "https://nomanweb-story-sharing-platform-pbc.vercel.app" })
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminCoinController {

    private final UserRepository userRepository;
    private final CoinPackageService coinPackageService;
    private final CoinTransactionRepository coinTransactionRepository;
    private final JwtUtil jwtUtil;
    private final com.app.nomanweb_backend.repository.ChapterPurchaseRepository chapterPurchaseRepository;
    private final com.app.nomanweb_backend.repository.BookPurchaseRepository bookPurchaseRepository;

    // SSE emitters for coin package updates
    private static final List<SseEmitter> coinPackageEmitters = new CopyOnWriteArrayList<>();

    // Coin Transaction Statistics
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getCoinStats() {
        try {
            log.info("Admin getting coin statistics");

            // Calculate real statistics from database
            List<User> allUsers = userRepository.findAll();

            // Calculate total revenue from actual purchases
            BigDecimal totalChapterRevenue = chapterPurchaseRepository.findAll().stream()
                    .filter(purchase -> !purchase.getIsRefunded())
                    .map(purchase -> purchase.getCoinsSpent())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalBookRevenue = bookPurchaseRepository.findAll().stream()
                    .filter(purchase -> !purchase.getIsRefunded())
                    .map(purchase -> purchase.getCoinsSpent())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalPurchaseRevenue = totalChapterRevenue.add(totalBookRevenue);

            // Count total purchases
            long totalChapterPurchases = chapterPurchaseRepository.findAll().stream()
                    .filter(purchase -> !purchase.getIsRefunded())
                    .count();

            long totalBookPurchases = bookPurchaseRepository.findAll().stream()
                    .filter(purchase -> !purchase.getIsRefunded())
                    .count();

            long totalPurchases = totalChapterPurchases + totalBookPurchases;

            // Calculate current balance (all users' coin balances)
            BigDecimal totalBalance = allUsers.stream()
                    .map(User::getCoinBalance)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Calculate total issued coins (from coin transactions)
            BigDecimal totalIssued = allUsers.stream()
                    .map(User::getTotalEarnedCoins)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalIssued", totalIssued.longValue());
            stats.put("totalPurchases", totalPurchases);
            stats.put("totalPurchaseRevenue", totalPurchaseRevenue.longValue());
            stats.put("totalWithdrawals", totalIssued.subtract(totalBalance).longValue());
            stats.put("currentBalance", totalBalance.longValue());
            stats.put("totalUsers", allUsers.size());

            log.info("Coin stats: Revenue={}, Purchases={}, Balance={}, Users={}",
                    totalPurchaseRevenue, totalPurchases, totalBalance, allUsers.size());

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

            // Get all transactions with pagination
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<CoinTransaction> transactionPage = coinTransactionRepository.findAll(pageable);

            List<Map<String, Object>> transactions = new ArrayList<>();

            for (CoinTransaction transaction : transactionPage.getContent()) {
                // Apply filters
                if (search != null && !search.trim().isEmpty()) {
                    String searchLower = search.toLowerCase();
                    String username = transaction.getUser().getUsername();
                    String email = transaction.getUser().getEmail();
                    String description = transaction.getDescription();

                    if (!username.toLowerCase().contains(searchLower) &&
                            !email.toLowerCase().contains(searchLower) &&
                            !description.toLowerCase().contains(searchLower)) {
                        continue;
                    }
                }

                if (type != null && !type.trim().isEmpty()) {
                    if (!transaction.getTransactionType().name().equalsIgnoreCase(type)) {
                        continue;
                    }
                }

                if (status != null && !status.trim().isEmpty()) {
                    if (!transaction.getStatus().name().equalsIgnoreCase(status)) {
                        continue;
                    }
                }

                if (dateFrom != null && !dateFrom.trim().isEmpty()) {
                    LocalDateTime fromDate = LocalDateTime.parse(dateFrom + "T00:00:00");
                    if (transaction.getCreatedAt().isBefore(fromDate)) {
                        continue;
                    }
                }

                if (dateTo != null && !dateTo.trim().isEmpty()) {
                    LocalDateTime toDate = LocalDateTime.parse(dateTo + "T23:59:59");
                    if (transaction.getCreatedAt().isAfter(toDate)) {
                        continue;
                    }
                }

                // Build transaction response
                Map<String, Object> transactionMap = new HashMap<>();
                transactionMap.put("id", transaction.getId().toString());

                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("id", transaction.getUser().getId().toString());
                userInfo.put("username", transaction.getUser().getUsername());
                userInfo.put("email", transaction.getUser().getEmail());
                transactionMap.put("user", userInfo);

                transactionMap.put("type", transaction.getTransactionType().name().toLowerCase());
                transactionMap.put("amount", transaction.getAmount());
                transactionMap.put("status", transaction.getStatus().name().toLowerCase());
                transactionMap.put("date", transaction.getCreatedAt());
                transactionMap.put("description", transaction.getDescription());
                transactionMap.put("balanceBefore", transaction.getBalanceBefore());
                transactionMap.put("balanceAfter", transaction.getBalanceAfter());
                transactionMap.put("reference", "TXN" + transaction.getId().toString().substring(0, 8).toUpperCase());

                transactions.add(transactionMap);
            }

            log.info("Returning {} transactions out of {} total",
                    transactions.size(), transactionPage.getTotalElements());

            return ResponseEntity.ok(transactions);
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
            BigDecimal priceThb = priceObj instanceof Number ? BigDecimal.valueOf(((Number) priceObj).doubleValue())
                    : new BigDecimal(priceObj.toString());

            Integer bonusCoins = packageData.get("bonusCoins") != null
                    ? ((Number) packageData.get("bonusCoins")).intValue()
                    : 0;
            Boolean isActive = packageData.get("isActive") != null ? (Boolean) packageData.get("isActive") : true;
            String description = (String) packageData.get("description");

            // Create package
            CoinPackage createdPackage = coinPackageService.createPackage(
                    name, coins, priceThb, bonusCoins, BigDecimal.ZERO, isActive, description);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Coin package created successfully");
            response.put("packageId", createdPackage.getId().toString());
            response.put("package", convertCoinPackageToMap(createdPackage));

            log.info("Coin package created successfully: {}", response);

            // Broadcast package creation to all subscribers
            broadcastCoinPackageUpdate("created", convertCoinPackageToMap(createdPackage));

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
            BigDecimal priceThb = priceObj instanceof Number ? BigDecimal.valueOf(((Number) priceObj).doubleValue())
                    : new BigDecimal(priceObj.toString());

            Integer bonusCoins = packageData.get("bonusCoins") != null
                    ? ((Number) packageData.get("bonusCoins")).intValue()
                    : 0;
            Boolean isActive = packageData.get("isActive") != null ? (Boolean) packageData.get("isActive") : true;
            String description = (String) packageData.get("description");

            // Update package
            CoinPackage updatedPackage = coinPackageService.updatePackage(
                    id, name, coins, priceThb, bonusCoins, BigDecimal.ZERO, isActive, description);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Coin package updated successfully");
            response.put("packageId", packageId);
            response.put("package", convertCoinPackageToMap(updatedPackage));

            log.info("Coin package {} updated successfully", packageId);

            // Broadcast package update to all subscribers
            broadcastCoinPackageUpdate("updated", convertCoinPackageToMap(updatedPackage));

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

            // Broadcast package deletion to all subscribers
            Map<String, Object> deletedPackage = new HashMap<>();
            deletedPackage.put("id", packageId);
            broadcastCoinPackageUpdate("deleted", deletedPackage);

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
            String userIdentifier = (String) transferData.get("userIdentifier"); // username or email
            Object amountObj = transferData.get("amount");
            String type = (String) transferData.get("type");
            String reason = (String) transferData.get("reason");

            log.info("Admin {} processing coin {} for user {}, amount: {}, reason: {}",
                    adminId, type, userIdentifier, amountObj, reason);

            // Validate input
            if (userIdentifier == null || amountObj == null || type == null || reason == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error",
                                "Missing required fields: userIdentifier, amount, type, and reason are required"));
            }

            BigDecimal amount;
            try {
                if (amountObj instanceof Number) {
                    amount = BigDecimal.valueOf(((Number) amountObj).doubleValue());
                } else {
                    amount = new BigDecimal(amountObj.toString());
                }
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid amount format"));
            }

            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Amount must be positive"));
            }

            // Find user by username or email
            User user = userRepository.findByUsernameOrEmail(userIdentifier, userIdentifier)
                    .orElseThrow(() -> new RuntimeException("User not found with identifier: " + userIdentifier));

            BigDecimal balanceBefore = user.getCoinBalance();
            BigDecimal balanceAfter;
            CoinTransaction.TransactionType transactionType;

            // Process transfer
            if ("transfer".equals(type)) {
                // Add coins
                user.addCoins(amount);
                balanceAfter = user.getCoinBalance();
                transactionType = CoinTransaction.TransactionType.BONUS;
                log.info("Added {} coins to user {} ({}), new balance: {}", amount, user.getUsername(), user.getEmail(),
                        balanceAfter);
            } else if ("withdraw".equals(type)) {
                // Remove coins
                if (!user.hasEnoughCoins(amount)) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error",
                                    "User does not have enough coins. Current balance: " + balanceBefore));
                }
                user.subtractCoins(amount);
                balanceAfter = user.getCoinBalance();
                transactionType = CoinTransaction.TransactionType.PENALTY;
                log.info("Removed {} coins from user {} ({}), new balance: {}", amount, user.getUsername(),
                        user.getEmail(), balanceAfter);
            } else {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid transfer type. Must be 'transfer' or 'withdraw'"));
            }

            // Update timestamp and save user
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);

            // Create transaction log entry
            CoinTransaction transaction = CoinTransaction.builder()
                    .user(user)
                    .transactionType(transactionType)
                    .amount(amount)
                    .balanceBefore(balanceBefore)
                    .balanceAfter(balanceAfter)
                    .description("Admin " + type + ": " + reason)
                    .referenceType(CoinTransaction.ReferenceType.SYSTEM)
                    .referenceId(adminId) // Use admin ID as reference
                    .status(CoinTransaction.Status.COMPLETED)
                    .build();

            coinTransactionRepository.save(transaction);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Coin " + type + " completed successfully");
            response.put("newBalance", balanceAfter);
            response.put("transactionId", transaction.getId().toString());
            response.put("balanceBefore", balanceBefore);
            response.put("amount", amount);
            response.put("user", Map.of(
                    "id", user.getId().toString(),
                    "username", user.getUsername(),
                    "email", user.getEmail()));

            log.info("Coin {} completed for user {} ({}), transaction ID: {}, new balance: {}",
                    type, user.getUsername(), user.getEmail(), transaction.getId(), balanceAfter);

            // Broadcast balance update to the affected user immediately
            log.info("Broadcasting balance update immediately at: {}", LocalDateTime.now());
            broadcastCoinBalanceUpdate(user.getId(), balanceAfter);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Validation error in coin transfer: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            log.error("User not found or validation error: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error processing coin transfer", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Internal server error: " + e.getMessage()));
        }
    }

    // Broadcast coin balance update to specific user
    private void broadcastCoinBalanceUpdate(UUID userId, BigDecimal newBalance) {
        CoinController.broadcastCoinBalanceUpdate(userId, newBalance);
    }

    // Broadcast coin package updates to all subscribers
    private void broadcastCoinPackageUpdate(String action, Map<String, Object> packageData) {
        List<SseEmitter> deadEmitters = new ArrayList<>();

        for (SseEmitter emitter : coinPackageEmitters) {
            try {
                Map<String, Object> update = new HashMap<>();
                update.put("type", "package_update");
                update.put("action", action);
                update.put("package", packageData);
                update.put("timestamp", LocalDateTime.now());

                emitter.send(SseEmitter.event()
                        .name("package_update")
                        .data(update));
            } catch (IOException e) {
                deadEmitters.add(emitter);
            }
        }

        // Remove dead emitters
        coinPackageEmitters.removeAll(deadEmitters);
        log.info("Broadcasted package {} to {} subscribers", action, coinPackageEmitters.size());
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
        map.put("price", coinPackage.getPriceThb().doubleValue()); // THB price
        map.put("currency", "THB");
        map.put("description", coinPackage.getDescription());
        map.put("isActive", coinPackage.getIsActive());
        map.put("createdAt", coinPackage.getCreatedAt());
        map.put("updatedAt", coinPackage.getCreatedAt()); // No updatedAt field in entity yet
        map.put("coinAmount", coinPackage.getCoinAmount());
        map.put("bonusCoins", coinPackage.getBonusCoins());
        return map;
    }
}