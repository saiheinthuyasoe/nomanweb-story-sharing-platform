import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { CreateStoryRequest, UpdateStoryRequest, Story } from "@/types/story";
import { useCategories } from "@/hooks/useStories";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { StoryCoverUpload } from "@/components/upload/StoryCoverUpload";
import { RefundConfirmationModal } from "@/components/modals/RefundConfirmationModal";


interface StoryFormProps {
  story?: Story;
  onSubmit: (data: CreateStoryRequest | UpdateStoryRequest) => void;
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
  const [refundData, setRefundData] = useState<any>({ hasPurchases: false, totalRefundAmount: 0, affectedPurchasers: 0 });
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

  const watchedCoverImage = watch("coverImageUrl");
  const watchedPricingType = watch("pricingType");

  // Debug logging for cover image
  useEffect(() => {
    console.log(
      "🖼️ StoryForm: watchedCoverImage changed to:",
      watchedCoverImage
    );
  }, [watchedCoverImage]);

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

  const handleCoverImageChange = (url: string) => {
    console.log("🖼️ StoryForm: handleCoverImageChange called with URL:", url);
    setValue("coverImageUrl", url);
  };

  const handleCoverImageRemove = () => {
    setValue("coverImageUrl", "");
  };

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

  const onFormSubmit = async (data: CreateStoryRequest | UpdateStoryRequest) => {
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
    const isPaidToFree = isEdit && 
      story && 
      (story.pricingType === "PAID_PER_CHAPTER" || story.pricingType === "WHOLE_BOOK") && 
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
    onSubmit(submissionData);
  };

  const handleRefundConfirm = () => {
    if (pendingFormData) {
      onSubmit(pendingFormData);
      setShowRefundModal(false);
      setPendingFormData(null);
      setRefundData({ hasPurchases: false, totalRefundAmount: 0, affectedPurchasers: 0 });
    }
  };

  const handleRefundCancel = () => {
    setShowRefundModal(false);
    setPendingFormData(null);
    setRefundData({ hasPurchases: false, totalRefundAmount: 0, affectedPurchasers: 0 });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEdit ? "Edit Story" : "Create New Story"}
        </h2>
        <p className="text-gray-600 mt-1">
          {isEdit
            ? "Update your story details"
            : "Share your story with the world"}
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Title *
          </label>
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your story title..."
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            {...register("description", {
              maxLength: {
                value: 1000,
                message: "Description must not exceed 1000 characters",
              },
            })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe your story..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Category, Content Type, and Content Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Category */}
          <div>
            <label
              htmlFor="categoryId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Category
            </label>
            <select
              id="categoryId"
              {...register("categoryId")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pricing Type */}
          <div>
            <label
              htmlFor="pricingType"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Pricing Type
            </label>
            <select
              id="pricingType"
              {...register("pricingType")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            {/* One-Time Purchase Protection Message for Paid-to-Paid Changes */}
            {isEdit &&
              story &&
              story.pricingType !== watchedPricingType &&
              (story.pricingType === "PAID_PER_CHAPTER" ||
                story.pricingType === "WHOLE_BOOK") &&
              (watchedPricingType === "PAID_PER_CHAPTER" ||
                watchedPricingType === "WHOLE_BOOK") && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0">
                      <span className="text-blue-500 text-sm">🛡️</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">
                        One-Time Purchase Protection
                      </h4>
                      <p className="text-xs text-blue-700 mt-1">
                        Readers who already purchased will maintain access
                        regardless of pricing model changes. No restrictions for
                        switching between paid pricing models.
                      </p>
                    </div>
                  </div>
                </div>
              )}
          </div>

          {/* Book Status */}
          <div>
            <label
              htmlFor="bookStatus"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Book Status
            </label>
            <select
              id="bookStatus"
              {...register("bookStatus")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        {/* Pricing Section - Only show for paid content */}
        {(watchedPricingType === "PAID_PER_CHAPTER" ||
          watchedPricingType === "WHOLE_BOOK") && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <span className="text-yellow-500 mr-2">💰</span>
              Pricing Settings
            </h3>

            {/* Whole Book Price - Only show for WHOLE_BOOK type */}
            {watchedPricingType === "WHOLE_BOOK" && (
              <div className="mb-6">
                <label
                  htmlFor="bookPrice"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Book Price (Coins) *
                </label>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent max-w-xs"
                  placeholder="Enter book price in coins"
                />
                {errors.bookPrice && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.bookPrice.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Readers will pay this price once to access all chapters
                </p>
              </div>
            )}

            {/* Paid Per Chapter Information - Only show for PAID_PER_CHAPTER */}
            {watchedPricingType === "PAID_PER_CHAPTER" && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <span className="text-blue-500 text-lg">📝</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                      Chapter Pricing
                    </h4>
                    <p className="text-sm text-blue-700 mb-2">
                      You'll set the price for each chapter individually when
                      you create or edit chapters.
                    </p>
                    <p className="text-xs text-blue-600">
                      This gives you flexibility to price chapters based on
                      their content and length.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Information */}
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="text-sm font-medium text-green-900 mb-2">
                💡 Pricing Information
              </h4>
              <ul className="text-xs text-green-700 space-y-1">
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

        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Story Cover Image
          </label>
          <div className="flex justify-center">
            <StoryCoverUpload
              storyId={story?.id || "new"}
              value={watchedCoverImage}
              onChange={handleCoverImageChange}
              onRemove={handleCoverImageRemove}
              disabled={isLoading}
              placeholder="Upload your story cover"
            />
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Upload a cover image from your device or enter an image URL.
            Recommended size: 800×1200px (3:4 ratio)
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags (Optional)
          </label>
          <div className="space-y-3">
            <div className="flex space-x-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagInputKeyPress}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter a tag and press Enter"
                maxLength={30}
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || selectedTags.length >= 10}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag, index) => (
                  <div
                    key={`${tag}-${index}`}
                    className="inline-flex items-center"
                  >
                    {editingTagIndex === index ? (
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800 border border-yellow-300">
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
                          className="ml-1 text-green-600 hover:text-green-800 rounded-full p-0.5"
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
                          className="ml-1 text-red-600 hover:text-red-800 rounded-full p-0.5"
                          title="Cancel editing"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 group">
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleEditTag(index)}
                          className="ml-2 text-blue-600 hover:text-blue-800 rounded-full p-0.5 transition-colors duration-200"
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
                          className="ml-1 text-blue-600 hover:text-red-600 hover:bg-red-100 rounded-full p-0.5 transition-colors duration-200"
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

            <p className="text-xs text-gray-500">
              {selectedTags.length}/10 tags used. Tags help readers discover
              your story.
              <br />
              <span className="text-blue-600">
                Click the edit icon to modify tags, or the × icon to remove
                them.
              </span>
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
