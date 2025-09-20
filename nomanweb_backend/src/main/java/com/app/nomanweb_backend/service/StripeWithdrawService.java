package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.config.StripeConfig;
import com.app.nomanweb_backend.entity.Withdraw;
import com.stripe.exception.StripeException;
import com.stripe.model.Account;
import com.stripe.model.Transfer;
import com.stripe.param.AccountCreateParams;
import com.stripe.param.TransferCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class StripeWithdrawService {

    private final StripeConfig stripeConfig;
    
    // Simulation mode configuration
    private static final boolean SIMULATION_MODE = true;
    private static final double SIMULATION_SUCCESS_RATE = 0.95; // 95% success rate
    private static final long SIMULATION_DELAY_MS = 2000; // 2 second delay

    /**
     * Process withdrawal through Stripe Transfer API
     * Note: This is a simplified implementation. In production, you would need:
     * 1. Proper KYC verification
     * 2. Connected accounts for users
     * 3. Compliance with financial regulations
     */
    public String processWithdrawal(Withdraw withdraw) throws StripeException {
        log.info("Processing withdrawal {} for amount: {}", withdraw.getId(), withdraw.getAmount());

        // Convert amount to cents (Stripe uses smallest currency unit)
        long amountInCents = withdraw.getAmount().multiply(BigDecimal.valueOf(100)).longValue();

        // Create transfer parameters
        Map<String, Object> transferParams = new HashMap<>();
        transferParams.put("amount", amountInCents);
        transferParams.put("currency", stripeConfig.getCurrency().toLowerCase());
        transferParams.put("description", "Withdrawal for user: " + withdraw.getUser().getId());

        // Add metadata for tracking
        Map<String, String> metadata = new HashMap<>();
        metadata.put("withdrawal_id", withdraw.getId().toString());
        metadata.put("user_id", withdraw.getUser().getId().toString());
        metadata.put("bank_name", withdraw.getBankName());
        metadata.put("account_holder", withdraw.getAccountHolderName());
        transferParams.put("metadata", metadata);

        try {
            if (SIMULATION_MODE) {
                return processSimulatedWithdrawal(withdraw, transferParams);
            } else {
                // Real Stripe processing
                return processRealWithdrawal(transferParams);
            }

        } catch (Exception e) {
            log.error("Failed to process withdrawal {}: {}", withdraw.getId(), e.getMessage(), e);
            throw new StripeException("Failed to process withdrawal: " + e.getMessage(), null, null, 500) {
            };
        }
    }

    /**
     * Create a connected account for user (for future implementation)
     * This would be used to create Stripe connected accounts for users who want to
     * withdraw
     */
    public String createConnectedAccount(String email, String country) throws StripeException {
        log.info("Creating connected account for email: {}", email);

        AccountCreateParams params = AccountCreateParams.builder()
                .setType(AccountCreateParams.Type.EXPRESS)
                .setCountry(country)
                .setEmail(email)
                .setCapabilities(
                        AccountCreateParams.Capabilities.builder()
                                .setTransfers(AccountCreateParams.Capabilities.Transfers.builder()
                                        .setRequested(true)
                                        .build())
                                .build())
                .build();

        Account account = Account.create(params);

        log.info("Connected account created: {}", account.getId());
        return account.getId();
    }

    /**
     * Validate bank account details (placeholder implementation)
     */
    public boolean validateBankAccount(String bankName, String accountNumber, String routingNumber) {
        log.info("Validating bank account: {} - {}", bankName, accountNumber.replaceAll(".(?=.{4})", "*"));

        // Basic validation
        if (bankName == null || bankName.trim().isEmpty()) {
            return false;
        }

        if (accountNumber == null || accountNumber.length() < 8 || accountNumber.length() > 17) {
            return false;
        }

        // Support both US routing numbers (9 digits) and Thai bank codes (3 digits)
        if (routingNumber == null || (routingNumber.length() != 9 && routingNumber.length() != 3)) {
            return false;
        }

        // In production, you would:
        // 1. Validate against known bank routing numbers
        // 2. Check account number format for specific banks
        // 3. Potentially use third-party validation services

        return true;
    }

    /**
     * Process simulated withdrawal for testing
     */
    private String processSimulatedWithdrawal(Withdraw withdraw, Map<String, Object> transferParams) throws InterruptedException {
        log.info("[SIMULATION MODE] Processing withdrawal {} for amount: {}", withdraw.getId(), withdraw.getAmount());
        
        // Simulate processing delay
        Thread.sleep(SIMULATION_DELAY_MS);
        
        // Simulate success/failure based on success rate
        double random = Math.random();
        if (random > SIMULATION_SUCCESS_RATE) {
            log.warn("[SIMULATION MODE] Simulated failure for withdrawal {}", withdraw.getId());
            throw new RuntimeException("Simulated Stripe failure: Insufficient funds in platform account");
        }
        
        // Simulate different scenarios based on amount
        BigDecimal amount = withdraw.getAmount();
        String transferId;
        
        if (amount.compareTo(new BigDecimal("1000")) > 0) {
            // Large amounts get special handling
            transferId = "tr_sim_large_" + System.currentTimeMillis();
            log.info("[SIMULATION MODE] Large withdrawal processed: {}", transferId);
        } else if (amount.compareTo(new BigDecimal("10")) < 0) {
            // Small amounts might fail
            if (Math.random() > 0.8) {
                throw new RuntimeException("Simulated failure: Amount too small for processing");
            }
            transferId = "tr_sim_small_" + System.currentTimeMillis();
        } else {
            transferId = "tr_sim_" + System.currentTimeMillis();
        }
        
        log.info("[SIMULATION MODE] Withdrawal processed successfully. Transfer ID: {}", transferId);
        return transferId;
    }
    
    /**
     * Process real withdrawal through Stripe
     */
    private String processRealWithdrawal(Map<String, Object> transferParams) throws StripeException {
        log.info("[REAL MODE] Processing real Stripe withdrawal");
        
        // Real Stripe transfer creation
        Transfer transfer = Transfer.create(transferParams);
        
        log.info("[REAL MODE] Real withdrawal processed. Transfer ID: {}", transfer.getId());
        return transfer.getId();
    }

    /**
     * Get transfer status from Stripe
     */
    public String getTransferStatus(String transferId) {
        try {
            if (transferId.startsWith("tr_sim")) {
                // Simulate different statuses for demo
                if (transferId.contains("large")) {
                    return "pending"; // Large transfers might be pending
                }
                return "paid"; // Most simulated transfers are successful
            }

            Transfer transfer = Transfer.retrieve(transferId);
            return transfer.getObject(); // Returns "transfer" for successful transfers

        } catch (StripeException e) {
            log.error("Failed to retrieve transfer status for {}: {}", transferId, e.getMessage());
            return "failed";
        }
    }
    
    /**
     * Check if simulation mode is enabled
     */
    public boolean isSimulationMode() {
        return SIMULATION_MODE;
    }
    
    /**
     * Get simulation configuration info
     */
    public Map<String, Object> getSimulationInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("simulationMode", SIMULATION_MODE);
        info.put("successRate", SIMULATION_SUCCESS_RATE);
        info.put("delayMs", SIMULATION_DELAY_MS);
        return info;
    }

    /**
     * Calculate withdrawal fees (if any)
     */
    public BigDecimal calculateWithdrawalFee(BigDecimal amount) {
        // Example fee structure:
        // - Free for amounts over $100
        // - $2.50 fee for amounts under $100

        if (amount.compareTo(new BigDecimal("100.00")) >= 0) {
            return BigDecimal.ZERO;
        } else {
            return new BigDecimal("2.50");
        }
    }

    /**
     * Get estimated processing time for withdrawal
     */
    public String getEstimatedProcessingTime() {
        return "1-3 business days";
    }
}