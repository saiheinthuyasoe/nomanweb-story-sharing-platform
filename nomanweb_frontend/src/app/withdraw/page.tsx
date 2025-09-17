'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, CreditCard, Banknote, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api/auth';
import { toast } from 'react-hot-toast';

const COIN_TO_THB_RATE = 1.00; // 1 coin = ฿1.00
const MIN_WITHDRAWAL_AMOUNT = 50; // ฿50 minimum
const MAX_WITHDRAWAL_AMOUNT = 1000; // ฿1,000 maximum

interface WithdrawalHistory {
  id: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  bankName: string;
  accountNumber: string;
  createdAt: string;
  processedAt?: string;
  stripeTransferId?: string;
}

export default function WithdrawPage() {
  const { user } = useAuth();
  const [coinBalance, setCoinBalance] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    bankCode: '',
    accountHolderName: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawHistory, setWithdrawHistory] = useState<WithdrawalHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      fetchCoinBalance();
      fetchWithdrawHistory();
    }
  }, [user]);

  const fetchCoinBalance = async () => {
    if (!user) {
      setCoinBalance(0);
      return;
    }
    try {
      // This would typically come from your user service
      // For now, using a mock value
      setCoinBalance(user?.coinBalance || 0);
    } catch (error) {
      console.error('Error fetching coin balance:', error);
    }
  };

  const fetchWithdrawHistory = async () => {
    if (!user) {
      setWithdrawHistory([]);
      setLoadingHistory(false);
      return;
    }
    try {
      setLoadingHistory(true);
      const history = await authApi.getWithdrawHistory();
      // Ensure history is always an array
      setWithdrawHistory(Array.isArray(history) ? history : []);
    } catch (error) {
      console.error('Error fetching withdrawal history:', error);
      toast.error('Failed to load withdrawal history');
      setWithdrawHistory([]); // Set empty array on error
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Check if user is authenticated
    if (!user) {
      setError('Please log in to make a withdrawal request');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    const requiredCoins = Math.ceil(amount / COIN_TO_THB_RATE);

    // Validation
    if (!amount || amount < MIN_WITHDRAWAL_AMOUNT) {
      setError(`Minimum withdrawal amount is ฿${MIN_WITHDRAWAL_AMOUNT}`);
      return;
    }

    if (amount > MAX_WITHDRAWAL_AMOUNT) {
      setError(`Maximum withdrawal amount is ฿${MAX_WITHDRAWAL_AMOUNT.toLocaleString()}`);
      return;
    }

    if (requiredCoins > coinBalance) {
      setError(`Insufficient coin balance. You need ${requiredCoins} coins but only have ${coinBalance}`);
      return;
    }

    if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.bankCode || !bankDetails.accountHolderName) {
      setError('Please fill in all bank details');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const withdrawalData = {
        amount,
        bankName: bankDetails.bankName,
        accountNumber: bankDetails.accountNumber,
        routingNumber: bankDetails.bankCode,
        accountHolderName: bankDetails.accountHolderName
      };

      await authApi.createWithdrawRequest(withdrawalData);
      
      setSuccess(`Withdrawal request for ฿${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} submitted successfully!`);
      setWithdrawAmount('');
      setBankDetails({
        bankName: '',
        accountNumber: '',
        bankCode: '',
        accountHolderName: ''
      });
      
      // Refresh data
      fetchCoinBalance();
      fetchWithdrawHistory();
      
      toast.success('Withdrawal request submitted successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to submit withdrawal request';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateCoinsNeeded = (amount: string) => {
    const thbAmount = parseFloat(amount);
    if (isNaN(thbAmount)) return 0;
    return Math.ceil(thbAmount / COIN_TO_THB_RATE);
  };

  const maxWithdrawableAmount = Math.floor(coinBalance * COIN_TO_THB_RATE * 100) / 100;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <p>Please log in to access the withdrawal page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Withdraw Funds</h1>
          <p className="text-gray-600">Convert your coins to Thai Baht and withdraw to your bank account</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Withdrawal Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Withdrawal Request
                </CardTitle>
                <CardDescription>
                  Enter the amount you want to withdraw and your bank details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert className="mb-4 border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="mb-4 border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleWithdraw} className="space-y-6">
                  {/* Amount Section */}
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="amount" className="text-sm font-medium">Withdrawal Amount (THB)</label>
                      <div className="relative mt-1">
                        <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          min={MIN_WITHDRAWAL_AMOUNT}
                          max={Math.min(MAX_WITHDRAWAL_AMOUNT, maxWithdrawableAmount)}
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="0.00"
                          className="pl-10"
                        />
                      </div>
                      {withdrawAmount && (
                        <p className="text-sm text-gray-600 mt-1">
                          Requires {calculateCoinsNeeded(withdrawAmount)} coins
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawAmount(MIN_WITHDRAWAL_AMOUNT.toString())}
                      >
                        Min (฿{MIN_WITHDRAWAL_AMOUNT})
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawAmount(Math.min(100, maxWithdrawableAmount).toString())}
                      >
                        ฿100
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawAmount(Math.min(500, maxWithdrawableAmount).toString())}
                      >
                        ฿500
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawAmount(MAX_WITHDRAWAL_AMOUNT.toString())}
                        disabled={maxWithdrawableAmount < MIN_WITHDRAWAL_AMOUNT}
                      >
                        Max (฿{MAX_WITHDRAWAL_AMOUNT})
                      </Button>
                    </div>
                  </div>

                  {/* Bank Details Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Bank Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="bankName" className="text-sm font-medium">Bank Name</label>
                        <Input
                          id="bankName"
                          value={bankDetails.bankName}
                          onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                          placeholder="e.g., Chase Bank"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="accountHolderName" className="text-sm font-medium">Account Holder Name</label>
                        <Input
                          id="accountHolderName"
                          value={bankDetails.accountHolderName}
                          onChange={(e) => setBankDetails(prev => ({ ...prev, accountHolderName: e.target.value }))}
                          placeholder="Full name on account"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="accountNumber" className="text-sm font-medium">Account Number</label>
                        <Input
                          id="accountNumber"
                          value={bankDetails.accountNumber}
                          onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                          placeholder="Account number"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="bankCode" className="text-sm font-medium">Bank Code</label>
                        <Input
                          id="bankCode"
                          value={bankDetails.bankCode}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                            setBankDetails(prev => ({ ...prev, bankCode: value }));
                          }}
                          placeholder="3-digit bank code (e.g., 002, 014)"
                          maxLength={3}
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting || !withdrawAmount || calculateCoinsNeeded(withdrawAmount) > coinBalance}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      `Withdraw ฿${parseFloat(withdrawAmount || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Balance Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Your Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {coinBalance.toLocaleString()} Coins
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    ≈ ฿{(coinBalance * COIN_TO_THB_RATE).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Exchange Rate */}
            <Card>
              <CardHeader>
                <CardTitle>Exchange Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    1 Coin = ฿{COIN_TO_THB_RATE.toFixed(0)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Current exchange rate
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Help */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800">
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-700 mb-3">
                  Having trouble with your withdrawal? Contact our support team.
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Withdrawal History */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Withdrawal History
            </CardTitle>
            <CardDescription>
              Track your past withdrawal requests and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading withdrawal history...</p>
              </div>
            ) : withdrawHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No withdrawal requests found</p>
                <p className="text-sm">Your withdrawal history will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {withdrawHistory.map((withdrawal) => (
                  <div key={withdrawal.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">฿{withdrawal.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-sm text-gray-600">
                          {withdrawal.bankName} - {withdrawal.accountNumber?.replace(/\d(?=\d{4})/g, '*') || '****'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          withdrawal.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          withdrawal.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          withdrawal.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {withdrawal.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>Requested: {new Date(withdrawal.createdAt).toLocaleDateString()}</p>
                      {withdrawal.processedAt && (
                        <p>Processed: {new Date(withdrawal.processedAt).toLocaleDateString()}</p>
                      )}
                      {withdrawal.stripeTransferId && (
                        <p className="font-mono text-xs">Transfer ID: {withdrawal.stripeTransferId}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}