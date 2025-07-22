"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { RefundCalculationResponse, RefundRequest } from "@/types/refund";
import { refundApi } from "@/lib/api/refunds";
import {
  Loader2,
  AlertTriangle,
  DollarSign,
  Users,
  FileText,
} from "lucide-react";

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;

  // For full refund flow (original design)
  itemId?: string;
  itemType?: "story" | "chapter";
  itemTitle?: string;
  refundType?: RefundRequest["refundType"];
  onRefundInitiated?: () => void;

  // For purchase protection violations (simplified)
  storyId?: string;
  storyTitle?: string;
  totalPurchases?: number;
  refundAmount?: number;
  onRefundProcessed?: () => void; // Callback to retry deletion after refund
}

export function RefundModal({
  isOpen,
  onClose,

  // Full refund flow props
  itemId,
  itemType,
  itemTitle,
  refundType,
  onRefundInitiated,

  // Purchase protection props
  storyId,
  storyTitle,
  totalPurchases,
  refundAmount,
  onRefundProcessed,
}: RefundModalProps) {
  // Determine which mode we're in and set defaults
  const isPurchaseProtectionMode = Boolean(storyId && storyTitle);
  const finalItemId = itemId || storyId || "";
  const finalItemType = itemType || "story";
  const finalItemTitle = itemTitle || storyTitle || "Unknown Item";
  const finalRefundType = refundType || "STORY_DELETION";
  const [calculation, setCalculation] =
    useState<RefundCalculationResponse | null>(null);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();

  // Auto-calculate when modal opens in purchase protection mode
  useEffect(() => {
    if (isOpen && isPurchaseProtectionMode && !calculation) {
      handleCalculateRefund();
    }
  }, [isOpen, isPurchaseProtectionMode]);

  const handleCalculateRefund = async () => {
    // If in purchase protection mode, create calculation from provided data
    if (isPurchaseProtectionMode && totalPurchases && refundAmount) {
      const mockCalculation: RefundCalculationResponse = {
        totalRefundAmount: refundAmount,
        totalBuyersCount: totalPurchases,
        refundItems: [], // We don't have detailed items in purchase protection mode
      };
      setCalculation(mockCalculation);
      return;
    }

    // Otherwise, fetch calculation from API
    if (!finalItemId) {
      toast({
        title: "Error",
        description: "Invalid item ID",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);
    try {
      const response =
        finalItemType === "story"
          ? await refundApi.calculateStoryRefund(finalItemId)
          : await refundApi.calculateChapterRefund(finalItemId);

      setCalculation(response);
    } catch (error) {
      console.error("Error calculating refund:", error);
      toast({
        title: "Error",
        description: "Failed to calculate refund amount. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleInitiateRefund = async () => {
    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for the refund.",
        variant: "destructive",
      });
      return;
    }

    // In purchase protection mode, process refunds and retry deletion
    if (isPurchaseProtectionMode) {
      if (!finalItemId) {
        toast({
          title: "Error",
          description: "Invalid story ID",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      try {
        const request: RefundRequest = {
          [finalItemType === "story" ? "storyId" : "chapterId"]: finalItemId,
          reason: reason.trim(),
          refundType: finalRefundType,
        };

        finalItemType === "story"
          ? await refundApi.initiateStoryRefund(finalItemId, request)
          : await refundApi.initiateChapterRefund(finalItemId, request);

        // Add cache invalidation for book access
        if (finalItemType === "story") {
          queryClient.invalidateQueries({
            queryKey: ["bookAccess", finalItemId],
          });

          // Also invalidate chapter access for all chapters in the story
          queryClient.invalidateQueries({
            queryKey: ["chapter-access"],
            predicate: (query) => {
              // Invalidate all chapter-access queries since we don't have chapter IDs here
              return query.queryKey[0] === "chapter-access";
            },
          });

          // Invalidate batch chapter access queries
          queryClient.invalidateQueries({
            queryKey: ["chapter-access-batch"],
          });

          // Invalidate book access and purchase-related caches
          queryClient.invalidateQueries({
            queryKey: ["bookAccess"],
          });
          queryClient.invalidateQueries({
            queryKey: ["purchasedChapters"],
          });
          queryClient.invalidateQueries({
            queryKey: ["purchaseHistory"],
          });
        } else {
          // For chapter refunds, invalidate the specific chapter access
          queryClient.invalidateQueries({
            queryKey: ["chapter-access", finalItemId],
          });

          // Also invalidate batch queries that might include this chapter
          queryClient.invalidateQueries({
            queryKey: ["chapter-access-batch"],
          });

          // Invalidate book access and purchase-related caches
          queryClient.invalidateQueries({
            queryKey: ["bookAccess"],
          });
          queryClient.invalidateQueries({
            queryKey: ["purchasedChapters"],
          });
          queryClient.invalidateQueries({
            queryKey: ["purchaseHistory"],
          });
        }

        toast({
          title: "Refund Initiated",
          description:
            "Your refund request has been submitted and will be processed shortly.",
        });

        onRefundInitiated?.();
        onClose();

        // Callback to retry the deletion after a short delay
        setTimeout(() => {
          onRefundProcessed?.();
        }, 1000);

        return;
      } catch (error) {
        console.error("Error processing refunds:", error);
        toast({
          title: "Refund Failed",
          description:
            "Failed to process refunds. Please try again or contact support.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    if (!finalItemId) {
      toast({
        title: "Error",
        description: "Invalid item ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const request: RefundRequest = {
        [finalItemType === "story" ? "storyId" : "chapterId"]: finalItemId,
        reason: reason.trim(),
        refundType: finalRefundType,
      };

      finalItemType === "story"
        ? await refundApi.initiateStoryRefund(finalItemId, request)
        : await refundApi.initiateChapterRefund(finalItemId, request);

      toast({
        title: "Refund Initiated",
        description:
          "Your refund request has been submitted and will be processed shortly.",
      });

      onRefundInitiated?.();
      onClose();
    } catch (error) {
      console.error("Error initiating refund:", error);
      toast({
        title: "Error",
        description: "Failed to initiate refund. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRefundTypeDescription = () => {
    if (isPurchaseProtectionMode) {
      return "This story has purchases and cannot be deleted without processing refunds first";
    }

    switch (finalRefundType) {
      case "STORY_DELETION":
        return "Deleting this story will refund all buyers";
      case "CHAPTER_DELETION":
        return "Deleting this chapter will refund all buyers";
      case "STORY_UNPUBLISH":
        // Special message for whole book pricing stories
        if (finalItemType === "story" && itemId) {
          return "This story has whole book pricing with existing purchases. You must process refunds to all buyers before unpublishing.";
        }
        return "Unpublishing this story will refund all buyers";
      case "CHAPTER_UNPUBLISH":
        return "Unpublishing this chapter will refund all buyers";
      case "PRICING_CHANGE_TO_FREE":
        return "Changing to free will refund all buyers";
      default:
        return "This action will refund all buyers";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-4">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-amber-700">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Refund Required
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 mt-1">
            {getRefundTypeDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Item Information */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-1">{finalItemTitle}</h3>
            <p className="text-sm text-gray-600">
              {finalItemType === "story" ? "Story" : "Chapter"} ·{" "}
              {finalRefundType.replace(/_/g, " ").toLowerCase()}
            </p>
          </div>

          {/* Refund Calculation */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="flex items-center gap-2 font-medium text-blue-900 mb-2">
              <DollarSign className="h-4 w-4" />
              Refund Calculation
            </h3>
            <p className="text-sm text-blue-700 mb-4">
              Click calculate to see the refund amount required
            </p>
            {!calculation ? (
              <Button
                onClick={handleCalculateRefund}
                disabled={isCalculating}
                className="w-full"
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  "Calculate Refund Amount"
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Total Refund Amount:
                  </span>
                  <Badge variant="secondary" className="text-lg">
                    ${calculation.totalRefundAmount.toFixed(2)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Number of Buyers:</span>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {calculation.totalBuyersCount}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Refund Details:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {calculation.refundItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{item.buyerUsername}</span>
                        <span className="text-muted-foreground">
                          ${item.refundAmount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleCalculateRefund}
                  variant="outline"
                  size="sm"
                  disabled={isCalculating}
                  className="w-full"
                >
                  {isCalculating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Recalculating...
                    </>
                  ) : (
                    "Recalculate"
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Reason */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="flex items-center gap-2 font-medium text-gray-900 mb-2">
              <FileText className="h-4 w-4" />
              Reason for Refund
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for this refund request
            </p>
            <Textarea
              placeholder="Please explain why you need to process this refund..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-20"
            />
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm font-medium">Important Notice</p>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              This action will deduct the refund amount from your coin balance
              and refund all buyers. Make sure you have sufficient coins before
              proceeding.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={onClose} className="px-6">
              Cancel
            </Button>
            <Button
              onClick={handleInitiateRefund}
              disabled={isLoading || !calculation || !reason.trim()}
              className="px-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Initiate Refund"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
