import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { CreateStoryRequest, UpdateStoryRequest, Story } from '@/types/story';
import { useCategories } from '@/hooks/useStories';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { StoryCoverUpload } from '@/components/upload/StoryCoverUpload';
import { Select } from '@/components/ui/Select';
import { BookOpen, Sparkles, Tag, DollarSign, Info } from 'lucide-react';

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
  isEdit = false 
}: StoryFormProps) {
  const { data: categories } = useCategories();
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(story?.tags || []);
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [editingTagValue, setEditingTagValue] = useState('');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch
  } = useForm<CreateStoryRequest | UpdateStoryRequest>({
    defaultValues: {
      title: story?.title || '',
      description: story?.description || '',
      categoryId: story?.category?.id || '',
      pricingType: story?.pricingType || 'FREE',
      bookStatus: story?.bookStatus || 'ONGOING',
      coverImageUrl: story?.coverImageUrl || '',
      tags: story?.tags || [],
      bookPrice: story?.bookPrice || undefined,
      defaultChapterPrice: story?.defaultChapterPrice || undefined,
    }
  });

  const watchedCoverImage = watch('coverImageUrl');
  const watchedPricingType = watch('pricingType');
  
  // Debug logging for cover image
  useEffect(() => {
    console.log('🖼️ StoryForm: watchedCoverImage changed to:', watchedCoverImage);
  }, [watchedCoverImage]);

  useEffect(() => {
    setValue('tags', selectedTags);
  }, [selectedTags, setValue]);

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !selectedTags.includes(tag) && selectedTags.length < 10) {
      const newTags = [...selectedTags, tag];
      setSelectedTags(newTags);
      setTagInput('');
    } else if (selectedTags.length >= 10) {
      toast.error('Maximum 10 tags allowed');
    } else if (selectedTags.includes(tag)) {
      toast.error('Tag already exists');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
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
        setEditingTagValue('');
      } else if (selectedTags.includes(newTag)) {
        toast.error('Tag already exists');
      }
    }
  };

  const handleCancelTagEdit = () => {
    setEditingTagIndex(null);
    setEditingTagValue('');
  };

  const handleEditTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTagEdit();
    } else if (e.key === 'Escape') {
      handleCancelTagEdit();
    }
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleCoverImageChange = (url: string) => {
    console.log('🖼️ StoryForm: handleCoverImageChange called with URL:', url);
    setValue('coverImageUrl', url);
  };

  const handleCoverImageRemove = () => {
    setValue('coverImageUrl', '');
  };

  const onFormSubmit = (data: CreateStoryRequest | UpdateStoryRequest) => {
    const submissionData = { ...data, tags: selectedTags };
    
    // Only include pricing fields when relevant to pricing type
    if (data.pricingType === 'FREE') {
      // Remove pricing fields for free content
      delete submissionData.bookPrice;
      delete submissionData.defaultChapterPrice;
    } else if (data.pricingType === 'WHOLE_BOOK') {
      // Only include bookPrice for whole book pricing
      delete submissionData.defaultChapterPrice;
    } else if (data.pricingType === 'PAID_PER_CHAPTER') {
      // Only include defaultChapterPrice for per-chapter pricing
      delete submissionData.bookPrice;
    }
    
    onSubmit(submissionData);
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-[#18243c] via-[#18243c]/80 to-[#18243c]/60 px-8 py-6 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="text-3xl font-bold">
            {isEdit ? 'Edit Story' : 'Create New Story'}
          </h2>
        </div>
        <p className="text-blue-100 text-lg">
          {isEdit ? 'Update your story details and cover' : 'Share your story with the world'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="p-8 space-y-8">
        {/* Cover Image Section - Enhanced */}
        <div className="bg-gradient-to-br from-gray-50 to-[#18243c]/5 rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-[#18243c] to-[#18243c]/80 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Story Cover Image</h3>
          </div>
          
          <div className="flex justify-center mb-4">
            <StoryCoverUpload
              storyId={story?.id || 'new'}
              value={watchedCoverImage}
              onChange={handleCoverImageChange}
              onRemove={handleCoverImageRemove}
              disabled={isLoading}
              placeholder="Upload your story cover"
            />
          </div>
          
         
        </div>

        {/* Basic Information Section */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-[#18243c] to-[#18243c]/80 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Basic Information</h3>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-3">
              Title *
            </label>
            <input
              type="text"
              id="title"
              {...register('title', { 
                required: 'Title is required',
                maxLength: { value: 255, message: 'Title must not exceed 255 characters' }
              })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#18243c] focus:border-[#18243c] transition-all duration-200 text-lg"
              placeholder="Enter your story title..."
            />
            {errors.title && (
              <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                <XMarkIcon className="w-4 h-4" />
                <span>{errors.title.message}</span>
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-3">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              {...register('description', {
                maxLength: { value: 1000, message: 'Description must not exceed 1000 characters' }
              })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#18243c] focus:border-[#18243c] transition-all duration-200 resize-none"
              placeholder="Describe your story..."
            />
            {errors.description && (
              <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                <XMarkIcon className="w-4 h-4" />
                <span>{errors.description.message}</span>
              </p>
            )}
          </div>

          {/* Category, Content Type, and Content Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Category */}
            <div>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Category"
                    value={field.value}
                    onChange={field.onChange}
                    options={[
                      { value: '', label: 'Select a category' },
                      ...(categories?.map((category) => ({ value: category.id, label: category.name })) || [])
                    ]}
                    disabled={isLoading}
                    error={errors.categoryId?.message as string}
                  />
                )}
              />
            </div>

            {/* Pricing Type */}
            <div>
              <Controller
                name="pricingType"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Pricing Type"
                    value={field.value}
                    onChange={field.onChange}
                    options={[
                      { value: 'FREE', label: 'Free' },
                      { value: 'PAID_PER_CHAPTER', label: 'Paid per Chapter' },
                      { value: 'WHOLE_BOOK', label: 'Whole Book' },
                    ]}
                    disabled={isLoading}
                    error={errors.pricingType?.message as string}
                  />
                )}
              />
            </div>

            {/* Book Status */}
            <div>
              <Controller
                name="bookStatus"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Book Status"
                    value={field.value}
                    onChange={field.onChange}
                    options={[
                      { value: 'ONGOING', label: 'Ongoing' },
                      { value: 'COMPLETED', label: 'Completed' },
                    ]}
                    disabled={isLoading}
                    error={errors.bookStatus?.message as string}
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* Pricing Section - Enhanced */}
        {(watchedPricingType === 'PAID_PER_CHAPTER' || watchedPricingType === 'WHOLE_BOOK') && (
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Pricing Settings</h3>
            </div>
            
            {/* Whole Book Price - Only show for WHOLE_BOOK type */}
            {watchedPricingType === 'WHOLE_BOOK' && (
              <div className="mb-6">
                <label htmlFor="bookPrice" className="block text-sm font-semibold text-gray-700 mb-3">
                  Book Price (Coins) *
                </label>
                <div className="relative max-w-xs">
                  <input
                    type="number"
                    id="bookPrice"
                    min="1"
                    step="1"
                    {...register('bookPrice', {
                      required: watchedPricingType === 'WHOLE_BOOK' ? 'Book price is required for whole book pricing' : false,
                      min: { value: 1, message: 'Book price must be at least 1 coin' },
                      validate: value => {
                        if (watchedPricingType === 'WHOLE_BOOK' && (!value || value <= 0)) {
                          return 'Book price is required for whole book pricing';
                        }
                        return true;
                      }
                    })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#18243c] focus:border-[#18243c] transition-all duration-200 text-lg"
                    placeholder="Enter book price in coins"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                {errors.bookPrice && (
                  <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                    <XMarkIcon className="w-4 h-4" />
                    <span>{errors.bookPrice.message}</span>
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-2">
                  Readers will pay this price once to access all chapters
                </p>
              </div>
            )}

            {/* Paid Per Chapter Information - Only show for PAID_PER_CHAPTER */}
            {watchedPricingType === 'PAID_PER_CHAPTER' && (
              <div className="mb-6 p-4 bg-gradient-to-r from-[#18243c]/10 to-[#18243c]/20 border border-[#18243c]/20 rounded-xl">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-[#18243c] rounded-lg flex items-center justify-center">
                      <Info className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#18243c] mb-2">Chapter Pricing</h4>
                    <p className="text-sm text-[#18243c] mb-2">
                      You'll set the price for each chapter individually when you create or edit chapters.
                    </p>
                    <p className="text-xs text-[#18243c]/70">
                      This gives you flexibility to price chapters based on their content and length.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Information */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <div className="flex items-center space-x-2 mb-3">
                <Info className="w-4 h-4 text-green-600" />
                <h4 className="text-sm font-semibold text-green-900">Pricing Information</h4>
              </div>
              <ul className="text-sm text-green-700 space-y-2">
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>You earn 70% of each transaction (platform takes 30%)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Readers can send you gifts regardless of pricing type</span>
                </li>
                {watchedPricingType === 'WHOLE_BOOK' && (
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Whole book purchases give readers access to all current and future chapters</span>
                  </li>
                )}
                {watchedPricingType === 'PAID_PER_CHAPTER' && (
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Set individual chapter prices when creating or editing chapters</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Tags Section - Enhanced */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-[#18243c] to-[#18243c]/80 rounded-lg flex items-center justify-center">
              <Tag className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Tags (Optional)</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex space-x-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagInputKeyPress}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#18243c] focus:border-[#18243c] transition-all duration-200"
                placeholder="Enter a tag and press Enter"
                maxLength={30}
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || selectedTags.length >= 10}
                className="px-6 py-3 bg-gradient-to-r from-[#18243c] to-[#18243c]/80 text-white rounded-xl hover:from-[#22325a] hover:to-[#18243c] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg"
              >
                Add Tag
              </button>
            </div>
            
            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {selectedTags.map((tag, index) => (
                  <div
                    key={`${tag}-${index}`}
                    className="inline-flex items-center"
                  >
                    {editingTagIndex === index ? (
                      <div className="inline-flex items-center px-3 py-2 rounded-full text-sm bg-yellow-100 text-yellow-800 border-2 border-yellow-300">
                        <span className="mr-1 font-medium">#</span>
                        <input
                          type="text"
                          value={editingTagValue}
                          onChange={(e) => setEditingTagValue(e.target.value)}
                          onKeyPress={handleEditTagKeyPress}
                          onBlur={handleSaveTagEdit}
                          className="bg-transparent border-none outline-none text-sm w-16 min-w-0 font-medium"
                          maxLength={30}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleSaveTagEdit}
                          className="ml-2 text-green-600 hover:text-green-800 rounded-full p-1 hover:bg-green-100 transition-all duration-200"
                          title="Save changes"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelTagEdit}
                          className="ml-1 text-red-600 hover:text-red-800 rounded-full p-1 hover:bg-red-100 transition-all duration-200"
                          title="Cancel editing"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                                              <span className="inline-flex items-center px-3 py-2 rounded-full text-sm bg-gradient-to-r from-[#18243c]/10 to-[#18243c]/20 text-[#18243c] border border-[#18243c]/20 group hover:from-[#18243c]/20 hover:to-[#18243c]/30 transition-all duration-200">
                        <span className="font-medium">#{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleEditTag(index)}
                          className="ml-2 text-[#18243c] hover:text-[#18243c]/80 rounded-full p-1 hover:bg-[#18243c]/10 transition-all duration-200"
                          title={`Edit ${tag} tag`}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 text-[#18243c] hover:text-red-600 hover:bg-red-100 rounded-full p-1 transition-all duration-200"
                          title={`Remove ${tag} tag`}
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="p-3 bg-gradient-to-r from-[#18243c]/10 to-[#18243c]/20 rounded-xl border border-[#18243c]/20">
              <p className="text-sm text-[#18243c]">
                <span className="font-semibold">{selectedTags.length}/10 tags used.</span> Tags help readers discover your story.
                <br />
                <span className="text-[#18243c] text-xs">
                  💡 Click the edit icon to modify tags, or the × icon to remove them.
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions - Enhanced */}
        <div className="flex justify-end space-x-4 pt-8 border-t-2 border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 transition-all duration-200 font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 bg-gradient-to-r from-[#18243c] to-[#18243c]/80 text-white rounded-xl hover:from-[#22325a] hover:to-[#18243c] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            {isLoading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            )}
            <span>{isEdit ? 'Update Story' : 'Create Story'}</span>
          </button>
        </div>
      </form>
    </div>
  );
} 