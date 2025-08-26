"use client";

import React, { useState } from "react";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import stripePromise from "@/lib/stripe";
import { usePayment } from "@/contexts/PaymentContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-hot-toast";

interface PaymentFormProps {
  amount: number;
  coins: number;
  packageId: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const CheckoutForm: React.FC<PaymentFormProps> = ({
  amount,
  coins,
  packageId,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { createPaymentIntent } = usePayment();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent
      const clientSecret = await createPaymentIntent({
        amount,
        coins,
        packageId,
        description: `Purchase ${coins} coins`,
      });

      if (!clientSecret) {
        throw new Error("Failed to create payment intent");
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (error) {
        console.error("Payment failed:", error);
        toast.error(error.message || "Payment failed");
        onError?.(error.message || "Payment failed");
      } else if (paymentIntent.status === "succeeded") {
        toast.success("Payment successful!");
        onSuccess?.();
      }
    } catch (error) {
      console.error("Payment error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Payment failed";
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#424770",
                "::placeholder": {
                  color: "#aab7c4",
                },
              },
              invalid: {
                color: "#9e2146",
              },
            },
          }}
        />
      </div>

      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>Amount: ฿{(amount / 100).toFixed(2)}</span>
        <span>Coins: {coins}</span>
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? "Processing..." : `Pay ฿${(amount / 100).toFixed(2)}`}
      </Button>
    </form>
  );
};

const PaymentForm: React.FC<PaymentFormProps> = (props) => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <Elements stripe={stripePromise}>
          <CheckoutForm {...props} />
        </Elements>
      </CardContent>
    </Card>
  );
};

export default PaymentForm;
