'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Loader2, Link, Image as ImageIcon, Camera, Plus, Edit3, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';

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

interface UploadResponse {
  success: boolean;
  message: string;
  imageUrl?: string;
  publicId?: string;
  fileSize?: number;
  originalFilename?: string;
  folder?: string;
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
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mode, setMode] = useState<UploadMode>('choose');
  const [urlInput, setUrlInput] = useState('');
  const [showModal, setShowModal] = useState(false);
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
      
      // Always use the generic image endpoint for story covers
      const endpoint = '/upload/image';
      formData.append('folder', 'story_covers');
      
      // Only add storyId if it's not a new story
      if (storyId && storyId !== 'new') {
        formData.append('storyId', storyId);
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
        toast.success('Story cover uploaded successfully!');
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
  }, [storyId, onChange, validateFile]);

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
      uploadFile(files[0]);
    }
  }, [disabled, mode, uploadFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
    e.target.value = '';
  }, [uploadFile]);

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
          {/* Simple image container - no complex overlays */}
          <div className="inline-block">
            {/* Loading state */}
            {!imageLoaded && !imageError && (
              <div className="w-48 h-64 border-2 border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Loading...</p>
                </div>
              </div>
            )}

            {/* Error state */}
            {imageError && (
              <div 
                className="w-48 h-64 border-2 border-red-300 rounded-xl bg-red-50 flex items-center justify-center cursor-pointer hover:bg-red-100"
                onClick={openModal}
              >
                <div className="text-center">
                  <X className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-sm text-red-600">Failed to load</p>
                  <p className="text-xs text-red-500">Click to retry</p>
                </div>
              </div>
            )}

            {/* Simple image display - exactly like the working test */}
            {!imageError && (
              <img 
                src={value} 
                alt="Story cover"
                className="w-48 h-64 object-cover border-2 border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{ 
                  display: imageLoaded ? 'block' : 'none'
                }}
              />
            )}
          </div>
          
          {/* Controls below the image */}
          <div className="mt-3 space-y-2">
            <p className="text-sm font-medium text-gray-700">Story Cover</p>
            
            <div className="flex justify-center space-x-2">
              <button
                onClick={openModal}
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
              >
                Change
              </button>
              {onRemove && !disabled && (
                <button
                  onClick={handleRemove}
                  className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
            
            <p className="text-xs text-gray-500">
              {imageError ? 'Click image to retry' : 'Upload successful'}
            </p>
          </div>
        </div>
      );
    }

    // Empty state (simplified)
    return (
      <div className="text-center">
        <div 
          onClick={openModal} 
          className="w-48 h-64 border-2 border-dashed border-gray-300 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 hover:border-blue-400 hover:from-blue-50 hover:to-blue-100 transition-all duration-300 mx-auto cursor-pointer flex items-center justify-center"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-200 hover:bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors">
              <Plus className="w-6 h-6 text-gray-500" />
            </div>
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
        <h3 className="text-xl font-bold text-gray-900 mb-2">Add Story Cover</h3>
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
          className="group p-6 border-2 border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all duration-300 text-left"
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 group-hover:bg-green-200 rounded-xl flex items-center justify-center mr-4 transition-colors duration-300">
              <Link className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Add from URL</h4>
              <p className="text-sm text-gray-600">
                Enter an image URL from the web
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
          'relative border-2 border-dashed rounded-xl transition-all duration-300 aspect-[3/2] w-full',
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
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Uploading Cover...</h4>
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
              {isDragging ? 'Drop your image here' : 'Upload Story Cover'}
            </h4>
            
            <p className="text-gray-600 mb-4">
              {isDragging ? 'Release to upload' : 'Drag and drop your image, or click to browse'}
            </p>
            
            <div className="space-y-2 text-sm text-gray-500">
              <p>Supports: {acceptedFileTypes.map(type => type.split('/')[1]).join(', ').toUpperCase()}</p>
              <p>Max size: {maxFileSize}MB • Recommended: 800×1200px (3:4 ratio)</p>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto shadow-2xl">
            <div className="p-6">
              {mode === 'choose' ? <ModeSelector /> :
               mode === 'file' ? <FileUploadMode /> :
               mode === 'url' ? <UrlInputMode /> : null}
            </div>
            
            {mode === 'choose' && (
              <div className="px-6 pb-6">
                <button
                  onClick={closeModal}
                  className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 