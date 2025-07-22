import { useState, useEffect } from 'react';
import { refundApi } from '@/lib/api/refunds';
import { RefundCalculationResponse, RefundType } from '@/types/refund';

export interface PurchaseProtectionStatus {
  hasPurchases: boolean;
  canDelete: boolean;
  canUnpublish: boolean;
  canChangePricing: boolean;
  requiresRefund: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface PurchaseProtectionActions {
  checkProtection: () => Promise<void>;
  calculateRefund: () => Promise<RefundCalculationResponse | null>;
  initiateRefund: (refundType: RefundType, reason: string) => Promise<boolean>;
  canProceedWithAction: (actionType: 'delete' | 'unpublish' | 'changePricing') => boolean;
  getActionRequirement: (actionType: 'delete' | 'unpublish' | 'changePricing') => string;
  getRefundType: (actionType: 'delete' | 'unpublish' | 'changePricing') => RefundType;
  refundCalculation: RefundCalculationResponse | null;
}

export function usePurchaseProtection(
  itemId: string,
  itemType: 'story' | 'chapter',
  currentPublishStatus?: 'PUBLISHED' | 'DRAFT',
  currentPricingType?: 'FREE' | 'PAID_PER_CHAPTER' | 'WHOLE_BOOK',
  newPricingType?: 'FREE' | 'PAID_PER_CHAPTER' | 'WHOLE_BOOK'
): PurchaseProtectionStatus & PurchaseProtectionActions {
  const [status, setStatus] = useState<PurchaseProtectionStatus>({
    hasPurchases: false,
    canDelete: true,
    canUnpublish: true,
    canChangePricing: true,
    requiresRefund: false,
    isLoading: true,
    error: null,
  });

  const [refundCalculation, setRefundCalculation] = useState<RefundCalculationResponse | null>(null);

  const checkProtection = async () => {
    if (!itemId) return;

    setStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log(`🔍 Checking protection for ${itemType}: ${itemId}`);
      console.log(`📊 Current pricing type: ${currentPricingType}`);
      console.log(`📊 Current publish status: ${currentPublishStatus}`);
      
      const hasPurchases = itemType === 'story' 
        ? await refundApi.getStoryProtectionStatus(itemId)
        : await refundApi.getChapterProtectionStatus(itemId);

      console.log(`💰 Has purchases: ${hasPurchases}`);

      // Check if content is paid (whole book or paid per chapter)
      const isPaidContent = currentPricingType === 'WHOLE_BOOK' || currentPricingType === 'PAID_PER_CHAPTER';

      const newStatus: PurchaseProtectionStatus = {
        hasPurchases,
        canDelete: false, // Will be determined by rules below
        canUnpublish: !hasPurchases, // Default: Can only unpublish if no purchases
        canChangePricing: !hasPurchases, // Can only change pricing if no purchases
        requiresRefund: hasPurchases,
        isLoading: false,
        error: null,
      };
      
      // Special case for WHOLE_BOOK pricing type - allow unpublishing with refunds
      if (currentPricingType === 'WHOLE_BOOK' && hasPurchases) {
        newStatus.canUnpublish = true; // Allow unpublishing with refunds for whole book pricing
      }

      // RULE 1: For paid content (whole book or paid per chapter), must unpublish first before delete
      if (isPaidContent && currentPublishStatus === 'PUBLISHED') {
        newStatus.canDelete = false; // Must unpublish first for paid content
      }

      // RULE 2: For paid content that's already unpublished, can only delete if no purchases
      if (isPaidContent && currentPublishStatus === 'DRAFT') {
        newStatus.canDelete = !hasPurchases; // Can delete draft paid content only if no purchases
      }

      // RULE 3: For free content, can delete if no purchases (regardless of publish status)
      if (currentPricingType === 'FREE') {
        newStatus.canDelete = !hasPurchases;
      }

      console.log(`🛡️ Protection status:`, newStatus);
      setStatus(newStatus);
    } catch (error) {
      console.error('Error checking purchase protection:', error);
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to check purchase protection status',
      }));
    }
  };

  const calculateRefund = async (): Promise<RefundCalculationResponse | null> => {
    if (!status.hasPurchases) return null;

    try {
      let calculation: RefundCalculationResponse;
      
      if (itemType === 'story' && newPricingType) {
        // For pricing changes, use the new pricing change calculation
        calculation = await refundApi.calculatePricingChangeRefund(itemId, newPricingType);
      } else {
        // For regular refunds
        calculation = itemType === 'story' 
          ? await refundApi.calculateStoryRefund(itemId)
          : await refundApi.calculateChapterRefund(itemId);
      }

      setRefundCalculation(calculation);
      return calculation;
    } catch (error) {
      console.error('Error calculating refund:', error);
      return null;
    }
  };

  const initiateRefund = async (refundType: RefundType, reason: string): Promise<boolean> => {
    try {
      const request = {
        [itemType === 'story' ? 'storyId' : 'chapterId']: itemId,
        reason,
        refundType,
      };

      await (itemType === 'story' 
        ? refundApi.initiateStoryRefund(itemId, request)
        : refundApi.initiateChapterRefund(itemId, request));

      // Refresh protection status after refund
      await checkProtection();
      
      return true;
    } catch (error) {
      console.error('Error initiating refund:', error);
      return false;
    }
  };

  const canProceedWithAction = (actionType: 'delete' | 'unpublish' | 'changePricing'): boolean => {
    switch (actionType) {
      case 'delete':
        return status.canDelete;
      case 'unpublish':
        return status.canUnpublish;
      case 'changePricing':
        return status.canChangePricing;
      default:
        return false;
    }
  };

  const getActionRequirement = (actionType: 'delete' | 'unpublish' | 'changePricing'): string => {
    const isPaidContent = currentPricingType === 'WHOLE_BOOK' || currentPricingType === 'PAID_PER_CHAPTER';

    switch (actionType) {
      case 'delete':
        if (isPaidContent && currentPublishStatus === 'PUBLISHED') {
          return 'Paid content must be unpublished first before deletion';
        }
        if (isPaidContent && currentPublishStatus === 'DRAFT' && status.hasPurchases) {
          return 'Must process refunds before deleting paid content with purchases';
        }
        if (status.hasPurchases) {
          return 'Must process refunds before deleting';
        }
        return 'No restrictions';
      case 'unpublish':
        if (status.hasPurchases) {
          if (currentPricingType === 'WHOLE_BOOK') {
            return 'This story has existing purchases. You must process refunds to all buyers before unpublishing. Click to proceed with refunds.';
          }
          return 'Must process refunds to all buyers before unpublishing';
        }
        return 'No restrictions';
      case 'changePricing':
        if (status.hasPurchases) {
          if (newPricingType === 'FREE') {
            return 'Must process refunds before changing pricing to free';
          } else if (newPricingType && (newPricingType === 'PAID_PER_CHAPTER' || newPricingType === 'WHOLE_BOOK')) {
            return 'Must process refunds before changing pricing models';
          }
          return 'Must process refunds before changing pricing';
        }
        return 'No restrictions';
      default:
        return 'Action may require refunds';
    }
  };

  const getRefundType = (actionType: 'delete' | 'unpublish' | 'changePricing'): RefundType => {
    switch (actionType) {
      case 'delete':
        return itemType === 'story' ? RefundType.STORY_DELETION : RefundType.CHAPTER_DELETION;
      case 'unpublish':
        return itemType === 'story' ? RefundType.STORY_UNPUBLISH : RefundType.CHAPTER_UNPUBLISH;
      case 'changePricing':
        return RefundType.PRICING_CHANGE;
      default:
        return RefundType.PRICING_CHANGE;
    }
  };

  // Check protection status when component mounts or itemId changes
  useEffect(() => {
    checkProtection();
  }, [itemId, itemType]);

  return {
    ...status,
    checkProtection,
    calculateRefund,
    initiateRefund,
    canProceedWithAction,
    getActionRequirement,
    getRefundType,
    refundCalculation,
  };
}