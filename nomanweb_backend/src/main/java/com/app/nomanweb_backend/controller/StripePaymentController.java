package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.config.StripeConfig;
import com.app.nomanweb_backend.dto.monetization.CreateCheckoutSessionRequest;
import com.app.nomanweb_backend.dto.monetization.CreatePaymentIntentRequest;
import com.app.nomanweb_backend.dto.monetization.PaymentIntentResponse;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.service.AuthService;
import com.app.nomanweb_backend.service.MonetizationService;
import com.app.nomanweb_backend.service.StripeService;
import com.app.nomanweb_backend.util.JwtUtil;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/stripe")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Stripe Payment", description = "Stripe payment processing APIs")
public class StripePaymentController {

    private final StripeService stripeService;
    private final AuthService authService;
    private final MonetizationService monetizationService;
    private final JwtUtil jwtUtil;
    private final StripeConfig stripeConfig;

    @Value("${stripe.webhook.secret:whsec_test_secret}")
    private String webhookSecret;

    @GetMapping("/config")
    @Operation(summary = "Get Stripe configuration")
    public ResponseEntity<Map<String, String>> getStripeConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("publishableKey", stripeConfig.getPublishableKey());
        return ResponseEntity.ok(config);
    }

    @PostMapping("/create-payment-intent")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Create a payment intent for coin purchase")
    public ResponseEntity<PaymentIntentResponse> createPaymentIntent(
            @Valid @RequestBody CreatePaymentIntentRequest request,
            @RequestHeader("Authorization") String token) {

        try {
            UUID userId = jwtUtil.getUserIdFromToken(token.substring(7));
            User currentUser = authService.getCurrentUser(userId);

            PaymentIntentResponse response = stripeService.createPaymentIntent(request, currentUser);

            log.info("Payment intent created for user {}: {}", currentUser.getId(), response.getPaymentIntentId());

            return ResponseEntity.ok(response);
        } catch (StripeException e) {
            log.error("Error creating payment intent: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error creating payment intent: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/create-checkout-session")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Create a checkout session for coin purchase")
    public ResponseEntity<Map<String, String>> createCheckoutSession(
            @Valid @RequestBody CreateCheckoutSessionRequest request,
            @RequestHeader("Authorization") String token) {

        try {
            UUID userId = jwtUtil.getUserIdFromToken(token.substring(7));
            User currentUser = authService.getCurrentUser(userId);

            String sessionUrl = stripeService.createCheckoutSession(
                    CreatePaymentIntentRequest.builder()
                            .amount(request.getAmount())
                            .coins(request.getCoins())
                            .packageId(request.getPackageId())
                            .currency(request.getCurrency())
                            .build(),
                    currentUser,
                    request.getSuccessUrl(),
                    request.getCancelUrl());

            Map<String, String> response = new HashMap<>();
            response.put("url", sessionUrl);

            log.info("Checkout session created for user {}", currentUser.getId());

            return ResponseEntity.ok(response);
        } catch (StripeException e) {
            log.error("Error creating checkout session: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error creating checkout session: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/webhook")
    @Operation(summary = "Handle Stripe webhooks")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        Event event;

        try {
            event = Webhook.constructEvent(payload, sigHeader, stripeConfig.getWebhookSecret());
        } catch (SignatureVerificationException e) {
            log.error("Invalid signature in Stripe webhook: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Invalid signature");
        }

        log.info("Received Stripe webhook event: {}", event.getType());

        try {
            switch (event.getType()) {
                case "payment_intent.succeeded":
                    handlePaymentIntentSucceeded(event);
                    break;
                case "payment_intent.payment_failed":
                    handlePaymentIntentFailed(event);
                    break;
                case "checkout.session.completed":
                    handleCheckoutSessionCompleted(event);
                    break;
                default:
                    log.info("Unhandled event type: {}", event.getType());
            }

            return ResponseEntity.ok("Success");
        } catch (Exception e) {
            log.error("Error handling webhook event: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Error processing webhook");
        }
    }

    @GetMapping("/payment-intent/{paymentIntentId}")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get payment intent details")
    public ResponseEntity<Map<String, Object>> getPaymentIntent(
            @PathVariable String paymentIntentId,
            @RequestHeader("Authorization") String token) {

        try {
            UUID userId = jwtUtil.getUserIdFromToken(token.substring(7));
            User currentUser = authService.getCurrentUser(userId);

            PaymentIntent paymentIntent = stripeService.getPaymentIntent(paymentIntentId);

            // Verify the payment intent belongs to the current user
            String userIdFromMetadata = paymentIntent.getMetadata().get("user_id");
            if (!currentUser.getId().toString().equals(userIdFromMetadata)) {
                return ResponseEntity.status(403).build();
            }

            Map<String, Object> response = new HashMap<>();
            response.put("id", paymentIntent.getId());
            response.put("status", paymentIntent.getStatus());
            response.put("amount", paymentIntent.getAmount());
            response.put("currency", paymentIntent.getCurrency());
            response.put("metadata", paymentIntent.getMetadata());

            return ResponseEntity.ok(response);
        } catch (StripeException e) {
            log.error("Error retrieving payment intent: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error retrieving payment intent: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/verify-session")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Verify checkout session and get session details")
    public ResponseEntity<Map<String, Object>> verifySession(
            @RequestBody Map<String, String> request,
            @RequestHeader("Authorization") String token) {

        try {
            String sessionId = request.get("sessionId");
            if (sessionId == null || sessionId.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            UUID userId = jwtUtil.getUserIdFromToken(token.substring(7));
            User currentUser = authService.getCurrentUser(userId);

            Session session = stripeService.getCheckoutSession(sessionId);

            // Verify the session belongs to the current user
            String userIdFromMetadata = session.getMetadata().get("user_id");
            if (!currentUser.getId().toString().equals(userIdFromMetadata)) {
                return ResponseEntity.status(403).build();
            }

            Map<String, Object> response = new HashMap<>();
            response.put("sessionId", session.getId());
            response.put("status", session.getStatus());
            response.put("paymentStatus", session.getPaymentStatus());
            response.put("amountTotal", session.getAmountTotal());
            response.put("currency", session.getCurrency());
            response.put("metadata", session.getMetadata());
            
            // Add package name and transaction ID
            String packageIdStr = session.getMetadata().get("package_id");
            if (packageIdStr != null) {
                response.put("packageName", "Coin Package #" + packageIdStr);
            } else {
                response.put("packageName", "Coin Purchase");
            }
            response.put("transactionId", session.getId());
            
            // Check if payment was successful
            boolean success = "complete".equals(session.getStatus()) && "paid".equals(session.getPaymentStatus());
            response.put("success", success);
            
            if (success) {
                String coinsStr = session.getMetadata().get("coins");
                if (coinsStr != null) {
                    BigDecimal coins = new BigDecimal(coinsStr);
                    response.put("coinsAdded", coins);
                    
                    // Add coins to user account if not already added
                    try {
                        monetizationService.addCoins(currentUser, coins, 
                            "Stripe checkout - " + session.getId(), session.getId());
                        log.info("Successfully added {} coins to user {} from session verification {}",
                                coins, currentUser.getId(), session.getId());
                    } catch (Exception e) {
                        log.error("Error adding coins during session verification: {}", e.getMessage(), e);
                        // Don't fail the verification, just log the error
                    }
                }
            }

            return ResponseEntity.ok(response);
        } catch (StripeException e) {
            log.error("Error verifying checkout session: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error verifying checkout session: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    private void handlePaymentIntentSucceeded(Event event) {
        PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer().getObject().orElse(null);
        if (paymentIntent != null) {
            try {
                String userIdStr = paymentIntent.getMetadata().get("user_id");
                String coinsStr = paymentIntent.getMetadata().get("coins");

                if (userIdStr != null && coinsStr != null) {
                    UUID userId = UUID.fromString(userIdStr);
                    BigDecimal coins = new BigDecimal(coinsStr);

                    // Add coins to user account
                    User user = authService.getCurrentUser(userId);
                    monetizationService.addCoins(user, coins, "Stripe payment - " + paymentIntent.getId(),
                            paymentIntent.getId());

                    log.info("Successfully added {} coins to user {} from payment {}",
                            coins, userId, paymentIntent.getId());
                } else {
                    log.error("Missing metadata in successful payment intent: {}", paymentIntent.getId());
                }
            } catch (Exception e) {
                log.error("Error processing successful payment: {}", e.getMessage(), e);
            }
        }
    }

    private void handlePaymentIntentFailed(Event event) {
        PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer().getObject().orElse(null);
        if (paymentIntent != null) {
            log.warn("Payment failed for payment intent: {}", paymentIntent.getId());
            // Could implement notification to user about failed payment
        }
    }

    private void handleCheckoutSessionCompleted(Event event) {
        Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
        if (session != null) {
            try {
                String userIdStr = session.getMetadata().get("user_id");
                String coinsStr = session.getMetadata().get("coins");

                if (userIdStr != null && coinsStr != null) {
                    UUID userId = UUID.fromString(userIdStr);
                    BigDecimal coins = new BigDecimal(coinsStr);

                    // Add coins to user account
                    User user = authService.getCurrentUser(userId);
                    monetizationService.addCoins(user, coins, "Stripe checkout - " + session.getId(), session.getId());

                    log.info("Successfully added {} coins to user {} from checkout session {}",
                            coins, userId, session.getId());
                } else {
                    log.error("Missing metadata in completed checkout session: {}", session.getId());
                }
            } catch (Exception e) {
                log.error("Error processing completed checkout session: {}", e.getMessage(), e);
            }
        }
    }
}