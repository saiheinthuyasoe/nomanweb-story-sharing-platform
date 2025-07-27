"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, DollarSign, CheckCircle, ArrowRight } from 'lucide-react';

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
  const [isConfirming, setIsConfirming] = useState(false);
  const { toast } = useToast();

  const isPaidToPaidChange = () => {
    return (currentPricingType === 'PAID_PER_CHAPTER' || currentPricingType === 'WHOLE_BOOK') && 
           (newPricingType === 'PAID_PER_CHAPTER' || newPricingType === 'WHOLE_BOOK');
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



  const getChangeDescription = () => {
    if (isPaidToPaidChange()) {
      return `This will change your pricing model from ${getPricingTypeLabel(currentPricingType)} to ${getPricingTypeLabel(newPricingType)}`;
    }
    
    return `This will change your pricing model to ${getPricingTypeLabel(newPricingType)}`;
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

          {/* One-Time Purchase Benefit */}
          {getOnTimePurchaseBenefit()}

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
            >
              {isConfirming ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                'Confirm Change'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>


    </div>
  );
}