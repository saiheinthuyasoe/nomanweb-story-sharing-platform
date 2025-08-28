"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateChapter } from "@/hooks/useChapters";
import { CreateChapterRequest } from "@/lib/api/chapters";
import { PlusIcon, DocumentPlusIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

interface QuickCreateChapterProps {
  storyId: string;
  totalChapters: number;
  className?: string;
  variant?: "button" | "card";
}

export function QuickCreateChapter({
  storyId,
  totalChapters,
  className = "",
  variant = "button",
}: QuickCreateChapterProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const { mutate: createChapter } = useCreateChapter();

  const handleQuickCreate = async () => {
    if (isCreating) return;

    setIsCreating(true);

    // Create chapter with default values
    const chapterData: CreateChapterRequest = {
      storyId,
      title: "Untitled Chapter",
      content: "<p></p>", // Empty paragraph for Lexical editor
      chapterNumber: totalChapters + 1,
      coinPrice: 0,
      isFree: true,
      isDraft: true,
    };

    createChapter(chapterData, {
      onSuccess: (newChapter) => {
        // Show quick success message
        toast.success("Creating chapter...", { duration: 1000 });

        // Immediately redirect to edit page
        router.push(
          `/stories/${storyId}/chapters/${newChapter.chapterNumber}/edit`
        );
      },
      onError: (error) => {
        console.error("Failed to create chapter:", error);
        toast.error("Failed to create chapter");
        setIsCreating(false);
      },
    });
  };

  if (variant === "card") {
    return (
      <button
        onClick={handleQuickCreate}
        disabled={isCreating}
        className={`group relative overflow-hidden rounded-lg border-2 border-dashed border-gray-300 hover:border-[#18243c] transition-all duration-200 p-8 ${className}`}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="p-3 bg-gray-100 rounded-full group-hover:bg-[#18243c]/10 transition-colors">
            <DocumentPlusIcon className="w-8 h-8 text-gray-600 group-hover:text-[#18243c]" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#18243c]">
              {isCreating ? "Creating..." : "New Chapter"}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Click to create and start writing
            </p>
          </div>
        </div>
        {isCreating && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#18243c]"></div>
          </div>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleQuickCreate}
      disabled={isCreating}
      className={`inline-flex items-center px-4 py-2 bg-[#18243c] hover:bg-[#1e2a42] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isCreating ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Creating...
        </>
      ) : (
        <>
          <PlusIcon className="w-5 h-5 mr-2" />
          New Chapter
        </>
      )}
    </button>
  );
}
