'use client';

import React, { useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $wrapNodeInElement, mergeRegister } from '@lexical/utils';
import {
  $createParagraphNode,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
} from 'lexical';
import { $createImageNode, ImageNode, ImagePayload } from '../nodes/ImageNode';
import { ImageIcon, Link, Upload, X, Loader2, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';

export const INSERT_IMAGE_COMMAND = createCommand('INSERT_IMAGE_COMMAND');

// Image upload function - integrates with backend/Cloudinary
async function uploadImageToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'chapters'); // Use chapters folder for editor uploads

  const response = await apiClient.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const result = response.data;
  
  if (result.success && result.imageUrl) {
    return result.imageUrl;
  } else {
    throw new Error(result.message || 'Upload failed');
  }
}

interface InsertImageDialogProps {
  activeEditor: any;
  onClose: () => void;
}

function InsertImageDialog({ activeEditor, onClose }: InsertImageDialogProps) {
  const [mode, setMode] = useState<'choose' | 'url' | 'file'>('choose');
  const [src, setSrc] = useState('');
  const [altText, setAltText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUrlSubmit = () => {
    if (!src.trim()) {
      toast.error('Please enter a valid image URL');
      return;
    }

    // Basic URL validation
    try {
      const url = new URL(src.trim());
      if (!url.protocol.startsWith('http')) {
        throw new Error('Invalid URL protocol');
      }

      activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, {
        altText: altText || 'Image',
        src: src.trim(),
      });
      toast.success('Image added successfully!');
      onClose();
    } catch (error) {
      toast.error('Please enter a valid image URL');
    }
  };

  const handleFileUpload = async (file: File) => {
    // Validate file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please use JPEG, PNG, GIF, or WebP.');
      return;
    }

    if (file.size > maxSize) {
      toast.error('File size too large. Maximum size is 10MB.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      const uploadedUrl = await uploadImageToCloudinary(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, {
        altText: altText || file.name,
        src: uploadedUrl,
      });
      
      toast.success('Image uploaded successfully!');
      onClose();
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Image upload failed:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      handleFileUpload(files[0]);
    }
  };

  const renderModeSelector = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Insert Image</h3>
        <p className="text-sm text-gray-600 mb-6">Choose how you'd like to add an image to your story</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => setMode('file')}
          className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
        >
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-200 transition-colors">
              <Camera className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1 text-sm">Upload from Device</h4>
            <p className="text-xs text-gray-600 text-center">
              Choose a file from your computer
            </p>
          </div>
        </button>

        <button
          onClick={() => setMode('url')}
          className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all duration-200 group"
        >
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-green-200 transition-colors">
              <Link className="w-5 h-5 text-green-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1 text-sm">Add from URL</h4>
            <p className="text-xs text-gray-600 text-center">
              Enter an image URL
            </p>
          </div>
        </button>
      </div>
    </div>
  );

  const renderUrlMode = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Insert Image from URL</h3>
        <button
          onClick={() => setMode('choose')}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image URL
          </label>
          <input
            type="url"
            value={src}
            onChange={(e) => setSrc(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alt Text (Optional)
          </label>
          <input
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Describe the image"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {src && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Preview:</p>
            <div className="w-full h-24 bg-white rounded border overflow-hidden">
              <img
                src={src}
                alt="URL Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }}
              />
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm" style={{display: 'none'}}>
                Invalid image URL
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={handleUrlSubmit}
          disabled={!src.trim()}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Insert Image
        </button>
      </div>
    </div>
  );

  const renderFileMode = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Upload Image</h3>
        <button
          onClick={() => setMode('choose')}
          className="text-sm text-gray-600 hover:text-gray-800"
          disabled={isUploading}
        >
          ← Back
        </button>
      </div>
      
      <div className="space-y-4">
        <div
          className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              <p className="text-sm text-gray-700 font-medium">Uploading image...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">{uploadProgress}%</p>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900 mb-1">
                Upload Image
              </p>
              <p className="text-xs text-gray-600 mb-3">
                Drag and drop your image, or click to browse
              </p>
              <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 mr-2" />
                Choose File
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  disabled={isUploading}
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">
                JPEG, PNG, GIF, WebP • Max 10MB
              </p>
            </>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alt Text (Optional)
          </label>
          <input
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Describe the image"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isUploading}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 w-full max-w-md">
      {mode === 'choose' ? renderModeSelector() :
       mode === 'url' ? renderUrlMode() :
       mode === 'file' ? renderFileMode() : null}
    </div>
  );
}

export function InsertImageButton({ editor }: { editor: any }) {
  const [showDialog, setShowDialog] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDialog(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="p-2 rounded hover:bg-gray-200 flex items-center justify-center transition-colors"
        aria-label="Insert Image"
        title="Insert Image"
      >
        <ImageIcon className="w-4 h-4" />
      </button>
      
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Insert Image</h2>
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <InsertImageDialog
              activeEditor={editor}
              onClose={() => setShowDialog(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default function ImagePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error('ImagePlugin: ImageNode not registered on editor');
    }

    return mergeRegister(
      editor.registerCommand<ImagePayload>(
        INSERT_IMAGE_COMMAND,
        (payload) => {
          const imageNode = $createImageNode(payload);
          $insertNodes([imageNode]);
          if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
            $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
          }
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      )
    );
  }, [editor]);

  return null;
} 