import type { EditorThemeClasses } from 'lexical';

const baseTheme: EditorThemeClasses = {
  paragraph: 'editor-paragraph',
  quote: 'editor-quote',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5',
    h6: 'editor-heading-h6',
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
  link: 'editor-link',
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
  codeHighlight: {
    atrule: 'editor-tokenAttr',
    attr: 'editor-tokenAttr',
    boolean: 'editor-tokenProperty',
    builtin: 'editor-tokenSelector',
    cdata: 'editor-tokenComment',
    char: 'editor-tokenSelector',
    class: 'editor-tokenFunction',
    'class-name': 'editor-tokenFunction',
    comment: 'editor-tokenComment',
    constant: 'editor-tokenProperty',
    deleted: 'editor-tokenProperty',
    doctype: 'editor-tokenComment',
    entity: 'editor-tokenOperator',
    function: 'editor-tokenFunction',
    important: 'editor-tokenVariable',
    inserted: 'editor-tokenSelector',
    keyword: 'editor-tokenAttr',
    namespace: 'editor-tokenVariable',
    number: 'editor-tokenProperty',
    operator: 'editor-tokenOperator',
    prolog: 'editor-tokenComment',
    property: 'editor-tokenProperty',
    punctuation: 'editor-tokenPunctuation',
    regex: 'editor-tokenVariable',
    selector: 'editor-tokenSelector',
    string: 'editor-tokenSelector',
    symbol: 'editor-tokenProperty',
    tag: 'editor-tokenProperty',
    url: 'editor-tokenOperator',
    variable: 'editor-tokenVariable',
  },
};

// Light theme with global CSS styles
const lightTheme: EditorThemeClasses = {
  ...baseTheme,
  root: 'editor-light',
};

// Dark theme with global CSS styles  
const darkTheme: EditorThemeClasses = {
  ...baseTheme,
  root: 'editor-dark',
};

export const EditorTheme = {
  light: lightTheme,
  dark: darkTheme,
};

// Global CSS styles (to be included in global stylesheet)
export const editorStyles = `
/* Base editor styles */
.editor-light {
  color: #1f2937;
  background: white;
}

.editor-dark {
  color: #f9fafb;
  background: #1a1a1a;
}

/* Typography */
.editor-paragraph {
  margin: 0 0 16px 0;
  line-height: 1.6;
  font-size: 16px;
}

.editor-quote {
  border-left: 4px solid #e5e7eb;
  padding-left: 16px;
  margin: 16px 0;
  font-style: italic;
  color: #6b7280;
}

.editor-dark .editor-quote {
  border-left-color: #4b5563;
  color: #9ca3af;
}

/* Headings */
.editor-heading-h1 {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  margin: 24px 0 16px 0;
  color: #111827;
}

.editor-heading-h2 {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.3;
  margin: 20px 0 12px 0;
  color: #1f2937;
}

.editor-heading-h3 {
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
  margin: 16px 0 8px 0;
  color: #374151;
}

.editor-dark .editor-heading-h1 {
  color: #f9fafb;
}

.editor-dark .editor-heading-h2 {
  color: #f3f4f6;
}

.editor-dark .editor-heading-h3 {
  color: #e5e7eb;
}

/* Text formatting */
.editor-text-bold {
  font-weight: 700;
}

.editor-text-italic {
  font-style: italic;
}

.editor-text-underline {
  text-decoration: underline;
}

.editor-text-strikethrough {
  text-decoration: line-through;
}

.editor-text-underlineStrikethrough {
  text-decoration: underline line-through;
}

.editor-text-code {
  background: #f3f4f6;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.875em;
}

.editor-dark .editor-text-code {
  background: #374151;
}

/* Links */
.editor-link {
  color: #3b82f6;
  text-decoration: none;
}

.editor-link:hover {
  text-decoration: underline;
}

.editor-dark .editor-link {
  color: #60a5fa;
}

/* Lists */
.editor-list-ol,
.editor-list-ul {
  padding-left: 24px;
  margin: 16px 0;
}

/* Enhanced List Alignment - Better approach for center/right alignment */
.editor-list-ol[style*="text-align: center"],
.editor-list-ul[style*="text-align: center"],
.editor-list-ol[style*="text-align:center"],
.editor-list-ul[style*="text-align:center"],
.editor-list-ol[data-lexical-text-align="center"],
.editor-list-ul[data-lexical-text-align="center"] {
  padding-left: 0;
  padding-right: 0;
  list-style-position: inside;
  text-align: center;
  /* Ensure proper spacing for multi-line content */
  line-height: 1.6;
}

.editor-list-ol[style*="text-align: right"],
.editor-list-ul[style*="text-align: right"],
.editor-list-ol[style*="text-align:right"],
.editor-list-ul[style*="text-align:right"],
.editor-list-ol[data-lexical-text-align="right"],
.editor-list-ul[data-lexical-text-align="right"] {
  padding-left: 0;
  padding-right: 24px;
  list-style-position: inside;
  text-align: right;
  line-height: 1.6;
}

.editor-list-ol[style*="text-align: left"],
.editor-list-ul[style*="text-align: left"],
.editor-list-ol[style*="text-align:left"],
.editor-list-ul[style*="text-align:left"],
.editor-list-ol[data-lexical-text-align="left"],
.editor-list-ul[data-lexical-text-align="left"] {
  padding-left: 24px;
  padding-right: 0;
  list-style-position: outside;
  text-align: left;
}

/* Handle list items within aligned lists - Better spacing */
.editor-list-ol[style*="text-align: center"] .editor-listitem,
.editor-list-ul[style*="text-align: center"] .editor-listitem,
.editor-list-ol[style*="text-align:center"] .editor-listitem,
.editor-list-ul[style*="text-align:center"] .editor-listitem {
  text-align: center;
  /* Prevent weird spacing with multi-line content */
  display: block;
  margin: 0.5rem 0;
}

.editor-list-ol[style*="text-align: right"] .editor-listitem,
.editor-list-ul[style*="text-align: right"] .editor-listitem,
.editor-list-ol[style*="text-align:right"] .editor-listitem,
.editor-list-ul[style*="text-align:right"] .editor-listitem {
  text-align: right;
  display: block;
  margin: 0.5rem 0;
}

.editor-list-ol[style*="text-align: left"] .editor-listitem,
.editor-list-ul[style*="text-align: left"] .editor-listitem,
.editor-list-ol[style*="text-align:left"] .editor-listitem,
.editor-list-ul[style*="text-align:left"] .editor-listitem {
  text-align: left;
  display: block;
  margin: 0.5rem 0;
}

/* Handle nested lists with alignment */
.editor-list-ol .editor-list-ol[style*="text-align: center"],
.editor-list-ul .editor-list-ul[style*="text-align: center"],
.editor-list-ol .editor-list-ol[style*="text-align:center"],
.editor-list-ul .editor-list-ul[style*="text-align:center"] {
  padding-left: 0;
  padding-right: 0;
  list-style-position: inside;
  text-align: center;
  margin: 0.5rem 0;
}

.editor-list-ol .editor-list-ol[style*="text-align: right"],
.editor-list-ul .editor-list-ul[style*="text-align: right"],
.editor-list-ol .editor-list-ol[style*="text-align:right"],
.editor-list-ul .editor-list-ul[style*="text-align:right"] {
  padding-left: 0;
  padding-right: 24px;
  list-style-position: inside;
  text-align: right;
  margin: 0.5rem 0;
}

/* Force list markers to align with content when center aligned */
.editor-list-ol[style*="text-align: center"] li::marker,
.editor-list-ul[style*="text-align: center"] li::marker,
.editor-list-ol[style*="text-align:center"] li::marker,
.editor-list-ul[style*="text-align:center"] li::marker {
  text-align: center;
}

/* Ensure list items maintain alignment */
.editor-listitem[style*="text-align: center"],
.editor-listitem[style*="text-align:center"] {
  text-align: center !important;
}

.editor-listitem[style*="text-align: right"],
.editor-listitem[style*="text-align:right"] {
  text-align: right !important;
}

.editor-listitem[style*="text-align: left"],
.editor-listitem[style*="text-align:left"] {
  text-align: left !important;
}

.editor-listitem {
  margin: 4px 0;
  line-height: 1.6;
}

.editor-nested-listitem {
  list-style-type: none;
}

/* Code blocks */
.editor-code {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 14px;
  line-height: 1.5;
  overflow-x: auto;
}

.editor-dark .editor-code {
  background: #111827;
  border-color: #374151;
}

/* Syntax highlighting */
.editor-tokenComment {
  color: #6b7280;
}

.editor-tokenPunctuation {
  color: #6b7280;
}

.editor-tokenProperty {
  color: #dc2626;
}

.editor-tokenSelector {
  color: #059669;
}

.editor-tokenOperator {
  color: #d97706;
}

.editor-tokenAttr {
  color: #7c3aed;
}

.editor-tokenVariable {
  color: #0891b2;
}

.editor-tokenFunction {
  color: #dc2626;
}

/* Images */
.editor-image {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 16px 0;
}

/* Focus styles */
.editor-light:focus-within .editor-paragraph:empty:first-child::before {
  content: attr(data-placeholder);
  color: #9ca3af;
  pointer-events: none;
  position: absolute;
}

.editor-dark:focus-within .editor-paragraph:empty:first-child::before {
  color: #6b7280;
}

/* Selection styles */
.editor-light ::selection {
  background: #dbeafe;
}

.editor-dark ::selection {
  background: #1e40af;
}

/* Better handling for multi-line content in list items */
.editor-listitem p {
  margin: 0.25rem 0;
  display: inline;
}

.editor-listitem br {
  display: block;
  content: "";
  margin: 0.25rem 0;
}

/* Lexical-specific enhanced rules */
.lexical-content-editable ol[style*="text-align: center"],
.lexical-content-editable ul[style*="text-align: center"],
.lexical-content-editable ol[style*="text-align:center"],
.lexical-content-editable ul[style*="text-align:center"] {
  padding-left: 0 !important;
  padding-right: 0 !important;
  list-style-position: inside !important;
  text-align: center !important;
  line-height: 1.6 !important;
}

.lexical-content-editable ol[style*="text-align: right"],
.lexical-content-editable ul[style*="text-align: right"],
.lexical-content-editable ol[style*="text-align:right"],
.lexical-content-editable ul[style*="text-align:right"] {
  padding-left: 0 !important;
  padding-right: 24px !important;
  list-style-position: inside !important;
  text-align: right !important;
  line-height: 1.6 !important;
}

.lexical-content-editable ol[style*="text-align: left"],
.lexical-content-editable ul[style*="text-align: left"],
.lexical-content-editable ol[style*="text-align:left"],
.lexical-content-editable ul[style*="text-align:left"] {
  padding-left: 24px !important;
  padding-right: 0 !important;
  list-style-position: outside !important;
  text-align: left !important;
}

/* Handle list items within aligned lists in Lexical */
.lexical-content-editable ol[style*="text-align: center"] li,
.lexical-content-editable ul[style*="text-align: center"] li,
.lexical-content-editable ol[style*="text-align:center"] li,
.lexical-content-editable ul[style*="text-align:center"] li {
  text-align: center !important;
  display: block !important;
  margin: 0.5rem 0 !important;
}

.lexical-content-editable ol[style*="text-align: right"] li,
.lexical-content-editable ul[style*="text-align: right"] li,
.lexical-content-editable ol[style*="text-align:right"] li,
.lexical-content-editable ul[style*="text-align:right"] li {
  text-align: right !important;
  display: block !important;
  margin: 0.5rem 0 !important;
}

.lexical-content-editable ol[style*="text-align: left"] li,
.lexical-content-editable ul[style*="text-align: left"] li,
.lexical-content-editable ol[style*="text-align:left"] li,
.lexical-content-editable ul[style*="text-align:left"] li {
  text-align: left !important;
  display: block !important;
  margin: 0.5rem 0 !important;
}

/* Prevent blank bullets and weird spacing */
.lexical-content-editable ol[style*="text-align: center"] li:empty,
.lexical-content-editable ul[style*="text-align: center"] li:empty,
.lexical-content-editable ol[style*="text-align:center"] li:empty,
.lexical-content-editable ul[style*="text-align:center"] li:empty {
  display: none !important;
}

/* Better paragraph handling within list items */
.lexical-content-editable ol[style*="text-align: center"] li p,
.lexical-content-editable ul[style*="text-align: center"] li p,
.lexical-content-editable ol[style*="text-align:center"] li p,
.lexical-content-editable ul[style*="text-align:center"] li p {
  margin: 0.25rem 0 !important;
  display: inline !important;
}

.lexical-content-editable ol[style*="text-align: right"] li p,
.lexical-content-editable ul[style*="text-align: right"] li p,
.lexical-content-editable ol[style*="text-align:right"] li p,
.lexical-content-editable ul[style*="text-align:right"] li p {
  margin: 0.25rem 0 !important;
  display: inline !important;
}
`; 