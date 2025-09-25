'use client';

import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';

interface TypingDetectionPluginProps {
  onTypingStart?: () => void;
  onTypingEnd?: () => void;
  sendContentUpdate?: (content: string, position: number, length: number, operation: string) => void;
}

export default function TypingDetectionPlugin({ 
  onTypingStart, 
  onTypingEnd,
  sendContentUpdate
}: TypingDetectionPluginProps) {
  const [editor] = useLexicalComposerContext();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore modifier keys and navigation keys
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        return;
      }
      
      // Ignore navigation keys
      const navigationKeys = [
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Home', 'End', 'PageUp', 'PageDown',
        'Tab', 'Escape', 'Enter'
      ];
      
      if (navigationKeys.includes(event.key)) {
        return;
      }

      // Signal typing start immediately
      if (!isTypingRef.current && onTypingStart) {
        isTypingRef.current = true;
        onTypingStart();
        
        // Also send content update immediately for responsive typing indicators
        if (sendContentUpdate) {
          // Get current content from editor
          editor.getEditorState().read(() => {
            const root = $getRoot();
            const textContent = root.getTextContent();
            console.log('TypingDetectionPlugin - Sending immediate content update for typing indicator');
            sendContentUpdate(textContent, 0, textContent.length, 'replace');
          });
        }
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set typing end timeout
      typingTimeoutRef.current = setTimeout(() => {
        if (isTypingRef.current && onTypingEnd) {
          isTypingRef.current = false;
          onTypingEnd();
        }
      }, 800); // Reduced from 1000ms to 800ms for faster response
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // For some keys, we want to keep typing status active
      if (event.key === 'Enter' || event.key === ' ') {
        // Signal typing start for these keys
        if (!isTypingRef.current && onTypingStart) {
          isTypingRef.current = true;
          onTypingStart();
          
          // Also send content update immediately for responsive typing indicators
          if (sendContentUpdate) {
            // Get current content from editor
            editor.getEditorState().read(() => {
              const root = $getRoot();
              const textContent = root.getTextContent();
              console.log('TypingDetectionPlugin - Sending immediate content update for typing indicator (keyup)');
              sendContentUpdate(textContent, 0, textContent.length, 'replace');
            });
          }
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Set typing end timeout
        typingTimeoutRef.current = setTimeout(() => {
          if (isTypingRef.current && onTypingEnd) {
            isTypingRef.current = false;
            onTypingEnd();
          }
        }, 800); // Reduced from 1000ms to 800ms for faster response
      }
    };

    // Add event listeners to the editor root
    const editorRoot = editor.getRootElement();
    if (editorRoot) {
      editorRoot.addEventListener('keydown', handleKeyDown);
      editorRoot.addEventListener('keyup', handleKeyUp);
    }

    return () => {
      if (editorRoot) {
        editorRoot.removeEventListener('keydown', handleKeyDown);
        editorRoot.removeEventListener('keyup', handleKeyUp);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [editor, onTypingStart, onTypingEnd, sendContentUpdate]);

  return null;
} 