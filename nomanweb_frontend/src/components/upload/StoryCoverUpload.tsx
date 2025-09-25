"use client";

import React, { useState, useRef, useCallback, useEffect, memo } from "react";
import {
  Upload,
  X,
  Loader2,
  Link,
  Image as ImageIcon,
  Camera,
  Plus,
  Edit3,
  Trash2,
  Sparkles,
  BookOpen,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api/client";
import { ImageCropModal } from "./ImageCropModal";
import { useQueryClient } from "@tanstack/react-query";

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

type UploadMode = "choose" | "file" | "url";

function StoryCoverUploadComponent({
  storyId,
  value,
  onChange,
  onRemove,
  disabled = false,
  className,
  acceptedFileTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ],
  maxFileSize = 10, // 10MB
  placeholder = "Upload story cover",
}: StoryCoverUploadProps) {
  const queryClient = useQueryClient();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mode, setMode] = useState<UploadMode>("choose");
  const [urlInput, setUrlInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!acceptedFileTypes.includes(file.type)) {
        return `Invalid file type. Accepted types: ${acceptedFileTypes.join(
          ", "
        )}`;
      }

      if (file.size > maxFileSize * 1024 * 1024) {
        return `File size too large. Maximum size: ${maxFileSize}MB`;
      }

      return null;
    },
    [acceptedFileTypes, maxFileSize]
  );

  const uploadFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        const formData = new FormData();
        formData.append("file", file);

        let endpoint: string;

        // Use story-cover endpoint for existing stories, generic endpoint for new stories
        if (storyId && storyId !== "new") {
          endpoint = "/upload/story-cover";
          formData.append("storyId", storyId);
        } else {
          endpoint = "/upload/image";
          formData.append("folder", "story_covers");
        }

        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        const response = await apiClient.post(endpoint, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        const result = response.data;

        if (result.success && result.imageUrl) {
          console.log("✅ Upload successful, imageUrl:", result.imageUrl);
          toast.success("Story cover uploaded successfully!");
          onChange?.(result.imageUrl);

          // If this is an existing story, invalidate the story query to refresh the data
          if (storyId && storyId !== "new") {
            console.log("🔄 Invalidating story query for:", storyId);
            queryClient.invalidateQueries({ queryKey: ["story", storyId] });
          }

          setShowModal(false);
          setMode("choose");
        } else {
          console.error("❌ Upload failed, result:", result);
          throw new Error(result.message || "Upload failed");
        }
      } catch (error: any) {
        console.error("Upload error:", error);
        const errorMessage =
          error.response?.data?.message || error.message || "Upload failed";
        toast.error(errorMessage);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [storyId, onChange, validateFile, queryClient]
  );

  const handleFileForCrop = useCallback(
    (file: File) => {
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
    },
    [validateFile]
  );

  const handleCroppedImage = useCallback(
    async (croppedFile: File) => {
      setShowCropModal(false);
      // Clean up the object URL
      if (selectedImageForCrop) {
        URL.revokeObjectURL(selectedImageForCrop);
        setSelectedImageForCrop("");
      }
      // Upload the cropped file
      await uploadFile(croppedFile);
    },
    [selectedImageForCrop, uploadFile]
  );

  const handleCropModalClose = useCallback(() => {
    setShowCropModal(false);
    // Clean up the object URL
    if (selectedImageForCrop) {
      URL.revokeObjectURL(selectedImageForCrop);
      setSelectedImageForCrop("");
    }
  }, [selectedImageForCrop]);

  const handleUrlSubmit = useCallback(() => {
    if (!urlInput.trim()) {
      toast.error("Please enter a valid image URL");
      return;
    }

    try {
      const url = new URL(urlInput.trim());
      if (!url.protocol.startsWith("http")) {
        throw new Error("Invalid URL protocol");
      }

      onChange?.(urlInput.trim());
      setUrlInput("");
      setShowModal(false);
      setMode("choose");
      toast.success("Cover image URL added successfully!");
    } catch (error) {
      toast.error("Please enter a valid URL");
    }
  }, [urlInput, onChange]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled && mode === "file") {
        setIsDragging(true);
      }
    },
    [disabled, mode]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled || mode !== "file") return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileForCrop(files[0]);
      }
    },
    [disabled, mode, handleFileForCrop]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileForCrop(files[0]);
      }
      // Reset input value so same file can be selected again
      e.target.value = "";
    },
    [handleFileForCrop]
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!disabled) {
        onRemove?.();
        setMode("choose");
      }
    },
    [disabled, onRemove]
  );

  const openModal = () => {
    setShowModal(true);
    setMode("choose");
  };

  const closeModal = () => {
    setShowModal(false);
    setMode("choose");
    setUrlInput("");
  };

  // Main cover display component
  const CoverDisplay = () => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    const previousValueRef = useRef(value);

    useEffect(() => {
      // Only reset image state if the URL actually changed
      if (value !== previousValueRef.current) {
        if (value) {
          setImageLoaded(false);
          setImageError(false);
        }
        previousValueRef.current = value;
      }
    }, [value]);

    const handleImageLoad = () => {
      // Only log if this is a new image load, not a re-render
      if (!imageLoaded) {
        console.log("✅ StoryCoverUpload: Image loaded successfully");
      }
      setImageLoaded(true);
      setImageError(false);
    };

    const handleImageError = () => {
      console.log("❌ Image failed to load");
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
              <div className="w-56 h-80 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Loading cover...</p>
                </div>
              </div>
            )}

            {/* Error state */}
            {imageError && (
              <div
                className="w-56 h-80 border border-red-200 rounded-lg bg-red-50 flex items-center justify-center cursor-pointer hover:bg-red-100"
                onClick={openModal}
              >
                <div className="text-center">
                  <X className="w-6 h-6 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-red-700">Failed to load</p>
                  <p className="text-xs text-red-600 mt-1">Click to retry</p>
                </div>
              </div>
            )}

            {/* Enhanced image display */}
            <div className="relative">
              <img
                src={value}
                alt="Story cover"
                className={`w-56 h-80 object-cover rounded-lg ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />

              {/* Hover overlay with actions - only show when image is loaded */}
              {imageLoaded && (
                <div className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    <button
                      onClick={openModal}
                      className="p-2 bg-white text-gray-800 rounded hover:bg-gray-100"
                      title="Change cover"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {onRemove && !disabled && (
                      <button
                        onClick={handleRemove}
                        className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
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

          {/* Controls below the image */}
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-700">Story Cover</p>

            <div className="flex justify-center space-x-2">
              <button
                onClick={openModal}
                className="px-3 py-1 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
              >
                Change Cover
              </button>
              {onRemove && !disabled && (
                <button
                  onClick={handleRemove}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                >
                  Remove
                </button>
              )}
            </div>

            <p className="text-xs text-gray-500">
              {imageError ? "Click to retry" : "Cover uploaded successfully"}
            </p>
          </div>
        </div>
      );
    }

    // Empty state
    return (
      <div className="text-center">
        <div
          onClick={openModal}
          className="w-56 h-80 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:border-gray-400 hover:bg-gray-100 mx-auto cursor-pointer flex items-center justify-center"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-base font-medium text-gray-700 mb-1">
              Add Cover Image
            </p>
            <p className="text-sm text-gray-500">Click to upload</p>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced modal content components
  const ModeSelector = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mb-4">
          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center mx-auto">
            <ImageIcon className="w-8 h-8 text-gray-600" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Add Story Cover
        </h3>
        <p className="text-gray-600">
          Choose how you'd like to add your cover image
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => setMode("file")}
          className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 text-left w-full"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center mr-3">
              <Camera className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">
                Upload from Device
              </h4>
              <p className="text-sm text-gray-600">
                Choose a file from your computer or drag and drop
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setMode("url")}
          className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 text-left w-full"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center mr-3">
              <Link className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Add from URL</h4>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
            <Camera className="w-4 h-4 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-800">
            Upload Cover Image
          </h3>
        </div>
        <button
          onClick={() => setMode("choose")}
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes.join(",")}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg aspect-[3/2] w-full overflow-hidden",
          {
            "border-gray-400 bg-gray-100": isDragging && !disabled,
            "border-gray-300 hover:border-gray-400 bg-gray-50":
              !isDragging && !disabled,
            "border-gray-200 cursor-not-allowed opacity-50": disabled,
          }
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {isUploading ? (
          <div className="absolute inset-0 bg-white bg-opacity-95 flex flex-col items-center justify-center rounded-lg">
            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center mb-3">
              <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
            </div>
            <h4 className="text-base font-medium text-gray-800 mb-3">
              Uploading Cover...
            </h4>
            <div className="w-48 bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-gray-600 h-2 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">{uploadProgress}% complete</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center cursor-pointer">
            <div
              className={cn(
                "w-12 h-12 rounded flex items-center justify-center mb-3",
                isDragging
                  ? "bg-gray-600 text-white"
                  : "bg-gray-200 text-gray-600"
              )}
            >
              <Upload className="w-6 h-6" />
            </div>

            <h4 className="text-base font-medium text-gray-800 mb-2">
              {isDragging ? "Drop your image here" : "Upload Story Cover"}
            </h4>

            <p className="text-gray-600 mb-4 text-sm">
              {isDragging
                ? "Release to upload"
                : "Drag and drop your image, or click to browse"}
            </p>

            <div className="space-y-1 text-xs text-gray-500 bg-gray-100 rounded p-3 border">
              <p>
                <span className="font-medium">Supported formats:</span>{" "}
                {acceptedFileTypes
                  .map((type) => type.split("/")[1])
                  .join(", ")
                  .toUpperCase()}
              </p>
              <p>
                <span className="font-medium">Maximum size:</span> {maxFileSize}
                MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const UrlInputMode = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
            <Link className="w-4 h-4 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-800">Add from URL</h3>
        </div>
        <button
          onClick={() => setMode("choose")}
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:border-gray-500 focus:outline-none text-gray-800 placeholder-gray-400"
            disabled={disabled}
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Requirements:</p>
            <ul className="space-y-1 text-blue-700 text-xs">
              <li>• Direct link to image file (JPEG, PNG, GIF, WebP)</li>
              <li>• Image must be publicly accessible</li>
            </ul>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleUrlSubmit}
            disabled={!urlInput.trim() || disabled}
            className="flex-1 px-4 py-2 bg-gray-800 text-white font-medium rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Cover Image
          </button>
          <button
            onClick={() => setMode("choose")}
            className="px-4 py-2 border border-gray-300 text-gray-600 font-medium rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn("w-full", className)}>
      <CoverDisplay />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {mode === "choose" ? (
                <ModeSelector />
              ) : mode === "file" ? (
                <FileUploadMode />
              ) : mode === "url" ? (
                <UrlInputMode />
              ) : null}
            </div>

            {mode === "choose" && (
              <div className="px-6 pb-6">
                <button
                  onClick={closeModal}
                  className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded font-medium"
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

// Memoize the component to prevent unnecessary re-renders
export const StoryCoverUpload = memo(
  StoryCoverUploadComponent,
  (prevProps, nextProps) => {
    // Only re-render if these specific props change
    return (
      prevProps.value === nextProps.value &&
      prevProps.storyId === nextProps.storyId &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.className === nextProps.className &&
      prevProps.placeholder === nextProps.placeholder &&
      prevProps.onChange === nextProps.onChange &&
      prevProps.onRemove === nextProps.onRemove
    );
  }
);
