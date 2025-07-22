"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefundModal } from "./RefundModal";
import { refundApi } from "@/lib/api/refunds";
import { RefundType } from "@/types/refund";
import { AlertTriangle, DollarSign, Users, FileText } from "lucide-react";

interface PurchaseProtectionWarningProps {
  itemId: string;
  itemType: "story" | "chapter";
  itemTitle: string;
  actionType: "delete" | "unpublish" | "changePricing";
  children?: React.ReactNode;
  onActionSuccess?: () => void;
}

export function PurchaseProtectionWarning({
  itemId,
  itemType,
  itemTitle,
  actionType,
  children,
  onActionSuccess
}: PurchaseProtectionWarningProps) {
  const [hasPurchases, setHasPurchases] = useState<boolean | null>(null);
  const [isCheckingProtection, setIsCheckingProtection] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkProtectionStatus();
  }, [itemId, itemType]);

  const checkProtectionStatus = async () => {
    setIsLoading(true);
    try {
      const hasPurchases = itemType === "story" 
        ? await refundApi.getStoryProtectionStatus(itemId)
        : await refundApi.getChapterProtectionStatus(itemId);
      
      setHasPurchases(hasPurchases);
    } catch (error) {
      console.error("Error checking protection status:", error);
      setHasPurchases(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getRefundType = (): RefundType => {
    if (actionType === "delete") {
      return itemType === "story" ? RefundType.STORY_DELETION : RefundType.CHAPTER_DELETION;
    } else if (actionType === "unpublish") {
      return itemType === "story" ? RefundType.STORY_UNPUBLISH : RefundType.CHAPTER_UNPUBLISH;
    } else {
      return RefundType.PRICING_CHANGE_TO_FREE;
    }
  };

  const getActionDescription = () => {
    const action = actionType === "delete" ? "delete" : 
                   actionType === "unpublish" ? "unpublish" : 
                   "change pricing to free for";
    return `${action} this ${itemType}`;
  };

  const getWarningTitle = () => {
    switch (actionType) {
      case "delete":
        return "Deletion Requires Refund";
      case "unpublish":
        return "Unpublishing Requires Refund";
      case "changePricing":
        return "Price Change Requires Refund";
      default:
        return "Action Requires Refund";
    }
  };

  const handleProceedWithRefund = () => {
    setShowRefundModal(true);
  };

  const handleRefundInitiated = () => {
    setShowRefundModal(false);
    onActionSuccess?.();
  };

  // Still loading
  if (isLoading) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            <span className="text-sm">Checking purchase protection...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No purchases found, action can proceed normally
  if (hasPurchases === false) {
    return (
      <div className="space-y-4">
        <Alert className="border-green-200 bg-green-50">
          <AlertTriangle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            No purchases found. You can {getActionDescription()} without processing refunds.
          </AlertDescription>
        </Alert>
        {children}
      </div>
    );
  }

  // Error checking protection status
  if (hasPurchases === null) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Unable to check purchase protection status. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // Has purchases, show warning and refund requirement
  return (
    <div className="space-y-4">
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>{getWarningTitle()}</strong>
          <br />
          This {itemType} has existing purchases. You must process refunds before you can {getActionDescription()}.
        </AlertDescription>
      </Alert>

      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <DollarSign className="h-5 w-5" />
            Purchase Protection Active
          </CardTitle>
          <CardDescription>
            To protect buyers, you must refund all purchases before {getActionDescription()}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">What happens when you initiate a refund?</span>
            </div>
            <ul className="text-sm text-gray-600 space-y-1 ml-6">
              <li>• All buyers will receive a full refund</li>
              <li>• The refund amount will be deducted from your coin balance</li>
              <li>• After processing, you can proceed with your action</li>
              <li>• Buyers will be notified of the refund</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleProceedWithRefund}
              className="flex-1"
              variant="outline"
            >
              <FileText className="mr-2 h-4 w-4" />
              Calculate & Process Refund
            </Button>
          </div>
        </CardContent>
      </Card>

      <RefundModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        itemId={itemId}
        itemType={itemType}
        itemTitle={itemTitle}
        refundType={getRefundType()}
        onRefundInitiated={handleRefundInitiated}
      />
    </div>
  );
} 