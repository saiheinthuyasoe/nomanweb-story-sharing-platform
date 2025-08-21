"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, {
  Crop,
  PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import {
  X,
  Check,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw as RotateCcwIcon,
  Maximize2,
  Minus,
  Plus,
  Image as ImageIcon,
  Crop as CropIcon,
  Move,
} from "lucide-react";
import "react-image-crop/dist/ReactCrop.css";

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCrop: (croppedFile: File) => void;
  imageSrc: string;
  aspectRatio?: number;
  title?: string;
}

export function ImageCropModal({
  isOpen,
  onClose,
  onCrop,
  imageSrc,
  aspectRatio = 16 / 9,
  title = "Crop Story Cover",
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<"crop" | "move">("crop");

  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate the scale needed to fit image within container
  const calculateFitScale = useCallback(
    (
      imgWidth: number,
      imgHeight: number,
      containerWidth: number,
      containerHeight: number
    ) => {
      const scaleX = containerWidth / imgWidth;
      const scaleY = containerHeight / imgHeight;
      return Math.min(scaleX, scaleY, 1);
    },
    []
  );

  // Calculate the scale needed to show full image size
  const calculateFullSizeScale = useCallback(
    (
      imgWidth: number,
      imgHeight: number,
      containerWidth: number,
      containerHeight: number
    ) => {
      // Start with scale 1 (full size) and adjust if image is too large for container
      const scaleX = containerWidth / imgWidth;
      const scaleY = containerHeight / imgHeight;
      return Math.min(scaleX, scaleY, 1); // Don't scale up beyond 1x, but allow full size
    },
    []
  );

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setImageDimensions({ width, height });

    if (containerDimensions.width && containerDimensions.height) {
      // Scale to fit the whole image in the container
      const fitScale = calculateFitScale(
        width,
        height,
        containerDimensions.width,
        containerDimensions.height
      );
      setScale(fitScale);
      
      // Center the image in the container
      const scaledWidth = width * fitScale;
      const scaledHeight = height * fitScale;
      const centerX = (containerDimensions.width - scaledWidth) / 2;
      const centerY = (containerDimensions.height - scaledHeight) / 2;
      setImagePosition({ x: centerX, y: centerY });
    }

    // Don't automatically set a crop area - let user manually select if needed
    // This ensures the whole image is visible without automatic cropping
    setCrop(undefined);
  }

  // Update container dimensions when modal opens
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerDimensions({
        width: rect.width - 48,
        height: rect.height - 48,
      });
    }
  }, [isOpen]);

  // Simple mouse handlers for image dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (mode === "move" && e.button === 0) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        setDragStart({
          x: e.clientX - imagePosition.x,
          y: e.clientY - imagePosition.y,
        });
      }
    },
    [mode, imagePosition]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && mode === "move") {
        e.preventDefault();
        e.stopPropagation();

        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;

        // Calculate bounds
        const scaledWidth = imageDimensions.width * scale;
        const scaledHeight = imageDimensions.height * scale;
        const maxX = Math.max(0, (scaledWidth - containerDimensions.width) / 2);
        const maxY = Math.max(
          0,
          (scaledHeight - containerDimensions.height) / 2
        );

        setImagePosition({
          x: Math.max(-maxX, Math.min(maxX, newX)),
          y: Math.max(-maxY, Math.min(maxY, newY)),
        });
      }
    },
    [isDragging, dragStart, imageDimensions, scale, containerDimensions, mode]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global mouse event listeners for smooth dragging
  useEffect(() => {
    if (isDragging && mode === "move") {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        e.preventDefault();
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;

        const scaledWidth = imageDimensions.width * scale;
        const scaledHeight = imageDimensions.height * scale;
        const maxX = Math.max(0, (scaledWidth - containerDimensions.width) / 2);
        const maxY = Math.max(
          0,
          (scaledHeight - containerDimensions.height) / 2
        );

        setImagePosition({
          x: Math.max(-maxX, Math.min(maxX, newX)),
          y: Math.max(-maxY, Math.min(maxY, newY)),
        });
      };

      const handleGlobalMouseUp = () => {
        setIsDragging(false);
      };

      document.addEventListener("mousemove", handleGlobalMouseMove, {
        passive: false,
      });
      document.addEventListener("mouseup", handleGlobalMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleGlobalMouseMove);
        document.removeEventListener("mouseup", handleGlobalMouseUp);
      };
    }
  }, [
    isDragging,
    dragStart,
    imageDimensions,
    scale,
    containerDimensions,
    mode,
  ]);

  const getCroppedImg = useCallback(
    async (image: HTMLImageElement, crop: PixelCrop): Promise<File> => {
      const canvas = canvasRef.current;
      if (!canvas || !crop) {
        throw new Error("Canvas or crop not available");
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("No 2d context");
      }

      const pixelRatio = window.devicePixelRatio;
      canvas.width = crop.width * pixelRatio * scaleX;
      canvas.height = crop.height * pixelRatio * scaleY;

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.imageSmoothingQuality = "high";

      const cropX = crop.x * scaleX;
      const cropY = crop.y * scaleY;

      const centerX = image.naturalWidth / 2;
      const centerY = image.naturalHeight / 2;

      ctx.save();
      ctx.translate(-cropX, -cropY);
      ctx.translate(centerX, centerY);
      ctx.rotate((rotate * Math.PI) / 180);
      ctx.scale(scale, scale);
      ctx.translate(-centerX, -centerY);

      ctx.drawImage(
        image,
        0,
        0,
        image.naturalWidth,
        image.naturalHeight,
        0,
        0,
        image.naturalWidth,
        image.naturalHeight
      );

      ctx.restore();

      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              throw new Error("Failed to create blob");
            }
            const file = new File([blob], "cropped-image.jpg", {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(file);
          },
          "image/jpeg",
          0.9
        );
      });
    },
    [rotate, scale]
  );

  const handleCrop = useCallback(async () => {
    if (imgRef.current) {
      try {
        setIsProcessing(true);
        
        let cropToUse = completedCrop;
        
        // If no crop area is selected, use the entire image
        if (!completedCrop) {
          const { width, height } = imgRef.current;
          cropToUse = {
            unit: 'px' as const,
            x: 0,
            y: 0,
            width: width,
            height: height
          };
        }
        
        const croppedImageFile = await getCroppedImg(
          imgRef.current,
          cropToUse
        );
        onCrop(croppedImageFile);
        onClose();
      } catch (error) {
        console.error("Error cropping image:", error);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [completedCrop, getCroppedImg, onCrop, onClose]);

  const handleReset = useCallback(() => {
    if (
      imageDimensions.width &&
      imageDimensions.height &&
      containerDimensions.width &&
      containerDimensions.height
    ) {
      const fitScale = calculateFitScale(
        imageDimensions.width,
        imageDimensions.height,
        containerDimensions.width,
        containerDimensions.height
      );
      setScale(fitScale);
      
      // Center the image in the container
      const scaledWidth = imageDimensions.width * fitScale;
      const scaledHeight = imageDimensions.height * fitScale;
      const centerX = (containerDimensions.width - scaledWidth) / 2;
      const centerY = (containerDimensions.height - scaledHeight) / 2;
      setImagePosition({ x: centerX, y: centerY });
    } else {
      setScale(1);
      setImagePosition({ x: 0, y: 0 });
    }
    setRotate(0);
    setMode("crop");

    // Reset crop area to undefined - let user manually select if needed
    setCrop(undefined);
  }, [
    imageDimensions,
    containerDimensions,
    calculateFitScale,
  ]);

  const getScaleLimits = useCallback(() => {
    if (
      !imageDimensions.width ||
      !imageDimensions.height ||
      !containerDimensions.width ||
      !containerDimensions.height
    ) {
      return { min: 0.1, max: 3 };
    }

    const fitScale = calculateFitScale(
      imageDimensions.width,
      imageDimensions.height,
      containerDimensions.width,
      containerDimensions.height
    );

    return {
      min: Math.max(0.1, fitScale * 0.5),
      max: Math.max(3, fitScale * 3),
    };
  }, [imageDimensions, containerDimensions, calculateFitScale]);

  const scaleLimits = getScaleLimits();

  const handleScaleChange = useCallback(
    (newScale: number) => {
      const clampedScale = Math.max(
        scaleLimits.min,
        Math.min(scaleLimits.max, newScale)
      );
      setScale(clampedScale);
    },
    [scaleLimits]
  );

  const handleRotateChange = useCallback((newRotate: number) => {
    setRotate(newRotate % 360);
  }, []);

  const handleRotateLeft = useCallback(() => {
    setRotate((prev) => (prev - 90) % 360);
  }, []);

  const handleRotateRight = useCallback(() => {
    setRotate((prev) => (prev + 90) % 360);
  }, []);

  const handleZoomIn = useCallback(() => {
    handleScaleChange(scale + 0.1);
  }, [scale, handleScaleChange]);

  const handleZoomOut = useCallback(() => {
    handleScaleChange(scale - 0.1);
  }, [scale, handleScaleChange]);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === "crop" ? "move" : "crop"));
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#18243c] to-[#18243c]/90 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <CropIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{title}</h2>
                <p className="text-blue-100 text-xs mt-0.5">
                  {mode === "crop"
                    ? "Drag corners to crop • Switch to move mode"
                    : "Drag image to move • Switch to crop mode"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 group"
              aria-label="Close crop modal"
            >
              <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Crop Area */}
          <div className="flex-1 p-4 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="h-full flex flex-col">
              {/* Instructions */}
              <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-semibold text-blue-900">
                      Instructions
                    </h3>
                    <p className="text-xs text-blue-700">
                      {mode === "crop"
                        ? "Drag corners to resize crop area • Switch to move mode to reposition image"
                        : "Drag image to move it around • Switch to crop mode to adjust crop area"}
                    </p>
                  </div>
                  <button
                    onClick={toggleMode}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                      mode === "move"
                        ? "bg-blue-500 text-white"
                        : "bg-white text-blue-700 border border-blue-200 hover:bg-blue-50"
                    }`}
                  >
                    {mode === "crop" ? "Move Mode" : "Crop Mode"}
                  </button>
                </div>
              </div>

              {/* Crop Container */}
              <div
                ref={containerRef}
                className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-auto relative"
              >
                <div className="min-h-full min-w-full flex items-center justify-center p-3">
                  <div
                    className={`relative transition-all duration-200 ${
                      mode === "move" ? "ring-2 ring-blue-500/30" : ""
                    }`}
                    style={{
                      cursor:
                        mode === "move"
                          ? isDragging
                            ? "grabbing"
                            : "grab"
                          : "default",
                    }}
                    onMouseDown={mode === "move" ? handleMouseDown : undefined}
                    onMouseMove={mode === "move" ? handleMouseMove : undefined}
                    onMouseUp={mode === "move" ? handleMouseUp : undefined}
                    onMouseLeave={
                      mode === "move" ? handleMouseLeave : undefined
                    }
                  >
                    {/* Image with ReactCrop */}
                    <ReactCrop
                      crop={crop}
                      onChange={(_, percentCrop) => setCrop(percentCrop)}
                      onComplete={(c) => setCompletedCrop(c)}
                      className=""
                      aspect={aspectRatio}
                      minWidth={40}
                      minHeight={40}
                      disabled={mode === "move"}
                    >
                      <img
                        ref={imgRef}
                        alt="Crop story cover"
                        src={imageSrc}
                        style={{
                          transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${scale}) rotate(${rotate}deg)`,
                          maxWidth: "100%",
                          maxHeight: "100%",
                          width: "auto",
                          height: "auto",
                          objectFit: "contain",
                          userSelect: "none",
                          pointerEvents: "none",
                        }}
                        onLoad={onImageLoad}
                        className="transition-transform duration-200"
                        draggable={false}
                      />
                    </ReactCrop>

                    {/* Mode indicator */}
                    <div
                      className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                        mode === "move"
                          ? isDragging
                            ? "bg-green-500 text-white"
                            : "bg-blue-500 text-white"
                          : "bg-orange-500 text-white"
                      }`}
                    >
                      {mode === "move"
                        ? isDragging
                          ? "Dragging..."
                          : "Move Mode - Click & Drag"
                        : "Crop Mode - Drag corners"}
                    </div>

                    {/* Position debug */}
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      Pos: ({imagePosition.x.toFixed(0)},{" "}
                      {imagePosition.y.toFixed(0)})
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="w-full lg:w-72 bg-white border-l border-gray-200 p-4 overflow-y-auto">
            <div className="space-y-4">
              {/* Scale Controls */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-200">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <ZoomIn className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-xs font-semibold text-gray-900">Scale</h3>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleZoomOut}
                      disabled={scale <= scaleLimits.min}
                      className="p-1.5 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      aria-label="Zoom out"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="range"
                      min={scaleLimits.min}
                      max={scaleLimits.max}
                      step="0.1"
                      value={scale}
                      onChange={(e) =>
                        handleScaleChange(Number(e.target.value))
                      }
                      className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <button
                      onClick={handleZoomIn}
                      disabled={scale >= scaleLimits.max}
                      className="p-1.5 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      aria-label="Zoom in"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded-lg border border-gray-200">
                      {scale.toFixed(1)}x
                    </span>
                  </div>
                </div>
              </div>

              {/* Rotation Controls */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <RotateCw className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-xs font-semibold text-gray-900">
                    Rotation
                  </h3>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleRotateLeft}
                      className="p-1.5 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200"
                      aria-label="Rotate left"
                    >
                      <RotateCcwIcon className="w-3 h-3" />
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={rotate}
                      onChange={(e) =>
                        handleRotateChange(Number(e.target.value))
                      }
                      className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <button
                      onClick={handleRotateRight}
                      className="p-1.5 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200"
                      aria-label="Rotate right"
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded-lg border border-gray-200">
                      {rotate}°
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-3 border border-orange-200">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <RotateCcw className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-xs font-semibold text-gray-900">
                    Quick Actions
                  </h3>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 text-xs font-medium text-gray-700"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All</span>
                </button>
              </div>

              {/* Aspect Ratio Info */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-200">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <Maximize2 className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-xs font-semibold text-gray-900">
                    Aspect Ratio
                  </h3>
                </div>
                <p className="text-xs text-gray-600">
                  {aspectRatio === 16 / 9
                    ? "16:9"
                    : aspectRatio === 4 / 3
                    ? "4:3"
                    : aspectRatio === 1
                    ? "1:1"
                    : `${aspectRatio.toFixed(2)}:1`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              {completedCrop ? (
                <span className="flex items-center space-x-2 text-green-600">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Crop area selected</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2 text-blue-600">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>Whole image will be used</span>
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 transition-all duration-200 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCrop}
                disabled={isProcessing}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-[#18243c] to-[#18243c]/80 text-white rounded-lg hover:from-[#22325a] hover:to-[#18243c] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{completedCrop ? 'Apply Crop' : 'Use Image'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Hidden canvas for cropping */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      {/* Custom CSS for better slider styling */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #18243c, #22325a);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #18243c, #22325a);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
