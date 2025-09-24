"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Coins,
  CreditCard,
  Smartphone,
  ArrowLeft,
  Star,
  Crown,
  Gem,
  MessageCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Cookies from 'js-cookie';

interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  bonusCoins?: number;
  totalCoins: number;
  price: number; // THB price
  currency: string; // Always 'THB'
  description: string;
  isActive: boolean;
  createdAt: string;
}

export default function BuyCoinsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"line_pay" | "promptpay">(
    "line_pay"
  );
  const [loading, setLoading] = useState(false);
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);

  // Fetch coin packages from backend
  const fetchCoinPackages = async () => {
    try {
      setPackagesLoading(true);
      const response = await fetch("/api/coins/packages");

      if (!response.ok) {
        throw new Error("Failed to fetch coin packages");
      }

      const packages = await response.json();
      setCoinPackages(packages);
    } catch (error) {
      console.error("Error fetching coin packages:", error);
      toast.error("Failed to load coin packages. Please refresh the page.");

      // Fallback to hardcoded packages for demo
      setCoinPackages([
        {
          id: "starter",
          name: "Starter Pack",
          coins: 100,
          totalCoins: 100,
          price: 1015,
          currency: "THB",
          description: "Perfect for trying out premium content",
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "popular",
          name: "Popular Pack",
          coins: 500,
          bonusCoins: 50,
          totalCoins: 550,
          price: 4865,
          currency: "THB",
          description: "Best value for regular readers",
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setPackagesLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCoinPackages();
  }, []);

  // Set up real-time updates using Server-Sent Events
  useEffect(() => {
    if (typeof window === "undefined") return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectSSE = () => {
      try {
        eventSource = new EventSource("/api/sse/coin-packages");

        eventSource.onopen = () => {
          console.log("✅ Connected to coin packages real-time updates");
        };

        eventSource.onmessage = (event) => {
          console.log("📨 SSE message received:", event.data);
          try {
            const data = JSON.parse(event.data);
            console.log("📦 Parsed SSE data:", data);

            switch (data.type) {
              case "PACKAGE_UPDATED":
                console.log("🔄 Package updated:", data.package);
                setCoinPackages((prev) => {
                  // Only show active packages on buy-coins page
                  if (!data.package.isActive) {
                    // If package was deactivated, remove it
                    const filtered = prev.filter(
                      (pkg) => pkg.id !== data.package.id
                    );
                    console.log(
                      "📝 Package deactivated, filtered list:",
                      filtered
                    );
                    return filtered;
                  } else {
                    // Update the package
                    const updated = prev.map((pkg) =>
                      pkg.id === data.package.id ? data.package : pkg
                    );
                    console.log("📝 Updated packages list:", updated);
                    return updated;
                  }
                });
                toast.success(`Package "${data.package.name}" updated!`);
                break;
              case "PACKAGE_DELETED":
                console.log("🗑️ Package deleted:", data.packageId);
                setCoinPackages((prev) => {
                  const filtered = prev.filter(
                    (pkg) => pkg.id !== data.packageId
                  );
                  console.log("📝 Filtered packages list:", filtered);
                  return filtered;
                });
                toast.success("Package deleted!");
                break;
              case "PACKAGE_CREATED":
                console.log("➕ Package created:", data.package);
                // Only add active packages to buy-coins page
                if (data.package.isActive) {
                  setCoinPackages((prev) => {
                    // Check if package already exists to avoid duplicates
                    const exists = prev.some(
                      (pkg) => pkg.id === data.package.id
                    );
                    if (!exists) {
                      const added = [...prev, data.package];
                      console.log("📝 Added to packages list:", added);
                      return added;
                    }
                    return prev;
                  });
                  toast.success(`New package "${data.package.name}" added!`);
                } else {
                  console.log(
                    "📝 Package created but inactive, not adding to buy-coins page"
                  );
                }
                break;
              case "PACKAGES_REFRESH":
                console.log("🔄 Refreshing all packages");
                fetchCoinPackages();
                break;
              case "CONNECTED":
                console.log("🔌 SSE connection established");
                break;
              case "HEARTBEAT":
                console.log("💓 SSE heartbeat");
                break;
              case "TEST_MESSAGE":
                console.log("🧪 Test message received:", data);
                toast.success("✅ Test message received! SSE is working!");
                break;
              default:
                console.log("❓ Unknown SSE message type:", data.type);
            }
          } catch (error) {
            console.error(
              "❌ Error parsing SSE message:",
              error,
              "Raw data:",
              event.data
            );
          }
        };

        eventSource.onerror = (error) => {
          console.error("SSE error:", error);
          eventSource?.close();

          // Reconnect after 3 seconds
          reconnectTimeout = setTimeout(() => {
            connectSSE();
          }, 3000);
        };
      } catch (error) {
        console.error("Failed to connect to SSE:", error);
        reconnectTimeout = setTimeout(() => {
          connectSSE();
        }, 3000);
      }
    };

    connectSSE();

    return () => {
      eventSource?.close();
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  const handlePurchase = async () => {
    if (!selectedPackage) {
      toast.error("Please select a coin package");
      return;
    }

    const selectedPkg = coinPackages.find(p => p.id === selectedPackage);
    if (!selectedPkg) {
      toast.error("Selected package not found");
      return;
    }

    setLoading(true);
    try {
      // Get Stripe configuration
      const configResponse = await fetch('/api/stripe/config');
      if (!configResponse.ok) {
        throw new Error('Failed to get Stripe configuration');
      }
      const { publishableKey } = await configResponse.json();

      // Dynamically import Stripe
      const { loadStripe } = await import('@stripe/stripe-js');
      const stripe = await loadStripe(publishableKey, {
        locale: 'en'
      });
      
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      // Create Stripe Checkout Session
      const paymentResponse = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('token')}`,
        },
        body: JSON.stringify({
          packageId: selectedPackage,
          amount: selectedPkg.price,
          coins: selectedPkg.coins,
          currency: 'THB',
          successUrl: `${window.location.origin}/buy-coins/success`,
          cancelUrl: `${window.location.origin}/buy-coins`,
        }),
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.message || 'Failed to create checkout session');
      }

      const { url } = await paymentResponse.json();

      // Redirect to Stripe Checkout URL
      window.location.href = url;
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error(error instanceof Error ? error.message : 'Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return "";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Buy Coins</h1>
        <p className="text-gray-600">
          Purchase coins to unlock premium content and send gifts to your
          favorite authors
        </p>


      </div>

      {/* Current Balance */}
      <Card className="mb-8 text-white" style={{backgroundColor: '#18243c'}}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-6 w-6" />
            Current Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {user?.coinBalance || 0} Coins
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coin Packages */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Choose a Coin Package
          </h2>

          {packagesLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">
                Loading coin packages...
              </span>
            </div>
          ) : coinPackages.length === 0 ? (
            <div className="text-center py-12">
              <Coins className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">
                No coin packages available at the moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {coinPackages.map((package_) => {
                const Icon = Coins;
                const totalCoins =
                  package_.totalCoins ||
                  package_.coins + (package_.bonusCoins || 0);
                const isSelected = selectedPackage === package_.id;

                return (
                  <Card
                    key={package_.id}
                    className={`relative cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "ring-2 ring-blue-500 shadow-lg"
                        : "hover:shadow-md"
                    }`}
                    onClick={() => setSelectedPackage(package_.id)}
                  >
                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-2">
                        <Icon
                          className={`h-8 w-8 ${
                            isSelected ? "text-blue-500" : "text-gray-500"
                          }`}
                        />
                      </div>
                      <CardTitle className="text-lg">{package_.name}</CardTitle>
                      <p className="text-sm text-gray-600">
                        {package_.description}
                      </p>
                    </CardHeader>

                    <CardContent className="text-center">
                      <div className="mb-4">
                        <div className="text-2xl font-bold text-gray-900">
                          {package_.coins.toLocaleString()} Coins
                        </div>

                      </div>

                      <div className="text-xl font-bold text-blue-600">
                        {formatPrice(package_.price)}
                      </div>


                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Manual Purchase Section */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Need Help with Your Purchase?
            </h2>
            <div className="flex justify-start">
              <Button
                onClick={() => {
                  // Open LINE app or web version
                  const lineUrl = "https://line.me/R/ti/p/@258sxtpv";
                  window.open(lineUrl, "_blank");
                  toast.success("Opening LINE to contact admin...");
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Admin on LINE
              </Button>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedPackage ? (
                <>
                  {/* Selected Package Summary */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">
                      Selected Package
                    </h3>
                    {(() => {
                      const package_ = coinPackages.find(
                        (p) => p.id === selectedPackage
                      );
                      if (!package_) return null;

                      const totalCoins =
                        package_.totalCoins ||
                        package_.coins + (package_.bonusCoins || 0);

                      return (
                        <div>
                          <div className="text-lg font-semibold">
                            {package_.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {package_.coins.toLocaleString()} Coins
                            {package_.bonusCoins && (
                              <span className="text-green-600">
                                {" "}
                                + {package_.bonusCoins} Bonus
                              </span>
                            )}
                          </div>
                          <div className="text-lg font-bold text-blue-600 mt-1">
                            {formatPrice(package_.price)}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Payment Method */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">
                      Payment Method
                    </h3>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 bg-blue-50 border-blue-200">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          checked={true}
                          readOnly
                          className="text-blue-600"
                        />
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        <div className="flex-1">
                          <span className="font-medium">Credit/Debit Card</span>
                          <div className="text-xs text-gray-600 mt-1">
                            Powered by Stripe - Secure payment processing
                          </div>
                        </div>
                      </label>
                      
                      <div className="text-xs text-gray-500 px-3 py-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">Accepted cards:</span>
                        </div>
                        <div className="text-gray-600">
                          Visa, Mastercard, American Express, and more
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Purchase Button */}
                  <Button
                    onClick={handlePurchase}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </div>
                    ) : (
                      "Purchase Coins"
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Coins className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Select a coin package to continue</p>
                </div>
              )}

              {/* Info */}
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Coins never expire</p>
                <p>• Secure payment processing</p>
                <p>• Instant coin delivery</p>
                <p>• 24/7 customer support</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
