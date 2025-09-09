import { Story } from "../types/story";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface HomepageSections {
  newReleases: PagedResponse<Story>;
  bestRating: PagedResponse<Story>;
  weeklyFeatures: PagedResponse<Story>;
  bestOfAllTime: PagedResponse<Story>;
  recommended: PagedResponse<Story>;
}

class HomepageService {
  private async fetchWithErrorHandling<T>(url: string): Promise<T> {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  }

  async getNewReleases(
    page: number = 0,
    size: number = 12
  ): Promise<PagedResponse<Story>> {
    return this.fetchWithErrorHandling<PagedResponse<Story>>(
      `${API_BASE_URL}/homepage/new-releases?page=${page}&size=${size}`
    );
  }

  async getBestRating(
    page: number = 0,
    size: number = 12
  ): Promise<PagedResponse<Story>> {
    return this.fetchWithErrorHandling<PagedResponse<Story>>(
      `${API_BASE_URL}/homepage/best-rating?page=${page}&size=${size}`
    );
  }

  async getWeeklyFeatures(
    page: number = 0,
    size: number = 12
  ): Promise<PagedResponse<Story>> {
    return this.fetchWithErrorHandling<PagedResponse<Story>>(
      `${API_BASE_URL}/homepage/weekly-features?page=${page}&size=${size}`
    );
  }

  async getBestOfAllTime(
    page: number = 0,
    size: number = 12
  ): Promise<PagedResponse<Story>> {
    return this.fetchWithErrorHandling<PagedResponse<Story>>(
      `${API_BASE_URL}/homepage/best-of-all-time?page=${page}&size=${size}`
    );
  }

  async getRecommended(
    page: number = 0,
    size: number = 12
  ): Promise<PagedResponse<Story>> {
    return this.fetchWithErrorHandling<PagedResponse<Story>>(
      `${API_BASE_URL}/homepage/recommended?page=${page}&size=${size}`
    );
  }

  async getStoriesBySection(
    sectionType: string,
    page: number = 0,
    size: number = 12
  ): Promise<PagedResponse<Story>> {
    return this.fetchWithErrorHandling<PagedResponse<Story>>(
      `${API_BASE_URL}/homepage/sections/${sectionType}?page=${page}&size=${size}`
    );
  }

  async getStoriesByCategory(
    categoryId: string,
    page: number = 0,
    size: number = 12
  ): Promise<PagedResponse<Story>> {
    return this.fetchWithErrorHandling<PagedResponse<Story>>(
      `${API_BASE_URL}/homepage/category/${categoryId}?page=${page}&size=${size}`
    );
  }

  async getAllHomepageSections(
    page: number = 0,
    size: number = 6
  ): Promise<HomepageSections> {
    return this.fetchWithErrorHandling<HomepageSections>(
      `${API_BASE_URL}/homepage/all-sections?page=${page}&size=${size}`
    );
  }

  async getSectionStats(): Promise<Record<string, number>> {
    return this.fetchWithErrorHandling<Record<string, number>>(
      `${API_BASE_URL}/homepage/section-stats`
    );
  }

  // Fallback method with mock data for development
  getMockStories(count: number = 6): Story[] {
    const mockStories: Story[] = [
      {
        id: "mock-1",
        title: "The Chronicles of Ethereal Realms",
        author: { username: "MysticWriter" },
        coverImageUrl:
          "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop",
        category: { name: "Fantasy" },
        totalViews: 125000,
        totalLikes: 8500,
        chapterCount: 45,
        publishStatus: "PUBLISHED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        description:
          "A young mage discovers ancient secrets that could reshape the magical world forever.",
      },
      {
        id: "mock-2",
        title: "Digital Shadows: A Cyberpunk Tale",
        author: { username: "TechNoir" },
        coverImageUrl:
          "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop",
        category: { name: "Sci-Fi" },
        totalViews: 98000,
        totalLikes: 7200,
        chapterCount: 32,
        publishStatus: "PUBLISHED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        description:
          "In a world where reality and virtual merge, a hacker uncovers a conspiracy.",
      },
      {
        id: "mock-3",
        title: "Hearts in the Royal Court",
        author: { username: "RomanceQueen" },
        coverImageUrl:
          "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop",
        category: { name: "Romance" },
        totalViews: 156000,
        totalLikes: 12000,
        chapterCount: 28,
        publishStatus: "PUBLISHED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        description:
          "A forbidden love story between a princess and her mysterious guardian.",
      },
    ];

    return mockStories.slice(0, count);
  }

  getMockHomepageData(): HomepageSections {
    const mockStories = this.getMockStories(6);
    const mockPagedResponse: PagedResponse<Story> = {
      content: mockStories,
      totalElements: mockStories.length,
      totalPages: 1,
      size: 6,
      number: 0,
      first: true,
      last: true,
    };

    return {
      newReleases: mockPagedResponse,
      bestRating: mockPagedResponse,
      weeklyFeatures: mockPagedResponse,
      bestOfAllTime: mockPagedResponse,
      recommended: mockPagedResponse,
    };
  }
}

export const homepageService = new HomepageService();
export default homepageService;
