'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
  FORMAT_TEXT_COMMAND,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';
import { Bold, Italic, Underline, Code, Strikethrough } from 'lucide-react';
import { cn } from '@/lib/utils';

const LowPriority = 1;

function positionToolbar(toolbar: HTMLDivElement, rect: DOMRect | null) {
  if (rect === null) {
    toolbar.style.opacity = '0';
    toolbar.style.top = '-1000px';
    toolbar.style.left = '-1000px';
    toolbar.style.pointerEvents = 'none';
  } else {
    toolbar.style.opacity = '1';
    toolbar.style.pointerEvents = 'all';
    toolbar.style.top = `${rect.top + window.pageYOffset - 45}px`;
    toolbar.style.left = `${
      rect.left + window.pageXOffset - toolbar.offsetWidth / 2 + rect.width / 2
    }px`;
  }
}

interface FloatingTextToolbarProps {
  editor: any;
}

export default function FloatingTextToolbar({ editor }: FloatingTextToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    const toolbarElem = toolbarRef.current;
    const nativeSelection = window.getSelection();

    if (toolbarElem === null) {
      return;
    }

    const rootElement = editor.getRootElement();

    if (
      selection !== null &&
      nativeSelection &&
      !nativeSelection.isCollapsed &&
      $isRangeSelection(selection) &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      // Update formatting states
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsCode(selection.hasFormat('code'));

      const domRange = nativeSelection.getRangeAt(0);
      let rect;
      if (nativeSelection.anchorNode === rootElement) {
        let inner = rootElement;
        while (inner.firstElementChild != null) {
          inner = inner.firstElementChild;
        }
        rect = inner.getBoundingClientRect();
      } else {
        rect = domRange.getBoundingClientRect();
      }

      positionToolbar(toolbarElem, rect);
    } else {
      positionToolbar(toolbarElem, null);
    }

    return true;
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }: any) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return true;
        },
        LowPriority
      )
    );
  }, [editor, updateToolbar]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      updateToolbar();
    });
  }, [editor, updateToolbar]);

  const formatText = (format: string) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  return (
    <div
      ref={toolbarRef}
      className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg opacity-0 pointer-events-none floating-text-toolbar"
      style={{
        top: '-1000px',
        left: '-1000px',
        transition: 'opacity 0.1s',
      }}
      data-lexical-toolbar="true"
    >
      <div className="flex items-center p-1 gap-1">
        <button
          type="button"
          onClick={() => formatText('bold')}
          className={cn(
            'p-2 rounded hover:bg-gray-100 flex items-center justify-center transition-colors',
            isBold && 'bg-blue-100 text-blue-600'
          )}
          aria-label="Bold"
          onMouseDown={(e) => e.preventDefault()}
          data-lexical-button="true"
        >
          <Bold className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => formatText('italic')}
          className={cn(
            'p-2 rounded hover:bg-gray-100 flex items-center justify-center transition-colors',
            isItalic && 'bg-blue-100 text-blue-600'
          )}
          aria-label="Italic"
          onMouseDown={(e) => e.preventDefault()}
          data-lexical-button="true"
        >
          <Italic className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => formatText('underline')}
          className={cn(
            'p-2 rounded hover:bg-gray-100 flex items-center justify-center transition-colors',
            isUnderline && 'bg-blue-100 text-blue-600'
          )}
          aria-label="Underline"
          onMouseDown={(e) => e.preventDefault()}
          data-lexical-button="true"
        >
          <Underline className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => formatText('strikethrough')}
          className={cn(
            'p-2 rounded hover:bg-gray-100 flex items-center justify-center transition-colors',
            isStrikethrough && 'bg-blue-100 text-blue-600'
          )}
          aria-label="Strikethrough"
          onMouseDown={(e) => e.preventDefault()}
          data-lexical-button="true"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => formatText('code')}
          className={cn(
            'p-2 rounded hover:bg-gray-100 flex items-center justify-center transition-colors',
            isCode && 'bg-blue-100 text-blue-600'
          )}
          aria-label="Code"
          onMouseDown={(e) => e.preventDefault()}
          data-lexical-button="true"
        >
          <Code className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
} 