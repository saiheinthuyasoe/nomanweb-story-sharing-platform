"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RefundModal } from '@/components/refunds/RefundModal';
import { usePurchaseProtection } from '@/hooks/usePurchaseProtection';
import { useToast } from '@/hooks/use-toast';
import { RefundType } from '@/types/refund';
import { AlertTriangle, DollarSign, ShieldCheck, CheckCircle, ArrowRight } from 'lucide-react';

interface ProtectedPricingFormProps {
  itemId: string;
  itemType: 'story' | 'chapter';
  itemTitle: string;
  currentPricingType: 'FREE' | 'PAID_PER_CHAPTER' | 'WHOLE_BOOK';
  newPricingType: 'FREE' | 'PAID_PER_CHAPTER' | 'WHOLE_BOOK';
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

export function ProtectedPricingForm({
  itemId,
  itemType,
  itemTitle,
  currentPricingType,
  newPricingType,
  onConfirm,
  onCancel,
  children,
}: ProtectedPricingFormProps) {
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const { toast } = useToast();

  const {
    hasPurchases,
    canChangePricing,
    requiresRefund,
    isLoading,
    error,
    getActionRequirement,
    calculateRefund,
    initiateRefund,
    getRefundType,
  } = usePurchaseProtection(itemId, itemType, 'PUBLISHED', currentPricingType, newPricingType);

  const isPricingChangeToFree = () => {
    return (currentPricingType === 'PAID_PER_CHAPTER' || currentPricingType === 'WHOLE_BOOK') && 
           newPricingType === 'FREE';
  };

  const isPaidToPaidChange = () => {
    return (currentPricingType === 'PAID_PER_CHAPTER' || currentPricingType === 'WHOLE_BOOK') && 
           (newPricingType === 'PAID_PER_CHAPTER' || newPricingType === 'WHOLE_BOOK');
  };

  const isProtectedChange = () => {
    // Only require refunds when changing from paid to free
    return isPricingChangeToFree() && hasPurchases;
  };

  const requiresRefundForChange = () => {
    return isProtectedChange() && requiresRefund;
  };

  const canProceedWithChange = () => {
    // Can proceed if no purchases, or if it's a paid-to-paid change (one-time purchase protection)
    return !hasPurchases || isPaidToPaidChange();
  };

  const getPricingTypeLabel = (type: string) => {
    switch (type) {
      case 'FREE':
        return 'Free';
      case 'PAID_PER_CHAPTER':
        return 'Paid per Chapter';
      case 'WHOLE_BOOK':
        return 'Whole Book';
      default:
        return type;
    }
  };

  const handleConfirm = async () => {
    if (isProtectedChange()) {
      if (requiresRefundForChange()) {
        // Show refund modal
        setShowRefundModal(true);
        return;
      }
      
      // Show protection warning
      toast({
        title: 'Action Not Allowed',
        description: getActionRequirement('changePricing'),
        variant: 'destructive',
      });
      return;
    }

    // Check if we can proceed with the change
    if (!canProceedWithChange()) {
      toast({
        title: 'Action Not Allowed',
        description: getActionRequirement('changePricing'),
        variant: 'destructive',
      });
      return;
    }

    // Safe to proceed
    setIsConfirming(true);
    try {
      await onConfirm();
      
      toast({
        title: 'Pricing Updated',
        description: `Successfully changed to ${getPricingTypeLabel(newPricingType)}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update pricing. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRefundCompleted = async () => {
    setShowRefundModal(false);
    
    // Process refund for pricing change
    try {
      const refundType = getRefundType('changePricing');
      const reason = `Pricing change from ${getPricingTypeLabel(currentPricingType)} to ${getPricingTypeLabel(newPricingType)}`;
      
      const success = await initiateRefund(refundType, reason);
      
      if (success) {
        toast({
          title: 'Refund Processed',
          description: 'All buyers have been refunded. Proceeding with pricing change.',
        });
        
        // Proceed with pricing change after refund
        setIsConfirming(true);
        try {
          await onConfirm();
          
          toast({
            title: 'Pricing Updated',
            description: `Successfully changed to ${getPricingTypeLabel(newPricingType)}`,
          });
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to update pricing after refund. Please try again.',
            variant: 'destructive',
          });
        } finally {
          setIsConfirming(false);
        }
      } else {
        toast({
          title: 'Refund Failed',
          description: 'Failed to process refunds. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process refunds. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getChangeDescription = () => {
    if (isPricingChangeToFree()) {
      return 'This will make your content free for all users';
    }
    
    if (isPaidToPaidChange()) {
      return `This will change your pricing model from ${getPricingTypeLabel(currentPricingType)} to ${getPricingTypeLabel(newPricingType)}`;
    }
    
    return `This will change your pricing model to ${getPricingTypeLabel(newPricingType)}`;
  };

  const getProtectionWarning = () => {
    if (!isProtectedChange()) return null;

    return (
      <Alert variant="warning" className="border-amber-200 bg-amber-50">
        <ShieldCheck className="h-4 w-4" />
        <AlertDescription className="text-amber-800">
          <strong>Purchase Protection Active</strong>
          <br />
          This content has existing purchases. All buyers must be refunded before changing to free pricing.
        </AlertDescription>
      </Alert>
    );
  };

  const getOnTimePurchaseBenefit = () => {
    if (currentPricingType === 'FREE' || newPricingType === 'FREE') return null;
    if (!isPaidToPaidChange()) return null;

    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <CheckCircle className="h-5 w-5" />
            One-Time Purchase Protection
          </CardTitle>
          <CardDescription className="text-blue-700">
            Readers who already purchased will maintain access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-700">
            <p>✓ Existing buyers keep access regardless of pricing model changes</p>
            <p>✓ No need to purchase again when switching between pricing models</p>
            <p>✓ Protected investment for your readers</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2">Checking purchase protection...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing Change Confirmation
          </CardTitle>
          <CardDescription>
            Review the changes you're about to make
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pricing Change Summary */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <Badge variant="outline" className="px-3 py-1">
              {getPricingTypeLabel(currentPricingType)}
            </Badge>
            <ArrowRight className="h-4 w-4 text-gray-500" />
            <Badge variant="secondary" className="px-3 py-1">
              {getPricingTypeLabel(newPricingType)}
            </Badge>
          </div>

          <p className="text-sm text-gray-600">
            {getChangeDescription()}
          </p>

          {/* Protection Warning */}
          {getProtectionWarning()}

          {/* One-Time Purchase Benefit */}
          {getOnTimePurchaseBenefit()}

          {/* Purchase Status */}
          {hasPurchases && (
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-amber-500" />
              <span className="text-amber-700">
                This {itemType} has existing purchases
              </span>
            </div>
          )}

          {/* Custom Content */}
          {children}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={isConfirming}
              variant={isProtectedChange() ? "destructive" : "default"}
            >
              {isConfirming ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  {isProtectedChange() ? 'Process Refund & Change' : 'Confirm Change'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Refund Modal */}
      <RefundModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        itemId={itemId}
        itemType={itemType}
        itemTitle={itemTitle}
        refundType={RefundType.PRICING_CHANGE_TO_FREE}
        onRefundInitiated={handleRefundCompleted}
      />
    </div>
  );
} 