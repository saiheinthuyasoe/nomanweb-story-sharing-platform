import React, { useState, useEffect, useRef, useCallback } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { CreateStoryRequest, UpdateStoryRequest, Story } from "@/types/story";
import { useCategories } from "@/hooks/useStories";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { StoryCoverUpload } from "@/components/upload/StoryCoverUpload";
import { RefundConfirmationModal } from "@/components/modals/RefundConfirmationModal";

interface StoryFormProps {
  story?: Story;
  onSubmit: (data: CreateStoryRequest | UpdateStoryRequest, shouldRedirect?: boolean) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isEdit?: boolean;
}

export function StoryForm({
  story,
  onSubmit,
  onCancel,
  isLoading = false,
  isEdit = false,
}: StoryFormProps) {
  const { data: categories } = useCategories();
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(story?.tags || []);
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [editingTagValue, setEditingTagValue] = useState("");
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundData, setRefundData] = useState<any>({
    hasPurchases: false,
    totalRefundAmount: 0,
    affectedPurchasers: 0,
  });
  const [isCalculatingRefund, setIsCalculatingRefund] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateStoryRequest | UpdateStoryRequest>({
    defaultValues: {
      title: story?.title || "",
      description: story?.description || "",
      categoryId: story?.category?.id || "",
      pricingType: story?.pricingType || "FREE",
      bookStatus: story?.bookStatus || "ONGOING",
      coverImageUrl: story?.coverImageUrl || "",
      tags: story?.tags || [],
      bookPrice: story?.bookPrice || undefined,
      defaultChapterPrice: story?.defaultChapterPrice || undefined,
    },
  });

  const watchedPricingType = useWatch({ control, name: "pricingType" });
  
  // Use a more stable reference for cover image to prevent unnecessary re-renders
  const [stableCoverImage, setStableCoverImage] = useState(story?.coverImageUrl || "");
  const currentCoverImageRef = useRef(story?.coverImageUrl || "");
  
  // Track cover image changes without causing re-renders
  const coverImageValue = useWatch({ control, name: "coverImageUrl" });
  
  useEffect(() => {
    if (coverImageValue !== currentCoverImageRef.current) {
      console.log(
        "🖼️ StoryForm: Cover image value changed from:",
        currentCoverImageRef.current,
        "to:",
        coverImageValue
      );
      currentCoverImageRef.current = coverImageValue;
      setStableCoverImage(coverImageValue);
    }
  }, [coverImageValue]);

  useEffect(() => {
    setValue("tags", selectedTags);
  }, [selectedTags, setValue]);

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !selectedTags.includes(tag) && selectedTags.length < 10) {
      const newTags = [...selectedTags, tag];
      setSelectedTags(newTags);
      setTagInput("");
    } else if (selectedTags.length >= 10) {
      toast.error("Maximum 10 tags allowed");
    } else if (selectedTags.includes(tag)) {
      toast.error("Tag already exists");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter((tag) => tag !== tagToRemove);
    setSelectedTags(newTags);
  };

  const handleEditTag = (index: number) => {
    setEditingTagIndex(index);
    setEditingTagValue(selectedTags[index]);
  };

  const handleSaveTagEdit = () => {
    if (editingTagIndex !== null) {
      const newTag = editingTagValue.trim().toLowerCase();
      if (newTag && !selectedTags.includes(newTag)) {
        const newTags = [...selectedTags];
        newTags[editingTagIndex] = newTag;
        setSelectedTags(newTags);
        setEditingTagIndex(null);
        setEditingTagValue("");
      } else if (selectedTags.includes(newTag)) {
        toast.error("Tag already exists");
      }
    }
  };

  const handleCancelTagEdit = () => {
    setEditingTagIndex(null);
    setEditingTagValue("");
  };

  const handleEditTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveTagEdit();
    } else if (e.key === "Escape") {
      handleCancelTagEdit();
    }
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const handleCoverImageChange = useCallback((url: string) => {
    console.log("🖼️ StoryForm: handleCoverImageChange called with URL:", url);
    setValue("coverImageUrl", url);
    setStableCoverImage(url);
    
    // Don't auto-save if we're already in an auto-save process to prevent loops
    if (isAutoSaving) {
      return;
    }
    
    // Auto-save cover image change without redirecting
    if (isEdit && story?.id) {
      setIsAutoSaving(true);
      const currentFormData = watch();
      const submissionData = { 
        ...currentFormData, 
        coverImageUrl: url,
        tags: selectedTags 
      };
      
      // Clean up pricing fields based on pricing type
      if (submissionData.pricingType === "FREE") {
        delete submissionData.bookPrice;
        delete submissionData.defaultChapterPrice;
      } else if (submissionData.pricingType === "WHOLE_BOOK") {
        delete submissionData.defaultChapterPrice;
      } else if (submissionData.pricingType === "PAID_PER_CHAPTER") {
        delete submissionData.bookPrice;
      }
      
      // Submit without redirect
      onSubmit(submissionData, false);
      
      // Reset auto-saving flag after a short delay
      setTimeout(() => setIsAutoSaving(false), 1000);
    }
  }, [setValue, isEdit, story?.id, watch, selectedTags, onSubmit, isAutoSaving]);

  const handleCoverImageRemove = useCallback(() => {
    setValue("coverImageUrl", "");
    setStableCoverImage("");
  }, [setValue]);

  const calculateRefund = async (storyId: string) => {
    try {
      setIsCalculatingRefund(true);
      const response = await fetch(`/api/stories/${storyId}/calculate-refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error("Failed to calculate refund");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error calculating refund:", error);
      toast.error("Failed to calculate refund");
      return null;
    } finally {
      setIsCalculatingRefund(false);
    }
  };

  const onFormSubmit = async (
    data: CreateStoryRequest | UpdateStoryRequest
  ) => {
    const submissionData = { ...data, tags: selectedTags };

    // Only include pricing fields when relevant to pricing type
    if (data.pricingType === "FREE") {
      // Remove pricing fields for free content
      delete submissionData.bookPrice;
      delete submissionData.defaultChapterPrice;
    } else if (data.pricingType === "WHOLE_BOOK") {
      // Only include bookPrice for whole book pricing
      delete submissionData.defaultChapterPrice;
    } else if (data.pricingType === "PAID_PER_CHAPTER") {
      // Only include defaultChapterPrice for per-chapter pricing
      delete submissionData.bookPrice;
    }

    // Check if this is an edit and pricing is changing to free
    const isPaidToFree =
      isEdit &&
      story &&
      (story.pricingType === "PAID_PER_CHAPTER" ||
        story.pricingType === "WHOLE_BOOK") &&
      data.pricingType === "FREE";

    if (isPaidToFree && story?.id) {
      // Calculate refund before showing confirmation
      const refundInfo = await calculateRefund(story.id);
      if (refundInfo && refundInfo.hasPurchases) {
        setRefundData(refundInfo);
        setPendingFormData(submissionData);
        setShowRefundModal(true);
        return;
      }
    }

    // Submit normally if no refund needed
    onSubmit(submissionData, true);
  };

  const handleRefundConfirm = () => {
    if (pendingFormData) {
      onSubmit(pendingFormData, true);
      setShowRefundModal(false);
      setPendingFormData(null);
      setRefundData({
        hasPurchases: false,
        totalRefundAmount: 0,
        affectedPurchasers: 0,
      });
    }
  };

  const handleRefundCancel = () => {
    setShowRefundModal(false);
    setPendingFormData(null);
    setRefundData({
      hasPurchases: false,
      totalRefundAmount: 0,
      affectedPurchasers: 0,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-800">
          {isEdit ? "Edit Story" : "Create New Story"}
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-slate-500 mt-1 sm:mt-2">
          {isEdit
            ? "Update your story details"
            : "Share your story with the world"}
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* Cover Image - Moved to top */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-4">
            Story Cover Image
          </label>
          <div className="flex justify-center">
            <StoryCoverUpload
              storyId={story?.id || "new"}
              value={stableCoverImage}
              onChange={handleCoverImageChange}
              onRemove={handleCoverImageRemove}
              disabled={isLoading}
              placeholder="Upload your story cover"
            />
          </div>
        </div>

        {/* Title */}
        <div className="relative">
          <input
            type="text"
            id="title"
            {...register("title", {
              required: "Title is required",
              maxLength: {
                value: 255,
                message: "Title must not exceed 255 characters",
              },
            })}
            className="w-full px-0 py-2 sm:py-3 text-base sm:text-lg bg-transparent border-0 border-b-2 border-slate-300 focus:border-slate-600 focus:ring-0 focus:outline-none transition-colors placeholder-slate-400"
            placeholder="Story Title *"
          />
          {errors.title && (
            <p className="mt-2 text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Description *
          </label>
          <textarea
            {...register("description", {
              required: "Description is required",
            })}
            placeholder="Describe your story..."
            rows={3}
            className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-slate-50/50 resize-none text-sm sm:text-base"
          />
          {errors.description && (
            <p className="text-red-500 text-sm">{errors.description.message}</p>
          )}
        </div>

        {/* Category, Content Type, and Content Status Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {/* Category */}
          <div className="relative">
            <select
              id="categoryId"
              {...register("categoryId")}
              className="w-full px-0 py-2 sm:py-3 bg-transparent border-0 border-b-2 border-slate-300 focus:border-slate-600 focus:ring-0 focus:outline-none transition-colors appearance-none cursor-pointer text-sm sm:text-base touch-manipulation"
            >
              <option value="">Select Category</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg
                className="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {/* Pricing Type */}
          <div className="relative">
            <select
              id="pricingType"
              {...register("pricingType")}
              className="w-full px-0 py-2 sm:py-3 bg-transparent border-0 border-b-2 border-slate-300 focus:border-slate-600 focus:ring-0 focus:outline-none transition-colors appearance-none cursor-pointer text-sm sm:text-base touch-manipulation"
              onChange={(e) => {
                const newPricingType = e.target.value;

                // For any pricing type change, update normally
                // The backend will handle refunds automatically when the story is updated
                setValue("pricingType", newPricingType as any);
              }}
            >
              <option value="FREE">Free</option>
              <option value="PAID_PER_CHAPTER">Paid per Chapter</option>
              <option value="WHOLE_BOOK">Whole Book</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg
                className="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>


          </div>

          {/* Book Status */}
          <div className="relative">
            <select
              id="bookStatus"
              {...register("bookStatus")}
              className="w-full px-0 py-2 sm:py-3 bg-transparent border-0 border-b-2 border-slate-300 focus:border-slate-600 focus:ring-0 focus:outline-none transition-colors appearance-none cursor-pointer text-sm sm:text-base touch-manipulation"
            >
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg
                className="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Pricing Section - Only show for paid content */}
        {(watchedPricingType === "PAID_PER_CHAPTER" ||
          watchedPricingType === "WHOLE_BOOK") && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 md:p-6">
            <h3 className="text-sm sm:text-base md:text-lg font-medium text-slate-800 mb-3 sm:mb-4 md:mb-6 flex items-center">
              <span className="text-slate-600 mr-2">💰</span>
              Pricing Settings
            </h3>

            {/* Whole Book Price - Only show for WHOLE_BOOK type */}
            {watchedPricingType === "WHOLE_BOOK" && (
              <div className="mb-3 sm:mb-4 md:mb-6 relative w-full max-w-xs">
                <input
                  type="number"
                  id="bookPrice"
                  min="1"
                  step="1"
                  {...register("bookPrice", {
                    required:
                      watchedPricingType === "WHOLE_BOOK"
                        ? "Book price is required for whole book pricing"
                        : false,
                    min: {
                      value: 1,
                      message: "Book price must be at least 1 coin",
                    },
                    validate: (value) => {
                      if (
                        watchedPricingType === "WHOLE_BOOK" &&
                        (!value || value <= 0)
                      ) {
                        return "Book price is required for whole book pricing";
                      }
                      return true;
                    },
                  })}
                  className="w-full px-0 py-2 sm:py-3 bg-transparent border-0 border-b-2 border-slate-300 focus:border-slate-600 focus:ring-0 focus:outline-none transition-colors placeholder-slate-400 text-sm sm:text-base"
                  placeholder="Book Price (Coins) *"
                />
                {errors.bookPrice && (
                  <p className="mt-2 text-sm text-red-500">
                    {errors.bookPrice.message}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-2">
                  Readers will pay this price once to access all chapters
                </p>
              </div>
            )}

            {/* Paid Per Chapter Information - Only show for PAID_PER_CHAPTER */}
            {watchedPricingType === "PAID_PER_CHAPTER" && (
              <div className="mb-3 sm:mb-4 md:mb-6 p-2 sm:p-3 md:p-4 bg-slate-100 border border-slate-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <span className="text-slate-600 text-lg">📝</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-800 mb-2">
                      Chapter Pricing
                    </h4>
                    <p className="text-sm text-slate-600 mb-2">
                      You'll set the price for each chapter individually when
                      you create or edit chapters.
                    </p>
                    <p className="text-xs text-slate-500">
                      This gives you flexibility to price chapters based on
                      their content and length.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Information */}
            <div className="mt-3 sm:mt-4 p-2 sm:p-3 md:p-4 bg-slate-100 border border-slate-200 rounded-lg">
              <h4 className="text-sm font-medium text-slate-800 mb-2">
                💡 Pricing Information
              </h4>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• You earn 70% of each transaction (platform takes 30%)</li>
                <li>• Readers can send you gifts regardless of pricing type</li>
                {watchedPricingType === "WHOLE_BOOK" && (
                  <li>
                    • Whole book purchases give readers access to all current
                    and future chapters
                  </li>
                )}
                {watchedPricingType === "PAID_PER_CHAPTER" && (
                  <li>
                    • Set individual chapter prices when creating or editing
                    chapters
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Tags */}
        <div>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:space-x-3 sm:items-end space-y-2 sm:space-y-0">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  className="w-full px-0 py-2 sm:py-3 bg-transparent border-0 border-b-2 border-slate-300 focus:border-slate-600 focus:ring-0 focus:outline-none transition-colors placeholder-slate-400 text-sm sm:text-base"
                  placeholder="Add Tags (Optional)"
                  maxLength={30}
                />
              </div>
              <button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || selectedTags.length >= 10}
                className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm w-full sm:w-auto touch-manipulation min-h-[44px] flex items-center justify-center"
              >
                Add
              </button>
            </div>

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2">
                {selectedTags.map((tag, index) => (
                  <div
                    key={`${tag}-${index}`}
                    className="inline-flex items-center"
                  >
                    {editingTagIndex === index ? (
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-slate-100 text-slate-700 border border-slate-300">
                        <span className="mr-1">#</span>
                        <input
                          type="text"
                          value={editingTagValue}
                          onChange={(e) => setEditingTagValue(e.target.value)}
                          onKeyPress={handleEditTagKeyPress}
                          onBlur={handleSaveTagEdit}
                          className="bg-transparent border-none outline-none text-sm w-16 min-w-0"
                          maxLength={30}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleSaveTagEdit}
                          className="ml-1 text-slate-600 hover:text-slate-800 rounded-full p-0.5"
                          title="Save changes"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelTagEdit}
                          className="ml-1 text-slate-500 hover:text-slate-700 rounded-full p-0.5"
                          title="Cancel editing"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-slate-100 text-slate-700 group">
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleEditTag(index)}
                          className="ml-2 text-slate-500 hover:text-slate-700 rounded-full p-0.5 transition-colors duration-200"
                          title={`Edit ${tag} tag`}
                        >
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-colors duration-200"
                          title={`Remove ${tag} tag`}
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-500">
              {selectedTags.length}/10 tags used. Tags help readers discover
              your story.
              <br />
              <span className="text-slate-600">
                Click the edit icon to modify tags, or the × icon to remove
                them.
              </span>
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors w-full sm:w-auto touch-manipulation min-h-[44px] flex items-center justify-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors w-full sm:w-auto touch-manipulation min-h-[44px]"
          >
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>{isEdit ? "Update Story" : "Create Story"}</span>
          </button>
        </div>
      </form>

      <RefundConfirmationModal
        isOpen={showRefundModal}
        onClose={handleRefundCancel}
        onConfirm={handleRefundConfirm}
        refundData={refundData}
        isLoading={isLoading || isCalculatingRefund}
      />
    </div>
  );
}
