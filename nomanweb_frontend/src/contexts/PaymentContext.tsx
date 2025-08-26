"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  paymentApi,
  CreatePaymentIntentRequest,
  CreateCheckoutSessionRequest,
} from "@/lib/api/payment";
import { toast } from "react-hot-toast";

interface PaymentContextType {
  isLoading: boolean;
  createPaymentIntent: (
    request: CreatePaymentIntentRequest
  ) => Promise<string | null>;
  createCheckoutSession: (
    request: CreateCheckoutSessionRequest
  ) => Promise<string | null>;
  redirectToCheckout: (sessionId: string) => Promise<void>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error("usePayment must be used within a PaymentProvider");
  }
  return context;
};

interface PaymentProviderProps {
  children: ReactNode;
}

export const PaymentProvider: React.FC<PaymentProviderProps> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const createPaymentIntent = async (
    request: CreatePaymentIntentRequest
  ): Promise<string | null> => {
    setIsLoading(true);
    try {
      const response = await paymentApi.createPaymentIntent(request);
      return response.clientSecret;
    } catch (error) {
      console.error("Error creating payment intent:", error);
      toast.error("Failed to create payment intent");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const createCheckoutSession = async (
    request: CreateCheckoutSessionRequest
  ): Promise<string | null> => {
    setIsLoading(true);
    try {
      const response = await paymentApi.createCheckoutSession(request);
      return response.sessionId;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.error("Failed to create checkout session");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const redirectToCheckout = async (sessionId: string): Promise<void> => {
    try {
      const stripe = await import("@/lib/stripe").then((mod) => mod.default);
      const stripeInstance = await stripe;

      if (!stripeInstance) {
        throw new Error("Stripe failed to initialize");
      }

      const { error } = await stripeInstance.redirectToCheckout({ sessionId });

      if (error) {
        console.error("Error redirecting to checkout:", error);
        toast.error("Failed to redirect to checkout");
      }
    } catch (error) {
      console.error("Error redirecting to checkout:", error);
      toast.error("Failed to redirect to checkout");
    }
  };

  const value: PaymentContextType = {
    isLoading,
    createPaymentIntent,
    createCheckoutSession,
    redirectToCheckout,
  };

  return (
    <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>
  );
};
