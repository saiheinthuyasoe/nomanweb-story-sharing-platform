"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useChaptersByStory } from "@/hooks/useChapters";
import { ChapterPreview, chaptersApi } from "@/lib/api/chapters";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  HashtagIcon,
  PencilSquareIcon,
  ClockIcon,
  GlobeAltIcon,
  Bars3Icon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface EditableChapter extends ChapterPreview {
  editing: boolean;
  tempTitle: string;
  tempChapterNumber: number;
  tempCoinPrice: number;
  tempIsFree: boolean;
  hasChanges: boolean;
}

export default function BulkEditChaptersPage() {
  const params = useParams();
  const storyId = params.id as string;
  const queryClient = useQueryClient();

  const {
    data: chapters = [],
    isLoading,
    error,
    refetch,
  } = useChaptersByStory(storyId, true);
  const [editableChapters, setEditableChapters] = useState<EditableChapter[]>(
    []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0 });
  const [activeTab, setActiveTab] = useState<"published" | "draft">(
    "published"
  );

  // Separate chapters by status
  const publishedChapters = editableChapters.filter(
    (ch) => ch.status === "PUBLISHED"
  );
  const draftChapters = editableChapters.filter((ch) => ch.status === "DRAFT");

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize editable chapters when data loads
  useEffect(() => {
    if (chapters.length > 0) {
      const initialChapters: EditableChapter[] = chapters
        .sort((a, b) => a.chapterNumber - b.chapterNumber) // Sort by chapter number
        .map((chapter) => ({
          ...chapter,
          editing: false,
          tempTitle: chapter.title,
          tempChapterNumber: chapter.chapterNumber,
          tempCoinPrice: chapter.coinPrice || 0,
          tempIsFree: chapter.isFree,
          hasChanges: false,
        }));
      setEditableChapters(initialChapters);
    } else {
      setEditableChapters([]);
    }
  }, [chapters]);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = editableChapters.some((ch) => ch.hasChanges);
    setHasUnsavedChanges(hasChanges);
  }, [editableChapters]);

  // Handle drag end - now scoped to current tab
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      setEditableChapters((chapters) => {
        const activeChapter = chapters.find((ch) => ch.id === active.id);
        const overChapter = chapters.find((ch) => ch.id === over?.id);

        if (!activeChapter || !overChapter) return chapters;

        // Ensure we're only moving within the same status group
        if (activeChapter.status !== overChapter.status) {
          return chapters; // Don't allow moving between published and draft
        }

        // Get chapters of the same status
        const sameStatusChapters = chapters.filter(
          (ch) => ch.status === activeChapter.status
        );
        const otherStatusChapters = chapters.filter(
          (ch) => ch.status !== activeChapter.status
        );

        // Find indices within the same status group
        const oldIndex = sameStatusChapters.findIndex(
          (ch) => ch.id === active.id
        );
        const newIndex = sameStatusChapters.findIndex(
          (ch) => ch.id === over?.id
        );

        // Reorder within the same status group
        const reorderedSameStatus = arrayMove(
          sameStatusChapters,
          oldIndex,
          newIndex
        );

        // Update chapter numbers for the reordered group
        const updatedSameStatus = reorderedSameStatus.map((chapter, index) => {
          let baseNumber: number;
          
          if (activeChapter.status === "PUBLISHED") {
            baseNumber = index + 1;
          } else {
            // For draft chapters, start after the highest published chapter number
            const publishedChapterNumbers = chapters
                    .filter((ch) => ch.status === "PUBLISHED")
              .map((ch) => ch.tempChapterNumber || 0);
            
            const maxPublishedNumber = publishedChapterNumbers.length > 0 
              ? Math.max(...publishedChapterNumbers) 
              : 0;
            
            baseNumber = maxPublishedNumber + index + 1;
          }

          const hasChanges =
            chapter.tempTitle !== chapter.title ||
            baseNumber !== chapter.chapterNumber ||
            chapter.tempCoinPrice !== (chapter.coinPrice || 0) ||
            chapter.tempIsFree !== chapter.isFree;

          return {
            ...chapter,
            tempChapterNumber: baseNumber,
            hasChanges,
          };
        });

        // Combine back with other status chapters
        return [...otherStatusChapters, ...updatedSameStatus].sort(
          (a, b) => a.tempChapterNumber - b.tempChapterNumber
        );
      });
    }
  };

  const updateChapter = (
    chapterId: string,
    field: keyof EditableChapter,
    value: any
  ) => {
    setEditableChapters((prev) =>
      prev.map((ch) => {
        if (ch.id === chapterId) {
          const updated = { ...ch, [field]: value };

          // Check if there are changes
          const hasChanges =
            updated.tempTitle !== ch.title ||
            updated.tempChapterNumber !== ch.chapterNumber ||
            updated.tempCoinPrice !== (ch.coinPrice || 0) ||
            updated.tempIsFree !== ch.isFree;

          return { ...updated, hasChanges };
        }
        return ch;
      })
    );
  };

  const startEdit = (chapterId: string) => {
    updateChapter(chapterId, "editing", true);
  };

  const cancelEdit = (chapterId: string) => {
    setEditableChapters((prev) =>
      prev.map((ch) => {
        if (ch.id === chapterId) {
          return {
            ...ch,
            editing: false,
            tempTitle: ch.title,
            tempChapterNumber: ch.chapterNumber,
            tempCoinPrice: ch.coinPrice || 0,
            tempIsFree: ch.isFree,
            hasChanges: false,
          };
        }
        return ch;
      })
    );
  };

  const saveChapter = async (chapterId: string) => {
    const chapter = editableChapters.find((ch) => ch.id === chapterId);
    if (!chapter) return;

    try {
      setIsSaving(true);

      // Check if chapter number changed and would require reordering
      const chapterNumberChanged = chapter.tempChapterNumber !== chapter.chapterNumber;
      
      if (chapterNumberChanged) {
        // If chapter number changed, we need to use the reorder API to avoid conflicts
        const updatedChapters = editableChapters.map(ch => 
          ch.id === chapterId 
            ? { ...ch, chapterNumber: chapter.tempChapterNumber }
            : ch
        );
        const sortedChapters = [...updatedChapters].sort(
          (a, b) => a.chapterNumber - b.chapterNumber
        );
        const chapterIds = sortedChapters.map((ch) => ch.id);
        
        // First reorder to handle chapter number change
        await chaptersApi.reorderChapters(storyId, chapterIds);
      }

      // Then update other fields
      await chaptersApi.updateChapter(chapterId, {
        title: chapter.tempTitle,
        coinPrice: chapter.tempCoinPrice,
        isFree: chapter.tempIsFree,
        shouldPublish: false, // Don't change publish status during bulk edit
        // Don't include chapterNumber if it was already handled by reorder
      });

      // Update the chapter with new values
      setEditableChapters((prev) =>
        prev.map((ch) => {
          if (ch.id === chapterId) {
            return {
              ...ch,
              title: ch.tempTitle,
              chapterNumber: ch.tempChapterNumber,
              coinPrice: ch.tempCoinPrice,
              isFree: ch.tempIsFree,
              editing: false,
              hasChanges: false,
            };
          }
          return ch;
        })
      );

      // Refresh data to ensure consistency
      await queryClient.invalidateQueries({ queryKey: ["chapters", storyId] });

      toast.success("Chapter updated successfully!");
    } catch (error: any) {
      console.error("Error saving chapter:", error);
      toast.error(error.response?.data?.message || "Failed to save chapter");
    } finally {
      setIsSaving(false);
    }
  };

  const saveAllChanges = async () => {
    const changedChapters = editableChapters.filter((ch) => ch.hasChanges);
    if (changedChapters.length === 0) return;

    try {
      setIsSaving(true);

      // First, check if chapter numbers have changed (reordering)
      const chapterNumbersChanged = changedChapters.some(
        (ch) => ch.tempChapterNumber !== ch.chapterNumber
      );

      if (chapterNumbersChanged) {
        // Use the reorder API to handle chapter number changes atomically
        const sortedChapters = [...editableChapters].sort(
          (a, b) => a.tempChapterNumber - b.tempChapterNumber
        );
        const chapterIds = sortedChapters.map((ch) => ch.id);
        
        setSaveProgress({ current: 0, total: changedChapters.length + 1 });
        
        // Call reorder API
        await chaptersApi.reorderChapters(storyId, chapterIds);
        setSaveProgress({ current: 1, total: changedChapters.length + 1 });
        
        // Now update other fields (title, price, etc.) for changed chapters
        let progressCounter = 1;
        for (const chapter of changedChapters) {
          await chaptersApi.updateChapter(chapter.id, {
            title: chapter.tempTitle,
            coinPrice: chapter.tempCoinPrice,
            isFree: chapter.tempIsFree,
            shouldPublish: false,
          });
          progressCounter++;
          setSaveProgress({ current: progressCounter, total: changedChapters.length + 1 });
        }
      } else {
        // No reordering, just update fields normally
        setSaveProgress({ current: 0, total: changedChapters.length });
        let progressCounter = 0;
        
        for (const chapter of changedChapters) {
          try {
            await chaptersApi.updateChapter(chapter.id, {
              title: chapter.tempTitle,
              coinPrice: chapter.tempCoinPrice,
              isFree: chapter.tempIsFree,
              shouldPublish: false,
              // Don't include chapterNumber to avoid conflicts
            });
            progressCounter++;
            setSaveProgress({ current: progressCounter, total: changedChapters.length });
          } catch (error: any) {
            console.error(`Error updating chapter ${chapter.id}:`, error);
            toast.error(
              error.response?.data?.message || `Failed to update chapter "${chapter.title}"`
            );
            throw error;
          }
        }
      }

      // Update local state to reflect saved changes
      setEditableChapters((prev) =>
        prev.map((ch) => {
          const wasChanged = ch.hasChanges;
          if (wasChanged) {
            return {
              ...ch,
              title: ch.tempTitle,
              chapterNumber: ch.tempChapterNumber,
              coinPrice: ch.tempCoinPrice,
              isFree: ch.tempIsFree,
              editing: false,
              hasChanges: false,
            };
          }
          return ch;
        })
      );

      // Invalidate all chapter-related queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ["chapters", storyId] });
      await queryClient.invalidateQueries({
        queryKey: ["chapters-paged", storyId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["chapters-search", storyId],
      });
      await queryClient.invalidateQueries({ queryKey: ["story", storyId] });

      toast.success(`Successfully updated ${changedChapters.length} chapters!`);
    } catch (error: any) {
      console.error("Error saving chapters:", error);

      // Provide more specific error messages
      if (error.response?.data?.message) {
        toast.error(`Failed to save: ${error.response.data.message}`);
      } else {
        toast.error("Failed to save chapters. Please try again.");
      }
    } finally {
      setIsSaving(false);
      setSaveProgress({ current: 0, total: 0 });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || editableChapters.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center card-elevated p-8 max-w-md mx-4">
          <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-nomanweb-primary mb-2">
            No Chapters Found
          </h2>
          <p className="text-gray-600 mb-6">
            This story doesn't have any chapters to edit.
          </p>
          <Link
            href={`/dashboard/stories/${storyId}`}
            className="btn-gradient px-6 py-3 rounded-lg font-semibold hover-lift inline-flex items-center space-x-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back to Story</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="card-elevated p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href={`/dashboard/stories/${storyId}`}
                className="p-2 text-gray-500 hover:text-nomanweb-primary hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold" style={{color: '#18243c'}}>
                  Multi Edit Chapters
                </h1>
                <p className="text-gray-600 mt-1">
                  Edit chapter information for all chapters at once
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  💡 Drag chapters using the{" "}
                  <Bars3Icon className="w-4 h-4 inline text-gray-400" /> handle
                  to reorder them. Changes are shown in real-time!
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {hasUnsavedChanges && (
                <>
                  <span className="text-sm text-orange-600 font-medium">
                    {editableChapters.filter((ch) => ch.hasChanges).length}{" "}
                    unsaved changes
                  </span>
                  <button
                    onClick={saveAllChanges}
                    disabled={isSaving}
                    className="btn-gradient px-6 py-2 rounded-lg font-semibold hover-lift disabled:opacity-50 flex items-center space-x-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>
                          {saveProgress.total > 0
                            ? `Saving... (${saveProgress.current}/${saveProgress.total})`
                            : "Saving..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-4 h-4" />
                        <span>Save All</span>
                      </>
                    )}
                  </button>
                </>
              )}

              <button
                onClick={() => refetch()}
                className="p-2 text-gray-600 hover:text-nomanweb-primary hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh chapters"
              >
                <ArrowPathIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex items-center justify-between border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("published")}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "published"
                    ? "border-transparent"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                style={{
                  borderBottomColor: activeTab === "published" ? '#18243c' : 'transparent',
                  color: activeTab === "published" ? '#18243c' : undefined
                }}
              >
                <div className="flex items-center space-x-2">
                  <GlobeAltIcon className="w-4 h-4" />
                  <span>Published Chapters</span>
                  <span className="text-black px-2 py-0.5 rounded-full text-xs font-medium">
                    {publishedChapters.length}
                  </span>
                  {publishedChapters.some((ch) => ch.hasChanges) && (
                    <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full text-xs font-medium">
                      {publishedChapters.filter((ch) => ch.hasChanges).length}{" "}
                      changes
                    </span>
                  )}
                </div>
              </button>

              <button
                onClick={() => setActiveTab("draft")}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "draft"
                    ? "border-transparent"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                style={{
                  borderBottomColor: activeTab === "draft" ? '#18243c' : 'transparent',
                  color: activeTab === "draft" ? '#18243c' : undefined
                }}
              >
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-4 h-4" />
                  <span>Draft Chapters</span>
                  <span className="text-black px-2 py-0.5 rounded-full text-xs font-medium">
                    {draftChapters.length}
                  </span>
                  {draftChapters.some((ch) => ch.hasChanges) && (
                    <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full text-xs font-medium">
                      {draftChapters.filter((ch) => ch.hasChanges).length}{" "}
                      changes
                    </span>
                  )}
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "published" ? (
            publishedChapters.length === 0 ? (
              <div className="card-elevated p-8 text-center">
                <GlobeAltIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No published chapters to edit</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={publishedChapters.map((ch) => ch.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {" "}
                  <div className="space-y-4">
                    {publishedChapters.map((chapter) => (
                      <SortableChapterEditCard
                        key={chapter.id}
                        chapter={chapter}
                        onUpdate={updateChapter}
                        onStartEdit={startEdit}
                        onCancelEdit={cancelEdit}
                        onSave={saveChapter}
                        isSaving={isSaving}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )
          ) : draftChapters.length === 0 ? (
            <div className="card-elevated p-8 text-center">
              <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No draft chapters to edit</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={draftChapters.map((ch) => ch.id)}
                strategy={verticalListSortingStrategy}
              >
                {" "}
                <div className="space-y-4">
                  {" "}
                  {draftChapters.map((chapter) => (
                    <SortableChapterEditCard
                      key={chapter.id}
                      chapter={chapter}
                      onUpdate={updateChapter}
                      onStartEdit={startEdit}
                      onCancelEdit={cancelEdit}
                      onSave={saveChapter}
                      isSaving={isSaving}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
}

interface ChapterEditCardProps {
  chapter: EditableChapter;
  onUpdate: (
    chapterId: string,
    field: keyof EditableChapter,
    value: any
  ) => void;
  onStartEdit: (chapterId: string) => void;
  onCancelEdit: (chapterId: string) => void;
  onSave: (chapterId: string) => void;
  isSaving: boolean;
}

function SortableChapterEditCard(props: ChapterEditCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ChapterEditCard
        {...props}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
}

interface ChapterEditCardPropsWithDrag extends ChapterEditCardProps {
  dragHandleProps?: any;
  isDragging?: boolean;
}

function ChapterEditCard({
  chapter,
  onUpdate,
  onStartEdit,
  onCancelEdit,
  onSave,
  isSaving,
  dragHandleProps,
  isDragging = false,
}: ChapterEditCardPropsWithDrag) {
  return (
    <div
      className={`card-elevated p-6 transition-all ${
        chapter.hasChanges ? "ring-2 ring-orange-200 bg-orange-50" : ""
      } ${chapter.editing ? "ring-2 ring-blue-200" : ""} ${
        isDragging ? "shadow-lg scale-105" : ""
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* Drag Handle */}
        <button
          {...dragHandleProps}
          className="mt-2 p-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing transition-colors hover:bg-gray-100 rounded"
          title="Drag to reorder chapters"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0 space-y-4">
          {/* Chapter Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  chapter.status === "PUBLISHED"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {chapter.status}
              </span>
              {chapter.hasChanges && (
                <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                  Unsaved Changes
                </span>
              )}
              <span className="text-xs text-gray-500">
                Created{" "}
                {formatDistanceToNow(new Date(chapter.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {chapter.editing ? (
                <>
                  <button
                    onClick={() => onCancelEdit(chapter.id)}
                    disabled={isSaving}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Cancel editing"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onSave(chapter.id)}
                    disabled={isSaving}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Save changes"
                  >
                    <CheckIcon className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onStartEdit(chapter.id)}
                    className="p-2 text-black hover:bg-gray-50 rounded-lg transition-colors"
                    title="Edit chapter"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Editable Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Title */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <PencilSquareIcon className="w-4 h-4" />
                <span>Title</span>
              </label>
              {chapter.editing ? (
                <input
                  type="text"
                  value={chapter.tempTitle}
                  onChange={(e) =>
                    onUpdate(chapter.id, "tempTitle", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nomanweb-secondary focus:border-transparent"
                  placeholder="Chapter title"
                />
              ) : (
                <p className="text-gray-900 font-medium">{chapter.title}</p>
              )}
            </div>

            {/* Chapter Number */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <HashtagIcon className="w-4 h-4" />
                <span>Chapter Number</span>
              </label>
              {chapter.editing ? (
                <div>
                  <input
                    type="number"
                    min="1"
                    value={chapter.tempChapterNumber}
                    onChange={(e) =>
                      onUpdate(
                        chapter.id,
                        "tempChapterNumber",
                        parseInt(e.target.value) || 1
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nomanweb-secondary focus:border-transparent"
                    aria-label="Chapter number"
                  />
                  {chapter.tempChapterNumber !== chapter.chapterNumber && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ Changing chapter number will reorder other chapters
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-900 font-medium">
                  Chapter {chapter.tempChapterNumber}
                </p>
              )}
            </div>

            {/* Price & Free Status */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <CurrencyDollarIcon className="w-4 h-4" />
                <span>Pricing</span>
              </label>
              {chapter.editing ? (
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={chapter.tempIsFree}
                      onChange={(e) =>
                        onUpdate(chapter.id, "tempIsFree", e.target.checked)
                      }
                      className="rounded border-gray-300 text-nomanweb-primary focus:ring-nomanweb-secondary"
                    />
                    <span className="text-sm">Free Chapter</span>
                  </label>
                  {!chapter.tempIsFree && (
                    <input
                      type="number"
                      min="0"
                      value={chapter.tempCoinPrice}
                      onChange={(e) =>
                        onUpdate(
                          chapter.id,
                          "tempCoinPrice",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nomanweb-secondary focus:border-transparent"
                      placeholder="Coin price"
                    />
                  )}
                </div>
              ) : (
                <p className="text-gray-900 font-medium">
                  {chapter.isFree ? "Free" : `${chapter.coinPrice} coins`}
                </p>
              )}
            </div>
          </div>

          {/* Chapter Stats */}
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <DocumentTextIcon className="w-4 h-4" />
              <span>{chapter.wordCount} words</span>
            </div>
            <div className="flex items-center space-x-1">
              <EyeIcon className="w-4 h-4" />
              <span>{chapter.views} views</span>
            </div>
            <div className="flex items-center space-x-1">
              {chapter.status === "PUBLISHED" ? (
                <GlobeAltIcon className="w-4 h-4" />
              ) : (
                <ClockIcon className="w-4 h-4" />
              )}
              <span>
                {chapter.status === "PUBLISHED" ? "Published" : "Draft"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
