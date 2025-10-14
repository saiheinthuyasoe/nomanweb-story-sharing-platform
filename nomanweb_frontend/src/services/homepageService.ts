import { Story } from "../types/story";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
).replace(/\/api$/, "");

// Cache for homepage data
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Cache TTL in milliseconds
const CACHE_TTL = {
  HOMEPAGE_SECTIONS: 5 * 60 * 1000, // 5 minutes
  FEATURED_STORIES: 10 * 60 * 1000, // 10 minutes
  TRENDING_STORIES: 3 * 60 * 1000, // 3 minutes
  CATEGORY_STORIES: 15 * 60 * 1000, // 15 minutes
};

function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCachedData<T>(key: string, data: T, ttl: number): void {
  cache.set(key, { data, timestamp: Date.now(), ttl });
}

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
  carousel: PagedResponse<Story>;
  adventure: PagedResponse<Story>;
  comedy: PagedResponse<Story>;
  drama: PagedResponse<Story>;
  fantasy: PagedResponse<Story>;
  horror: PagedResponse<Story>;
  mystery: PagedResponse<Story>;
  romance: PagedResponse<Story>;
  scienceFiction: PagedResponse<Story>;
  thriller: PagedResponse<Story>;
  youngAdult: PagedResponse<Story>;
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
      `${API_BASE_URL}/api/homepage/new-releases?page=${page}&size=${size}`
    );
  }

  async getBestRating(
    page: number = 0,
    size: number = 12
  ): Promise<PagedResponse<Story>> {
    return this.fetchWithErrorHandling<PagedResponse<Story>>(
      `${API_BASE_URL}/api/homepage/best-rating?page=${page}&size=${size}`
    );
  }

  async getWeeklyFeatures(
    page: number = 0,
    size: number = 12
  ): Promise<PagedResponse<Story>> {
    return this.fetchWithErrorHandling<PagedResponse<Story>>(
      `${API_BASE_URL}/api/homepage/weekly-features?page=${page}&size=${size}`
    );
  }

  async getBestOfAllTime(
    page: number = 0,
    size: number = 12
  ): Promise<PagedResponse<Story>> {
    return this.fetchWithErrorHandling<PagedResponse<Story>>(
      `${API_BASE_URL}/api/homepage/best-of-all-time?page=${page}&size=${size}`
    );
  }

  async getRecommended(
    page: number = 0,
    size: number = 12
  ): Promise<PagedResponse<Story>> {
    return this.fetchWithErrorHandling<PagedResponse<Story>>(
      `${API_BASE_URL}/api/homepage/recommended?page=${page}&size=${size}`
    );
  }

  async getStoriesBySection(
    sectionType: string,
    page: number = 0,
    size: number = 12
  ): Promise<PagedResponse<Story>> {
    return this.fetchWithErrorHandling<PagedResponse<Story>>(
      `${API_BASE_URL}/api/homepage/sections/${sectionType}?page=${page}&size=${size}`
    );
  }

  async getStoriesByCategory(
    categoryId: string,
    page: number = 0,
    size: number = 12
  ): Promise<PagedResponse<Story>> {
    return this.fetchWithErrorHandling<PagedResponse<Story>>(
      `${API_BASE_URL}/api/homepage/category/${categoryId}?page=${page}&size=${size}`
    );
  }

  // Carousel and Genre-specific methods
  async getCarousel(
    page: number = 0,
    size: number = 12
  ): Promise<PagedResponse<Story>> {
    return this.fetchWithErrorHandling<PagedResponse<Story>>(
      `${API_BASE_URL}/api/homepage/carousel?page=${page}&size=${size}`
    );
  }

  async getAdventure(
    page: number = 0,
    size: number = 12
  ): Promise<PagedResponse<Story>> {
    return this.fetchWithErrorHandling<PagedResponse<Story>>(
      `${API_BASE_URL}/api/homepage/adventure?page=${page}&size=${size}`
    );
  }

  async getComedy(
    page: number = 0,
    size: number = 12
  ): Promise<PagedResponse<Story>> {
    return this.fetchWithErrorHandling<PagedResponse<Story>>(
      `${API_BASE_URL}/api/homepage/comedy?page=${page}&size=${size}`
    );
  }

  async getDrama(
    page: number = 0,
    size: number = 12
  ): Promise<PagedResponse<Story>> {
    return this.fetchWithErrorHandling<PagedResponse<Story>>(
      `${API_BASE_URL}/api/homepage/drama?page=${page}&size=${size}`
    );
  }

  async getFantasy(
    page: number = 0,
    size: number = 12
  ): Promise<PagedResponse<Story>> {
    return this.fetchWithErrorHandling<PagedResponse<Story>>(
      `${API_BASE_URL}/api/homepage/fantasy?page=${page}&size=${size}`
    );
  }

  async getHorror(
    page: number = 0,
    size: number = 12
  ): Promise<PagedResponse<Story>> {
    return this.fetchWithErrorHandling<PagedResponse<Story>>(
      `${API_BASE_URL}/api/homepage/horror?page=${page}&size=${size}`
    );
  }

  async getMystery(
    page: number = 0,
    size: number = 12
  ): Promise<PagedResponse<Story>> {
    return this.fetchWithErrorHandling<PagedResponse<Story>>(
      `${API_BASE_URL}/api/homepage/mystery?page=${page}&size=${size}`
    );
  }

  async getRomance(
    page: number = 0,
    size: number = 12
  ): Promise<PagedResponse<Story>> {
    return this.fetchWithErrorHandling<PagedResponse<Story>>(
      `${API_BASE_URL}/api/homepage/romance?page=${page}&size=${size}`
    );
  }

  async getScienceFiction(
    page: number = 0,
    size: number = 12
  ): Promise<PagedResponse<Story>> {
    return this.fetchWithErrorHandling<PagedResponse<Story>>(
      `${API_BASE_URL}/api/homepage/science-fiction?page=${page}&size=${size}`
    );
  }

  async getThriller(
    page: number = 0,
    size: number = 12
  ): Promise<PagedResponse<Story>> {
    return this.fetchWithErrorHandling<PagedResponse<Story>>(
      `${API_BASE_URL}/api/homepage/thriller?page=${page}&size=${size}`
    );
  }

  async getYoungAdult(
    page: number = 0,
    size: number = 12
  ): Promise<PagedResponse<Story>> {
    return this.fetchWithErrorHandling<PagedResponse<Story>>(
      `${API_BASE_URL}/api/homepage/young-adult?page=${page}&size=${size}`
    );
  }

  async getAllHomepageSections(
    page: number = 0,
    size: number = 8
  ): Promise<HomepageSections> {
    try {
      // Fetch all sections in parallel
      const [
        newReleases,
        bestRating,
        weeklyFeatures,
        bestOfAllTime,
        recommended,
        carousel,
        adventure,
        comedy,
        drama,
        fantasy,
        horror,
        mystery,
        romance,
        scienceFiction,
        thriller,
        youngAdult,
      ] = await Promise.all([
        this.getNewReleases(page, size),
        this.getBestRating(page, size),
        this.getWeeklyFeatures(page, size),
        this.getBestOfAllTime(page, size),
        this.getRecommended(page, size),
        this.getCarousel(page, size),
        this.getAdventure(page, size),
        this.getComedy(page, size),
        this.getDrama(page, size),
        this.getFantasy(page, size),
        this.getHorror(page, size),
        this.getMystery(page, size),
        this.getRomance(page, size),
        this.getScienceFiction(page, size),
        this.getThriller(page, size),
        this.getYoungAdult(page, size),
      ]);

      return {
        newReleases,
        bestRating,
        weeklyFeatures,
        bestOfAllTime,
        recommended,
        carousel,
        adventure,
        comedy,
        drama,
        fantasy,
        horror,
        mystery,
        romance,
        scienceFiction,
        thriller,
        youngAdult,
      };
    } catch (error) {
      console.error("Error fetching all homepage sections:", error);
      throw error;
    }
  }

  async getSectionStats(): Promise<Record<string, number>> {
    return this.fetchWithErrorHandling<Record<string, number>>(
      `${API_BASE_URL}/api/homepage/section-stats`
    );
  }
}

export const homepageService = new HomepageService();
export default homepageService;
