"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefundModal } from '@/components/refunds/RefundModal';
import { usePurchaseProtection } from '@/hooks/usePurchaseProtection';
import { useToast } from '@/hooks/use-toast';
import { RefundType } from '@/types/refund';
import { AlertTriangle, Trash2, EyeOff, DollarSign, ShieldCheck, Clock } from 'lucide-react';

interface ProtectedActionButtonProps {
  itemId: string;
  itemType: 'story' | 'chapter';
  itemTitle: string;
  actionType: 'delete' | 'unpublish' | 'changePricing';
  currentPublishStatus?: 'PUBLISHED' | 'DRAFT';
  currentPricingType?: 'FREE' | 'PAID_PER_CHAPTER' | 'WHOLE_BOOK';
  onAction: () => void;
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  disabled?: boolean;
}

export function ProtectedActionButton({
  itemId,
  itemType,
  itemTitle,
  actionType,
  currentPublishStatus,
  currentPricingType,
  onAction,
  children,
  className,
  variant = 'default',
  disabled = false,
}: ProtectedActionButtonProps) {
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showProtectionInfo, setShowProtectionInfo] = useState(false);
  const { toast } = useToast();

  const {
    hasPurchases,
    canProceedWithAction,
    requiresRefund,
    isLoading,
    error,
    calculateRefund,
    getActionRequirement,
    getRefundType,
  } = usePurchaseProtection(itemId, itemType, currentPublishStatus, currentPricingType);

  const getActionIcon = () => {
    switch (actionType) {
      case 'delete':
        return <Trash2 className="h-4 w-4" />;
      case 'unpublish':
        return <EyeOff className="h-4 w-4" />;
      case 'changePricing':
        return <DollarSign className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getActionLabel = () => {
    if (children) return children;
    
    switch (actionType) {
      case 'delete':
        return 'Delete';
      case 'unpublish':
        return 'Unpublish';
      case 'changePricing':
        return 'Change to Free';
      default:
        return 'Action';
    }
  };

  const getActionVariant = () => {
    if (variant !== 'default') return variant;
    
    switch (actionType) {
      case 'delete':
        return 'destructive' as const;
      case 'unpublish':
        return 'outline' as const;
      case 'changePricing':
        return 'secondary' as const;
      default:
        return 'default' as const;
    }
  };

  const handleButtonClick = async () => {
    if (disabled) return;

    // Check if action is allowed
    const canProceed = canProceedWithAction(actionType);
    
    // Special case for whole book pricing stories that need to be unpublished
    if (actionType === 'unpublish' && currentPricingType === 'WHOLE_BOOK' && hasPurchases) {
      // Show refund modal for whole book pricing stories
      setShowRefundModal(true);
      return;
    }
    
    if (!canProceed) {
      if (requiresRefund) {
        // Show refund modal
        setShowRefundModal(true);
      } else {
        // Show protection info
        setShowProtectionInfo(true);
        
        // Show toast with requirement
        toast({
          title: 'Action Not Allowed',
          description: getActionRequirement(actionType),
          variant: 'destructive',
        });
      }
      return;
    }

    // Action is allowed, proceed normally
    onAction();
  };

  const handleRefundCompleted = () => {
    setShowRefundModal(false);
    
    toast({
      title: 'Refund Processed',
      description: 'All buyers have been refunded. You can now proceed with your action.',
    });
    
    // Proceed with original action after refund
    onAction();
  };

  const getButtonState = () => {
    if (isLoading) return 'loading';
    if (error) return 'error';
    if (!hasPurchases) return 'safe';
    if (requiresRefund) return 'protected';
    return 'safe';
  };

  const buttonState = getButtonState();

  // Show loading state
  if (isLoading) {
    return (
      <Button 
        disabled 
        className={className}
        variant={getActionVariant()}
      >
        <Clock className="mr-2 h-4 w-4 animate-spin" />
        Checking...
      </Button>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-2">
        <Button 
          disabled 
          className={className}
          variant="destructive"
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          Error
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          onClick={handleButtonClick}
          disabled={disabled}
          className={className}
          variant={getActionVariant()}
        >
          {getActionIcon()}
          {getActionLabel()}
        </Button>
        
        {buttonState === 'protected' && (
          <div className="flex items-center gap-1 text-amber-600">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm">Protected</span>
          </div>
        )}
      </div>

      {/* Protection Info Display */}
      {showProtectionInfo && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <ShieldCheck className="h-5 w-5" />
              Purchase Protection Active
            </CardTitle>
            <CardDescription className="text-amber-700">
              {getActionRequirement(actionType)}
            </CardDescription>
          </CardHeader>
          <CardContent>
                         <div className="space-y-2">
               {actionType === 'delete' && (
                 <Alert>
                   <AlertTriangle className="h-4 w-4" />
                   <AlertDescription>
                     {currentPricingType === 'WHOLE_BOOK' || currentPricingType === 'PAID_PER_CHAPTER' ? (
                       currentPublishStatus === 'PUBLISHED' ? (
                         <>
                           <strong>For Paid Content:</strong>
                           <br />
                           <strong>Step 1:</strong> Unpublish this {itemType} first
                           <br />
                           {hasPurchases && (
                             <>
                               <strong>Step 2:</strong> Process refunds for all buyers
                               <br />
                             </>
                           )}
                           <strong>Step {hasPurchases ? '3' : '2'}:</strong> Then you can delete
                         </>
                       ) : (
                         hasPurchases ? (
                           <>
                             <strong>Paid Content with Purchases:</strong>
                             <br />
                             Must process refunds for all buyers before deleting
                           </>
                         ) : (
                           'This paid content can be deleted since it has no purchases'
                         )
                       )
                     ) : (
                       hasPurchases ? (
                         'This content has existing purchases. All buyers must be refunded before deletion.'
                       ) : (
                         'This content can be deleted'
                       )
                     )}
                   </AlertDescription>
                 </Alert>
               )}
               
               {actionType === 'unpublish' && hasPurchases && (
                 <Alert>
                   <AlertTriangle className="h-4 w-4" />
                   <AlertDescription>
                     <strong>Unpublish Requires Refunds:</strong>
                     <br />
                     This {itemType} has existing purchases. All buyers must be refunded before unpublishing.
                   </AlertDescription>
                 </Alert>
               )}

               {actionType === 'changePricing' && hasPurchases && (
                 <Alert>
                   <AlertTriangle className="h-4 w-4" />
                   <AlertDescription>
                     <strong>Pricing Change Requires Refunds:</strong>
                     <br />
                     This {itemType} has existing purchases. All buyers must be refunded before changing to free.
                   </AlertDescription>
                 </Alert>
               )}
             </div>
          </CardContent>
        </Card>
      )}

      {/* Refund Modal */}
      <RefundModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        itemId={itemId}
        itemType={itemType}
        itemTitle={itemTitle}
        refundType={getRefundType(actionType)}
        onRefundInitiated={handleRefundCompleted}
      />
    </div>
  );
}