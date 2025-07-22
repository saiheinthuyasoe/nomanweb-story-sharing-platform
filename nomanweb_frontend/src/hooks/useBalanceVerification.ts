import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { refundApi } from '@/lib/api/refunds';
import { RefundCalculationResponse } from '@/types/refund';

export function useBalanceVerification() {
  const { user } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    hasEnoughBalance: boolean;
    currentBalance: number;
    requiredAmount: number;
    shortfall: number;
  } | null>(null);

  const verifyBalance = async (
    itemId: string,
    itemType: 'story' | 'chapter'
  ): Promise<{
    hasEnoughBalance: boolean;
    currentBalance: number;
    requiredAmount: number;
    shortfall: number;
    calculation: RefundCalculationResponse;
  }> => {
    setIsVerifying(true);
    
    try {
      // Get refund calculation
      const calculation = itemType === 'story' 
        ? await refundApi.calculateStoryRefund(itemId)
        : await refundApi.calculateChapterRefund(itemId);

      // Get current user balance (assuming it's available in user context)
      const currentBalance = user?.coinBalance || 0;
      const requiredAmount = calculation.totalRefundAmount;
      const hasEnoughBalance = currentBalance >= requiredAmount;
      const shortfall = hasEnoughBalance ? 0 : requiredAmount - currentBalance;

      const result = {
        hasEnoughBalance,
        currentBalance,
        requiredAmount,
        shortfall,
        calculation
      };

      setVerificationResult(result);
      return result;
    } catch (error) {
      console.error('Error verifying balance:', error);
      throw error;
    } finally {
      setIsVerifying(false);
    }
  };

  const checkStoryBalance = async (storyId: string) => {
    return verifyBalance(storyId, 'story');
  };

  const checkChapterBalance = async (chapterId: string) => {
    return verifyBalance(chapterId, 'chapter');
  };

  const clearVerification = () => {
    setVerificationResult(null);
  };

  return {
    isVerifying,
    verificationResult,
    verifyBalance,
    checkStoryBalance,
    checkChapterBalance,
    clearVerification
  };
} 