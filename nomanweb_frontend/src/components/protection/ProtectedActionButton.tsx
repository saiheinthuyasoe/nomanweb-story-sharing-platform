"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, EyeOff, DollarSign } from "lucide-react";
import { RefundConfirmationModal } from "@/components/modals/RefundConfirmationModal";
import { toast } from "react-hot-toast";

interface ProtectedActionButtonProps {
  itemId: string;
  itemType: "story" | "chapter";
  itemTitle: string;
  actionType: "delete" | "unpublish" | "changePricing" | "moveToTrash";
  currentPublishStatus?: "PUBLISHED" | "DRAFT";
  currentPricingType?: "FREE" | "PAID_PER_CHAPTER" | "WHOLE_BOOK";
  onAction: () => void;
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary";
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
  variant = "default",
  disabled = false,
}: ProtectedActionButtonProps) {
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundData, setRefundData] = useState<any>(null);
  const [isCheckingPurchases, setIsCheckingPurchases] = useState(false);

  const getActionIcon = () => {
    switch (actionType) {
      case "delete":
      case "moveToTrash":
        return <Trash2 className="h-4 w-4" />;
      case "unpublish":
        return <EyeOff className="h-4 w-4" />;
      case "changePricing":
        return <DollarSign className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getActionLabel = () => {
    if (children) return children;

    switch (actionType) {
      case "moveToTrash":
        return "Move to Trash";
      case "delete":
        return "Delete";
      case "unpublish":
        return "Unpublish";
      case "changePricing":
        return "Change to Free";
      default:
        return "Action";
    }
  };

  const getActionVariant = () => {
    if (variant !== "default") return variant;

    switch (actionType) {
      case "delete":
      case "moveToTrash":
        return "destructive" as const;
      case "unpublish":
        return "outline" as const;
      case "changePricing":
        return "secondary" as const;
      default:
        return "default" as const;
    }
  };

  const checkPurchases = async () => {
    if (itemType === "story") {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];
        
        const response = await fetch(`/api/stories/${itemId}/has-purchases`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });
        if (response.ok) {
          const data = await response.json();
          return data;
        }
      } catch (error) {
        console.error("Error checking purchases:", error);
      }
    } else if (itemType === "chapter") {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];
        
        const response = await fetch(
          `/api/refunds/chapters/${itemId}/has-purchases`,
          {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` }),
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          return data;
        }
      } catch (error) {
        console.error("Error checking purchases:", error);
      }
    }
    return { hasPurchases: false };
  };

  const calculateRefund = async () => {
    if (itemType === "story") {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];
        
        const response = await fetch(
          `/api/stories/${itemId}/calculate-refund`,
          {
            method: "POST",
            credentials: 'include',
            headers: {
              "Content-Type": "application/json",
              ...(token && { 'Authorization': `Bearer ${token}` }),
            },
            body: JSON.stringify({}),
          }
        );
        if (response.ok) {
          const data = await response.json();
          return data;
        }
      } catch (error) {
        console.error("Error calculating refund:", error);
      }
    } else if (itemType === "chapter") {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];
        
        const response = await fetch(
          `/api/refunds/chapters/${itemId}/calculate-refund`,
          {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` }),
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          return data;
        }
      } catch (error) {
        console.error("Error calculating chapter refund:", error);
      }
    }
    return { hasPurchases: false, totalRefundAmount: 0, affectedPurchasers: 0 };
  };

  const handleButtonClick = async () => {
    setRefundData(null); // Reset refund data on each click
    console.log("🔘 ProtectedActionButton clicked:", {
      actionType,
      itemType,
      itemId,
      disabled,
      currentPublishStatus,
      currentPricingType,
    });

    if (disabled) {
      console.log("❌ Button is disabled, returning");
      return;
    }

    // Only check for purchases if the item is published and has paid pricing
    if (
      currentPublishStatus === "PUBLISHED" &&
      currentPricingType &&
      currentPricingType !== "FREE" &&
      (actionType === "unpublish" ||
        actionType === "delete" ||
        actionType === "moveToTrash")
    ) {
      console.log("🔍 Checking purchases for published paid content");
      setIsCheckingPurchases(true);
      try {
        const purchaseData = await checkPurchases();
        console.log("📊 Purchase data:", purchaseData);

        if (purchaseData.hasPurchases) {
          console.log("💰 Has purchases, calculating refund");
          const refundData = await calculateRefund();
          console.log("💰 Refund data:", refundData);
          setRefundData({
            ...refundData,
            itemTitle,
            itemType,
          });
          setShowRefundModal(true);
          return;
        } else {
          console.log("✅ No purchases found, proceeding with action");
        }
      } catch (error) {
        console.error("❌ Error checking purchases:", error);
        toast.error("Error checking purchases. Please try again.");
        return; // Don't proceed if there's an error
      } finally {
        setIsCheckingPurchases(false);
      }
    } else {
      console.log("⚡ Skipping purchase check - free content or draft status");
    }

    // If no purchases or free content, proceed with action
    console.log("🚀 Calling onAction callback");
    onAction();
  };

  const handleRefundConfirm = async () => {
    try {
      await onAction();
      setShowRefundModal(false);
      toast.success(
        `${
          itemType === "story" ? "Story" : "Chapter"
        } unpublished successfully with refunds processed.`
      );
    } catch (error) {
      console.error("Error during action:", error);
      toast.error("Failed to complete action. Please try again.");
    }
  };

  return (
    <>
      <Button
        onClick={handleButtonClick}
        disabled={disabled || isCheckingPurchases}
        className={className}
        variant={getActionVariant()}
      >
        {isCheckingPurchases ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Checking...
          </>
        ) : (
          <>
            {getActionIcon()}
            {getActionLabel()}
          </>
        )}
      </Button>

      {refundData && (
        <RefundConfirmationModal
          isOpen={showRefundModal}
          onClose={() => setShowRefundModal(false)}
          onConfirm={handleRefundConfirm}
          refundData={refundData}
          isLoading={isCheckingPurchases}
        />
      )}
    </>
  );
}
