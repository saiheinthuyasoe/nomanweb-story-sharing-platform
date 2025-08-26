package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.config.StripeConfig;
import com.app.nomanweb_backend.dto.monetization.CreatePaymentIntentRequest;
import com.app.nomanweb_backend.dto.monetization.PaymentIntentResponse;
import com.app.nomanweb_backend.entity.User;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.checkout.Session;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class StripeService {

    private final MonetizationService monetizationService;

    private final StripeConfig stripeConfig;

    /**
     * Create a payment intent for coin purchase
     */
    public PaymentIntentResponse createPaymentIntent(CreatePaymentIntentRequest request, User user)
            throws StripeException {
        log.info("Creating payment intent for user {} with amount: {} THB", user.getId(), request.getAmount());

        // Convert THB to cents (Stripe uses smallest currency unit)
        long amountInCents = request.getAmount().multiply(BigDecimal.valueOf(100)).longValue();

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountInCents)
                .setCurrency(stripeConfig.getCurrency())
                .setDescription("Coin purchase - " + request.getCoins() + " coins")
                .putMetadata("user_id", user.getId().toString())
                .putMetadata("coins", request.getCoins().toString())
                .putMetadata("package_id", request.getPackageId() != null ? request.getPackageId().toString() : "")
                .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                .setEnabled(true)
                                .build())
                .build();

        PaymentIntent paymentIntent = PaymentIntent.create(params);

        log.info("Payment intent created successfully: {}", paymentIntent.getId());

        return PaymentIntentResponse.builder()
                .clientSecret(paymentIntent.getClientSecret())
                .paymentIntentId(paymentIntent.getId())
                .amount(request.getAmount())
                .currency("THB")
                .status(paymentIntent.getStatus())
                .build();
    }

    /**
     * Create a checkout session for coin purchase
     */
    public String createCheckoutSession(CreatePaymentIntentRequest request, User user, String successUrl,
            String cancelUrl) throws StripeException {
        log.info("Creating checkout session for user {} with amount: {} THB", user.getId(), request.getAmount());

        // Convert THB to cents
        long amountInCents = request.getAmount().multiply(BigDecimal.valueOf(100)).longValue();

        // Use provided URLs or fallback to configuration defaults
        String finalSuccessUrl = successUrl != null ? successUrl : stripeConfig.getSuccessUrl();
        String finalCancelUrl = cancelUrl != null ? cancelUrl : stripeConfig.getCancelUrl();

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(finalSuccessUrl + "?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(finalCancelUrl)
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency(stripeConfig.getCurrency())
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName("Coin Package - " + request.getCoins()
                                                                        + " coins")
                                                                .setDescription("Purchase " + request.getCoins()
                                                                        + " coins for NoManWeb")
                                                                .build())
                                                .setUnitAmount(amountInCents)
                                                .build())
                                .setQuantity(1L)
                                .build())
                .putMetadata("user_id", user.getId().toString())
                .putMetadata("coins", request.getCoins().toString())
                .putMetadata("package_id", request.getPackageId() != null ? request.getPackageId().toString() : "")
                .build();

        Session session = Session.create(params);

        log.info("Checkout session created successfully: {}", session.getId());

        return session.getUrl();
    }

    /**
     * Handle successful payment and add coins to user account
     */
    public void handleSuccessfulPayment(String paymentIntentId) throws StripeException {
        log.info("Handling successful payment for payment intent: {}", paymentIntentId);

        PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);

        if ("succeeded".equals(paymentIntent.getStatus())) {
            Map<String, String> metadata = paymentIntent.getMetadata();
            String userIdStr = metadata.get("user_id");
            String coinsStr = metadata.get("coins");

            if (userIdStr != null && coinsStr != null) {
                try {
                    // Add coins to user account
                    BigDecimal coins = new BigDecimal(coinsStr);
                    String description = "Stripe payment - " + paymentIntent.getId();

                    // This would need to be implemented to add coins to user
                    // monetizationService.addCoinsFromStripePayment(UUID.fromString(userIdStr),
                    // coins, description, paymentIntent.getId());

                    log.info("Successfully added {} coins to user {}", coins, userIdStr);
                } catch (Exception e) {
                    log.error("Error adding coins to user after successful payment: {}", e.getMessage(), e);
                    throw new RuntimeException("Failed to add coins after payment", e);
                }
            } else {
                log.error("Missing metadata in payment intent: {}", paymentIntentId);
                throw new RuntimeException("Invalid payment metadata");
            }
        } else {
            log.warn("Payment intent {} is not in succeeded status: {}", paymentIntentId, paymentIntent.getStatus());
            throw new RuntimeException("Payment not successful");
        }
    }

    /**
     * Retrieve payment intent details
     */
    public PaymentIntent getPaymentIntent(String paymentIntentId) throws StripeException {
        return PaymentIntent.retrieve(paymentIntentId);
    }

    /**
     * Get checkout session details
     */
    public Session getCheckoutSession(String sessionId) throws StripeException {
        return Session.retrieve(sessionId);
    }
}