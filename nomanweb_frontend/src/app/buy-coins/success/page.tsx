"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Coins, ArrowRight, Home } from "lucide-react";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";
import { useAuth } from "@/contexts/AuthContext";

interface PaymentResult {
  success: boolean;
  paymentIntentId: string;
  packageName?: string;
  coinsAdded: number;
  amountTotal: number;
  currency: string;
  transactionId?: string;
}

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      // Wait for auth to load
      if (authLoading) {
        return;
      }

      // Check if user is authenticated
      if (!user) {
        setError("Please log in to verify your payment");
        setLoading(false);
        return;
      }

      const sessionId = searchParams.get("session_id");

      if (!sessionId) {
        setError("Payment session not found");
        setLoading(false);
        return;
      }

      try {
        // Verify payment with backend
        const response = await fetch("/api/stripe/verify-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
          body: JSON.stringify({
            sessionId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Payment verification failed");
        }

        const result = await response.json();
        setPaymentResult(result);

        if (result.success) {
          toast.success(
            `Successfully added ${result.coinsAdded} coins to your account!`
          );
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setError(
          error instanceof Error ? error.message : "Payment verification failed"
        );
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, user, authLoading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600 text-2xl">✕</span>
            </div>
            <CardTitle className="text-red-600">
              Payment Verification Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">{error}</p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => router.push("/buy-coins")}
                className="w-full"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!paymentResult?.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600 text-2xl">✕</span>
            </div>
            <CardTitle className="text-red-600">Payment Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Your payment could not be processed. Please try again.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => router.push("/buy-coins")}
                className="w-full"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-green-600 text-2xl">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Details */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Package:</span>
              <span className="font-medium">{paymentResult.packageName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Amount Paid:</span>
              <span className="font-medium">
                {(paymentResult.amountTotal / 100).toFixed(2)}{" "}
                {paymentResult.currency.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Coins Added:</span>
              <span className="font-medium text-green-600 flex items-center gap-1">
                <Coins className="h-4 w-4" />
                {paymentResult.coinsAdded.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="font-mono text-xs text-gray-500">
                {paymentResult.transactionId}
              </span>
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Your coins have been added to your account and are ready to use!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/buy-coins")}
              className="w-full"
            >
              Buy More Coins
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Receipt Info */}
          <div className="text-center text-xs text-gray-500">
            <p>A receipt has been sent to your email address.</p>
            <p className="mt-1">Keep this transaction ID for your records.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
