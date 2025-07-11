'use client';

import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { X, Check, RotateCcw } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';

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
  aspectRatio = 16 / 9, // Default to 16:9 aspect ratio for profile covers
  title = "Crop Image"
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspectRatio) {
      const { width, height } = e.currentTarget;
      setCrop(centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 90,
          },
          aspectRatio,
          width,
          height,
        ),
        width,
        height,
      ));
    }
  }

  const getCroppedImg = useCallback(
    async (image: HTMLImageElement, crop: PixelCrop): Promise<File> => {
      const canvas = canvasRef.current;
      if (!canvas || !crop) {
        throw new Error('Canvas or crop not available');
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      const pixelRatio = window.devicePixelRatio;
      canvas.width = crop.width * pixelRatio * scaleX;
      canvas.height = crop.height * pixelRatio * scaleY;

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.imageSmoothingQuality = 'high';

      const cropX = crop.x * scaleX;
      const cropY = crop.y * scaleY;

      // Move to center, apply transform, then move back
      const centerX = image.naturalWidth / 2;
      const centerY = image.naturalHeight / 2;

      ctx.save();

      // Move to center
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
        image.naturalHeight,
      );

      ctx.restore();

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            throw new Error('Failed to create blob');
          }
          const file = new File([blob], 'cropped-image.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(file);
        }, 'image/jpeg', 0.9);
      });
    },
    [rotate, scale]
  );

  const handleCrop = useCallback(async () => {
    if (completedCrop && imgRef.current) {
      try {
        const croppedImageFile = await getCroppedImg(imgRef.current, completedCrop);
        onCrop(croppedImageFile);
        onClose();
      } catch (error) {
        console.error('Error cropping image:', error);
      }
    }
  }, [completedCrop, getCroppedImg, onCrop, onClose]);

  const handleReset = useCallback(() => {
    setScale(1);
    setRotate(0);
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 90,
          },
          aspectRatio,
          width,
          height,
        ),
        width,
        height,
      ));
    }
  }, [aspectRatio]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">Drag to adjust crop area • Use controls below to fine-tune</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Crop Area */}
        <div className="p-6">
          <div className="mb-4">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              className="max-w-full"
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imageSrc}
                style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
                onLoad={onImageLoad}
                className="max-w-full h-auto"
              />
            </ReactCrop>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">
                Scale:
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-500 w-12">{scale.toFixed(1)}</span>
            </div>

            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">
                Rotate:
              </label>
              <input
                type="range"
                min="0"
                max="360"
                value={rotate}
                onChange={(e) => setRotate(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-500 w-12">{rotate}°</span>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleReset}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            disabled={!completedCrop}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Check className="w-4 h-4 mr-2" />
            Apply Crop
          </button>
        </div>

        {/* Hidden canvas for cropping */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
} 