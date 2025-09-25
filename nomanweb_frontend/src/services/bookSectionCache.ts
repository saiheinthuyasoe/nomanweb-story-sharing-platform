interface BookSectionCache {
  [bookId: string]: {
    sections: string[];
    timestamp: number;
    ttl: number; // Time to live in milliseconds
  };
}

class BookSectionCacheService {
  private cache: BookSectionCache = {};
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly STORAGE_KEY = "book_sections_cache";

  constructor() {
    // Only load from storage on client side
    if (typeof window !== "undefined") {
      this.loadFromStorage();
    }
  }

  // Load cache from localStorage on initialization
  private loadFromStorage(): void {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsedCache = JSON.parse(stored);
        // Filter out expired entries
        const now = Date.now();
        this.cache = Object.fromEntries(
          Object.entries(parsedCache).filter(
            ([, value]: [string, any]) => now < value.timestamp + value.ttl
          )
        );
      }
    } catch (error) {
      console.warn("Failed to load book sections cache from storage:", error);
      this.cache = {};
    }
  }

  // Save cache to localStorage
  private saveToStorage(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn("Failed to save book sections cache to storage:", error);
    }
  }

  // Get sections for a book from cache
  get(bookId: string): string[] | null {
    const entry = this.cache[bookId];
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.timestamp + entry.ttl) {
      // Entry expired, remove it
      delete this.cache[bookId];
      this.saveToStorage();
      return null;
    }

    return entry.sections;
  }

  // Set sections for a book in cache
  set(
    bookId: string,
    sections: string[],
    ttl: number = this.DEFAULT_TTL
  ): void {
    this.cache[bookId] = {
      sections: [...sections], // Create a copy to avoid reference issues
      timestamp: Date.now(),
      ttl,
    };
    this.saveToStorage();
  }

  // Check if a book has cached sections
  has(bookId: string): boolean {
    return this.get(bookId) !== null;
  }

  // Remove a specific book from cache
  remove(bookId: string): void {
    delete this.cache[bookId];
    this.saveToStorage();
  }

  // Clear all cache
  clear(): void {
    this.cache = {};
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  // Get multiple books' sections from cache
  getMultiple(bookIds: string[]): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const bookId of bookIds) {
      const sections = this.get(bookId);
      if (sections !== null) {
        result[bookId] = sections;
      }
    }
    return result;
  }

  // Set multiple books' sections in cache
  setMultiple(
    bookSections: Record<string, string[]>,
    ttl: number = this.DEFAULT_TTL
  ): void {
    for (const [bookId, sections] of Object.entries(bookSections)) {
      this.set(bookId, sections, ttl);
    }
  }

  // Optimistically update cache when adding a book to a section
  addToSection(bookId: string, sectionType: string): void {
    const currentSections = this.get(bookId) || [];
    if (!currentSections.includes(sectionType)) {
      this.set(bookId, [...currentSections, sectionType]);
    }
  }

  // Optimistically update cache when removing a book from sections
  removeFromSections(bookId: string, sectionTypes: string[]): void {
    const currentSections = this.get(bookId) || [];
    const updatedSections = currentSections.filter(
      (section) => !sectionTypes.includes(section)
    );
    this.set(bookId, updatedSections);
  }

  // Get cache statistics for debugging
  getStats(): {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
  } {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of Object.values(this.cache)) {
      if (now <= entry.timestamp + entry.ttl) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: Object.keys(this.cache).length,
      validEntries,
      expiredEntries,
    };
  }
}

export const bookSectionCache = new BookSectionCacheService();
export type { BookSectionCache };
