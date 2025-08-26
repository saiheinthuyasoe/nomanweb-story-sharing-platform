"use client";

import React, { useState } from "react";
import { usePayment } from "@/contexts/PaymentContext";
import PaymentForm from "./PaymentForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, ExternalLink } from "lucide-react";
import { toast } from "react-hot-toast";

interface CoinPackage {
  id: number;
  coins: number;
  price: number; // in cents
  popular?: boolean;
  bonus?: number;
}

const coinPackages: CoinPackage[] = [
  { id: 1, coins: 100, price: 5000 }, // ฿50
  { id: 2, coins: 250, price: 12000, bonus: 25 }, // ฿120 + 25 bonus
  { id: 3, coins: 500, price: 22500, popular: true, bonus: 75 }, // ฿225 + 75 bonus
  { id: 4, coins: 1000, price: 40000, bonus: 200 }, // ฿400 + 200 bonus
  { id: 5, coins: 2500, price: 90000, bonus: 600 }, // ฿900 + 600 bonus
];

interface CoinPurchaseProps {
  onSuccess?: () => void;
}

const CoinPurchase: React.FC<CoinPurchaseProps> = ({ onSuccess }) => {
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(
    null
  );
  const [paymentMethod, setPaymentMethod] = useState<"card" | "checkout">(
    "card"
  );
  const { createCheckoutSession, redirectToCheckout, isLoading } = usePayment();

  const handlePackageSelect = (pkg: CoinPackage) => {
    setSelectedPackage(pkg);
  };

  const handleCheckoutPayment = async (pkg: CoinPackage) => {
    try {
      const sessionId = await createCheckoutSession({
        amount: pkg.price,
        coins: pkg.coins + (pkg.bonus || 0),
        packageId: pkg.id,
      });

      if (sessionId) {
        await redirectToCheckout(sessionId);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout process");
    }
  };

  const handlePaymentSuccess = () => {
    setSelectedPackage(null);
    toast.success("Coins added to your account!");
    onSuccess?.();
  };

  const handlePaymentError = (error: string) => {
    console.error("Payment error:", error);
  };

  if (selectedPackage && paymentMethod === "card") {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => setSelectedPackage(null)}
          className="mb-4"
        >
          ← Back to packages
        </Button>

        <PaymentForm
          amount={selectedPackage.price}
          coins={selectedPackage.coins + (selectedPackage.bonus || 0)}
          packageId={selectedPackage.id}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Purchase Coins</h2>
        <p className="text-gray-600">
          Choose a coin package to support your favorite authors
        </p>
      </div>

      <Tabs
        value={paymentMethod}
        onValueChange={(value) =>
          setPaymentMethod(value as "card" | "checkout")
        }
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="card" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Card Payment
          </TabsTrigger>
          <TabsTrigger value="checkout" className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Stripe Checkout
          </TabsTrigger>
        </TabsList>

        <TabsContent value="card" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coinPackages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  pkg.popular ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => handlePackageSelect(pkg)}
              >
                <CardHeader className="text-center">
                  {pkg.popular && (
                    <Badge className="w-fit mx-auto mb-2" variant="default">
                      Most Popular
                    </Badge>
                  )}
                  <CardTitle className="text-xl">
                    {pkg.coins} Coins
                    {pkg.bonus && (
                      <span className="text-green-600">
                        {" "}
                        + {pkg.bonus} Bonus
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    ฿{(pkg.price / 100).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    ฿
                    {(pkg.price / 100 / (pkg.coins + (pkg.bonus || 0))).toFixed(
                      3
                    )}{" "}
                    per coin
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="checkout" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coinPackages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`transition-all hover:shadow-lg ${
                  pkg.popular ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <CardHeader className="text-center">
                  {pkg.popular && (
                    <Badge className="w-fit mx-auto mb-2" variant="default">
                      Most Popular
                    </Badge>
                  )}
                  <CardTitle className="text-xl">
                    {pkg.coins} Coins
                    {pkg.bonus && (
                      <span className="text-green-600">
                        {" "}
                        + {pkg.bonus} Bonus
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="text-2xl font-bold text-blue-600">
                    ฿{(pkg.price / 100).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">
                    ฿
                    {(pkg.price / 100 / (pkg.coins + (pkg.bonus || 0))).toFixed(
                      3
                    )}{" "}
                    per coin
                  </div>
                  <Button
                    onClick={() => handleCheckoutPayment(pkg)}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? "Processing..." : "Buy Now"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CoinPurchase;
