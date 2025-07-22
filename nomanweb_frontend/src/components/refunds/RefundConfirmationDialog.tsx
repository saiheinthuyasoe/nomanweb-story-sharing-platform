"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  RefundCalculationResponse,
  RefundRequest,
  RefundType,
} from "@/types/refund";
import { refundApi } from "@/lib/api/refunds";
import {
  AlertTriangle,
  DollarSign,
  Users,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface RefundConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemType: "story" | "chapter";
  itemTitle: string;
  actionType?: "delete" | "unpublish" | "changePricing";
  calculation?: RefundCalculationResponse;
  onConfirm: () => void;
}

export function RefundConfirmationDialog({
  isOpen,
  onClose,
  itemId,
  itemType,
  itemTitle,
  actionType = "changePricing",
  calculation,
  onConfirm,
}: RefundConfirmationDialogProps) {
  // If no calculation is provided, don't render the dialog
  if (!calculation) {
    return null;
  }
  const [reason, setReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getRefundType = (): RefundType => {
    if (!actionType) {
      return RefundType.PRICING_CHANGE_TO_FREE; // Default fallback
    }

    if (actionType === "delete") {
      return itemType === "story"
        ? RefundType.STORY_DELETION
        : RefundType.CHAPTER_DELETION;
    } else if (actionType === "unpublish") {
      return itemType === "story"
        ? RefundType.STORY_UNPUBLISH
        : RefundType.CHAPTER_UNPUBLISH;
    } else {
      return RefundType.PRICING_CHANGE_TO_FREE;
    }
  };

  const getActionDescription = () => {
    if (!actionType) return `modify this ${itemType}`;

    switch (actionType) {
      case "delete":
        return `delete this ${itemType}`;
      case "unpublish":
        return `unpublish this ${itemType}`;
      case "changePricing":
        return `change this ${itemType} to free`;
      default:
        return `modify this ${itemType}`;
    }
  };

  const handleConfirmRefund = async () => {
    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for the refund.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const request: RefundRequest = {
        [itemType === "story" ? "storyId" : "chapterId"]: itemId,
        reason: reason.trim(),
        refundType: getRefundType(),
      };

      await (itemType === "story"
        ? refundApi.initiateStoryRefund(itemId, request)
        : refundApi.initiateChapterRefund(itemId, request));

      // Invalidate all purchase and access related caches
      queryClient.invalidateQueries({
        queryKey: ["chapter-access"],
      });
      queryClient.invalidateQueries({
        queryKey: ["chapter-access-batch"],
      });
      queryClient.invalidateQueries({
        queryKey: ["bookAccess"],
      });
      queryClient.invalidateQueries({
        queryKey: ["purchasedChapters"],
      });
      queryClient.invalidateQueries({
        queryKey: ["purchaseHistory"],
      });

      toast({
        title: "Refund Initiated",
        description: `Refund has been processed for ${
          calculation.totalBuyersCount
        } buyers. You can now ${getActionDescription()}.`,
      });

      onConfirm();
      onClose();
    } catch (error) {
      console.error("Error processing refund:", error);
      toast({
        title: "Refund Failed",
        description: "Failed to process refund. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Confirm Refund Processing
          </DialogTitle>
          <DialogDescription>
            Review the refund details and confirm to proceed with{" "}
            {getActionDescription()}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{itemTitle}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{itemType}</Badge>
                <Badge variant="secondary">
                  {actionType?.replace(/([A-Z])/g, " $1").toLowerCase() ||
                    "action"}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Refund Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Refund Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Total Refund Amount</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${calculation.totalRefundAmount.toFixed(2)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Number of Buyers</p>
                  <p className="text-2xl font-bold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {calculation.totalBuyersCount}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Buyers to be refunded:</h4>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {calculation.refundItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded"
                    >
                      <span className="font-medium">{item.buyerUsername}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {item.itemType}
                        </Badge>
                        <span className="text-green-600 font-medium">
                          ${item.refundAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reason Input */}
          <Card>
            <CardHeader>
              <CardTitle>Reason for Refund</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Please explain why you need to process this refund..."
                value={reason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setReason(e.target.value)
                }
                className="min-h-20"
                disabled={isProcessing}
              />
            </CardContent>
          </Card>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Important Notice</p>
                <p className="text-sm text-amber-700 mt-1">
                  This action cannot be undone. The refund amount will be
                  deducted from your coin balance and distributed to all buyers.
                  After processing, you will be able to {getActionDescription()}
                  .
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRefund}
              disabled={isProcessing || !reason.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Refund...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm & Process Refund
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
