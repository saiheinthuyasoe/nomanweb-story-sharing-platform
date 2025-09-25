"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useChapterByStoryAndNumber,
  useUpdateChapter,
  useAutoSaveChapter,
} from "@/hooks/useChapters";
import { useStory } from "@/hooks/useStories";
import { useAuth } from "@/contexts/AuthContext";
import { ChapterForm } from "@/components/chapters/ChapterForm";
import { UpdateChapterRequest } from "@/lib/api/chapters";
import Link from "next/link";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  PencilIcon,
  CloudIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
  UserPlusIcon,
  StarIcon,
  ClockIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import Image from "next/image";

export default function EditChapterPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [saveStatus, setSaveStatus] = useState<
    "saved" | "saving" | "error" | "idle"
  >("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"EDIT" | "VIEW">("VIEW");
  const [inviteMessage, setInviteMessage] = useState("");
  const [hasUserStartedTyping, setHasUserStartedTyping] = useState(false);

  const storyId = params.id as string;
  const chapterNumber = parseInt(params.chapterNumber as string);

  const { data: story, isLoading: storyLoading } = useStory(storyId);
  const {
    data: chapter,
    isLoading: chapterLoading,
    error,
  } = useChapterByStoryAndNumber(storyId, chapterNumber, true);
  const { mutate: updateChapter, isPending } = useUpdateChapter();
  const { mutate: autoSaveChapter } = useAutoSaveChapter();

  // Check if user is authorized - wait for loading to complete
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
  }, [user, loading, router]);

  // Auto-save status indicator
  useEffect(() => {
    if (saveStatus === "saved") {
      const timer = setTimeout(() => setSaveStatus("idle"), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  // Auto-focus on title if it's "Untitled Chapter" - only on initial load and if user hasn't started typing
  useEffect(() => {
    if (
      chapter &&
      chapter.title === "Untitled Chapter" &&
      !hasUserStartedTyping
    ) {
      // Focus on title input after a short delay to ensure form is rendered
      const timer = setTimeout(() => {
        const titleInput = document.querySelector(
          'input[name="title"]'
        ) as HTMLInputElement;
        const editorElement = document.querySelector(
          '[data-lexical-editor="true"]'
        ) as HTMLElement;

        // Only auto-focus if:
        // 1. Title input exists and is not already focused
        // 2. Editor is not currently focused
        // 3. User hasn't started typing yet
        if (
          titleInput &&
          !titleInput.matches(":focus") &&
          (!editorElement || !editorElement.matches(":focus-within"))
        ) {
          titleInput.focus();
          titleInput.select();
        }
      }, 200); // Increased delay to ensure editor is fully loaded
      return () => clearTimeout(timer);
    }
  }, [chapter, hasUserStartedTyping]);

  const handleSubmit = async (data: {
    storyId: string;
    title: string;
    content: string;
    coinPrice: number;
    isFree: boolean;
    isDraft: boolean;
    chapterNumber?: number;
  }) => {
    if (!chapter) return;

    setSaveStatus("saving");

    console.log("EditPage - Original chapter data:", {
      id: chapter.id,
      title: chapter.title,
      contentLength: chapter.content?.length || 0,
      coinPrice: chapter.coinPrice,
      isFree: chapter.isFree,
      status: chapter.status,
    });

    console.log("EditPage - Form data received:", {
      title: data.title,
      contentLength: data.content?.length || 0,
      contentPreview: data.content?.substring(0, 100) + "...",
      coinPrice: data.coinPrice,
      isFree: data.isFree,
      isDraft: data.isDraft,
      chapterNumber: data.chapterNumber,
    });

    const updateData: UpdateChapterRequest = {
      title: data.title && data.title.trim() ? data.title : undefined,
      content: data.content && data.content.trim() ? data.content : undefined,
      coinPrice:
        data.coinPrice !== chapter.coinPrice ? data.coinPrice : undefined,
      isFree: data.isFree !== chapter.isFree ? data.isFree : undefined,
      chapterNumber:
        data.chapterNumber !== chapter.chapterNumber
          ? data.chapterNumber
          : undefined,
      shouldPublish:
        !data.isDraft &&
        (chapter.status === "DRAFT" || chapter.status === "PENDING")
          ? true
          : undefined,
    };

    console.log("EditPage - Update data being sent:", updateData);

    updateChapter(
      { id: chapter.id, data: updateData },
      {
        onSuccess: (updatedChapter) => {
          console.log("EditPage - Update successful, received:", {
            id: updatedChapter.id,
            title: updatedChapter.title,
            contentLength: updatedChapter.content?.length || 0,
            status: updatedChapter.status,
          });
          setSaveStatus("saved");
          setLastSaved(new Date());
          router.push(`/dashboard/stories/${storyId}`);
        },
        onError: (error) => {
          console.error("EditPage - Update failed:", error);
          setSaveStatus("error");
          toast.error("Failed to save changes");
        },
      }
    );
  };

  const handleAutoSave = async (data: Partial<any>) => {
    if (!chapter || !data.content) return;

    setSaveStatus("saving");

    try {
      const autoSaveData: UpdateChapterRequest = {
        content: data.content,
        // Always include current form values to prevent them from being overwritten
        // Use !== undefined to allow empty strings (deleted titles)
        title: data.title !== undefined ? data.title : chapter.title,
        coinPrice:
          data.coinPrice !== undefined ? data.coinPrice : chapter.coinPrice,
        isFree: data.isFree !== undefined ? data.isFree : chapter.isFree,
        isAutoSave: true,
      };

      console.log("EditPage - Auto-saving chapter:", {
        chapterId: chapter.id,
        contentLength: data.content?.length || 0,
        title: data.title,
        coinPrice: data.coinPrice,
        isFree: data.isFree,
      });

      autoSaveChapter(
        { id: chapter.id, data: autoSaveData },
        {
          onSuccess: () => {
            setSaveStatus("saved");
            setLastSaved(new Date());
          },
          onError: () => {
            setSaveStatus("error");
          },
        }
      );
    } catch (error) {
      console.error("EditPage - Auto-save failed:", error);
      setSaveStatus("error");
    }
  };

  // Handle when user starts typing in the editor
  const handleTypingStart = () => {
    setHasUserStartedTyping(true);
  };

  if (storyLoading || chapterLoading) {
    return <EditChapterSkeleton />;
  }

  // Show loading while checking authentication
  if (loading) {
    return <EditChapterSkeleton />;
  }

  if (error || !chapter) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center bg-white border border-gray-100 rounded-lg p-8 max-w-md mx-4">
          <div className="bg-red-50 p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <BookOpenIcon className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Chapter Not Found
          </h2>
          <p className="text-gray-500 mb-6 text-sm">
            The chapter you're trying to edit doesn't exist or has been removed.
          </p>
          <Link
            href={`/stories/${storyId}`}
            className="inline-flex items-center space-x-2 px-6 py-3 text-white rounded-md font-medium transition-colors"
            style={{
              backgroundColor: "#18243c",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#0f1a2e")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#18243c")
            }
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back to Story</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!story) {
    return null;
  }

  // Check authorization - only story author can edit
  if (user?.id !== story.author.id) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center bg-white border border-gray-100 rounded-lg p-8 max-w-md mx-4">
          <div className="bg-yellow-50 p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <PencilIcon className="w-6 h-6 text-yellow-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-500 mb-6 text-sm">
            You don't have permission to edit this chapter.
          </p>
          <Link
            href={`/stories/${storyId}`}
            className="inline-flex items-center space-x-2 px-6 py-3 text-white rounded-md font-medium transition-colors"
            style={{
              backgroundColor: "#18243c",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#0f1a2e")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#18243c")
            }
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back to Story</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimalist Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between h-12">
            {/* Left side */}
            <div className="flex items-center space-x-3">
              <Link
                href={`/dashboard/stories/${storyId}`}
                className="p-1.5 hover:bg-gray-50 rounded-md transition-colors"
                title="Back to story"
              >
                <ArrowLeftIcon className="w-4 h-4 text-gray-500" />
              </Link>

              <div className="flex items-center space-x-2">
                <div>
                  <h1 className="text-sm font-medium text-gray-900 truncate max-w-md">
                    {chapter.title || "Untitled Chapter"}
                  </h1>
                  <p className="text-xs text-gray-400">
                    {story.title} • Chapter {chapter.chapterNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - Save status */}
            <div className="flex items-center">
              {/* Auto-save Status */}
              <div className="flex items-center space-x-1.5">
                {saveStatus === "saving" && (
                  <>
                    <CloudIcon className="w-3.5 h-3.5 text-gray-400 animate-pulse" />
                    <span className="text-xs text-gray-500">Saving...</span>
                  </>
                )}
                {saveStatus === "saved" && (
                  <>
                    <CheckCircleIcon className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-xs text-green-600">Saved</span>
                  </>
                )}
                {saveStatus === "error" && (
                  <>
                    <ExclamationCircleIcon className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-xs text-red-600">Error</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="bg-white">
          <ChapterForm
            storyId={storyId}
            chapterId={chapter.id}
            initialData={{
              title: chapter.title,
              content: chapter.content,
              coinPrice: chapter.coinPrice,
              isFree: chapter.isFree,
              isDraft:
                chapter.status === "DRAFT" || chapter.status === "PENDING",
              chapterNumber: chapter.chapterNumber,
            }}
            onSubmit={handleSubmit}
            onAutoSave={handleAutoSave}
            isLoading={isPending}
            isEditing={true}
            story={{
              pricingType: story.pricingType,
              bookPrice: story.bookPrice,
            }}
            onTypingStart={handleTypingStart}
          />
        </div>
      </div>
    </div>
  );
}

function EditChapterSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-32 mb-1 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="animate-pulse space-y-6">
          <div>
            <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
          <div className="flex justify-between items-center pt-6 border-t border-gray-100">
            <div className="flex space-x-3">
              <div className="h-9 bg-gray-200 rounded w-24"></div>
              <div className="h-9 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
