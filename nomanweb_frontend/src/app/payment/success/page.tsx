"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

const PaymentSuccessPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<{
    sessionId?: string;
    amount?: number;
    coins?: number;
  } | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    if (sessionId) {
      // In a real implementation, you might want to verify the session with your backend
      setPaymentDetails({ sessionId });
      toast.success("Payment completed successfully!");
    } else {
      toast.error("Invalid payment session");
    }

    setIsLoading(false);
  }, [searchParams]);

  const handleContinue = () => {
    router.push("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Verifying payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-600">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Your payment has been processed successfully. Your coins have been
            added to your account.
          </p>

          {paymentDetails?.sessionId && (
            <div className="bg-gray-100 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                Session ID:{" "}
                <span className="font-mono">{paymentDetails.sessionId}</span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Button onClick={handleContinue} className="w-full">
              Continue to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/coins")}
              className="w-full"
            >
              Buy More Coins
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;
