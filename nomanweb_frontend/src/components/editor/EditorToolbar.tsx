'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  UNDO_COMMAND,
  REDO_COMMAND,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
} from 'lexical';
import {
  $isHeadingNode,
  $createHeadingNode,
  HeadingTagType,
} from '@lexical/rich-text';
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
} from '@lexical/list';
import { $createQuoteNode, $isQuoteNode } from '@lexical/rich-text';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  Minus,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Indent,
  Outdent,
  Type,
  Moon,
  Sun,
} from 'lucide-react';

interface EditorToolbarProps {
  isDarkMode?: boolean;
  onDarkModeToggle?: () => void;
  onImageUpload?: () => void;
}

interface ToolbarState {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isHeading: string;
  isList: string;
  isQuote: boolean;
  isLink: boolean;
  alignment: string;
  canUndo: boolean;
  canRedo: boolean;
}

export function EditorToolbar({ 
  isDarkMode = false, 
  onDarkModeToggle,
  onImageUpload 
}: EditorToolbarProps) {
  const [editor] = useLexicalComposerContext();
  const [toolbarState, setToolbarState] = useState<ToolbarState>({
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isHeading: '',
    isList: '',
    isQuote: false,
    isLink: false,
    alignment: 'left',
    canUndo: false,
    canRedo: false,
  });

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const element = anchorNode.getKey() === 'root' 
        ? anchorNode 
        : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      setToolbarState({
        isBold: selection.hasFormat('bold'),
        isItalic: selection.hasFormat('italic'),
        isUnderline: selection.hasFormat('underline'),
        isHeading: $isHeadingNode(element) ? element.getTag() : '',
        isList: $isListNode(element) ? element.getListType() : '',
        isQuote: $isQuoteNode(element),
        isLink: $isLinkNode(anchorNode),
        alignment: elementDOM?.style.textAlign || 'left',
        canUndo: editor.canUndo(),
        canRedo: editor.canRedo(),
      });
    }
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatText = (format: 'bold' | 'italic' | 'underline') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatHeading = (headingSize: HeadingTagType) => {
    if (toolbarState.isHeading !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const element = anchorNode.getKey() === 'root' 
            ? anchorNode 
            : anchorNode.getTopLevelElementOrThrow();
          
          const headingNode = $createHeadingNode(headingSize);
          element.replace(headingNode);
        }
      });
    }
  };

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const element = anchorNode.getKey() === 'root' 
          ? anchorNode 
          : anchorNode.getTopLevelElementOrThrow();
        
        if ($isHeadingNode(element) || $isListNode(element) || $isQuoteNode(element)) {
          element.replace(element.createParagraphNode());
        }
      }
    });
  };

  const formatList = (listType: 'number' | 'bullet') => {
    if (toolbarState.isList === listType) {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else {
      const command = listType === 'number' 
        ? INSERT_ORDERED_LIST_COMMAND 
        : INSERT_UNORDERED_LIST_COMMAND;
      editor.dispatchCommand(command, undefined);
    }
  };

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const element = anchorNode.getKey() === 'root' 
          ? anchorNode 
          : anchorNode.getTopLevelElementOrThrow();
        
        if ($isQuoteNode(element)) {
          element.replace(element.createParagraphNode());
        } else {
          const quoteNode = $createQuoteNode();
          element.replace(quoteNode);
        }
      }
    });
  };

  const formatAlignment = (alignment: 'left' | 'center' | 'right') => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
  };

  const insertLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    }
  };

  const insertHorizontalRule = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const element = anchorNode.getKey() === 'root' 
          ? anchorNode 
          : anchorNode.getTopLevelElementOrThrow();
        
        // Create a horizontal rule (divider)
        const hrNode = element.createParagraphNode();
        hrNode.append(element.createTextNode('***'));
        element.insertAfter(hrNode);
      }
    });
  };

  const handleUndo = () => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  };

  const handleRedo = () => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
  };

  const handleIndent = () => {
    editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
  };

  const handleOutdent = () => {
    editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
  };

  const ToolbarButton = ({ 
    onClick, 
    active = false, 
    disabled = false, 
    children, 
    title 
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-2 rounded transition-colors
        ${active 
          ? 'bg-blue-500 text-white' 
          : isDarkMode 
            ? 'text-gray-300 hover:bg-gray-700' 
            : 'text-gray-600 hover:bg-gray-100'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {children}
    </button>
  );

  const ToolbarSeparator = () => (
    <div className={`w-px h-6 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
  );

  const ToolbarSelect = ({ 
    value, 
    onChange, 
    options, 
    title 
  }: {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    title: string;
  }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      title={title}
      className={`
        px-3 py-1 rounded border
        ${isDarkMode 
          ? 'bg-gray-800 border-gray-600 text-gray-300' 
          : 'bg-white border-gray-300 text-gray-700'
        }
        cursor-pointer
      `}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  return (
    <div className={`
      flex flex-wrap items-center gap-1 p-3 border-b
      ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}
    `}>
      {/* Undo/Redo */}
      <ToolbarButton
        onClick={handleUndo}
        disabled={!toolbarState.canUndo}
        title="Undo (Ctrl+Z)"
      >
        <Undo size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={handleRedo}
        disabled={!toolbarState.canRedo}
        title="Redo (Ctrl+Y)"
      >
        <Redo size={16} />
      </ToolbarButton>
      
      <ToolbarSeparator />

      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => formatText('bold')}
        active={toolbarState.isBold}
        title="Bold (Ctrl+B)"
      >
        <Bold size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatText('italic')}
        active={toolbarState.isItalic}
        title="Italic (Ctrl+I)"
      >
        <Italic size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatText('underline')}
        active={toolbarState.isUnderline}
        title="Underline (Ctrl+U)"
      >
        <Underline size={16} />
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Headings */}
      <ToolbarSelect
        value={toolbarState.isHeading || 'paragraph'}
        onChange={(value) => {
          if (value === 'paragraph') {
            formatParagraph();
          } else {
            formatHeading(value as HeadingTagType);
          }
        }}
        title="Text Style"
        options={[
          { value: 'paragraph', label: 'Paragraph' },
          { value: 'h1', label: 'Heading 1' },
          { value: 'h2', label: 'Heading 2' },
          { value: 'h3', label: 'Heading 3' },
        ]}
      />

      <ToolbarSeparator />

      {/* Text Alignment */}
      <ToolbarButton
        onClick={() => formatAlignment('left')}
        active={toolbarState.alignment === 'left'}
        title="Align Left"
      >
        <AlignLeft size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatAlignment('center')}
        active={toolbarState.alignment === 'center'}
        title="Align Center"
      >
        <AlignCenter size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatAlignment('right')}
        active={toolbarState.alignment === 'right'}
        title="Align Right"
      >
        <AlignRight size={16} />
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Lists */}
      <ToolbarButton
        onClick={() => formatList('bullet')}
        active={toolbarState.isList === 'bullet'}
        title="Bullet List"
      >
        <List size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatList('number')}
        active={toolbarState.isList === 'number'}
        title="Numbered List"
      >
        <ListOrdered size={16} />
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Indentation */}
      <ToolbarButton
        onClick={handleOutdent}
        title="Decrease Indent"
      >
        <Outdent size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={handleIndent}
        title="Increase Indent"
      >
        <Indent size={16} />
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Quote */}
      <ToolbarButton
        onClick={formatQuote}
        active={toolbarState.isQuote}
        title="Blockquote"
      >
        <Quote size={16} />
      </ToolbarButton>

      {/* Link */}
      <ToolbarButton
        onClick={insertLink}
        active={toolbarState.isLink}
        title="Insert Link"
      >
        <Link size={16} />
      </ToolbarButton>

      {/* Horizontal Rule */}
      <ToolbarButton
        onClick={insertHorizontalRule}
        title="Insert Scene Break (***)"
      >
        <Minus size={16} />
      </ToolbarButton>

      {/* Image Upload */}
      {onImageUpload && (
        <ToolbarButton
          onClick={onImageUpload}
          title="Insert Image"
        >
          <Image size={16} />
        </ToolbarButton>
      )}

      <ToolbarSeparator />

      {/* Dark Mode Toggle */}
      {onDarkModeToggle && (
        <ToolbarButton
          onClick={onDarkModeToggle}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        </ToolbarButton>
      )}
    </div>
  );
} 