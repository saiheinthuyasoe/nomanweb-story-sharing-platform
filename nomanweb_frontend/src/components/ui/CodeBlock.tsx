'use client';

import { useEffect, useState } from 'react';
import { getHighlighter, type Highlighter } from 'shiki';

interface CodeBlockProps {
  code: string;
  language: string;
  theme?: string;
  className?: string;
}

export function CodeBlock({ 
  code, 
  language, 
  theme = 'github-dark', 
  className = '' 
}: CodeBlockProps) {
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null);
  const [highlightedCode, setHighlightedCode] = useState<string>('');

  useEffect(() => {
    const initHighlighter = async () => {
      try {
        const hl = await getHighlighter({
          themes: [theme],
          langs: [language],
        });
        setHighlighter(hl);
      } catch (error) {
        console.error('Failed to initialize highlighter:', error);
      }
    };

    initHighlighter();
  }, [theme, language]);

  useEffect(() => {
    if (highlighter && code) {
      try {
        const highlighted = highlighter.codeToHtml(code, {
          lang: language,
          theme: theme,
        });
        setHighlightedCode(highlighted);
      } catch (error) {
        console.error('Failed to highlight code:', error);
        setHighlightedCode(`<pre><code>${code}</code></pre>`);
      }
    }
  }, [highlighter, code, language, theme]);

  if (!highlightedCode) {
    return (
      <pre className={`bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto ${className}`}>
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div 
      className={`rounded-lg overflow-x-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: highlightedCode }}
    />
  );
}

// Hook for using Shiki highlighter
export function useShikiHighlighter(theme = 'github-dark') {
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initHighlighter = async () => {
      try {
        const hl = await getHighlighter({
          themes: [theme],
          langs: ['javascript', 'typescript', 'jsx', 'tsx', 'json', 'css', 'html', 'markdown'],
        });
        setHighlighter(hl);
      } catch (error) {
        console.error('Failed to initialize highlighter:', error);
      } finally {
        setLoading(false);
      }
    };

    initHighlighter();
  }, [theme]);

  const highlight = (code: string, language: string) => {
    if (!highlighter) return code;
    
    try {
      return highlighter.codeToHtml(code, {
        lang: language,
        theme: theme,
      });
    } catch (error) {
      console.error('Failed to highlight code:', error);
      return `<pre><code>${code}</code></pre>`;
    }
  };

  return { highlighter, highlight, loading };
} 