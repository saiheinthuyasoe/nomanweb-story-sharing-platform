"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  Camera,
  Link,
  Plus,
  Edit3,
  Crop,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import toast from "react-hot-toast";
import { ImageCropModal } from "./ImageCropModal";

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

type UploadMode = "choose" | "file" | "url";

const sizeConfig = {
  sm: { container: "w-32 h-20", text: "text-xs", icon: "w-4 h-4" },
  md: { container: "w-48 h-32", text: "text-sm", icon: "w-6 h-6" },
  lg: { container: "w-64 h-40", text: "text-base", icon: "w-8 h-8" },
  xl: { container: "w-full h-64", text: "text-lg", icon: "w-10 h-10" },
};

export default function CoverImageUpload({
  value,
  onChange,
  onRemove,
  disabled = false,
  className,
  acceptedFileTypes = ["image/jpeg", "image/png", "image/webp"],
  maxFileSize = 5,
  placeholder = "Add cover image",
}: CoverImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
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
      console.log("🚀 Starting file upload:", file.name, file.size, file.type);

      const validationError = validateFile(file);
      if (validationError) {
        console.error("❌ File validation failed:", validationError);
        toast.error(validationError);
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "profile_covers");

        console.log("📤 Preparing upload with formData:", {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          folder: "profile_covers",
        });

        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        console.log("🌐 Making API request to /upload/image");
        const response = await apiClient.post("/upload/image", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        console.log("✅ Upload response:", response.data);
        const result = response.data;

        if (result.success && result.imageUrl) {
          console.log(
            "🎉 Upload successful, calling onChange with:",
            result.imageUrl
          );
          toast.success("Cover image uploaded successfully!");
          onChange?.(result.imageUrl);
          setShowModal(false);
          setMode("choose");
        } else {
          throw new Error(result.message || "Upload failed");
        }
      } catch (error: any) {
        console.error("❌ Upload error:", error);
        console.error("❌ Error response:", error.response?.data);
        console.error("❌ Error status:", error.response?.status);
        const errorMessage =
          error.response?.data?.message || error.message || "Upload failed";
        toast.error(errorMessage);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [onChange, validateFile]
  );

  const handleFileForCrop = useCallback(
    (file: File) => {
      console.log(
        "📁 File selected for crop:",
        file.name,
        file.size,
        file.type
      );

      const validationError = validateFile(file);
      if (validationError) {
        console.error("❌ File validation failed:", validationError);
        toast.error(validationError);
        return;
      }

      // Create URL for the selected file to show in crop modal
      const imageUrl = URL.createObjectURL(file);
      console.log("🖼️ Created object URL for crop modal:", imageUrl);
      setSelectedImageForCrop(imageUrl);
      setShowCropModal(true);
      setShowModal(false);
    },
    [validateFile]
  );

  const handleCroppedImage = useCallback(
    async (croppedFile: File) => {
      console.log(
        "✂️ Cropped file received:",
        croppedFile.name,
        croppedFile.size,
        croppedFile.type
      );
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
    console.log("❌ Crop modal closed");
    setShowCropModal(false);
    // Clean up the object URL
    if (selectedImageForCrop) {
      URL.revokeObjectURL(selectedImageForCrop);
      setSelectedImageForCrop("");
    }
  }, [selectedImageForCrop]);

  const handleUrlSubmit = useCallback(async () => {
    console.log("🔗 URL submit attempted:", urlInput);
    if (!urlInput.trim()) return;

    try {
      // Validate URL
      new URL(urlInput);

      console.log("✅ Valid URL, calling onChange with:", urlInput);
      // For URL input, we'll use the URL directly
      onChange?.(urlInput);
      setShowModal(false);
      setMode("choose");
      setUrlInput("");
      toast.success("Cover image added successfully!");
    } catch (error) {
      console.error("❌ Invalid URL:", urlInput);
      toast.error("Please enter a valid image URL");
    }
  }, [urlInput, onChange]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      console.log(
        "📁 Files dropped:",
        files.length,
        files.map((f) => ({ name: f.name, size: f.size, type: f.type }))
      );
      if (files.length > 0) {
        handleFileForCrop(files[0]);
      }
    },
    [disabled, handleFileForCrop]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      console.log(
        "📁 Files selected via input:",
        files?.length,
        files
          ? Array.from(files).map((f) => ({
              name: f.name,
              size: f.size,
              type: f.type,
            }))
          : "No files"
      );
      if (files && files.length > 0) {
        handleFileForCrop(files[0]);
      }
      // Reset input value so same file can be selected again
      e.target.value = "";
    },
    [handleFileForCrop]
  );

  const handleRemove = useCallback(() => {
    onRemove?.();
    toast.success("Cover image removed");
  }, [onRemove]);

  const openModal = useCallback(() => {
    console.log("🚪 Opening cover image modal");
    if (!disabled) {
      setShowModal(true);
      setMode("choose");
    } else {
      console.log("❌ Modal disabled, cannot open");
    }
  }, [disabled]);

  const closeModal = useCallback(() => {
    console.log("🚪 Closing cover image modal");
    setShowModal(false);
    setMode("choose");
    setUrlInput("");
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
                  display: imageLoaded ? "block" : "none",
                }}
              />
            )}

            {/* Enhanced Edit button overlay */}
            {(imageLoaded || imageError) && (
              <button
                onClick={openModal}
                className="group absolute -bottom-3 -right-3 w-12 h-12 bg-gradient-to-r from-[#18243c] to-[#22325a] hover:from-[#22325a] hover:to-[#2d4574] text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center transform hover:scale-110 border-4 border-white backdrop-blur-sm"
                title="Change cover image"
              >
                <div className="relative">
                  <Edit3 className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                </div>
              </button>
            )}
          </div>

          {/* Enhanced Controls and status */}
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-800 mb-3 flex items-center justify-center space-x-2">
              <ImageIcon className="w-4 h-4 text-[#18243c]" />
              <span>Cover Image</span>
            </p>

            <div className="flex justify-center space-x-3">
              <button
                onClick={openModal}
                className="group flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#18243c] to-[#22325a] hover:from-[#22325a] hover:to-[#2d4574] text-white text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Camera className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                <span>Change</span>
              </button>
              {onRemove && (
                <button
                  onClick={handleRemove}
                  className="group flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Enhanced Empty state
    return (
      <div className="text-center">
        <div
          onClick={openModal}
          className="group relative w-64 h-40 border-2 border-dashed border-gray-300 rounded-2xl bg-gradient-to-br from-gray-50/80 via-blue-50/20 to-indigo-50/30 hover:border-[#18243c]/50 hover:from-[#18243c]/5 hover:to-[#22325a]/10 transition-all duration-500 mx-auto cursor-pointer flex items-center justify-center transform hover:scale-105 shadow-sm hover:shadow-lg backdrop-blur-sm"
        >
          <div className="text-center relative z-10">
            <div className="w-12 h-12 bg-gradient-to-br from-[#18243c] to-[#22325a] rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Plus className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
            </div>
            <p className="text-sm font-semibold text-gray-800 group-hover:text-[#18243c] transition-colors duration-300">
              Add Cover Image
            </p>
            <p className="text-xs text-gray-500 mt-1 group-hover:text-[#22325a]/70 transition-colors duration-300">
              Click to upload or drag & drop
            </p>
          </div>

          {/* Subtle animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#18243c]/5 via-transparent to-[#22325a]/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Floating elements */}
          <div className="absolute top-3 right-3 w-2 h-2 bg-[#18243c]/20 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-500" />
          <div className="absolute bottom-4 left-4 w-1.5 h-1.5 bg-[#22325a]/30 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-700 delay-200" />
        </div>
      </div>
    );
  };

  // Enhanced Modal content components
  const ModeSelector = () => (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-12 h-12 bg-gradient-to-br from-[#18243c] to-[#22325a] rounded-2xl flex items-center justify-center mx-auto mb-3">
          <ImageIcon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          Add Cover Image
        </h3>
        <p className="text-sm text-gray-600">
          Choose your preferred upload method
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setMode("file")}
          className="group relative p-4 border border-gray-200 rounded-xl hover:border-[#18243c]/30 hover:shadow-lg transition-all duration-300 text-center overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#18243c]/5 to-[#22325a]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
          <div className="relative z-10">
            <div className="w-8 h-8 bg-gradient-to-br from-[#18243c] to-[#22325a] group-hover:from-[#22325a] group-hover:to-[#2d4574] rounded-lg flex items-center justify-center mx-auto mb-2 transition-all duration-300 shadow-sm group-hover:shadow-md">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <h4 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-[#18243c] transition-colors duration-300">
              Upload File
            </h4>
            <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
              From device
            </p>
          </div>
        </button>

        <button
          onClick={() => setMode("url")}
          className="group relative p-4 border border-gray-200 rounded-xl hover:border-[#18243c]/30 hover:shadow-lg transition-all duration-300 text-center overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
          <div className="relative z-10">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 group-hover:from-emerald-600 group-hover:to-teal-700 rounded-lg flex items-center justify-center mx-auto mb-2 transition-all duration-300 shadow-sm group-hover:shadow-md">
              <Link className="w-4 h-4 text-white" />
            </div>
            <h4 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-emerald-700 transition-colors duration-300">
              From URL
            </h4>
            <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
              Web link
            </p>
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
          onClick={() => setMode("choose")}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
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
          "relative border-2 border-dashed rounded-xl transition-all duration-300 aspect-[8/5] w-full max-w-sm mx-auto",
          {
            "border-blue-400 bg-blue-50": isDragging && !disabled,
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
          <div className="absolute inset-0 bg-white bg-opacity-95 flex flex-col items-center justify-center rounded-xl">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Uploading...
            </h4>
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
            <div
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300",
                isDragging
                  ? "bg-blue-200 text-blue-700"
                  : "bg-gray-200 text-gray-500"
              )}
            >
              <Upload className="w-8 h-8" />
            </div>

            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              {isDragging ? "Drop your image here" : "Upload Cover Image"}
            </h4>

            <p className="text-gray-600 mb-4">
              {isDragging
                ? "Release to upload"
                : "Drag and drop your image, or click to browse"}
            </p>

            <div className="space-y-2 text-sm text-gray-500">
              <p>
                Supports:{" "}
                {acceptedFileTypes
                  .map((type) => type.split("/")[1])
                  .join(", ")
                  .toUpperCase()}
              </p>
              <p>
                Max size: {maxFileSize}MB • Recommended: 1200×750px (8:5 ratio)
              </p>
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
          onClick={() => setMode("choose")}
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
                  e.currentTarget.style.display = "none";
                  const nextSibling = e.currentTarget
                    .nextElementSibling as HTMLElement;
                  if (nextSibling) {
                    nextSibling.style.display = "flex";
                  }
                }}
              />
              <div
                className="w-full h-full flex items-center justify-center text-gray-400"
                style={{ display: "none" }}
              >
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
    <div className={cn("w-full", className)}>
      <CoverDisplay />

      {/* Enhanced Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Add Cover Image
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Enhanced Modal Content */}
            <div className="p-6">
              {mode === "choose" && <ModeSelector />}
              {mode === "file" && <FileUploadMode />}
              {mode === "url" && <UrlInputMode />}
            </div>
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
