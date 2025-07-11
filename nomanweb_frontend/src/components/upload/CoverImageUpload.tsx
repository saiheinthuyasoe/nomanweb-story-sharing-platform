'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Camera, Link, Plus, Edit3, Crop } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import toast from 'react-hot-toast';
import { ImageCropModal } from './ImageCropModal';

interface CoverImageUploadProps {
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

const sizeConfig = {
  sm: { container: 'w-32 h-20', text: 'text-xs', icon: 'w-4 h-4' },
  md: { container: 'w-48 h-32', text: 'text-sm', icon: 'w-6 h-6' },
  lg: { container: 'w-64 h-40', text: 'text-base', icon: 'w-8 h-8' },
  xl: { container: 'w-full h-64', text: 'text-lg', icon: 'w-10 h-10' },
};

export default function CoverImageUpload({
  value,
  onChange,
  onRemove,
  disabled = false,
  className,
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSize = 5,
  placeholder = "Add cover image"
}: CoverImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
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
      formData.append('folder', 'profile_covers');

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await apiClient.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = response.data;

      if (result.success && result.imageUrl) {
        toast.success('Cover image uploaded successfully!');
        onChange?.(result.imageUrl);
        setShowModal(false);
        setMode('choose');
      } else {
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
  }, [onChange, validateFile]);

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

  const handleUrlSubmit = useCallback(async () => {
    if (!urlInput.trim()) return;

    try {
      // Validate URL
      new URL(urlInput);
      
      // For URL input, we'll use the URL directly
      onChange?.(urlInput);
      setShowModal(false);
      setMode('choose');
      setUrlInput('');
      toast.success('Cover image added successfully!');
    } catch (error) {
      toast.error('Please enter a valid image URL');
    }
  }, [urlInput, onChange]);

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
      handleFileForCrop(files[0]);
    }
  }, [disabled, handleFileForCrop]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileForCrop(files[0]);
    }
    // Reset input value so same file can be selected again
    e.target.value = '';
  }, [handleFileForCrop]);

  const handleRemove = useCallback(() => {
    onRemove?.();
    toast.success('Cover image removed');
  }, [onRemove]);

  const openModal = useCallback(() => {
    if (!disabled) {
      setShowModal(true);
      setMode('choose');
    }
  }, [disabled]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setMode('choose');
    setUrlInput('');
  }, []);

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
      setImageLoaded(true);
      setImageError(false);
    };

    const handleImageError = () => {
      setImageLoaded(false);
      setImageError(true);
    };

    if (value) {
      return (
        <div className="text-center">
          {/* Cover image container */}
          <div className="inline-block relative">
            {/* Loading state */}
            {!imageLoaded && !imageError && (
              <div className="w-64 h-40 border-2 border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            )}

            {/* Error state */}
            {imageError && (
              <div 
                className="w-64 h-40 border-2 border-red-300 rounded-xl bg-red-50 flex items-center justify-center cursor-pointer hover:bg-red-100"
                onClick={openModal}
              >
                <div className="text-center">
                  <X className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-sm text-red-600">Failed to load</p>
                  <p className="text-xs text-red-500">Click to retry</p>
                </div>
              </div>
            )}

            {/* Cover image display */}
            {!imageError && (
              <img 
                src={value} 
                alt="Cover"
                className="w-64 h-40 object-cover border-2 border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{ 
                  display: imageLoaded ? 'block' : 'none'
                }}
              />
            )}

            {/* Edit button overlay */}
            {(imageLoaded || imageError) && (
              <button
                onClick={openModal}
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-lg transition-colors flex items-center justify-center"
                title="Change cover image"
              >
                <Edit3 size={12} />
              </button>
            )}
          </div>
          
          {/* Controls and status */}
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Cover Image</p>
            
            <div className="flex justify-center space-x-2">
              <button
                onClick={openModal}
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
              >
                Change
              </button>
              {onRemove && (
                <button
                  onClick={handleRemove}
                  className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Empty state
    return (
      <div className="text-center">
        <div 
          onClick={openModal} 
          className="w-64 h-40 border-2 border-dashed border-gray-300 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 hover:border-blue-400 hover:from-blue-50 hover:to-blue-100 transition-all duration-300 mx-auto cursor-pointer flex items-center justify-center"
        >
          <div className="text-center">
            <Plus className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">Add Cover Image</p>
            <p className="text-xs text-gray-500 mt-1">Click to upload</p>
          </div>
        </div>
      </div>
    );
  };

  // Modal content components
  const ModeSelector = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ImageIcon className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Add Cover Image</h3>
        <p className="text-gray-600">Choose how you'd like to add your cover image</p>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => setMode('file')}
          className="group p-6 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 text-left"
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-xl flex items-center justify-center mr-4 transition-colors duration-300">
              <Camera className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Upload from Device</h4>
              <p className="text-sm text-gray-600">
                Choose a file from your computer or drag and drop
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setMode('url')}
          className="group p-6 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 text-left"
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 group-hover:bg-green-200 rounded-xl flex items-center justify-center mr-4 transition-colors duration-300">
              <Link className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Add from URL</h4>
              <p className="text-sm text-gray-600">
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
        <h3 className="text-xl font-bold text-gray-900">Upload Cover Image</h3>
        <button
          onClick={() => setMode('choose')}
          className="text-gray-500 hover:text-gray-700 transition-colors"
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
          'relative border-2 border-dashed rounded-xl transition-all duration-300 aspect-[8/5] w-full max-w-sm mx-auto',
          {
            'border-blue-400 bg-blue-50': isDragging && !disabled,
            'border-gray-300 hover:border-gray-400 bg-gray-50': !isDragging && !disabled,
            'border-gray-200 cursor-not-allowed opacity-50': disabled,
          }
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {isUploading ? (
          <div className="absolute inset-0 bg-white bg-opacity-95 flex flex-col items-center justify-center rounded-xl">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Uploading...</h4>
            <div className="w-64 bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">{uploadProgress}% complete</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center cursor-pointer">
            <div className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300',
              isDragging ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-500'
            )}>
              <Upload className="w-8 h-8" />
            </div>
            
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              {isDragging ? 'Drop your image here' : 'Upload Cover Image'}
            </h4>
            
            <p className="text-gray-600 mb-4">
              {isDragging ? 'Release to upload' : 'Drag and drop your image, or click to browse'}
            </p>
            
            <div className="space-y-2 text-sm text-gray-500">
              <p>Supports: {acceptedFileTypes.map(type => type.split('/')[1]).join(', ').toUpperCase()}</p>
              <p>Max size: {maxFileSize}MB • Recommended: 1200×750px (8:5 ratio)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const UrlInputMode = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Add Image from URL</h3>
        <button
          onClick={() => setMode('choose')}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Image URL
          </label>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
          <p className="text-xs text-gray-500 mt-2">
            Enter a direct link to an image file
          </p>
        </div>

        {urlInput && (
          <div className="p-4 bg-gray-50 rounded-xl border">
            <p className="text-sm font-medium text-gray-700 mb-3">Preview:</p>
            <div className="w-full h-40 bg-white rounded-lg border overflow-hidden">
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
                  <p className="text-sm">Invalid image URL</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleUrlSubmit}
          disabled={!urlInput.trim()}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Add Cover Image
        </button>
      </div>
    </div>
  );

  return (
    <div className={cn('w-full', className)}>
      <CoverDisplay />

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Add Cover Image</h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Mode Selection */}
            {mode === 'choose' && (
              <div className="p-6 space-y-4">
                <button
                  onClick={() => setMode('file')}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
                >
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-gray-500 group-hover:text-blue-500 mx-auto mb-2" />
                    <p className="font-medium text-gray-700 group-hover:text-blue-700">Upload from Device</p>
                    <p className="text-sm text-gray-500">JPG, PNG or WebP (max {maxFileSize}MB)</p>
                  </div>
                </button>

                <button
                  onClick={() => setMode('url')}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
                >
                  <div className="text-center">
                    <Link className="w-8 h-8 text-gray-500 group-hover:text-blue-500 mx-auto mb-2" />
                    <p className="font-medium text-gray-700 group-hover:text-blue-700">Use Image URL</p>
                    <p className="text-sm text-gray-500">Enter a direct image link</p>
                  </div>
                </button>
              </div>
            )}

            {/* File Upload Mode */}
            {mode === 'file' && (
              <div className="p-6">
                <div
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200",
                    isDragging
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptedFileTypes.join(',')}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Upload className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-lg font-medium text-gray-700 mb-1">
                        Drop your image here
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        or click to browse files
                      </p>
                      
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {isUploading ? 'Uploading...' : 'Choose File'}
                      </button>
                    </div>
                    
                    <p className="text-xs text-gray-400">
                      Supported: JPG, PNG, WebP • Max size: {maxFileSize}MB
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Recommended: 1920 × 1080 pixels for best quality
                    </p>
                  </div>

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{uploadProgress}% uploaded</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    onClick={() => setMode('choose')}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {/* URL Input Mode */}
            {mode === 'url' && (
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    <p>• Use a direct link to an image file</p>
                    <p>• Make sure the image is publicly accessible</p>
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    onClick={() => setMode('choose')}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleUrlSubmit}
                    disabled={!urlInput.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Add Image
                  </button>
                </div>
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
        aspectRatio={16 / 9} // Profile cover aspect ratio (horizontal)
        title="Crop Cover Image"
      />
    </div>
  );
} 