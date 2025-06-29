'use client';

import { useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode, $createTextNode, $getSelection, $createRangeSelection, $setSelection } from 'lexical';
import { $generateNodesFromDOM } from '@lexical/html';
import toast from 'react-hot-toast';

interface RealtimeContentPluginProps {
  onContentUpdate?: (content: string) => void;
  chapterId?: string;
  registerContentUpdateCallback?: (callback: (content: string) => void) => () => void;
}

export default function RealtimeContentPlugin({ 
  onContentUpdate, 
  chapterId, 
  registerContentUpdateCallback 
}: RealtimeContentPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [isCollaboratorTyping, setIsCollaboratorTyping] = useState(false);
  const lastContentRef = useRef<string>('');
  const isUserTypingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateCountRef = useRef(0);

  console.log('RealtimeContentPlugin: Component rendered with props:', {
    hasChapterId: !!chapterId,
    hasRegisterCallback: !!registerContentUpdateCallback,
    hasOnContentUpdate: !!onContentUpdate
  });

  // Track when user is typing
  useEffect(() => {
    const handleUserTyping = () => {
      isUserTypingRef.current = true;
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set user as not typing after 2 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        isUserTypingRef.current = false;
        console.log('RealtimeContentPlugin: User stopped typing');
      }, 2000);
    };

    // Listen for editor changes
    const removeUpdateListener = editor.registerUpdateListener(() => {
      handleUserTyping();
    });

    return () => {
      removeUpdateListener();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [editor]);

  // Handle content updates from real-time collaboration
  const handleContentUpdate = (content: string) => {
    updateCountRef.current += 1;
    console.log(`RealtimeContentPlugin: handleContentUpdate called (update #${updateCountRef.current}):`, {
      contentLength: content?.length || 0,
      contentPreview: content?.substring(0, 100) + '...',
      lastContentLength: lastContentRef.current?.length || 0,
      isUserTyping: isUserTypingRef.current,
      contentChanged: content !== lastContentRef.current,
      isHtml: content?.includes('<') && content?.includes('>')
    });

    // Prevent infinite loops by checking if content actually changed
    if (content === lastContentRef.current) {
      console.log('RealtimeContentPlugin: Skipping update - content unchanged');
      return;
    }
    
    // Don't apply updates if user is actively typing
    if (isUserTypingRef.current) {
      console.log('RealtimeContentPlugin: Skipping update - user is actively typing');
      return;
    }
    
    console.log('RealtimeContentPlugin: Applying content update:', {
      contentLength: content.length,
      contentPreview: content.substring(0, 100) + '...'
    });

    // Show typing indicator
    setIsCollaboratorTyping(true);
    
    // Hide typing indicator after 3 seconds
    setTimeout(() => setIsCollaboratorTyping(false), 3000);

    // Show a subtle notification that content is being updated
    toast.success('Content updated by collaborator', {
      duration: 2000,
      style: { fontSize: '12px', opacity: 0.8 }
    });

    editor.update(() => {
      const root = $getRoot();
      
      // Clear existing content
      root.clear();
      
      if (content && content.trim()) {
        try {
          // Check if content is HTML
          if (content.includes('<') && content.includes('>')) {
            console.log('RealtimeContentPlugin: Parsing HTML content');
            
            // Parse HTML content and create nodes
            const parser = new DOMParser();
            const dom = parser.parseFromString(content, 'text/html');
            
            // Generate nodes from the parsed DOM
            const nodes = $generateNodesFromDOM(editor, dom);
            
            console.log('RealtimeContentPlugin: Generated nodes from HTML:', nodes.length);
            
            // Append nodes to root
            nodes.forEach(node => root.append(node));
          } else {
            console.log('RealtimeContentPlugin: Parsing plain text content');
            
            // Handle plain text content
            const lines = content.split('\n');
            
            lines.forEach((line, index) => {
              if (line.trim() || index === lines.length - 1) {
                const paragraphNode = $createParagraphNode();
                
                if (line.trim()) {
                  const textNode = $createTextNode(line);
                  paragraphNode.append(textNode);
                }
                
                root.append(paragraphNode);
              }
            });
          }
          
          // If no content was added, add an empty paragraph
          if (root.getChildrenSize() === 0) {
            const emptyParagraph = $createParagraphNode();
            root.append(emptyParagraph);
          }
        } catch (error) {
          console.error('Error applying content update:', error);
          // Fallback to simple text node
          const textNode = $createTextNode(content);
          const paragraphNode = $createParagraphNode();
          paragraphNode.append(textNode);
          root.append(paragraphNode);
        }
      } else {
        // Add empty paragraph if no content
        const emptyParagraph = $createParagraphNode();
        root.append(emptyParagraph);
      }
    });

    lastContentRef.current = content;
    console.log('RealtimeContentPlugin: Content update applied successfully');
  };

  // Register this component's content update handler
  useEffect(() => {
    if (!registerContentUpdateCallback) {
      console.log('RealtimeContentPlugin: No registerContentUpdateCallback provided');
      return;
    }

    console.log('RealtimeContentPlugin: Registering content update callback');
    const unregister = registerContentUpdateCallback(handleContentUpdate);

    return () => {
      console.log('RealtimeContentPlugin: Unregistering content update callback');
      unregister();
    };
  }, [registerContentUpdateCallback]);

  // Legacy support for onContentUpdate prop
  useEffect(() => {
    if (onContentUpdate) {
      console.log('RealtimeContentPlugin: Using legacy onContentUpdate prop');
      const unregister = registerContentUpdateCallback?.(onContentUpdate) || (() => {});
      return unregister;
    }
  }, [onContentUpdate, registerContentUpdateCallback]);

  return (
    <>
      {/* Typing indicator for other collaborators */}
      {isCollaboratorTyping && (
        <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white bg-opacity-90 px-2 py-1 rounded shadow-sm z-10">
          <span className="animate-pulse text-green-500">●</span> Collaborator typing...
        </div>
      )}
      
      {/* Debug test button - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2">
          <button
            onClick={() => {
              const testContent = `<p class="editor-paragraph" dir="ltr"><span style="white-space: pre-wrap;">Test content from ${new Date().toLocaleTimeString()}</span></p><p class="editor-paragraph" dir="ltr"><span style="white-space: pre-wrap;">This is a test update to verify real-time collaboration is working.</span></p>`;
              console.log('Manual test: Applying content update:', testContent);
              handleContentUpdate(testContent);
            }}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
          >
            Test Content Update
          </button>
        </div>
      )}
    </>
  );
} 