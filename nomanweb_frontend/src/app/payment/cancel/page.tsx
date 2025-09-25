"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

const PaymentCancelPage: React.FC = () => {
  const router = useRouter();

  const handleTryAgain = () => {
    router.push("/coins");
  };

  const handleGoHome = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="w-16 h-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl text-red-600">
            Payment Cancelled
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Your payment was cancelled. No charges have been made to your
            account.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              💡 You can try again anytime or choose a different payment method.
            </p>
          </div>

          <div className="space-y-2">
            <Button onClick={handleTryAgain} className="w-full">
              Try Again
            </Button>
            <Button variant="outline" onClick={handleGoHome} className="w-full">
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCancelPage;
