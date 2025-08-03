"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, DollarSign, Users, CheckCircle } from "lucide-react";

interface RefundConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  refundData: {
    hasPurchases: boolean;
    totalRefundAmount: number;
    affectedPurchasers: number;
    itemTitle: string;
    itemType: "story" | "chapter";
  };
  isLoading?: boolean;
}

export function RefundConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  refundData,
  isLoading = false,
}: RefundConfirmationModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  if (!refundData || !refundData.hasPurchases) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <span>Refund Required</span>
          </DialogTitle>
          <DialogDescription>
            This {refundData.itemType} has active purchases that require refunds
            before unpublishing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">
              Refund Summary for "{refundData.itemTitle}"
            </h4>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-yellow-700">
                  Total Refund Amount:
                </span>
                <span className="font-medium text-yellow-800 flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  {refundData.totalRefundAmount} coins
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-yellow-700">
                  Affected Purchasers:
                </span>
                <span className="font-medium text-yellow-800 flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {refundData.affectedPurchasers} users
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 mb-1">
                  What happens next?
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>
                    • All affected users will receive their refunds
                    automatically
                  </li>
                  <li>• The {refundData.itemType} will be unpublished</li>
                  <li>• Users will lose access to the content</li>
                  <li>• You can republish later if needed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading || isConfirming}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || isConfirming}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading || isConfirming ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing Refunds...
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4 mr-2" />
                Confirm & Unpublish
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
