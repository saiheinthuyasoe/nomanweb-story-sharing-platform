'use client';

import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $getSelection } from 'lexical';
import { $isRangeSelection } from 'lexical';

interface CursorTrackingPluginProps {
  onCursorChange?: (position: number, selectionStart: number, selectionEnd: number) => void;
}

export default function CursorTrackingPlugin({ onCursorChange }: CursorTrackingPluginProps) {
  const [editor] = useLexicalComposerContext();
  const lastCursorPositionRef = useRef<number>(0);
  const lastSelectionStartRef = useRef<number>(0);
  const lastSelectionEndRef = useRef<number>(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleEditorUpdate = () => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        
        if ($isRangeSelection(selection)) {
          const root = $getRoot();
          const textContent = root.getTextContent();
          
          // Calculate cursor position
          const cursorPosition = selection.anchor.offset;
          
          // Calculate selection range
          const selectionStart = Math.min(selection.anchor.offset, selection.focus.offset);
          const selectionEnd = Math.max(selection.anchor.offset, selection.focus.offset);
          
          // Only send update if position actually changed
          if (cursorPosition !== lastCursorPositionRef.current ||
              selectionStart !== lastSelectionStartRef.current ||
              selectionEnd !== lastSelectionEndRef.current) {
            
            // Clear existing timeout
            if (debounceTimeoutRef.current) {
              clearTimeout(debounceTimeoutRef.current);
            }
            
            // Debounce cursor updates to prevent too many messages
            debounceTimeoutRef.current = setTimeout(() => {
              console.log('CursorTrackingPlugin: Sending cursor update:', {
                position: cursorPosition,
                selectionStart,
                selectionEnd,
                textLength: textContent.length
              });
              
              onCursorChange?.(cursorPosition, selectionStart, selectionEnd);
              
              // Update refs
              lastCursorPositionRef.current = cursorPosition;
              lastSelectionStartRef.current = selectionStart;
              lastSelectionEndRef.current = selectionEnd;
            }, 50); // Very fast debounce for responsive cursor tracking
          }
        }
      });
    };

    // Listen for editor updates
    const removeUpdateListener = editor.registerUpdateListener(handleEditorUpdate);

    return () => {
      removeUpdateListener();
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [editor, onCursorChange]);

  return null;
} 