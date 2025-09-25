export { RichTextEditor } from './RichTextEditor';
export { EditorToolbar } from './EditorToolbar';
export { WordCounter } from './WordCounter';
export { AutoSavePlugin } from './AutoSavePlugin';
export { EditorTheme, editorStyles } from './EditorTheme';
export { 
  editorConfig, 
  EDITOR_FEATURES,
  KEYBOARD_SHORTCUTS,
  STORY_EDITOR_CONFIG,
  MARKDOWN_TRANSFORMERS 
} from './editorConfig';

// Re-export commonly used types
export type { EditorThemeClasses } from 'lexical';

export { default as LexicalEditor } from './LexicalEditor';
export { default as LexicalEditorToolbar } from './LexicalEditorToolbar';
export { default as ImagePlugin, InsertImageButton, INSERT_IMAGE_COMMAND } from './plugins/ImagePlugin';
export { default as FloatingTextToolbar } from './plugins/FloatingTextToolbar';
export { ImageNode, $createImageNode, $isImageNode } from './nodes/ImageNode';
export { default as ImageComponent } from './nodes/ImageComponent'; 