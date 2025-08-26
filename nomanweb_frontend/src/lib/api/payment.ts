import { apiClient } from "./client";

// Payment request types
export interface CreatePaymentIntentRequest {
  amount: number;
  coins: number;
  packageId: number;
  currency?: string;
  description?: string;
}

export interface CreateCheckoutSessionRequest {
  amount: number;
  coins: number;
  packageId: number;
  successUrl?: string;
  cancelUrl?: string;
  currency?: string;
}

// Payment response types
export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface StripeConfigResponse {
  publishableKey: string;
  currency: string;
}

// Payment API functions
export const paymentApi = {
  // Get Stripe configuration
  getStripeConfig: async (): Promise<StripeConfigResponse> => {
    const response = await apiClient.get("/api/stripe/config");
    return response.data;
  },

  // Create payment intent for card payments
  createPaymentIntent: async (
    request: CreatePaymentIntentRequest
  ): Promise<PaymentIntentResponse> => {
    const response = await apiClient.post(
      "/api/stripe/create-payment-intent",
      request
    );
    return response.data;
  },

  // Create checkout session for hosted checkout
  createCheckoutSession: async (
    request: CreateCheckoutSessionRequest
  ): Promise<CheckoutSessionResponse> => {
    const response = await apiClient.post(
      "/api/stripe/create-checkout-session",
      request
    );
    return response.data;
  },

  // Get payment intent details
  getPaymentIntent: async (
    paymentIntentId: string
  ): Promise<PaymentIntentResponse> => {
    const response = await apiClient.get(
      `/api/stripe/payment-intent/${paymentIntentId}`
    );
    return response.data;
  },
};
