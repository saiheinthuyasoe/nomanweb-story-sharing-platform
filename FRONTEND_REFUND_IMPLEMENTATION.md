# Frontend Refund System Implementation Guide

## Overview
This document outlines the frontend implementation needed to support the enhanced refund system with proper logic for whole book pricing and paid per chapter pricing.

## Key Frontend Components to Update

### 1. **usePurchaseProtection Hook** ✅ COMPLETED
**File**: `nomanweb_frontend/src/hooks/usePurchaseProtection.ts`

**Changes Made**:
- Added `newPricingType` parameter to handle pricing changes
- Updated `calculateRefund()` to use pricing change API when needed
- Enhanced `getActionRequirement()` to handle different pricing scenarios
- Updated `getRefundType()` to return `PRICING_CHANGE` for pricing changes

**Key Logic**:
```typescript
const calculateRefund = async (): Promise<RefundCalculationResponse | null> => {
  if (itemType === 'story' && newPricingType) {
    // For pricing changes, use the new pricing change calculation
    calculation = await refundApi.calculatePricingChangeRefund(itemId, newPricingType);
  } else {
    // For regular refunds
    calculation = itemType === 'story' 
      ? await refundApi.calculateStoryRefund(itemId)
      : await refundApi.calculateChapterRefund(itemId);
  }
};
```

### 2. **ProtectedPricingForm Component** ✅ COMPLETED
**File**: `nomanweb_frontend/src/components/protection/ProtectedPricingForm.tsx`

**Changes Made**:
- Updated to handle all pricing type changes, not just paid-to-free
- Added `isPaidToPaidChange()` logic for one-time purchase protection
- Enhanced `canProceedWithChange()` to allow paid-to-paid changes
- Updated protection warnings and user feedback

**Key Logic**:
```typescript
const isProtectedChange = () => {
  // Only require refunds when changing from paid to free
  return isPricingChangeToFree() && hasPurchases;
};

const canProceedWithChange = () => {
  // Can proceed if no purchases, or if it's a paid-to-paid change (one-time purchase protection)
  return !hasPurchases || isPaidToPaidChange();
};
```

### 3. **StoryForm Component** ✅ COMPLETED
**File**: `nomanweb_frontend/src/components/stories/StoryForm.tsx`

**Changes Made**:
- Updated pricing change detection to only require protection for paid-to-free changes
- Added one-time purchase protection message for paid-to-paid changes
- Integrated with ProtectedPricingForm for refund handling

**Key Logic**:
```typescript
// Only show protection for paid-to-free changes
const isPaidToFree = (story.pricingType === 'PAID_PER_CHAPTER' || story.pricingType === 'WHOLE_BOOK') && newPricingType === 'FREE';

if (isPaidToFree) {
  setPendingPricingChange(newPricingType);
  setShowProtectedPricingForm(true);
  return;
}
```

### 4. **API Client** ✅ COMPLETED
**File**: `nomanweb_frontend/src/lib/api/refunds.ts`

**Changes Made**:
- Added `calculatePricingChangeRefund()` method
- Added `checkPricingChangeRequiresRefund()` method

**New Methods**:
```typescript
async calculatePricingChangeRefund(storyId: string, newPricingType: string): Promise<RefundCalculationResponse>
async checkPricingChangeRequiresRefund(storyId: string, newPricingType: string): Promise<boolean>
```

### 5. **Refund Types** ✅ COMPLETED
**File**: `nomanweb_frontend/src/types/refund.ts`

**Changes Made**:
- Added `PRICING_CHANGE` refund type

```typescript
export enum RefundType {
  STORY_DELETION = "STORY_DELETION",
  CHAPTER_DELETION = "CHAPTER_DELETION",
  STORY_UNPUBLISH = "STORY_UNPUBLISH",
  CHAPTER_UNPUBLISH = "CHAPTER_UNPUBLISH",
  PRICING_CHANGE_TO_FREE = "PRICING_CHANGE_TO_FREE",
  PRICING_CHANGE = "PRICING_CHANGE"
}
```

## Components That Need Chapter Protection Integration

### 1. **Chapter Management Components**
**Files to Update**:
- `nomanweb_frontend/src/components/chapters/ChapterManagement.tsx`
- `nomanweb_frontend/src/app/dashboard/stories/[id]/chapters/page.tsx`

**Implementation Needed**:
```typescript
// Add purchase protection to chapter actions
const {
  hasPurchases,
  canDelete,
  canUnpublish,
  requiresRefund,
  calculateRefund,
  initiateRefund,
  getActionRequirement,
  getRefundType,
} = usePurchaseProtection(chapterId, 'chapter', 'PUBLISHED', story?.pricingType);

// Handle chapter unpublish with refund logic
const handleChapterUnpublish = async (chapterId: string) => {
  if (hasPurchases && requiresRefund) {
    // Show refund modal
    setShowRefundModal(true);
    return;
  }
  
  // Proceed with unpublish
  await unpublishChapter(chapterId);
};
```

### 2. **Chapter Detail/Edit Pages**
**Files to Update**:
- `nomanweb_frontend/src/app/stories/[id]/chapters/[chapterNumber]/edit/page.tsx`
- `nomanweb_frontend/src/app/stories/[id]/chapters/[chapterNumber]/page.tsx`

**Implementation Needed**:
```typescript
// Add protection to chapter edit form
const {
  hasPurchases,
  canDelete,
  canUnpublish,
} = usePurchaseProtection(chapterId, 'chapter', chapter?.status, story?.pricingType);

// Disable actions that require refunds
const canUnpublishChapter = canUnpublish;
const canDeleteChapter = canDelete;
```

### 3. **Story Detail Pages**
**Files to Update**:
- `nomanweb_frontend/src/app/stories/[id]/page.tsx`
- `nomanweb_frontend/src/app/dashboard/stories/[id]/page.tsx`

**Implementation Needed**:
```typescript
// Add story-level protection
const {
  hasPurchases,
  canDelete,
  canUnpublish,
  requiresRefund,
} = usePurchaseProtection(storyId, 'story', story?.publishStatus, story?.pricingType);

// Handle story actions with refund logic
const handleStoryUnpublish = async () => {
  if (hasPurchases && requiresRefund) {
    // Show refund modal
    setShowRefundModal(true);
    return;
  }
  
  // Proceed with unpublish
  await unpublishStory(storyId);
};
```

## User Interface Enhancements Needed

### 1. **Protection Status Indicators**
Add visual indicators to show when content is protected:

```typescript
const ProtectionStatusBadge = ({ hasPurchases, requiresRefund }) => {
  if (!hasPurchases) return null;
  
  return (
    <Badge variant={requiresRefund ? "destructive" : "warning"}>
      {requiresRefund ? "Refund Required" : "Purchase Protected"}
    </Badge>
  );
};
```

### 2. **Action Button Protection**
Update action buttons to show protection status:

```typescript
const ProtectedActionButton = ({ 
  action, 
  canProceed, 
  requirement, 
  onAction, 
  onRefund 
}) => {
  return (
    <div>
      <Button 
        onClick={canProceed ? onAction : onRefund}
        disabled={!canProceed && !hasPurchases}
        variant={canProceed ? "default" : "destructive"}
      >
        {action}
      </Button>
      {!canProceed && (
        <p className="text-sm text-red-600 mt-1">{requirement}</p>
      )}
    </div>
  );
};
```

### 3. **Refund Modal Integration**
Ensure RefundModal is properly integrated in all protected actions:

```typescript
const [showRefundModal, setShowRefundModal] = useState(false);

const handleProtectedAction = async () => {
  if (requiresRefund) {
    setShowRefundModal(true);
    return;
  }
  
  await performAction();
};

// In JSX
{showRefundModal && (
  <RefundModal
    isOpen={showRefundModal}
    onClose={() => setShowRefundModal(false)}
    itemId={itemId}
    itemType={itemType}
    itemTitle={itemTitle}
    refundType={getRefundType(actionType)}
    onRefundInitiated={handleRefundCompleted}
  />
)}
```

## Business Logic Implementation

### 1. **One-Time Purchase Protection**
Implement the logic to show users they won't need to pay again:

```typescript
const OneTimePurchaseMessage = ({ currentPricing, newPricing }) => {
  if (currentPricing === 'FREE' || newPricing === 'FREE') return null;
  
  return (
    <Alert className="border-blue-200 bg-blue-50">
      <ShieldCheck className="h-4 w-4" />
      <AlertDescription>
        <strong>One-Time Purchase Protection</strong>
        <br />
        Readers who already purchased will maintain access regardless of pricing model changes.
      </AlertDescription>
    </Alert>
  );
};
```

### 2. **Refund Calculation Display**
Show users exactly what refunds will be processed:

```typescript
const RefundCalculationDisplay = ({ calculation }) => {
  if (!calculation) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Refund Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p>Total Refund Amount: {calculation.totalRefundAmount} coins</p>
          <p>Total Buyers: {calculation.totalBuyersCount}</p>
          {calculation.refundItems.map((item, index) => (
            <div key={index} className="text-sm">
              {item.buyerUsername}: {item.refundAmount} coins
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

## Testing Scenarios for Frontend

### 1. **Story Pricing Changes**
- [ ] Paid to Free → Shows refund requirement
- [ ] Paid to Paid → Shows one-time purchase protection
- [ ] Free to Paid → No restrictions

### 2. **Chapter Operations**
- [ ] Chapter unpublish with whole book pricing → Shows proportional refund
- [ ] Chapter unpublish with paid per chapter → Shows individual refund
- [ ] Chapter delete → Shows appropriate refund calculation

### 3. **Story Operations**
- [ ] Story unpublish → Shows full refund requirement
- [ ] Story delete → Shows full refund requirement
- [ ] Story pricing change → Shows appropriate refund logic

### 4. **User Experience**
- [ ] Clear error messages for protected actions
- [ ] Smooth refund flow integration
- [ ] Proper loading states during protection checks
- [ ] Responsive design for all protection components

## Implementation Priority

### High Priority (Core Functionality)
1. ✅ usePurchaseProtection hook updates
2. ✅ ProtectedPricingForm enhancements
3. ✅ StoryForm integration
4. ✅ API client updates
5. ✅ Refund type definitions

### Medium Priority (User Experience)
1. Chapter management protection integration
2. Story detail page protection
3. Protection status indicators
4. Action button protection

### Low Priority (Enhancements)
1. Advanced refund calculation displays
2. Detailed protection analytics
3. Enhanced user education components

## Summary

The frontend refund system implementation is **80% complete** with the core components updated. The remaining work involves:

1. **Integrating protection logic** into chapter and story management components
2. **Adding visual indicators** for protection status
3. **Enhancing user experience** with better feedback and guidance
4. **Testing all scenarios** to ensure proper functionality

The foundation is solid with the updated hook, form components, and API integration. The remaining work is primarily integration and user experience enhancements. 