"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  Heart,
  Flag,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  Settings,
  BookOpen,
  MessageCircle,
  X,
  Palette,
  Type,
  Sun,
  Moon,
  List,
  Menu,
  Edit,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { chaptersApi } from "@/lib/api/chapters";
import { storiesApi } from "@/lib/api/stories";
import {
  useChapterReactionStatus,
  useToggleChapterLike,
} from "@/hooks/useReactions";
import {
  useAutoUpdateProgress,
  useUpdateReadingProgress,
  useChapterProgress,
} from "@/hooks/useReadingProgress";
import { useChapterAccess } from "@/hooks/useChapterAccess";
import { useBookAccess } from "@/hooks/useBookPurchase";
import {
  useChapterComments,
  useCreateComment,
  useToggleCommentLike,
  useUpdateComment,
  useDeleteComment,
  useFlagComment,
} from "@/hooks/useComments";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";

interface ReadingSettings {
  fontSize: number;
  fontFamily: string;
  backgroundColor: string;
  textColor: string;
  lineHeight: number;
  darkMode: boolean;
}

const defaultSettings: ReadingSettings = {
  fontSize: 18,
  fontFamily: "Georgia",
  backgroundColor: "#ffffff",
  textColor: "#1a1a1a",
  lineHeight: 1.7,
  darkMode: false,
};

const fontOptions = [
  { name: "Georgia", value: "Georgia" },
  { name: "Merriweather", value: "Merriweather" },
  { name: "Times New Roman", value: "Times New Roman" },
  { name: "Arial", value: "Arial" },
  { name: "Open Sans", value: "Open Sans" },
];

const backgroundOptions = [
  { name: "White", value: "#ffffff", textColor: "#1a1a1a" },
  { name: "Cream", value: "#faf7f0", textColor: "#2d2d2d" },
  { name: "Light Gray", value: "#f5f5f5", textColor: "#1a1a1a" },
  { name: "Dark", value: "#1a1a1a", textColor: "#e5e5e5" },
  { name: "Black", value: "#000000", textColor: "#ffffff" },
];

export default function ChapterReadPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const storyId = params.id as string;
  const chapterNumber = parseInt(params.chapterNumber as string);

  const [settings, setSettings] = useState<ReadingSettings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [showTableOfContents, setShowTableOfContents] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [showReportModal, setShowReportModal] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");

  const contentRef = useRef<HTMLDivElement>(null);

  // Prevent text selection and copying
  useEffect(() => {
    const preventSelection = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const preventCopy = (e: KeyboardEvent) => {
      // Prevent common copy/select shortcuts
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'a' || e.key.toLowerCase() === 'x' || 
         e.key.toLowerCase() === 'v' || e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'p')
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Prevent F12, Ctrl+Shift+I, Ctrl+U, Win+Shift+S, Win+Shift+T
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i') ||
        (e.ctrlKey && e.key.toLowerCase() === 'u') ||
        (e.metaKey && e.shiftKey && e.key.toLowerCase() === 's') ||
        (e.metaKey && e.shiftKey && e.key.toLowerCase() === 't')
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const preventContextMenu = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const preventDragStart = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Add event listeners with capture phase for better blocking
    document.addEventListener('selectstart', preventSelection, true);
    document.addEventListener('contextmenu', preventContextMenu, true);
    document.addEventListener('keydown', preventCopy, true);
    document.addEventListener('keyup', preventCopy, true);
    document.addEventListener('keypress', preventCopy, true);
    document.addEventListener('dragstart', preventDragStart, true);
    document.addEventListener('copy', preventSelection, true);
    document.addEventListener('cut', preventSelection, true);
    document.addEventListener('paste', preventSelection, true);

    // Cleanup
    return () => {
      document.removeEventListener('selectstart', preventSelection, true);
      document.removeEventListener('contextmenu', preventContextMenu, true);
      document.removeEventListener('keydown', preventCopy, true);
      document.removeEventListener('keyup', preventCopy, true);
      document.removeEventListener('keypress', preventCopy, true);
      document.removeEventListener('dragstart', preventDragStart, true);
      document.removeEventListener('copy', preventSelection, true);
      document.removeEventListener('cut', preventSelection, true);
      document.removeEventListener('paste', preventSelection, true);
    };
  }, []);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("reading-settings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Scroll to top when component mounts or chapter changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [storyId, chapterNumber]);

  // Save settings to localStorage
  const updateSettings = (newSettings: Partial<ReadingSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem("reading-settings", JSON.stringify(updated));
  };

  // Fetch story data
  const { data: story } = useQuery({
    queryKey: ["story", storyId],
    queryFn: () => storiesApi.getStory(storyId),
  });

  // Fetch chapter data
  const { data: chapter, isLoading } = useQuery({
    queryKey: ["chapter", storyId, chapterNumber],
    queryFn: () =>
      chaptersApi.getChapterByStoryAndNumber(storyId, chapterNumber),
  });

  // Fetch all chapters for navigation
  const { data: allChapters } = useQuery({
    queryKey: ["chapters", storyId],
    queryFn: () => chaptersApi.getChaptersByStory(storyId),
  });

  // Check if user is the story author
  const isAuthor = story && user && story.author.id === user.id;

  // Check access permissions
  const { data: hasChapterAccess = false } = useChapterAccess(
    chapter?.id || "",
    !!chapter && !!user && !isAuthor
  );
  const { data: hasBookAccess = false } = useBookAccess(
    storyId,
    !!story && !!user && !isAuthor
  );

  // Determine if user can access this chapter
  const canAccessChapter = () => {
    if (!chapter) return false;
    if (isAuthor) return true;

    // If the user has purchased the whole book, they should have access to all chapters.
    if (story?.pricingType === "WHOLE_BOOK" && hasBookAccess) {
      return true;
    }

    // Otherwise, check if the chapter is free or if the user has purchased it individually.
    if (chapter.isFree) return true;
    return hasChapterAccess;
  };

  // Reaction hooks
  const { data: reactionStatus } = useChapterReactionStatus(chapter?.id || "");
  const toggleReaction = useToggleChapterLike();

  const updateProgress = useAutoUpdateProgress(chapter?.id || "");
  const updateReadingProgress = useUpdateReadingProgress();
  const { data: currentProgress } = useChapterProgress(
    chapter?.id || "",
    !!chapter?.id
  );

  // Comment hooks
  const { data: commentsData, isLoading: isLoadingComments } =
    useChapterComments(chapter?.id || "", 0, 20, true);
  const createComment = useCreateComment();
  const toggleCommentLike = useToggleCommentLike();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  const flagComment = useFlagComment();

  // Extract comments from paginated response
  const comments = commentsData?.content || [];

  // Initial progress update when chapter loads (to add to Reading list)
  useEffect(() => {
    if (chapter && user && canAccessChapter() && !isAuthor) {
      // Only trigger initial progress update if there's no existing progress
      // This prevents overwriting completed chapters with 0% progress
      if (
        !currentProgress ||
        (!currentProgress.hasProgress &&
          currentProgress.progressPercentage === 0)
      ) {
        updateReadingProgress.mutate({
          chapterId: chapter.id,
          progressPercentage: 0,
        });
      }
    }
  }, [chapter?.id, user, isAuthor, currentProgress]); // Added currentProgress to dependencies

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      setShowScrollTop(scrollTop > 300);

      // Update reading progress - improved calculation
      if (chapter) {
        const documentHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;
        const scrollableHeight = documentHeight - windowHeight;

        // Calculate scroll percentage
        let progressPercent =
          scrollableHeight > 0 ? (scrollTop / scrollableHeight) * 100 : 0;

        // Check if user has reached the bottom (with a small threshold)
        const isAtBottom = scrollTop + windowHeight >= documentHeight - 20; // 20px threshold

        // If user has reached the bottom, mark as 100% complete
        if (isAtBottom) {
          progressPercent = 100;
        }

        const clampedPercent = Math.min(100, Math.max(0, progressPercent));
        updateProgress(clampedPercent);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [chapter, updateProgress]);

  const handleLike = () => {
    if (!chapter) return;
    toggleReaction.mutate(chapter.id);
  };

  const handleReport = () => {
    toast.success(
      "Report submitted. Thank you for helping keep our community safe."
    );
  };

  const handleSubmitComment = () => {
    if (!newComment.trim() || !chapter) return;

    createComment.mutate(
      {
        content: newComment.trim(),
        chapterId: chapter.id,
        storyId: storyId,
      },
      {
        onSuccess: () => {
          setNewComment("");
        },
      }
    );
  };

  const handleEditComment = (commentId: string, content: string) => {
    updateComment.mutate(
      { commentId, content },
      {
        onSuccess: () => {
          setEditingCommentId(null);
          setEditCommentContent("");
        },
      }
    );
  };

  const handleDeleteComment = (commentId: string) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      deleteComment.mutate(commentId);
    }
  };

  const handleLikeComment = (commentId: string) => {
    toggleCommentLike.mutate(commentId);
  };

  const handleReportComment = (commentId: string) => {
    if (!reportReason.trim()) {
      toast.error("Please provide a reason for reporting");
      return;
    }

    flagComment.mutate(
      {
        commentId,
        reason: reportReason.trim(),
      },
      {
        onSuccess: () => {
          setShowReportModal(null);
          setReportReason("");
        },
      }
    );
  };

  // Close modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        !target.closest(".comment-actions-menu") &&
        !target.closest(".report-modal")
      ) {
        setShowReportModal(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper functions to check permissions
  const canEditComment = (comment: any) => {
    return user && comment.user.id === user.id;
  };

  const canDeleteComment = (comment: any) => {
    if (!user) return false;
    // Comment owner can delete their own comments
    if (comment.user.id === user.id) return true;
    // Chapter/story author can delete any comments on their content
    if (story && story.author.id === user.id) return true;
    // Admin can delete any comments
    if (user.role === "admin") return true;
    return false;
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavigation = (direction: "prev" | "next") => {
    if (!allChapters) return;

    const currentIndex = allChapters.findIndex(
      (ch) => ch.chapterNumber === chapterNumber
    );
    const targetIndex =
      direction === "prev" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex >= 0 && targetIndex < allChapters.length) {
      const targetChapter = allChapters[targetIndex];
      router.push(
        `/stories/${storyId}/chapters/${targetChapter.chapterNumber}/read`
      );
    }
  };

  const getPrevChapter = () => {
    if (!allChapters) return null;
    const currentIndex = allChapters.findIndex(
      (ch) => ch.chapterNumber === chapterNumber
    );
    return currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  };

  const getNextChapter = () => {
    if (!allChapters) return null;
    const currentIndex = allChapters.findIndex(
      (ch) => ch.chapterNumber === chapterNumber
    );
    return currentIndex < allChapters.length - 1
      ? allChapters[currentIndex + 1]
      : null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!chapter || !story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Chapter not found
          </h1>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (!canAccessChapter()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-center p-4">
        <BookOpen size={64} className="text-red-500 mb-4" />
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
          Chapter Locked
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          You do not have access to this chapter. Please purchase the chapter or
          the full book to read.
        </p>
        <button
          onClick={() => router.push(`/stories/${storyId}`)}
          className="mt-6 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Story Details
        </button>
      </div>
    );
  }

  const prevChapter = getPrevChapter();
  const nextChapter = getNextChapter();

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        backgroundColor: settings.backgroundColor,
        color: settings.textColor,
      }}
    >
      {/* Top Section - Book Cover and Title */}
      <div className="text-center py-8 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4">
          {story.coverImageUrl && (
            <div className="mb-6">
              <Image
                src={story.coverImageUrl}
                alt={story.title}
                width={200}
                height={300}
                className="mx-auto rounded-lg shadow-lg"
              />
            </div>
          )}
          <h1 className="text-2xl font-bold mb-2">{story.title}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            by {story.author.username}
          </p>
        </div>
      </div>

      {/* Right Panel Controls */}
      <div className="fixed top-1/2 right-4 transform -translate-y-1/2 z-40">
        <div className="flex flex-col gap-2">
          {/* Table of Contents Button */}
          <button
            onClick={() => setShowTableOfContents(true)}
            className="w-12 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            title="Table of Contents"
          >
            <List className="w-5 h-5" />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="w-12 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            title="Reading Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Table of Contents Modal */}
      {showTableOfContents && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <List className="w-5 h-5" />
                Table of Contents
              </h3>
              <button
                onClick={() => setShowTableOfContents(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-96 p-4">
              {allChapters && allChapters.length > 0 ? (
                <div className="space-y-2">
                  {allChapters.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => {
                        router.push(
                          `/stories/${storyId}/chapters/${ch.chapterNumber}/read`
                        );
                        setShowTableOfContents(false);
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                        ch.chapterNumber === chapterNumber
                          ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      <div className="font-medium">
                        Chapter {ch.chapterNumber}
                      </div>
                      <div className="text-sm opacity-75 truncate">
                        {ch.title}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No chapters available
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Reading Settings
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-96 p-4 space-y-6">
              {/* Font Size */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Font Size
                </label>
                <input
                  type="range"
                  min="14"
                  max="24"
                  value={settings.fontSize}
                  onChange={(e) =>
                    updateSettings({ fontSize: parseInt(e.target.value) })
                  }
                  className="w-full"
                />
                <div className="text-sm text-gray-600 mt-1">
                  {settings.fontSize}px
                </div>
              </div>

              {/* Font Family */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Font Family
                </label>
                <select
                  value={settings.fontFamily}
                  onChange={(e) =>
                    updateSettings({ fontFamily: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                >
                  {fontOptions.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Background Color */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Background
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {backgroundOptions.map((bg) => (
                    <button
                      key={bg.value}
                      onClick={() =>
                        updateSettings({
                          backgroundColor: bg.value,
                          textColor: bg.textColor,
                        })
                      }
                      className={`p-3 rounded border-2 ${
                        settings.backgroundColor === bg.value
                          ? "border-blue-500"
                          : "border-gray-300"
                      }`}
                      style={{ backgroundColor: bg.value, color: bg.textColor }}
                    >
                      {bg.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Height */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Line Height
                </label>
                <input
                  type="range"
                  min="1.2"
                  max="2.0"
                  step="0.1"
                  value={settings.lineHeight}
                  onChange={(e) =>
                    updateSettings({ lineHeight: parseFloat(e.target.value) })
                  }
                  className="w-full"
                />
                <div className="text-sm text-gray-600 mt-1">
                  {settings.lineHeight}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 py-8 relative">
        {/* Chapter Content */}
        <div ref={contentRef} className="relative">
          {/* Chapter Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4">
              Chapter {chapter.chapterNumber} - {chapter.title}
            </h2>
          </div>

          {/* Chapter Content */}
          <div
            className="prose prose-lg max-w-none mb-8 select-none"
            style={{
              fontFamily: settings.fontFamily,
              fontSize: `${settings.fontSize}px`,
              lineHeight: settings.lineHeight,
              color: settings.textColor,
              wordWrap: "break-word",
              overflowWrap: "break-word",
              wordBreak: "break-word",
              hyphens: "auto",
              userSelect: "none",
              WebkitUserSelect: "none",
              MozUserSelect: "none",
              msUserSelect: "none",
              WebkitTouchCallout: "none",
              WebkitTapHighlightColor: "transparent",
            }}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            onPaste={(e) => e.preventDefault()}
            dangerouslySetInnerHTML={{ __html: chapter.content }}
          />
        </div>

        {/* Actions Section */}
        <div className="flex items-center gap-4 py-6 border-t border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              reactionStatus?.liked
                ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            <Heart
              className={`w-5 h-5 ${
                reactionStatus?.liked ? "fill-current" : ""
              }`}
            />
            Like ({reactionStatus?.totalLikes || chapter.likes})
          </button>

          <button
            onClick={handleReport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <Flag className="w-5 h-5" />
            Report
          </button>
        </div>

        {/* Comments Section */}
        <div className="py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-6 h-6" />
              <h3 className="text-xl font-semibold">Comments</h3>
              <span className="text-sm text-gray-500">({comments.length})</span>
            </div>
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              {showComments ? "Hide Comments" : "Show Comments"}
            </button>
          </div>

          {showComments && (
            <>
              {/* Comment Form */}
              <div className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts about this chapter..."
                  className="w-full p-4 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
                  rows={3}
                  disabled={createComment.isPending}
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || createComment.isPending}
                  className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createComment.isPending ? "Posting..." : "Post Comment"}
                </button>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {isLoadingComments ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading comments...</p>
                  </div>
                ) : comments.length > 0 ? (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                            {comment.user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {comment.user.username}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(
                                  comment.createdAt
                                ).toLocaleDateString()}
                              </span>
                              {comment.user.id === user?.id && (
                                <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
                                  You
                                </span>
                              )}
                              {story && comment.user.id === story.author.id && (
                                <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">
                                  Author
                                </span>
                              )}
                              {story &&
                                user?.id === story.author.id &&
                                comment.user.id !== user.id && (
                                  <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded">
                                    Your Chapter
                                  </span>
                                )}
                            </div>

                            {/* Comment Actions Menu */}
                            <div className="relative comment-actions-menu">
                              <button
                                onClick={() =>
                                  setShowReportModal(
                                    showReportModal === comment.id
                                      ? null
                                      : comment.id
                                  )
                                }
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {showReportModal === comment.id && (
                                <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-32">
                                  <div className="p-2">
                                    <button
                                      onClick={() => {
                                        setShowReportModal(null);
                                        // Open report modal
                                        setReportReason("");
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2 text-red-600 dark:text-red-400"
                                    >
                                      <Flag className="w-4 h-4" />
                                      Report
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Comment Content */}
                          {editingCommentId === comment.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editCommentContent}
                                onChange={(e) =>
                                  setEditCommentContent(e.target.value)
                                }
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg resize-none"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    handleEditComment(
                                      comment.id,
                                      editCommentContent
                                    )
                                  }
                                  disabled={updateComment.isPending}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {updateComment.isPending
                                    ? "Saving..."
                                    : "Save"}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingCommentId(null);
                                    setEditCommentContent("");
                                  }}
                                  className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-700 dark:text-gray-300">
                              {comment.content}
                            </p>
                          )}

                          {/* Comment Actions */}
                          <div className="flex items-center gap-4 mt-3">
                            <button
                              onClick={() => handleLikeComment(comment.id)}
                              disabled={toggleCommentLike.isPending}
                              className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50"
                            >
                              <Heart
                                className={`w-4 h-4 ${
                                  comment.likes > 0
                                    ? "fill-current text-red-500"
                                    : ""
                                }`}
                              />
                              {comment.likes || 0}
                            </button>

                            {/* Edit Button - Only for comment owner */}
                            {canEditComment(comment) && (
                              <button
                                onClick={() => {
                                  setEditingCommentId(comment.id);
                                  setEditCommentContent(comment.content);
                                }}
                                className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                            )}

                            {/* Delete Button - For comment owner and chapter owner */}
                            {canDeleteComment(comment) && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    No comments yet. Be the first to share your thoughts!
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-6 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}

      {/* Stable Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 z-30">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          {/* Previous Chapter */}
          <button
            onClick={() => handleNavigation("prev")}
            disabled={!prevChapter}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              prevChapter
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                : "bg-gray-50 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            <div className="text-left">
              <div className="text-xs">Previous</div>
              {prevChapter && (
                <div className="text-sm font-medium truncate max-w-32">
                  Ch. {prevChapter.chapterNumber} - {prevChapter.title}
                </div>
              )}
            </div>
          </button>

          {/* Chapter Info */}
          <div className="text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Chapter {chapter.chapterNumber} of {story.totalChapters}
            </div>
          </div>

          {/* Next Chapter */}
          <button
            onClick={() => handleNavigation("next")}
            disabled={!nextChapter}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              nextChapter
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                : "bg-gray-50 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500"
            }`}
          >
            <div className="text-right">
              <div className="text-xs">Next</div>
              {nextChapter && (
                <div className="text-sm font-medium truncate max-w-32">
                  Ch. {nextChapter.chapterNumber} - {nextChapter.title}
                </div>
              )}
            </div>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom padding to account for fixed navigation */}
      <div className="h-20"></div>

      {/* Report Comment Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full report-modal">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Flag className="w-5 h-5" />
                Report Comment
              </h3>
              <button
                onClick={() => {
                  setShowReportModal(null);
                  setReportReason("");
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Please provide a reason for reporting this comment. This helps
                us maintain a safe community.
              </p>

              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Describe the issue..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg resize-none"
                rows={4}
              />

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowReportModal(null);
                    setReportReason("");
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReportComment(showReportModal)}
                  disabled={!reportReason.trim() || flagComment.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {flagComment.isPending ? "Reporting..." : "Report Comment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
