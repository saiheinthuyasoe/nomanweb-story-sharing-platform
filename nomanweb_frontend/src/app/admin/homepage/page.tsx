"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  PlusIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import {
  adminHomepageService,
  FeaturedContent,
  FeaturedContentStats,
  DashboardStats,
  Story,
} from "../../../services/adminHomepageService";
import { BookInsight } from "../../../services/bookInsightsService";

import EditExpirationModal from "../../../components/admin/EditExpirationModal";
import BulkExpirationModal from "../../../components/admin/BulkExpirationModal";
import ExpirationAlerts from "../../../components/admin/ExpirationAlerts";

const SECTION_TYPES = [
  { value: "NEW_RELEASES", label: "New Releases" },
  { value: "BEST_RATING", label: "Best Rating" },
  { value: "WEEKLY_FEATURES", label: "Weekly Features" },
  { value: "RECOMMENDED_FOR_YOU", label: "Recommended" },
  { value: "BEST_OF_ALL_TIME", label: "Best of All Time" },
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

const HomepageManagementPage = () => {
  const [featuredContent, setFeaturedContent] = useState<FeaturedContent[]>([]);
  const [stats, setStats] = useState<FeaturedContentStats | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] =
    useState<string>("NEW_RELEASES");
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Story[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sortBy, setSortBy] = useState<string>("displayOrder");
  const [filterActive, setFilterActive] = useState<string>("all");

  const [showEditExpirationModal, setShowEditExpirationModal] = useState(false);
  const [selectedFeaturedContent, setSelectedFeaturedContent] =
    useState<FeaturedContent | null>(null);
  const [showBulkExpirationModal, setShowBulkExpirationModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkSelectMode, setBulkSelectMode] = useState(false);

  // Fetch featured content and stats
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch featured content for selected section
      const contentData = await adminHomepageService.getFeaturedContent(
        selectedSection
      );
      setFeaturedContent(contentData.content || []);

      // Fetch stats
      const statsData = await adminHomepageService.getFeaturedContentStats();
      setStats(statsData);

      // Fetch dashboard stats
      const dashboardData = await adminHomepageService.getDashboardStats();
      setDashboardStats(dashboardData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Search stories
  const searchStories = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const data = await adminHomepageService.searchStories(query);
      setSearchResults(data.content || []);
    } catch (error) {
      console.error("Error searching stories:", error);
      toast.error("Failed to search stories");
    } finally {
      setSearchLoading(false);
    }
  };

  // Add story to featured content
  const addToFeatured = async (storyId: string, duration: number) => {
    console.log("🔄 Adding story to featured content:", {
      storyId,
      selectedSection,
      duration,
    });
    try {
      const result = await adminHomepageService.addToFeaturedContent(
        storyId,
        selectedSection,
        duration
      );
      console.log("✅ Story added successfully:", result);
      toast.success("Story added to featured content");
      setShowAddModal(false);
      setSearchQuery("");
      setSearchResults([]);
      fetchData();
    } catch (error) {
      console.error("❌ Error adding story:", error);

      // Check if the error is due to story already being featured
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes("already featured") ||
        errorMessage.includes("Story is already featured in this section")
      ) {
        toast.warning(
          "This story is already added to the selected homepage section!"
        );
      } else {
        toast.error("Failed to add story");
      }
    }
  };

  // Get section label
  const getSectionLabel = (sectionType: string) => {
    const section = SECTION_TYPES.find((s) => s.value === sectionType);
    return section ? section.label : sectionType;
  };

  // Open suggestion modal for specific section

  const openEditExpirationModal = (featuredContent: FeaturedContent) => {
    setSelectedFeaturedContent(featuredContent);
    setShowEditExpirationModal(true);
  };

  const handleExpirationUpdate = (updatedContent: FeaturedContent) => {
    setFeaturedContent((prev) =>
      prev.map((item) =>
        item.id === updatedContent.id ? updatedContent : item
      )
    );
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const selectAllItems = () => {
    const weeklyItems = featuredContent.filter(
      (item) => selectedSection === "WEEKLY_FEATURES"
    );
    setSelectedItems(new Set(weeklyItems.map((item) => item.id)));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
    setBulkSelectMode(false);
  };

  const openBulkExpirationModal = () => {
    if (selectedItems.size === 0) {
      toast.error("Please select items to update");
      return;
    }
    setShowBulkExpirationModal(true);
  };

  const handleBulkExpirationUpdate = (updatedItems: FeaturedContent[]) => {
    setFeaturedContent((prev) => {
      const updatedMap = new Map(updatedItems.map((item) => [item.id, item]));
      return prev.map((item) => updatedMap.get(item.id) || item);
    });
    clearSelection();
  };

  const handleQuickExtension = async (itemId: string, days: number) => {
    try {
      const item = featuredContent.find((f) => f.id === itemId);
      if (!item || !item.endDate) {
        toast.error("Cannot extend permanent items");
        return;
      }

      const currentEndDate = new Date(item.endDate);
      const newEndDate = new Date(
        currentEndDate.getTime() + days * 24 * 60 * 60 * 1000
      );

      const updatedItem =
        await adminHomepageService.updateFeaturedContentExpiration(itemId, {
          startDate: item.startDate,
          endDate: newEndDate.toISOString(),
        });

      setFeaturedContent((prev) =>
        prev.map((f) => (f.id === itemId ? updatedItem : f))
      );

      toast.success(`Extended expiration by ${days} days`);
    } catch (error) {
      console.error("Error extending expiration:", error);
      toast.error("Failed to extend expiration date");
    }
  };

  const getSelectedFeaturedContent = (): FeaturedContent[] => {
    return featuredContent.filter((item) => selectedItems.has(item.id));
  };

  // Remove from featured content
  const removeFromFeatured = async (featuredId: string) => {
    try {
      await adminHomepageService.removeFromFeaturedContent(featuredId);
      toast.success("Story removed from featured content");
      fetchData();
    } catch (error) {
      console.error("Error removing story:", error);
      toast.error("Failed to remove story");
    }
  };

  // Toggle active status
  const toggleActiveStatus = async (featuredId: string, isActive: boolean) => {
    try {
      await adminHomepageService.toggleActiveStatus(featuredId);
      toast.success(`Story ${isActive ? "deactivated" : "activated"}`);
      fetchData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  // Update display order
  const updateDisplayOrder = async (
    featuredId: string,
    direction: "up" | "down"
  ) => {
    try {
      const currentItem = featuredContent.find(
        (item) => item.id === featuredId
      );
      if (!currentItem) return;

      const newOrder =
        direction === "up"
          ? currentItem.displayOrder - 1
          : currentItem.displayOrder + 1;

      await adminHomepageService.updateDisplayOrder(featuredId, newOrder);
      toast.success("Display order updated");
      fetchData();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    }
  };

  // Filter and sort featured content
  const filteredAndSortedContent = featuredContent
    .filter((item) => {
      if (filterActive === "active") return item.isActive;
      if (filterActive === "inactive") return !item.isActive;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "displayOrder":
          return a.displayOrder - b.displayOrder;
        case "views":
          return b.story.totalViews - a.story.totalViews;
        case "likes":
          return b.story.totalLikes - a.story.totalLikes;
        case "title":
          return a.story.title.localeCompare(b.story.title);
        case "createdAt":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        default:
          return 0;
      }
    });

  useEffect(() => {
    fetchData();
  }, [selectedSection]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchStories(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Homepage Management
            </h1>
            <p className="text-gray-600">
              Manage featured content sections on the homepage
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.open('/', '_blank')}
              className="inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              style={{backgroundColor: '#18243c'}}
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              Preview Homepage
            </button>
          </div>
        </div>
      </div>



      {/* Featured Content Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Active</h3>
            <p className="text-2xl font-bold text-green-600">
              {stats.totalActive}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Expired</h3>
            <p className="text-2xl font-bold text-red-600">
              {stats.totalExpired}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">New Releases</h3>
            <p className="text-2xl font-bold" style={{color: '#18243c'}}>
              {stats.sectionCounts.NEW_RELEASES || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Best Rating</h3>
            <p className="text-2xl font-bold text-purple-600">
              {stats.sectionCounts.BEST_RATING || 0}
            </p>
          </div>
        </div>
      )}

      {/* Expiration Alerts */}
      {selectedSection === "WEEKLY_FEATURES" && (
        <ExpirationAlerts
          featuredContent={featuredContent}
          onExtendExpiration={handleQuickExtension}
          onEditExpiration={openEditExpirationModal}
        />
      )}

      {/* Section Management */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        {/* Main Section Management */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Section
                  </label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {SECTION_TYPES.map((section) => (
                      <option key={section.value} value={section.value}>
                        {section.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                      style={{backgroundColor: '#18243c'}}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Manual Search
                    </button>
                    {selectedSection === "WEEKLY_FEATURES" && (
                      <button
                        onClick={() => setBulkSelectMode(!bulkSelectMode)}
                        className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md transition-colors duration-200 ${
                          bulkSelectMode
                            ? "border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100"
                            : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                        }`}
                      >
                        <CheckIcon className="h-4 w-4 mr-1" />
                        {bulkSelectMode ? "Exit Bulk Mode" : "Bulk Select"}
                      </button>
                    )}
                    {selectedItems.size > 0 && (
                      <div className="px-2 py-1 text-white text-xs rounded-full font-medium" style={{backgroundColor: '#18243c'}}>
                        {selectedItems.size} selected
                      </div>
                    )}
                  </div>
                  {selectedItems.size > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllItems}
                        className="px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors duration-200 flex items-center gap-1"
                      >
                        <CheckIcon className="h-4 w-4" />
                        Select All
                      </button>
                      <button
                        onClick={clearSelection}
                        className="px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors duration-200 flex items-center gap-1"
                      >
                        <XMarkIcon className="h-4 w-4" />
                        Clear
                      </button>
                      <button
                        onClick={() => {
                          Array.from(selectedItems).forEach((id) => {
                            const item = featuredContent.find(
                              (f) => f.id === id
                            );
                            if (item) toggleActiveStatus(id, item.isActive);
                          });
                          clearSelection();
                        }}
                        className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 flex items-center gap-1"
                        title={`Toggle active status for ${selectedItems.size} selected items`}
                      >
                        <EyeIcon className="h-4 w-4" />
                        Toggle Active ({selectedItems.size})
                      </button>
                      {selectedSection === "WEEKLY_FEATURES" && (
                        <button
                          onClick={openBulkExpirationModal}
                          className="px-3 py-2 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors duration-200 flex items-center gap-1"
                          title={`Update expiration dates for ${selectedItems.size} selected items`}
                        >
                          <ClockIcon className="h-4 w-4" />
                          Bulk Expiration ({selectedItems.size})
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const selectedTitles = Array.from(selectedItems)
                            .map((id) => {
                              const item = featuredContent.find(
                                (f) => f.id === id
                              );
                              return item ? item.story.title : "Unknown";
                            })
                            .join(", ");

                          if (
                            confirm(
                              `Are you sure you want to remove ${selectedItems.size} selected item(s) from featured content?\n\nItems to be removed:\n${selectedTitles}`
                            )
                          ) {
                            Array.from(selectedItems).forEach((id) =>
                              removeFromFeatured(id)
                            );
                            clearSelection();
                          }
                        }}
                        className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200 flex items-center gap-1"
                        title={`Remove ${selectedItems.length} selected items`}
                      >
                        <TrashIcon className="h-4 w-4" />
                        Remove Selected ({selectedItems.size})
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Filtering and Sorting Controls */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Sort by
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="text-sm px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="displayOrder">Display Order</option>
                      <option value="views">Most Views</option>
                      <option value="likes">Most Likes</option>
                      <option value="title">Title A-Z</option>
                      <option value="createdAt">Recently Added</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Filter
                    </label>
                    <select
                      value={filterActive}
                      onChange={(e) => setFilterActive(e.target.value)}
                      className="text-sm px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">All Items</option>
                      <option value="active">Active Only</option>
                      <option value="inactive">Inactive Only</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>
                    Showing {filteredAndSortedContent.length} of{" "}
                    {featuredContent.length} items
                  </span>
                  {selectedItems.size > 0 && (
                    <span className="font-medium" style={{color: '#18243c'}}>
                      • {selectedItems.size} selected
                    </span>
                  )}
                </div>

                {/* Carousel-specific information */}
                {selectedSection === "HOMEPAGE_CAROUSEL" && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="font-medium" style={{color: '#18243c'}}>
                        Carousel Display Settings
                      </span>
                    </div>
                    <div className="mt-2 text-xs space-y-1" style={{color: '#18243c'}}>
                      <p>
                        • Books will appear in a horizontal scrolling carousel
                        on the homepage
                      </p>
                      <p>
                        • Recommended limit: 8-12 books for optimal performance
                      </p>
                      <p>• Order determines left-to-right display sequence</p>
                      <p>• Only active books will be visible to users</p>
                    </div>
                  </div>
                )}

                {/* Genre Display information */}
                {[
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
                ].includes(selectedSection) && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-green-800">
                        {
                          SECTION_TYPES.find((s) => s.value === selectedSection)
                            ?.label
                        }{" "}
                        Genre Settings
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-green-700 space-y-1">
                      <p>
                        • Books will appear in the{" "}
                        {
                          SECTION_TYPES.find((s) => s.value === selectedSection)
                            ?.label
                        }{" "}
                        section on the homepage
                      </p>
                      <p>
                        • Select books that match the{" "}
                        {SECTION_TYPES.find(
                          (s) => s.value === selectedSection
                        )?.label.toLowerCase()}{" "}
                        genre
                      </p>
                      <p>
                        • Higher display order = more prominent positioning
                        within this genre
                      </p>
                      <p>
                        • Helps users discover{" "}
                        {SECTION_TYPES.find(
                          (s) => s.value === selectedSection
                        )?.label.toLowerCase()}{" "}
                        books easily
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Featured Content List */}
            <div className="p-6">
              {filteredAndSortedContent.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {featuredContent.length === 0
                      ? "No featured content in this section"
                      : "No items match the current filters"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bulkSelectMode && (
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="checkbox"
                        checked={
                          selectedItems.size ===
                            filteredAndSortedContent.length &&
                          filteredAndSortedContent.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            selectAllItems();
                          } else {
                            clearSelection();
                          }
                        }}
                        className="rounded border-gray-300 focus:ring-gray-500"
                        style={{accentColor: '#18243c'}}
                      />
                      <label className="text-sm font-medium text-gray-700">
                        Select All ({filteredAndSortedContent.length} items)
                      </label>
                    </div>
                  )}
                  {filteredAndSortedContent.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        {bulkSelectMode && (
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => toggleItemSelection(item.id)}
                            className="rounded border-gray-300 focus:ring-gray-500"
                        style={{accentColor: '#18243c'}}
                          />
                        )}
                        <img
                          src={
                            item.story.coverImageUrl ||
                            "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=80&h=120&fit=crop"
                          }
                          alt={item.story.title}
                          className="w-20 h-28 object-cover rounded shadow-sm"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {item.story.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {item.story.author.displayName ||
                              item.story.author.username}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-xs text-gray-400">
                              Order: {item.displayOrder}
                            </span>
                            <span className="text-xs" style={{color: '#18243c'}}>
                              {item.story.totalViews.toLocaleString()} views
                            </span>
                            <span className="text-xs text-red-600">
                              {item.story.totalLikes.toLocaleString()} likes
                            </span>
                            <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                              {item.story.category.name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                item.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {item.isActive ? "Active" : "Inactive"}
                            </span>
                            <span className="text-xs text-gray-500">
                              Added:{" "}
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                            {selectedSection === "WEEKLY_FEATURES" && (
                              <div className="flex items-center space-x-2">
                                {item.endDate ? (
                                  <span className="text-xs text-orange-600">
                                    Expires:{" "}
                                    {new Date(
                                      item.endDate
                                    ).toLocaleDateString()}
                                  </span>
                                ) : (
                                  <span className="text-xs text-green-600">
                                    Permanent
                                  </span>
                                )}
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() =>
                                      openEditExpirationModal(item)
                                    }
                                    className="text-xs underline hover:opacity-80"
                        style={{color: '#18243c'}}
                                    title="Edit expiration date"
                                  >
                                    Edit
                                  </button>
                                  {item.endDate && (
                                    <>
                                      <span className="text-xs text-gray-400">
                                        |
                                      </span>
                                      <button
                                        onClick={() =>
                                          handleQuickExtension(item.id, 7)
                                        }
                                        className="text-xs text-green-600 hover:text-green-800 px-1 py-0.5 rounded bg-green-50 hover:bg-green-100"
                                        title="Extend by 7 days"
                                      >
                                        +7d
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleQuickExtension(item.id, 14)
                                        }
                                        className="text-xs text-green-600 hover:text-green-800 px-1 py-0.5 rounded bg-green-50 hover:bg-green-100"
                                        title="Extend by 14 days"
                                      >
                                        +14d
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleQuickExtension(item.id, 30)
                                        }
                                        className="text-xs text-green-600 hover:text-green-800 px-1 py-0.5 rounded bg-green-50 hover:bg-green-100"
                                        title="Extend by 30 days"
                                      >
                                        +30d
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Carousel-specific controls */}
                        {selectedSection === "HOMEPAGE_CAROUSEL" && (
                          <div className="flex items-center space-x-1 mr-2">
                            <span className="text-xs text-gray-500">
                              Carousel:
                            </span>
                            <button
                              onClick={() => updateDisplayOrder(item.id, "up")}
                              className="p-1 text-white hover:opacity-90 rounded"
                              style={{backgroundColor: '#18243c'}}
                              title="Move left in carousel"
                            >
                              <ArrowUpIcon className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() =>
                                updateDisplayOrder(item.id, "down")
                              }
                              className="p-1 text-white hover:opacity-90 rounded"
                              style={{backgroundColor: '#18243c'}}
                              title="Move right in carousel"
                            >
                              <ArrowDownIcon className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        {/* Standard ordering controls */}
                        {selectedSection !== "HOMEPAGE_CAROUSEL" && (
                          <>
                            <button
                              onClick={() => updateDisplayOrder(item.id, "up")}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Move up"
                            >
                              <ArrowUpIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                updateDisplayOrder(item.id, "down")
                              }
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Move down"
                            >
                              <ArrowDownIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() =>
                            toggleActiveStatus(item.id, item.isActive)
                          }
                          className={`p-1 ${
                            item.isActive
                              ? "text-green-600 hover:text-green-700"
                              : "text-gray-400 hover:text-gray-600"
                          }`}
                          title={item.isActive ? "Deactivate" : "Activate"}
                        >
                          {item.isActive ? (
                            <EyeIcon className="h-4 w-4" />
                          ) : (
                            <EyeSlashIcon className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Remove "${item.story.title}" from featured content?`
                              )
                            ) {
                              removeFromFeatured(item.id);
                            }
                          }}
                          className={`p-1 transition-colors duration-200 ${
                            selectedItems.has(item.id)
                              ? "text-red-700 bg-red-50 hover:bg-red-100"
                              : "text-red-600 hover:text-red-700 hover:bg-red-50"
                          } rounded`}
                          title="Remove from featured content"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Add Story Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Manual Search - Add Story to Featured Content
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Use this for custom searches when suggestions don't meet your
                needs.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Stories
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title or author..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {searchLoading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md mb-4">
                  {searchResults.map((story) => (
                    <div
                      key={story.id}
                      className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={
                            story.coverImageUrl ||
                            "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=60&h=80&fit=crop"
                          }
                          alt={story.title}
                          className="w-12 h-16 object-cover rounded shadow-sm"
                        />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {story.title}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {story.author.displayName || story.author.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {selectedSection === "WEEKLY_FEATURES" ? (
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                addToFeatured(
                                  story.id,
                                  parseInt(e.target.value)
                                );
                              }
                            }}
                            className="text-xs px-2 py-1 border border-gray-300 rounded"
                            defaultValue=""
                          >
                            <option value="">Select Duration</option>
                            <option value="7">7 days</option>
                            <option value="14">14 days</option>
                            <option value="30">30 days</option>
                            <option value="90">90 days</option>
                          </select>
                        ) : (
                          <button
                            onClick={() => addToFeatured(story.id, 0)} // 0 means permanent (no expiration)
                            className="text-xs px-3 py-1 text-white rounded hover:opacity-90"
                            style={{backgroundColor: '#18243c'}}
                          >
                            Add to Home Page Section
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Expiration Modal */}
      {selectedFeaturedContent && (
        <EditExpirationModal
          isOpen={showEditExpirationModal}
          onClose={() => {
            setShowEditExpirationModal(false);
            setSelectedFeaturedContent(null);
          }}
          featuredContent={selectedFeaturedContent}
          onUpdate={handleExpirationUpdate}
        />
      )}
      {showBulkExpirationModal && (
        <BulkExpirationModal
          isOpen={showBulkExpirationModal}
          onClose={() => setShowBulkExpirationModal(false)}
          featuredContent={getSelectedFeaturedContent()}
          onUpdate={handleBulkExpirationUpdate}
        />
      )}
    </div>
  );
};

export default HomepageManagementPage;
