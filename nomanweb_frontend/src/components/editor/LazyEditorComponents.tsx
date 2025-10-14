"use client";

import dynamic from 'next/dynamic';

// Loading component for editor
const EditorLoadingSpinner = () => (
  <div className="w-full h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">
        Loading Editor
      </h3>
      <p className="text-sm text-gray-600">
        Preparing the rich text editor...
      </p>
    </div>
  </div>
);

// Lazy load heavy editor components
export const LazyLexicalEditor = dynamic(
  () => import('@/components/editor/LexicalEditor'),
  {
    loading: () => <EditorLoadingSpinner />,
    ssr: false
  }
);

export const LazyRichTextEditor = dynamic(
  () => import('@/components/editor/RichTextEditor'),
  {
    loading: () => <EditorLoadingSpinner />,
    ssr: false
  }
);

export const LazyLexicalEditorToolbar = dynamic(
  () => import('@/components/editor/LexicalEditorToolbar'),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded-lg h-12 w-full mb-2"></div>
    ),
    ssr: false
  }
);

export const LazyEditorToolbar = dynamic(
  () => import('@/components/editor/EditorToolbar'),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded-lg h-12 w-full mb-2"></div>
    ),
    ssr: false
  }
);

export const LazyAutoSavePlugin = dynamic(
  () => import('@/components/editor/AutoSavePlugin'),
  {
    loading: () => null,
    ssr: false
  }
);

export const LazyWordCounter = dynamic(
  () => import('@/components/editor/WordCounter'),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded h-4 w-20"></div>
    ),
    ssr: false
  }
);

// Lazy load chapter management components
export const LazyChapterForm = dynamic(
  () => import('@/components/chapters/ChapterForm'),
  {
    loading: () => <EditorLoadingSpinner />,
    ssr: false
  }
);

export const LazyChapterManagement = dynamic(
  () => import('@/components/chapters/ChapterManagement'),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded-lg h-96 w-full"></div>
    ),
    ssr: false
  }
);

export const LazyBulkChapterUpload = dynamic(
  () => import('@/components/chapters/BulkChapterUpload'),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded-lg h-64 w-full"></div>
    ),
    ssr: false
  }
);

export const LazyQuickCreateChapter = dynamic(
  () => import('@/components/chapters/QuickCreateChapter'),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded-lg h-48 w-full"></div>
    ),
    ssr: false
  }
);

// Lazy load story creation components
export const LazyStoryForm = dynamic(
  () => import('@/components/stories/StoryForm'),
  {
    loading: () => <EditorLoadingSpinner />,
    ssr: false
  }
);

// Lazy load upload components
export const LazyImageUpload = dynamic(
  () => import('@/components/upload/ImageUpload'),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded-lg h-32 w-full"></div>
    ),
    ssr: false
  }
);

export const LazyStoryCoverUpload = dynamic(
  () => import('@/components/upload/StoryCoverUpload'),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded-lg h-48 w-full"></div>
    ),
    ssr: false
  }
);

export const LazyProfileImageUpload = dynamic(
  () => import('@/components/upload/ProfileImageUpload'),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded-full h-24 w-24"></div>
    ),
    ssr: false
  }
);

export const LazyImageCropModal = dynamic(
  () => import('@/components/upload/ImageCropModal'),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded-lg h-64 w-full"></div>
    ),
    ssr: false
  }
);

// Editor configuration for lazy loading
export const editorComponentConfig = {
  lexical: LazyLexicalEditor,
  richText: LazyRichTextEditor,
  toolbar: LazyEditorToolbar,
  lexicalToolbar: LazyLexicalEditorToolbar,
  autoSave: LazyAutoSavePlugin,
  wordCounter: LazyWordCounter,
} as const;

export type EditorComponentType = keyof typeof editorComponentConfig;