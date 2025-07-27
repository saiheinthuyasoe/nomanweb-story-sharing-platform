"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProtectedActionButton } from '@/components/protection/ProtectedActionButton';
import { ProtectedPricingForm } from '@/components/protection/ProtectedPricingForm';
import { PurchaseBenefitDisplay } from '@/components/purchase/PurchaseBenefitDisplay';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Users, DollarSign, Calendar, Settings } from 'lucide-react';

// Example story data (in real app, this would come from props or API)
const exampleStory = {
  id: 'story-123',
  title: 'The Adventures of Code',
  publishStatus: 'PUBLISHED' as const,
  pricingType: 'PAID_PER_CHAPTER' as const,
  bookPrice: 9.99,
  defaultChapterPrice: 2.99,
  totalChapters: 12,
  totalSales: 156,
  totalRevenue: 1247.44,
  createdAt: '2024-01-15',
};

/**
 * Example: Protected Story Management Page
 * 
 * This shows how to integrate purchase protection into a story management interface.
 * Replace the mock actions with your actual API calls.
 */
export function ProtectedStoryManagementExample() {
  const [story, setStory] = useState(exampleStory);
  const [showPricingForm, setShowPricingForm] = useState(false);
  const [selectedPricingType, setSelectedPricingType] = useState<'FREE' | 'PAID_PER_CHAPTER' | 'WHOLE_BOOK'>('FREE');
  const { toast } = useToast();

  // Mock API functions (replace with your actual API calls)
  const handleDeleteStory = async () => {
    // Your delete story API call here
    console.log('Deleting story:', story.id);
    toast({
      title: 'Story Deleted',
      description: 'Your story has been successfully deleted.',
    });
  };

  const handleUnpublishStory = async () => {
    // Your unpublish story API call here
    console.log('Unpublishing story:', story.id);
    setStory(prev => ({ ...prev, publishStatus: 'DRAFT' }));
    toast({
      title: 'Story Unpublished',
      description: 'Your story has been unpublished.',
    });
  };

  const handlePricingChange = async () => {
    // Your pricing change API call here
    console.log('Changing pricing to:', selectedPricingType);
    setStory(prev => ({ ...prev, pricingType: selectedPricingType }));
    setShowPricingForm(false);
    toast({
      title: 'Pricing Updated',
      description: `Pricing changed to ${selectedPricingType.replace('_', ' ').toLowerCase()}`,
    });
  };

  const handlePublishStory = async () => {
    // Your publish story API call here
    console.log('Publishing story:', story.id);
    setStory(prev => ({ ...prev, publishStatus: 'PUBLISHED' }));
    toast({
      title: 'Story Published',
      description: 'Your story is now live!',
    });
  };

  const getPricingTypeLabel = (type: string) => {
    switch (type) {
      case 'FREE':
        return 'Free';
      case 'PAID_PER_CHAPTER':
        return 'Paid per Chapter';
      case 'WHOLE_BOOK':
        return 'Whole Book';
      default:
        return type;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{story.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={story.publishStatus === 'PUBLISHED' ? 'default' : 'secondary'}>
              {story.publishStatus}
            </Badge>
            <Badge variant="outline">
              {getPricingTypeLabel(story.pricingType)}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <span className="text-sm text-gray-600">Story Management</span>
        </div>
      </div>

      {/* Story Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Chapters</span>
            </div>
            <p className="text-2xl font-bold mt-1">{story.totalChapters}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Sales</span>
            </div>
            <p className="text-2xl font-bold mt-1">{story.totalSales}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Revenue</span>
            </div>
            <p className="text-2xl font-bold mt-1">${story.totalRevenue}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Created</span>
            </div>
            <p className="text-sm font-medium mt-1">{story.createdAt}</p>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Protection Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Story Actions</CardTitle>
          <CardDescription>
            All actions are protected by our purchase protection system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            
            {/* Publish/Unpublish Action */}
            {story.publishStatus === 'DRAFT' ? (
              <Button onClick={handlePublishStory} variant="default">
                <BookOpen className="mr-2 h-4 w-4" />
                Publish Story
              </Button>
            ) : (
              <ProtectedActionButton
                itemId={story.id}
                itemType="story"
                itemTitle={story.title}
                actionType="unpublish"
                currentPublishStatus={story.publishStatus}
                currentPricingType={story.pricingType}
                onAction={handleUnpublishStory}
              />
            )}

            {/* Delete Action */}
            <ProtectedActionButton
              itemId={story.id}
              itemType="story"
              itemTitle={story.title}
              actionType="delete"
              currentPublishStatus={story.publishStatus}
              currentPricingType={story.pricingType}
              onAction={handleDeleteStory}
            />

            {/* Pricing Change Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedPricingType('FREE');
                  setShowPricingForm(true);
                }}
                disabled={story.pricingType === 'FREE'}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Change to Free
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedPricingType('WHOLE_BOOK');
                  setShowPricingForm(true);
                }}
                disabled={story.pricingType === 'WHOLE_BOOK'}
              >
                Change to Whole Book
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Change Form */}
      {showPricingForm && (
        <ProtectedPricingForm
          itemId={story.id}
          itemType="story"
          itemTitle={story.title}
          currentPricingType={story.pricingType}
          newPricingType={selectedPricingType}
          onConfirm={handlePricingChange}
          onCancel={() => setShowPricingForm(false)}
        />
      )}

      <Separator />

      {/* Purchase Benefits (for readers) */}
      <Card>
        <CardHeader>
          <CardTitle>Reader Benefits</CardTitle>
          <CardDescription>
            This is what readers see when they're about to purchase your content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PurchaseBenefitDisplay
            itemType="story"
            itemTitle={story.title}
            currentPricingType={story.pricingType === 'FREE' ? 'PAID_PER_CHAPTER' : story.pricingType}
            hasExistingPurchases={false}
            showCompact={false}
          />
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">How to Use These Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-700">
          <div>
            <strong>ProtectedActionButton:</strong> Use this for any action that could affect purchased content (delete, unpublish, etc.)
          </div>
          <div>
            <strong>ProtectedPricingForm:</strong> Use this when changing pricing types, especially from paid to free
          </div>
          <div>
            <strong>PurchaseBenefitDisplay:</strong> Show this to readers during the purchase process to explain one-time purchase benefits
          </div>

        </CardContent>
      </Card>
    </div>
  );
}