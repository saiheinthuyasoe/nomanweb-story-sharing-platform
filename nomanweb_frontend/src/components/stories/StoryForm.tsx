import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { CreateStoryRequest, UpdateStoryRequest, Story } from '@/types/story';
import { useCategories } from '@/hooks/useStories';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { StoryCoverUpload } from '@/components/upload/StoryCoverUpload';

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
      contentType: story?.contentType || 'FREE',
      coverImageUrl: story?.coverImageUrl || '',
      tags: story?.tags || [],
    }
  });

  const watchedCoverImage = watch('coverImageUrl');

  useEffect(() => {
    setValue('tags', selectedTags);
  }, [selectedTags, setValue]);

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !selectedTags.includes(tag) && selectedTags.length < 10) {
      setSelectedTags([...selectedTags, tag]);
      setTagInput('');
    } else if (selectedTags.length >= 10) {
      toast.error('Maximum 10 tags allowed');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleCoverImageChange = (url: string) => {
    setValue('coverImageUrl', url);
  };

  const handleCoverImageRemove = () => {
    setValue('coverImageUrl', '');
  };

  const onFormSubmit = (data: CreateStoryRequest | UpdateStoryRequest) => {
    onSubmit({ ...data, tags: selectedTags });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Story' : 'Create New Story'}
        </h2>
        <p className="text-gray-600 mt-1">
          {isEdit ? 'Update your story details' : 'Share your story with the world'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            {...register('title', { 
              required: 'Title is required',
              maxLength: { value: 255, message: 'Title must not exceed 255 characters' }
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
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            {...register('description', {
              maxLength: { value: 1000, message: 'Description must not exceed 1000 characters' }
            })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe your story..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Category and Content Type Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category */}
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="categoryId"
              {...register('categoryId')}
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

          {/* Content Type */}
          <div>
            <label htmlFor="contentType" className="block text-sm font-medium text-gray-700 mb-2">
              Content Type
            </label>
            <select
              id="contentType"
              {...register('contentType')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="FREE">Free</option>
              <option value="PAID">Paid</option>
              <option value="MIXED">Mixed (Free & Paid)</option>
            </select>
          </div>
        </div>

        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Story Cover Image
          </label>
          <div className="flex justify-center">
            <StoryCoverUpload
              storyId={story?.id || 'new'}
              value={watchedCoverImage}
              onChange={handleCoverImageChange}
              onRemove={handleCoverImageRemove}
              disabled={isLoading}
              placeholder="Upload your story cover"
            />
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Upload a cover image from your device or enter an image URL. Recommended size: 800×1200px (3:4 ratio)
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
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            <p className="text-xs text-gray-500">
              {selectedTags.length}/10 tags used. Tags help readers discover your story.
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
            <span>{isEdit ? 'Update Story' : 'Create Story'}</span>
          </button>
        </div>
      </form>
    </div>
  );
} 