import type { InitialConfigType } from '@lexical/react/LexicalComposer';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { MarkNode } from '@lexical/mark';
import { OverflowNode } from '@lexical/overflow';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';

import { EditorTheme } from './EditorTheme';

// Error boundary component
function onError(error: Error) {
  console.error('Lexical Editor Error:', error);
}

// Base editor configuration
export const editorConfig: InitialConfigType = {
  namespace: 'StoryEditor',
  theme: EditorTheme.light,
  onError,
  nodes: [
    // Rich text nodes
    HeadingNode,
    QuoteNode,
    
    // List nodes
    ListNode,
    ListItemNode,
    
    // Code nodes
    CodeNode,
    CodeHighlightNode,
    
    // Link nodes
    LinkNode,
    AutoLinkNode,
    
    // Additional nodes
    MarkNode,
    OverflowNode,
    HorizontalRuleNode,
  ],
  editorState: null,
  editable: true,
};

// URL matcher for auto-linking
export const URL_MATCHER = /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

// Email matcher for auto-linking  
export const EMAIL_MATCHER = /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

// Placeholder text for empty editor
export const EDITOR_PLACEHOLDER = 'Start writing your story...';

// Editor feature flags
export const EDITOR_FEATURES = {
  // Basic formatting
  BOLD: true,
  ITALIC: true,
  UNDERLINE: true,
  
  // Headings
  HEADINGS: true,
  
  // Lists
  ORDERED_LISTS: true,
  UNORDERED_LISTS: true,
  
  // Advanced features
  BLOCKQUOTES: true,
  LINKS: true,
  AUTO_LINK: true,
  CODE_BLOCKS: true,
  
  // Layout
  ALIGNMENT: true,
  INDENTATION: true,
  
  // Media
  IMAGES: true,
  HORIZONTAL_RULES: true,
  
  // Editor features
  MARKDOWN_SHORTCUTS: true,
  HISTORY: true,
  AUTO_SAVE: true,
  WORD_COUNT: true,
  
  // Accessibility
  TAB_INDENTATION: true,
  KEYBOARD_SHORTCUTS: true,
};

// Keyboard shortcuts configuration
export const KEYBOARD_SHORTCUTS = {
  BOLD: 'Ctrl+B',
  ITALIC: 'Ctrl+I', 
  UNDERLINE: 'Ctrl+U',
  UNDO: 'Ctrl+Z',
  REDO: 'Ctrl+Y',
  SAVE: 'Ctrl+S',
  LINK: 'Ctrl+K',
  HEADING_1: 'Ctrl+Alt+1',
  HEADING_2: 'Ctrl+Alt+2',
  HEADING_3: 'Ctrl+Alt+3',
  BLOCKQUOTE: 'Ctrl+Shift+.',
  ORDERED_LIST: 'Ctrl+Shift+7',
  UNORDERED_LIST: 'Ctrl+Shift+8',
  INDENT: 'Tab',
  OUTDENT: 'Shift+Tab',
};

// Story writing specific configurations
export const STORY_EDITOR_CONFIG = {
  // Auto-save settings
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  AUTO_SAVE_ON_BLUR: true,
  
  // Word count settings
  SHOW_WORD_COUNT: true,
  SHOW_CHARACTER_COUNT: true,
  SHOW_READING_TIME: true,
  
  // Writing goals
  DEFAULT_WORD_TARGET: 2000,
  CHAPTER_WORD_MINIMUM: 500,
  
  // Performance settings
  DEBOUNCE_DELAY: 300, // milliseconds
  MAX_HISTORY_SIZE: 50,
  
  // UI settings
  TOOLBAR_STICKY: true,
  DARK_MODE_DEFAULT: false,
  SHOW_LINE_NUMBERS: false,
  
  // Content settings
  MAX_CONTENT_LENGTH: 50000, // characters
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
};

// Markdown transformers configuration
export const MARKDOWN_TRANSFORMERS = [
  // Headers
  { type: 'heading', level: 1, trigger: '# ' },
  { type: 'heading', level: 2, trigger: '## ' },
  { type: 'heading', level: 3, trigger: '### ' },
  
  // Lists
  { type: 'unordered-list', trigger: '- ' },
  { type: 'unordered-list', trigger: '* ' },
  { type: 'ordered-list', trigger: '1. ' },
  
  // Formatting
  { type: 'bold', trigger: '**' },
  { type: 'italic', trigger: '*' },
  { type: 'italic', trigger: '_' },
  { type: 'code', trigger: '`' },
  
  // Blockquote
  { type: 'blockquote', trigger: '> ' },
  
  // Horizontal rule
  { type: 'horizontal-rule', trigger: '---' },
  { type: 'horizontal-rule', trigger: '***' },
];

// Export all configurations
export default {
  editorConfig,
  EDITOR_FEATURES,
  KEYBOARD_SHORTCUTS,
  STORY_EDITOR_CONFIG,
  MARKDOWN_TRANSFORMERS,
  URL_MATCHER,
  EMAIL_MATCHER,
  EDITOR_PLACEHOLDER,
}; 