export interface Author {
  id: string;
  username: string;
  displayName?: string;
  profileImageUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  storyCount?: number;
}

export interface Story {
  id: string;
  title: string;
  description?: string;
  content?: string;
  coverImageUrl?: string;
  author: Author;
  category?: Category;
  tags: string[];
  status: "DRAFT" | "PUBLISHED" | "COMPLETED" | "SUSPENDED";
  publishStatus: "DRAFT" | "PUBLISHED" | "COMPLETED" | "SUSPENDED";
  moderationStatus: "PENDING" | "APPROVED" | "REJECTED";
  bookStatus: "ONGOING" | "COMPLETED" | "HIATUS";
  pricingType: "FREE" | "PAID_PER_CHAPTER" | "WHOLE_BOOK";
  bookPrice?: number;
  defaultChapterPrice?: number;
  totalViews: number;
  totalLikes: number;
  totalChapters: number;
  totalWantToRead: number;
  totalCompleted: number;
  totalCurrentlyReading: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface StoryPreview {
  id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  author: Author;
  category?: Category;
  tags: string[];
  status: "DRAFT" | "PUBLISHED" | "COMPLETED" | "SUSPENDED";
  publishStatus: "DRAFT" | "PUBLISHED" | "COMPLETED" | "SUSPENDED";
  moderationStatus: "PENDING" | "APPROVED" | "REJECTED";
  bookStatus: "ONGOING" | "COMPLETED" | "HIATUS";
  pricingType: "FREE" | "PAID_PER_CHAPTER" | "WHOLE_BOOK";
  bookPrice?: number;
  defaultChapterPrice?: number;
  totalViews: number;
  totalLikes: number;
  totalChapters: number;
  totalWantToRead: number;
  totalCompleted: number;
  totalCurrentlyReading: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface CreateStoryRequest {
  title: string;
  description?: string;
  categoryId?: string;
  tags?: string[];
  pricingType: "FREE" | "PAID_PER_CHAPTER" | "WHOLE_BOOK";
  bookStatus: "ONGOING" | "COMPLETED" | "HIATUS";
  coverImageUrl?: string;
  bookPrice?: number;
  defaultChapterPrice?: number;
}

export interface UpdateStoryRequest {
  title?: string;
  description?: string;
  categoryId?: string;
  tags?: string[];
  pricingType?: "FREE" | "PAID_PER_CHAPTER" | "WHOLE_BOOK";
  bookStatus?: "ONGOING" | "COMPLETED" | "HIATUS";
  coverImageUrl?: string;
  bookPrice?: number;
  defaultChapterPrice?: number;
}

export interface StoriesResponse {
  content: StoryPreview[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface Comment {
  id: string;
  user: {
    id: string;
    username: string;
    profileImageUrl?: string;
  };
  content: string;
  likes: number;
  createdAt: string;
  replies?: Comment[];
}
