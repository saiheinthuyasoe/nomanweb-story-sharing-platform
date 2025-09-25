'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $getSelection, EditorState } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { $convertFromMarkdownString, $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown';

import { EditorToolbar } from './EditorToolbar';
import { WordCounter } from './WordCounter';
import { AutoSavePlugin } from './AutoSavePlugin';
import { EditorTheme } from './EditorTheme';
import { editorConfig } from './editorConfig';

interface RichTextEditorProps {
  value?: string;
  onChange?: (content: string, wordCount: number, characterCount: number) => void;
  onAutoSave?: (content: string) => void;
  placeholder?: string;
  autoSaveInterval?: number; // milliseconds
  isDarkMode?: boolean;
  readOnly?: boolean;
  className?: string;
}

function EditorCapturePlugin({ onChange }: { onChange: (content: string, wordCount: number, characterCount: number) => void }) {
  const [editor] = useLexicalComposerContext();

  const handleEditorChange = useCallback((editorState: EditorState) => {
    editorState.read(() => {
      const root = $getRoot();
      const htmlString = $generateHtmlFromNodes(editor, null);
      const textContent = root.getTextContent();
      
      // Calculate word and character counts
      const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
      const wordCount = words.length;
      const characterCount = textContent.length;
      
      onChange(htmlString, wordCount, characterCount);
    });
  }, [editor, onChange]);

  return <OnChangePlugin onChange={handleEditorChange} />;
}

export function RichTextEditor({
  value = '',
  onChange,
  onAutoSave,
  placeholder = 'Start writing your story...',
  autoSaveInterval = 30000, // 30 seconds
  isDarkMode = false,
  readOnly = false,
  className = ''
}: RichTextEditorProps) {
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);

  const initialConfig = {
    ...editorConfig,
    editable: !readOnly,
    theme: isDarkMode ? EditorTheme.dark : EditorTheme.light,
  };

  const handleContentChange = useCallback((content: string, words: number, characters: number) => {
    setWordCount(words);
    setCharacterCount(characters);
    onChange?.(content, words, characters);
  }, [onChange]);

  const handleAutoSave = useCallback((content: string) => {
    onAutoSave?.(content);
  }, [onAutoSave]);

  return (
    <div className={`lexical-editor ${isDarkMode ? 'dark' : ''} ${className}`}>
      <LexicalComposer initialConfig={initialConfig}>
        {/* Editor Toolbar */}
        {!readOnly && isToolbarVisible && (
          <div className="editor-toolbar-container">
            <EditorToolbar isDarkMode={isDarkMode} />
          </div>
        )}

        {/* Main Editor */}
        <div className="editor-container">
          <div className="editor-inner">
            <RichTextPlugin
              contentEditable={
                <ContentEditable 
                  className="editor-content"
                  style={{
                    minHeight: '300px',
                    padding: '16px',
                    outline: 'none',
                    fontSize: '16px',
                    lineHeight: '1.6',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}
                />
              }
              placeholder={
                <div className="editor-placeholder">
                  {placeholder}
                </div>
              }
              ErrorBoundary={() => <div>Something went wrong</div>}
            />

            {/* Plugins */}
            <HistoryPlugin />
            <AutoFocusPlugin />
            <LinkPlugin />
            <ListPlugin />
            <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
            
            {/* Custom Plugins */}
            <EditorCapturePlugin onChange={handleContentChange} />
            {onAutoSave && (
              <AutoSavePlugin 
                onAutoSave={handleAutoSave}
                interval={autoSaveInterval}
              />
            )}
          </div>
        </div>

        {/* Word Counter */}
        <div className="editor-footer">
          <WordCounter 
            wordCount={wordCount}
            characterCount={characterCount}
            isDarkMode={isDarkMode}
          />
          
          {!readOnly && (
            <button
              onClick={() => setIsToolbarVisible(!isToolbarVisible)}
              className="toolbar-toggle-btn"
            >
              {isToolbarVisible ? 'Hide Toolbar' : 'Show Toolbar'}
            </button>
          )}
        </div>
      </LexicalComposer>

      <style jsx>{`
        .lexical-editor {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          overflow: hidden;
        }

        .lexical-editor.dark {
          background: #1a1a1a;
          border-color: #374151;
        }

        .editor-toolbar-container {
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .dark .editor-toolbar-container {
          border-bottom-color: #374151;
          background: #111827;
        }

        .editor-container {
          position: relative;
        }

        .editor-inner {
          position: relative;
        }

        .editor-content {
          color: #1f2937;
        }

        .dark .editor-content {
          color: #f9fafb;
        }

        .editor-placeholder {
          position: absolute;
          top: 16px;
          left: 16px;
          color: #9ca3af;
          pointer-events: none;
          font-size: 16px;
        }

        .editor-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          font-size: 14px;
        }

        .dark .editor-footer {
          background: #111827;
          border-top-color: #374151;
        }

        .toolbar-toggle-btn {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .toolbar-toggle-btn:hover {
          background: #e5e7eb;
          color: #374151;
        }

        .dark .toolbar-toggle-btn {
          color: #9ca3af;
        }

        .dark .toolbar-toggle-btn:hover {
          background: #374151;
          color: #f3f4f6;
        }
      `}</style>
    </div>
  );
} 