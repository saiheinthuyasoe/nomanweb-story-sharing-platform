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
  const [selectedView, setSelectedView] = useState<'overview' | 'stories'>('overview');

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    loadStories();
  }, []);

  // ============================================================================
  // DATA LOADING FUNCTIONS
  // ============================================================================
  
  const loadStories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading stories for moderation...');
      
      // Fetch stories directly from backend
      const storiesResponse = await fetch('http://localhost:8080/api/stories?page=0&size=100', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
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
              'Content-Type': 'application/json'
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
      console.log(`🌐 Starting language detection for chapter ${chapterNumber} of story ${storyId}`);
      
      let plainTextContent: string;
      
      // Check if we already have the plain text content in our state
      if (chapterContents.has(chapterId)) {
        plainTextContent = chapterContents.get(chapterId)!;
        console.log(`📄 Using cached plain text content, length: ${plainTextContent.length}`);
      } else {
        // Fetch the chapter content if not already loaded
        const contentResponse = await fetch(`http://localhost:8080/api/chapter-content/story/${storyId}/chapter/${chapterNumber}?trackView=false`, {
          method: 'GET',
          headers: {
            'Accept': 'text/plain'
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

      console.log(`📄 Plain text preview:`, plainTextContent.substring(0, 200) + '...');

      // Send plain text content to language detection API
      console.log(`🚀 Sending to language detection API:`, {
        plainTextLength: plainTextContent.length,
        textPreview: plainTextContent.substring(0, 100) + '...'
      });
      
      const languageDetectionResponse = await fetch('/api/admin/text-classification/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: plainTextContent
        })
      });

      if (!languageDetectionResponse.ok) {
        throw new Error(`Language detection failed: ${languageDetectionResponse.status}`);
      }

      const languageDetectionResult = await languageDetectionResponse.json();
      console.log(`🌐 Language detection result:`, languageDetectionResult);

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
                          timestamp: new Date().toISOString()
                        }
                      }
                    : chapter
                )
              }
            : story
        )
      );

    } catch (error) {
      console.error(`❌ Error detecting language for chapter ${chapterNumber}:`, error);
      // You could add a toast notification here
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
        
        const contentResponse = await fetch(`http://localhost:8080/api/chapter-content/story/${storyId}/chapter/${chapterNumber}?trackView=false`, {
          method: 'GET',
          headers: {
            'Accept': 'text/plain'
          }
        });

        if (!contentResponse.ok) {
          throw new Error(`Failed to fetch chapter content: ${contentResponse.status}`);
        }

        const content = await contentResponse.text();
        console.log(`📝 Content fetched, length: ${content.length}`);
        
        const plainTextContent = stripHtmlTags(content).trim();
        console.log(`📄 Plain text content length: ${plainTextContent.length}`);
        
        // Store the plain text content
        setChapterContents(prev => new Map(prev).set(chapterId, plainTextContent));
        
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
    return tempDiv.textContent || tempDiv.innerText || '';
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
                    onClick={loadStories}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2"
                  >
                    <ArrowPathIcon className="w-6 h-6" />
                    <span>Refresh Data</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2"
                  >
                    <GlobeAltIcon className="w-6 h-6" />
                    <span>Language Stats</span>
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
                                        {chapterContents.get(chapter.id) || 'Loading content...'}
                                      </div>
                                    </div>
                                    <div className="mt-3 text-xs text-gray-500 flex items-center gap-4">
                                      <span>Content length: {chapterContents.get(chapter.id)?.length || 0} characters</span>
                                      <span>Words: {chapterContents.get(chapter.id)?.split(/\s+/).length || 0}</span>
                                    </div>
                                  </div>
                                )}

                                {/* Language Detection Results */}
                                {chapter.classification && (
                                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center gap-2 mb-3">
                                      <GlobeAltIcon className="w-5 h-5 text-blue-600" />
                                      <span className="font-medium text-gray-700">Language Detection Results</span>
                                      <Badge variant="outline" className="text-xs px-2 py-0 bg-blue-100 text-blue-700 border-blue-200">
                                        Plain Text Analyzed
                                      </Badge>
                                    </div>
                                    <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                                      <div className="flex items-center gap-1">
                                        <CpuChipIcon className="w-3 h-3" />
                                        <span>Language detection performed on clean plain text content for accurate results.</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 mb-3">
                                      <Badge className={`${getClassificationColor(chapter.classification.predicted_category)} px-3 py-1 border`}>
                                        {chapter.classification.predicted_category.toUpperCase()}
                                      </Badge>
                                      <span className="text-sm text-gray-600 font-medium">
                                        {Math.round(chapter.classification.confidence * 100)}% confidence
                                      </span>
                                    </div>
                                    {chapter.classification.top_categories && chapter.classification.top_categories.length > 1 && (
                                      <div className="text-sm text-gray-600">
                                        <span className="font-medium">Other possibilities: </span>
                                        {chapter.classification.top_categories
                                          .slice(1, 3)
                                          .map((cat, idx) => (
                                            <span key={cat.category}>
                                              {cat.category} ({Math.round(cat.probability * 100)}%)
                                              {idx < Math.min(chapter.classification!.top_categories.length - 2, 1) ? ', ' : ''}
                                            </span>
                                          ))
                                        }
                                      </div>
                                    )}
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
      </div>
    </div>
  );
}