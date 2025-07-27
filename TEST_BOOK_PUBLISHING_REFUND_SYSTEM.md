# Book Publishing and Refund System - Test Guide

## Overview
This document outlines the complete implementation of the book publishing, purchasing, and refund system with the following features:

1. **Writer publishes book with WHOLE_BOOK pricing**
2. **Reader buys the book and owns all chapters**
3. **Writer clicks "Unpublish Story" button and system asks for refund confirmation**
4. **Writer confirms refunds and story is unpublished**
5. **Writer can unpublish chapters individually with proportional refunds**
6. **Republish logic handles access correctly**

## Implementation Summary

### Backend Changes Made:

1. **Enhanced ChapterServiceImpl.unpublishWholeBook()**
   - Added refund logic for all book purchasers
   - Calculates total refund amount and checks author's balance
   - Processes refunds and marks purchases as refunded

2. **Enhanced ChapterServiceImpl.unpublishChapter()**
   - Added refund logic for both WHOLE_BOOK and PAID_PER_CHAPTER pricing
   - For WHOLE_BOOK: proportional refund (book price / total chapters)
   - For PAID_PER_CHAPTER: full chapter price refund

3. **Enhanced StoryServiceImpl.publishStory()**
   - Added logic to handle republish after refunds
   - Updates publish date when republishing after refunds
   - Ensures old purchases don't work after republish

4. **Added RefundController**
   - `/api/refunds/stories/{storyId}/has-purchases` - Check if story has purchases
   - `/api/refunds/stories/{storyId}/calculate-refund` - Calculate refund amounts
   - `/api/refunds/chapters/{chapterId}/has-purchases` - Check if chapter has purchases

5. **Added Repository Methods**
   - `BookPurchaseRepository.findByStoryAndIsRefundedFalseOrderByPurchasedAtDesc()`
   - `BookPurchaseRepository.findByStoryAndIsRefundedTrueOrderByPurchasedAtDesc()`
   - `ChapterPurchaseRepository.findByChapterAndIsRefundedFalseOrderByPurchasedAtDesc()`
   - `ChapterPurchaseRepository.findByStoryAndIsRefundedFalseOrderByPurchasedAtDesc()`

### Frontend Changes Made:

1. **Enhanced ProtectedActionButton**
   - Checks for purchases before unpublishing
   - Shows refund confirmation modal when purchases exist
   - Handles refund confirmation flow

2. **Added RefundConfirmationModal**
   - Shows refund details (amount, affected users)
   - Explains what happens after confirmation
   - Provides confirm/cancel options

3. **Added API Routes**
   - `/api/refunds/stories/[storyId]/has-purchases/route.ts`
   - `/api/refunds/stories/[storyId]/calculate-refund/route.ts`
   - `/api/refunds/chapters/[chapterId]/has-purchases/route.ts`

## Test Scenarios

### Scenario 1: Publish Book with WHOLE_BOOK Pricing

**Steps:**
1. Go to `http://localhost:3000/dashboard/stories/f1deac3c-51a6-4003-9638-f31d463aa663`
2. Set pricing type to "WHOLE_BOOK"
3. Set book price (e.g., 100 coins)
4. Create 3 chapters
5. Publish the story

**Expected Result:**
- Story is published with WHOLE_BOOK pricing
- All chapters are automatically published
- Book price is displayed

### Scenario 2: Reader Buys Book

**Steps:**
1. Go to `http://localhost:3000/stories/f1deac3c-51a6-4003-9638-f31d463aa663`
2. Click "Buy Book" button
3. Confirm purchase

**Expected Result:**
- Reader's coins are deducted
- Author receives 70% of book price
- Reader now has access to all chapters
- "Book Purchased" badge is displayed

### Scenario 3: Unpublish Story with Refund Confirmation

**Steps:**
1. Go to `http://localhost:3000/dashboard/stories/f1deac3c-51a6-4003-9638-f31d463aa663`
2. Click "Unpublish Story" button
3. **System shows refund confirmation modal** with:
   - Total refund amount
   - Number of affected purchasers
   - Explanation of what happens
4. Click "Confirm & Unpublish"

**Expected Result:**
- Refund confirmation modal appears
- Shows accurate refund amount and affected users
- After confirmation, all book purchasers receive full refund
- Author's balance is reduced by total refund amount
- All chapters are unpublished
- Story status changes to DRAFT
- Book purchases are marked as refunded
- Success message: "Story unpublished successfully with refunds processed."

### Scenario 4: Unpublish Story (No Purchases)

**Steps:**
1. Go to `http://localhost:3000/dashboard/stories/f1deac3c-51a6-4003-9638-f31d463aa663`
2. Click "Unpublish Story" button (for a story with no purchases)

**Expected Result:**
- No refund modal appears
- Story is unpublished immediately
- Success message: "Story unpublished successfully!"

### Scenario 5: Unpublish Individual Chapters

**Steps:**
1. Go to `http://localhost:3000/dashboard/stories/f1deac3c-51a6-4003-9638-f31d463aa663`
2. Go to Chapter Management
3. Click "Unpublish" on a specific chapter

**Expected Result:**
- For WHOLE_BOOK pricing: proportional refund to all book purchasers
- For PAID_PER_CHAPTER pricing: full refund to chapter purchasers
- Specific chapter is unpublished
- Other chapters remain published

### Scenario 6: Republish After Refunds

**Steps:**
1. After unpublishing whole book with refunds
2. Click "Publish Story" again

**Expected Result:**
- Story is republished with new publish date
- Previous book purchases no longer work
- Readers need to buy the book again to access chapters

### Scenario 7: Republish Individual Chapters

**Steps:**
1. After unpublishing individual chapters
2. Republish specific chapters

**Expected Result:**
- For WHOLE_BOOK pricing: readers who still have book access can read republished chapters
- For PAID_PER_CHAPTER pricing: readers need to buy republished chapters again

## Business Rules Implemented

### 1. Unpublish Story Flow
- **Check Purchases**: System checks if story has active purchases
- **Show Refund Modal**: If purchases exist, show confirmation modal
- **Calculate Refunds**: Display accurate refund amounts and affected users
- **Process Refunds**: After confirmation, process all refunds
- **Unpublish**: Finally unpublish the story

### 2. Whole Book Unpublish
- **Calculation**: `number of users bought book * book price`
- **Result**: All book purchasers lose access to the entire book
- **Refund**: Full book price refunded to each purchaser

### 3. Chapter-by-Chapter Unpublish
- **Calculation**: `number of users bought book * (book price / number of chapters)`
- **Result**: Readers still own other chapters
- **Refund**: Proportional refund for each chapter

### 4. Republish Logic
- **After whole book unpublish**: Readers must buy again
- **After chapter unpublish**: Readers keep remaining chapters

## Error Handling

### Insufficient Coins
- Author must have enough coins to process refunds
- Error message: "Insufficient coins to process refunds"
- Action is blocked until author has sufficient balance

### Purchase Protection
- System checks for active purchases before unpublishing
- Prevents unpublishing without proper refunds
- Ensures fair treatment of readers

### Network Errors
- Clear error messages for API failures
- Retry mechanisms for failed requests
- Graceful fallback behavior

## API Endpoints

### Check Story Purchases
```
GET /api/refunds/stories/{storyId}/has-purchases
Authorization: Bearer {token}
Response: { hasPurchases: boolean, storyId: string }
```

### Calculate Story Refund
```
POST /api/refunds/stories/{storyId}/calculate-refund
Authorization: Bearer {token}
Response: { 
  hasPurchases: boolean, 
  totalRefundAmount: number, 
  affectedPurchasers: number,
  requiresRefunds: boolean,
  pricingType: string 
}
```

### Check Chapter Purchases
```
GET /api/refunds/chapters/{chapterId}/has-purchases
Authorization: Bearer {token}
Response: { hasPurchases: boolean, chapterId: string }
```

### Unpublish Story
```
POST /api/stories/{storyId}/unpublish
Authorization: Bearer {token}
```

## Database Changes

### BookPurchase Entity
- Added `isRefunded` and `refundedAt` fields
- Added `markAsRefunded()` method

### ChapterPurchase Entity
- Added `isRefunded` and `refundedAt` fields
- Added `markAsRefunded()` method

### Story Entity
- Enhanced `publishedAt` logic for republish scenarios

## Testing Checklist

- [ ] Create story with WHOLE_BOOK pricing
- [ ] Publish story with multiple chapters
- [ ] Purchase book as reader
- [ ] Verify access to all chapters
- [ ] Click "Unpublish Story" button
- [ ] Verify refund confirmation modal appears
- [ ] Verify refund details are accurate
- [ ] Confirm refunds and unpublish
- [ ] Verify refunds processed
- [ ] Verify loss of access
- [ ] Test unpublish without purchases (no modal)
- [ ] Republish story
- [ ] Verify need to repurchase
- [ ] Test individual chapter unpublish
- [ ] Test proportional refunds
- [ ] Test republish individual chapters
- [ ] Test insufficient coins scenario
- [ ] Test purchase protection
- [ ] Test network error handling

## User Experience Flow

### 1. Unpublish Story with Purchases
1. User clicks "Unpublish Story" button
2. System shows "Checking..." state
3. System detects purchases and shows refund modal
4. Modal displays:
   - Total refund amount
   - Number of affected users
   - Explanation of consequences
5. User clicks "Confirm & Unpublish"
6. System processes refunds and unpublishes
7. Success message appears

### 2. Unpublish Story without Purchases
1. User clicks "Unpublish Story" button
2. System shows "Checking..." state
3. System detects no purchases
4. Story is unpublished immediately
5. Success message appears

## Notes

- All refund calculations use BigDecimal for precision
- Refunds are processed atomically within transactions
- Purchase protection prevents unpublishing without refunds
- Republish logic ensures fair access control
- Error handling provides clear feedback to users
- Modal provides clear explanation of consequences
- System handles both story and chapter level refunds 