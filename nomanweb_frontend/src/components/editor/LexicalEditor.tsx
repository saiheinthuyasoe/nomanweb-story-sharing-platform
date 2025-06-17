'use client';

import React, { useEffect, useState } from 'react';
import { $getRoot, $getSelection } from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { ListNode, ListItemNode } from '@lexical/list';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import LexicalEditorToolbar from './LexicalEditorToolbar';
import ImagePlugin from './plugins/ImagePlugin';
import FloatingTextToolbar from './plugins/FloatingTextToolbar';
import { ImageNode } from './nodes/ImageNode';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';
import { chaptersApi } from '@/lib/api/chapters';

// Theme configuration for Lexical
const lexicalTheme = {
  ltr: 'ltr',
  rtl: 'rtl',
  placeholder: 'editor-placeholder',
  paragraph: 'editor-paragraph',
  quote: 'editor-quote',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5',
  },
  list: {
    nested: {
      listitem: 'editor-nested-listitem',
    },
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
    listitem: 'editor-listitem',
  },
  image: 'editor-image',
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    overflowed: 'editor-text-overflowed',
    hashtag: 'editor-text-hashtag',
    underline: 'editor-text-underline',
    strikethrough: 'editor-text-strikethrough',
    underlineStrikethrough: 'editor-text-underlineStrikethrough',
    code: 'editor-text-code',
  },
  code: 'editor-code',
};

// Editor configuration
function onError(error: Error) {
  console.error(error);
}

const editorConfig = {
  namespace: 'NoManWebEditor',
  theme: lexicalTheme,
  onError,
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    ImageNode,
  ],
};

interface LexicalEditorProps {
  value?: string;
  onChange?: (content: string, wordCount: number, characterCount: number) => void;
  onAutoSave?: (content: string) => void;
  placeholder?: string;
  className?: string;
  autoSaveInterval?: number;
  isDarkMode?: boolean;
  chapterId?: string;
}

// Inner component that has access to the editor context
function EditorContent({
  value,
  onChange,
  onAutoSave,
  autoSaveInterval,
  chapterId,
  isDarkMode = false
}: {
  value?: string;
  onChange?: (content: string, wordCount: number, characterCount: number) => void;
  onAutoSave?: (content: string) => void;
  autoSaveInterval: number;
  chapterId?: string;
  isDarkMode?: boolean;
}) {
  const [editor] = useLexicalComposerContext();
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [lastSavedContent, setLastSavedContent] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleEditorChange = (editorState: any) => {
    editorState.read(() => {
      const root = $getRoot();
      
      // Get text content for word/character counting
      const textContent = root.getTextContent();
      const words = textContent.trim().split(/\s+/).filter(word => word.length > 0).length;
      const characters = textContent.length;
      
      setWordCount(words);
      setCharacterCount(characters);
      
      // Get HTML content for proper serialization
      const htmlContent = $generateHtmlFromNodes(editor, null);
      
      console.log('LexicalEditor - Content changed:', {
        textContentLength: textContent.length,
        htmlContentLength: htmlContent.length,
        wordCount: words,
        characterCount: characters,
        hasFormatting: htmlContent !== textContent,
        textPreview: textContent.substring(0, 100) + '...',
        htmlPreview: htmlContent.substring(0, 100) + '...'
      });
      
      // Always call onChange even for formatting changes
      onChange?.(htmlContent, words, characters);
      
      // Also trigger very fast auto-save for editor changes
      if (onAutoSave && htmlContent.trim()) {
        // Very fast debounced auto-save
        clearTimeout((window as any).editorAutoSaveTimeout);
        (window as any).editorAutoSaveTimeout = setTimeout(() => {
          console.log('Fast editor auto-save triggered...');
          onAutoSave(htmlContent);
        }, 300); // Super fast - 300ms delay for immediate feedback
      }
    });
  };

  // Auto-save function with proper error handling
  const performAutoSave = async (content: string) => {
    if (!content.trim() || content === lastSavedContent || !chapterId) {
      return;
    }

    setAutoSaveStatus('saving');
    
    try {
      await chaptersApi.autoSaveChapter(chapterId, {
        content: content,
        isAutoSave: true
      });

      setLastSavedContent(content);
      setAutoSaveStatus('saved');
      
      // Reset status after 2 seconds
      setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 2000);
      
    } catch (error) {
      console.error('Auto-save error:', error);
      setAutoSaveStatus('error');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 3000);
    }
  };

  return (
    <>
      <OnChangePlugin onChange={handleEditorChange} />
      <HistoryPlugin />
      <ListPlugin />
      <ImagePlugin />
      <InitialContentPlugin value={value} />
      {onAutoSave && (
        <AutoSavePlugin 
          onAutoSave={performAutoSave} 
          interval={autoSaveInterval} 
        />
      )}
      <FloatingTextToolbarPlugin />
      
      {/* Real-time stats display under the editor */}
      <div className={cn(
        'flex items-center justify-between mt-2 px-2 py-1 text-sm border-t',
        isDarkMode 
          ? 'text-gray-400 bg-gray-700 border-gray-600' 
          : 'text-gray-500 bg-gray-50 border-gray-200'
      )}>
        <div className="flex items-center space-x-4">
          <span>Words: {wordCount.toLocaleString()}</span>
          <span>Characters: {characterCount.toLocaleString()}</span>
          <span>Reading time: ~{Math.ceil(wordCount / 200)} min</span>
        </div>
        
        {/* Auto-save status */}
        {autoSaveStatus !== 'idle' && (
          <div className="flex items-center space-x-1">
            {autoSaveStatus === 'saving' && (
              <>
                <div className={cn(
                  'animate-spin w-3 h-3 border rounded-full',
                  isDarkMode 
                    ? 'border-gray-500 border-t-blue-400' 
                    : 'border-gray-300 border-t-blue-600'
                )}></div>
                <span className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>Saving...</span>
              </>
            )}
            {autoSaveStatus === 'saved' && (
              <span className={isDarkMode ? 'text-green-400' : 'text-green-600'}>✓ Saved</span>
            )}
            {autoSaveStatus === 'error' && (
              <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>⚠ Save failed</span>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function LexicalEditor({
  value = '',
  onChange,
  onAutoSave,
  placeholder = 'Start writing your content...',
  className,
  autoSaveInterval = 30000,
  isDarkMode = false,
  chapterId
}: LexicalEditorProps) {
  return (
    <div className={cn('lexical-editor-container', className, isDarkMode && 'dark')} data-lexical-editor="true">
      <LexicalComposer initialConfig={editorConfig}>
        <div className={cn(
          'border rounded-lg overflow-hidden',
          isDarkMode 
            ? 'border-gray-600 bg-gray-800' 
            : 'border-gray-300 bg-white'
        )}>
          <div className={isDarkMode ? 'dark' : ''}>
            <LexicalEditorToolbar />
          </div>
          <div className={cn(
            'border-t',
            isDarkMode ? 'border-gray-600' : 'border-gray-200'
          )} />
          <div className={cn(
            'relative min-h-[400px]',
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          )} data-lexical-editor="true">
            <RichTextPlugin
              contentEditable={
                <ContentEditable 
                  className={cn(
                    'lexical-content-editable',
                    isDarkMode ? 'text-gray-100' : 'text-gray-900'
                  )}
                  data-lexical-editor="true"
                  style={{
                    minHeight: '400px',
                    padding: '1rem',
                    outline: 'none',
                    fontSize: '16px',
                    lineHeight: '1.6',
                    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
                    backgroundColor: isDarkMode ? 'rgb(31, 41, 55)' : 'white',
                    color: isDarkMode ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)',
                  }}
                />
              }
              placeholder={
                <div className={cn(
                  'lexical-placeholder absolute top-4 left-4 pointer-events-none',
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                )}>
                  {placeholder}
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <EditorContent
              value={value}
              onChange={onChange}
              onAutoSave={onAutoSave}
              autoSaveInterval={autoSaveInterval}
              chapterId={chapterId}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      </LexicalComposer>
    </div>
  );
}

// Auto-save plugin
function AutoSavePlugin({ 
  onAutoSave, 
  interval 
}: { 
  onAutoSave: (content: string) => void; 
  interval: number; 
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const saveInterval = setInterval(() => {
      editor.getEditorState().read(() => {
        const htmlContent = $generateHtmlFromNodes(editor, null);
        if (htmlContent.trim()) {
          onAutoSave(htmlContent);
        }
      });
    }, interval);

    return () => clearInterval(saveInterval);
  }, [editor, onAutoSave, interval]);

  return null;
}

// Floating text toolbar plugin
function FloatingTextToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  
  return (
    <>
      {typeof window !== 'undefined' && createPortal(<FloatingTextToolbar editor={editor} />, document.body)}
    </>
  );
}

// Initial content plugin
function InitialContentPlugin({ value }: { value?: string }) {
  const [editor] = useLexicalComposerContext();
  const [hasLoadedInitialContent, setHasLoadedInitialContent] = useState(false);

  useEffect(() => {
    if (value && value.trim() && !hasLoadedInitialContent) {
      console.log('InitialContentPlugin - Loading content:', {
        contentLength: value.length,
        contentPreview: value.substring(0, 200) + '...'
      });
      
      // Load existing content
      editor.update(() => {
        const root = $getRoot();
        
        // Clear existing content first
        root.clear();
        
        // Parse HTML string to DOM
        const parser = new DOMParser();
        const dom = parser.parseFromString(value, 'text/html');
        
        // Generate nodes from the parsed DOM
        const nodes = $generateNodesFromDOM(editor, dom);
        
        console.log('InitialContentPlugin - Generated nodes:', nodes.length);
        
        // Append nodes to root
        root.append(...nodes);
        
        // Set cursor to the end of the content
        root.selectEnd();
      });
      
      setHasLoadedInitialContent(true);
      console.log('InitialContentPlugin - Content loaded successfully');
      
      // Focus the editor after content is loaded
      setTimeout(() => {
        editor.focus();
      }, 100);
    } else if (!value && !hasLoadedInitialContent) {
      console.log('InitialContentPlugin - No initial content, focusing editor');
      // No initial content - just focus the editor
      setHasLoadedInitialContent(true);
      setTimeout(() => {
        editor.focus();
      }, 100);
    }
  }, [editor, value, hasLoadedInitialContent]);

  return null;
} 