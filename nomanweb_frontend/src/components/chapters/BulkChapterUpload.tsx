'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';
import { useQueryClient } from '@tanstack/react-query';
import { 
  DocumentTextIcon, 
  CloudArrowUpIcon, 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface BulkChapterUploadProps {
  storyId: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  chapterId?: string;
}

const ACCEPTED_FILE_TYPES = [
  '.txt', '.doc', '.docx', '.pdf', '.rtf', '.odt', 
  '.html', '.htm', '.md', '.markdown'
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 20;

export default function BulkChapterUpload({ storyId, onSuccess, onClose }: BulkChapterUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setMounted(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    // Handle ESC key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isUploading) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isUploading, onClose]);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_FILE_TYPES.includes(fileExtension)) {
      return `Invalid file type. Accepted types: ${ACCEPTED_FILE_TYPES.join(', ')}`;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size too large. Maximum size: 50MB`;
    }

    return null;
  }, []);

  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles: UploadFile[] = [];
    const currentFileCount = files.length;

    for (let i = 0; i < fileList.length && (currentFileCount + newFiles.length) < MAX_FILES; i++) {
      const file = fileList[i];
      const validationError = validateFile(file);

      // Check for duplicates
      const isDuplicate = files.some(f => f.name === file.name && f.size === file.size);
      
      if (isDuplicate) {
        toast.error(`File "${file.name}" is already added`);
        continue;
      }

      const uploadFile: UploadFile = {
        id: `${Date.now()}-${i}`,
        file,
        name: file.name,
        size: file.size,
        status: validationError ? 'error' : 'pending',
        progress: 0,
        error: validationError || undefined
      };

      newFiles.push(uploadFile);
    }

    if (currentFileCount + newFiles.length >= MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed`);
    }

    setFiles(prev => [...prev, ...newFiles]);
  }, [files, validateFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  }, [handleFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
    // Reset input value
    e.target.value = '';
  }, [handleFiles]);

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const uploadSingleFile = async (uploadFile: UploadFile): Promise<void> => {
    setFiles(prev => prev.map(f => 
      f.id === uploadFile.id 
        ? { ...f, status: 'uploading', progress: 0 }
        : f
    ));

    try {
      // Get auth token
      const token = Cookies.get('token');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      const formData = new FormData();
      formData.append('file', uploadFile.file);
      formData.append('storyId', storyId);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id && f.progress < 90
            ? { ...f, progress: f.progress + 10 }
            : f
        ));
      }, 200);

      const response = await fetch(`/api/chapters/${storyId}/bulk-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
        credentials: 'include',
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Upload failed: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();

      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'success', 
              progress: 100,
              chapterId: result.chapterId 
            }
          : f
      ));

    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'error', 
              progress: 0,
              error: error instanceof Error ? error.message : 'Upload failed'
            }
          : f
      ));
    }
  };

  const startUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    const validFiles = files.filter(f => f.status === 'pending');
    if (validFiles.length === 0) {
      toast.error('No valid files to upload');
      return;
    }

    setIsUploading(true);

    try {
      // Upload files one by one to avoid overwhelming the server
      for (const file of validFiles) {
        await uploadSingleFile(file);
      }

      const successCount = files.filter(f => f.status === 'success').length;
      const errorCount = files.filter(f => f.status === 'error').length;

      if (successCount > 0) {
        console.log('🔄 Starting real-time mode - chapters will update automatically');
        
        // Quick invalidation to trigger immediate refresh
        await queryClient.invalidateQueries({ 
          queryKey: ['chapters', storyId], 
          exact: true 
        });
        console.log('✅ Invalidated chapters cache');
        
        console.log('✅ Real-time polling will handle updates, calling onSuccess');
        onSuccess?.();
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} file(s) failed to upload`);
      }

    } catch (error) {
      toast.error('Bulk upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const retryUpload = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file && file.status === 'error') {
      uploadSingleFile(file);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
          </div>
        );
      case 'error':
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
          </div>
        );
      case 'uploading':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <DocumentTextIcon className="w-5 h-5 text-gray-500" />
          </div>
        );
    }
  };

  if (!mounted) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isUploading) {
      onClose?.();
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" 
      style={{ zIndex: 9999 }}
      onClick={handleBackdropClick}
    >
      <div 
        className="card-elevated w-full max-w-4xl my-4 sm:my-8 mx-auto overflow-hidden min-h-0 flex flex-col shadow-2xl" 
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 sm:p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CloudArrowUpIcon className="w-6 h-6" style={{ color: '#18243c' }} />
              <div>
                <h2 className="text-2xl font-bold" style={{ color: '#18243c' }}>Multi Chapter Upload</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Upload multiple chapters and convert them automatically
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Upload Area */}
        <div className="p-4 sm:p-6 bg-white flex-shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_FILE_TYPES.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-gray-400 bg-gray-50'
                : 'border-gray-300 hover:border-gray-400 bg-white'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <CloudArrowUpIcon 
              className="w-12 h-12 mx-auto mb-4 text-gray-400" 
              style={{ color: isDragging ? '#18243c' : undefined }}
            />
            
            <h3 className="text-lg font-medium mb-2 text-gray-900">
              {isDragging ? 'Drop your files here!' : 'Upload Chapter Files'}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              {isDragging 
                ? 'Release to upload your chapters' 
                : `Drag & drop up to ${MAX_FILES} files, or click to browse`
              }
            </p>
            
            <p className="text-xs text-gray-500">
              Supports: TXT, DOC, DOCX, PDF, RTF, ODT, HTML, MD • Max 50MB per file
            </p>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 bg-white flex-1 overflow-hidden flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
              <h3 className="text-lg font-semibold text-nomanweb-primary">
                Selected Files ({files.length}/{MAX_FILES})
              </h3>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">{files.filter(f => f.status === 'success').length} uploaded</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                  <span className="text-red-600">{files.filter(f => f.status === 'error').length} failed</span>
                </div>
              </div>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 transition-all hover:border-gray-300 bg-white"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getStatusIcon(file.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {file.name}
                        </p>
                        <span className="text-xs text-gray-500 sm:ml-2 mt-1 sm:mt-0">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      {file.status === 'uploading' && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${file.progress}%`,
                                backgroundColor: '#18243c'
                              }}
                            />
                          </div>
                          <p className="text-xs mt-1" style={{ color: '#18243c' }}>Uploading... {file.progress}%</p>
                        </div>
                      )}
                      
                      {file.status === 'success' && (
                        <p className="text-xs text-green-600 mt-1 font-medium">✓ Upload completed</p>
                      )}
                      
                      {file.error && (
                        <p className="text-xs text-red-600 mt-1">{file.error}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {file.status === 'error' && (
                      <button
                        onClick={() => retryUpload(file.id)}
                        className="px-3 py-1 text-xs font-medium text-white rounded-full transition-colors"
                        style={{
                          backgroundColor: '#18243c'
                        }}
                      >
                        Retry
                      </button>
                    )}
                    {file.status !== 'uploading' && (
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 px-4 sm:px-6 py-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center justify-center sm:justify-start">
              {files.length > 0 && (
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">{files.filter(f => f.status === 'success').length} uploaded</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-gray-600">{files.filter(f => f.status === 'error').length} failed</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-600">{files.filter(f => f.status === 'pending').length} pending</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-center sm:justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 sm:px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                onClick={startUpload}
                disabled={files.filter(f => f.status === 'pending').length === 0 || isUploading}
                className="px-6 sm:px-8 py-2.5 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
                style={{ 
                  backgroundColor: '#18243c',
                  ':hover': { backgroundColor: '#0f1a2e' }
                }}
              >
                {isUploading ? (
                  <div className="flex items-center space-x-2">
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Uploading...</span>
                    <span className="sm:hidden">Upload...</span>
                  </div>
                ) : (
                  <>
                    <span className="hidden sm:inline">
                      Upload {files.filter(f => f.status === 'pending').length} {files.filter(f => f.status === 'pending').length === 1 ? 'File' : 'Files'}
                    </span>
                    <span className="sm:hidden">
                      Upload ({files.filter(f => f.status === 'pending').length})
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}