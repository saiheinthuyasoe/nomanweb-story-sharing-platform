'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $getSelection, $isRangeSelection, FORMAT_ELEMENT_COMMAND } from 'lexical';
import { $isListNode, $isListItemNode } from '@lexical/list';

export default function ListAlignmentPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      FORMAT_ELEMENT_COMMAND,
      (payload) => {
        console.log('ListAlignmentPlugin: FORMAT_ELEMENT_COMMAND received with payload:', payload);
        
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          console.log('ListAlignmentPlugin: Not a range selection, skipping');
          return false;
        }

        const anchorNode = selection.anchor.getNode();
        let element = anchorNode.getKey() === 'root' 
          ? anchorNode 
          : anchorNode.getTopLevelElementOrThrow();

        console.log('ListAlignmentPlugin: Element type:', element.getType());
        console.log('ListAlignmentPlugin: Is list node:', $isListNode(element));
        console.log('ListAlignmentPlugin: Is list item node:', $isListItemNode(element));

        // If we're in a list item, get the parent list
        if ($isListItemNode(element)) {
          const parent = element.getParent();
          if (parent && $isListNode(parent)) {
            element = parent;
            console.log('ListAlignmentPlugin: Found parent list node');
          }
        }

        // Check if we're dealing with a list
        if ($isListNode(element)) {
          console.log('ListAlignmentPlugin: Processing list alignment for:', payload);
          
          // Apply alignment to the list element
          const elementDOM = editor.getElementByKey(element.getKey());
          if (elementDOM) {
            console.log('ListAlignmentPlugin: Found DOM element:', elementDOM);
            console.log('ListAlignmentPlugin: Current styles:', elementDOM.style.cssText);
            
            // Remove existing alignment classes
            elementDOM.classList.remove('list-align-left', 'list-align-center', 'list-align-right');
            
            // Add new alignment class and style
            if (payload === 'left') {
              elementDOM.classList.add('list-align-left');
              elementDOM.style.textAlign = 'left';
              elementDOM.style.paddingLeft = '20px';
              elementDOM.style.paddingRight = '0';
              elementDOM.style.listStylePosition = 'outside';
            } else if (payload === 'center') {
              elementDOM.classList.add('list-align-center');
              elementDOM.style.textAlign = 'center';
              elementDOM.style.paddingLeft = '0';
              elementDOM.style.paddingRight = '0';
              elementDOM.style.listStylePosition = 'inside';
            } else if (payload === 'right') {
              elementDOM.classList.add('list-align-right');
              elementDOM.style.textAlign = 'right';
              elementDOM.style.paddingLeft = '0';
              elementDOM.style.paddingRight = '20px';
              elementDOM.style.listStylePosition = 'inside';
            }

            console.log('ListAlignmentPlugin: Applied styles:', elementDOM.style.cssText);

            // Also apply alignment to all list items
            const listItems = elementDOM.querySelectorAll('li');
            console.log('ListAlignmentPlugin: Found list items:', listItems.length);
            
            listItems.forEach((li, index) => {
              li.style.textAlign = payload;
              li.style.display = 'block';
              li.style.margin = '0.5rem 0';
              console.log(`ListAlignmentPlugin: Applied styles to list item ${index}:`, li.style.cssText);
            });
          } else {
            console.log('ListAlignmentPlugin: Could not find DOM element for list');
          }
        } else {
          console.log('ListAlignmentPlugin: Not a list element, skipping');
        }

        return false; // Let the default handler run as well
      },
      1 // High priority
    );
  }, [editor]);

  // Also add a mutation observer to handle dynamic changes
  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) {
      console.log('ListAlignmentPlugin: No root element found');
      return;
    }

    console.log('ListAlignmentPlugin: Setting up mutation observer');

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const target = mutation.target as HTMLElement;
          if (target.tagName === 'OL' || target.tagName === 'UL') {
            console.log('ListAlignmentPlugin: Mutation observer detected style change on list:', target.tagName);
            const textAlign = target.style.textAlign;
            console.log('ListAlignmentPlugin: Text align value:', textAlign);
            
            if (textAlign) {
              // Apply our custom alignment styles
              if (textAlign === 'center') {
                target.style.paddingLeft = '0';
                target.style.paddingRight = '0';
                target.style.listStylePosition = 'inside';
                target.style.lineHeight = '1.6';
                target.style.margin = '0.5rem 0';
              } else if (textAlign === 'right') {
                target.style.paddingLeft = '0';
                target.style.paddingRight = '20px';
                target.style.listStylePosition = 'inside';
                target.style.lineHeight = '1.6';
                target.style.margin = '0.5rem 0';
              } else if (textAlign === 'left') {
                target.style.paddingLeft = '20px';
                target.style.paddingRight = '0';
                target.style.listStylePosition = 'outside';
                target.style.margin = '0.5rem 0';
              }

              console.log('ListAlignmentPlugin: Applied styles via mutation observer:', target.style.cssText);

              // Apply to list items
              const listItems = target.querySelectorAll('li');
              listItems.forEach((li) => {
                li.style.textAlign = textAlign;
                li.style.display = 'block';
                li.style.margin = '0.5rem 0';
              });
            }
          }
        }
      });
    });

    observer.observe(rootElement, {
      attributes: true,
      attributeFilter: ['style'],
      subtree: true
    });

    console.log('ListAlignmentPlugin: Mutation observer set up successfully');

    return () => observer.disconnect();
  }, [editor]);

  return null;
} 