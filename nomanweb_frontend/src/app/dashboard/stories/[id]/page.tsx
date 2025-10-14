"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  useStory,
  usePublishStory,
  useUnpublishStory,
  useDeleteStory,
  useMoveStoryToTrash,
  useRecalculateStoryEarnings,
} from "@/hooks/useStories";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedActionButton } from "@/components/protection/ProtectedActionButton";
import { ButtonTestComponent } from "@/components/debug/ButtonTestComponent";
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
  Gift,
  BookmarkIcon,
} from "@heroicons/react/24/outline";
import { Coins, Gift as LucideGift } from "lucide-react";
import { toast } from "react-hot-toast";
import ChapterManagement from "@/components/chapters/ChapterManagement";
import { QuickCreateChapter } from "@/components/chapters/QuickCreateChapter";
import EnhancedGiftModal from "@/components/monetization/EnhancedGiftModal";
import { RefundConfirmationModal } from "@/components/modals/RefundConfirmationModal";

export default function StoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const storyId = params.id as string;

  const { data: story, isLoading, error } = useStory(storyId);
  const { mutate: publishStory, isPending: isPublishing } = usePublishStory();
  const { mutate: unpublishStory, isPending: isUnpublishing } =
    useUnpublishStory();
  const { mutate: deleteStory, isPending: isDeleting } = useDeleteStory();
  const { mutate: moveToTrash, isPending: isMovingToTrash } =
    useMoveStoryToTrash();
  const { mutate: recalculateEarnings, isPending: isRecalculating } =
    useRecalculateStoryEarnings();

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundData, setRefundData] = useState<any>(null);

  // Gift modal state
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    null
  );

  // Check if current user is the story author
  const isAuthor = user && story && user.id === story.author.id;



  if (isLoading) {
    return <StoryDetailSkeleton />;
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white border border-gray-200 rounded-lg shadow-sm p-8 max-w-md mx-4">
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
    console.log("🚀 handleUnpublish called for storyId:", storyId);
    unpublishStory(storyId, {
      onError: (error: any) => {
        console.error("❌ Error in handleUnpublish:", error);
        const errorData = error.response?.data;

        if (errorData?.requiresRefund) {
          setRefundData(errorData.refundDetails);
          setShowRefundModal(true);
        } else {
          toast.error(
            `Cannot unpublish story: ${
              errorData?.message || "Unknown error occurred"
            }`
          );
        }
      },
    });
  };

  const handleMoveToTrash = () => {
    console.log("🚀 handleMoveToTrash called for storyId:", storyId);
    moveToTrash(storyId, {
      onSuccess: () => {
        console.log("✅ Move to trash successful, redirecting to dashboard");
        router.push("/dashboard/my-stories");
      },
      onError: (error: any) => {
        console.error("❌ Error in handleMoveToTrash:", error);
        const errorData = error.response?.data;
        if (errorData?.requiresRefund) {
          setRefundData(errorData.refundDetails);
          setShowRefundModal(true);
        } else {
          toast.error(
            `Cannot move story to trash: ${
              errorData?.message || "Unknown error occurred"
            }`
          );
        }
      },
    });
  };

  const handleRefundConfirm = () => {
    if (refundData) {
      unpublishStory(storyId, {
        onSuccess: () => {
          setShowRefundModal(false);
          setRefundData(null);
        },
        onError: (error: any) => {
          const errorData = error.response?.data;
          toast.error(
            `Failed to process refunds: ${
              errorData?.message || "Unknown error occurred"
            }`
          );
        },
      });
    }
  };

  const handleDelete = () => {
    console.log("🚀 handleDelete called for storyId:", storyId);
    deleteStory(storyId, {
      onSuccess: () => {
        console.log("✅ Delete successful, redirecting to dashboard");
        router.push("/dashboard/my-stories");
      },
      onError: (error: any) => {
        console.error("❌ Error in handleDelete:", error);
        const errorData = error.response?.data;
        if (errorData?.requiresRefund) {
          setRefundData(errorData.refundDetails);
          setShowRefundModal(true);
        } else {
          toast.error(
            `Cannot delete story: ${
              errorData?.message || "Unknown error occurred"
            }`
          );
        }
      },
    });
  };

  const handleShare = async () => {
    // Create the public story URL instead of the dashboard URL
    const publicUrl = `${window.location.origin}/stories/${storyId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: story?.title || "Story",
          text: story?.description || "Check out this story!",
          url: publicUrl,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(publicUrl);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Story Header */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="flex flex-col lg:flex-row">
            {/* Cover Image */}
            <div className="flex flex-col items-center lg:items-start justify-center lg:justify-start p-4 sm:p-6 lg:p-8">
              <div className="relative w-[180px] h-[240px] sm:w-[210px] sm:h-[280px] bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg overflow-hidden shadow-md">
                {story.coverImageUrl ? (
                  <Image
                    src={story.coverImageUrl}
                    alt={story.title}
                    width={210}
                    height={280}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-100">
                    <BookOpenIcon className="w-24 h-24 text-gray-400" />
                  </div>
                )}

                {/* Featured Badge */}
                {story.isFeatured && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-yellow-100 border border-yellow-200 p-2 rounded">
                      <StarIcon className="w-5 h-5 text-yellow-600" />
                    </div>
                  </div>
                )}
              </div>

              {/* Status Badges - Now under the cover image */}
              <div className="mt-3 w-[180px] sm:w-[210px]">
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 items-center sm:justify-center lg:justify-start">
                  {/* Publish Status Badge */}
                  <span
                    className={`inline-block px-3 py-2 text-sm font-medium rounded w-full sm:w-auto text-center ${
                      story.publishStatus === "PUBLISHED"
                        ? "bg-blue-100 text-blue-600"
                        : story.publishStatus === "DRAFT"
                        ? "bg-yellow-100 text-yellow-800"
                        : story.publishStatus === "COMPLETED"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {story.publishStatus}
                  </span>

                  {/* Book Status Badge */}
                  <span
                    className={`inline-block px-3 py-2 text-sm font-medium rounded w-full sm:w-auto text-center ${
                      story.bookStatus === "ONGOING"
                        ? "bg-green-100 text-green-600"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {story.bookStatus}
                  </span>


                </div>
              </div>
            </div>

            {/* Story Info */}
            <div className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10">
              <div className="mb-4">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-black mb-4 leading-tight text-center lg:text-left">
                  {story.title}
                </h1>

                {/* Author */}
                <div className="mb-6 text-center lg:text-left">
                  <div>
                    <Link
                      href={`/authors/${story.author.id}`}
                      className="text-lg sm:text-xl font-semibold text-black hover:text-gray-700 transition-colors"
                    >
                      {story.author.displayName || story.author.username}
                    </Link>
                    <p className="text-sm text-gray-600 mt-1">Author</p>
                  </div>
                </div>

                {/* Description */}
                {story.description && (
                  <div className="border-l-4 border-gray-200 pl-4 mb-6 text-center lg:text-left">
                    <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                      {story.description}
                    </p>
                  </div>
                )}

                {/* Category */}
                {story.category && (
                  <div className="mb-4 text-center lg:text-left">
                    <Link
                      href={`/categories/${story.category.id}`}
                      className="inline-block px-3 py-1 text-sm font-medium text-black bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                    >
                      {story.category.name}
                    </Link>
                  </div>
                )}

                {/* Tags */}
                {story.tags && story.tags.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-center lg:justify-start space-x-2 mb-3">
                      <TagIcon className="w-4 h-4 text-nomanweb-primary" />
                      <span className="text-sm font-medium text-black">
                        Tags
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                      {story.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 text-xs text-black bg-blue-50 rounded-full border border-blue-200"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6 justify-center lg:justify-start">
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>
                      Created{" "}
                      {formatDistanceToNow(new Date(story.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  {story.publishedAt && (
                    <div className="flex items-center space-x-1">
                      <CalendarIcon className="w-4 h-4" />
                      <span>
                        Published{" "}
                        {formatDistanceToNow(new Date(story.publishedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 items-stretch sm:items-center justify-center lg:justify-start">
                  {/* Preview Button */}
                  {story.totalChapters > 0 ? (
                    <Link
                      href={`/stories/${story.id}/chapters/1`}
                      className="px-3 py-2 bg-[#18243c] text-white rounded-lg hover:bg-[#1e2a42] transition-colors flex items-center justify-center space-x-2 text-sm w-full sm:w-auto sm:min-w-[100px]"
                    >
                      <EyeIcon className="w-4 h-4" />
                      <span>Preview</span>
                    </Link>
                  ) : (
                    <div className="px-3 py-2 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed text-sm w-full sm:w-auto sm:min-w-[100px] text-center">
                      No Chapters Yet
                    </div>
                  )}

                  {/* Author Actions */}
                  {isAuthor && (
                    <>
                      <QuickCreateChapter
                        storyId={story.id}
                        totalChapters={story.totalChapters || 0}
                        className="text-sm px-3 py-2 w-full sm:w-auto sm:min-w-[120px] justify-center"
                      />

                      <Link
                        href={`/dashboard/stories/${story.id}/edit`}
                        className="px-3 py-2 border border-[#18243c] text-[#18243c] rounded-lg hover:bg-[#18243c]/10 transition-colors flex items-center justify-center space-x-2 text-sm w-full sm:w-auto sm:min-w-[100px]"
                      >
                        <PencilIcon className="w-4 h-4" />
                        <span>Edit Story</span>
                      </Link>

                      {story.publishStatus === "DRAFT" ? (
                        <button
                          onClick={handlePublish}
                          disabled={isPublishing}
                          className="px-3 py-2 bg-[#18243c] text-white rounded-lg hover:bg-[#1e2a42] disabled:opacity-50 transition-colors text-sm w-full sm:w-auto sm:min-w-[120px] justify-center flex items-center"
                        >
                          {isPublishing ? "Publishing..." : "Publish Story"}
                        </button>
                      ) : (
                        <>
                          <ProtectedActionButton
                            itemId={storyId}
                            itemType="story"
                            itemTitle={story.title}
                            actionType="unpublish"
                            currentPublishStatus={story.publishStatus}
                            currentPricingType={story.pricingType}
                            onAction={handleUnpublish}
                            disabled={isUnpublishing}
                            className="w-full sm:w-auto sm:min-w-[120px] justify-center"
                          >
                            {isUnpublishing
                              ? "Unpublishing..."
                              : "Unpublish Story"}
                          </ProtectedActionButton>
                        </>
                      )}

                      <ProtectedActionButton
                        itemId={storyId}
                        itemType="story"
                        itemTitle={story.title}
                        actionType="delete"
                        currentPublishStatus={story.publishStatus}
                        currentPricingType={story.pricingType}
                        onAction={handleDelete}
                        disabled={isDeleting}
                        className="w-full sm:w-auto sm:min-w-[100px] justify-center"
                      >
                        {isDeleting ? "Deleting..." : "Delete Story"}
                      </ProtectedActionButton>
                    </>
                  )}

                  {/* Public Actions */}
                  <button
                    onClick={handleShare}
                    className="px-3 py-2 border border-[#18243c] text-[#18243c] rounded-lg hover:bg-[#18243c]/10 transition-colors flex items-center justify-center space-x-2 text-sm w-full sm:w-auto sm:min-w-[80px]"
                  >
                    <ShareIcon className="w-4 h-4" />
                    <span>Share</span>
                  </button>

                  {/* Gift Button - Only show if not the author */}
                  {!isAuthor && (
                    <button
                      onClick={() => setShowGiftModal(true)}
                      className="px-3 py-2 bg-[#18243c] text-white rounded-lg hover:bg-[#1e2a42] transition-colors flex items-center justify-center space-x-2 text-sm w-full sm:w-auto sm:min-w-[100px]"
                    >
                      <LucideGift className="w-4 h-4" />
                      <span>Send Gift</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Story Details - Minimalist */}
        <div className="bg-white rounded-lg p-4 sm:p-6 mb-8">
          <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-4 text-center lg:text-left">
            Story Overview
          </h3>

          {/* Essential Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <span className="text-xs text-gray-500">Publish Status</span>
              <p
                className={`text-sm font-medium ${
                  story.publishStatus === "PUBLISHED"
                    ? "text-blue-600"
                    : story.publishStatus === "DRAFT"
                    ? "text-yellow-600"
                    : story.publishStatus === "COMPLETED"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {story.publishStatus}
              </p>
            </div>

            <div>
              <span className="text-xs text-gray-500">Type</span>
              <p
                className={`text-sm font-medium ${
                  story.pricingType === "FREE"
                    ? "text-green-600"
                    : story.pricingType === "PAID_PER_CHAPTER"
                    ? "text-blue-600"
                    : "text-purple-600"
                }`}
              >
                {story.pricingType === "PAID_PER_CHAPTER"
                  ? "Per Chapter"
                  : story.pricingType === "WHOLE_BOOK"
                  ? "Whole Book"
                  : "Free"}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Progress</span>
              <p
                className={`text-sm font-medium ${
                  story.bookStatus === "ONGOING"
                    ? "text-green-600"
                    : "text-blue-600"
                }`}
              >
                {story.bookStatus}
              </p>
            </div>
            {isAuthor && (
              <div>
                <span className="text-xs text-gray-500">Earnings</span>
                <p
                  className={`text-sm font-medium ${
                    story.totalCoinsEarned > 0
                      ? "text-green-600"
                      : "text-gray-600"
                  }`}
                >
                  {story.totalCoinsEarned} coins
                </p>
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="border-t pt-4">
            <div
              className={`grid gap-2 sm:gap-1 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 ${
                story.pricingType === "WHOLE_BOOK"
                  ? "lg:grid-cols-8"
                  : "lg:grid-cols-7"
              }`}
            >
              <StatCard
                icon={EyeIcon}
                value={story.totalViews.toLocaleString()}
                label="Views"
              />
              <StatCard
                icon={HeartIcon}
                value={story.totalLikes.toLocaleString()}
                label="Likes"
              />
              <StatCard
                icon={BookOpenIcon}
                value={story.totalChapters.toString()}
                label="Chapters"
              />
              <StatCard
                icon={CalendarIcon}
                value={story.totalComments.toLocaleString()}
                label="Comments"
              />
              <StatCard
                icon={BookmarkIcon}
                value={(story.totalWantToRead || 0).toLocaleString()}
                label="Want to Read"
              />
              <StatCard
                icon={BookOpenIcon}
                value={(story.totalCurrentlyReading || 0).toLocaleString()}
                label="Reading"
              />
              <StatCard
                icon={BookOpenIcon}
                value={(story.totalCompleted || 0).toLocaleString()}
                label="Completed"
              />
              {story.pricingType === "WHOLE_BOOK" && (
                <StatCard
                  icon={Coins}
                  value={`${story.bookPrice || 0}`}
                  label="Price"
                />
              )}
            </div>
          </div>
        </div>

        {/* Chapter Management */}
        <div className="mb-8">
          <ChapterManagement
            storyId={storyId}
            isAuthor={isAuthor || false}
            story={{
              pricingType: story.pricingType,
              bookPrice: story.bookPrice,
            }}
          />
        </div>

        {/* Delete Confirmation Modal */}
        {/* The delete confirmation modal is no longer needed as ProtectedActionButton handles it */}

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

        {/* Remove Refund Confirmation Modal */}
        {refundData && (
          <RefundConfirmationModal
            isOpen={showRefundModal}
            onClose={() => setShowRefundModal(false)}
            onConfirm={handleRefundConfirm}
            refundData={refundData}
            isLoading={isUnpublishing || isDeleting}
          />
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
}) {
  return (
    <div className="text-center p-2 bg-gray-50 border border-gray-200 rounded min-h-[70px] flex flex-col justify-center">
      <div className="inline-flex items-center justify-center w-6 h-6 rounded mb-1 mx-auto">
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-xs font-semibold text-gray-900 truncate">
        {value}
      </div>
      <div className="text-xs text-gray-500 truncate">{label}</div>
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
  return (
    <div className="space-y-1">
      <h4 className="text-sm font-medium text-gray-600">{title}</h4>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

// Book Price Card Component - Enhanced for book pricing
function BookPriceCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: string;
}) {
  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg">
      <h4 className="text-sm font-medium text-gray-600 mb-2">{title}</h4>
      <div className="text-xl font-semibold text-gray-900">{value}</div>
      <p className="text-xs text-gray-500 mt-1">
        Readers pay this price once for full access
      </p>
    </div>
  );
}

function StoryDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden animate-pulse">
          <div className="flex flex-col md:flex-row">
            <div className="flex justify-center md:justify-start p-6 md:p-8">
              <div className="w-[210px] h-[280px] bg-gray-200 rounded-lg" />
            </div>
            <div className="flex-1 p-6 md:p-8 lg:p-10">
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
