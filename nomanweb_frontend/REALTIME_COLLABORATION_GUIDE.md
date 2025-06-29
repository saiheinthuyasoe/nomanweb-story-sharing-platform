# Real-Time Collaboration Guide

## Overview
The real-time collaboration feature allows multiple users to work together on chapters with Google Docs-style editing. Users can invite collaborators via email with specific roles (Edit or View).

## Features

### 1. Collaboration Roles
- **Editor (EDIT)**: Full editing access to the chapter content
- **Viewer (VIEW)**: Read-only access with ability to comment

### 2. Invitation System
- Send invitations via email
- Invitations include a personal message (optional)
- 7-day expiration period
- Unique invitation links for each collaborator

### 3. Real-Time Presence
- See who's currently online
- Color-coded avatars for each collaborator
- Presence updates every 30 seconds
- Automatic offline detection

### 4. Collaboration Management
- Add/remove collaborators
- Change roles on the fly
- View all active collaborators
- Leave collaboration voluntarily

## How to Use

### Inviting Collaborators
1. Open the chapter you want to collaborate on
2. Click the collaborators icon in the header
3. Click "Invite" button
4. Enter the email address of the person you want to invite
5. Choose their role (Edit or View)
6. Add an optional personal message
7. Click "Send Invitation"

### Accepting Invitations
1. Check your email for the invitation
2. Click the invitation link
3. Review the invitation details
4. Click "Accept Invitation"
5. You'll be redirected to the chapter

### Managing Collaborators
1. Click the collaborators icon to open the sidebar
2. View all current collaborators
3. Change roles using the dropdown
4. Remove collaborators with the trash icon
5. See pending invitations

## Technical Implementation

### Backend Components
- **Collaboration Entity**: Stores collaboration relationships
- **CollaborationService**: Manages invitations and permissions
- **CollaborationController**: REST API endpoints
- **Presence Tracking**: In-memory storage (upgradeable to Redis)

### Frontend Components
- **CollaborationManager**: Main UI for managing collaborators
- **OnlineCollaborators**: Shows real-time presence
- **useCollaborations hook**: React Query integration
- **Accept Invitation Page**: Handles invitation acceptance

### Database Schema
```sql
CREATE TABLE collaborations (
    id UUID PRIMARY KEY,
    chapter_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(10) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    invitation_token VARCHAR(255),
    invitation_expires_at TIMESTAMP,
    invitation_accepted_at TIMESTAMP,
    invited_by_user_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints
- `POST /api/collaborations/invite` - Create invitation
- `POST /api/collaborations/accept/{token}` - Accept invitation
- `GET /api/collaborations/invitation/{token}` - Get invitation details
- `PUT /api/collaborations/chapters/{chapterId}/users/{userId}/role` - Update role
- `DELETE /api/collaborations/chapters/{chapterId}/users/{userId}` - Remove collaborator
- `DELETE /api/collaborations/chapters/{chapterId}/leave` - Leave collaboration
- `GET /api/collaborations/chapters/{chapterId}` - Get collaborators
- `GET /api/collaborations/my-collaborations` - Get user's collaborations
- `GET /api/collaborations/pending-invitations` - Get pending invitations
- `POST /api/collaborations/chapters/{chapterId}/presence` - Update presence
- `GET /api/collaborations/chapters/{chapterId}/online` - Get online users

## Security Considerations
1. Only chapter authors and editors can send invitations
2. Invitations are tied to specific email addresses
3. Tokens expire after 7 days
4. Permissions are checked on every API call
5. Collaborators can only access assigned chapters

## Future Enhancements
1. Real-time cursor positions
2. Live text selection highlighting
3. Collaborative comments
4. Version history with attribution
5. WebSocket integration for instant updates
6. Notification system integration
7. Bulk invitation sending
8. Organization/team management 