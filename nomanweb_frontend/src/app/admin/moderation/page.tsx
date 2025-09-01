'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BookOpenIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

// ============================================================================
// INTERFACES
// ============================================================================

interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  wordCount: number;
  status: 'PUBLISHED' | 'DRAFT';
  moderationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  moderationNotes?: string;
  createdAt?: string;
  publishedAt?: string;
  classification?: {
    predicted_category: string;
    confidence: number;
    top_categories: Array<{
      category: string;
      probability: number;
    }>;
    timestamp: string;
    performance?: {
      processing_time_ms: number;
      server_processing_time_ms?: number;
      cached: boolean;
      queue_position: number;
    };
    error?: string;
  };
}

interface Story {
  id: string;
  title: string;
  author: {
    id: string;
    username: string;
    displayName?: string;
  };
  chapters: Chapter[];
  totalChapters: number;
  status: 'PUBLISHED' | 'DRAFT';
  moderationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminModerationPage() {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set());
  const [classifyingChapters, setClassifyingChapters] = useState<Set<string>>(new Set());
  const [viewingContent, setViewingContent] = useState<Set<string>>(new Set());
  const [chapterContents, setChapterContents] = useState<Map<string, string>>(new Map());
  const [loadingContent, setLoadingContent] = useState<Set<string>>(new Set());
  const [selectedView, setSelectedView] = useState<'overview' | 'stories' | 'text-classification'>('overview');
  const [textClassificationData, setTextClassificationData] = useState<{
    health: any;
    stats: any;
    docs: any;
    apiInfo?: any;
    performance?: {
      loadTime: number;
      timestamp: string;
    };
    loading: boolean;
    error: string | null;
  }>({ health: null, stats: null, docs: null, loading: false, error: null });
  
  // Quick Predict state
  const [quickText, setQuickText] = useState('');
  const [quickResult, setQuickResult] = useState<any>(null);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [quickExpanded, setQuickExpanded] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    loadStories();
    loadTextClassificationData();
  }, []);

  // ============================================================================
  // DATA LOADING FUNCTIONS
  // ============================================================================
  
  const loadTextClassificationData = async () => {
    setTextClassificationData(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const startTime = Date.now();
      const adminToken = localStorage.getItem('adminToken');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      };
      
      console.log('🔄 Loading text classification data...');
      
      // Fetch all endpoints with timeout handling
      const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 10000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      };
      
      // Fetch health data
      const healthResponse = await fetchWithTimeout('/api/admin/text-classification/health', {
        method: 'GET',
        headers
      });
      
      // Fetch stats data
      const statsResponse = await fetchWithTimeout('/api/admin/text-classification/stats', {
        method: 'GET',
        headers
      });
      
      // Fetch docs data
      const docsResponse = await fetchWithTimeout('/api/admin/text-classification/docs', {
        method: 'GET',
        headers
      });
      
      // Fetch main API info
      const apiInfoResponse = await fetchWithTimeout('/api/admin/text-classification', {
        method: 'GET',
        headers
      });
      
      const [healthData, statsData, docsData, apiInfoData] = await Promise.all([
        healthResponse.ok ? healthResponse.json().catch(() => ({ error: 'Failed to parse health response' })) : { error: `Health check failed: ${healthResponse.status}` },
        statsResponse.ok ? statsResponse.json().catch(() => ({ error: 'Failed to parse stats response' })) : { error: `Stats fetch failed: ${statsResponse.status}` },
        docsResponse.ok ? docsResponse.json().catch(() => ({ error: 'Failed to parse docs response' })) : { error: `Docs fetch failed: ${docsResponse.status}` },
        apiInfoResponse.ok ? apiInfoResponse.json().catch(() => ({ error: 'Failed to parse API info response' })) : { error: `API info fetch failed: ${apiInfoResponse.status}` }
      ]);
      
      const loadTime = Date.now() - startTime;
      
      console.log('✅ Text classification data loaded:', {
        loadTime: `${loadTime}ms`,
        health: healthData?.status || 'unknown',
        stats: statsData?.total_requests || 'unknown',
        docs: docsData?.title || 'unknown'
      });
      
      setTextClassificationData({
        health: healthData,
        stats: statsData,
        docs: docsData,
        apiInfo: apiInfoData,
        performance: {
          loadTime,
          timestamp: new Date().toISOString()
        },
        loading: false,
        error: null
      });
      
    } catch (error) {
      console.error('❌ Error loading text classification data:', error);
      setTextClassificationData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load text classification data'
      }));
    }
  };
  
  const testBatchPredict = async () => {
    try {
      const startTime = Date.now();
      const adminToken = localStorage.getItem('adminToken');
      
      // Enhanced test texts with various categories
      const testTexts = [
        'This is a wonderful story about friendship and adventure!',
        'I absolutely hate this terrible content and wish it would disappear.',
        'This is a normal chapter about a character exploring a magical forest.',
        'The protagonist discovered an ancient artifact in the ruins.',
        'What a fantastic piece of writing! I love the character development.'
      ];
      
      console.log('🚀 Starting batch prediction test:', {
        textCount: testTexts.length,
        totalChars: testTexts.reduce((sum, text) => sum + text.length, 0)
      });
      
      const response = await fetch('/api/admin/text-classification/batch-predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ 
          texts: testTexts,
          metadata: {
            test_request: true,
            source: 'admin_dashboard_test'
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        const processingTime = Date.now() - startTime;
        
        console.log('✅ Batch prediction successful:', {
          processingTime: `${processingTime}ms`,
          predictions: result.predictions?.length || 0,
          performance: result.performance_metrics,
          result
        });
        
        // Show detailed results
        const summary = {
          'Total Processing Time': `${processingTime}ms`,
          'Texts Processed': testTexts.length,
          'Server Processing Time': result.performance_metrics?.total_processing_time_ms ? `${result.performance_metrics.total_processing_time_ms}ms` : 'N/A',
          'Throughput': result.performance_metrics?.throughput_chars_per_second ? `${result.performance_metrics.throughput_chars_per_second} chars/sec` : 'N/A',
          'Queue Position': result.proxy_info?.queue_position || 0
        };
        
        alert(`Batch prediction successful!\n\n${Object.entries(summary).map(([key, value]) => `${key}: ${value}`).join('\n')}\n\nCheck console for detailed results.`);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Batch prediction failed: ${response.status} - ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Batch prediction error:', error);
      alert(`Batch prediction failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck console for details.`);
    }
  };
  
  const submitQuickPredict = async () => {
    if (!quickText.trim()) return;
    
    setQuickLoading(true);
    setQuickError(null);
    setQuickResult(null);
    
    try {
      const adminToken = localStorage.getItem('adminToken');
      const textToPredict = quickText.length > 10000 ? quickText.substring(0, 10000) : quickText;
      
      const response = await fetch('/api/admin/text-classification/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          text: textToPredict,
          metadata: {
            source: 'admin_quick_predict',
            original_length: quickText.length
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setQuickResult(result);
        setQuickExpanded(true);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Prediction failed: ${response.status} - ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Quick prediction error:', error);
      setQuickError(error instanceof Error ? error.message : 'Unknown error occurred');
      setQuickExpanded(true);
    } finally {
      setQuickLoading(false);
    }
  };
  
  const loadStories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading stories for moderation...');
      
      // Fetch stories directly from backend
      const adminToken = localStorage.getItem('adminToken');
      const storiesResponse = await fetch('http://localhost:8080/api/stories?page=0&size=100', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (!storiesResponse.ok) {
        throw new Error(`Failed to fetch stories: ${storiesResponse.status} - ${storiesResponse.statusText}`);
      }

      const storiesResponseData = await storiesResponse.json();
      console.log('📚 Stories response from backend:', storiesResponseData);

      // Extract stories array from response
      const storiesData = storiesResponseData.content || storiesResponseData || [];
      console.log('📚 Stories array:', storiesData);

      // Fetch chapters for each story
      const storiesWithChapters: Story[] = [];
      
      for (const story of storiesData) {
        try {
          const chaptersResponse = await fetch(`http://localhost:8080/api/chapters/story/${story.id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminToken}`
            }
          });

          if (chaptersResponse.ok) {
            const chaptersData = await chaptersResponse.json();
            console.log(`📖 Chapters fetched for story ${story.id}:`, chaptersData);
            
            // Transform story data to match our interface
            const transformedStory: Story = {
              id: story.id,
              title: story.title,
              author: story.author || { id: 'unknown', username: 'Unknown Author' },
              totalChapters: story.totalChapters || 0,
              status: story.publishStatus || story.status || 'DRAFT',
              moderationStatus: story.moderationStatus || 'PENDING',
              chapters: Array.isArray(chaptersData) ? chaptersData.map((ch: any) => ({
                id: ch.id,
                chapterNumber: ch.chapterNumber,
                title: ch.title || 'Untitled Chapter',
                wordCount: ch.wordCount || 0,
                status: ch.status || 'DRAFT',
                moderationStatus: ch.moderationStatus || 'PENDING',
                createdAt: ch.createdAt,
                publishedAt: ch.publishedAt
              })) : []
            };
            
            storiesWithChapters.push(transformedStory);
          } else {
            console.warn(`⚠️ Failed to fetch chapters for story ${story.id}:`, chaptersResponse.status);
            // Still add story without chapters
            const transformedStory: Story = {
              id: story.id,
              title: story.title,
              author: story.author || { id: 'unknown', username: 'Unknown Author' },
              totalChapters: story.totalChapters || 0,
              status: story.publishStatus || story.status || 'DRAFT',
              moderationStatus: story.moderationStatus || 'PENDING',
              chapters: []
            };
            storiesWithChapters.push(transformedStory);
          }
        } catch (chapterError) {
          console.warn(`⚠️ Error fetching chapters for story ${story.id}:`, chapterError);
          // Still add story without chapters
          const transformedStory: Story = {
            id: story.id,
            title: story.title,
            author: story.author || { id: 'unknown', username: 'Unknown Author' },
            totalChapters: story.totalChapters || 0,
            status: story.publishStatus || story.status || 'DRAFT',
            moderationStatus: story.moderationStatus || 'PENDING',
            chapters: []
          };
          storiesWithChapters.push(transformedStory);
        }
      }

      console.log('✅ Final stories with chapters:', storiesWithChapters);
      setStories(storiesWithChapters);
      
    } catch (error) {
      console.error('❌ Error loading stories:', error);
      setError(`Failed to load stories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // UI INTERACTION FUNCTIONS
  // ============================================================================

  const toggleStoryExpansion = (storyId: string) => {
    const newExpanded = new Set(expandedStories);
    if (newExpanded.has(storyId)) {
      newExpanded.delete(storyId);
    } else {
      newExpanded.add(storyId);
    }
    setExpandedStories(newExpanded);
  };

  const detectLanguage = async (storyId: string, chapterId: string, chapterNumber: number) => {
    setClassifyingChapters(prev => new Set(prev).add(chapterId));
    
    try {
      const startTime = Date.now();
      console.log(`🌐 Starting language detection for chapter ${chapterNumber} of story ${storyId}`);
      
      let plainTextContent: string;
      
      // Check if we already have the plain text content in our state
      if (chapterContents.has(chapterId)) {
        plainTextContent = chapterContents.get(chapterId)!;
        console.log(`📄 Using cached plain text content, length: ${plainTextContent.length}`);
      } else {
        // Fetch the chapter content if not already loaded
        const adminToken = localStorage.getItem('adminToken');
        const contentResponse = await fetch(`http://localhost:8080/api/chapters/story/${storyId}/chapter/${chapterNumber}?trackView=false`, {
          method: 'GET',
          headers: {
            'Accept': 'text/plain',
            'Authorization': `Bearer ${adminToken}`
          }
        });

        if (!contentResponse.ok) {
          throw new Error(`Failed to fetch chapter content: ${contentResponse.status}`);
        }

        const chapterContent = await contentResponse.text();
        console.log(`📖 Chapter content fetched, length: ${chapterContent.length}`);

        if (!chapterContent.trim()) {
          throw new Error('Chapter content is empty');
        }

        plainTextContent = stripHtmlTags(chapterContent).trim();
        console.log(`📄 Plain text content length: ${plainTextContent.length}`);
        
        // Store the plain text content for future use
        setChapterContents(prev => new Map(prev).set(chapterId, plainTextContent));
      }

      if (!plainTextContent) {
        throw new Error('Chapter content is empty after HTML stripping');
      }

      // Validate text length for the optimized endpoint
      if (plainTextContent.length > 10000) {
        console.warn(`⚠️ Text length (${plainTextContent.length}) exceeds recommended limit, truncating...`);
        plainTextContent = plainTextContent.substring(0, 10000);
      }

      console.log(`📄 Plain text preview:`, plainTextContent.substring(0, 200) + '...');

      // Send plain text content to optimized language detection API
      console.log(`🚀 Sending to optimized language detection API:`, {
        plainTextLength: plainTextContent.length,
        textPreview: plainTextContent.substring(0, 100) + '...',
        chapterId,
        storyId
      });
      
      const adminToken = localStorage.getItem('adminToken');
      
      // Use fetch with timeout for better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      try {
        const languageDetectionResponse = await fetch('/api/admin/text-classification/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            text: plainTextContent,
            metadata: {
              chapter_id: chapterId,
              story_id: storyId,
              chapter_number: chapterNumber,
              source: 'admin_moderation_dashboard'
            }
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!languageDetectionResponse.ok) {
          const errorData = await languageDetectionResponse.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(`Language detection failed: ${languageDetectionResponse.status} - ${errorData.error || languageDetectionResponse.statusText}`);
        }

        const languageDetectionResult = await languageDetectionResponse.json();
        const processingTime = Date.now() - startTime;
        
        console.log(`✅ Language detection successful:`, {
          processingTime: `${processingTime}ms`,
          predicted_category: languageDetectionResult.predicted_category,
          confidence: languageDetectionResult.confidence,
          cached: languageDetectionResult.proxy_info?.cached || false,
          queue_position: languageDetectionResult.proxy_info?.queue_position || 0,
          performance: languageDetectionResult.performance_metrics
        });

        // Update the chapter with language detection results
        setStories(prevStories => 
          prevStories.map(story => 
            story.id === storyId 
              ? {
                  ...story,
                  chapters: story.chapters.map(chapter => 
                    chapter.id === chapterId
                      ? {
                          ...chapter,
                          classification: {
                            predicted_category: languageDetectionResult.predicted_category,
                            confidence: languageDetectionResult.confidence,
                            top_categories: languageDetectionResult.top_categories || [],
                            timestamp: languageDetectionResult.timestamp || new Date().toISOString(),
                            performance: {
                              processing_time_ms: processingTime,
                              server_processing_time_ms: languageDetectionResult.performance_metrics?.processing_time_ms,
                              cached: languageDetectionResult.proxy_info?.cached || false,
                              queue_position: languageDetectionResult.proxy_info?.queue_position || 0
                            }
                          }
                        }
                      : chapter
                  )
                }
              : story
          )
        );
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Language detection request timed out (15s)');
        }
        throw fetchError;
      }

    } catch (error) {
      console.error(`❌ Error detecting language for chapter ${chapterNumber}:`, error);
      
      // Update chapter with error state
      setStories(prevStories => 
        prevStories.map(story => 
          story.id === storyId 
            ? {
                ...story,
                chapters: story.chapters.map(chapter => 
                  chapter.id === chapterId
                    ? {
                        ...chapter,
                        classification: {
                          predicted_category: 'error',
                          confidence: 0,
                          top_categories: [],
                          timestamp: new Date().toISOString(),
                          error: error instanceof Error ? error.message : 'Unknown error'
                        }
                      }
                    : chapter
                )
              }
            : story
        )
      );
      
    } finally {
      setClassifyingChapters(prev => {
        const newSet = new Set(prev);
        newSet.delete(chapterId);
        return newSet;
      });
    }
  };

  const viewChapterContent = async (storyId: string, chapterId: string, chapterNumber: number) => {
    // Toggle content visibility
    const newViewingContent = new Set(viewingContent);
    if (newViewingContent.has(chapterId)) {
      newViewingContent.delete(chapterId);
      setViewingContent(newViewingContent);
      return;
    }

    // If content is not already loaded, fetch it
    if (!chapterContents.has(chapterId)) {
      setLoadingContent(prev => new Set(prev).add(chapterId));
      
      try {
        console.log(`📖 Fetching content for chapter ${chapterNumber} of story ${storyId}`);
        
        const adminToken = localStorage.getItem('adminToken');
        const contentResponse = await fetch(`http://localhost:8080/api/chapters/story/${storyId}/chapter/${chapterNumber}?trackView=false`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          }
        });

        if (!contentResponse.ok) {
          throw new Error(`Failed to fetch chapter content: ${contentResponse.status}`);
        }

        const chapterResponse = await contentResponse.json();
        const content = chapterResponse.content || '';
        console.log(`📝 Content fetched, length: ${content.length}`);
        console.log(`📝 Raw content preview:`, content.substring(0, 300));
        
        const plainTextContent = stripHtmlTags(content).trim();
        console.log(`📄 Plain text content length: ${plainTextContent.length}`);
        console.log(`📄 Plain text preview:`, plainTextContent.substring(0, 300));
        
        // Store the plain text content
        setChapterContents(prev => new Map(prev).set(chapterId, plainTextContent));
        console.log(`💾 Stored content for chapter ${chapterId}, map size:`, chapterContents.size + 1);
        
      } catch (error) {
        console.error(`❌ Error fetching chapter content:`, error);
        // Store error message as content
        setChapterContents(prev => new Map(prev).set(chapterId, `Error loading content: ${error}`));
      } finally {
        setLoadingContent(prev => {
          const newSet = new Set(prev);
          newSet.delete(chapterId);
          return newSet;
        });
      }
    }

    // Show the content
    newViewingContent.add(chapterId);
    setViewingContent(newViewingContent);
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  const getModerationStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getClassificationColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'fantasy': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'romance': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'mystery': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'scifi': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'horror': return 'bg-red-100 text-red-800 border-red-200';
      case 'comedy': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'drama': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'adventure': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getModerationStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircleIcon className="w-4 h-4" />;
      case 'REJECTED': return <XCircleIcon className="w-4 h-4" />;
      case 'PENDING': return <ClockIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getStatusSummary = () => {
    const allChapters = stories.flatMap(story => story.chapters);
    const pending = allChapters.filter(ch => (ch.moderationStatus || 'PENDING') === 'PENDING').length;
    const approved = allChapters.filter(ch => (ch.moderationStatus || 'PENDING') === 'APPROVED').length;
    const rejected = allChapters.filter(ch => (ch.moderationStatus || 'PENDING') === 'REJECTED').length;
    
    return { pending, approved, rejected, total: allChapters.length };
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const stripHtmlTags = (html: string): string => {
    // Create a temporary div element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    // Get text content and clean up extra whitespace
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    console.log('🔍 HTML stripping debug:', {
      originalLength: html.length,
      strippedLength: textContent.length,
      originalPreview: html.substring(0, 200),
      strippedPreview: textContent.substring(0, 200)
    });
    return textContent;
  };

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Content</h2>
          <p className="text-gray-600">Fetching stories and chapters for moderation...</p>
        </div>
      </div>
    );
  }

  const statusSummary = getStatusSummary();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Content Moderation Dashboard</h1>
                <p className="mt-2 text-gray-600">Review and moderate story content for publication approval</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={loadStories}
                  disabled={loading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="w-4 h-4" />
                      Refresh
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setSelectedView('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedView === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedView('stories')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedView === 'stories'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Stories ({stories.length})
            </button>
            <button
              onClick={() => {
                setSelectedView('text-classification');
                loadTextClassificationData();
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedView === 'text-classification'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Text Classification
            </button>
          </nav>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <ExclamationTriangleIcon className="w-5 h-5" />
              <span className="font-medium">Error:</span>
            </div>
            <p className="mt-1 text-red-700">{error}</p>
          </div>
        )}

        {/* Overview Tab */}
        {selectedView === 'overview' && (
          <div className="space-y-6">
            {/* Status Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Chapters</p>
                      <p className="text-3xl font-bold text-blue-900">{statusSummary.total}</p>
                    </div>
                    <div className="p-3 bg-blue-200 rounded-full">
                      <BookOpenIcon className="w-8 h-8 text-blue-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Pending Review</p>
                      <p className="text-3xl font-bold text-yellow-900">{statusSummary.pending}</p>
                    </div>
                    <div className="p-3 bg-yellow-200 rounded-full">
                      <ClockIcon className="w-8 h-8 text-yellow-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Approved</p>
                      <p className="text-3xl font-bold text-green-900">{statusSummary.approved}</p>
                    </div>
                    <div className="p-3 bg-green-200 rounded-full">
                      <CheckCircleIcon className="w-8 h-8 text-green-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">Rejected</p>
                      <p className="text-3xl font-bold text-red-900">{statusSummary.rejected}</p>
                    </div>
                    <div className="p-3 bg-red-200 rounded-full">
                      <XCircleIcon className="w-8 h-8 text-red-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Model Health Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CpuChipIcon className="w-5 h-5" />
                  Model Health Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {textClassificationData.health && !textClassificationData.health.error ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Status</p>
                          <p className="text-lg font-bold text-green-900">
                            {textClassificationData.health.status || 'Unknown'}
                          </p>
                        </div>
                        <CheckCircleIcon className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Total Requests</p>
                          <p className="text-lg font-bold text-blue-900">
                            {textClassificationData.health.total_requests || textClassificationData.health.proxy_info?.total_requests || 0}
                          </p>
                        </div>
                        <GlobeAltIcon className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-600">Model URL</p>
                          <p className="text-sm font-bold text-purple-900 truncate">
                            {textClassificationData.health.model_url || textClassificationData.health.proxy_info?.model_url || 'N/A'}
                          </p>
                        </div>
                        <CpuChipIcon className="w-8 h-8 text-purple-600" />
                      </div>
                    </div>
                    
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-600">Response Time</p>
                          <p className="text-lg font-bold text-orange-900">
                            {textClassificationData.health.proxy_info?.response_time_ms ? `${textClassificationData.health.proxy_info.response_time_ms}ms` : 'N/A'}
                          </p>
                        </div>
                        <ClockIcon className="w-8 h-8 text-orange-600" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                      <p className="text-red-800 font-medium">
                        {textClassificationData.health?.error || 'Health data not available'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Model Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5" />
                  Model Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {textClassificationData.stats && !textClassificationData.stats.error ? (
                  <div className="space-y-4">
                    {/* Key Metrics */}
                    {(textClassificationData.stats.total_requests || textClassificationData.stats.categories_count) && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {textClassificationData.stats.total_requests && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-blue-600">Total Requests</p>
                            <p className="text-xl font-bold text-blue-900">{textClassificationData.stats.total_requests}</p>
                          </div>
                        )}
                        {textClassificationData.stats.categories_count && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-green-600">Categories</p>
                            <p className="text-xl font-bold text-green-900">{textClassificationData.stats.categories_count}</p>
                          </div>
                        )}
                        {textClassificationData.stats.proxy_info?.response_time_ms && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-purple-600">Response Time</p>
                            <p className="text-xl font-bold text-purple-900">{textClassificationData.stats.proxy_info.response_time_ms}ms</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Raw Statistics */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-2">Raw Statistics Data</h4>
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(textClassificationData.stats, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                      <p className="text-red-800 font-medium">
                        {textClassificationData.stats?.error || 'Statistics data not available'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CpuChipIcon className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => setSelectedView('stories')}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2"
                  >
                    <BookOpenIcon className="w-6 h-6" />
                    <span>Review Stories</span>
                  </Button>
                  <Button
                    onClick={() => {
                      loadStories();
                      loadTextClassificationData();
                    }}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2"
                  >
                    <ArrowPathIcon className="w-6 h-6" />
                    <span>Refresh All Data</span>
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedView('text-classification');
                      loadTextClassificationData();
                    }}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2"
                  >
                    <GlobeAltIcon className="w-6 h-6" />
                    <span>Text Classification</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stories Tab */}
        {selectedView === 'stories' && (
          <div className="space-y-6">
            {stories.length === 0 && !loading ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No Stories Found</h3>
                  <p className="text-gray-600">There are no stories available for moderation at this time.</p>
                </CardContent>
              </Card>
            ) : (
              stories.map((story) => (
                <Card key={story.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStoryExpansion(story.id)}
                          className="p-2 hover:bg-white"
                        >
                          {expandedStories.has(story.id) ? (
                            <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                          ) : (
                            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                          )}
                        </Button>
                        <div className="flex-1">
                          <CardTitle className="text-xl text-gray-900 mb-1">{story.title}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <UserIcon className="w-4 h-4" />
                              {story.author.displayName || story.author.username}
                            </span>
                            <span className="flex items-center gap-1">
                              <DocumentTextIcon className="w-4 h-4" />
                              {story.chapters.length} chapters
                            </span>
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-4 h-4" />
                              {story.chapters.length > 0 ? formatDate(story.chapters[0].createdAt || '') : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`${getModerationStatusColor(story.moderationStatus || 'PENDING')} px-3 py-1`}>
                          <div className="flex items-center gap-1">
                            {getModerationStatusIcon(story.moderationStatus || 'PENDING')}
                            {story.moderationStatus || 'PENDING'}
                          </div>
                        </Badge>
                        <Badge variant="outline" className="px-3 py-1">
                          {story.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {expandedStories.has(story.id) && (
                    <CardContent className="pt-6">
                      <div className="border-t pt-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <BookOpenIcon className="w-5 h-5" />
                          Chapters ({story.chapters.length})
                        </h4>
                        {story.chapters.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                            <p>No chapters available</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {story.chapters.map((chapter) => (
                              <div key={chapter.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-4">
                                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                      Chapter {chapter.chapterNumber}
                                    </div>
                                    <div>
                                      <h5 className="font-semibold text-gray-900 text-lg">{chapter.title}</h5>
                                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                        <span>{chapter.wordCount} words</span>
                                        <span>•</span>
                                        <span>{formatDate(chapter.createdAt || '')}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => viewChapterContent(story.id, chapter.id, chapter.chapterNumber)}
                                      disabled={loadingContent.has(chapter.id)}
                                      className="flex items-center gap-2"
                                    >
                                      {loadingContent.has(chapter.id) ? (
                                        <>
                                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                                          Loading...
                                        </>
                                      ) : (
                                        <>
                                          <EyeIcon className="w-4 h-4" />
                                          {viewingContent.has(chapter.id) ? 'Hide Content' : 'View Content'}
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => detectLanguage(story.id, chapter.id, chapter.chapterNumber)}
                                      disabled={classifyingChapters.has(chapter.id)}
                                      className="flex items-center gap-2"
                                    >
                                      {classifyingChapters.has(chapter.id) ? (
                                        <>
                                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                          Detecting...
                                        </>
                                      ) : (
                                        <>
                                          <CpuChipIcon className="w-4 h-4" />
                                          Detect Language
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3 mb-4">
                                  <Badge className={`${getModerationStatusColor(chapter.moderationStatus || 'PENDING')} px-3 py-1`}>
                                    <div className="flex items-center gap-1">
                                      {getModerationStatusIcon(chapter.moderationStatus || 'PENDING')}
                                      {chapter.moderationStatus || 'PENDING'}
                                    </div>
                                  </Badge>
                                  <Badge variant="outline" className="px-3 py-1">
                                    {chapter.status}
                                  </Badge>
                                </div>

                                {/* Chapter Content Display */}
                                {viewingContent.has(chapter.id) && (
                                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        <EyeIcon className="w-4 h-4 text-green-600" />
                                        <span className="font-medium text-gray-700">Chapter Content (Plain Text)</span>
                                        <Badge variant="outline" className="text-xs px-2 py-0">
                                          HTML Stripped
                                        </Badge>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => detectLanguage(story.id, chapter.id, chapter.chapterNumber)}
                                        disabled={classifyingChapters.has(chapter.id)}
                                        className="flex items-center gap-2"
                                      >
                                        {classifyingChapters.has(chapter.id) ? (
                                          <>
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                            Detecting...
                                          </>
                                        ) : (
                                          <>
                                            <CpuChipIcon className="w-3 h-3" />
                                            Detect Language
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                    <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                                      <div className="flex items-center gap-1">
                                        <DocumentTextIcon className="w-3 h-3" />
                                        <span>Content is automatically converted to plain text (HTML tags removed) for better readability and analysis.</span>
                                      </div>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto bg-white p-4 rounded border text-sm">
                                      <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                                        {(() => {
                                          const content = chapterContents.get(chapter.id) || 'Loading content...';
                                          console.log(`🖥️ Rendering content for chapter ${chapter.id}:`, {
                                            hasContent: chapterContents.has(chapter.id),
                                            contentLength: content.length,
                                            contentPreview: content.substring(0, 100)
                                          });
                                          return content;
                                        })()}
                                      </div>
                                    </div>
                                    <div className="mt-3 text-xs text-gray-500 flex items-center gap-4">
                                      <span>Content length: {chapterContents.get(chapter.id)?.length || 0} characters</span>
                                      <span>Words: {chapterContents.get(chapter.id)?.split(/\s+/).length || 0}</span>
                                    </div>
                                  </div>
                                )}

                                {/* Language Detection Results - Full JSON Response */}
                                {chapter.classification && (
                                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center gap-2 mb-3">
                                      <GlobeAltIcon className="w-5 h-5 text-blue-600" />
                                      <span className="font-medium text-gray-700">Language Detection Results (Full JSON)</span>
                                      <Badge variant="outline" className="text-xs px-2 py-0 bg-blue-100 text-blue-700 border-blue-200">
                                        Complete Response
                                      </Badge>
                                    </div>
                                    <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                                      <div className="flex items-center gap-1">
                                        <CpuChipIcon className="w-3 h-3" />
                                        <span>Full API response from language detection service including all metadata.</span>
                                      </div>
                                    </div>
                                    
                                    {/* Quick Summary */}
                                    <div className="mb-3 p-3 bg-white rounded border">
                                      <div className="flex items-center gap-3 mb-3">
                                        <Badge className={`${getClassificationColor(chapter.classification.predicted_category)} px-3 py-1 border`}>
                                          {chapter.classification.predicted_category.toUpperCase()}
                                        </Badge>
                                        <span className="text-sm text-gray-600 font-medium">
                                          {Math.round(chapter.classification.confidence * 100)}% confidence
                                        </span>
                                        {chapter.classification.performance && (
                                          <span className="text-xs text-gray-500">
                                            {chapter.classification.performance.processing_time_ms}ms
                                          </span>
                                        )}
                                      </div>
                                      
                                      {/* All Categories with Percentages */}
                                      {chapter.classification.all_probabilities && (
                                        <div className="space-y-2">
                                          <h5 className="text-sm font-medium text-gray-700 mb-2">All Categories:</h5>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {Object.entries(chapter.classification.all_probabilities)
                                              .sort(([,a], [,b]) => (b as number) - (a as number))
                                              .map(([category, probability]) => (
                                                <div key={category} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                                                  <span className={`text-sm font-medium ${
                                                    category === chapter.classification.predicted_category 
                                                      ? 'text-blue-700' 
                                                      : 'text-gray-600'
                                                  }`}>
                                                    {category.replace('_', ' ').toUpperCase()}
                                                  </span>
                                                  <span className={`text-sm font-bold ${
                                                    category === chapter.classification.predicted_category 
                                                      ? 'text-blue-700' 
                                                      : 'text-gray-500'
                                                  }`}>
                                                    {Math.round((probability as number) * 100)}%
                                                  </span>
                                                </div>
                                              ))
                                            }
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Full JSON Response */}
                                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                                      <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-medium text-gray-300">Complete API Response</h4>
                                        <button 
                                          onClick={() => {
                                            navigator.clipboard.writeText(JSON.stringify(chapter.classification, null, 2));
                                            alert('JSON copied to clipboard!');
                                          }}
                                          className="text-xs text-blue-400 hover:text-blue-300 underline"
                                        >
                                          Copy JSON
                                        </button>
                                      </div>
                                      <pre className="text-xs text-green-400 whitespace-pre-wrap font-mono leading-relaxed">
                                        {JSON.stringify(chapter.classification, null, 2)}
                                      </pre>
                                    </div>
                                    
                                    <div className="mt-2 text-xs text-gray-500">
                                      Analyzed: {formatDate(chapter.classification.timestamp)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
        )}
        
        {/* Text Classification Tab */}
        {selectedView === 'text-classification' && (
          <div className="space-y-6">
            {textClassificationData.loading && (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading text classification data...</p>
                </CardContent>
              </Card>
            )}
            
            {textClassificationData.error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                    <div>
                      <h3 className="font-semibold text-red-800">Error Loading Data</h3>
                      <p className="text-red-600">{textClassificationData.error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {!textClassificationData.loading && !textClassificationData.error && (
              <>
                {/* Model Health Status - Moved to Top */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CpuChipIcon className="w-5 h-5" />
                      Model Health Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {textClassificationData.health && !textClassificationData.health.error ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-600">Status</p>
                              <p className="text-lg font-bold text-green-900">
                                {textClassificationData.health.status || 'Unknown'}
                              </p>
                            </div>
                            <CheckCircleIcon className="w-8 h-8 text-green-600" />
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-600">Total Requests</p>
                              <p className="text-lg font-bold text-blue-900">
                                {textClassificationData.health.total_requests || textClassificationData.health.proxy_info?.total_requests || 0}
                              </p>
                            </div>
                            <GlobeAltIcon className="w-8 h-8 text-blue-600" />
                          </div>
                        </div>
                        
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-purple-600">Model URL</p>
                              <p className="text-sm font-bold text-purple-900 truncate">
                                {textClassificationData.health.model_url || textClassificationData.health.proxy_info?.model_url || 'N/A'}
                              </p>
                            </div>
                            <CpuChipIcon className="w-8 h-8 text-purple-600" />
                          </div>
                        </div>
                        
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-orange-600">Response Time</p>
                              <p className="text-lg font-bold text-orange-900">
                                {textClassificationData.health.proxy_info?.response_time_ms ? `${textClassificationData.health.proxy_info.response_time_ms}ms` : 'N/A'}
                              </p>
                            </div>
                            <ClockIcon className="w-8 h-8 text-orange-600" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                          <p className="text-red-800 font-medium">
                            {textClassificationData.health?.error || 'Health data not available'}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Test Actions - Batch Predict Moved to Top */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CpuChipIcon className="w-5 h-5" />
                      Test Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button
                        onClick={loadTextClassificationData}
                        variant="outline"
                        className="h-20 flex flex-col items-center justify-center gap-2"
                      >
                        <ArrowPathIcon className="w-6 h-6" />
                        <span>Refresh Data</span>
                      </Button>
                      
                      <Button
                        onClick={testBatchPredict}
                        variant="outline"
                        className="h-20 flex flex-col items-center justify-center gap-2"
                      >
                        <CpuChipIcon className="w-6 h-6" />
                        <span>Test Batch Predict</span>
                      </Button>
                      
                      <Button
                        onClick={() => {
                          if (textClassificationData.docs) {
                            console.log('API Documentation:', textClassificationData.docs);
                            alert('API documentation logged to console');
                          }
                        }}
                        variant="outline"
                        className="h-20 flex flex-col items-center justify-center gap-2"
                      >
                        <BookOpenIcon className="w-6 h-6" />
                        <span>View Docs</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Quick Predict (Plain Text) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CpuChipIcon className="w-5 h-5" />
                      Quick Predict (Plain Text)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="quickText" className="block text-sm font-medium text-gray-700 mb-2">
                          Text to Classify
                        </label>
                        <textarea
                          id="quickText"
                          value={quickText}
                          onChange={(e) => setQuickText(e.target.value)}
                          placeholder="Enter text to classify..."
                          className="w-full h-32 p-3 border border-gray-300 rounded-md resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-sm text-gray-500">
                            {quickText.length} characters
                            {quickText.length > 10000 && (
                              <span className="text-orange-600 font-medium ml-2">
                                (will be truncated to 10,000 characters)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={submitQuickPredict} 
                          disabled={quickLoading || quickText.trim().length === 0}
                          className="flex items-center gap-2"
                        >
                          {quickLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Running...
                            </>
                          ) : (
                            <>
                              <CpuChipIcon className="w-4 h-4" />
                              Run Predict
                            </>
                          )}
                        </Button>
                        
                        {quickResult && (
                          <Button
                            onClick={() => {
                              navigator.clipboard.writeText(JSON.stringify(quickResult, null, 2));
                              alert('JSON copied to clipboard!');
                            }}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <DocumentDuplicateIcon className="w-4 h-4" />
                            Copy JSON
                          </Button>
                        )}
                      </div>
                      
                      {(quickResult || quickError) && (
                        <div className="border border-gray-200 rounded-lg">
                          <button
                            onClick={() => setQuickExpanded(!quickExpanded)}
                            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
                          >
                            <span className="font-medium text-gray-700">
                              {quickError ? 'Error Details' : 'Prediction Results'}
                            </span>
                            {quickExpanded ? (
                              <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                            )}
                          </button>
                          
                          {quickExpanded && (
                            <div className="border-t border-gray-200 p-3">
                              {quickError ? (
                                <div className="bg-red-50 border border-red-200 rounded p-3">
                                  <p className="text-red-800 font-medium">Error:</p>
                                  <p className="text-red-700 mt-1">{quickError}</p>
                                </div>
                              ) : quickResult ? (
                                 <div className="space-y-3">
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                       <p className="text-sm font-medium text-blue-600">Predicted Category</p>
                                       <p className="text-lg font-bold text-blue-900">
                                         {quickResult.predicted_category || 'N/A'}
                                       </p>
                                     </div>
                                     <div className="bg-green-50 border border-green-200 rounded p-3">
                                       <p className="text-sm font-medium text-green-600">Confidence</p>
                                       <p className="text-lg font-bold text-green-900">
                                         {quickResult.confidence ? `${(quickResult.confidence * 100).toFixed(1)}%` : 'N/A'}
                                       </p>
                                     </div>
                                   </div>
                                   
                                   {/* All Categories with Percentages */}
                                   {quickResult.all_probabilities && (
                                     <div className="bg-white border border-gray-200 rounded p-3">
                                       <h5 className="text-sm font-medium text-gray-700 mb-3">All Categories:</h5>
                                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                         {Object.entries(quickResult.all_probabilities)
                                           .sort(([,a], [,b]) => (b as number) - (a as number))
                                           .map(([category, probability]) => (
                                             <div key={category} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                                               <span className={`text-sm font-medium ${
                                                 category === quickResult.predicted_category 
                                                   ? 'text-blue-700' 
                                                   : 'text-gray-600'
                                               }`}>
                                                 {category.replace('_', ' ').toUpperCase()}
                                               </span>
                                               <span className={`text-sm font-bold ${
                                                 category === quickResult.predicted_category 
                                                   ? 'text-blue-700' 
                                                   : 'text-gray-500'
                                               }`}>
                                                 {Math.round((probability as number) * 100)}%
                                               </span>
                                             </div>
                                           ))
                                         }
                                       </div>
                                     </div>
                                   )}
                                  
                                  <div className="bg-gray-50 rounded p-3">
                                    <h4 className="font-medium text-gray-700 mb-2">Full JSON Response</h4>
                                    <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto">
                                      {JSON.stringify(quickResult, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Statistics - Moved to Top */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DocumentTextIcon className="w-5 h-5" />
                      Model Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {textClassificationData.stats && !textClassificationData.stats.error ? (
                      <div className="space-y-4">
                        {/* Key Metrics */}
                        {(textClassificationData.stats.total_requests || textClassificationData.stats.categories_count) && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            {textClassificationData.stats.total_requests && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm font-medium text-blue-600">Total Requests</p>
                                <p className="text-xl font-bold text-blue-900">{textClassificationData.stats.total_requests}</p>
                              </div>
                            )}
                            {textClassificationData.stats.categories_count && (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <p className="text-sm font-medium text-green-600">Categories</p>
                                <p className="text-xl font-bold text-green-900">{textClassificationData.stats.categories_count}</p>
                              </div>
                            )}
                            {textClassificationData.stats.proxy_info?.response_time_ms && (
                              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                <p className="text-sm font-medium text-purple-600">Response Time</p>
                                <p className="text-xl font-bold text-purple-900">{textClassificationData.stats.proxy_info.response_time_ms}ms</p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Raw Statistics */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-700 mb-2">Raw Statistics Data</h4>
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
                            {JSON.stringify(textClassificationData.stats, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                          <p className="text-red-800 font-medium">
                            {textClassificationData.stats?.error || 'Statistics data not available'}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* API Documentation - Moved to Top */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpenIcon className="w-5 h-5" />
                      API Documentation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {textClassificationData.docs ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(textClassificationData.docs.endpoints || {}).map(([key, endpoint]: [string, any]) => (
                            <div key={key} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {endpoint.method}
                                </Badge>
                                <h4 className="font-semibold text-gray-900">{key}</h4>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{endpoint.description}</p>
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {endpoint.path}
                              </code>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">Documentation not available</p>
                    )}
                  </CardContent>
                </Card>
                
                {/* Performance Metrics */}
                {textClassificationData.performance && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ClockIcon className="w-5 h-5" />
                        Dashboard Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-indigo-600">Load Time</p>
                              <p className="text-lg font-bold text-indigo-900">
                                {textClassificationData.performance.loadTime}ms
                              </p>
                            </div>
                            <ClockIcon className="w-8 h-8 text-indigo-600" />
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Last Updated</p>
                              <p className="text-sm font-bold text-gray-900">
                                {new Date(textClassificationData.performance.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <CalendarIcon className="w-8 h-8 text-gray-600" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Duplicate sections removed - moved to top */}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}