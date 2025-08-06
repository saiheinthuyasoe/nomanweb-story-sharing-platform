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
  CheckCircleIcon,
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

  const handleShare = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    toast.success("Link copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Story Header */}
        <div className="card-elevated overflow-hidden mb-8">
          <div className="md:flex">
            {/* Cover Image */}
            <div className="md:w-1/3">
              <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-200 to-gray-300">
                {story.coverImageUrl ? (
                  <Image
                    src={story.coverImageUrl}
                    alt={story.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-nomanweb-gradient">
                    <BookOpenIcon className="w-24 h-24 text-white/80" />
                  </div>
                )}

                {/* Status Badges */}
                <div className="absolute top-4 left-4 space-y-2">
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full backdrop-blur-sm ${
                      story.publishStatus === "PUBLISHED"
                        ? "bg-green-500/90 text-white"
                        : story.publishStatus === "DRAFT"
                        ? "bg-yellow-500/90 text-white"
                        : story.publishStatus === "COMPLETED"
                        ? "bg-blue-500/90 text-white"
                        : "bg-red-500/90 text-white"
                    }`}
                  >
                    {story.publishStatus}
                  </span>

                  {/* Book Status Badge */}
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full backdrop-blur-sm ${
                      story.bookStatus === "ONGOING"
                        ? "bg-blue-500/90 text-white"
                        : "bg-purple-500/90 text-white"
                    }`}
                  >
                    {story.bookStatus}
                  </span>
                </div>

                {/* Featured Badge */}
                {story.isFeatured && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-yellow-500/90 backdrop-blur-sm p-2 rounded-full">
                      <StarIcon className="w-5 h-5 text-white fill-current" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Story Info */}
            <div className="md:w-2/3 p-6 lg:p-8">
              <div className="mb-4">
                <h1 className="text-3xl lg:text-4xl font-bold text-nomanweb-primary mb-4">
                  {story.title}
                </h1>

                {/* Author */}
                <div className="mb-6">
                  <div>
                    <Link
                      href={`/authors/${story.author.id}`}
                      className="text-lg font-semibold text-nomanweb-primary hover:text-nomanweb-secondary transition-colors"
                    >
                      {story.author.displayName || story.author.username}
                    </Link>
                    <p className="text-sm text-gray-500">Author</p>
                  </div>
                </div>

                {/* Description */}
                {story.description && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-gray-700 leading-relaxed">
                      {story.description}
                    </p>
                  </div>
                )}

                {/* Category */}
                {story.category && (
                  <div className="mb-4">
                    <Link
                      href={`/categories/${story.category.id}`}
                      className="inline-block px-4 py-2 text-sm font-medium text-white bg-nomanweb-gradient rounded-full hover:scale-105 transition-transform"
                    >
                      {story.category.name}
                    </Link>
                  </div>
                )}

                {/* Tags */}
                {story.tags && story.tags.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <TagIcon className="w-4 h-4 text-nomanweb-primary" />
                      <span className="text-sm font-medium text-nomanweb-primary">
                        Tags
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {story.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 text-xs text-nomanweb-primary bg-blue-50 rounded-full border border-blue-200"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div
                  className={`grid grid-cols-2 gap-4 mb-6 ${
                    story.pricingType === "WHOLE_BOOK"
                      ? "md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8"
                      : "md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7"
                  }`}
                >
                  <StatCard
                    icon={EyeIcon}
                    value={story.totalViews.toLocaleString()}
                    label="Views"
                    gradient="from-blue-500 to-purple-600"
                  />
                  <StatCard
                    icon={HeartIcon}
                    value={story.totalLikes.toLocaleString()}
                    label="Likes"
                    gradient="from-pink-500 to-red-600"
                  />
                  <StatCard
                    icon={BookOpenIcon}
                    value={story.totalChapters.toString()}
                    label="Chapters"
                    gradient="from-green-500 to-teal-600"
                  />
                  <StatCard
                    icon={CalendarIcon}
                    value={story.totalComments.toLocaleString()}
                    label="Comments"
                    gradient="from-yellow-500 to-orange-600"
                  />
                  
                  {/* Library Statistics */}
                  <StatCard
                    icon={BookmarkIcon}
                    value={(story.totalWantToRead || 0).toLocaleString()}
                    label="Want to Read"
                    gradient="from-indigo-500 to-blue-600"
                  />
                  <StatCard
                    icon={BookOpenIcon}
                    value={(story.totalCurrentlyReading || 0).toLocaleString()}
                    label="Currently Reading"
                    gradient="from-amber-500 to-yellow-600"
                  />
                  <StatCard
                    icon={CheckCircleIcon}
                    value={(story.totalCompleted || 0).toLocaleString()}
                    label="Completed"
                    gradient="from-emerald-500 to-green-600"
                  />

                  {/* Book Price Stat - Only for WHOLE_BOOK stories */}
                  {story.pricingType === "WHOLE_BOOK" && (
                    <StatCard
                      icon={Coins}
                      value={`${story.bookPrice || 0}`}
                      label="Book Price (Coins)"
                      gradient="from-purple-500 to-indigo-600"
                    />
                  )}
                </div>

                {/* Dates */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
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
                <div className="flex flex-wrap gap-3">
                  {/* Preview Button */}
                  {story.totalChapters > 0 ? (
                    <Link
                      href={`/stories/${story.id}/chapters/1`}
                      className="btn-gradient px-6 py-3 rounded-lg font-semibold hover-lift flex items-center space-x-2"
                    >
                      <EyeIcon className="w-4 h-4" />
                      <span>Preview</span>
                    </Link>
                  ) : (
                    <div className="px-6 py-3 bg-gray-300 text-gray-600 rounded-lg font-medium cursor-not-allowed">
                      No Chapters Yet
                    </div>
                  )}

                  {/* Author Actions */}
                  {isAuthor && (
                    <>
                      <QuickCreateChapter
                        storyId={story.id}
                        totalChapters={story.totalChapters || 0}
                      />

                      <Link
                        href={`/dashboard/stories/${story.id}/edit`}
                        className="px-4 py-3 border-2 border-nomanweb-primary text-nomanweb-primary rounded-lg hover:bg-nomanweb-primary hover:text-white transition-colors flex items-center space-x-2"
                      >
                        <PencilIcon className="w-4 h-4" />
                        <span>Edit Story</span>
                      </Link>

                      {story.publishStatus === "DRAFT" ? (
                        <button
                          onClick={handlePublish}
                          disabled={isPublishing}
                          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
                      >
                        <TrashIcon className="mr-2 h-4 w-4" />
                        {isDeleting ? "Deleting..." : "Delete Story"}
                      </ProtectedActionButton>
                    </>
                  )}

                  {/* Public Actions */}
                  <button
                    onClick={handleShare}
                    className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <ShareIcon className="w-4 h-4" />
                    <span>Share</span>
                  </button>

                  {/* Gift Button - Only show if not the author */}
                  {!isAuthor && (
                    <button
                      onClick={() => setShowGiftModal(true)}
                      className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
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

        {/* Content Type and Moderation Status */}
        <div className="card-elevated p-6 mb-8">
          <h3 className="text-lg font-semibold text-nomanweb-primary mb-6 flex items-center space-x-2">
            <BookOpenIcon className="w-5 h-5" />
            <span>Story Details</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DetailCard
              title="Publish Status"
              value={story.publishStatus}
              color={
                story.publishStatus === "PUBLISHED"
                  ? "green"
                  : story.publishStatus === "DRAFT"
                  ? "yellow"
                  : story.publishStatus === "COMPLETED"
                  ? "blue"
                  : "red"
              }
            />
            <DetailCard
              title="Book Status"
              value={story.bookStatus}
              color={story.bookStatus === "ONGOING" ? "green" : "blue"}
            />
            <DetailCard
              title="Pricing Type"
              value={
                story.pricingType === "PAID_PER_CHAPTER"
                  ? "PAID PER CHAPTER"
                  : story.pricingType === "WHOLE_BOOK"
                  ? `WHOLE BOOK (${story.bookPrice || 0} coins)`
                  : story.pricingType
              }
              color={
                story.pricingType === "FREE"
                  ? "green"
                  : story.pricingType === "PAID_PER_CHAPTER"
                  ? "blue"
                  : "purple"
              }
            />

            {/* Book Price - Only show for WHOLE_BOOK pricing */}
            {story.pricingType === "WHOLE_BOOK" && (
              <BookPriceCard
                title="Book Price"
                value={`${story.bookPrice || 0} coins`}
                color="purple"
              />
            )}

            <DetailCard
              title="Moderation Status"
              value={story.moderationStatus}
              color={
                story.moderationStatus === "APPROVED"
                  ? "green"
                  : story.moderationStatus === "PENDING"
                  ? "yellow"
                  : "red"
              }
            />
            {/* Total Earnings with Recalculate Button */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-yellow-800">Total Earnings</h3>
                {isAuthor && (
                  <button
                    onClick={() => recalculateEarnings(storyId)}
                    disabled={isRecalculating}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-200 border border-yellow-300 rounded-md hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    title="Recalculate earnings from all purchases and gifts"
                  >
                    {isRecalculating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-yellow-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Calculating...
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Recalculate
                      </>
                    )}
                  </button>
                )}
              </div>
              <p className="text-2xl font-bold text-yellow-900">{story.totalCoinsEarned} coins</p>
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
  const colorClasses = {
    green: "bg-green-100 text-green-800 border-green-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    red: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <div
      className={`p-4 rounded-lg border-2 ${
        colorClasses[color as keyof typeof colorClasses]
      }`}
    >
      <div className="flex items-center space-x-2 mb-2">
        <span className="text-2xl">💰</span>
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>
      </div>
      <div className="text-xl font-bold text-purple-900">{value}</div>
      <p className="text-xs text-purple-700 mt-1">
        Readers pay this price once for full access
      </p>
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
