import Cookies from "js-cookie";

interface Story {
  id: string;
  title: string;
  author: {
    displayName: string;
    username: string;
  };
  coverImageUrl?: string;
  category: string;
  totalViews: number;
  totalLikes: number;
}

interface FeaturedContent {
  id: string;
  story: Story;
  sectionType: string;
  displayOrder: number;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

interface FeaturedContentStats {
  totalActive: number;
  totalExpired: number;
  sectionCounts: Record<string, number>;
}

interface DashboardStats {
  totalStories: number;
  totalChapters: number;
  totalUsers: number;
  pendingModerations: number;
  recentActivity: number;
}

interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

class AdminHomepageService {
  private baseUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
  ).replace(/\/api$/, "");

  private getAuthHeaders() {
    const token = Cookies.get("adminToken");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  // Get featured content by section type
  async getFeaturedContent(
    sectionType: string,
    page = 0,
    size = 20
  ): Promise<PagedResponse<FeaturedContent>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/admin/featured-content/${sectionType}?page=${page}&size=${size}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching featured content:", error);
      throw error;
    }
  }

  // Check if a book is already in a specific section
  async isBookInSection(bookId: string, sectionType: string): Promise<boolean> {
    try {
      const featuredContent = await this.getFeaturedContent(
        sectionType,
        0,
        1000
      ); // Get all items
      return featuredContent.content.some((item) => item.story.id === bookId);
    } catch (error) {
      console.error("Error checking if book is in section:", error);
      return false;
    }
  }

  // Get all sections where a book is featured
  async getBookSections(bookId: string): Promise<string[]> {
    const sections = [
      "FEATURED_STORIES",
      "NEW_RELEASES",
      "RECOMMENDED_FOR_YOU",
      "WEEKLY_FEATURES",
      "BEST_OF_ALL_TIME",
      "BEST_RATING",
      "TRENDING_NOW",
      "EDITOR_CHOICE",
      "HOMEPAGE_CAROUSEL",
      "ADVENTURE",
      "COMEDY",
      "DRAMA",
      "FANTASY",
      "HORROR",
      "MYSTERY",
      "ROMANCE",
      "SCIENCE_FICTION",
      "THRILLER",
      "YOUNG_ADULT",
    ];

    const bookSections: string[] = [];

    for (const section of sections) {
      try {
        const isInSection = await this.isBookInSection(bookId, section);
        if (isInSection) {
          bookSections.push(section);
        }
      } catch (error) {
        console.error(`Error checking section ${section}:`, error);
      }
    }

    return bookSections;
  }

  // Get featured content statistics
  async getFeaturedContentStats(): Promise<FeaturedContentStats> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/admin/featured-content/stats`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching featured content stats:", error);
      throw error;
    }
  }

  // Add story to featured content
  async addToFeaturedContent(
    storyId: string,
    sectionType: string,
    duration: number = 30
  ): Promise<FeaturedContent> {
    try {
      // Validate inputs to prevent URL construction issues
      if (!sectionType || !storyId) {
        throw new Error("Section type and story ID are required");
      }
      
      // Ensure duration is a valid number
      if (typeof duration !== 'number' || isNaN(duration) || duration < 0) {
        duration = 30; // Default fallback
      }

      // Check if book is already in the section to provide better error handling
      const isAlreadyInSection = await this.isBookInSection(storyId, sectionType);
      if (isAlreadyInSection) {
        throw new Error("Story is already featured in this section");
      }

      const url = `${
        this.baseUrl
      }/api/admin/featured-content/${encodeURIComponent(
        sectionType
      )}/add/${encodeURIComponent(storyId)}`;
      const payload = { duration };

      console.log("🌐 API Call:", {
        url,
        payload,
        headers: this.getAuthHeaders(),
      });

      const response = await fetch(url, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      console.log("📡 Response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Response error:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`
        );
      }

      const result = await response.json();
      console.log("✅ API Success:", result);
      return result;
    } catch (error) {
      console.error("❌ Error adding to featured content:", error);
      throw error;
    }
  }

  // Remove from featured content
  async removeFromFeaturedContent(
    featuredId: string,
    storyId?: string
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/admin/featured-content/${featuredId}`,
        {
          method: "DELETE",
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Cache invalidation will be handled by the component
    } catch (error) {
      console.error("Error removing from featured content:", error);
      throw error;
    }
  }

  // Update display order
  async updateDisplayOrder(
    featuredId: string,
    displayOrder: number
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/admin/featured-content/${featuredId}/order?newOrder=${displayOrder}`,
        {
          method: "PUT",
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error updating display order:", error);
      throw error;
    }
  }

  // Toggle active status
  async toggleActiveStatus(featuredId: string): Promise<FeaturedContent> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/admin/featured-content/${featuredId}/toggle`,
        {
          method: "PUT",
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error toggling active status:", error);
      throw error;
    }
  }

  // Set duration for featured content
  async setDuration(
    featuredId: string,
    duration: number
  ): Promise<FeaturedContent> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/admin/featured-content/${featuredId}/duration`,
        {
          method: "PUT",
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ duration }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error setting duration:", error);
      throw error;
    }
  }

  // Clean up expired content
  async cleanupExpiredContent(): Promise<{ removedCount: number }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/admin/featured-content/cleanup`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error cleaning up expired content:", error);
      throw error;
    }
  }

  // Search stories for adding to featured content
  async searchStories(
    query: string,
    page = 0,
    size = 10
  ): Promise<PagedResponse<Story>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/stories/search?query=${encodeURIComponent(
          query
        )}&page=${page}&size=${size}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error searching stories:", error);
      throw error;
    }
  }

  // Get dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/admin/dashboard/stats`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  }
}

export const adminHomepageService = new AdminHomepageService();
export type {
  FeaturedContent,
  FeaturedContentStats,
  DashboardStats,
  Story,
  PagedResponse,
};
