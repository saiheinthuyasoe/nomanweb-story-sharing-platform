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
  private baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/api$/, '');

  private getAuthHeaders() {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      throw new Error('Admin authentication required. Please log in.');
    }
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
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
        throw new Error('Authentication required. Please log in to access admin features.');
      }

      if (!response.ok) {
        console.warn(`API request failed with status ${response.status}, falling back to mock data`);
        return this.getMockTopRatedBooks(limit);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.message.includes('authentication')) {
        throw error; // Re-throw authentication errors
      }
      console.error("Error fetching top-rated books:", error);
      return this.getMockTopRatedBooks(limit);
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
        throw new Error('Authentication required. Please log in to access admin features.');
      }

      if (!response.ok) {
        console.warn(`API request failed with status ${response.status}, falling back to mock data`);
        return this.getMockMostReadWeekly(limit);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.message.includes('authentication')) {
        throw error; // Re-throw authentication errors
      }
      console.error("Error fetching most read weekly:", error);
      return this.getMockMostReadWeekly(limit);
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
        throw new Error('Authentication required. Please log in to access admin features.');
      }

      if (!response.ok) {
        console.warn(`API request failed with status ${response.status}, falling back to mock data`);
        return this.getMockNewReleases(limit);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.message.includes('authentication')) {
        throw error; // Re-throw authentication errors
      }
      console.error("Error fetching new releases:", error);
      return this.getMockNewReleases(limit);
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

      if (!response.ok) {
        return this.getMockBooksByGenre(genreId, limit);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching books by genre:", error);
      return this.getMockBooksByGenre(genreId, limit);
    }
  }

  // Get comprehensive book insights dashboard
  async getBookInsightsDashboard(): Promise<BookInsightsData> {
    try {
      const [topRated, mostReadWeekly, newReleases] = await Promise.all([
        this.getTopRatedBooks(10),
        this.getMostReadWeekly(10),
        this.getNewReleases(10)
      ]);

      return {
        topRated,
        mostReadWeekly,
        newReleases,
        mostShared: await this.getMockMostShared(10),
        byGenre: {
          fantasy: await this.getBooksByGenre("fantasy", 5),
          romance: await this.getBooksByGenre("romance", 5),
          mystery: await this.getBooksByGenre("mystery", 5),
          scifi: await this.getBooksByGenre("sci-fi", 5)
        }
      };
    } catch (error) {
      console.error("Error fetching book insights dashboard:", error);
      return this.getMockBookInsightsDashboard();
    }
  }

  // Get suggested books for a specific section
  async getSuggestedBooks(criteria: SuggestionCriteria): Promise<BookInsight[]> {
    const { sectionType, limit = 5, genreFilter, minRating, minViews } = criteria;

    try {
      const queryParams = new URLSearchParams({
        sectionType,
        limit: limit.toString(),
        ...(genreFilter && { genre: genreFilter }),
        ...(minRating && { minRating: minRating.toString() }),
        ...(minViews && { minViews: minViews.toString() })
      });

      const response = await fetch(
        `${this.baseUrl}/api/admin/insights/suggestions?${queryParams}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to access admin features.');
      }

      if (!response.ok) {
        console.warn(`API request failed with status ${response.status}, falling back to mock data`);
        return this.getMockSuggestedBooks(criteria);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.message.includes('authentication')) {
        throw error; // Re-throw authentication errors
      }
      console.error("Error fetching suggested books:", error);
      return this.getMockSuggestedBooks(criteria);
    }
  }

  // Search books with advanced filters
  async searchBooksWithFilters(
    query: string,
    filters: {
      sortBy?: 'rating' | 'views' | 'date' | 'likes';
      genre?: string;
      minRating?: number;
      dateRange?: 'week' | 'month' | 'year' | 'all';
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
        ...(filters.dateRange && { dateRange: filters.dateRange })
      });

      const response = await fetch(
        `${this.baseUrl}/api/admin/insights/search?${queryParams}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        return this.getMockSearchResults(query, filters, page, size);
      }

      return await response.json();
    } catch (error) {
      console.error("Error searching books with filters:", error);
      return this.getMockSearchResults(query, filters, page, size);
    }
  }

  // Mock data methods for development
  private getMockTopRatedBooks(limit: number): BookInsight[] {
    const mockBooks: BookInsight[] = [
      {
        id: "top-1",
        title: "The Enchanted Chronicles",
        author: { displayName: "Sarah Mitchell", username: "saiheinthuyasoe" },
        coverImageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop",
        category: { id: "fantasy", name: "Fantasy" },
        totalViews: 4370,
        totalLikes: 331,
        averageRating: 4.9,
        chapterCount: 8,
        publishedAt: "2024-01-15T10:00:00Z",
        weeklyViews: 1250,
        weeklyLikes: 89,
        trendingScore: 95
      },
      {
        id: "top-2",
        title: "Digital Hearts",
        author: { displayName: "Takashi Akio", username: "takashiakio280" },
        coverImageUrl: "https://images.unsplash.com/photo-1520637836862-4d197d17c93a?w=400",
        category: { id: "romance", name: "Romance" },
        totalViews: 5377,
        totalLikes: 470,
        averageRating: 4.8,
        chapterCount: 11,
        publishedAt: "2024-01-20T14:30:00Z",
        weeklyViews: 1180,
        weeklyLikes: 95,
        trendingScore: 92
      },
      {
        id: "top-3",
        title: "The Silent Observer",
        author: { displayName: "Zaia Gaming", username: "zaiaegaming" },
        coverImageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=280&fit=crop",
        category: { id: "mystery", name: "Mystery" },
        totalViews: 3821,
        totalLikes: 334,
        averageRating: 4.7,
        chapterCount: 7,
        publishedAt: "2024-01-10T09:15:00Z",
        weeklyViews: 980,
        weeklyLikes: 76,
        trendingScore: 88
      }
    ];

    return mockBooks.slice(0, limit);
  }

  private getMockMostReadWeekly(limit: number): BookInsight[] {
    const mockBooks: BookInsight[] = [
      {
        id: "weekly-1",
        title: "Digital Hearts",
        author: { displayName: "Takashi Akio", username: "takashiakio280" },
        coverImageUrl: "https://images.unsplash.com/photo-1520637836862-4d197d17c93a?w=400",
        category: { id: "romance", name: "Romance" },
        totalViews: 5377,
        totalLikes: 470,
        averageRating: 4.8,
        chapterCount: 11,
        publishedAt: "2024-01-20T14:30:00Z",
        weeklyViews: 2100,
        weeklyLikes: 156,
        trendingScore: 98
      },
      {
        id: "weekly-2",
        title: "The Enchanted Chronicles",
        author: { displayName: "Sarah Mitchell", username: "saiheinthuyasoe" },
        coverImageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop",
        category: { id: "fantasy", name: "Fantasy" },
        totalViews: 4370,
        totalLikes: 331,
        averageRating: 4.9,
        chapterCount: 8,
        publishedAt: "2024-01-15T10:00:00Z",
        weeklyViews: 1850,
        weeklyLikes: 142,
        trendingScore: 94
      }
    ];

    return mockBooks.slice(0, limit);
  }

  private getMockNewReleases(limit: number): BookInsight[] {
    const mockBooks: BookInsight[] = [
      {
        id: "new-1",
        title: "Echoes of the Past",
        author: { displayName: "Zaia Gaming", username: "zaiaegaming" },
        coverImageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=280&fit=crop",
        category: { id: "mystery", name: "Mystery" },
        totalViews: 1250,
        totalLikes: 89,
        averageRating: 4.6,
        chapterCount: 6,
        publishedAt: "2024-01-25T16:45:00Z",
        weeklyViews: 1250,
        weeklyLikes: 89,
        trendingScore: 85
      }
    ];

    return mockBooks.slice(0, limit);
  }

  private getMockBooksByGenre(genreId: string, limit: number): BookInsight[] {
    const genreBooks: Record<string, BookInsight[]> = {
      fantasy: [
        {
          id: "fantasy-1",
          title: "The Enchanted Chronicles",
          author: { displayName: "Sarah Mitchell", username: "saiheinthuyasoe" },
          coverImageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop",
          category: { id: "fantasy", name: "Fantasy" },
          totalViews: 4370,
          totalLikes: 331,
          averageRating: 4.9,
          chapterCount: 8,
          publishedAt: "2024-01-15T10:00:00Z",
          weeklyViews: 1250,
          weeklyLikes: 89,
          trendingScore: 95
        }
      ],
      romance: [
        {
          id: "romance-1",
          title: "Digital Hearts",
          author: { displayName: "Takashi Akio", username: "takashiakio280" },
          coverImageUrl: "https://images.unsplash.com/photo-1520637836862-4d197d17c93a?w=400",
          category: { id: "romance", name: "Romance" },
          totalViews: 5377,
          totalLikes: 470,
          averageRating: 4.8,
          chapterCount: 11,
          publishedAt: "2024-01-20T14:30:00Z",
          weeklyViews: 1180,
          weeklyLikes: 95,
          trendingScore: 92
        }
      ]
    };

    return (genreBooks[genreId] || []).slice(0, limit);
  }

  private async getMockMostShared(limit: number): Promise<BookInsight[]> {
    return this.getMockTopRatedBooks(limit);
  }

  private getMockBookInsightsDashboard(): BookInsightsData {
    return {
      topRated: this.getMockTopRatedBooks(10),
      mostReadWeekly: this.getMockMostReadWeekly(10),
      newReleases: this.getMockNewReleases(10),
      mostShared: this.getMockTopRatedBooks(10),
      byGenre: {
        fantasy: this.getMockBooksByGenre("fantasy", 5),
        romance: this.getMockBooksByGenre("romance", 5),
        mystery: this.getMockBooksByGenre("mystery", 5),
        scifi: this.getMockBooksByGenre("sci-fi", 5)
      }
    };
  }

  private getMockSuggestedBooks(criteria: SuggestionCriteria): BookInsight[] {
    const { sectionType, limit = 5 } = criteria;
    
    switch (sectionType.toLowerCase()) {
      case 'weekly_features':
        return this.getMockMostReadWeekly(limit);
      case 'best_rating':
        return this.getMockTopRatedBooks(limit);
      case 'new_releases':
        return this.getMockNewReleases(limit);
      default:
        return this.getMockTopRatedBooks(limit);
    }
  }

  private getMockSearchResults(
    query: string,
    filters: any,
    page: number,
    size: number
  ): PagedResponse<BookInsight> {
    const allBooks = [
      ...this.getMockTopRatedBooks(10),
      ...this.getMockMostReadWeekly(10),
      ...this.getMockNewReleases(10)
    ];

    const filteredBooks = allBooks.filter(book => 
      book.title.toLowerCase().includes(query.toLowerCase()) ||
      book.author.displayName.toLowerCase().includes(query.toLowerCase())
    );

    const startIndex = page * size;
    const endIndex = startIndex + size;
    const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

    return {
      content: paginatedBooks,
      totalElements: filteredBooks.length,
      totalPages: Math.ceil(filteredBooks.length / size),
      size,
      number: page
    };
  }
}

export const bookInsightsService = new BookInsightsService();
export type { BookInsight, BookInsightsData, SuggestionCriteria, PagedResponse };