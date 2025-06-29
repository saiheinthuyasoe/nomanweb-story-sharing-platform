'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, CreditCard, Smartphone, ArrowLeft, Star, Crown, Gem } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price: number;
  bonusCoins?: number;
  popular?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const coinPackages: CoinPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    coins: 100,
    price: 29,
    icon: Coins,
    description: 'Perfect for trying out premium content'
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    coins: 500,
    price: 139,
    bonusCoins: 50,
    popular: true,
    icon: Star,
    description: 'Best value for regular readers'
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    coins: 1000,
    price: 269,
    bonusCoins: 150,
    icon: Crown,
    description: 'For dedicated story enthusiasts'
  },
  {
    id: 'ultimate',
    name: 'Ultimate Pack',
    coins: 2500,
    price: 649,
    bonusCoins: 500,
    icon: Gem,
    description: 'Maximum value for serious collectors'
  }
];

export default function BuyCoinsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'line_pay' | 'promptpay'>('line_pay');
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (!selectedPackage) {
      toast.error('Please select a coin package');
      return;
    }

    const package_ = coinPackages.find(p => p.id === selectedPackage);
    if (!package_) return;

    setLoading(true);

    try {
      // For now, this is a placeholder - in a real implementation, you'd integrate with payment providers
      toast.success('🚧 Payment integration coming soon! This is a demo version.');
      
      // Simulate successful purchase for demo
      setTimeout(() => {
        toast.success(`Successfully purchased ${package_.name}!`);
        router.push('/dashboard/monetization');
      }, 2000);

    } catch (error) {
      console.error('Purchase failed:', error);
      toast.error('Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(price);
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
        <p className="text-gray-600">Purchase coins to unlock premium content and send gifts to your favorite authors</p>
      </div>

      {/* Current Balance */}
      <Card className="mb-8 bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-6 w-6" />
            Current Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{user?.coinBalance || 0} Coins</div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coin Packages */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Choose a Coin Package</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coinPackages.map((package_) => {
              const Icon = package_.icon;
              const totalCoins = package_.coins + (package_.bonusCoins || 0);
              const isSelected = selectedPackage === package_.id;
              
              return (
                <Card
                  key={package_.id}
                  className={`relative cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'ring-2 ring-blue-500 shadow-lg'
                      : 'hover:shadow-md'
                  } ${
                    package_.popular
                      ? 'border-orange-500 border-2'
                      : ''
                  }`}
                  onClick={() => setSelectedPackage(package_.id)}
                >
                  {package_.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        MOST POPULAR
                      </span>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-2">
                      <Icon className={`h-8 w-8 ${
                        package_.popular ? 'text-orange-500' : 'text-blue-500'
                      }`} />
                    </div>
                    <CardTitle className="text-lg">{package_.name}</CardTitle>
                    <p className="text-sm text-gray-600">{package_.description}</p>
                  </CardHeader>
                  
                  <CardContent className="text-center">
                    <div className="mb-4">
                      <div className="text-2xl font-bold text-gray-900">
                        {package_.coins.toLocaleString()} Coins
                      </div>
                      {package_.bonusCoins && (
                        <div className="text-sm text-green-600 font-medium">
                          +{package_.bonusCoins} Bonus Coins
                        </div>
                      )}
                      {package_.bonusCoins && (
                        <div className="text-xs text-gray-500">
                          Total: {totalCoins.toLocaleString()} Coins
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xl font-bold text-blue-600">
                      {formatPrice(package_.price)}
                    </div>
                    
                    {package_.bonusCoins && (
                      <div className="text-xs text-green-600 mt-1">
                        Save {Math.round((package_.bonusCoins / package_.coins) * 100)}%
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
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
                    <h3 className="font-medium text-gray-900 mb-2">Selected Package</h3>
                    {(() => {
                      const package_ = coinPackages.find(p => p.id === selectedPackage);
                      if (!package_) return null;
                      
                      const totalCoins = package_.coins + (package_.bonusCoins || 0);
                      
                      return (
                        <div>
                          <div className="text-lg font-semibold">{package_.name}</div>
                          <div className="text-sm text-gray-600">
                            {package_.coins.toLocaleString()} Coins
                            {package_.bonusCoins && (
                              <span className="text-green-600">
                                {' '}+ {package_.bonusCoins} Bonus
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
                    <h3 className="font-medium text-gray-900 mb-3">Payment Method</h3>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="line_pay"
                          checked={paymentMethod === 'line_pay'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'line_pay')}
                          className="text-blue-600"
                        />
                        <Smartphone className="h-5 w-5 text-green-600" />
                        <span className="font-medium">LINE Pay</span>
                      </label>
                      
                      <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="promptpay"
                          checked={paymentMethod === 'promptpay'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'promptpay')}
                          className="text-blue-600"
                        />
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">PromptPay</span>
                      </label>
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
                      'Purchase Coins'
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