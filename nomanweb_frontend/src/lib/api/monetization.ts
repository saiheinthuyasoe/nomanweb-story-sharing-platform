import { apiClient } from './client';

export interface Gift {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  coinCost: number;
  isActive: boolean;
}

export interface PurchaseChapterRequest {
  chapterId: string;
}

export interface PurchaseBookRequest {
  storyId: string;
}

export interface PurchaseResponse {
  id: string;
  totalCoins: number;
  createdAt: string;
  chaptersAtPurchase?: number; // For book purchases
  story?: {
    id: string;
    title: string;
    coverImageUrl?: string;
    pricingType?: string; // Current pricing type of the story
  };
  chapter?: {
    id: string;
    title: string;
    chapterNumber: number;
  };
}

export interface PurchasedChapter {
  id: string;
  chapterNumber: number;
  title: string;
  coinPrice: number;
  purchasedAt: string;
  story: {
    id: string;
    title: string;
    coverImageUrl?: string;
    author: {
      id: string;
      username: string;
      displayName?: string;
    };
  };
}

export interface PurchasedBook {
  id: string;
  coinPrice: number;
  purchasedAt: string;
  story: {
    id: string;
    title: string;
    coverImageUrl?: string;
    author: {
      id: string;
      username: string;
      displayName?: string;
    };
  };
}

export const monetizationApi = {
  // Chapter purchases
  async purchaseChapter(request: PurchaseChapterRequest): Promise<PurchaseResponse> {
    const response = await apiClient.post('/monetization/chapters/purchase', request);
    return response.data;
  },

  async canAccessChapter(chapterId: string): Promise<boolean> {
    const response = await apiClient.get(`/monetization/chapters/access/${chapterId}`);
    return response.data;
  },

  // Book purchases
  async purchaseBook(request: PurchaseBookRequest): Promise<PurchaseResponse> {
    const response = await apiClient.post('/monetization/books/purchase', request);
    return response.data;
  },

  async canAccessBook(storyId: string): Promise<boolean> {
    const response = await apiClient.get(`/monetization/books/access/${storyId}`);
    return response.data;
  },

  // Purchase history
  async getPurchaseHistory(page: number = 0, size: number = 20): Promise<{
    content: PurchaseResponse[];
    totalPages: number;
    totalElements: number;
  }> {
    const response = await apiClient.get('/monetization/purchases/history', {
      params: { page, size }
    });
    return response.data;
  },

  // Coin balance
  async getCoinBalance(): Promise<number> {
    const response = await apiClient.get('/monetization/balance');
    return response.data;
  },

  // Gifts
  async sendGift(request: {
    giftId: string;
    recipientId: string;
    storyId?: string;
    chapterId?: string;
    quantity: number;
    message?: string;
    customAmount?: number;
  }): Promise<any> {
    const response = await apiClient.post('/monetization/gifts/send', request);
    return response.data;
  },

  async getGifts(): Promise<Gift[]> {
    const response = await apiClient.get('/monetization/gifts');
    return response.data;
  }
};
