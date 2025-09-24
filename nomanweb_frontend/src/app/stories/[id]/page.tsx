"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { Story } from "@/types/story";
import {
  useStory,
  usePublishStory,
  useUnpublishStory,
  useDeleteStory,
  useIncrementStoryView,
} from "@/hooks/useStories";
import { useAuth } from "@/contexts/AuthContext";
import {
  useStoryReactionStatus,
  useToggleStoryLike,
} from "@/hooks/useReactions";
import { useBookmarkStatus, useToggleBookmark } from "@/hooks/useLibraries";
import { useChaptersByStory } from "@/hooks/useChapters";
import {
  useChapterAccessBatch,
  useChapterAccess,
} from "@/hooks/useChapterAccess";
import { usePurchaseChapter } from "@/hooks/useChapterPurchase";
import { useCoinBalance } from "@/hooks/useCoinBalance";
import { usePurchaseBook, useBookAccess } from "@/hooks/useBookPurchase";
import {
  useStoryComments,
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
  useToggleCommentLike,
} from "@/hooks/useComments";
import { useRatingOperations } from "@/hooks/useRatings";
import { formatDistanceToNow } from "date-fns";
import {
  EyeIcon,
  HeartIcon,
  BookOpenIcon,
  StarIcon,
  UserIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  CalendarIcon,
  TagIcon,
  PlusIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  BookmarkIcon,
  ShoppingBagIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  BookmarkIcon as BookmarkIconSolid,
  ShoppingBagIcon as ShoppingBagIconSolid,
} from "@heroicons/react/24/solid";
import { toast } from "react-hot-toast";
import ChapterManagement from "@/components/chapters/ChapterManagement";
import ChapterPurchaseModal from "@/components/monetization/ChapterPurchaseModal";
import BookPurchaseModal from "@/components/monetization/BookPurchaseModal";
import EnhancedGiftModal from "@/components/monetization/EnhancedGiftModal";
import {
  BookOpen,
  Heart,
  Share2,
  Plus,
  Star,
  Eye,
  MessageCircle,
  ThumbsUp,
  Flag,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Gift,
  Tag,
} from "lucide-react";

// Using Story type from @/types/story instead of local interface

interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
  views: number;
  likes: number;
  createdAt: string;
}

interface Comment {
  id: string;
  user: {
    id: string;
    username: string;
    profileImageUrl?: string;
  };
  content: string;
  likes: number;
  createdAt: string;
  replies?: Comment[];
}

export default function StoryReaderView() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const storyId = params.id as string;

  const { data: story, isLoading, error } = useStory(storyId);

  // Debug log the raw story data
  useEffect(() => {
    console.log("🔍 useStory hook state:", {
      story,
      isLoading,
      error,
      storyId,
    });
    if (story) {
      console.log(
        "📖 Raw story data received:",
        JSON.stringify(story, null, 2)
      );
      console.log("📖 Story pricingType specifically:", story.pricingType);
    } else {
      console.log("❌ No story data available");
    }
  }, [story, isLoading, error, storyId]);
  const { mutate: publishStory, isPending: isPublishing } = usePublishStory();
  const { mutate: unpublishStory, isPending: isUnpublishing } =
    useUnpublishStory();
  const { mutate: deleteStory, isPending: isDeleting } = useDeleteStory();
  const { mutate: incrementStoryView } = useIncrementStoryView();

  // Reaction hooks with real-time updates
  const { data: reactionStatus, isFetching: isFetchingReactions } =
    useStoryReactionStatus(storyId, !!user, true); // Enable real-time updates
  const { mutate: toggleStoryLike, isPending: isLikeLoading } =
    useToggleStoryLike();

  // Reading list hooks
  const { data: bookmarkStatus } = useBookmarkStatus(storyId, !!user);
  const { mutate: toggleBookmark, isPending: isBookmarkLoading } =
    useToggleBookmark();

  // Rating hooks
  const {
    userRating: userRatingData,
    ratingStats,
    handleRating: submitRating,
    handleDeleteRating,
    canRate,
    hasRated,
    currentRating,
    averageRating,
    totalRatings,
    isSubmitting: isRatingLoading,
  } = useRatingOperations(storyId);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<"about" | "chapters" | "comments">(
    "about"
  );
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showLibraryDropdown, setShowLibraryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedChapterForPurchase, setSelectedChapterForPurchase] = useState<{
    id: string;
    title: string;
    coinPrice: number;
  } | null>(null);
  const [showBookPurchaseModal, setShowBookPurchaseModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);

  // Update local userRating state when API data changes
  useEffect(() => {
    if (currentRating !== null) {
      setUserRating(currentRating);
    } else {
      setUserRating(0);
    }
  }, [currentRating]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowLibraryDropdown(false);
      }
    };

    if (showLibraryDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLibraryDropdown]);

  // Fetch chapters and comments data with real-time updates
  const { data: storyChapters = [], isLoading: isLoadingChapters } =
    useChaptersByStory(storyId, !!storyId);
  const {
    data: commentsData,
    isLoading: isLoadingComments,
    isFetching: isFetchingComments,
    refetch: refetchComments,
  } = useStoryComments(storyId, 0, 20, true); // Enable real-time updates
  const { mutate: createComment, isPending: isCreatingComment } =
    useCreateComment();
  const { mutate: deleteComment, isPending: isDeletingComment } =
    useDeleteComment();
  const { mutate: updateComment, isPending: isUpdatingComment } =
    useUpdateComment();
  const { mutate: toggleCommentLike, isPending: isTogglingCommentLike } =
    useToggleCommentLike();

  // Extract comments from the paginated response
  const storyComments = (commentsData as any)?.content || [];

  // Check if current user is the story author
  const isAuthor = user && story && user.id === story.author.id;

  // Chapter access and purchase hooks
  const chapterIds = storyChapters.map((chapter: any) => chapter.id);
  const { data: chapterAccess = {} } = useChapterAccessBatch(
    chapterIds,
    story?.updatedAt || "",
    !!user && !isAuthor
  );
  const { mutate: purchaseChapter, isPending: isPurchasing } =
    usePurchaseChapter();
  const { data: coinBalance = 0 } = useCoinBalance(!!user);

  // Book access and purchase hooks
  const { data: hasBookAccess = false } = useBookAccess(
    storyId,
    story?.updatedAt || "",
    !!user && !isAuthor
  );
  const { mutate: purchaseBook, isPending: isPurchasingBook } =
    usePurchaseBook();

  // Debug log for book access status
  console.log(
    "🔍 Debug - hasBookAccess:",
    hasBookAccess,
    "user:",
    !!user,
    "isAuthor:",
    isAuthor,
    "storyId:",
    storyId
  );
  console.log(
    "🔍 Badge condition - pricingType:",
    story?.pricingType,
    "isAuthor:",
    isAuthor,
    "hasBookAccess === true:",
    hasBookAccess === true,
    "should show badge:",
    story?.pricingType === "WHOLE_BOOK" && !isAuthor && hasBookAccess === true
  );

  // Use hasBookAccess from useBookAccess hook for book ownership check

  // Temporarily disabled cache clearing to debug story loading
  // useEffect(() => {
  //   console.log('🔄 Starting cache clearing for story:', storyId);
  //
  //   // Remove book access queries for this specific story
  //   queryClient.removeQueries({
  //     predicate: (query) => {
  //       const key = query.queryKey;
  //       return Array.isArray(key) && key[0] === "bookAccess" && key[1] === storyId;
  //     },
  //   });

  //   // Remove chapter access queries
  //   queryClient.removeQueries({
  //     predicate: (query) => {
  //       const key = query.queryKey;
  //       return Array.isArray(key) && key[0].startsWith("chapter-access");
  //     },
  //   });

  //   console.log('🔄 Completed cache clearing for story:', storyId);
  // }, [storyId, queryClient]);

  // Additional effect to force refresh when story data changes
  useEffect(() => {
    if (story) {
      console.log("📖 Story loaded:", {
        id: story.id,
        title: story.title,
        pricingType: story.pricingType,
        bookPrice: story.bookPrice,
      });

      // Force refresh book access when story loads
      queryClient.invalidateQueries({
        queryKey: ["bookAccess", storyId],
      });
    }
  }, [story, storyId, queryClient]);

  // Track story view when component mounts and story is loaded
  useEffect(() => {
    if (story && !isAuthor) {
      // Only track view if user is not the author
      incrementStoryView(storyId);
    }
  }, [story, isAuthor, storyId, incrementStoryView]);

  if (isLoading) {
    return <StoryDetailSkeleton />;
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center card-elevated p-8 max-w-md mx-4">
          <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <BookOpenIcon className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-nomanweb-primary mb-2">
            Story Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The story you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/stories"
            className="btn-gradient px-6 py-3 rounded-lg font-semibold hover-lift inline-flex items-center space-x-2"
          >
            <BookOpenIcon className="w-4 h-4" />
            <span>Browse Stories</span>
          </Link>
        </div>
      </div>
    );
  }

  const handlePublish = () => {
    publishStory(storyId);
  };

  const handleUnpublish = () => {
    unpublishStory(storyId);
  };

  const handleDelete = () => {
    deleteStory(storyId, {
      onSuccess: () => {
        router.push("/dashboard");
      },
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: story.title,
          text: story.description,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleReadStory = () => {
    // For WHOLE_BOOK pricing, check if user has purchased the book
    if (story.pricingType === "WHOLE_BOOK") {
      if (hasBookAccess === true || isAuthor) {
        // User has purchased the book or is the author - navigate to first chapter
        if (storyChapters.length > 0) {
          router.push(
            `/stories/${storyId}/chapters/${storyChapters[0].chapterNumber}/read`
          );
        }
      } else {
        // User hasn't purchased the book - show book purchase modal
        setShowBookPurchaseModal(true);
      }
    } else {
      // For other pricing types, navigate to first chapter
      if (storyChapters.length > 0) {
        router.push(
          `/stories/${storyId}/chapters/${storyChapters[0].chapterNumber}/read`
        );
      }
    }
  };

  const handleAddToLibrary = (listType: string = "LIKE") => {
    if (!user) {
      toast.error("Please login to add to library");
      return;
    }

    toggleBookmark({
      storyId,
      listType,
    });
    setShowLibraryDropdown(false);
  };

  const getLibraryButtonStatus = () => {
    if (!bookmarkStatus?.listTypes) return { inLibrary: false, types: [] };

    const activeTypes = Object.entries(bookmarkStatus.listTypes)
      .filter(([_, active]) => active)
      .map(([type, _]) => type);

    return {
      inLibrary: activeTypes.length > 0,
      types: activeTypes,
    };
  };

  const libraryStatus = getLibraryButtonStatus();

  const libraryOptions = [
    {
      type: "READING",
      label: "Currently Reading",
      icon: EyeIcon,
      solidIcon: EyeIcon,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      type: "WANT_TO_READ",
      label: "Want to Read",
      icon: BookmarkIcon,
      solidIcon: BookmarkIconSolid,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      type: "LIKE",
      label: "Liked",
      icon: HeartIcon,
      solidIcon: HeartIconSolid,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      type: "COMPLETED",
      label: "Completed",
      icon: CheckCircleIcon,
      solidIcon: CheckCircleIconSolid,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      type: "PURCHASED",
      label: "Purchased",
      icon: ShoppingBagIcon,
      solidIcon: ShoppingBagIconSolid,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
  ];

  const handleLike = () => {
    if (!user) {
      toast.error("Please login to like this story");
      return;
    }
    // Update bookmark status in library
    toggleBookmark({
      storyId,
      listType: "LIKE",
    });
    // Update like count in stories database
    toggleStoryLike(storyId);
  };

  const handleRating = (rating: number) => {
    if (!user) {
      toast.error("Please log in to rate this story");
      return;
    }

    if (!canRate && !hasRated) {
      toast.error("You cannot rate this story");
      return;
    }

    setUserRating(rating);
    submitRating(rating);
  };

  const handleCommentSubmit = () => {
    if (!user) {
      toast.error("Please log in to comment");
      return;
    }

    if (newComment.trim()) {
      createComment({
        storyId,
        content: newComment.trim(),
      });
      setNewComment("");
    }
  };

  const handleDeleteComment = (commentId: string) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      deleteComment(commentId);
    }
  };

  const handleEditComment = (commentId: string, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditContent(currentContent);
  };

  const handleSaveEdit = () => {
    if (!editingCommentId || !editContent.trim()) return;

    updateComment({
      commentId: editingCommentId,
      content: editContent.trim(),
    });

    setEditingCommentId(null);
    setEditContent("");
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent("");
  };

  const handleCommentLike = (commentId: string) => {
    if (!user) {
      toast.error("Please log in to like comments");
      return;
    }
    toggleCommentLike(commentId);
  };

  const handleChapterClick = (chapter: any) => {
    const isPaidChapter = !chapter.isFree && chapter.coinPrice > 0;
    const hasChapterAccess = chapterAccess[chapter.id] || chapter.isFree;

    // For WHOLE_BOOK pricing, check if user has purchased the book
    if (story.pricingType === "WHOLE_BOOK") {
      if (hasBookAccess === true || isAuthor) {
        // User has purchased the book or is the author - allow access
        router.push(
          `/stories/${storyId}/chapters/${chapter.chapterNumber}/read`
        );
      } else {
        // User hasn't purchased the book - show book purchase modal
        setShowBookPurchaseModal(true);
      }
    } else {
      // For PAID_PER_CHAPTER pricing, check individual chapter access
      if (isPaidChapter && !hasChapterAccess && !isAuthor) {
        setSelectedChapterForPurchase({
          id: chapter.id,
          title: chapter.title,
          coinPrice: chapter.coinPrice,
        });
        setShowPurchaseModal(true);
      } else {
        router.push(
          `/stories/${storyId}/chapters/${chapter.chapterNumber}/read`
        );
      }
    }
  };

  const handlePurchaseComplete = () => {
    setShowPurchaseModal(false);
    setSelectedChapterForPurchase(null);
  };

  const handleBookPurchase = () => {
    setShowBookPurchaseModal(true);
  };

  const handleBookPurchaseComplete = () => {
    setShowBookPurchaseModal(false);
  };

  const getBookStatus = (bookStatus: string) => {
    return bookStatus === "COMPLETED" ? "Completed" : "Ongoing";
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Use real rating data from API
  const storyRating = averageRating || 0;
  const storyRatingCount = totalRatings || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <nav className="flex items-center flex-wrap gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600 transition-colors flex-shrink-0">
              Home
            </Link>
            <span className="flex-shrink-0">/</span>
            {story.category ? (
              <Link
                href={`/categories/${story.category.slug}`}
                className="hover:text-blue-600 transition-colors flex-shrink-0 truncate max-w-[120px] sm:max-w-none"
              >
                {story.category.name}
              </Link>
            ) : (
              <span className="flex-shrink-0">Uncategorized</span>
            )}
            <span className="flex-shrink-0">/</span>
            <span className="text-gray-900 font-medium truncate min-w-0 flex-1">
              {story.title}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Book Details Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 md:p-10 lg:p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-16 lg:gap-10">
            {/* Book Cover */}
            <div className="md:col-span-1">
              <div className="relative w-full max-w-sm mx-auto mb-8 md:mb-0">
                {story.coverImageUrl ? (
                  <div className="relative w-[250px] h-[334px] sm:w-[280px] sm:h-[374px] md:w-[260px] md:h-[347px] lg:w-[308px] lg:h-[412px] overflow-hidden rounded-lg shadow-xl border border-gray-300 mx-auto">
                    <Image
                      src={story.coverImageUrl}
                      alt={story.title}
                      fill
                      className="object-cover"
                    />
                    {/* Book spine effect */}
                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-l from-black/30 to-transparent"></div>
                    {/* Book depth shadow */}
                    <div className="absolute -right-1 top-2 bottom-2 w-3 bg-gradient-to-r from-gray-400/40 to-gray-600/60 rounded-r-lg -z-10"></div>
                  </div>
                ) : (
                  <div className="relative w-[250px] h-[334px] sm:w-[280px] sm:h-[374px] md:w-[260px] md:h-[347px] lg:w-[308px] lg:h-[412px] bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg shadow-xl border border-gray-300 overflow-hidden mx-auto">
                    {/* Book cover design */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100"></div>
                    <div className="absolute top-4 left-4 right-4 bottom-4 border border-blue-200 rounded-md bg-white/50"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="h-20 w-20 text-blue-600 relative z-10" />
                    </div>
                    {/* Book spine shadow */}
                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-l from-black/20 to-transparent"></div>
                    {/* Book depth shadow */}
                    <div className="absolute -right-1 top-2 bottom-2 w-3 bg-gradient-to-r from-gray-400/40 to-gray-600/60 rounded-r-lg -z-10"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Book Information */}
            <div className="md:col-span-2 space-y-6 md:space-y-10">
              {/* Title and Author */}
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                  {story.title}
                </h1>
                <p className="text-base sm:text-lg text-gray-600 mb-1">
                  {story.category?.name || "Uncategorized"}
                </p>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <Link
                    href={`/authors/${story.author.id}`}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {story.author.displayName || story.author.username}
                  </Link>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-6 md:mb-10">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Eye className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                  <div className="text-lg font-semibold text-gray-900">
                    {formatNumber(story.totalViews)}
                  </div>
                  <div className="text-xs text-gray-500">Views</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Heart className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                  <div className="text-lg font-semibold text-gray-900">
                    {formatNumber(
                      reactionStatus?.totalLikes || story.totalLikes
                    )}
                  </div>
                  <div className="text-xs text-gray-500">Likes</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <BookOpen className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                  <div className="text-lg font-semibold text-gray-900">
                    {story.totalChapters}
                  </div>
                  <div className="text-xs text-gray-500">Chapters</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mb-1 ${
                      story.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {getBookStatus(story.bookStatus)}
                  </div>
                  <div className="text-xs text-gray-500">Status</div>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-4 mb-4 md:mb-8">
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.floor(storyRating)
                          ? "text-yellow-400 fill-current"
                          : star <= storyRating
                          ? "text-yellow-400 fill-current opacity-50"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="text-lg font-semibold text-gray-900 ml-2">
                    {storyRating}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({formatNumber(storyRatingCount)} ratings)
                  </span>
                </div>
              </div>

              {/* Report Link */}
              <div className="mb-4 md:mb-8">
                <button className="text-red-600 hover:text-red-700 text-sm flex items-center space-x-1">
                  <Flag className="h-4 w-4" />
                  <span>Report story</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 md:gap-6">
                <button
                  onClick={handleReadStory}
                  className="text-white px-6 py-3 rounded-lg hover:opacity-80 transition-all font-medium flex items-center space-x-2"
                  style={{ backgroundColor: "#18243c" }}
                >
                  <BookOpen className="h-5 w-5" />
                  <span>Read</span>
                </button>

                {/* Buy Whole Book Button */}
                {story.pricingType === "WHOLE_BOOK" &&
                  !isAuthor &&
                  hasBookAccess === false && (
                    <button
                      onClick={handleBookPurchase}
                      disabled={isPurchasingBook}
                      className="text-white px-6 py-3 rounded-lg hover:opacity-80 transition-all font-medium flex items-center space-x-2 disabled:opacity-50"
                      style={{ backgroundColor: "#18243c" }}
                    >
                      <ShoppingBagIcon className="h-5 w-5" />
                      <span>
                        {isPurchasingBook
                          ? "Purchasing..."
                          : `Buy Book (${story.bookPrice || 0} coins)`}
                      </span>
                    </button>
                  )}

                {/* Book Already Purchased Badge */}
                {(() => {
                  const shouldShowBadge =
                    story.pricingType === "WHOLE_BOOK" &&
                    !isAuthor &&
                    hasBookAccess === true;
                  console.log(
                    "🔍 Badge render check - pricingType:",
                    story.pricingType,
                    "isAuthor:",
                    isAuthor,
                    "hasBookAccess:",
                    hasBookAccess,
                    "shouldShow:",
                    shouldShowBadge
                  );
                  return shouldShowBadge ? (
                    <div className="bg-green-100 text-green-800 px-6 py-3 rounded-lg font-medium flex items-center space-x-2">
                      <CheckCircleIcon className="h-5 w-5" />
                      <span>Book Purchased</span>
                    </div>
                  ) : null;
                })()}
                {/* Library Dropdown Button */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowLibraryDropdown(!showLibraryDropdown)}
                    disabled={isBookmarkLoading}
                    className={`px-6 py-3 rounded-lg transition-all font-medium flex items-center space-x-2 ${
                      libraryStatus.inLibrary
                        ? "text-white"
                        : "text-white hover:opacity-80"
                    } ${
                      isBookmarkLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    style={{ backgroundColor: "#18243c" }}
                  >
                    <Plus className="h-5 w-5" />
                    <span>
                      {isBookmarkLoading
                        ? "Updating..."
                        : libraryStatus.inLibrary
                        ? `In Library (${libraryStatus.types.length})`
                        : "Add to Library"}
                    </span>
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {showLibraryDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="p-3 border-b border-gray-100">
                        <h3 className="text-sm font-medium text-gray-900">
                          Add to Library
                        </h3>
                        <p className="text-xs text-gray-500">
                          Choose a reading list
                        </p>
                      </div>
                      <div className="p-2">
                        {libraryOptions.map((option) => {
                          const Icon = option.icon;
                          const SolidIcon = option.solidIcon;
                          const isActive =
                            bookmarkStatus?.listTypes?.[
                              option.type.toLowerCase() as keyof typeof bookmarkStatus.listTypes
                            ];

                          // Check if this option should be disabled to prevent conflicts
                          const isReadingActive =
                            bookmarkStatus?.listTypes?.reading;
                          const isCompletedActive =
                            bookmarkStatus?.listTypes?.completed;

                          const isDisabled =
                            (option.type === "READING" &&
                              isCompletedActive &&
                              !isActive) ||
                            (option.type === "COMPLETED" &&
                              isReadingActive &&
                              !isActive);

                          return (
                            <button
                              key={option.type}
                              onClick={() =>
                                !isDisabled && handleAddToLibrary(option.type)
                              }
                              disabled={isDisabled}
                              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                isDisabled
                                  ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                                  : isActive
                                  ? `${option.bgColor} ${option.color}`
                                  : "text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              {isActive ? (
                                <SolidIcon className="h-5 w-5" />
                              ) : (
                                <Icon
                                  className={`h-5 w-5 ${
                                    isDisabled ? "opacity-50" : ""
                                  }`}
                                />
                              )}
                              <span className="flex-1 text-left">
                                {option.label}
                                {isDisabled && (
                                  <span className="block text-xs text-gray-400 mt-1">
                                    {option.type === "READING"
                                      ? "Remove from Completed first"
                                      : "Remove from Reading first"}
                                  </span>
                                )}
                              </span>
                              {isActive && <span className="text-xs">✓</span>}
                            </button>
                          );
                        })}

                        {libraryStatus.inLibrary && (
                          <>
                            <div className="border-t border-gray-100 my-2"></div>
                            <button
                              onClick={() => handleAddToLibrary("REMOVE")}
                              className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <TrashIcon className="h-5 w-5" />
                              <span>Remove from Library</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleShare}
                  className="text-white px-6 py-3 rounded-lg hover:opacity-80 transition-all font-medium flex items-center space-x-2"
                  style={{ backgroundColor: "#18243c" }}
                >
                  <Share2 className="h-5 w-5" />
                  <span>Share</span>
                </button>
                <button
                  onClick={handleLike}
                  disabled={isBookmarkLoading}
                  className={`px-6 py-3 rounded-lg transition-all duration-200 font-medium flex items-center space-x-2 text-white hover:opacity-80 ${
                    isBookmarkLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  style={{ backgroundColor: "#18243c" }}
                  title={
                    bookmarkStatus?.listTypes?.LIKE
                      ? "Unlike story"
                      : "Like story"
                  }
                >
                  <Heart
                    className={`h-5 w-5 transition-all duration-200 ${
                      bookmarkStatus?.listTypes?.LIKE ? "fill-current" : ""
                    } ${isBookmarkLoading ? "animate-pulse" : ""}`}
                  />
                  <span className="transition-all duration-200">
                    {bookmarkStatus?.listTypes?.LIKE ? "Liked" : "Like"}
                    {isBookmarkLoading && (
                      <span className="ml-1 text-xs animate-pulse">↻</span>
                    )}
                  </span>
                  {reactionStatus?.totalLikes &&
                    reactionStatus.totalLikes > 0 && (
                      <span className="text-xs transition-all duration-200">
                        ({formatNumber(reactionStatus.totalLikes)})
                      </span>
                    )}
                </button>


              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              {[
                { id: "about", label: "About" },
                { id: "chapters", label: `Chapters (${story.totalChapters})` },
                { id: "comments", label: `Comments (${story.totalComments})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "text-gray-700"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  style={{
                    borderBottomColor:
                      activeTab === tab.id ? "#18243c" : "transparent",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === "about" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Description
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {story.description}
                  </p>
                </div>

                {/* Tags */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {story.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "chapters" && (
              <div className="space-y-4">
                {isLoadingChapters ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : storyChapters.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Chapters Yet
                    </h3>
                    <p className="text-gray-600">
                      This story doesn't have any chapters published yet.
                    </p>
                  </div>
                ) : (
                  storyChapters.map((chapter: any) => {
                    const isPaidChapter =
                      !chapter.isFree && chapter.coinPrice > 0;
                    const hasChapterAccess =
                      chapterAccess[chapter.id] || chapter.isFree;

                    // Determine access based on pricing type
                    let canAccess = false;
                    let accessStatus = "";
                    let isLocked = false;

                    console.log(
                      "🔍 Pricing type check - story.pricingType:",
                      story.pricingType,
                      "typeof:",
                      typeof story.pricingType,
                      "chapter:",
                      chapter.chapterNumber
                    );

                    if (story.pricingType === "WHOLE_BOOK") {
                      // For whole book pricing, check book purchase
                      // Explicitly check that hasBookAccess is true (not undefined, null, or false)
                      canAccess = hasBookAccess === true || isAuthor;
                      console.log(
                        "🔍 Chapter canAccess calculation - hasBookAccess:",
                        hasBookAccess,
                        "typeof hasBookAccess:",
                        typeof hasBookAccess,
                        "isAuthor:",
                        isAuthor,
                        "canAccess:",
                        canAccess,
                        "chapter:",
                        chapter.chapterNumber
                      );
                      accessStatus = canAccess ? "BOOK_OWNED" : "BOOK_REQUIRED";
                      isLocked = !canAccess;
                    } else {
                      // For per-chapter pricing or undefined pricing type, check individual chapter access
                      // When pricing type is undefined, default to per-chapter logic to prevent incorrect access
                      canAccess =
                        hasChapterAccess || chapter.isFree || isAuthor;
                      console.log(
                        "🔍 Per-chapter canAccess calculation - hasChapterAccess:",
                        hasChapterAccess,
                        "chapter.isFree:",
                        chapter.isFree,
                        "isAuthor:",
                        isAuthor,
                        "canAccess:",
                        canAccess,
                        "chapter:",
                        chapter.chapterNumber
                      );
                      accessStatus = canAccess
                        ? "CHAPTER_OWNED"
                        : "CHAPTER_REQUIRED";
                      isLocked = isPaidChapter && !canAccess;
                    }

                    return (
                      <div
                        key={chapter.id}
                        className={`border rounded-lg p-4 transition-all duration-200 cursor-pointer ${
                          canAccess
                            ? "border-gray-200 hover:bg-gray-50 hover:border-blue-300"
                            : "border-red-200 bg-red-50"
                        }`}
                        onClick={() => handleChapterClick(chapter)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              {/* Lock Icon for locked chapters */}
                              {isLocked && (
                                <LockClosedIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                              )}
                              <h4
                                className={`font-medium ${
                                  canAccess ? "text-gray-900" : "text-gray-600"
                                }`}
                              >
                                Chapter {chapter.chapterNumber}: {chapter.title}
                              </h4>
                              {/* Access Badge */}
                              {story.pricingType === "WHOLE_BOOK" ? (
                                canAccess === true ? (
                                  <span className="px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 bg-green-100 text-green-800 ml-2">
                                    Book Owned
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 bg-yellow-100 text-yellow-800 ml-2">
                                    Buy Book
                                  </span>
                                )
                              ) : (
                                isPaidChapter && (
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                                      isAuthor
                                        ? "bg-purple-100 text-purple-800"
                                        : canAccess
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    } ml-2`}
                                  >
                                    {isAuthor
                                      ? "AUTHOR"
                                      : canAccess
                                      ? "OWNED"
                                      : "PREMIUM"}
                                  </span>
                                )
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {formatNumber(chapter.wordCount)} words •{" "}
                              {formatDate(chapter.createdAt)}
                            </p>
                            {/* Access Status */}
                            {story.pricingType === "WHOLE_BOOK" ? (
                              // Whole book pricing status
                              <div className="flex items-center space-x-2">
                                {isAuthor ? (
                                  <div className="flex items-center space-x-1">
                                    <CheckCircleIcon className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm font-medium text-purple-600">
                                      You are the author
                                    </span>
                                  </div>
                                ) : canAccess ? (
                                  <div className="flex items-center space-x-1">
                                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-600">
                                      Book Purchased
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1">
                                    <ShoppingBagIcon className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-600">
                                      Buy book for {story.bookPrice || 0} coins
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : story.pricingType ? (
                              // Per-chapter pricing status (only show if pricing type is defined)
                              isPaidChapter && (
                                <div className="flex items-center space-x-2">
                                  {isAuthor ? (
                                    <div className="flex items-center space-x-1">
                                      <CheckCircleIcon className="w-4 h-4 text-purple-600" />
                                      <span className="text-sm font-medium text-purple-600">
                                        You are the author
                                      </span>
                                    </div>
                                  ) : canAccess ? (
                                    <div className="flex items-center space-x-1">
                                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                      <span className="text-sm font-medium text-green-600">
                                        Purchased
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-1">
                                      <ShoppingBagIcon className="w-4 h-4 text-red-600" />
                                      <span className="text-sm font-medium text-red-600">
                                        {chapter.coinPrice} coins required
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )
                            ) : (
                              // Undefined pricing type - don't show any purchase status to prevent confusion
                              <div className="flex items-center space-x-1 text-gray-500">
                                <span className="text-sm">
                                  Loading pricing information...
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            {isLocked && (
                              <div className="flex items-center space-x-1 text-red-500">
                                <LockClosedIcon className="w-4 h-4" />
                                <span className="font-medium">
                                  {story.pricingType === "WHOLE_BOOK"
                                    ? "Book Locked"
                                    : "Locked"}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <EyeIcon className="w-4 h-4" />
                              <span>{formatNumber(chapter.views)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <HeartIcon className="w-4 h-4" />
                              <span>{formatNumber(chapter.likes)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === "comments" && (
              <div className="space-y-6">
                {/* Comments Header with Real-time Status */}
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Comments ({story.totalComments})
                  </h3>
                  <div className="flex items-center space-x-2">
                    {/* Real-time status indicator */}
                    <div className="flex items-center space-x-2">
                      {isFetchingComments ? (
                        <div className="flex items-center space-x-1 text-sm text-blue-600">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                          <span>Updating...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-sm text-green-600">
                          <div className="animate-pulse rounded-full h-2 w-2 bg-green-500"></div>
                          <span className="text-xs">Live</span>
                        </div>
                      )}
                    </div>

                    {/* Manual refresh button */}
                    <button
                      onClick={() => refetchComments()}
                      className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600 transition-colors p-1 rounded hover:bg-gray-100"
                      title="Refresh comments"
                      disabled={isFetchingComments}
                    >
                      <ChevronRight
                        className={`h-4 w-4 ${
                          isFetchingComments ? "animate-spin" : ""
                        }`}
                      />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {/* Comment Input */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={handleCommentSubmit}
                      disabled={isCreatingComment || !newComment.trim()}
                      className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                        isCreatingComment || !newComment.trim()
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {isCreatingComment ? "Posting..." : "Send"}
                    </button>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {isLoadingComments ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : storyComments.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Comments Yet
                      </h3>
                      <p className="text-gray-600">
                        Be the first to share your thoughts about this story!
                      </p>
                    </div>
                  ) : (
                    storyComments.map((comment: any) => (
                      <div
                        key={comment.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {comment.user.profileImageUrl ? (
                              <Image
                                src={comment.user.profileImageUrl}
                                alt={comment.user.username}
                                width={32}
                                height={32}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-gray-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900">
                                {comment.user.username}
                              </span>
                              <span className="text-sm text-gray-500">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>

                            {/* Comment content - editable if user is editing this comment */}
                            {editingCommentId === comment.id ? (
                              <div className="mb-2">
                                <textarea
                                  value={editContent}
                                  onChange={(e) =>
                                    setEditContent(e.target.value)
                                  }
                                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                  rows={3}
                                  placeholder="Edit your comment..."
                                />
                                <div className="flex items-center space-x-2 mt-2">
                                  <button
                                    onClick={handleSaveEdit}
                                    disabled={
                                      isUpdatingComment || !editContent.trim()
                                    }
                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                                  >
                                    {isUpdatingComment ? "Saving..." : "Save"}
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-700 mb-2">
                                {comment.content}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <button
                                  onClick={() => handleCommentLike(comment.id)}
                                  disabled={isTogglingCommentLike}
                                  className={`flex items-center space-x-1 text-sm transition-colors ${
                                    isTogglingCommentLike
                                      ? "text-gray-400 cursor-not-allowed"
                                      : "text-gray-500 hover:text-blue-600"
                                  }`}
                                  title="Like comment"
                                >
                                  <ThumbsUp
                                    className={`h-4 w-4 ${
                                      isTogglingCommentLike
                                        ? "animate-pulse"
                                        : ""
                                    }`}
                                  />
                                  <span>{comment.likes || 0}</span>
                                </button>
                                <button className="text-sm text-gray-500 hover:text-red-600">
                                  <Flag className="h-4 w-4" />
                                </button>

                                {/* Edit button for comment author */}
                                {user &&
                                  user.id === comment.user.id &&
                                  editingCommentId !== comment.id && (
                                    <button
                                      onClick={() =>
                                        handleEditComment(
                                          comment.id,
                                          comment.content
                                        )
                                      }
                                      className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600"
                                      title="Edit comment"
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                      <span>Edit</span>
                                    </button>
                                  )}
                              </div>

                              {/* Delete button for story owner or comment author */}
                              {user &&
                                ((story && user.id === story.author.id) ||
                                  user.id === comment.user.id) &&
                                editingCommentId !== comment.id && (
                                  <button
                                    onClick={() =>
                                      handleDeleteComment(comment.id)
                                    }
                                    disabled={isDeletingComment}
                                    className="flex items-center space-x-1 text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
                                    title="Delete comment"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                    <span>
                                      {isDeletingComment
                                        ? "Deleting..."
                                        : "Delete"}
                                    </span>
                                  </button>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Rating Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Rate this Story
          </h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => handleRating(star)}
                  className="transition-colors"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || userRating)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-gray-600">
              {userRating > 0
                ? `You rated: ${userRating} stars`
                : "Click to rate"}
            </span>
          </div>
        </div>

        {/* Recommended Stories - Temporarily disabled */}
        {/* 
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recommended For You</h3>
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Recommendations coming soon!</p>
          </div>
        </div>
        */}
      </div>

      {/* Chapter Purchase Modal */}
      {selectedChapterForPurchase && (
        <ChapterPurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => {
            setShowPurchaseModal(false);
            setSelectedChapterForPurchase(null);
          }}
          chapterId={selectedChapterForPurchase.id}
          chapterTitle={selectedChapterForPurchase.title}
          coinPrice={selectedChapterForPurchase.coinPrice}
          onPurchaseComplete={handlePurchaseComplete}
        />
      )}

      {/* Book Purchase Modal */}
      <BookPurchaseModal
        isOpen={showBookPurchaseModal}
        onClose={() => setShowBookPurchaseModal(false)}
        storyId={storyId}
        storyTitle={story.title}
        bookPrice={story.bookPrice || 0}
        totalChapters={story.totalChapters}
        onPurchaseComplete={handleBookPurchaseComplete}
      />

      {/* Gift Modal */}
      <EnhancedGiftModal
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        recipientId={story.author.id}
        recipientName={story.author.displayName || story.author.username}
        storyId={story.id}
        onGiftSent={() => {
          toast.success("Gift sent successfully!");
          // Optionally refresh the story data to update earnings
        }}
      />


    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  value,
  label,
  gradient,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  gradient: string;
}) {
  return (
    <div className="text-center">
      <div
        className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${gradient} text-white mb-2`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold text-nomanweb-primary">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

// Detail Card Component
function DetailCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: string;
}) {
  const colorClasses = {
    green: "bg-green-100 text-green-800",
    blue: "bg-blue-100 text-blue-800",
    purple: "bg-purple-100 text-purple-800",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-800",
  };

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      <span
        className={`px-3 py-1 text-sm font-medium rounded-full ${
          colorClasses[color as keyof typeof colorClasses]
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function StoryDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card-elevated overflow-hidden animate-pulse">
          <div className="md:flex">
            <div className="md:w-1/3">
              <div className="aspect-[3/4] bg-gray-200" />
            </div>
            <div className="md:w-2/3 p-6 lg:p-8">
              <div className="h-8 bg-gray-200 rounded mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-6" />
              <div className="h-20 bg-gray-200 rounded mb-6" />
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
