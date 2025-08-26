"use client";

import React from "react";
import { PaymentProvider } from "@/contexts/PaymentContext";
import CoinPurchase from "@/components/payment/CoinPurchase";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const CoinsPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handlePurchaseSuccess = () => {
    // Optionally refresh user data or redirect
    router.refresh();
  };

  return (
    <PaymentProvider>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Purchase Coins
              </h1>
              <p className="text-gray-600">
                Support your favorite authors and unlock premium content
              </p>
              {user.coinBalance !== undefined && (
                <div className="mt-4 inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
                  <span className="font-semibold">
                    Current Balance: {user.coinBalance} coins
                  </span>
                </div>
              )}
            </div>

            {/* Coin Purchase Component */}
            <CoinPurchase onSuccess={handlePurchaseSuccess} />

            {/* Information Section */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-lg mb-2">
                  💰 Support Authors
                </h3>
                <p className="text-gray-600 text-sm">
                  Your coin purchases directly support the authors you love and
                  help them continue creating amazing content.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-lg mb-2">
                  🔓 Unlock Content
                </h3>
                <p className="text-gray-600 text-sm">
                  Use coins to unlock premium chapters, exclusive stories, and
                  special content from your favorite authors.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-lg mb-2">🎁 Send Gifts</h3>
                <p className="text-gray-600 text-sm">
                  Show appreciation by sending virtual gifts to authors and
                  fellow readers in the community.
                </p>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Secure Payment Processing
                  </h3>
                  <div className="mt-1 text-sm text-green-700">
                    <p>
                      All payments are processed securely through Stripe. We
                      never store your payment information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PaymentProvider>
  );
};

export default CoinsPage;
