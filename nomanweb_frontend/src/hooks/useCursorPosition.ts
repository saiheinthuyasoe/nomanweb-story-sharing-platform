import { useCallback, useRef, useState } from 'react';

interface CursorPosition {
  x: number;
  y: number;
  line: number;
  column: number;
}

export const useCursorPosition = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({ x: 0, y: 0, line: 0, column: 0 });

  const calculateCursorPosition = useCallback((text: string, cursorIndex: number): CursorPosition => {
    if (!textareaRef.current) {
      return { x: 0, y: 0, line: 0, column: 0 };
    }

    const textarea = textareaRef.current;
    const textBeforeCursor = text.substring(0, cursorIndex);
    const lines = textBeforeCursor.split('\n');
    const currentLine = lines[lines.length - 1];
    const lineNumber = lines.length - 1;

    // Create a temporary element to measure text
    const tempElement = document.createElement('div');
    tempElement.style.position = 'absolute';
    tempElement.style.visibility = 'hidden';
    tempElement.style.whiteSpace = 'pre-wrap';
    tempElement.style.wordWrap = 'break-word';
    tempElement.style.font = window.getComputedStyle(textarea).font;
    tempElement.style.width = textarea.offsetWidth + 'px';
    tempElement.style.padding = window.getComputedStyle(textarea).padding;
    tempElement.style.border = window.getComputedStyle(textarea).border;
    tempElement.style.lineHeight = window.getComputedStyle(textarea).lineHeight;
    
    // Set the text up to the cursor position
    tempElement.textContent = textBeforeCursor;
    document.body.appendChild(tempElement);

    // Calculate position
    const rect = textarea.getBoundingClientRect();
    const tempRect = tempElement.getBoundingClientRect();
    const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
    
    // Calculate x position for the current line
    const currentLineElement = document.createElement('div');
    currentLineElement.style.position = 'absolute';
    currentLineElement.style.visibility = 'hidden';
    currentLineElement.style.whiteSpace = 'pre';
    currentLineElement.style.font = window.getComputedStyle(textarea).font;
    currentLineElement.textContent = currentLine;
    document.body.appendChild(currentLineElement);
    
    const currentLineWidth = currentLineElement.offsetWidth;
    document.body.removeChild(currentLineElement);
    document.body.removeChild(tempElement);

    const x = rect.left + parseInt(window.getComputedStyle(textarea).paddingLeft) + currentLineWidth;
    const y = rect.top + parseInt(window.getComputedStyle(textarea).paddingTop) + (lineNumber * lineHeight);

    return {
      x,
      y,
      line: lineNumber,
      column: currentLine.length,
    };
  }, []);

  const updateCursorPosition = useCallback((text: string, cursorIndex: number) => {
    const position = calculateCursorPosition(text, cursorIndex);
    setCursorPosition(position);
  }, [calculateCursorPosition]);

  return {
    textareaRef,
    cursorPosition,
    updateCursorPosition,
    calculateCursorPosition,
  };
}; 