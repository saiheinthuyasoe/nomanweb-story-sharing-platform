import { User } from './user';

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthorInfo {
  id: string;
  username: string;
  displayName?: string;
  profileImageUrl?: string;
}

export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Story {
  id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  author: AuthorInfo;
  category?: CategoryInfo;
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'SUSPENDED';
  contentType: 'FREE' | 'PAID' | 'MIXED';
  moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  totalChapters: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalCoinsEarned: number;
  isFeatured: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface StoryPreview {
  id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  author: AuthorInfo;
  category?: CategoryInfo;
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'SUSPENDED';
  contentType: 'FREE' | 'PAID' | 'MIXED';
  totalChapters: number;
  totalViews: number;
  totalLikes: number;
  isFeatured: boolean;
  tags: string[];
  createdAt: string;
  publishedAt?: string;
}

export interface CreateStoryRequest {
  title: string;
  description?: string;
  categoryId?: string;
  contentType?: 'FREE' | 'PAID' | 'MIXED';
  tags?: string[];
  coverImageUrl?: string;
}

export interface UpdateStoryRequest {
  title?: string;
  description?: string;
  categoryId?: string;
  contentType?: 'FREE' | 'PAID' | 'MIXED';
  tags?: string[];
  coverImageUrl?: string;
}

export interface StoriesResponse {
  content: StoryPreview[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface Chapter {
  id: string;
  story: Story;
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
  coinPrice: number;
  isFree: boolean;
  status: 'DRAFT' | 'PUBLISHED';
  views: number;
  likes: number;
  moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  moderationNotes?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface Comment {
  id: string;
  user: User;
  story?: Story;
  chapter?: Chapter;
  parentComment?: Comment;
  content: string;
  likes: number;
  isPinned: boolean;
  moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  moderationNotes?: string;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}

export interface ReadingProgress {
  id: string;
  user: User;
  story: Story;
  chapter: Chapter;
  progressPercentage: number;
  lastReadAt: string;
}

export interface ReadingList {
  id: string;
  user: User;
  story: Story;
  listType: 'READING' | 'COMPLETED' | 'FAVORITE' | 'WANT_TO_READ';
  addedAt: string;
} 