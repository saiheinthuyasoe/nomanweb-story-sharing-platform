"use client";

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  interactionToNextPaint: number;
  firstInputDelay: number;
  bundleSize: number;
  cacheHitRate: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  onMetricsUpdate?: (metrics: Partial<PerformanceMetrics>) => void;
}

export default function PerformanceMonitor({ 
  enabled = process.env.NODE_ENV === 'development',
  onMetricsUpdate 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    domContentLoaded: 0,
    largestContentfulPaint: 0,
    cumulativeLayoutShift: 0,
    interactionToNextPaint: 0,
    firstInputDelay: 0,
    bundleSize: 0,
    cacheHitRate: 0,
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const collectMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      const newMetrics: Partial<PerformanceMetrics> = {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      };

      // Get INP (Interaction to Next Paint)
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const inpEntries = entries.filter(entry => entry.entryType === 'event');
            if (inpEntries.length > 0) {
              const maxDuration = Math.max(...inpEntries.map(entry => (entry as any).duration || 0));
              newMetrics.interactionToNextPaint = maxDuration;
            }
          });
          observer.observe({ entryTypes: ['event'] });
        } catch (e) {
          // INP not supported
          newMetrics.interactionToNextPaint = 0;
        }
      }

      // Largest Contentful Paint
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
              newMetrics.largestContentfulPaint = lastEntry.startTime;
              setMetrics(prev => ({ ...prev, largestContentfulPaint: lastEntry.startTime }));
            }
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // Cumulative Layout Shift
          const clsObserver = new PerformanceObserver((list) => {
            let clsValue = 0;
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            newMetrics.cumulativeLayoutShift = clsValue;
            setMetrics(prev => ({ ...prev, cumulativeLayoutShift: clsValue }));
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });

          // First Input Delay
          const fidObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              newMetrics.firstInputDelay = (entry as any).processingStart - entry.startTime;
              setMetrics(prev => ({ ...prev, firstInputDelay: (entry as any).processingStart - entry.startTime }));
            }
          });
          fidObserver.observe({ entryTypes: ['first-input'] });
        } catch (error) {
          console.warn('Performance Observer not fully supported:', error);
        }
      }

      // Bundle size estimation
      const resources = performance.getEntriesByType('resource');
      const jsResources = resources.filter(resource => 
        resource.name.includes('.js') && !resource.name.includes('node_modules')
      );
      const totalBundleSize = jsResources.reduce((total, resource) => 
        total + ((resource as any).transferSize || 0), 0
      );
      newMetrics.bundleSize = totalBundleSize;

      // Cache hit rate estimation
      const cachedResources = resources.filter(resource => 
        (resource as any).transferSize === 0 && (resource as any).decodedBodySize > 0
      );
      newMetrics.cacheHitRate = resources.length > 0 ? 
        (cachedResources.length / resources.length) * 100 : 0;

      setMetrics(prev => ({ ...prev, ...newMetrics }));
      onMetricsUpdate?.(newMetrics);
    };

    // Collect initial metrics
    if (document.readyState === 'complete') {
      collectMetrics();
    } else {
      window.addEventListener('load', collectMetrics);
    }

    // Keyboard shortcut to toggle visibility (Ctrl+Shift+Z)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('load', collectMetrics);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [enabled, onMetricsUpdate]);

  if (!enabled || !isVisible) {
    return null;
  }

  const formatMetric = (value: number | undefined, unit: string = 'ms') => {
    if (value === undefined) return 'N/A';
    if (unit === 'ms') return `${Math.round(value)}ms`;
    if (unit === 'bytes') return `${(value / 1024).toFixed(1)}KB`;
    if (unit === '%') return `${value.toFixed(1)}%`;
    return value.toString();
  };

  const getScoreColor = (metric: string, value: number | undefined): string => {
    if (!value) return 'text-gray-400';
    
    switch (metric) {
      case 'lcp':
        return value < 2500 ? 'text-green-600' : value < 4000 ? 'text-yellow-600' : 'text-red-600';
      case 'cls':
        return value < 0.1 ? 'text-green-600' : value < 0.25 ? 'text-yellow-600' : 'text-red-600';
      case 'inp':
        return value < 200 ? 'text-green-600' : value < 500 ? 'text-yellow-600' : 'text-red-600';
      case 'fid':
        return value < 100 ? 'text-green-600' : value < 300 ? 'text-yellow-600' : 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Performance Metrics</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Load Time:</span>
          <span className={getScoreColor('load', metrics.loadTime)}>
            {formatMetric(metrics.loadTime)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Largest Contentful Paint (LCP):</span>
          <span className={getScoreColor('lcp', metrics.largestContentfulPaint)}>
            {formatMetric(metrics.largestContentfulPaint)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Cumulative Layout Shift (CLS):</span>
          <span className={getScoreColor('cls', metrics.cumulativeLayoutShift)}>
            {formatMetric(metrics.cumulativeLayoutShift, '')}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Interaction to Next Paint (INP):</span>
          <span className={getScoreColor('inp', metrics.interactionToNextPaint)}>
            {formatMetric(metrics.interactionToNextPaint)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">First Input Delay (FID):</span>
          <span className={getScoreColor('fid', metrics.firstInputDelay)}>
            {formatMetric(metrics.firstInputDelay)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Bundle Size:</span>
          <span className="text-gray-700">
            {formatMetric(metrics.bundleSize, 'bytes')}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Cache Hit Rate:</span>
          <span className={getScoreColor('cache', metrics.cacheHitRate)}>
            {formatMetric(metrics.cacheHitRate, '%')}
          </span>
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Press Ctrl+Shift+Z to toggle
        </p>
      </div>
    </div>
  );
}