"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/Select";
// Using standard HTML elements instead of missing UI components
import {
  Star,
  Eye,
  Heart,
  Calendar,
  TrendingUp,
  Plus,
  BookOpen,
  Check,
  X,
  Search,
  Filter,
} from "lucide-react";
import {
  bookInsightsService,
  BookInsight,
  BookInsightsData,
} from "@/services/bookInsightsService";
import { adminHomepageService } from "@/services/adminHomepageService";
import { bookSectionCache } from "@/services/bookSectionCache";
import { toast } from "react-hot-toast";

interface BookInsightsDashboardProps {
  onAddToSection?: (book: BookInsight, sectionType: string) => void;
}

const BookInsightsDashboard: React.FC<BookInsightsDashboardProps> = ({
  onAddToSection,
}) => {
  const [insightsData, setInsightsData] = useState<BookInsightsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [addingToSection, setAddingToSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("top-rated");
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [selectedBookForSection, setSelectedBookForSection] =
    useState<BookInsight | null>(null);
  const [selectedSectionType, setSelectedSectionType] = useState<string>("");
  const [bookSections, setBookSections] = useState<Record<string, string[]>>(
    {}
  );
  const [removingFromSection, setRemovingFromSection] = useState<string | null>(
    null
  );
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedBookForRemoval, setSelectedBookForRemoval] =
    useState<BookInsight | null>(null);
  const [selectedRemovalSections, setSelectedRemovalSections] = useState<
    string[]
  >([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [minRating, setMinRating] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<"rating" | "views" | "date" | "likes">(
    "rating"
  );
  const [sectionStatus, setSectionStatus] = useState<
    "all" | "added" | "not-added"
  >("all");
  const [showFilters, setShowFilters] = useState(false);

  const SECTION_TYPES = [
    { value: "NEW_RELEASES", label: "New Releases" },
    { value: "RECOMMENDED_FOR_YOU", label: "Recommended For You" },
    { value: "WEEKLY_FEATURES", label: "Weekly Features" },
    { value: "BEST_OF_ALL_TIME", label: "Best of All Time" },
    { value: "BEST_RATING", label: "Best Rating" },
    { value: "TRENDING_NOW", label: "Trending Now" },
    { value: "HOMEPAGE_CAROUSEL", label: "Homepage Carousel" },
    { value: "ADVENTURE", label: "Adventure" },
    { value: "COMEDY", label: "Comedy" },
    { value: "DRAMA", label: "Drama" },
    { value: "FANTASY", label: "Fantasy" },
    { value: "HORROR", label: "Horror" },
    { value: "MYSTERY", label: "Mystery" },
    { value: "ROMANCE", label: "Romance" },
    { value: "SCIENCE_FICTION", label: "Science Fiction" },
    { value: "THRILLER", label: "Thriller" },
    { value: "YOUNG_ADULT", label: "Young Adult" },
  ];

  // Load book sections for all books with caching
  const loadBookSections = async () => {
    if (!insightsData) return;

    const allBooks = [
      ...insightsData.topRated,
      ...insightsData.mostReadWeekly,
      ...insightsData.newReleases,
    ];

    const sectionsMap: Record<string, string[]> = {};
    const booksToFetch: BookInsight[] = [];

    // First, try to get sections from cache
    for (const book of allBooks) {
      const cachedSections = bookSectionCache.get(book.id);
      if (cachedSections !== null) {
        sectionsMap[book.id] = cachedSections;
      } else {
        booksToFetch.push(book);
      }
    }

    // Update UI immediately with cached data
    setBookSections(sectionsMap);

    // Fetch missing sections from API
    if (booksToFetch.length > 0) {
      const fetchPromises = booksToFetch.map(async (book) => {
        try {
          const sections = await adminHomepageService.getBookSections(book.id);
          bookSectionCache.set(book.id, sections);
          return { bookId: book.id, sections };
        } catch (error) {
          console.error(`Error loading sections for book ${book.id}:`, error);
          bookSectionCache.set(book.id, []);
          return { bookId: book.id, sections: [] };
        }
      });

      const results = await Promise.all(fetchPromises);

      // Update state with fresh data
      const updatedSectionsMap = { ...sectionsMap };
      results.forEach(({ bookId, sections }) => {
        updatedSectionsMap[bookId] = sections;
      });

      setBookSections(updatedSectionsMap);
    }
  };

  useEffect(() => {
    loadInsightsData();
  }, []);

  useEffect(() => {
    if (insightsData) {
      loadBookSections();
    }
  }, [insightsData]);

  const loadInsightsData = async (clearCache: boolean = false) => {
    try {
      setLoading(true);

      // Clear cache if requested
      if (clearCache) {
        bookSectionCache.clear();
        setBookSections({});
      }

      const data = await bookInsightsService.getBookInsightsDashboard();
      setInsightsData(data);
    } catch (error) {
      console.error("Error loading insights data:", error);
      toast.error("Failed to load book insights");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort books based on current filter criteria
  const filterBooks = (books: BookInsight[]): BookInsight[] => {
    let filtered = books;

    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          (book.author?.displayName || '').toLowerCase().includes(query) ||
          (book.category?.name || '').toLowerCase().includes(query)
      );
    }

    // Apply genre filter
    if (selectedGenre) {
      filtered = filtered.filter(
        (book) => book.category?.name === selectedGenre
      );
    }

    // Apply minimum rating filter
    if (minRating !== "") {
      filtered = filtered.filter(
        (book) => book.averageRating >= Number(minRating)
      );
    }

    // Apply section status filter
    if (sectionStatus !== "all") {
      filtered = filtered.filter((book) => {
        const sections = bookSections[book.id] || [];
        const isInSection = sections.length > 0;
        return sectionStatus === "added" ? isInSection : !isInSection;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.averageRating - a.averageRating;
        case "views":
          return b.totalViews - a.totalViews;
        case "date":
          return (
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
          );
        case "likes":
          return b.totalLikes - a.totalLikes;
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Get unique genres from all books
  const getAvailableGenres = (): string[] => {
    if (!insightsData) return [];

    const allBooks = [
      ...insightsData.topRated,
      ...insightsData.mostReadWeekly,
      ...insightsData.newReleases,
      ...Object.values(insightsData.byGenre).flat(),
    ];

    const genres = new Set(allBooks.map((book) => book.category?.name).filter(Boolean));
    return Array.from(genres).sort();
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedGenre("");
    setMinRating("");
    setSortBy("rating");
    setSectionStatus("all");
  };

  const handleAddToHome = (book: BookInsight) => {
    setSelectedBookForSection(book);
    setShowSectionModal(true);
  };

  const handleRemoveFromHome = (book: BookInsight) => {
    const sections = bookSections[book.id] || [];
    if (sections.length === 0) return;

    setSelectedBookForRemoval(book);
    setSelectedRemovalSections([]);
    setShowRemoveModal(true);
  };

  const handleRemovalConfirm = async () => {
    if (!selectedBookForRemoval || selectedRemovalSections.length === 0) return;

    setRemovingFromSection(selectedBookForRemoval.id);

    // Optimistic update - immediately update UI
    bookSectionCache.removeFromSections(
      selectedBookForRemoval.id,
      selectedRemovalSections
    );
    const updatedSections = { ...bookSections };
    const currentSections = updatedSections[selectedBookForRemoval.id] || [];
    updatedSections[selectedBookForRemoval.id] = currentSections.filter(
      (section) => !selectedRemovalSections.includes(section)
    );
    setBookSections(updatedSections);

    try {
      for (const sectionType of selectedRemovalSections) {
        try {
          // Get featured content for this section to find the specific featured content ID
          const featuredContent = await adminHomepageService.getFeaturedContent(
            sectionType,
            0,
            1000
          );
          const bookFeaturedContent = featuredContent.content.find(
            (item) => item.story.id === selectedBookForRemoval.id
          );

          if (bookFeaturedContent) {
            await adminHomepageService.removeFromFeaturedContent(
              bookFeaturedContent.id,
              selectedBookForRemoval.id
            );
          }
        } catch (error) {
          console.error(`Error removing book from ${sectionType}:`, error);
        }
      }

      const sectionLabels = selectedRemovalSections
        .map((sectionValue) => {
          const section = SECTION_TYPES.find((s) => s.value === sectionValue);
          return section?.label || sectionValue;
        })
        .join(", ");

      toast.success(
        `"${selectedBookForRemoval.title}" removed from ${sectionLabels} successfully!`
      );
      setShowRemoveModal(false);
      setSelectedBookForRemoval(null);
      setSelectedRemovalSections([]);

      // Invalidate cache for this book to ensure fresh data on next load
      bookSectionCache.remove(selectedBookForRemoval.id);

      // Refresh from server to ensure consistency
      setTimeout(() => {
        bookSectionCache.remove(selectedBookForRemoval.id);
        loadBookSections();
      }, 1000);
    } catch (error) {
      console.error("Error removing book from sections:", error);
      toast.error("Failed to remove book from sections");

      // Revert optimistic update on error
      bookSectionCache.remove(selectedBookForRemoval.id);
      await loadBookSections();
    } finally {
      setRemovingFromSection(null);
    }
  };

  const handleRemovalModalClose = () => {
    setShowRemoveModal(false);
    setSelectedBookForRemoval(null);
    setSelectedRemovalSections([]);
  };

  const toggleRemovalSection = (sectionValue: string) => {
    setSelectedRemovalSections((prev) =>
      prev.includes(sectionValue)
        ? prev.filter((s) => s !== sectionValue)
        : [...prev, sectionValue]
    );
  };

  const handleSectionSelect = async () => {
    if (!selectedBookForSection || !selectedSectionType) return;

    setAddingToSection(selectedBookForSection.id);

    // Optimistic update - immediately update UI
    bookSectionCache.addToSection(
      selectedBookForSection.id,
      selectedSectionType
    );
    const updatedSections = { ...bookSections };
    const currentSections = updatedSections[selectedBookForSection.id] || [];
    if (!currentSections.includes(selectedSectionType)) {
      updatedSections[selectedBookForSection.id] = [
        ...currentSections,
        selectedSectionType,
      ];
      setBookSections(updatedSections);
    }

    try {
      // Try to add to backend
      if (onAddToSection) {
        await onAddToSection(selectedBookForSection, selectedSectionType, 30); // 30 days duration
      } else {
        // Fallback to adminHomepageService
        await adminHomepageService.addToFeaturedContent(
          selectedBookForSection.id,
          selectedSectionType,
          30
        );
      }

      toast.success(
        `${selectedBookForSection.title} added to ${
          SECTION_TYPES.find((s) => s.value === selectedSectionType)?.label
        } section successfully!`
      );
      setShowSectionModal(false);
      setSelectedBookForSection(null);
      setSelectedSectionType("");

      // Invalidate cache for this book to ensure fresh data on next load
      bookSectionCache.remove(selectedBookForSection.id);

      // Refresh from server to ensure consistency
      setTimeout(() => {
        bookSectionCache.remove(selectedBookForSection.id);
        loadBookSections();
      }, 1000);
    } catch (error) {
      console.error("Error adding book to section:", error);
      toast.error("Failed to add book to section");

      // Revert optimistic update on error
      bookSectionCache.remove(selectedBookForSection.id);
      await loadBookSections();
    } finally {
      setAddingToSection(null);
    }
  };

  const handleModalClose = () => {
    setShowSectionModal(false);
    setSelectedBookForSection(null);
    setSelectedSectionType("");
  };

  const formatNumber = (num: number | undefined | null): string => {
    if (num == null || num === undefined) {
      return "0";
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const BookCard: React.FC<{
    book: BookInsight;
    showAddButton?: boolean;
    sectionType?: string;
    showWeeklyStats?: boolean;
  }> = ({
    book,
    showAddButton = true,
    sectionType = "weekly_features",
    showWeeklyStats = false,
  }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="w-16 h-20 bg-gray-200 rounded-md flex-shrink-0 overflow-hidden">
            {book.coverImageUrl ? (
              <img
                src={book.coverImageUrl}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{book.title}</h4>
            <p className="text-xs text-gray-600 truncate">
              by {book.author?.displayName || 'Unknown Author'}
            </p>

            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {book.category?.name || 'Uncategorized'}
              </Badge>
            </div>

            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span>{(book.averageRating || 0).toFixed(1)}</span>
              </div>

              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>
                  {showWeeklyStats
                    ? formatNumber(book.weeklyViews)
                    : formatNumber(book.totalViews)}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                <span>
                  {showWeeklyStats
                    ? formatNumber(book.weeklyLikes)
                    : formatNumber(book.totalLikes)}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(book.publishedAt)}</span>
              </div>
            </div>

            {showAddButton && (
              <div className="flex gap-2 mt-2">
                {(bookSections[book.id]?.length || 0) > 0 ? (
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleAddToHome(book)}
                      disabled={addingToSection === book.id}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {addingToSection === book.id
                        ? "Adding..."
                        : "Add to More"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => handleRemoveFromHome(book)}
                      disabled={removingFromSection === book.id}
                    >
                      <X className="w-3 h-3 mr-1" />
                      {removingFromSection === book.id
                        ? "Removing..."
                        : "Remove"}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => handleAddToHome(book)}
                    disabled={addingToSection === book.id}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {addingToSection === book.id
                      ? "Adding..."
                      : "Add to Homepage Section"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div
                      key={j}
                      className="h-20 bg-gray-100 rounded animate-pulse"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!insightsData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load book insights</p>
        <Button onClick={loadInsightsData} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Book Insights Dashboard</h2>
          <p className="text-gray-600">
            Analytics and performance metrics for intelligent content curation
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <Button onClick={() => loadInsightsData(false)} variant="outline">
            Refresh Data
          </Button>
          <Button
            onClick={() => loadInsightsData(true)}
            variant="outline"
            className="text-orange-600 border-orange-300 hover:bg-orange-50"
          >
            Clear Cache & Refresh
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by title, author, or genre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Genre Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Genre
                </label>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Genres</option>
                  {getAvailableGenres().map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Minimum Rating Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Min Rating
                </label>
                <select
                  value={minRating}
                  onChange={(e) =>
                    setMinRating(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Any Rating</option>
                  <option value="1">1+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as "rating" | "views" | "date" | "likes"
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="rating">Highest Rating</option>
                  <option value="views">Most Views</option>
                  <option value="date">Newest First</option>
                  <option value="likes">Most Likes</option>
                </select>
              </div>

              {/* Section Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Section Status
                </label>
                <select
                  value={sectionStatus}
                  onChange={(e) =>
                    setSectionStatus(
                      e.target.value as "all" | "added" | "not-added"
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Books</option>
                  <option value="added">Added to Section</option>
                  <option value="not-added">Not Added to Section</option>
                </select>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {searchQuery ||
                selectedGenre ||
                minRating !== "" ||
                sectionStatus !== "all" ? (
                  <span>Filters active</span>
                ) : (
                  <span>No filters applied</span>
                )}
              </div>
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className="text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Top Rated</p>
                <p className="text-xl font-bold">
                  {insightsData.topRated.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Weekly Trending</p>
                <p className="text-xl font-bold">
                  {insightsData.mostReadWeekly.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">New Releases</p>
                <p className="text-xl font-bold">
                  {insightsData.newReleases.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Total Genres</p>
                <p className="text-xl font-bold">
                  {Object.keys(insightsData.byGenre).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <div className="space-y-4">
        <div className="flex border-b border-gray-200 mb-4">
          {[
            { key: "top-rated", label: "Top Rated" },
            { key: "weekly-trending", label: "Weekly Trending" },
            { key: "new-releases", label: "New Releases" },
            { key: "by-genre", label: "By Genre" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "top-rated" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Highest Rated Books
                <Badge variant="secondary" className="ml-2">
                  {filterBooks(insightsData.topRated).length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filterBooks(insightsData.topRated).map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    sectionType="BEST_RATING"
                  />
                ))}
              </div>
              {filterBooks(insightsData.topRated).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No books match your current filters</p>
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="mt-2"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "weekly-trending" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Most Read This Week
                <Badge variant="secondary" className="ml-2">
                  {filterBooks(insightsData.mostReadWeekly).length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filterBooks(insightsData.mostReadWeekly).map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    sectionType="WEEKLY_FEATURES"
                    showWeeklyStats={true}
                  />
                ))}
              </div>
              {filterBooks(insightsData.mostReadWeekly).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No books match your current filters</p>
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="mt-2"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "new-releases" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Latest Published Books
                <Badge variant="secondary" className="ml-2">
                  {filterBooks(insightsData.newReleases).length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filterBooks(insightsData.newReleases).map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    sectionType="NEW_RELEASES"
                  />
                ))}
              </div>
              {filterBooks(insightsData.newReleases).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No books match your current filters</p>
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="mt-2"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "by-genre" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(insightsData.byGenre)
              .map(([genre, books]) => ({ genre, books: filterBooks(books) }))
              .filter(({ books }) => books.length > 0)
              .map(({ genre, books }) => (
                <Card key={genre}>
                  <CardHeader>
                    <CardTitle className="capitalize flex items-center gap-2">
                      {genre} Books
                      <Badge variant="secondary" className="ml-2">
                        {books.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {books.map((book) => (
                        <BookCard
                          key={book.id}
                          book={book}
                          sectionType={genre.toUpperCase()}
                          compact={true}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            {Object.entries(insightsData.byGenre)
              .map(([genre, books]) => ({ genre, books: filterBooks(books) }))
              .filter(({ books }) => books.length > 0).length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No books match your current filters</p>
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="mt-2"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section Selection Modal */}
      <Dialog open={showSectionModal} onOpenChange={handleModalClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Homepage Section</DialogTitle>
            <DialogDescription>
              Select which section to add "{selectedBookForSection?.title}" to:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedBookForSection &&
              (bookSections[selectedBookForSection.id]?.length || 0) > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    Currently in sections:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(bookSections[selectedBookForSection.id] || []).map(
                      (sectionValue) => {
                        const section = SECTION_TYPES.find(
                          (s) => s.value === sectionValue
                        );
                        return (
                          <Badge
                            key={sectionValue}
                            variant="secondary"
                            className="text-xs"
                          >
                            {section?.label || sectionValue}
                          </Badge>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

            <Select
              value={selectedSectionType}
              onChange={setSelectedSectionType}
              options={SECTION_TYPES.filter(
                (section) =>
                  !selectedBookForSection ||
                  !(bookSections[selectedBookForSection.id] || []).includes(
                    section.value
                  )
              )}
              placeholder="Choose a section..."
              label="Section"
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleModalClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSectionSelect}
                disabled={
                  !selectedSectionType ||
                  addingToSection === selectedBookForSection?.id
                }
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {addingToSection === selectedBookForSection?.id
                  ? "Adding..."
                  : "Add to Section"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove from Sections Modal */}
      <Dialog open={showRemoveModal} onOpenChange={handleRemovalModalClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from Homepage Sections</DialogTitle>
            <DialogDescription>
              Select which sections to remove "{selectedBookForRemoval?.title}"
              from:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedBookForRemoval &&
              (bookSections[selectedBookForRemoval.id]?.length || 0) > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">
                    Currently in sections:
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(bookSections[selectedBookForRemoval.id] || []).map(
                      (sectionValue) => {
                        const section = SECTION_TYPES.find(
                          (s) => s.value === sectionValue
                        );
                        const isSelected =
                          selectedRemovalSections.includes(sectionValue);
                        return (
                          <div
                            key={sectionValue}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? "border-red-300 bg-red-50"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                            onClick={() => toggleRemovalSection(sectionValue)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {section?.label || sectionValue}
                              </span>
                              {isSelected && (
                                <Check className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                  {selectedRemovalSections.length > 0 && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Selected for removal:</strong>{" "}
                        {selectedRemovalSections.length} section(s)
                      </p>
                    </div>
                  )}
                </div>
              )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleRemovalModalClose}>
                Cancel
              </Button>
              <Button
                onClick={handleRemovalConfirm}
                disabled={
                  selectedRemovalSections.length === 0 ||
                  removingFromSection === selectedBookForRemoval?.id
                }
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {removingFromSection === selectedBookForRemoval?.id
                  ? "Removing..."
                  : `Remove from ${selectedRemovalSections.length} Section(s)`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookInsightsDashboard;
