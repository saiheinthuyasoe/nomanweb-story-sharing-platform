"use client";

import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  FlagIcon,
  UserIcon,
  ArrowLeftIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

interface ChapterForModeration {
  id: string;
  title: string;
  content: string;
  moderationStatus: "PENDING" | "APPROVED" | "REJECTED";
  moderationNotes?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  aiModerationResult?: ContentModerationResult;
  story: {
    id: string;
    title: string;
    author: {
      id: string;
      username: string;
      displayName?: string;
    };
  };
}

interface ContentModerationResult {
  isOffensive: boolean;
  confidenceScore: number;
  detectedLanguage?: string;
  analysisDetails?: string;
  errorMessage?: string;
  predictedCategory?: string;
  allProbabilities?: Record<string, number>;
}

interface ModerationStats {
  flaggedToday: number;
  pendingReviews: number;
  approved: number;
  rejected: number;
  detectionAccuracy: number;
}

interface QueueStatus {
  processing: boolean;
  aiModerationEnabled: boolean;
  queueStats: {
    queueSize: number;
    processing: number;
    completed: number;
    failed: number;
    dailyStats: Record<string, any>;
  };
  processingJobs: Array<{
    jobId: string;
    chapterId: string;
    operation: string;
    priority: number;
    queuedAt: string;
    startedAt: string;
    progress: number;
    estimatedTimeRemaining: number;
    retryCount: number;
    maxRetries: number;
  }>;
  pendingChapters: Array<{
    id: string;
    title: string;
    storyTitle: string;
    authorName: string;
    createdAt: string;
    moderationStatus: string;
    priority: number;
  }>;
  lastProcessedAt: string;
}

type FilterType = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "AUTO_FLAGGED";
type SortType = "NEWEST" | "OLDEST" | "HIGHEST_RISK" | "MOST_FLAGGED";

export default function AdminModerationPage() {
  const [chapters, setChapters] = useState<ChapterForModeration[]>([]);
  const [filteredChapters, setFilteredChapters] = useState<
    ChapterForModeration[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] =
    useState<ChapterForModeration | null>(null);
  const [moderationNotes, setModerationNotes] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<ContentModerationResult | null>(null);
  const [stats, setStats] = useState<ModerationStats>({
    flaggedToday: 0,
    pendingReviews: 0,
    approved: 0,
    rejected: 0,
    detectionAccuracy: 87,
  });
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [aiModerationRunning, setAiModerationRunning] = useState(false);

  // New state for enhanced dashboard
  const [currentFilter, setCurrentFilter] = useState<FilterType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortType>("NEWEST");
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(
    new Set()
  );
  const [showDetailView, setShowDetailView] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "flagged" | "queue" | "reports"
  >("overview");

  useEffect(() => {
    fetchChapters();
    fetchQueueStatus();
    // Set up interval to refresh queue status every 10 seconds
    const interval = setInterval(fetchQueueStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [chapters, currentFilter, searchQuery, sortBy]);

  const fetchChapters = async () => {
    try {
      setLoading(true);
      const adminToken = Cookies.get("adminToken");
      if (!adminToken) {
        throw new Error("Admin token not found. Please login again.");
      }

      const response = await fetch("/api/admin/moderation/chapters", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch chapters");
      }

      const data = await response.json();
      // Backend returns a Spring Boot Page object with content property
      const chapters = data.content || [];
      setChapters(chapters);

      // Calculate stats
      const today = new Date().toDateString();
      const todayChapters = chapters.filter(
        (ch: ChapterForModeration) =>
          new Date(ch.createdAt).toDateString() === today
      );

      setStats({
        flaggedToday: todayChapters.length,
        pendingReviews: chapters.filter(
          (ch: ChapterForModeration) => ch.moderationStatus === "PENDING"
        ).length,
        approved: chapters.filter(
          (ch: ChapterForModeration) => ch.moderationStatus === "APPROVED"
        ).length,
        rejected: chapters.filter(
          (ch: ChapterForModeration) => ch.moderationStatus === "REJECTED"
        ).length,
        detectionAccuracy: 87,
      });
    } catch (error) {
      console.error("Error fetching chapters:", error);
      toast.error("Failed to load chapters for moderation");
    } finally {
      setLoading(false);
    }
  };

  const fetchQueueStatus = async () => {
    try {
      const adminToken = Cookies.get("adminToken");
      if (!adminToken) {
        return;
      }

      const response = await fetch("/api/admin/moderation/queue/status", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setQueueStatus(data);
        // Update AI moderation running status based on queue processing
        setAiModerationRunning(data.processing || false);
      }
    } catch (error) {
      console.error("Error fetching queue status:", error);
    }
  };

  const startAiModeration = async () => {
    try {
      const adminToken = Cookies.get("adminToken");
      if (!adminToken) {
        throw new Error("Admin token not found. Please login again.");
      }

      const response = await fetch("/api/admin/moderation/ai/start", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to start AI moderation");
      }

      toast.success("AI Moderation started successfully");

      // Refresh queue status to get updated aiModerationEnabled status
      fetchQueueStatus();
    } catch (error) {
      console.error("Error starting AI moderation:", error);
      toast.error("Failed to start AI moderation");
    }
  };

  const stopAiModeration = async () => {
    try {
      const adminToken = Cookies.get("adminToken");
      if (!adminToken) {
        throw new Error("Admin token not found. Please login again.");
      }

      const response = await fetch("/api/admin/moderation/ai/stop", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to stop AI moderation");
      }

      toast.success("AI Moderation stopped successfully");

      // Refresh queue status to get updated aiModerationEnabled status
      fetchQueueStatus();
    } catch (error) {
      console.error("Error stopping AI moderation:", error);
      toast.error("Failed to stop AI moderation");
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...chapters];

    // Apply status filter
    if (currentFilter !== "ALL") {
      if (currentFilter === "AUTO_FLAGGED") {
        // For now, treat all pending as auto-flagged
        filtered = filtered.filter((ch) => ch.moderationStatus === "PENDING");
      } else {
        filtered = filtered.filter(
          (ch) => ch.moderationStatus === currentFilter
        );
      }
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ch) =>
          ch.title.toLowerCase().includes(query) ||
          ch.story.title.toLowerCase().includes(query) ||
          ch.story.author.username.toLowerCase().includes(query) ||
          ch.story.author.displayName?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "NEWEST":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "OLDEST":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "HIGHEST_RISK":
          // For now, sort by pending status first
          if (
            a.moderationStatus === "PENDING" &&
            b.moderationStatus !== "PENDING"
          )
            return -1;
          if (
            b.moderationStatus === "PENDING" &&
            a.moderationStatus !== "PENDING"
          )
            return 1;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "MOST_FLAGGED":
          // For now, same as highest risk
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        default:
          return 0;
      }
    });

    setFilteredChapters(filtered);
  };

  const analyzeContent = async (chapterId: string) => {
    try {
      setAnalyzing(true);
      setAnalysisResult(null);

      const adminToken = Cookies.get("adminToken");
      if (!adminToken) {
        throw new Error("Admin token not found. Please login again.");
      }

      const response = await fetch(
        `/api/chapters/${chapterId}/analyze-content`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (error) {
      console.error("Error analyzing content:", error);
      setAnalysisResult({
        isOffensive: false,
        confidenceScore: 0,
        errorMessage: "Failed to analyze content. Please try again.",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const moderateChapter = async (chapterId: string, approved: boolean) => {
    try {
      setModerating(true);

      const adminToken = Cookies.get("adminToken");
      if (!adminToken) {
        throw new Error("Admin token not found. Please login again.");
      }

      const formData = new FormData();
      formData.append("approved", approved.toString());
      formData.append("notes", moderationNotes || "");

      const response = await fetch(
        `/api/admin/moderation/chapters/${chapterId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to moderate chapter");
      }

      toast.success(
        approved
          ? "Chapter approved and published successfully!"
          : "Chapter rejected and returned to draft."
      );

      // Refresh the chapters list
      await fetchChapters();
      setSelectedChapter(null);
      setModerationNotes("");
      setAnalysisResult(null);
      setShowDetailView(false);
    } catch (error) {
      console.error("Error moderating chapter:", error);
      toast.error("Failed to moderate chapter. Please try again.");
    } finally {
      setModerating(false);
    }
  };

  const handleBulkAction = async (action: "approve" | "reject") => {
    if (selectedChapters.size === 0) {
      toast.error("Please select chapters to moderate");
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to ${action} ${selectedChapters.size} selected chapter(s)?`
    );

    if (!confirmed) return;

    try {
      setModerating(true);
      const promises = Array.from(selectedChapters).map((chapterId) =>
        moderateChapter(chapterId, action === "approve")
      );

      await Promise.all(promises);
      setSelectedChapters(new Set());
      toast.success(
        `Successfully ${action}d ${selectedChapters.size} chapter(s)`
      );
    } catch (error) {
      toast.error(`Failed to ${action} selected chapters`);
    } finally {
      setModerating(false);
    }
  };

  const toggleChapterSelection = (chapterId: string) => {
    const newSelection = new Set(selectedChapters);
    if (newSelection.has(chapterId)) {
      newSelection.delete(chapterId);
    } else {
      newSelection.add(chapterId);
    }
    setSelectedChapters(newSelection);
  };

  const selectAllChapters = () => {
    if (selectedChapters.size === filteredChapters.length) {
      setSelectedChapters(new Set());
    } else {
      setSelectedChapters(new Set(filteredChapters.map((ch) => ch.id)));
    }
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-300"
          >
            <ClockIcon className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="outline" className="text-green-600 border-green-300">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="outline" className="text-red-600 border-red-300">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  const getDetectedIssue = (chapter: ChapterForModeration) => {
    // For now, return a placeholder. In a real implementation, this would be based on AI analysis
    if (chapter.moderationStatus === "PENDING") {
      return "Content Review Required";
    }
    return "No Issues Detected";
  };

  const getConfidenceScore = (chapter: ChapterForModeration) => {
    // Placeholder confidence score
    return Math.floor(Math.random() * 40) + 60; // 60-100%
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showDetailView && selectedChapter) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button
              onClick={() => setShowDetailView(false)}
              variant="outline"
              className="mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              Content Review: {selectedChapter.story.title} -{" "}
              {selectedChapter.title}
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel: Content Preview */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Content Preview
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Story Details
                  </h4>
                  <p className="text-sm text-gray-600">
                    <strong>Story:</strong> {selectedChapter.story.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Chapter:</strong> {selectedChapter.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Author:</strong>{" "}
                    {selectedChapter.story.author?.displayName ||
                      selectedChapter.story.author?.username ||
                      "Unknown Author"}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Content Preview
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {stripHtml(selectedChapter.content).substring(0, 2000)}
                      {stripHtml(selectedChapter.content).length > 2000 &&
                        "..."}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Right Panel: AI Detection Summary */}
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <SparklesIcon className="h-5 w-5 mr-2 text-purple-500" />
                    AI Detection Summary
                  </h3>
                  <Button
                    onClick={() => analyzeContent(selectedChapter.id)}
                    disabled={analyzing}
                    variant="outline"
                    size="sm"
                  >
                    {analyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                        Analyzing...
                      </>
                    ) : (
                      "Analyze Content"
                    )}
                  </Button>
                </div>

                {analysisResult && !analysisResult.errorMessage && (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="mb-4">
                        <span className="font-medium text-gray-900">
                          Classification:{" "}
                          {(() => {
                            // Find the category with highest probability
                            let highestCategory =
                              analysisResult.predictedCategory || "Normal";
                            let highestPercentage =
                              analysisResult.confidenceScore * 100;

                            if (analysisResult.allProbabilities) {
                              const entries = Object.entries(
                                analysisResult.allProbabilities
                              );
                              if (entries.length > 0) {
                                const [category, probability] = entries.reduce(
                                  (max, current) =>
                                    current[1] > max[1] ? current : max
                                );
                                highestCategory = category;
                                highestPercentage = probability * 100;
                              }
                            }

                            // Format category name
                            const formattedCategory = highestCategory
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase());

                            // Determine if problematic
                            const isProblematic =
                              highestCategory
                                .toLowerCase()
                                .includes("offensive") ||
                              highestCategory.toLowerCase().includes("hate") ||
                              highestCategory
                                .toLowerCase()
                                .includes("religious") ||
                              highestCategory
                                .toLowerCase()
                                .includes("political");

                            const icon = isProblematic ? "🔴" : "🟢";

                            return `${icon} ${formattedCategory} (${highestPercentage.toFixed(
                              0
                            )}%)`;
                          })()}
                        </span>
                      </div>

                      {analysisResult.detectedLanguage && (
                        <div className="mb-4">
                          <p className="text-gray-700 font-medium mb-2">
                            Language: {analysisResult.detectedLanguage}
                          </p>
                        </div>
                      )}

                      {analysisResult.allProbabilities && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Detected Issues:
                          </h4>
                          {Object.entries(analysisResult.allProbabilities)
                            .sort(([, a], [, b]) => b - a)
                            .map(([category, probability]) => {
                              const percentage = (probability * 100).toFixed(0);
                              const displayName = category
                                .replace("_", " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase());

                              return (
                                <div
                                  key={category}
                                  className="flex items-center space-x-4"
                                >
                                  <div className="w-32 text-sm text-gray-700 font-medium">
                                    {displayName}
                                  </div>
                                  <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                                    <div
                                      className={`h-3 rounded-full transition-all duration-300 ${
                                        category === "normal"
                                          ? "bg-green-500"
                                          : category === "offensive"
                                          ? "bg-red-500"
                                          : category === "hate_speech"
                                          ? "bg-orange-500"
                                          : category === "religious_hate"
                                          ? "bg-purple-500"
                                          : category === "political_hate"
                                          ? "bg-blue-500"
                                          : "bg-gray-500"
                                      }`}
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                  <div className="w-12 text-sm text-gray-600 font-mono">
                                    {percentage}%
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">
                        Suggested Action:
                      </h4>
                      <p className="text-blue-800 text-sm">
                        {(() => {
                          const category =
                            analysisResult.predictedCategory?.toLowerCase() ||
                            "";
                          const isProblematic =
                            category.includes("offensive") ||
                            category.includes("hate") ||
                            category.includes("religious") ||
                            category.includes("political");

                          return isProblematic
                            ? "🔴 Reject - Content violates community guidelines"
                            : "✅ Approve - Content appears safe for publication";
                        })()}
                      </p>
                    </div>
                  </div>
                )}

                {analysisResult?.errorMessage && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-700 text-sm">
                      Analysis Error: {analysisResult.errorMessage}
                    </p>
                  </div>
                )}
              </Card>

              {/* Moderator Actions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Moderator Actions
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Moderation Notes
                    </label>
                    <textarea
                      value={moderationNotes}
                      onChange={(e) => setModerationNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Add notes about your moderation decision..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button
                      onClick={() => moderateChapter(selectedChapter.id, true)}
                      disabled={moderating}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {moderating ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                      )}
                      ✅ Approve
                    </Button>

                    <Button
                      onClick={() => moderateChapter(selectedChapter.id, false)}
                      disabled={moderating}
                      variant="destructive"
                    >
                      {moderating ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <XCircleIcon className="h-4 w-4 mr-2" />
                      )}
                      ❌ Reject
                    </Button>

                    <Button
                      variant="outline"
                      className="border-orange-300 text-orange-600 hover:bg-orange-50"
                    >
                      <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                      ⚠️ Escalate
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                AI Content Moderation
              </h1>
              <p className="text-gray-600 mt-1">
                Automated content analysis with AI-powered approval and
                rejection
              </p>
            </div>


          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-[#18243c] text-[#18243c]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Overview
              </button>

              <button
                  onClick={() => setActiveTab("queue")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "queue"
                      ? "border-[#18243c] text-[#18243c]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  AI Moderation Queue
                </button>

            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <>
            {/* Stats/Insights Section */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Flagged Today
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.flaggedToday}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Pending Reviews
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.pendingReviews}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Approved
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.approved}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Rejected
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.rejected}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Detection Accuracy
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.detectionAccuracy}%
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Queue Status Section */}
            {queueStatus && (
              <Card className="p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CogIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Processing Queue Status
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        queueStatus.processing
                          ? "bg-green-500 animate-pulse"
                          : "bg-gray-400"
                      }`}
                    ></div>
                    <span className="text-sm text-gray-600">
                      {queueStatus.processing ? "Processing" : "Idle"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {queueStatus.queueStats.queueSize}
                    </div>
                    <div className="text-sm text-gray-600">In Queue</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {queueStatus.queueStats.processing}
                    </div>
                    <div className="text-sm text-gray-600">Processing</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {queueStatus.queueStats.completed}
                    </div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {queueStatus.queueStats.failed}
                    </div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>

                {queueStatus.lastProcessedAt && (
                  <div className="mt-4 text-sm text-gray-500">
                    Last processed:{" "}
                    {new Date(queueStatus.lastProcessedAt).toLocaleString()}
                  </div>
                )}
              </Card>
            )}

            {/* Bulk Actions */}
            {selectedChapters.size > 0 && (
              <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedChapters.size} item(s) selected
                    </span>
                    <Button
                      onClick={() => setSelectedChapters(new Set())}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-300"
                    >
                      Clear Selection
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleBulkAction("approve")}
                      disabled={moderating}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Approve Selected
                    </Button>
                    <Button
                      onClick={() => handleBulkAction("reject")}
                      disabled={moderating}
                      variant="destructive"
                      size="sm"
                    >
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Reject Selected
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-orange-300 text-orange-600 hover:bg-orange-50"
                    >
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      Escalate Selected
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Main Content Table */}
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Content Items ({filteredChapters.length})
                  </h2>
                  <Button
                    onClick={selectAllChapters}
                    variant="outline"
                    size="sm"
                  >
                    {selectedChapters.size === filteredChapters.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                </div>
                
                {/* Search and Filter Controls */}
                <div className="flex items-center space-x-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by title, author, keyword..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Quick Filters */}
                  <div className="flex items-center space-x-2">
                    <FunnelIcon className="h-5 w-5 text-gray-400" />
                    <select
                      value={currentFilter}
                      onChange={(e) =>
                        setCurrentFilter(e.target.value as FilterType)
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="ALL">All</option>
                      <option value="PENDING">Pending Review</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="AUTO_FLAGGED">Auto-Flagged</option>
                    </select>
                  </div>

                  {/* Sort Options */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortType)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="NEWEST">Newest First</option>
                    <option value="OLDEST">Oldest First</option>
                    <option value="HIGHEST_RISK">Highest Risk</option>
                    <option value="MOST_FLAGGED">Most Flagged</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={
                            selectedChapters.size === filteredChapters.length &&
                            filteredChapters.length > 0
                          }
                          onChange={selectAllChapters}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Content Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Snippet / Preview
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Detected Issue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Confidence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredChapters.map((chapter) => {
                      const confidence = getConfidenceScore(chapter);
                      const detectedIssue = getDetectedIssue(chapter);

                      return (
                        <tr key={chapter.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedChapters.has(chapter.id)}
                              onChange={() =>
                                toggleChapterSelection(chapter.id)
                              }
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                              <span className="text-sm font-medium text-gray-900">
                                Chapter
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-xs">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {chapter.story.title} - {chapter.title}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {stripHtml(chapter.content).substring(0, 100)}
                                ...
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                chapter.moderationStatus === "PENDING"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {detectedIssue}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    confidence >= 80
                                      ? "bg-red-500"
                                      : confidence >= 60
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                  }`}
                                  style={{ width: `${confidence}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">
                                {confidence}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {chapter.story.author?.displayName ||
                                    chapter.story.author?.username}
                                </p>
                                <p className="text-sm text-gray-500">
                                  @{chapter.story.author?.username}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(chapter.moderationStatus)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => {
                                  setSelectedChapter(chapter);
                                  setShowDetailView(true);
                                }}
                                variant="outline"
                                size="sm"
                              >
                                <EyeIcon className="h-4 w-4 mr-1" />
                                View
                              </Button>

                              {/* AI Decision Display */}
                              {chapter.aiModerationResult && (
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center space-x-1">
                                    <SparklesIcon className="h-4 w-4 text-blue-500" />
                                    <span className="text-xs text-gray-600">
                                      AI:
                                    </span>
                                    <Badge
                                      className={`text-xs ${
                                        chapter.moderationStatus === "APPROVED"
                                          ? "bg-green-100 text-green-800"
                                          : chapter.moderationStatus ===
                                            "REJECTED"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-yellow-100 text-yellow-800"
                                      }`}
                                    >
                                      {chapter.moderationStatus === "APPROVED"
                                        ? "Auto-Approved"
                                        : chapter.moderationStatus ===
                                          "REJECTED"
                                        ? "Auto-Rejected"
                                        : "Pending Review"}
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {Math.round(
                                      chapter.aiModerationResult.confidenceScore
                                    )}
                                    % confidence
                                  </span>
                                </div>
                              )}

                              {/* Manual Override for Pending Items */}
                              {chapter.moderationStatus === "PENDING" && (
                                <>
                                  <Button
                                    onClick={() =>
                                      moderateChapter(chapter.id, true)
                                    }
                                    disabled={moderating}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    title="Manual Override: Approve"
                                  >
                                    <CheckCircleIcon className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      moderateChapter(chapter.id, false)
                                    }
                                    disabled={moderating}
                                    variant="destructive"
                                    size="sm"
                                    title="Manual Override: Reject"
                                  >
                                    <XCircleIcon className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredChapters.length === 0 && (
                <div className="text-center py-12">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Content Found
                  </h3>
                  <p className="text-gray-600">
                    {searchQuery || currentFilter !== "ALL"
                      ? "No content matches your current filters."
                      : "No content available for moderation."}
                  </p>
                </div>
              )}
            </Card>
          </>
        )}



        {/* Queue Status Tab */}
        {activeTab === "queue" && (
          <div className="space-y-6">
            {queueStatus && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Processing Queue Status
                  </h3>
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-4 h-4 rounded-full ${
                        queueStatus.processing
                          ? "bg-green-500 animate-pulse"
                          : "bg-gray-400"
                      }`}
                    ></div>
                    <span className="text-sm font-medium text-gray-700">
                      {queueStatus.processing
                        ? "Processing Active"
                        : "Queue Idle"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      {queueStatus.queueStats.queueSize}
                    </div>
                    <div className="text-sm text-blue-700 font-medium">
                      Items in Queue
                    </div>
                  </div>

                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-3xl font-bold text-yellow-600">
                      {queueStatus.queueStats.processing}
                    </div>
                    <div className="text-sm text-yellow-700 font-medium">
                      Currently Processing
                    </div>
                  </div>

                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">
                      {queueStatus.queueStats.completed}
                    </div>
                    <div className="text-sm text-green-700 font-medium">
                      Completed Today
                    </div>
                  </div>

                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-3xl font-bold text-red-600">
                      {queueStatus.queueStats.failed}
                    </div>
                    <div className="text-sm text-red-700 font-medium">
                      Failed Jobs
                    </div>
                  </div>
                </div>

                {queueStatus.lastProcessedAt && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      <strong>Last processed:</strong>{" "}
                      {new Date(queueStatus.lastProcessedAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* AI Moderation Controls */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  AI Moderation Control
                </h3>
                <div className="flex items-center space-x-4">
                  {queueStatus?.aiModerationEnabled ? (
                    <Button
                      onClick={stopAiModeration}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2"
                    >
                      <div className="w-4 h-4 bg-white rounded-sm"></div>
                      <span>Stop AI Moderation</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={startAiModeration}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2"
                      disabled={stats.pendingReviews === 0}
                    >
                      <div className="w-0 h-0 border-l-4 border-l-white border-t-2 border-t-transparent border-b-2 border-b-transparent ml-1"></div>
                      <span>Start AI Moderation</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress Panel */}
              {queueStatus?.aiModerationEnabled && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-blue-900">
                      AI Moderation: Running...
                      {queueStatus.queueStats && (
                        <span className="text-sm font-normal">
                          (Queue: {queueStatus.queueStats.queueSize},
                          Processing: {queueStatus.queueStats.processing})
                        </span>
                      )}
                    </h4>
                    <div className="text-sm text-blue-700">
                      {queueStatus.queueStats && (
                        <span>
                          Completed: {queueStatus.queueStats.completed} |
                          Failed: {queueStatus.queueStats.failed}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Queue Progress Bar */}
                  {queueStatus.queueStats &&
                    queueStatus.queueStats.queueSize > 0 && (
                      <div className="w-full bg-blue-200 rounded-full h-3 mb-6">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.max(
                              10,
                              (queueStatus.queueStats.completed /
                                (queueStatus.queueStats.completed +
                                  queueStatus.queueStats.queueSize)) *
                                100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    )}

                  {/* Currently Processing Jobs */}
                  {queueStatus.processingJobs &&
                    queueStatus.processingJobs.length > 0 && (
                      <div className="mb-4 space-y-2">
                        <h5 className="text-sm font-medium text-blue-900">
                          Currently Processing:
                        </h5>
                        {queueStatus.processingJobs.map((job) => (
                          <div
                            key={job.jobId}
                            className="p-3 bg-white border border-blue-200 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <ClockIcon className="h-4 w-4 text-blue-600 animate-spin" />
                                <span className="text-sm font-medium text-gray-900">
                                  Chapter ID: {job.chapterId}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {job.progress}% • Retry {job.retryCount}/
                                {job.maxRetries}
                              </div>
                            </div>
                            {job.estimatedTimeRemaining > 0 && (
                              <div className="mt-1 text-xs text-gray-500">
                                Est.{" "}
                                {Math.round(job.estimatedTimeRemaining / 1000)}s
                                remaining
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Queue Statistics */}
                  {queueStatus.queueStats && (
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      <div className="text-center p-2 bg-white rounded-lg border border-blue-200">
                        <div className="text-lg font-bold text-blue-600">
                          {queueStatus.queueStats.queueSize}
                        </div>
                        <div className="text-xs text-gray-600">In Queue</div>
                      </div>
                      <div className="text-center p-2 bg-white rounded-lg border border-blue-200">
                        <div className="text-lg font-bold text-yellow-600">
                          {queueStatus.queueStats.processing}
                        </div>
                        <div className="text-xs text-gray-600">Processing</div>
                      </div>
                      <div className="text-center p-2 bg-white rounded-lg border border-blue-200">
                        <div className="text-lg font-bold text-green-600">
                          {queueStatus.queueStats.completed}
                        </div>
                        <div className="text-xs text-gray-600">Completed</div>
                      </div>
                      <div className="text-center p-2 bg-white rounded-lg border border-blue-200">
                        <div className="text-lg font-bold text-red-600">
                          {queueStatus.queueStats.failed}
                        </div>
                        <div className="text-xs text-gray-600">Failed</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Paused State */}
              {!queueStatus?.aiModerationEnabled &&
                stats.pendingReviews > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                      <span className="text-yellow-800 font-medium">
                        AI Moderation: Paused ({stats.pendingReviews} items
                        still pending)
                      </span>
                    </div>
                  </div>
                )}

              {/* Pending Chapters List - Always show when there are pending chapters */}
              {queueStatus?.pendingChapters &&
                queueStatus.pendingChapters.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <ClockIcon className="h-5 w-5 mr-2 text-blue-600" />
                      Pending Chapters ({queueStatus.pendingChapters.length})
                    </h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {queueStatus.pendingChapters.map((chapter) => (
                        <div
                          key={chapter.id}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 truncate">
                                {chapter.title}
                              </h5>
                              <p className="text-sm text-gray-600 mt-1">
                                Story:{" "}
                                <span className="font-medium">
                                  {chapter.storyTitle}
                                </span>
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                Author: {chapter.authorName}
                              </p>
                              <div className="flex items-center mt-2 space-x-4">
                                <span className="text-xs text-gray-500">
                                  Queued:{" "}
                                  {new Date(chapter.createdAt).toLocaleString()}
                                </span>
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${
                                    chapter.priority === 1
                                      ? "bg-red-100 text-red-800"
                                      : chapter.priority === 2
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  Priority:{" "}
                                  {chapter.priority === 1
                                    ? "High"
                                    : chapter.priority === 2
                                    ? "Medium"
                                    : "Low"}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                {chapter.moderationStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* No Pending Items */}
              {(!queueStatus?.pendingChapters ||
                queueStatus.pendingChapters.length === 0) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    <span className="text-green-800 font-medium">
                      No pending items in moderation queue
                    </span>
                  </div>
                </div>
              )}
            </Card>

            {/* Processing Jobs List */}
            {queueStatus &&
              queueStatus.processingJobs &&
              queueStatus.processingJobs.length > 0 && (
                <Card className="p-6">
                  <div className="flex items-center mb-6">
                    <ClockIcon className="h-6 w-6 mr-3 text-blue-600" />
                    <h3 className="text-xl font-semibold text-gray-900">
                      Currently Processing ({queueStatus.processingJobs.length})
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {queueStatus.processingJobs.map(
                      (job: any, index: number) => (
                        <div
                          key={job.jobId || index}
                          className="border border-gray-200 rounded-lg p-4 bg-white"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  Chapter ID: {job.chapterId}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Operation:{" "}
                                  <span className="font-medium">
                                    {job.operation}
                                  </span>
                                  {job.priority && (
                                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                      Priority {job.priority}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">
                                {job.progress || 0}% Complete
                              </div>
                              {job.estimatedTimeRemaining && (
                                <div className="text-xs text-gray-500">
                                  ~{job.estimatedTimeRemaining}s remaining
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                              style={{ width: `${job.progress || 0}%` }}
                            ></div>
                          </div>

                          <div className="flex justify-between text-xs text-gray-500">
                            <span>
                              Started:{" "}
                              {job.startedAt
                                ? new Date(job.startedAt).toLocaleTimeString()
                                : "Unknown"}
                            </span>
                            <span>Job ID: {job.jobId}</span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </Card>
              )}

            {!queueStatus && (
              <Card className="p-6">
                <div className="text-center py-12">
                  <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Queue Status Unavailable
                  </h3>
                  <p className="text-gray-600">
                    Unable to fetch queue status. Please check if the processing
                    service is running.
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}


      </div>
    </div>
  );
}
