import Cookies from "js-cookie";

interface BookInsight {
  id: string;
  title: string;
  author: {
    displayName: string;
    username: string;
  };
  coverImageUrl?: string;
  category: {
    id: string;
    name: string;
  };
  totalViews: number;
  totalLikes: number;
  averageRating: number;
  chapterCount: number;
  publishedAt: string;
  weeklyViews: number;
  weeklyLikes: number;
  trendingScore: number;
}

interface BookInsightsData {
  topRated: BookInsight[];
  mostReadWeekly: BookInsight[];
  newReleases: BookInsight[];
  mostShared: BookInsight[];
  byGenre: Record<string, BookInsight[]>;
  allBooks: BookInsight[];
}

interface SuggestionCriteria {
  sectionType: string;
  limit?: number;
  genreFilter?: string;
  minRating?: number;
  minViews?: number;
}

interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

class BookInsightsService {
  private baseUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
  ).replace(/\/api$/, "");

  private getAuthHeaders() {
    const token = Cookies.get("adminToken");
    if (!token) {
      console.warn("No admin token found, API requests may fail");
    }
    return {
      Authorization: `Bearer ${token || ""}`,
      "Content-Type": "application/json",
    };
  }

  private handleAuthError(error: any): void {
    if (
      error instanceof Error &&
      (error.message.includes("401") || error.message.includes("Unauthorized"))
    ) {
      console.warn("Authentication failed - token may be expired or invalid");
      // Could redirect to login page or show auth modal here
    }
  }

  // Get top-rated books (highest average rating)
  async getTopRatedBooks(limit = 10): Promise<BookInsight[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/admin/insights/top-rated?limit=${limit}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (response.status === 401) {
        throw new Error(
          "Authentication required. Please log in to access admin features."
        );
      }

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.message.includes("authentication")) {
        throw error; // Re-throw authentication errors
      }
      console.error("Error fetching top-rated books:", error);
      throw error;
    }
  }

  // Get most read books this week
  async getMostReadWeekly(limit = 10): Promise<BookInsight[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/admin/insights/most-read-weekly?limit=${limit}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (response.status === 401) {
        throw new Error(
          "Authentication required. Please log in to access admin features."
        );
      }

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.message.includes("authentication")) {
        throw error; // Re-throw authentication errors
      }
      console.error("Error fetching most read weekly:", error);
      throw error;
    }
  }

  // Get newest published books
  async getNewReleases(limit = 10): Promise<BookInsight[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/admin/insights/new-releases?limit=${limit}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (response.status === 401) {
        throw new Error(
          "Authentication required. Please log in to access admin features."
        );
      }

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.message.includes("authentication")) {
        throw error; // Re-throw authentication errors
      }
      console.error("Error fetching new releases:", error);
      throw error;
    }
  }

  // Get books by genre with performance metrics
  async getBooksByGenre(genreId: string, limit = 10): Promise<BookInsight[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/admin/insights/by-genre/${genreId}?limit=${limit}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (response.status === 401) {
        this.handleAuthError(new Error("401 Unauthorized"));
        throw new Error("Authentication required");
      }

      if (!response.ok) {
        throw new Error(
          `API request failed for genre ${genreId} with status ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      this.handleAuthError(error);
      console.error("Error fetching books by genre:", error);
      throw error;
    }
  }

  // Get comprehensive book insights dashboard (cached)
  async getBookInsightsDashboard(): Promise<BookInsightsData> {
    try {
      // Use the new cached dashboard endpoint for better performance
      const response = await fetch(
        `${this.baseUrl}/api/admin/insights/dashboard`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (response.status === 401) {
        throw new Error(
          "Authentication required. Please log in to access admin features."
        );
      }

      if (!response.ok) {
        throw new Error(`Dashboard API request failed with status ${response.status}`);
      }

      const dashboardData = await response.json();
      
      // Transform the response to match the expected interface
      return {
        topRated: dashboardData.topRated || [],
        mostReadWeekly: dashboardData.mostReadWeekly || [],
        newReleases: dashboardData.newReleases || [],
        mostShared: dashboardData.mostShared || [], 
        byGenre: dashboardData.byGenre || {},
        allBooks: dashboardData.allBooks || [],
      };
    } catch (error) {
      console.error("Error fetching book insights dashboard:", error);
      // Fallback to individual API calls if dashboard endpoint fails
      console.warn("Falling back to individual API calls...");
      try {
        const [topRated, mostReadWeekly, newReleases] = await Promise.all([
          this.getTopRatedBooks(50),
          this.getMostReadWeekly(50),
          this.getNewReleases(50),
        ]);

        const byGenre = {
          fantasy: await this.getBooksByGenre("fantasy", 20),
          romance: await this.getBooksByGenre("romance", 20),
          mystery: await this.getBooksByGenre("mystery", 20),
          "sci-fi": await this.getBooksByGenre("sci-fi", 20),
          adventure: await this.getBooksByGenre("adventure", 20),
          thriller: await this.getBooksByGenre("thriller", 20),
          horror: await this.getBooksByGenre("horror", 20),
          comedy: await this.getBooksByGenre("comedy", 20),
          drama: await this.getBooksByGenre("drama", 20),
          "young-adult": await this.getBooksByGenre("young-adult", 20),
        };

        // Create allBooks by combining all unique books
        const allBooksSet = new Set();
        const allBooks: BookInsight[] = [];
        
        // Add books from main categories
        [...topRated, ...mostReadWeekly, ...newReleases].forEach(book => {
          if (!allBooksSet.has(book.id)) {
            allBooksSet.add(book.id);
            allBooks.push(book);
          }
        });
        
        // Add books from genre categories
        Object.values(byGenre).flat().forEach(book => {
          if (!allBooksSet.has(book.id)) {
            allBooksSet.add(book.id);
            allBooks.push(book);
          }
        });

        return {
          topRated,
          mostReadWeekly,
          newReleases,
          mostShared: [],
          byGenre,
          allBooks,
        };
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        throw error; // Throw original error
      }
    }
  }

  // Get suggested books for a specific section
  async getSuggestedBooks(
    criteria: SuggestionCriteria
  ): Promise<BookInsight[]> {
    const {
      sectionType,
      limit = 5,
      genreFilter,
      minRating,
      minViews,
    } = criteria;

    try {
      const queryParams = new URLSearchParams({
        sectionType,
        limit: limit.toString(),
        ...(genreFilter && { genre: genreFilter }),
        ...(minRating && { minRating: minRating.toString() }),
        ...(minViews && { minViews: minViews.toString() }),
      });

      const response = await fetch(
        `${this.baseUrl}/api/admin/insights/suggestions?${queryParams}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (response.status === 401) {
        throw new Error(
          "Authentication required. Please log in to access admin features."
        );
      }

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.message.includes("authentication")) {
        throw error; // Re-throw authentication errors
      }
      console.error("Error fetching suggested books:", error);
      throw error;
    }
  }

  // Search books with advanced filters
  async searchBooksWithFilters(
    query: string,
    filters: {
      sortBy?: "rating" | "views" | "date" | "likes";
      genre?: string;
      minRating?: number;
      dateRange?: "week" | "month" | "year" | "all";
    },
    page = 0,
    size = 10
  ): Promise<PagedResponse<BookInsight>> {
    try {
      const queryParams = new URLSearchParams({
        q: query,
        page: page.toString(),
        size: size.toString(),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.genre && { genre: filters.genre }),
        ...(filters.minRating && { minRating: filters.minRating.toString() }),
        ...(filters.dateRange && { dateRange: filters.dateRange }),
      });

      const response = await fetch(
        `${this.baseUrl}/api/admin/insights/search?${queryParams}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Search request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error searching books with filters:", error);
      throw error;
    }
  }
}

export const bookInsightsService = new BookInsightsService();
export type {
  BookInsight,
  BookInsightsData,
  SuggestionCriteria,
  PagedResponse,
};
