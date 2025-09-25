'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $setSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  DRAGSTART_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND,
  NodeKey,
} from 'lexical';
import { $isImageNode } from './ImageNode';

const imageCache = new Set();

function useSuspenseImage(src: string) {
  if (!imageCache.has(src)) {
    throw new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        imageCache.add(src);
        resolve(null);
      };
      img.onerror = () => {
        imageCache.add(src);
        resolve(null);
      };
    });
  }
}

function LazyImage({
  altText,
  className,
  imageRef,
  src,
  width,
  height,
  maxWidth,
  onError,
}: {
  altText: string;
  className: string | null;
  height: number | string;
  imageRef: { current: null | HTMLImageElement };
  maxWidth: number;
  src: string;
  width: number | string;
  onError: () => void;
}): JSX.Element {
  useSuspenseImage(src);
  return (
    <img
      className={className || undefined}
      src={src}
      alt={altText}
      ref={imageRef}
      style={{
        height,
        maxWidth,
        width,
      }}
      onError={onError}
      draggable="false"
    />
  );
}

interface ImageComponentProps {
  altText: string;
  height: number | string;
  maxWidth: number;
  nodeKey: NodeKey;
  resizable: boolean;
  src: string;
  width: number | string;
}

export default function ImageComponent({
  src,
  altText,
  nodeKey,
  width,
  height,
  maxWidth,
  resizable,
}: ImageComponentProps): JSX.Element {
  const imageRef = useRef<null | HTMLImageElement>(null);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [editor] = useLexicalComposerContext();
  const [selection, setSelection] = useState<any>(null);
  const activeEditorRef = useRef<any>(null);

  const onDelete = useCallback(
    (payload: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        const event: KeyboardEvent = payload;
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {
          node.remove();
          return true;
        }
      }
      return false;
    },
    [isSelected, nodeKey]
  );

  const onEnter = useCallback(
    (event: KeyboardEvent) => {
      const latestSelection = $getSelection();
      const buttonElem = event.target;
      if (
        isSelected &&
        $isNodeSelection(latestSelection) &&
        latestSelection.getNodes().length === 1
      ) {
        if (buttonElem !== null) {
          if (buttonElem instanceof HTMLButtonElement) {
            event.preventDefault();
          }
        }
        return true;
      }
      return false;
    },
    [isSelected]
  );

  const onEscape = useCallback(
    (event: KeyboardEvent) => {
      if (isSelected) {
        const selection = $getSelection();
        if ($isNodeSelection(selection)) {
          event.preventDefault();
        }
        clearSelection();
        return true;
      }
      return false;
    },
    [isSelected, clearSelection]
  );

  const onClick = useCallback(
    (payload: MouseEvent) => {
      const event = payload;

      if (isResizing) {
        return true;
      }
      if (event.target === imageRef.current) {
        if (event.shiftKey) {
          setSelected(!isSelected);
        } else {
          clearSelection();
          setSelected(true);
        }
        return true;
      }

      return false;
    },
    [isResizing, isSelected, setSelected, clearSelection]
  );

  const onRightClick = useCallback(
    (event: MouseEvent): void => {
      editor.getEditorState().read(() => {
        const latestSelection = $getSelection();
        const domElement = event.target as Element;
        if (
          domElement.tagName === 'IMG' &&
          $isNodeSelection(latestSelection) &&
          latestSelection.getNodes().length === 1
        ) {
          editor.dispatchCommand(
            CLICK_COMMAND,
            event as MouseEvent
          );
        }
      });
    },
    [editor]
  );

  useEffect(() => {
    let isMounted = true;
    const rootElement = editor.getRootElement();
    const unregister = mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        if (isMounted) {
          setSelection(editorState.read(() => $getSelection()));
        }
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_, activeEditor) => {
          activeEditorRef.current = activeEditor;
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        onClick,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        DRAGSTART_COMMAND,
        (event) => {
          if (event.target === imageRef.current) {
            // TODO: This is just a temporary workaround for FF to behave like other browsers.
            // Ideally, this handles drag & drop too (and all browsers).
            event.preventDefault();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(KEY_ENTER_COMMAND, onEnter, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ESCAPE_COMMAND, onEscape, COMMAND_PRIORITY_LOW)
    );

    rootElement?.addEventListener('contextmenu', onRightClick);

    return () => {
      isMounted = false;
      unregister();
      rootElement?.removeEventListener('contextmenu', onRightClick);
    };
  }, [
    clearSelection,
    editor,
    isResizing,
    isSelected,
    nodeKey,
    onDelete,
    onEnter,
    onEscape,
    onClick,
    onRightClick,
    setSelected,
  ]);

  const setShowCaption = () => {
    // Placeholder for caption functionality
  };

  const onResizeEnd = (
    nextWidth: number | string,
    nextHeight: number | string
  ) => {
    // Handle resize end
    setTimeout(() => {
      setIsResizing(false);
    }, 200);
  };

  const onResizeStart = () => {
    setIsResizing(true);
  };

  const draggable = isSelected && $isNodeSelection(selection);
  const isFocused = isSelected;

  return (
    <Suspense fallback={null}>
      <>
        <div draggable={draggable} className={`relative ${isFocused ? 'ring-2 ring-blue-500' : ''}`}>
          <LazyImage
            className={`block ${isFocused ? 'outline-none' : ''}`}
            src={src}
            altText={altText}
            imageRef={imageRef}
            width={width}
            height={height}
            maxWidth={maxWidth}
            onError={() => {
              // Handle image load error
            }}
          />
          {resizable && isSelected && (
            <div className="absolute bottom-1 right-1">
              <button
                className="w-4 h-4 bg-blue-500 border-2 border-white rounded-sm cursor-se-resize opacity-75 hover:opacity-100"
                onMouseDown={onResizeStart}
              />
            </div>
          )}
        </div>
      </>
    </Suspense>
  );
} 