'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Loader2, Link, Image as ImageIcon, Camera, Plus, Edit3, Trash2, Sparkles, BookOpen, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';
import { ImageCropModal } from './ImageCropModal';
import { useQueryClient } from '@tanstack/react-query';

interface StoryCoverUploadProps {
  storyId: string;
  value?: string;
  onChange?: (url: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in MB
  placeholder?: string;
}

type UploadMode = 'choose' | 'file' | 'url';

export function StoryCoverUpload({
  storyId,
  value,
  onChange,
  onRemove,
  disabled = false,
  className,
  acceptedFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  maxFileSize = 10, // 10MB
  placeholder = 'Upload story cover'
}: StoryCoverUploadProps) {
  const queryClient = useQueryClient();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mode, setMode] = useState<UploadMode>('choose');
  const [urlInput, setUrlInput] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedFileTypes.includes(file.type)) {
      return `Invalid file type. Accepted types: ${acceptedFileTypes.join(', ')}`;
    }

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
      
      let endpoint: string;
      
      // Use story-cover endpoint for existing stories, generic endpoint for new stories
      if (storyId && storyId !== 'new') {
        endpoint = '/upload/story-cover';
        formData.append('storyId', storyId);
      } else {
        endpoint = '/upload/image';
        formData.append('folder', 'story_covers');
      }

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await apiClient.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = response.data;

      if (result.success && result.imageUrl) {
        console.log('✅ Upload successful, imageUrl:', result.imageUrl);
        toast.success('Story cover uploaded successfully!');
        onChange?.(result.imageUrl);
        
        // If this is an existing story, invalidate the story query to refresh the data
        if (storyId && storyId !== 'new') {
          console.log('🔄 Invalidating story query for:', storyId);
          queryClient.invalidateQueries({ queryKey: ['story', storyId] });
        }
        
        setShowModal(false);
        setMode('choose');
      } else {
        console.error('❌ Upload failed, result:', result);
        throw new Error(result.message || 'Upload failed');
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Upload failed';
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [storyId, onChange, validateFile, queryClient]);

  const handleFileForCrop = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    // Create URL for the selected file to show in crop modal
    const imageUrl = URL.createObjectURL(file);
    setSelectedImageForCrop(imageUrl);
    setShowCropModal(true);
    setShowModal(false);
  }, [validateFile]);

  const handleCroppedImage = useCallback(async (croppedFile: File) => {
    setShowCropModal(false);
    // Clean up the object URL
    if (selectedImageForCrop) {
      URL.revokeObjectURL(selectedImageForCrop);
      setSelectedImageForCrop('');
    }
    // Upload the cropped file
    await uploadFile(croppedFile);
  }, [selectedImageForCrop, uploadFile]);

  const handleCropModalClose = useCallback(() => {
    setShowCropModal(false);
    // Clean up the object URL
    if (selectedImageForCrop) {
      URL.revokeObjectURL(selectedImageForCrop);
      setSelectedImageForCrop('');
    }
  }, [selectedImageForCrop]);

  const handleUrlSubmit = useCallback(() => {
    if (!urlInput.trim()) {
      toast.error('Please enter a valid image URL');
      return;
    }

    try {
      const url = new URL(urlInput.trim());
      if (!url.protocol.startsWith('http')) {
        throw new Error('Invalid URL protocol');
      }
      
      onChange?.(urlInput.trim());
      setUrlInput('');
      setShowModal(false);
      setMode('choose');
      toast.success('Cover image URL added successfully!');
    } catch (error) {
      toast.error('Please enter a valid URL');
    }
  }, [urlInput, onChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && mode === 'file') {
      setIsDragging(true);
    }
  }, [disabled, mode]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || mode !== 'file') return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileForCrop(files[0]);
    }
  }, [disabled, mode, handleFileForCrop]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileForCrop(files[0]);
    }
    // Reset input value so same file can be selected again
    e.target.value = '';
  }, [handleFileForCrop]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      onRemove?.();
      setMode('choose');
    }
  }, [disabled, onRemove]);

  const openModal = () => {
    setShowModal(true);
    setMode('choose');
  };

  const closeModal = () => {
    setShowModal(false);
    setMode('choose');
    setUrlInput('');
  };

  // Main cover display component
  const CoverDisplay = () => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
      if (value) {
        setImageLoaded(false);
        setImageError(false);
      }
    }, [value]);

    const handleImageLoad = () => {
      console.log('✅ Image loaded successfully');
      setImageLoaded(true);
      setImageError(false);
    };

    const handleImageError = () => {
      console.log('❌ Image failed to load');
      setImageLoaded(false);
      setImageError(true);
    };

    if (value) {
      return (
        <div className="text-center">
          {/* Enhanced image container with better styling */}
          <div className="inline-block relative group">
            {/* Loading state */}
            {!imageLoaded && !imageError && (
              <div className="w-56 h-80 border-2 border-gray-200 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shadow-lg">
                <div className="text-center">
                  <div className="relative">
                    <Loader2 className="w-8 h-8 animate-spin text-[#18243c] mx-auto mb-3" />
                    <div className="absolute inset-0 w-8 h-8 animate-ping rounded-full bg-[#18243c]/20"></div>
                  </div>
                  <p className="text-sm font-medium text-[#18243c]/70">Loading cover...</p>
                </div>
              </div>
            )}

            {/* Error state */}
            {imageError && (
              <div 
                className="w-56 h-80 border-2 border-red-200 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center cursor-pointer hover:from-red-100 hover:to-red-200 transition-all duration-300 shadow-lg"
                onClick={openModal}
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <X className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-sm font-medium text-red-700">Failed to load</p>
                  <p className="text-xs text-red-600 mt-1">Click to retry</p>
                </div>
              </div>
            )}

            {/* Enhanced image display */}
            <div className="relative">
              <img 
                src={value} 
                alt="Story cover"
                className={`w-56 h-80 object-cover rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
              
              {/* Hover overlay with actions - only show when image is loaded */}
              {imageLoaded && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-2xl transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    <button
                      onClick={openModal}
                      className="p-2 bg-white/90 backdrop-blur-sm text-gray-800 rounded-lg hover:bg-white transition-all duration-200 shadow-lg"
                      title="Change cover"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {onRemove && !disabled && (
                      <button
                        onClick={handleRemove}
                        className="p-2 bg-red-500/90 backdrop-blur-sm text-white rounded-lg hover:bg-red-600 transition-all duration-200 shadow-lg"
                        title="Remove cover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Enhanced controls below the image */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <BookOpen className="w-4 h-4 text-[#18243c]" />
              <p className="text-sm font-semibold text-[#18243c]">Story Cover</p>
            </div>
            
            <div className="flex justify-center space-x-3">
              <button
                onClick={openModal}
                className="px-4 py-2 bg-gradient-to-r from-[#18243c] to-[#18243c]/80 text-white text-sm font-medium rounded-lg hover:from-[#22325a] hover:to-[#18243c] transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Change Cover
              </button>
              {onRemove && !disabled && (
                <button
                  onClick={handleRemove}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white text-sm font-medium rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Remove
                </button>
              )}
            </div>
            
            <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
              <Sparkles className="w-3 h-3" />
              <span>{imageError ? 'Click to retry' : 'Cover uploaded successfully'}</span>
            </div>
          </div>
        </div>
      );
    }

    // Enhanced empty state
    return (
      <div className="text-center">
        <div 
          onClick={openModal} 
          className="w-56 h-80 border-2 border-dashed border-[#18243c]/30 rounded-2xl bg-gradient-to-br from-[#18243c]/5 via-[#18243c]/10 to-[#18243c]/15 hover:border-[#18243c] hover:from-[#18243c]/15 hover:via-[#18243c]/20 hover:to-[#18243c]/25 transition-all duration-300 mx-auto cursor-pointer flex items-center justify-center group shadow-lg hover:shadow-xl"
        >
          <div className="text-center">
            <div className="relative mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#18243c] to-[#18243c]/80 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-all duration-300 shadow-lg">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#18243c]/70 rounded-full flex items-center justify-center">
                <Palette className="w-3 h-3 text-white" />
              </div>
            </div>
            <p className="text-lg font-semibold text-[#18243c] mb-2">Add Cover Image</p>
            <p className="text-sm text-[#18243c]/70 mb-3">Make your story stand out</p>
            <div className="flex items-center justify-center space-x-1 text-xs text-[#18243c]/60">
              <Camera className="w-3 h-3" />
              <span>Click to upload</span>
            </div>
          </div>
        </div>
        
        {/* Upload guidelines */}
        <div className="mt-4 p-3 bg-gradient-to-r from-[#18243c]/10 to-[#18243c]/20 rounded-xl border border-[#18243c]/30">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#18243c]" />
            <p className="text-sm font-medium text-[#18243c]">Cover Guidelines</p>
          </div>
          <div className="text-xs text-[#18243c] space-y-1">
            <p>• Recommended: 600×900px (2:3 ratio)</p>
            <p>• Formats: JPG, PNG, GIF, WebP</p>
            <p>• Max size: {maxFileSize}MB</p>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced modal content components
  const ModeSelector = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="relative mb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-[#18243c] via-[#18243c]/80 to-[#18243c]/60 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <ImageIcon className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#18243c]/70 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-[#18243c] mb-2">Add Story Cover</h3>
        <p className="text-[#18243c]/70">Choose how you'd like to add your cover image</p>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => setMode('file')}
          className="group p-6 border-2 border-gray-200 rounded-2xl hover:border-[#18243c] hover:bg-gradient-to-r hover:from-[#18243c]/5 hover:to-[#18243c]/10 transition-all duration-300 text-left shadow-sm hover:shadow-md"
        >
          <div className="flex items-center">
            <div className="w-14 h-14 bg-gradient-to-br from-[#18243c]/20 to-[#18243c]/30 group-hover:from-[#18243c]/30 group-hover:to-[#18243c]/40 rounded-2xl flex items-center justify-center mr-4 transition-all duration-300 shadow-sm">
              <Camera className="w-7 h-7 text-[#18243c]" />
            </div>
            <div>
              <h4 className="font-bold text-[#18243c] mb-1 text-lg">Upload from Device</h4>
              <p className="text-sm text-[#18243c]/70">
                Choose a file from your computer or drag and drop
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setMode('url')}
          className="group p-6 border-2 border-gray-200 rounded-2xl hover:border-[#18243c] hover:bg-gradient-to-r hover:from-[#18243c]/5 hover:to-[#18243c]/10 transition-all duration-300 text-left shadow-sm hover:shadow-md"
        >
          <div className="flex items-center">
            <div className="w-14 h-14 bg-gradient-to-br from-[#18243c]/20 to-[#18243c]/30 group-hover:from-[#18243c]/30 group-hover:to-[#18243c]/40 rounded-2xl flex items-center justify-center mr-4 transition-all duration-300 shadow-sm">
              <Link className="w-7 h-7 text-[#18243c]" />
            </div>
            <div>
              <h4 className="font-bold text-[#18243c] mb-1 text-lg">Add from URL</h4>
              <p className="text-sm text-[#18243c]/70">
                Enter a direct link to an image on the web
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  const FileUploadMode = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#18243c] to-[#18243c]/80 rounded-xl flex items-center justify-center">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-[#18243c]">Upload Cover Image</h3>
        </div>
        <button
          onClick={() => setMode('choose')}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

              <div
          className={cn(
            'relative border-2 border-dashed rounded-2xl transition-all duration-300 aspect-[3/2] w-full overflow-hidden',
            {
              'border-[#18243c] bg-gradient-to-br from-[#18243c]/5 to-[#18243c]/10': isDragging && !disabled,
              'border-[#18243c]/30 hover:border-[#18243c]/50 bg-gradient-to-br from-[#18243c]/5 to-[#18243c]/10': !isDragging && !disabled,
              'border-gray-200 cursor-not-allowed opacity-50': disabled,
            }
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
        {isUploading ? (
          <div className="absolute inset-0 bg-white bg-opacity-95 flex flex-col items-center justify-center rounded-2xl">
            <div className="relative mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#18243c] to-[#18243c]/80 rounded-2xl flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#18243c]/70 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <h4 className="text-lg font-semibold text-[#18243c] mb-3">Uploading Cover...</h4>
            <div className="w-64 bg-gray-200 rounded-full h-3 mb-3">
              <div 
                className="bg-gradient-to-r from-[#18243c] to-[#18243c]/80 h-3 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-[#18243c]/70 font-medium">{uploadProgress}% complete</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center cursor-pointer">
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 shadow-lg',
              isDragging 
                ? 'bg-gradient-to-br from-[#18243c] to-[#18243c]/80 text-white' 
                : 'bg-gradient-to-br from-[#18243c]/20 to-[#18243c]/30 text-[#18243c]'
            )}>
              <Upload className="w-8 h-8" />
            </div>
            
            <h4 className="text-xl font-bold text-[#18243c] mb-3">
              {isDragging ? 'Drop your image here' : 'Upload Story Cover'}
            </h4>
            
            <p className="text-[#18243c]/70 mb-6 text-lg">
              {isDragging ? 'Release to upload' : 'Drag and drop your image, or click to browse'}
            </p>
            
            <div className="space-y-2 text-sm text-gray-500 bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="font-medium">Supports: {acceptedFileTypes.map(type => type.split('/')[1]).join(', ').toUpperCase()}</p>
              <p>Max size: {maxFileSize}MB • Recommended: 600×900px (2:3 ratio)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const UrlInputMode = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#18243c] to-[#18243c]/80 rounded-xl flex items-center justify-center">
            <Link className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-[#18243c]">Add Image from URL</h3>
        </div>
        <button
          onClick={() => setMode('choose')}
          className="p-2 text-[#18243c]/60 hover:text-[#18243c] hover:bg-[#18243c]/10 rounded-lg transition-all duration-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[#18243c] mb-3">
            Image URL
          </label>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-4 py-3 border-2 border-[#18243c]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#18243c] focus:border-[#18243c] transition-all duration-200 text-lg"
          />
          <p className="text-xs text-[#18243c]/60 mt-2 flex items-center space-x-1">
            <Link className="w-3 h-3" />
            <span>Enter a direct link to an image file</span>
          </p>
        </div>

        {urlInput.trim() && (
          <div className="p-4 bg-gradient-to-br from-[#18243c]/10 to-[#18243c]/20 rounded-xl border border-[#18243c]/20">
            <p className="text-sm font-medium text-[#18243c] mb-3 flex items-center space-x-2">
              <ImageIcon className="w-4 h-4" />
              <span>Preview:</span>
            </p>
            <div className="w-full h-48 bg-white rounded-xl border overflow-hidden shadow-sm">
              <img
                src={urlInput}
                alt="URL Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                  if (nextSibling) {
                    nextSibling.style.display = 'flex';
                  }
                }}
              />
              <div className="w-full h-full flex items-center justify-center text-gray-400" style={{display: 'none'}}>
                <div className="text-center">
                  <X className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">Invalid image URL</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleUrlSubmit}
          disabled={!urlInput.trim()}
          className="w-full px-6 py-4 bg-gradient-to-r from-[#18243c] to-[#18243c]/80 text-white rounded-xl hover:from-[#22325a] hover:to-[#18243c] disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
        >
          Add Cover Image
        </button>
      </div>
    </div>
  );

  return (
    <div className={cn('w-full', className)}>
      <CoverDisplay />

      {/* Enhanced Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-auto shadow-2xl border border-gray-100">
            <div className="p-6">
              {mode === 'choose' ? <ModeSelector /> :
               mode === 'file' ? <FileUploadMode /> :
               mode === 'url' ? <UrlInputMode /> : null}
            </div>
            
            {mode === 'choose' && (
              <div className="px-6 pb-6">
                <button
                  onClick={closeModal}
                  className="w-full px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={showCropModal}
        onClose={handleCropModalClose}
        onCrop={handleCroppedImage}
        imageSrc={selectedImageForCrop}
        aspectRatio={2 / 3} // Book cover aspect ratio (600x900 pixels)
        title="Crop Story Cover"
      />
    </div>
  );
} 