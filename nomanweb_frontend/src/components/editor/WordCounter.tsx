'use client';

import React from 'react';
import { Type, Clock, Target } from 'lucide-react';

interface WordCounterProps {
  wordCount: number;
  characterCount: number;
  isDarkMode?: boolean;
  showReadingTime?: boolean;
  targetWordCount?: number;
}

export function WordCounter({
  wordCount,
  characterCount,
  isDarkMode = false,
  showReadingTime = true,
  targetWordCount
}: WordCounterProps) {
  // Calculate reading time (average 200 words per minute)
  const readingTimeMinutes = Math.ceil(wordCount / 200);
  
  // Calculate progress if target is set
  const progress = targetWordCount ? Math.min((wordCount / targetWordCount) * 100, 100) : null;

  const StatItem = ({ icon, label, value, suffix = '' }: {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    suffix?: string;
  }) => (
    <div className={`flex items-center space-x-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
      <span className="text-xs">{icon}</span>
      <span className="text-xs font-medium">
        {label}: {value}{suffix}
      </span>
    </div>
  );

  return (
    <div className="flex items-center space-x-4">
      {/* Word Count */}
      <StatItem
        icon={<Type size={12} />}
        label="Words"
        value={wordCount.toLocaleString()}
      />

      {/* Character Count */}
      <StatItem
        icon={<span className="font-mono text-xs">Ch</span>}
        label="Characters"
        value={characterCount.toLocaleString()}
      />

      {/* Reading Time */}
      {showReadingTime && wordCount > 0 && (
        <StatItem
          icon={<Clock size={12} />}
          label="Reading time"
          value={readingTimeMinutes}
          suffix={` min${readingTimeMinutes !== 1 ? 's' : ''}`}
        />
      )}

      {/* Progress towards target */}
      {targetWordCount && (
        <div className={`flex items-center space-x-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <Target size={12} />
          <div className="flex items-center space-x-1">
            <span className="text-xs font-medium">
              Progress: {wordCount.toLocaleString()}/{targetWordCount.toLocaleString()}
            </span>
            <div className="w-16 h-1 bg-gray-300 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">
              {progress?.toFixed(0)}%
            </span>
          </div>
        </div>
      )}

      {/* Writing Session Stats (if needed) */}
      {wordCount > 1000 && (
        <div className={`flex items-center space-x-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
          <span className="text-xs">🎯</span>
          <span className="text-xs font-medium">
            {wordCount >= 2000 ? 'Great progress!' : 'Keep writing!'}
          </span>
        </div>
      )}
    </div>
  );
} 