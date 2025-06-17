'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from 'lexical';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
} from '@lexical/list';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Undo2,
  Redo2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InsertImageButton } from './plugins/ImagePlugin';

const LowPriority = 1;

function Divider() {
  // Check if we're in dark mode by looking at parent container
  const toolbar = document.querySelector('[data-lexical-toolbar="true"]');
  const container = toolbar?.closest('.dark');
  const isDarkMode = !!container;
  
  return <div className={cn(
    'w-px h-6 mx-1',
    isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
  )} />;
}

export default function LexicalEditorToolbar() {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [blockType, setBlockType] = useState('paragraph');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);

  // Check if we're in dark mode by looking at parent container
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      const toolbar = document.querySelector('[data-lexical-toolbar="true"]');
      const container = toolbar?.closest('.dark');
      setIsDarkMode(!!container);
    };

    checkDarkMode();
    
    // Set up mutation observer to watch for dark mode changes
    const observer = new MutationObserver(checkDarkMode);
    const container = document.querySelector('.lexical-editor-container');
    if (container) {
      observer.observe(container, { attributes: true, attributeFilter: ['class'] });
    }

    return () => observer.disconnect();
  }, []);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsCode(selection.hasFormat('code'));

      // Update block type for lists only
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      
      if ($isListNode(element)) {
        const parentList = element.getParent();
        const type = $isListNode(parentList) ? parentList.getTag() : element.getTag();
        setBlockType(type);
      } else {
        setBlockType('paragraph');
      }
    }
  }, [activeEditor]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        updateToolbar();
        setActiveEditor(newEditor);
        return false;
      },
      LowPriority,
    );
  }, [editor, updateToolbar]);

  useEffect(() => {
    return editor.registerCommand(
      CAN_UNDO_COMMAND,
      (payload) => {
        setCanUndo(payload);
        return false;
      },
      LowPriority,
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      CAN_REDO_COMMAND,
      (payload) => {
        setCanRedo(payload);
        return false;
      },
      LowPriority,
    );
  }, [editor]);

  const formatBulletList = () => {
    if (blockType !== 'ul') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatNumberedList = () => {
    if (blockType !== 'ol') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  return (
    <div className={cn(
      'flex items-center gap-1 p-2 border-b lexical-toolbar',
      isDarkMode 
        ? 'bg-gray-700 border-gray-600' 
        : 'bg-gray-50 border-gray-200'
    )} data-lexical-toolbar="true">
      {/* Undo/Redo */}
      <button
        type="button"
        disabled={!canUndo}
        onClick={() => {
          activeEditor.dispatchCommand(UNDO_COMMAND, undefined);
        }}
        className={cn(
          'p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center',
          isDarkMode 
            ? 'hover:bg-gray-600 text-gray-200' 
            : 'hover:bg-gray-200 text-gray-700'
        )}
        aria-label="Undo"
        data-lexical-button="true"
      >
        <Undo2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        disabled={!canRedo}
        onClick={() => {
          activeEditor.dispatchCommand(REDO_COMMAND, undefined);
        }}
        className={cn(
          'p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center',
          isDarkMode 
            ? 'hover:bg-gray-600 text-gray-200' 
            : 'hover:bg-gray-200 text-gray-700'
        )}
        aria-label="Redo"
        data-lexical-button="true"
      >
        <Redo2 className="w-4 h-4" />
      </button>

      <Divider />

      {/* Text Formatting */}
      <button
        type="button"
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
        }}
        className={cn(
          'p-2 rounded flex items-center justify-center',
          isBold 
            ? 'bg-blue-100 text-blue-600' 
            : isDarkMode 
              ? 'hover:bg-gray-600 text-gray-200' 
              : 'hover:bg-gray-200 text-gray-700'
        )}
        aria-label="Format Bold"
        data-lexical-button="true"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
        }}
        className={cn(
          'p-2 rounded flex items-center justify-center',
          isItalic 
            ? 'bg-blue-100 text-blue-600' 
            : isDarkMode 
              ? 'hover:bg-gray-600 text-gray-200' 
              : 'hover:bg-gray-200 text-gray-700'
        )}
        aria-label="Format Italic"
        data-lexical-button="true"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
        }}
        className={cn(
          'p-2 rounded flex items-center justify-center',
          isUnderline 
            ? 'bg-blue-100 text-blue-600' 
            : isDarkMode 
              ? 'hover:bg-gray-600 text-gray-200' 
              : 'hover:bg-gray-200 text-gray-700'
        )}
        aria-label="Format Underline"
        data-lexical-button="true"
      >
        <Underline className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
        }}
        className={cn(
          'p-2 rounded flex items-center justify-center',
          isStrikethrough 
            ? 'bg-blue-100 text-blue-600' 
            : isDarkMode 
              ? 'hover:bg-gray-600 text-gray-200' 
              : 'hover:bg-gray-200 text-gray-700'
        )}
        aria-label="Format Strikethrough"
        data-lexical-button="true"
      >
        <Strikethrough className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
        }}
        className={cn(
          'p-2 rounded flex items-center justify-center',
          isCode 
            ? 'bg-blue-100 text-blue-600' 
            : isDarkMode 
              ? 'hover:bg-gray-600 text-gray-200' 
              : 'hover:bg-gray-200 text-gray-700'
        )}
        aria-label="Format Code"
        data-lexical-button="true"
      >
        <Code className="w-4 h-4" />
      </button>

      <Divider />

      {/* Image */}
      <InsertImageButton editor={activeEditor} />

      <Divider />

      {/* Lists */}
      <button
        type="button"
        onClick={formatBulletList}
        className={cn(
          'p-2 rounded flex items-center justify-center',
          blockType === 'ul' 
            ? 'bg-blue-100 text-blue-600' 
            : isDarkMode 
              ? 'hover:bg-gray-600 text-gray-200' 
              : 'hover:bg-gray-200 text-gray-700'
        )}
        aria-label="Bullet List"
        data-lexical-button="true"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={formatNumberedList}
        className={cn(
          'p-2 rounded flex items-center justify-center',
          blockType === 'ol' 
            ? 'bg-blue-100 text-blue-600' 
            : isDarkMode 
              ? 'hover:bg-gray-600 text-gray-200' 
              : 'hover:bg-gray-200 text-gray-700'
        )}
        aria-label="Numbered List"
        data-lexical-button="true"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      <Divider />

      {/* Alignment */}
      <button
        type="button"
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
        }}
        className={cn(
          'p-2 rounded flex items-center justify-center',
          isDarkMode 
            ? 'hover:bg-gray-600 text-gray-200' 
            : 'hover:bg-gray-200 text-gray-700'
        )}
        aria-label="Align Left"
        data-lexical-button="true"
      >
        <AlignLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
        }}
        className={cn(
          'p-2 rounded flex items-center justify-center',
          isDarkMode 
            ? 'hover:bg-gray-600 text-gray-200' 
            : 'hover:bg-gray-200 text-gray-700'
        )}
        aria-label="Align Center"
        data-lexical-button="true"
      >
        <AlignCenter className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
        }}
        className={cn(
          'p-2 rounded flex items-center justify-center',
          isDarkMode 
            ? 'hover:bg-gray-600 text-gray-200' 
            : 'hover:bg-gray-200 text-gray-700'
        )}
        aria-label="Align Right"
        data-lexical-button="true"
      >
        <AlignRight className="w-4 h-4" />
      </button>
    </div>
  );
} 