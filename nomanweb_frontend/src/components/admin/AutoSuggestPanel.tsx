'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Star, 
  Eye, 
  Heart, 
  TrendingUp, 
  Plus, 
  BookOpen, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { bookInsightsService, BookInsight, SuggestionCriteria } from '@/services/bookInsightsService';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface AutoSuggestPanelProps {
  sectionType: string;
  sectionTitle: string;
  onAddBook: (book: BookInsight) => void;
  excludeBookIds?: string[];
  className?: string;
}

const AutoSuggestPanel: React.FC<AutoSuggestPanelProps> = ({
  sectionType,
  sectionTitle,
  onAddBook,
  excludeBookIds = [],
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState<BookInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingBookId, setAddingBookId] = useState<string | null>(null);

  useEffect(() => {
    loadSuggestions();
  }, [sectionType, excludeBookIds]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      
      const criteria: SuggestionCriteria = {
        sectionType,
        limit: 5
      };

      // Add specific criteria based on section type
      switch (sectionType.toLowerCase()) {
        case 'weekly_features':
          criteria.minViews = 500;
          break;
        case 'best_rating':
          criteria.minRating = 4.0;
          break;
        case 'new_releases':
          // No additional criteria for new releases
          break;
        default:
          criteria.minRating = 3.5;
          break;
      }

      const allSuggestions = await bookInsightsService.getSuggestedBooks(criteria);
      
      // Filter out already selected books
      const filteredSuggestions = allSuggestions.filter(
        book => !excludeBookIds.includes(book.id)
      );
      
      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      if (error instanceof Error && error.message.includes('authentication')) {
        toast.error('Please log in as admin to access book suggestions');
        setSuggestions([]);
      } else {
        toast.error('Failed to load suggestions');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (book: BookInsight) => {
    try {
      setAddingBookId(book.id);
      onAddBook(book);
      
      // Remove the added book from suggestions
      setSuggestions(prev => prev.filter(b => b.id !== book.id));
      
      toast.success(`"${book.title}" added to ${sectionTitle}`);
    } catch (error) {
      console.error('Error adding book:', error);
      toast.error('Failed to add book');
    } finally {
      setAddingBookId(null);
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

  const getSectionIcon = () => {
    switch (sectionType.toLowerCase()) {
      case 'weekly_features':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'best_rating':
        return <Star className="w-4 h-4 text-yellow-500" />;
      case 'new_releases':
        return <Sparkles className="w-4 h-4 text-blue-500" />;
      default:
        return <BookOpen className="w-4 h-4 text-purple-500" />;
    }
  };

  const getSectionDescription = () => {
    switch (sectionType.toLowerCase()) {
      case 'weekly_features':
        return 'Books with highest weekly engagement';
      case 'best_rating':
        return 'Top-rated books from readers';
      case 'new_releases':
        return 'Recently published books';
      case 'homepage_carousel':
        return 'Popular books perfect for carousel display';
      case 'adventure':
      case 'comedy':
      case 'drama':
      case 'fantasy':
      case 'horror':
      case 'mystery':
      case 'romance':
      case 'science_fiction':
      case 'thriller':
      case 'young_adult':
        return `Books perfect for ${sectionTitle.toLowerCase()} genre section`;
      default:
        return 'Recommended books for this section';
    }
  };

  const getMetricLabel = () => {
    switch (sectionType.toLowerCase()) {
      case 'weekly_features':
        return 'weekly reads';
      case 'best_rating':
        return 'rating';
      case 'new_releases':
        return 'total reads';
      case 'homepage_carousel':
        return 'engagement';
      case 'adventure':
      case 'comedy':
      case 'drama':
      case 'fantasy':
      case 'horror':
      case 'mystery':
      case 'romance':
      case 'science_fiction':
      case 'thriller':
      case 'young_adult':
        return 'genre rating';
      default:
        return 'total reads';
    }
  };

  const getMetricValue = (book: BookInsight) => {
    switch (sectionType.toLowerCase()) {
      case 'weekly_features':
        return formatNumber(book.weeklyViews);
      case 'best_rating':
        return (book.averageRating || 0).toFixed(1);
      case 'new_releases':
        return formatNumber(book.totalViews);
      case 'homepage_carousel':
        return formatNumber(book.weeklyViews + book.totalLikes);
      case 'adventure':
      case 'comedy':
      case 'drama':
      case 'fantasy':
      case 'horror':
      case 'mystery':
      case 'romance':
      case 'science_fiction':
      case 'thriller':
      case 'young_adult':
        return (book.averageRating || 0).toFixed(1);
      default:
        return formatNumber(book.totalViews);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            {getSectionIcon()}
            Auto Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex gap-2">
                <div className="w-8 h-10 bg-gray-200 rounded" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-2 bg-gray-200 rounded w-1/2" />
                  <div className="h-2 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {getSectionIcon()}
            Auto Suggestions
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadSuggestions}
            disabled={loading}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {getSectionDescription()}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {suggestions.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-xs mb-2">No suggestions available</p>
            <p className="text-xs text-blue-600">
              <Link href="/admin/login" className="hover:underline">
                Login as admin to access suggestions
              </Link>
            </p>
          </div>
        ) : (
          suggestions.map((book, index) => (
            <div key={book.id}>
              <div className="flex gap-2 items-start">
                <div className="w-8 h-10 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                  {book.coverImageUrl ? (
                    <img 
                      src={book.coverImageUrl} 
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-3 h-3 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-xs truncate">{book.title}</h4>
                      <p className="text-xs text-gray-600 truncate">
                        by {book.author?.displayName || 'Unknown Author'}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          {book.category?.name || 'Uncategorized'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                          <span>{(book.averageRating || 0).toFixed(1)}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {sectionType.toLowerCase() === 'weekly_features' ? (
                            <TrendingUp className="w-2.5 h-2.5" />
                          ) : (
                            <Eye className="w-2.5 h-2.5" />
                          )}
                          <span>{getMetricValue(book)} {getMetricLabel()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddBook(book)}
                      disabled={addingBookId === book.id}
                      className="h-6 text-xs px-2 flex-shrink-0"
                    >
                      {addingBookId === book.id ? (
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      ) : (
                        <Plus className="w-2.5 h-2.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              {index < suggestions.length - 1 && (
                <Separator className="mt-3" />
              )}
            </div>
          ))
        )}
        
        {suggestions.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-500 text-center">
              Showing top {suggestions.length} recommendations
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AutoSuggestPanel;