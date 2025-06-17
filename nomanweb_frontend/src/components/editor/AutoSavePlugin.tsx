'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { Save, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface AutoSavePluginProps {
  onAutoSave: (content: string) => void;
  interval?: number; // milliseconds
  showStatus?: boolean;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function AutoSavePlugin({
  onAutoSave,
  interval = 30000, // 30 seconds default
  showStatus = true
}: AutoSavePluginProps) {
  const [editor] = useLexicalComposerContext();
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>('');
  const isManualSaveRef = useRef(false);

  const saveContent = useCallback(async () => {
    if (isManualSaveRef.current) return;

    setStatus('saving');

    try {
      editor.getEditorState().read(() => {
        const root = $getRoot();
        const htmlString = $generateHtmlFromNodes(editor, null);
        
        // Only save if content has changed
        if (htmlString !== lastContentRef.current) {
          lastContentRef.current = htmlString;
          onAutoSave(htmlString);
          setLastSaved(new Date());
          setStatus('saved');
          
          // Reset status after a delay
          setTimeout(() => {
            setStatus('idle');
          }, 2000);
        } else {
          setStatus('idle');
        }
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
      setStatus('error');
      
      // Reset status after a delay
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    }
  }, [editor, onAutoSave]);

  const scheduleAutoSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveContent();
    }, interval);
  }, [saveContent, interval]);

  // Manual save function
  const saveNow = useCallback(() => {
    isManualSaveRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    saveContent().finally(() => {
      isManualSaveRef.current = false;
      scheduleAutoSave();
    });
  }, [saveContent, scheduleAutoSave]);

  // Set up auto-save on content changes
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
      // Only schedule auto-save if there are actual changes
      if (dirtyElements.size > 0 || dirtyLeaves.size > 0) {
        scheduleAutoSave();
      }
    });
  }, [editor, scheduleAutoSave]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+S (Mac) or Ctrl+S (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        saveNow();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [saveNow]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (status === 'saving' || lastContentRef.current) {
        event.preventDefault();
        event.returnValue = '';
        saveContent();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [status, saveContent]);

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'saving':
        return <Clock size={12} className="animate-spin" />;
      case 'saved':
        return <CheckCircle size={12} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={12} className="text-red-500" />;
      default:
        return <Save size={12} />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved';
      case 'error':
        return 'Save failed';
      default:
        return lastSaved ? `Last saved ${formatLastSaved(lastSaved)}` : 'Not saved';
    }
  };

  if (!showStatus) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={saveNow}
        disabled={status === 'saving'}
        className="flex items-center space-x-1 px-2 py-1 text-xs rounded hover:bg-gray-100 disabled:opacity-50"
        title="Save now (Ctrl+S)"
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </button>
      
      {status === 'error' && (
        <button
          onClick={saveNow}
          className="text-xs text-red-600 hover:text-red-800"
          title="Retry save"
        >
          Retry
        </button>
      )}
    </div>
  );
} 