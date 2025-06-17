'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in MB
  folder?: 'profile_images' | 'story_covers';
  aspectRatio?: 'square' | 'cover' | 'auto';
  preview?: boolean;
  placeholder?: string;
}

interface UploadResponse {
  success: boolean;
  message: string;
  imageUrl?: string;
  publicId?: string;
  fileSize?: number;
  originalFilename?: string;
  folder?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled = false,
  className,
  acceptedFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  maxFileSize = 10, // 10MB
  folder = 'profile_images',
  aspectRatio = 'auto',
  preview = true,
  placeholder
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!acceptedFileTypes.includes(file.type)) {
      return `Invalid file type. Accepted types: ${acceptedFileTypes.join(', ')}`;
    }

    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size too large. Maximum size: ${maxFileSize}MB`;
    }

    return null;
  }, [acceptedFileTypes, maxFileSize]);

  const uploadFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Determine endpoint based on folder
      const endpoint = folder === 'profile_images' 
        ? '/api/upload/profile-image'
        : '/api/upload/story-cover';

      // Add story ID for story covers if available
      if (folder === 'story_covers') {
        // This should be passed as a prop when uploading story covers
        // For now, we'll handle it in the parent component
      }

      // Simulate progress for user feedback
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include cookies for authentication
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result: UploadResponse = await response.json();

      if (result.success && result.imageUrl) {
        toast.success('Image uploaded successfully!');
        onChange?.(result.imageUrl);
      } else {
        throw new Error(result.message || 'Upload failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [folder, onChange, validateFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  }, [disabled, uploadFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
    // Reset input value so same file can be selected again
    e.target.value = '';
  }, [uploadFile]);

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      onRemove?.();
    }
  }, [disabled, onRemove]);

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case 'cover':
        return 'aspect-[3/4]';
      default:
        return '';
    }
  };

  const getPlaceholderText = () => {
    if (placeholder) return placeholder;
    
    switch (folder) {
      case 'profile_images':
        return 'Upload profile image';
      case 'story_covers':
        return 'Upload story cover';
      default:
        return 'Upload image';
    }
  };

  return (
    <div className={cn('relative', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer',
          getAspectRatioClass(),
          {
            'border-blue-300 bg-blue-50': isDragging && !disabled,
            'border-gray-300 hover:border-gray-400': !isDragging && !disabled,
            'border-gray-200 cursor-not-allowed opacity-50': disabled,
            'min-h-[200px]': aspectRatio === 'auto',
            'w-full': true,
          }
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {/* Loading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-10 rounded-lg">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="text-sm text-gray-600 mb-2">Uploading...</p>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
          </div>
        )}

        {/* Image Preview */}
        {value && preview && !isUploading ? (
          <div className="relative w-full h-full">
            <img
              src={value}
              alt="Upload preview"
              className="w-full h-full object-cover rounded-lg"
            />
            {/* Remove Button */}
            {onRemove && !disabled && (
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                type="button"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ) : (
          /* Upload Placeholder */
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center mb-4',
              isDragging ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
            )}>
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>
            
            <p className="text-sm font-medium text-gray-900 mb-1">
              {isDragging ? 'Drop image here' : getPlaceholderText()}
            </p>
            
            <p className="text-xs text-gray-500 mb-2">
              {isDragging ? '' : 'Drag and drop or click to select'}
            </p>
            
            <p className="text-xs text-gray-400">
              {acceptedFileTypes.map(type => type.split('/')[1]).join(', ').toUpperCase()} • Max {maxFileSize}MB
            </p>
          </div>
        )}
      </div>

      {/* File Info */}
      {value && !preview && (
        <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <ImageIcon size={16} className="mr-1" />
            <span>Image uploaded</span>
          </div>
          {onRemove && !disabled && (
            <button
              onClick={handleRemove}
              className="text-red-500 hover:text-red-700 transition-colors"
              type="button"
            >
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
} 