# Liveblocks.io Integration Guide

This guide walks you through migrating your current WebSocket-based real-time collaboration to Liveblocks.io.

## 🚀 Why Migrate to Liveblocks?

### Current Issues with Custom WebSocket Implementation:
- **Maintenance burden**: Custom WebSocket server and client logic
- **Conflict resolution**: Manual handling of concurrent edits
- **Reliability**: Connection drops, message ordering issues
- **Scalability**: Managing multiple concurrent sessions

### Benefits of Liveblocks:
- ✅ **Proven CRDT algorithms** for conflict-free collaborative editing
- ✅ **Built-in presence system** with typing indicators
- ✅ **Automatic reconnection** and state synchronization
- ✅ **Scalable infrastructure** managed by Liveblocks
- ✅ **Rich TypeScript support** with full type safety
- ✅ **Undo/Redo** with collaborative awareness
- ✅ **Comments and reactions** (optional features)

## 📋 Setup Steps

### 1. Create Liveblocks Account

1. Go to [https://liveblocks.io](https://liveblocks.io)
2. Sign up for a free account
3. Create a new project
4. Copy your **Public Key** and **Secret Key** from the dashboard

### 2. Environment Variables

Add these to your `.env.local` file:

```env
# Liveblocks Configuration (Only need the secret key for authEndpoint approach)
LIVEBLOCKS_SECRET_KEY=sk_dev_your_secret_key_here

# Existing variables (keep these)
JWT_SECRET=your_jwt_secret_key
BACKEND_URL=http://localhost:8080
BACKEND_API_KEY=your_backend_api_key
```

### 3. Dependencies

The required packages are already installed:
- `@liveblocks/client` - Core Liveblocks client
- `@liveblocks/react` - React hooks and components
- `@liveblocks/node` - Server-side SDK for authentication

### 4. Migration Steps

#### Step 1: Wrap Your Chapter Edit Pages

Replace your current chapter edit pages with the Liveblocks provider:

```tsx
// Before (current WebSocket approach)
import { ChapterForm } from '@/components/chapters/ChapterForm';

// After (Liveblocks approach)
import { LiveblocksRoomProvider } from '@/components/collaboration/LiveblocksRoomProvider';
import { ChapterForm } from '@/components/chapters/ChapterForm';

export default function EditChapterPage({ params }: { params: { chapterId: string } }) {
  return (
    <LiveblocksRoomProvider 
      chapterId={params.chapterId}
      initialContent={chapter?.content || ''}
    >
      <ChapterForm
        chapterId={params.chapterId}
        initialData={chapter}
        onSubmit={handleSubmit}
        // ... other props
      />
    </LiveblocksRoomProvider>
  );
}
```

#### Step 2: Update ChapterForm Component

Replace the collaboration hook:

```tsx
// Before (WebSocket)
import { useRealtimeCollaboration } from '@/hooks/useRealtimeCollaboration';
import { ActiveCollaborators } from '@/components/collaboration/ActiveCollaborators';

// After (Liveblocks)
import { useLiveblocksCollaboration } from '@/hooks/useLiveblocksCollaboration';
import { LiveblocksActiveCollaborators } from '@/components/collaboration/LiveblocksActiveCollaborators';

export function ChapterForm({ chapterId, ... }) {
  // Before
  const { sendContentUpdate, sendCursorPosition, isConnected, collaborators } = 
    useRealtimeCollaboration(chapterId);

  // After  
  const { sendContentUpdate, sendCursorPosition, isConnected, collaborators } = 
    useLiveblocksCollaboration(chapterId);

  // The rest of your component remains the same!
  // The API is identical, so minimal changes needed
}
```

#### Step 3: Update Collaborators Display

```tsx
// Before
<ActiveCollaborators chapterId={chapterId} />

// After
<LiveblocksActiveCollaborators chapterId={chapterId} />
```

### 5. Backend Considerations

#### Remove WebSocket Dependencies (Optional)

You can gradually remove the WebSocket-related code:

1. **Keep the backend** for now (gradual migration)
2. **Remove WebSocket endpoints** once fully migrated
3. **Remove STOMP dependencies** from your Java backend

#### Authentication Integration

The Liveblocks auth endpoint (`/api/liveblocks-auth`) already integrates with your existing JWT authentication system.

### 6. Testing the Migration

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Test collaboration features**:
   - Open a chapter in multiple browser tabs
   - Verify real-time content updates
   - Check presence indicators
   - Test cursor position tracking

3. **Monitor the console** for any errors or connection issues

## 🎯 Migration Checklist

### Phase 1: Setup & Basic Integration
- [ ] Created Liveblocks account
- [ ] Added environment variables
- [ ] Installed required packages
- [ ] Created Liveblocks configuration (`/lib/liveblocks.ts`)
- [ ] Created authentication endpoint (`/api/liveblocks-auth/route.ts`)

### Phase 2: Component Migration
- [ ] Created `LiveblocksRoomProvider` wrapper
- [ ] Created `useLiveblocksCollaboration` hook
- [ ] Created `LiveblocksActiveCollaborators` component
- [ ] Updated chapter edit pages to use Liveblocks provider

### Phase 3: Testing & Optimization
- [ ] Tested real-time collaboration
- [ ] Verified presence indicators work
- [ ] Tested cursor position tracking
- [ ] Verified content synchronization
- [ ] Performance testing with multiple users

### Phase 4: Cleanup (Optional)
- [ ] Removed old WebSocket components
- [ ] Removed WebSocket dependencies
- [ ] Updated backend to remove WebSocket endpoints
- [ ] Cleaned up unused imports

## 🔧 Advanced Features

### 1. Conflict Resolution

Liveblocks automatically handles conflicts using CRDTs. No manual conflict resolution needed!

### 2. Undo/Redo

Add collaborative undo/redo:

```tsx
import { useUndo, useRedo, useCanUndo, useCanRedo } from '@/lib/liveblocks';

function EditorToolbar() {
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  return (
    <div>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
    </div>
  );
}
```

### 3. Comments & Reactions (Optional)

Add commenting system:

```bash
npm install @liveblocks/react-comments
```

### 4. Analytics & Monitoring

Monitor collaboration usage through the Liveblocks dashboard.

## 🚨 Common Issues & Solutions

### Issue: "Authentication failed"
- **Solution**: Check your environment variables
- **Solution**: Verify JWT secret matches between frontend and backend

### Issue: "Room not found"
- **Solution**: Check the room ID format (`chapter:${chapterId}`)
- **Solution**: Verify user has access to the chapter

### Issue: "WebSocket connection failed"
- **Solution**: Check firewall settings
- **Solution**: Verify Liveblocks service status

### Issue: Content not syncing
- **Solution**: Check the `registerContentUpdateCallback` is properly set up
- **Solution**: Verify the content update mutation is working

## 📈 Performance Considerations

### 1. Room Lifecycle
- Rooms are created automatically when first accessed
- Rooms are cleaned up automatically when empty
- No manual room management needed

### 2. Bandwidth Usage
- Liveblocks optimizes message size automatically
- Only sends diffs, not full content
- Batches multiple updates efficiently

### 3. Scaling
- Liveblocks handles scaling automatically
- No server-side scaling concerns
- Pay-as-you-grow pricing model

## 🔄 Rollback Plan

If you need to rollback to the WebSocket system:

1. **Keep the old components** during migration
2. **Use feature flags** to switch between systems
3. **Gradual rollout** to specific users/chapters
4. **Monitor error rates** and user feedback

## 📞 Support

- **Liveblocks Documentation**: [https://liveblocks.io/docs](https://liveblocks.io/docs)
- **Liveblocks Discord**: [https://liveblocks.io/discord](https://liveblocks.io/discord)
- **GitHub Issues**: For any bugs or feature requests

## 🎉 Next Steps

1. **Follow the migration checklist** above
2. **Test thoroughly** in development
3. **Deploy to staging** for broader testing
4. **Gradual rollout** to production
5. **Monitor and optimize** based on usage

The migration to Liveblocks will significantly improve your collaboration experience while reducing maintenance overhead. The API compatibility ensures minimal code changes are needed! 