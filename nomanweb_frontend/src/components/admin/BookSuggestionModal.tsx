"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Using standard HTML elements instead of missing UI components
import {
  Star,
  Eye,
  Heart,
  Calendar,
  TrendingUp,
  Plus,
  BookOpen,
  Search,
  Filter,
  Clock,
} from "lucide-react";
import {
  bookInsightsService,
  BookInsight,
} from "@/services/bookInsightsService";
import { toast } from "react-hot-toast";

interface BookSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBook: (book: BookInsight) => void;
  sectionType: string;
  sectionTitle: string;
}

const BookSuggestionModal: React.FC<BookSuggestionModalProps> = ({
  isOpen,
  onClose,
  onSelectBook,
  sectionType,
  sectionTitle,
}) => {
  const [activeTab, setActiveTab] = useState("weekly-top");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [sortBy, setSortBy] = useState<"rating" | "views" | "date" | "likes">(
    "rating"
  );

  // Data states
  const [weeklyTopBooks, setWeeklyTopBooks] = useState<BookInsight[]>([]);
  const [topRatedBooks, setTopRatedBooks] = useState<BookInsight[]>([]);
  const [newReleases, setNewReleases] = useState<BookInsight[]>([]);
  const [genreBooks, setGenreBooks] = useState<BookInsight[]>([]);
  const [searchResults, setSearchResults] = useState<BookInsight[]>([]);

  const genres = [
    { id: "fantasy", name: "Fantasy" },
    { id: "romance", name: "Romance" },
    { id: "mystery", name: "Mystery" },
    { id: "sci-fi", name: "Sci-Fi" },
    { id: "thriller", name: "Thriller" },
    { id: "adventure", name: "Adventure" },
    { id: "drama", name: "Drama" },
    { id: "comedy", name: "Comedy" },
  ];

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedGenre && activeTab === "by-genre") {
      loadGenreBooks();
    }
  }, [selectedGenre, activeTab]);

  useEffect(() => {
    if (searchQuery && activeTab === "search") {
      const debounceTimer = setTimeout(() => {
        performSearch();
      }, 300);
      return () => clearTimeout(debounceTimer);
    }
  }, [searchQuery, sortBy, selectedGenre, activeTab]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [weekly, topRated, newBooks] = await Promise.all([
        bookInsightsService.getMostReadWeekly(10),
        bookInsightsService.getTopRatedBooks(10),
        bookInsightsService.getNewReleases(10),
      ]);

      setWeeklyTopBooks(weekly);
      setTopRatedBooks(topRated);
      setNewReleases(newBooks);
    } catch (error) {
      console.error("Error loading suggestion data:", error);
      toast.error("Failed to load book suggestions");
    } finally {
      setLoading(false);
    }
  };

  const loadGenreBooks = async () => {
    if (!selectedGenre) return;

    try {
      setLoading(true);
      const books = await bookInsightsService.getBooksByGenre(
        selectedGenre,
        10
      );
      setGenreBooks(books);
    } catch (error) {
      console.error("Error loading genre books:", error);
      toast.error("Failed to load genre books");
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const result = await bookInsightsService.searchBooksWithFilters(
        searchQuery,
        {
          sortBy,
          genre: selectedGenre || undefined,
          minRating: 3.0,
        },
        0,
        20
      );
      setSearchResults(result.content);
    } catch (error) {
      console.error("Error searching books:", error);
      toast.error("Failed to search books");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBook = (book: BookInsight) => {
    onSelectBook(book);
    onClose();
    toast.success(`"${book.title}" selected for ${sectionTitle}`);
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
    });
  };

  const BookCard: React.FC<{
    book: BookInsight;
    showWeeklyStats?: boolean;
  }> = ({ book, showWeeklyStats = false }) => (
    <div
      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => handleSelectBook(book)}
    >
      <div className="flex gap-3">
        <div className="w-12 h-16 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
          {book.coverImageUrl ? (
            <img
              src={book.coverImageUrl}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-gray-400" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{book.title}</h4>
          <p className="text-xs text-gray-600 truncate">
            by {book.author?.displayName || "Unknown Author"}
          </p>

          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {book.category?.name || "Uncategorized"}
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
        </div>

        <Button size="sm" variant="outline" className="h-8">
          <Plus className="w-3 h-3 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );

  const LoadingGrid = () => (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="border rounded-lg p-4 animate-pulse">
          <div className="flex gap-3">
            <div className="w-12 h-16 bg-gray-200 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Pick from Suggestions - {sectionTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="flex border-b border-gray-200 mb-4">
              {[
                { key: "weekly-top", label: "Weekly Top", icon: TrendingUp },
                { key: "highest-rated", label: "Highest Rated", icon: Star },
                { key: "new-releases", label: "New Releases", icon: Clock },
                { key: "by-genre", label: "By Genre", icon: Filter },
                { key: "search", label: "Search", icon: Search },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1 ${
                      activeTab === tab.key
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-auto mt-4">
              {activeTab === "weekly-top" && (
                <div className="mt-0">
                  <div className="mb-4">
                    <h3 className="font-semibold text-sm text-gray-700 mb-2">
                      📅 Most Read This Week
                    </h3>
                    <p className="text-xs text-gray-500">
                      Books with highest weekly view counts
                    </p>
                  </div>
                  {loading ? (
                    <LoadingGrid />
                  ) : (
                    <div className="space-y-3">
                      {weeklyTopBooks.map((book) => (
                        <BookCard
                          key={book.id}
                          book={book}
                          showWeeklyStats={true}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "highest-rated" && (
                <div className="mt-0">
                  <div className="mb-4">
                    <h3 className="font-semibold text-sm text-gray-700 mb-2">
                      ⭐ Highest Rated Books
                    </h3>
                    <p className="text-xs text-gray-500">
                      Books with best average ratings from readers
                    </p>
                  </div>
                  {loading ? (
                    <LoadingGrid />
                  ) : (
                    <div className="space-y-3">
                      {topRatedBooks.map((book) => (
                        <BookCard key={book.id} book={book} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "new-releases" && (
                <div className="mt-0">
                  <div className="mb-4">
                    <h3 className="font-semibold text-sm text-gray-700 mb-2">
                      🔥 Latest Published Books
                    </h3>
                    <p className="text-xs text-gray-500">
                      Recently published books with latest release dates
                    </p>
                  </div>
                  {loading ? (
                    <LoadingGrid />
                  ) : (
                    <div className="space-y-3">
                      {newReleases.map((book) => (
                        <BookCard key={book.id} book={book} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "by-genre" && (
                <div className="mt-0">
                  <div className="mb-4">
                    <h3 className="font-semibold text-sm text-gray-700 mb-2">
                      📖 Filter by Genre
                    </h3>
                    <select
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value)}
                      className="w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a genre</option>
                      {genres.map((genre) => (
                        <option key={genre.id} value={genre.id}>
                          {genre.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedGenre ? (
                    loading ? (
                      <LoadingGrid />
                    ) : (
                      <div className="space-y-3">
                        {genreBooks.map((book) => (
                          <BookCard key={book.id} book={book} />
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Select a genre to see book suggestions</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "search" && (
                <div className="mt-0">
                  <div className="mb-4 space-y-3">
                    <h3 className="font-semibold text-sm text-gray-700">
                      🔍 Advanced Search
                    </h3>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Search by title or author..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="flex gap-2">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="rating">⭐ Rating</option>
                        <option value="views">📈 Views</option>
                        <option value="date">📅 Date</option>
                        <option value="likes">❤️ Likes</option>
                      </select>

                      <select
                        value={selectedGenre}
                        onChange={(e) => setSelectedGenre(e.target.value)}
                        className="w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">All Genres</option>
                        {genres.map((genre) => (
                          <option key={genre.id} value={genre.id}>
                            {genre.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {searchQuery ? (
                    loading ? (
                      <LoadingGrid />
                    ) : searchResults.length > 0 ? (
                      <div className="space-y-3">
                        {searchResults.map((book) => (
                          <BookCard key={book.id} book={book} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No books found matching your search</p>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Enter a search term to find books</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookSuggestionModal;
