"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Shield, Coins, BookOpen } from 'lucide-react';

interface PurchaseBenefitDisplayProps {
  itemType: 'story' | 'chapter';
  itemTitle: string;
  currentPricingType: 'PAID_PER_CHAPTER' | 'WHOLE_BOOK';
  hasExistingPurchases?: boolean;
  existingPurchaseType?: 'BOOK' | 'CHAPTER';
  showCompact?: boolean;
}

export function PurchaseBenefitDisplay({
  itemType,
  itemTitle,
  currentPricingType,
  hasExistingPurchases = false,
  existingPurchaseType,
  showCompact = false,
}: PurchaseBenefitDisplayProps) {
  
  const getAlreadyPurchasedMessage = () => {
    if (!hasExistingPurchases) return null;

    const message = existingPurchaseType === 'BOOK' 
      ? `You already own this ${itemType} through your book purchase`
      : `You already purchased this ${itemType}`;

    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Already Purchased!</strong>
          <br />
          {message}. You have lifetime access regardless of pricing changes.
        </AlertDescription>
      </Alert>
    );
  };

  const getOneTimePurchaseBenefits = () => {
    if (hasExistingPurchases) return null;

    const benefits = [
      {
        icon: <Shield className="h-5 w-5 text-blue-600" />,
        title: "One-Time Purchase",
        description: "Buy once, own forever - even if pricing model changes"
      },
      {
        icon: <Coins className="h-5 w-5 text-green-600" />,
        title: "Price Protection",
        description: "If author changes pricing later, you won't pay again"
      },
      {
        icon: <BookOpen className="h-5 w-5 text-purple-600" />,
        title: "Lifetime Access",
        description: "Read anytime, anywhere, without additional charges"
      }
    ];

    if (showCompact) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">One-Time Purchase Protection</span>
          </div>
          <p className="text-sm text-blue-700">
            Buy once, own forever - even if pricing changes later
          </p>
        </div>
      );
    }

    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Shield className="h-5 w-5" />
            Purchase Protection Benefits
          </CardTitle>
          <CardDescription className="text-blue-700">
            Your investment is protected with our one-time purchase guarantee
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                {benefit.icon}
                <div>
                  <h4 className="font-medium text-blue-900">{benefit.title}</h4>
                  <p className="text-sm text-blue-700">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const getPricingModelExplanation = () => {
    if (hasExistingPurchases) return null;

    const explanation = currentPricingType === 'WHOLE_BOOK' 
      ? "This book uses whole-book pricing. One payment gives you access to all current and future chapters."
      : "This story uses per-chapter pricing. Each chapter is purchased individually, but you'll never pay twice for the same content.";

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-800">Pricing Model</span>
        </div>
        <p className="text-sm text-gray-700">{explanation}</p>
      </div>
    );
  };

  const getCrossModelProtection = () => {
    if (hasExistingPurchases || showCompact) return null;

    return (
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <CheckCircle className="h-5 w-5" />
            Cross-Model Protection
          </CardTitle>
          <CardDescription className="text-purple-700">
            Your purchase is protected even if the author changes pricing models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-purple-700">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>If you buy chapters and author switches to whole-book pricing, you keep access</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>If you buy whole-book and author switches to per-chapter, you keep access</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>If author makes content free later, you still own your purchase</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {getAlreadyPurchasedMessage()}
      {getPricingModelExplanation()}
      {getOneTimePurchaseBenefits()}
      {getCrossModelProtection()}
    </div>
  );
} 