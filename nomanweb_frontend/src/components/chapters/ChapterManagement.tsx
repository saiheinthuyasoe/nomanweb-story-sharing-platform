import React, { useState } from "react";
import Link from "next/link";
import { ChapterPreview } from "@/lib/api/chapters";
import {
  useChaptersByStory,
  usePublishChapter,
  useUnpublishChapter,
  useDeleteChapter,
  useBulkDeleteChapters,
  useMoveChapterToTrash,
  useRestoreChapterFromTrash,
  usePermanentlyDeleteChapter,
  useTrashByStory,
  useBulkMoveToTrash,
  useBulkRestoreFromTrash,
  useBulkPermanentlyDelete,
  useEmptyTrash,
  useUpdateChapter,
} from "@/hooks/useChapters";
import { useChapterAccessBatch } from "@/hooks/useChapterAccess";
import { formatDistanceToNow } from "date-fns";
import { ProtectedActionButton } from "@/components/protection/ProtectedActionButton";
import {
  EyeIcon,
  HeartIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  ClockIcon,
  GlobeAltIcon,
  ArchiveBoxIcon,
  PlusIcon,
  CloudArrowUpIcon,
  Cog6ToothIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { AlertTriangle, DollarSign, Users, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import BulkChapterUpload from "./BulkChapterUpload";
import { QuickCreateChapter } from "./QuickCreateChapter";

interface ChapterManagementProps {
  storyId: string;
  isAuthor: boolean;
  story?: {
    pricingType: "FREE" | "PAID_PER_CHAPTER" | "WHOLE_BOOK";
    bookPrice?: number;
  };
}

export default function ChapterManagement({
  storyId,
  isAuthor,
  story,
}: ChapterManagementProps) {
  const queryClient = useQueryClient();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const {
    data: chapters = [],
    isLoading,
    error,
    refetch,
  } = useChaptersByStory(storyId, isAuthor, isUploading);
  const { mutate: publishChapter, isPending: isPublishing } =
    usePublishChapter();
  const { mutate: unpublishChapter, isPending: isUnpublishing } =
    useUnpublishChapter();

  const { mutate: deleteChapter, isPending: isDeleting } = useDeleteChapter();
  const { mutate: bulkDeleteChapters, isPending: isBulkDeleting } =
    useBulkDeleteChapters();

  // Trash hooks
  const { mutate: moveToTrash, isPending: isMovingToTrash } =
    useMoveChapterToTrash();
  const { mutate: restoreFromTrash, isPending: isRestoring } =
    useRestoreChapterFromTrash();
  const { mutate: permanentlyDelete, isPending: isPermanentlyDeleting } =
    usePermanentlyDeleteChapter();
  const { data: trashChapters = [], isLoading: isLoadingTrash } =
    useTrashByStory(storyId, isAuthor);
  const { mutate: bulkMoveToTrash, isPending: isBulkMovingToTrash } =
    useBulkMoveToTrash();
  const { mutate: bulkRestoreFromTrash, isPending: isBulkRestoring } =
    useBulkRestoreFromTrash();
  const {
    mutate: bulkPermanentlyDelete,
    isPending: isBulkPermanentlyDeleting,
  } = useBulkPermanentlyDelete();

  const [activeTab, setActiveTab] = useState<
    "published" | "draft" | "pending" | "all" | "trash"
  >("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(
    new Set()
  );
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<string | null>(
    null
  );
  const [showPermanentDeleteConfirm, setShowPermanentDeleteConfirm] = useState<
    string | null
  >(null);
  const [showBulkRestoreConfirm, setShowBulkRestoreConfirm] = useState(false);
  const [showBulkPermanentDeleteConfirm, setShowBulkPermanentDeleteConfirm] =
    useState(false);

  const [unpublishConfirm, setUnpublishConfirm] = useState<string | null>(null);
  const [refundData, setRefundData] = useState<{
    hasPurchases: boolean;
    totalRefundAmount: number;
    affectedPurchasers: number;
    itemTitle: string;
    itemType: "chapter";
  } | null>(null);

  // Get chapter access for non-authors
  const visibleChapters = chapters.filter(
    (chapter) => chapter.status === "PUBLISHED"
  );
  const chapterIds = visibleChapters.map((chapter) => chapter.id);
  const { data: chapterAccess = {} } = useChapterAccessBatch(
    chapterIds,
    !isAuthor
  );

  if (!isAuthor) {
    // For non-authors, show only published chapters
    return (
      <div className="card-elevated p-6">
        <h3 className="text-lg font-semibold text-nomanweb-primary mb-6 flex items-center space-x-2">
          <DocumentTextIcon className="w-5 h-5" />
          <span>Chapters ({visibleChapters.length})</span>
        </h3>

        {visibleChapters.length === 0 ? (
          <div className="text-center py-8">
            <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No published chapters yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleChapters.map((chapter) => (
              <PublicChapterCard
                key={chapter.id}
                chapter={chapter}
                storyId={storyId}
                story={story}
                hasAccess={chapterAccess[chapter.id] || false}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card-elevated p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-elevated p-6">
        <div className="text-center text-red-600">
          Failed to load chapters. Please try again.
        </div>
      </div>
    );
  }

  // Filter chapters by status
  const publishedChapters = chapters.filter(
    (chapter) => chapter.status === "PUBLISHED"
  );
  const draftChapters = chapters.filter(
    (chapter) =>
      chapter.status === "DRAFT" && chapter.moderationStatus !== "PENDING"
  );
  const pendingChapters = chapters.filter(
    (chapter) =>
      chapter.status === "PENDING" || chapter.moderationStatus === "PENDING"
  );

  const getActiveChapters = () => {
    switch (activeTab) {
      case "published":
        return publishedChapters;
      case "draft":
        return draftChapters;
      case "pending":
        return pendingChapters;
      case "trash":
        return trashChapters;
      case "all":
      default:
        return chapters;
    }
  };

  const handlePublish = (chapterId: string) => {
    publishChapter(chapterId);
  };

  const calculateRefund = async (chapterId: string, chapterTitle: string) => {
    try {
      const response = await fetch(
        `/api/refunds/chapters/${chapterId}/calculate-refund`
      );
      if (response.ok) {
        const data = await response.json();
        return {
          ...data,
          itemTitle: chapterTitle,
          itemType: "chapter" as const,
        };
      }
    } catch (error) {
      console.error("Error calculating chapter refund:", error);
    }
    return { hasPurchases: false, totalRefundAmount: 0, affectedPurchasers: 0 };
  };

  const handleUnpublishClick = async (
    chapterId: string,
    chapterTitle: string
  ) => {
    // For both WHOLE_BOOK and PAID_PER_CHAPTER pricing, calculate refunds
    if (
      story?.pricingType === "WHOLE_BOOK" ||
      story?.pricingType === "PAID_PER_CHAPTER"
    ) {
      const refundInfo = await calculateRefund(chapterId, chapterTitle);
      setRefundData(refundInfo);
    } else {
      setRefundData(null);
    }
    setUnpublishConfirm(chapterId);
  };

  const handleUnpublish = (id: string, confirmRefund: boolean) => {
    unpublishChapter({ id, confirmRefund });
    setUnpublishConfirm(null);
    setRefundData(null);
  };

  const handleDelete = async (chapterId: string) => {
    console.log(`🔍 Attempting to move chapter to trash: ${chapterId}`);
    console.log(`📊 Story pricing type: ${story?.pricingType}`);
    // This function should only be called by ProtectedActionButton when protection allows it
    moveToTrash(chapterId);
    setDeleteConfirm(null);
  };

  // Bulk selection handlers
  const handleSelectChapter = (chapterId: string) => {
    const newSelected = new Set(selectedChapters);
    if (newSelected.has(chapterId)) {
      newSelected.delete(chapterId);
    } else {
      newSelected.add(chapterId);
    }
    setSelectedChapters(newSelected);
  };

  const handleSelectAll = () => {
    const activeChapters = getActiveChapters();
    if (selectedChapters.size === activeChapters.length) {
      setSelectedChapters(new Set());
    } else {
      setSelectedChapters(new Set(activeChapters.map((chapter) => chapter.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedChapters.size > 0) {
      if (activeTab === "trash") {
        // Permanently delete from trash
        bulkPermanentlyDelete(Array.from(selectedChapters));
      } else {
        // Move to trash
        bulkMoveToTrash(Array.from(selectedChapters));
      }
      setSelectedChapters(new Set());
      setShowBulkDeleteConfirm(false);
    }
  };

  const handleRestore = (chapterId: string) => {
    restoreFromTrash(chapterId);
    setShowRestoreConfirm(null);
  };

  const handlePermanentDelete = (chapterId: string) => {
    permanentlyDelete(chapterId);
    setShowPermanentDeleteConfirm(null);
  };

  const handleBulkRestore = () => {
    if (selectedChapters.size > 0) {
      bulkRestoreFromTrash(Array.from(selectedChapters));
      setSelectedChapters(new Set());
      setShowBulkRestoreConfirm(false);
    }
  };

  const handleBulkPermanentDelete = () => {
    if (selectedChapters.size > 0) {
      bulkPermanentlyDelete(Array.from(selectedChapters));
      setSelectedChapters(new Set());
      setShowBulkPermanentDeleteConfirm(false);
    }
  };

  return (
    <div key={refreshKey} className="card-elevated p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-xl font-medium text-black">Chapter Management</h3>
          {isUploading && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="hidden sm:inline">Real-time updates active</span>
              <span className="sm:hidden">Updating...</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link
            href={`/dashboard/stories/${storyId}/chapters/bulk-edit`}
            className="w-full px-4 py-3 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm font-medium touch-manipulation"
            style={{
              backgroundColor: "#18243c",
              ":hover": { backgroundColor: "#0f1a2e" },
            }}
          >
            <Cog6ToothIcon className="w-4 h-4" />
            <span>Multi Edit</span>
          </Link>

          <button
            onClick={() => {
              setShowBulkUpload(true);
              setIsUploading(true);
            }}
            className="w-full px-4 py-3 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm font-medium touch-manipulation"
            style={{
              backgroundColor: "#18243c",
              ":hover": { backgroundColor: "#0f1a2e" },
            }}
          >
            <CloudArrowUpIcon className="w-4 h-4" />
            <span>Multi Upload</span>
          </button>

          {isAuthor && (
            <div className="sm:col-span-2 lg:col-span-1">
              <QuickCreateChapter
                storyId={storyId}
                totalChapters={chapters.length}
                className="text-sm w-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="bg-gray-100 p-1 rounded-lg overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap min-w-[70px] touch-manipulation ${
                activeTab === "all"
                  ? "shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              style={
                activeTab === "all"
                  ? { backgroundColor: "#18243c", color: "#ffffff" }
                  : {}
              }
            >
              All ({chapters.length})
            </button>
            <button
              onClick={() => setActiveTab("published")}
              className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 whitespace-nowrap touch-manipulation ${
                activeTab === "published"
                  ? "shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              style={
                activeTab === "published"
                  ? { backgroundColor: "#18243c", color: "#ffffff" }
                  : {}
              }
            >
              <GlobeAltIcon className="w-4 h-4" />
              <span className="hidden xs:inline">Published</span>
              <span className="xs:hidden">Pub</span>
              <span>({publishedChapters.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("draft")}
              className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 whitespace-nowrap touch-manipulation ${
                activeTab === "draft"
                  ? "shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              style={
                activeTab === "draft"
                  ? { backgroundColor: "#18243c", color: "#ffffff" }
                  : {}
              }
            >
              <ClockIcon className="w-4 h-4" />
              <span className="hidden xs:inline">Drafts</span>
              <span className="xs:hidden">Draft</span>
              <span>({draftChapters.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 whitespace-nowrap touch-manipulation ${
                activeTab === "pending"
                  ? "shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              style={
                activeTab === "pending"
                  ? { backgroundColor: "#18243c", color: "#ffffff" }
                  : {}
              }
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden xs:inline">Pending</span>
              <span className="xs:hidden">Pend</span>
              <span>({pendingChapters.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("trash")}
              className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 whitespace-nowrap touch-manipulation ${
                activeTab === "trash"
                  ? "shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              style={
                activeTab === "trash"
                  ? { backgroundColor: "#18243c", color: "#ffffff" }
                  : {}
              }
            >
              <TrashIcon className="w-4 h-4" />
              <span className="hidden xs:inline">Trash</span>
              <span className="xs:hidden">Del</span>
              <span>({trashChapters.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Selection Controls */}
      {getActiveChapters().length > 0 && (
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={
                selectedChapters.size === getActiveChapters().length &&
                getActiveChapters().length > 0
              }
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-nomanweb-primary focus:ring-nomanweb-secondary"
              aria-label="Select all chapters"
            />
            <span className="text-sm text-gray-600">
              {selectedChapters.size === 0
                ? "Select chapters"
                : `${selectedChapters.size} selected`}
            </span>
          </div>

          {selectedChapters.size > 0 && (
            <div className="flex items-center space-x-2">
              {activeTab === "trash" ? (
                <>
                  <button
                    onClick={() => setShowBulkRestoreConfirm(true)}
                    disabled={isBulkRestoring}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 text-sm disabled:opacity-50"
                  >
                    <ArchiveBoxIcon className="w-4 h-4" />
                    <span>
                      {isBulkRestoring
                        ? "Restoring..."
                        : `Restore ${selectedChapters.size} chapters`}
                    </span>
                  </button>
                  <button
                    onClick={() => setShowBulkPermanentDeleteConfirm(true)}
                    disabled={isBulkPermanentlyDeleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 text-sm disabled:opacity-50"
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span>
                      {isBulkPermanentlyDeleting
                        ? "Deleting..."
                        : `Delete Forever ${selectedChapters.size} chapters`}
                    </span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  disabled={isBulkMovingToTrash}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 text-sm disabled:opacity-50"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span>
                    {isBulkMovingToTrash
                      ? "Moving to trash..."
                      : `Move ${selectedChapters.size} chapters to trash`}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Chapter List */}
      <div className="space-y-3">
        {getActiveChapters().length === 0 ? (
          <div className="text-center py-8">
            <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {activeTab === "published" && "No published chapters yet."}
              {activeTab === "draft" && "No draft chapters yet."}
              {activeTab === "all" && "No chapters yet."}
              {activeTab === "trash" && "No chapters in trash."}
            </p>
            {activeTab !== "trash" && isAuthor && (
              <QuickCreateChapter
                storyId={storyId}
                totalChapters={0}
                variant="card"
                className="max-w-xs mx-auto"
              />
            )}
          </div>
        ) : (
          getActiveChapters().map((chapter) => (
            <ChapterManagementCard
              key={chapter.id}
              chapter={chapter}
              storyId={storyId}
              onPublish={handlePublish}
              onUnpublish={() =>
                handleUnpublishClick(chapter.id, chapter.title)
              }
              onDelete={() => {
                if (activeTab === "trash") {
                  setShowPermanentDeleteConfirm(chapter.id);
                } else {
                  setDeleteConfirm(chapter.id);
                }
              }}
              onRestore={() => setShowRestoreConfirm(chapter.id)}
              isPublishing={isPublishing}
              isUnpublishing={isUnpublishing}
              isDeleting={isDeleting}
              isRestoring={isRestoring}
              isPermanentlyDeleting={isPermanentlyDeleting}
              story={story}
              onSelect={handleSelectChapter}
              isSelected={selectedChapters.has(chapter.id)}
              isTrashView={activeTab === "trash"}
            />
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card-elevated p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-nomanweb-primary mb-4">
              Move Chapter to Trash
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to move this chapter to trash? You can
              restore it later from the trash.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? "Moving to trash..." : "Move to Trash"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card-elevated p-6 max-w-md w-full">
            <h3
              className={`text-lg font-semibold mb-4 ${
                activeTab === "trash" ? "text-red-600" : "text-nomanweb-primary"
              }`}
            >
              {activeTab === "trash"
                ? "Permanently Delete Multiple Chapters"
                : "Move Multiple Chapters to Trash"}
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === "trash"
                ? `Are you sure you want to permanently delete ${selectedChapters.size} chapters? This action cannot be undone and the chapters will be lost forever.`
                : `Are you sure you want to move ${selectedChapters.size} chapters to trash? You can restore them later from the trash.`}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                disabled={
                  activeTab === "trash"
                    ? isBulkPermanentlyDeleting
                    : isBulkMovingToTrash
                }
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={
                  activeTab === "trash"
                    ? isBulkPermanentlyDeleting
                    : isBulkMovingToTrash
                }
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {activeTab === "trash"
                  ? isBulkPermanentlyDeleting
                    ? "Deleting..."
                    : `Delete ${selectedChapters.size} chapters forever`
                  : isBulkMovingToTrash
                  ? "Moving to trash..."
                  : `Move ${selectedChapters.size} chapters to trash`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card-elevated p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-nomanweb-primary mb-4">
              Restore Chapter
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to restore this chapter from trash?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRestoreConfirm(null)}
                disabled={isRestoring}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRestore(showRestoreConfirm)}
                disabled={isRestoring}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isRestoring ? "Restoring..." : "Restore"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {showPermanentDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card-elevated p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-red-600 mb-4">
              Permanently Delete Chapter
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to permanently delete this chapter? This
              action cannot be undone and the chapter will be lost forever.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPermanentDeleteConfirm(null)}
                disabled={isPermanentlyDeleting}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handlePermanentDelete(showPermanentDeleteConfirm)
                }
                disabled={isPermanentlyDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isPermanentlyDeleting ? "Deleting..." : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Restore Confirmation Modal */}
      {showBulkRestoreConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card-elevated p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-nomanweb-primary mb-4">
              Restore Multiple Chapters
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to restore {selectedChapters.size} chapters
              from trash?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowBulkRestoreConfirm(false)}
                disabled={isBulkRestoring}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkRestore}
                disabled={isBulkRestoring}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isBulkRestoring
                  ? "Restoring..."
                  : `Restore ${selectedChapters.size} chapters`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Permanent Delete Confirmation Modal */}
      {showBulkPermanentDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card-elevated p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-red-600 mb-4">
              Permanently Delete Multiple Chapters
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to permanently delete{" "}
              {selectedChapters.size} chapters? This action cannot be undone and
              the chapters will be lost forever.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowBulkPermanentDeleteConfirm(false)}
                disabled={isBulkPermanentlyDeleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkPermanentDelete}
                disabled={isBulkPermanentlyDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isBulkPermanentlyDeleting
                  ? "Deleting..."
                  : `Delete ${selectedChapters.size} chapters forever`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty Trash Confirmation Modal */}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkChapterUpload
          storyId={storyId}
          onSuccess={async () => {
            console.log("📱 ChapterManagement onSuccess called");
            setShowBulkUpload(false);
            // Keep polling for 5 more seconds to ensure we catch any delayed updates
            setTimeout(() => setIsUploading(false), 5000);
            toast.success("Chapters uploaded successfully!");
            // Force complete re-render by changing the refresh key
            setRefreshKey((prev) => prev + 1);
            // The BulkChapterUpload component already cleared cache, just refetch
            console.log("🔄 Refetching chapters in ChapterManagement...");
            await refetch();
            console.log("✅ ChapterManagement refetch complete");
          }}
          onClose={() => {
            setShowBulkUpload(false);
            setIsUploading(false);
          }}
        />
      )}

      {/* Unpublish Confirmation Modal */}
      <Dialog
        open={!!unpublishConfirm}
        onOpenChange={() => setUnpublishConfirm(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <span>Unpublish Chapter</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to unpublish this chapter? It will be moved
              to drafts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {(story?.pricingType === "WHOLE_BOOK" ||
              story?.pricingType === "PAID_PER_CHAPTER") && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-1">
                      Refund Warning
                    </h4>
                    <p className="text-sm text-yellow-700">
                      {story?.pricingType === "WHOLE_BOOK"
                        ? "If this chapter was paid, unpublishing it may refund the users. This action cannot be undone."
                        : "Unpublishing this chapter will refund all users who purchased it. This action cannot be undone."}
                    </p>
                    {refundData && refundData.hasPurchases && (
                      <div className="mt-3 p-3 bg-white rounded border border-yellow-300">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-yellow-800">
                            Total Refund Amount:
                          </span>
                          <span className="text-lg font-bold text-yellow-900">
                            $
                            {refundData.totalRefundAmount?.toFixed(2) || "0.00"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-yellow-700">
                            Affected Users:
                          </span>
                          <span className="text-sm font-medium text-yellow-800">
                            {refundData.affectedPurchasers || 0}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">
                    What happens next?
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• The chapter will be moved to drafts</li>
                    <li>• Readers will lose access to this chapter</li>
                    {story?.pricingType === "WHOLE_BOOK" && (
                      <li>
                        • Affected users may receive refunds automatically
                      </li>
                    )}
                    <li>• You can republish later if needed</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setUnpublishConfirm(null)}
              disabled={isUnpublishing}
            >
              Cancel
            </Button>
            {(story?.pricingType === "WHOLE_BOOK" ||
              story?.pricingType === "PAID_PER_CHAPTER") &&
            refundData?.hasPurchases ? (
              <>
                <Button
                  onClick={() => handleUnpublish(unpublishConfirm, true)}
                  disabled={isUnpublishing}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  {isUnpublishing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Unpublishing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Unpublish & Refund
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleUnpublish(unpublishConfirm, false)}
                  disabled={isUnpublishing}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isUnpublishing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Unpublishing...
                    </>
                  ) : (
                    "Unpublish without Refund"
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => handleUnpublish(unpublishConfirm, false)}
                disabled={isUnpublishing}
                className="bg-red-600 hover:bg-red-700"
              >
                {isUnpublishing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Unpublishing...
                  </>
                ) : (
                  "Unpublish"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Chapter Management Card for Authors
function ChapterManagementCard({
  chapter,
  storyId,
  onPublish,
  onUnpublish,
  onDelete,
  onRestore,
  isPublishing,
  isUnpublishing,
  isDeleting,
  isRestoring,
  isPermanentlyDeleting,
  story,
  onSelect,
  isSelected,
  isTrashView,
}: {
  chapter: ChapterPreview;
  storyId: string;
  onPublish: (id: string) => void;
  onUnpublish: () => void;
  onDelete: () => void;
  onRestore?: () => void;
  isPublishing: boolean;
  isUnpublishing: boolean;
  isDeleting: boolean;
  isRestoring?: boolean;
  isPermanentlyDeleting?: boolean;
  story?: {
    pricingType: "FREE" | "PAID_PER_CHAPTER" | "WHOLE_BOOK";
    bookPrice?: number;
  };
  onSelect?: (id: string) => void;
  isSelected?: boolean;
  isTrashView?: boolean;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow bg-white touch-manipulation">
      <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-3">
        {/* Selection Checkbox */}
        {onSelect && (
          <div className="flex items-center sm:mt-1">
            <input
              type="checkbox"
              checked={isSelected || false}
              onChange={() => onSelect(chapter.id)}
              className="w-5 h-5 sm:w-4 sm:h-4 rounded border-gray-300 text-nomanweb-primary focus:ring-nomanweb-secondary touch-manipulation"
              aria-label={`Select chapter ${chapter.chapterNumber}: ${chapter.title}`}
            />
          </div>
        )}

        {/* Chapter content */}
        <div className="flex-1 min-w-0">
          <ChapterContent
            chapter={chapter}
            story={story}
            storyId={storyId}
            onPublish={onPublish}
            onUnpublish={onUnpublish}
            onDelete={onDelete}
            onRestore={onRestore}
            isPublishing={isPublishing}
            isUnpublishing={isUnpublishing}
            isDeleting={isDeleting}
            isRestoring={isRestoring}
            isPermanentlyDeleting={isPermanentlyDeleting}
            isTrashView={isTrashView}
          />
        </div>
      </div>
    </div>
  );
}

// Separate component for chapter content to avoid duplication
function ChapterContent({
  chapter,
  story,
  storyId,
  onPublish,
  onUnpublish,
  onDelete,
  onRestore,
  isPublishing,
  isUnpublishing,
  isDeleting,
  isRestoring,
  isPermanentlyDeleting,
  isTrashView,
}: {
  chapter: ChapterPreview;
  story?: {
    pricingType: "FREE" | "PAID_PER_CHAPTER" | "WHOLE_BOOK";
    bookPrice?: number;
  };
  storyId: string;
  onPublish: (id: string) => void;
  onUnpublish: () => void;
  onDelete: () => void;
  onRestore?: () => void;
  isPublishing: boolean;
  isUnpublishing: boolean;
  isDeleting: boolean;
  isRestoring?: boolean;
  isPermanentlyDeleting?: boolean;
  isTrashView?: boolean;
}) {
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [tempCoinPrice, setTempCoinPrice] = useState(chapter.coinPrice || 0);
  const [tempIsFree, setTempIsFree] = useState(chapter.isFree);
  const { mutate: updateChapter, isPending: isUpdatingPrice } =
    useUpdateChapter();

  const handlePriceEdit = () => {
    setIsEditingPrice(true);
    setTempCoinPrice(chapter.coinPrice || 0);
    setTempIsFree(chapter.isFree);
  };

  const handlePriceSave = () => {
    updateChapter(
      {
        id: chapter.id,
        data: {
          coinPrice: tempIsFree ? 0 : tempCoinPrice,
          isFree: tempIsFree,
        },
      },
      {
        onSuccess: () => {
          setIsEditingPrice(false);
          toast.success("Chapter pricing updated successfully");
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to update pricing"
          );
        },
      }
    );
  };

  const handlePriceCancel = () => {
    setIsEditingPrice(false);
    setTempCoinPrice(chapter.coinPrice || 0);
    setTempIsFree(chapter.isFree);
  };

  const canEditPricing =
    story?.pricingType === "PAID_PER_CHAPTER" && !isTrashView;

  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
      <div className="flex-1 min-w-0">
        {/* Chapter Header */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-sm font-medium text-gray-500 whitespace-nowrap">
            Chapter {chapter.chapterNumber}
          </span>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
              chapter.status === "PUBLISHED"
                ? "bg-blue-100 text-blue-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {chapter.status}
          </span>

          {/* Moderation Status Badge */}
          {chapter.moderationStatus && (
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                chapter.moderationStatus === "APPROVED"
                  ? "bg-green-100 text-green-800"
                  : chapter.moderationStatus === "REJECTED"
                  ? "bg-red-100 text-red-800"
                  : chapter.moderationStatus === "PENDING"
                  ? "bg-orange-100 text-orange-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {chapter.moderationStatus}
            </span>
          )}

          {/* Pricing Badge/Editor */}
          {canEditPricing && isEditingPrice ? (
            <div className="flex items-center space-x-2 px-2 py-1 bg-gray-100 rounded-lg">
              <input
                type="checkbox"
                id={`free-${chapter.id}`}
                checked={tempIsFree}
                onChange={(e) => setTempIsFree(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor={`free-${chapter.id}`}
                className="text-xs font-medium text-gray-700"
              >
                Free
              </label>
              {!tempIsFree && (
                <>
                  <input
                    type="number"
                    value={tempCoinPrice}
                    onChange={(e) => setTempCoinPrice(Number(e.target.value))}
                    min="0"
                    step="1"
                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-600">coins</span>
                </>
              )}
              <button
                onClick={handlePriceSave}
                disabled={isUpdatingPrice}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={handlePriceCancel}
                className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              {/* Pricing Badge */}
              {story?.pricingType === "FREE" ? (
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Free
                </span>
              ) : story?.pricingType === "WHOLE_BOOK" ? (
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  Included in book ({story.bookPrice || 0} coins)
                </span>
              ) : story?.pricingType === "PAID_PER_CHAPTER" ? (
                chapter.isFree ? (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Free
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                    {chapter.coinPrice} coins
                  </span>
                )
              ) : (
                // Fallback for when story data is not available
                !chapter.isFree && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {chapter.coinPrice} coins
                  </span>
                )
              )}

              {/* Edit Price Button */}
              {canEditPricing && (
                <button
                  onClick={handlePriceEdit}
                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Edit pricing"
                >
                  <Cog6ToothIcon className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Chapter Title */}
        <h4 className="text-lg font-semibold text-black mb-3 line-clamp-2 sm:truncate">
          {chapter.title}
        </h4>

        {/* Chapter Stats */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-1">
            <DocumentTextIcon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{chapter.wordCount} words</span>
          </div>
          <div className="flex items-center space-x-1">
            <EyeIcon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{chapter.views}</span>
          </div>
          <div className="flex items-center space-x-1">
            <HeartIcon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{chapter.likes}</span>
          </div>
          <div className="flex items-center space-x-1 col-span-2 sm:col-span-1">
            <ClockIcon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              {formatDistanceToNow(new Date(chapter.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end sm:justify-start space-x-2 sm:ml-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
        {isTrashView ? (
          <>
            {/* Restore from Trash */}
            <button
              onClick={onRestore}
              disabled={isRestoring}
              className="p-3 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 touch-manipulation"
              title="Restore Chapter"
            >
              <ArchiveBoxIcon className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>

            {/* Permanently Delete */}
            <button
              onClick={onDelete}
              disabled={isPermanentlyDeleting}
              className="p-3 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 touch-manipulation"
              title="Delete Forever"
            >
              <TrashIcon className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
          </>
        ) : (
          <>
            {/* Edit */}
            <Link
              href={`/stories/${storyId}/chapters/${chapter.chapterNumber}/edit`}
              className="p-3 sm:p-2 text-black hover:bg-gray-50 rounded-lg transition-colors touch-manipulation"
              title="Edit Chapter"
            >
              <PencilIcon className="w-5 h-5 sm:w-4 sm:h-4" />
            </Link>

            {/* Publish/Unpublish */}
            {chapter.status === "DRAFT" ? (
              <button
                onClick={() => onPublish(chapter.id)}
                disabled={isPublishing}
                className="p-3 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 touch-manipulation"
                title="Publish Chapter"
              >
                <GlobeAltIcon className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
            ) : (
              <ProtectedActionButton
                itemId={chapter.id}
                itemType="chapter"
                itemTitle={chapter.title}
                actionType="unpublish"
                currentPublishStatus={chapter.status}
                currentPricingType={story?.pricingType}
                onAction={onUnpublish}
                className="p-3 sm:p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors disabled:opacity-50 touch-manipulation"
                disabled={isUnpublishing}
                variant="outline"
              />
            )}

            {/* Move to Trash */}
            <ProtectedActionButton
              itemId={chapter.id}
              itemType="chapter"
              itemTitle={chapter.title}
              actionType="moveToTrash"
              currentPublishStatus={chapter.status}
              currentPricingType={story?.pricingType}
              onAction={onDelete}
              className="p-3 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 touch-manipulation"
              disabled={isDeleting}
              variant="outline"
            />
          </>
        )}
      </div>
    </div>
  );
}

// Public Chapter Card for non-authors
function PublicChapterCard({
  chapter,
  storyId,
  story,
  hasAccess,
}: {
  chapter: ChapterPreview;
  storyId: string;
  story?: {
    pricingType: "FREE" | "PAID_PER_CHAPTER" | "WHOLE_BOOK";
    bookPrice?: number;
  };
  hasAccess: boolean;
}) {
  const isPaidChapter = !chapter.isFree && chapter.coinPrice > 0;
  const canAccess = hasAccess || chapter.isFree;

  return (
    <Link
      href={
        canAccess
          ? `/stories/${storyId}/chapters/${chapter.chapterNumber}/read`
          : "#"
      }
      className={`block border border-gray-200 rounded-lg p-4 transition-shadow bg-white ${
        canAccess
          ? "hover:shadow-md hover:border-nomanweb-primary/30"
          : "opacity-75 cursor-not-allowed"
      }`}
      onClick={(e) => {
        if (!canAccess) {
          e.preventDefault();
          // This will be handled by the parent component
        }
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Chapter Header */}
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-sm font-medium text-gray-500">
              Chapter {chapter.chapterNumber}
            </span>
            {/* Lock Icon for Paid Chapters */}
            {isPaidChapter && !canAccess && (
              <LockClosedIcon className="w-4 h-4 text-red-500" />
            )}
            {/* Pricing Badge */}
            {story?.pricingType === "FREE" ? (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Free
              </span>
            ) : story?.pricingType === "WHOLE_BOOK" ? (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                Included in book ({story.bookPrice || 0} coins)
              </span>
            ) : story?.pricingType === "PAID_PER_CHAPTER" ? (
              chapter.isFree ? (
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Free
                </span>
              ) : (
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    canAccess
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {canAccess ? "Purchased" : `${chapter.coinPrice} coins`}
                </span>
              )
            ) : (
              // Fallback for when story data is not available
              !chapter.isFree && (
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    canAccess
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {canAccess ? "Purchased" : `${chapter.coinPrice} coins`}
                </span>
              )
            )}
          </div>

          {/* Chapter Title */}
          <h4 className="text-lg font-semibold text-nomanweb-primary mb-2 truncate">
            {chapter.title}
          </h4>

          {/* Chapter Stats */}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <DocumentTextIcon className="w-4 h-4" />
              <span>{chapter.wordCount} words</span>
            </div>
            <div className="flex items-center space-x-1">
              <EyeIcon className="w-4 h-4" />
              <span>{chapter.views}</span>
            </div>
            <div className="flex items-center space-x-1">
              <HeartIcon className="w-4 h-4" />
              <span>{chapter.likes}</span>
            </div>
            {chapter.publishedAt && (
              <div className="flex items-center space-x-1">
                <ClockIcon className="w-4 h-4" />
                <span>
                  {formatDistanceToNow(new Date(chapter.publishedAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
