'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Using standard HTML elements instead of missing UI components
import { Star, Eye, Heart, Calendar, TrendingUp, Plus, BookOpen } from 'lucide-react';
import { bookInsightsService, BookInsight, BookInsightsData } from '@/services/bookInsightsService';
import { adminHomepageService } from '@/services/adminHomepageService';
import { toast } from 'react-hot-toast';

interface BookInsightsDashboardProps {
  onAddToSection?: (book: BookInsight, sectionType: string) => void;
}

const BookInsightsDashboard: React.FC<BookInsightsDashboardProps> = ({ onAddToSection }) => {
  const [insightsData, setInsightsData] = useState<BookInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToSection, setAddingToSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('top-rated');

  useEffect(() => {
    loadInsightsData();
  }, []);

  const loadInsightsData = async () => {
    try {
      setLoading(true);
      const data = await bookInsightsService.getBookInsightsDashboard();
      setInsightsData(data);
    } catch (error) {
      console.error('Error loading insights data:', error);
      toast.error('Failed to load book insights');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToHome = async (book: BookInsight, sectionType: string) => {
    try {
      setAddingToSection(book.id);
      
      // Add to the specified section
      await adminHomepageService.addStoryToSection(sectionType, book.id);
      
      toast.success(`"${book.title}" added to ${sectionType.replace('_', ' ')} section`);
      
      if (onAddToSection) {
        onAddToSection(book, sectionType);
      }
    } catch (error) {
      console.error('Error adding book to section:', error);
      toast.error('Failed to add book to section');
    } finally {
      setAddingToSection(null);
    }
  };

  const formatNumber = (num: number | undefined | null): string => {
    if (num == null || num === undefined) {
      return '0';
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const BookCard: React.FC<{ 
    book: BookInsight; 
    showAddButton?: boolean; 
    sectionType?: string;
    showWeeklyStats?: boolean;
  }> = ({ book, showAddButton = true, sectionType = 'weekly_features', showWeeklyStats = false }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="w-16 h-20 bg-gray-200 rounded-md flex-shrink-0 overflow-hidden">
            {book.coverImageUrl ? (
              <img 
                src={book.coverImageUrl} 
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{book.title}</h4>
            <p className="text-xs text-gray-600 truncate">by {book.author.displayName}</p>
            
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {book.category.name}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span>{(book.averageRating || 0).toFixed(1)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{showWeeklyStats ? formatNumber(book.weeklyViews) : formatNumber(book.totalViews)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                <span>{showWeeklyStats ? formatNumber(book.weeklyLikes) : formatNumber(book.totalLikes)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(book.publishedAt)}</span>
              </div>
            </div>
            
            {showAddButton && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2 h-7 text-xs"
                onClick={() => handleAddToHome(book, sectionType)}
                disabled={addingToSection === book.id}
              >
                <Plus className="w-3 h-3 mr-1" />
                {addingToSection === book.id ? 'Adding...' : 'Add to Home'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-20 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!insightsData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load book insights</p>
        <Button onClick={loadInsightsData} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Book Insights Dashboard</h2>
          <p className="text-gray-600">Analytics and performance metrics for intelligent content curation</p>
        </div>
        <Button onClick={loadInsightsData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Top Rated</p>
                <p className="text-xl font-bold">{insightsData.topRated.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Weekly Trending</p>
                <p className="text-xl font-bold">{insightsData.mostReadWeekly.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">New Releases</p>
                <p className="text-xl font-bold">{insightsData.newReleases.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Total Genres</p>
                <p className="text-xl font-bold">{Object.keys(insightsData.byGenre).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <div className="space-y-4">
        <div className="flex border-b border-gray-200 mb-4">
          {[
            { key: 'top-rated', label: 'Top Rated' },
            { key: 'weekly-trending', label: 'Weekly Trending' },
            { key: 'new-releases', label: 'New Releases' },
            { key: 'by-genre', label: 'By Genre' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'top-rated' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Highest Rated Books
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {insightsData.topRated.map((book) => (
                  <BookCard 
                    key={book.id} 
                    book={book} 
                    sectionType="best_rating"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'weekly-trending' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Most Read This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {insightsData.mostReadWeekly.map((book) => (
                  <BookCard 
                    key={book.id} 
                    book={book} 
                    sectionType="weekly_features"
                    showWeeklyStats={true}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'new-releases' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Latest Published Books
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {insightsData.newReleases.map((book) => (
                  <BookCard 
                    key={book.id} 
                    book={book} 
                    sectionType="new_releases"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'by-genre' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(insightsData.byGenre).map(([genre, books]) => (
              <Card key={genre}>
                <CardHeader>
                  <CardTitle className="capitalize">{genre} Books</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {books.map((book) => (
                      <BookCard 
                        key={book.id} 
                        book={book} 
                        sectionType={`${genre}_section`}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookInsightsDashboard;