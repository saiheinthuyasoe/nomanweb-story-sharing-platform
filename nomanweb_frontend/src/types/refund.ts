export interface RefundRequest {
  storyId?: string;
  chapterId?: string;
  reason: string;
  refundType: RefundType;
}

export enum RefundType {
  STORY_DELETION = "STORY_DELETION",
  CHAPTER_DELETION = "CHAPTER_DELETION",
  STORY_UNPUBLISH = "STORY_UNPUBLISH",
  CHAPTER_UNPUBLISH = "CHAPTER_UNPUBLISH",
  PRICING_CHANGE_TO_FREE = "PRICING_CHANGE_TO_FREE",
  PRICING_CHANGE = "PRICING_CHANGE"
}

export interface RefundCalculationResponse {
  totalRefundAmount: number;
  totalBuyersCount: number;
  refundItems: RefundItem[];
}

export interface RefundItem {
  buyerUsername: string;
  buyerEmail: string;
  itemType: "BOOK" | "CHAPTER";
  itemTitle: string;
  refundAmount: number;
  purchaseDate: string;
}

export interface RefundTransaction {
  id: string;
  author: {
    id: string;
    username: string;
    email: string;
  };
  buyer: {
    id: string;
    username: string;
    email: string;
  };
  story?: {
    id: string;
    title: string;
  };
  chapter?: {
    id: string;
    title: string;
  };
  refundAmount: number;
  originalPurchaseAmount: number;
  refundType: RefundType;
  refundStatus: RefundStatus;
  reason?: string;
  adminNotes?: string;
  processedByAdmin?: {
    id: string;
    username: string;
  };
  createdAt: string;
  updatedAt?: string;
  processedAt?: string;
}

export enum RefundStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED"
}

export interface RefundListResponse {
  content: RefundTransaction[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
} 