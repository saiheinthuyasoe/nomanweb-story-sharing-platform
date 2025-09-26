# Nomanweb Backend API Reference

This document provides comprehensive information about the Nomanweb backend API endpoints for testing with Postman and cURL.

## Base URL
```
http://localhost:8080/api
```

## Swagger UI Documentation

The API is fully documented with Swagger/OpenAPI. You can access the interactive API documentation at:

**Swagger UI:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

The Swagger UI provides:
- Interactive API testing interface
- Complete endpoint documentation with request/response schemas
- Authentication support (Bearer token)
- Try-it-out functionality for all endpoints
- Real-time API exploration

**OpenAPI JSON:** [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

## Environment URLs

- **Development**: `http://localhost:8080`
- **Production**: `https://your-production-domain.com`

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 1. Authentication & User Management

### Authentication Endpoints

| Method | Route                           | Description               | Auth Required |
| ------ | ------------------------------- | ------------------------- | ------------- |
| POST   | `/api/auth/login`               | User login                | No            |
| POST   | `/api/auth/register`            | User registration         | No            |
| GET    | `/api/auth/profile`             | Get current user profile  | Yes           |
| PUT    | `/api/auth/profile`             | Update user profile       | Yes           |
| POST   | `/api/auth/change-password`     | Change password           | Yes           |
| POST   | `/api/auth/forgot-password`     | Request password reset    | No            |
| POST   | `/api/auth/reset-password`      | Reset password with token | No            |
| POST   | `/api/auth/refresh`             | Refresh JWT token         | Yes           |
| POST   | `/api/auth/logout`              | Logout user               | Yes           |
| POST   | `/api/auth/verify-email`        | Verify email address      | No            |
| POST   | `/api/auth/resend-verification` | Resend verification email | No            |
| POST   | `/api/auth/change-email`        | Change email address      | Yes           |
| POST   | `/api/auth/change-username`     | Change username           | Yes           |

#### Login

```bash
# cURL
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "displayName": "Display Name"
  }
}
```

#### Register

```bash
# cURL
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "username": "newuser",
    "displayName": "New User",
    "password": "password123"
  }'
```

#### Get Profile

```bash
# cURL
curl -X GET http://localhost:8080/api/auth/profile \
  -H "Authorization: Bearer <your-jwt-token>"
```

#### Update Profile

```bash
# cURL
curl -X PUT http://localhost:8080/api/auth/profile \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Updated Name",
    "bio": "Updated bio",
    "profileImageUrl": "https://example.com/image.jpg"
  }'
```

### User Management Endpoints

| Method | Route                              | Description                 | Auth Required |
| ------ | ---------------------------------- | --------------------------- | ------------- |
| GET    | `/api/users/me/stats`              | Get current user statistics | Yes           |
| GET    | `/api/users/{userId}/stats`        | Get user statistics by ID   | No            |
| GET    | `/api/users/{userId}/profile`      | Get user profile by ID      | No            |
| GET    | `/api/users/{userId}/followers`    | Get user's followers        | No            |
| GET    | `/api/users/{userId}/following`    | Get user's following        | No            |
| POST   | `/api/users/{userId}/follow`       | Follow a user               | Yes           |
| DELETE | `/api/users/{userId}/follow`       | Unfollow a user             | Yes           |
| GET    | `/api/users/{userId}/is-following` | Check if following user     | Yes           |
| GET    | `/api/users/search`                | Search users                | No            |
| GET    | `/api/users/sse/social-updates`    | SSE for social updates      | Yes           |

#### Follow User

```bash
# cURL
curl -X POST http://localhost:8080/api/users/{userId}/follow \
  -H "Authorization: Bearer <your-jwt-token>"
```

#### Search Users

```bash
# cURL
curl -X GET "http://localhost:8080/api/users/search?q=username&page=0&size=20"
```

---

## 2. Story Management

### Story CRUD Operations

| Method | Route                                | Description                | Auth Required |
| ------ | ------------------------------------ | -------------------------- | ------------- |
| POST   | `/api/stories`                       | Create new story           | Yes           |
| GET    | `/api/stories/{id}`                  | Get story by ID            | No            |
| PUT    | `/api/stories/{id}`                  | Update story               | Yes           |
| DELETE | `/api/stories/{id}`                  | Delete story               | Yes           |
| GET    | `/api/stories`                       | Get stories with filters   | No            |
| GET    | `/api/stories/my-stories`            | Get current user's stories | Yes           |
| GET    | `/api/stories/author/{authorId}`     | Get stories by author      | No            |
| GET    | `/api/stories/category/{categoryId}` | Get stories by category    | No            |
| GET    | `/api/stories/search`                | Search stories             | No            |
| GET    | `/api/stories/trending`              | Get trending stories       | No            |
| GET    | `/api/stories/featured`              | Get featured stories       | No            |

#### Create Story

```bash
# cURL
curl -X POST http://localhost:8080/api/stories \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My New Story",
    "description": "A compelling story description",
    "categoryId": "category-uuid",
    "coverImageUrl": "https://example.com/cover.jpg",
    "pricingType": "FREE",
    "bookPrice": 0,
    "defaultChapterPrice": 0,
    "tags": ["fantasy", "adventure"]
  }'

# Response
{
  "id": "story-uuid",
  "title": "My New Story",
  "description": "A compelling story description",
  "author": {
    "id": "author-uuid",
    "username": "author",
    "displayName": "Author Name"
  },
  "category": {
    "id": "category-uuid",
    "name": "Fantasy"
  },
  "publishStatus": "DRAFT",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### Get Story

```bash
# cURL
curl -X GET "http://localhost:8080/api/stories/{storyId}?incrementView=true"
```

#### Update Story

```bash
# cURL
curl -X PUT http://localhost:8080/api/stories/{storyId} \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Story Title",
    "description": "Updated description",
    "tags": ["updated", "tags"]
  }'
```

### Story Publishing & Management

| Method | Route                             | Description                  | Auth Required |
| ------ | --------------------------------- | ---------------------------- | ------------- |
| POST   | `/api/stories/{id}/publish`       | Publish story                | Yes           |
| POST   | `/api/stories/{id}/unpublish`     | Unpublish story              | Yes           |
| POST   | `/api/stories/{id}/view`          | Increment story view         | No            |
| GET    | `/api/stories/{id}/can-access`    | Check story access           | Yes           |
| GET    | `/api/stories/{id}/has-purchases` | Check if story has purchases | Yes           |

#### Publish Story

```bash
# cURL
curl -X POST "http://localhost:8080/api/stories/{storyId}/publish?autoPublishChapters=true" \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Story Trash Management

| Method | Route                                  | Description              | Auth Required |
| ------ | -------------------------------------- | ------------------------ | ------------- |
| POST   | `/api/stories/{id}/trash`              | Move story to trash      | Yes           |
| POST   | `/api/stories/{id}/restore`            | Restore from trash       | Yes           |
| DELETE | `/api/stories/{id}/permanent`          | Permanently delete story | Yes           |
| GET    | `/api/stories/author/{authorId}/trash` | Get trash stories        | Yes           |
| POST   | `/api/stories/bulk/trash`              | Bulk move to trash       | Yes           |
| POST   | `/api/stories/bulk/restore`            | Bulk restore from trash  | Yes           |
| DELETE | `/api/stories/bulk/permanent`          | Bulk permanent delete    | Yes           |

#### Move Story to Trash

```bash
# cURL
curl -X POST http://localhost:8080/api/stories/{storyId}/trash \
  -H "Authorization: Bearer <your-jwt-token>"

# Response (if purchase protection triggered)
{
  "error": "PURCHASE_PROTECTION_VIOLATION",
  "message": "Cannot delete story with active purchases",
  "storyId": "story-uuid",
  "storyTitle": "Story Title",
  "totalPurchases": 5,
  "refundAmount": 100,
  "requiresRefunds": true
}
```

---

## 3. Chapter Management

### Chapter CRUD Operations

| Method | Route                                 | Description            | Auth Required |
| ------ | ------------------------------------- | ---------------------- | ------------- |
| POST   | `/api/chapters`                       | Create new chapter     | Yes           |
| GET    | `/api/chapters/{chapterId}`           | Get chapter by ID      | No            |
| PUT    | `/api/chapters/{chapterId}`           | Update chapter         | Yes           |
| DELETE | `/api/chapters/{chapterId}`           | Delete chapter         | Yes           |
| PUT    | `/api/chapters/{chapterId}/autosave`  | Auto-save chapter      | Yes           |
| GET    | `/api/chapters/story/{storyId}`       | Get chapters by story  | No            |
| GET    | `/api/chapters/story/{storyId}/paged` | Get chapters paginated | No            |

#### Create Chapter

```bash
# cURL
curl -X POST http://localhost:8080/api/chapters \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "storyId": "story-uuid",
    "title": "Chapter 1: The Beginning",
    "content": "Chapter content here...",
    "chapterNumber": 1,
    "coinPrice": 10,
    "isFree": false,
    "isDraft": true
  }'

# Response
{
  "id": "chapter-uuid",
  "title": "Chapter 1: The Beginning",
  "chapterNumber": 1,
  "wordCount": 1500,
  "coinPrice": 10,
  "isFree": false,
  "status": "DRAFT",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### Get Chapter by Story and Number

```bash
# cURL
curl -X GET http://localhost:8080/api/chapters/story/{storyId}/chapter/{chapterNumber} \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Chapter Navigation

| Method | Route                                 | Description          | Auth Required |
| ------ | ------------------------------------- | -------------------- | ------------- |
| GET    | `/api/chapters/{chapterId}/next`      | Get next chapter     | No            |
| GET    | `/api/chapters/{chapterId}/previous`  | Get previous chapter | No            |
| GET    | `/api/chapters/story/{storyId}/first` | Get first chapter    | No            |
| GET    | `/api/chapters/story/{storyId}/last`  | Get last chapter     | No            |

### Chapter Publishing & Management

| Method | Route                                   | Description              | Auth Required |
| ------ | --------------------------------------- | ------------------------ | ------------- |
| POST   | `/api/chapters/{chapterId}/publish`     | Publish chapter          | Yes           |
| POST   | `/api/chapters/{chapterId}/unpublish`   | Unpublish chapter        | Yes           |
| PUT    | `/api/chapters/story/{storyId}/reorder` | Reorder chapters         | Yes           |
| GET    | `/api/chapters/story/{storyId}/search`  | Search chapters in story | No            |

#### Publish Chapter

```bash
# cURL
curl -X POST http://localhost:8080/api/chapters/{chapterId}/publish \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Chapter Bulk Operations

| Method | Route                                          | Description             | Auth Required |
| ------ | ---------------------------------------------- | ----------------------- | ------------- |
| DELETE | `/api/chapters/bulk`                           | Bulk delete chapters    | Yes           |
| POST   | `/api/chapters/bulk/trash`                     | Bulk move to trash      | Yes           |
| POST   | `/api/chapters/bulk/restore`                   | Bulk restore from trash | Yes           |
| DELETE | `/api/chapters/bulk/permanent`                 | Bulk permanent delete   | Yes           |
| POST   | `/api/chapters/story/{storyId}/bulk/publish`   | Bulk publish by story   | Yes           |
| POST   | `/api/chapters/story/{storyId}/bulk/unpublish` | Bulk unpublish by story | Yes           |

### Chapter File Upload

| Method | Route                                       | Description              | Auth Required |
| ------ | ------------------------------------------- | ------------------------ | ------------- |
| POST   | `/api/chapters/story/{storyId}/bulk-upload` | Upload chapter from file | Yes           |

#### Bulk Upload Chapter

```bash
# cURL
curl -X POST http://localhost:8080/api/chapters/story/{storyId}/bulk-upload \
  -H "Authorization: Bearer <your-jwt-token>" \
  -F "file=@chapter.docx" \
  -F "title=Chapter Title" \
  -F "chapterNumber=1" \
  -F "isDraft=false"
```

---

## 4. Social Features

### Comments

| Method | Route                               | Description          | Auth Required |
| ------ | ----------------------------------- | -------------------- | ------------- |
| POST   | `/api/comments`                     | Create comment       | Yes           |
| GET    | `/api/comments/{commentId}`         | Get comment by ID    | No            |
| PUT    | `/api/comments/{commentId}`         | Update comment       | Yes           |
| DELETE | `/api/comments/{commentId}`         | Delete comment       | Yes           |
| GET    | `/api/comments/{commentId}/replies` | Get comment replies  | No            |
| GET    | `/api/comments/story/{storyId}`     | Get story comments   | No            |
| GET    | `/api/comments/chapter/{chapterId}` | Get chapter comments | No            |
| GET    | `/api/comments/pinned`              | Get pinned comments  | No            |
| POST   | `/api/comments/{commentId}/pin`     | Pin comment          | Yes           |
| POST   | `/api/comments/{commentId}/like`    | Like comment         | Yes           |

#### Create Comment

```bash
# cURL
curl -X POST http://localhost:8080/api/comments \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "storyId": "story-uuid",
    "chapterId": "chapter-uuid",
    "content": "Great chapter!",
    "parentCommentId": null
  }'
```

#### Get Story Comments

```bash
# cURL
curl -X GET "http://localhost:8080/api/comments/story/{storyId}?page=0&size=20&sort=createdAt,desc"
```

### Reactions (Likes)

| Method | Route                                       | Description             | Auth Required |
| ------ | ------------------------------------------- | ----------------------- | ------------- |
| POST   | `/api/reactions/story/{storyId}/like`       | Toggle story like       | Yes           |
| POST   | `/api/reactions/chapter/{chapterId}/like`   | Toggle chapter like     | Yes           |
| GET    | `/api/reactions/story/{storyId}/status`     | Get story like status   | Yes           |
| GET    | `/api/reactions/chapter/{chapterId}/status` | Get chapter like status | Yes           |

#### Toggle Story Like

```bash
# cURL
curl -X POST http://localhost:8080/api/reactions/story/{storyId}/like \
  -H "Authorization: Bearer <your-jwt-token>"

# Response
{
  "liked": true,
  "totalLikes": 42,
  "message": "Story liked successfully"
}
```

### Library Management

| Method | Route                                           | Description           | Auth Required |
| ------ | ----------------------------------------------- | --------------------- | ------------- |
| POST   | `/api/libraries/story/{storyId}/bookmark`       | Toggle bookmark       | Yes           |
| POST   | `/api/libraries/story/{storyId}/reading-status` | Update reading status | Yes           |
| GET    | `/api/libraries/my-library`                     | Get user's library    | Yes           |
| GET    | `/api/libraries/reading-list`                   | Get reading list      | Yes           |
| GET    | `/api/libraries/completed`                      | Get completed stories | Yes           |
| GET    | `/api/libraries/want-to-read`                   | Get want-to-read list | Yes           |

#### Add to Library

```bash
# cURL
curl -X POST "http://localhost:8080/api/libraries/story/{storyId}/bookmark?listType=WANT_TO_READ" \
  -H "Authorization: Bearer <your-jwt-token>"

# Response
{
  "bookmarked": true,
  "listType": "WANT_TO_READ",
  "message": "Added to Want to Read"
}
```

#### Update Reading Status

```bash
# cURL
curl -X POST "http://localhost:8080/api/libraries/story/{storyId}/reading-status?status=READING" \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## 5. Categories

| Method | Route                          | Description        | Auth Required |
| ------ | ------------------------------ | ------------------ | ------------- |
| GET    | `/api/categories`              | Get all categories | No            |
| GET    | `/api/categories/{categoryId}` | Get category by ID | No            |
| POST   | `/api/categories`              | Create category    | Admin         |
| PUT    | `/api/categories/{categoryId}` | Update category    | Admin         |
| DELETE | `/api/categories/{categoryId}` | Delete category    | Admin         |

#### Get All Categories

```bash
# cURL
curl -X GET http://localhost:8080/api/categories
```

---

## 6. Monetization

### Coin Transactions

| Method | Route                         | Description             | Auth Required |
| ------ | ----------------------------- | ----------------------- | ------------- |
| GET    | `/api/coins/balance`          | Get coin balance        | Yes           |
| GET    | `/api/coins/transactions`     | Get transaction history | Yes           |
| POST   | `/api/coins/purchase-chapter` | Purchase chapter        | Yes           |
| POST   | `/api/coins/purchase-book`    | Purchase whole book     | Yes           |
| GET    | `/api/coins/packages`         | Get coin packages       | No            |
| POST   | `/api/coins/purchase-package` | Purchase coin package   | Yes           |

#### Get Coin Balance

```bash
# cURL
curl -X GET http://localhost:8080/api/coins/balance \
  -H "Authorization: Bearer <your-jwt-token>"

# Response
{
  "balance": 150,
  "totalEarned": 500,
  "totalSpent": 350
}
```

#### Purchase Chapter

```bash
# cURL
curl -X POST http://localhost:8080/api/coins/purchase-chapter \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "chapterId": "chapter-uuid",
    "coinAmount": 10
  }'
```

### Refunds

| Method | Route                                             | Description              | Auth Required |
| ------ | ------------------------------------------------- | ------------------------ | ------------- |
| GET    | `/api/refunds/chapters/{chapterId}/has-purchases` | Check chapter purchases  | Yes           |
| POST   | `/api/refunds/chapters/{chapterId}/calculate`     | Calculate chapter refund | Yes           |
| POST   | `/api/refunds/stories/{storyId}/calculate`        | Calculate story refund   | Yes           |

---

## 7. Admin Endpoints

### Admin Dashboard

| Method | Route                                   | Description                | Auth Required |
| ------ | --------------------------------------- | -------------------------- | ------------- |
| GET    | `/api/admin/dashboard/stats`            | Get dashboard statistics   | Admin         |
| GET    | `/api/admin/users`                      | Get all users              | Admin         |
| GET    | `/api/admin/users/{userId}`             | Get user details           | Admin         |
| PUT    | `/api/admin/users/{userId}/status`      | Update user status         | Admin         |
| GET    | `/api/admin/stories/moderation`         | Get stories for moderation | Admin         |
| POST   | `/api/admin/stories/{storyId}/moderate` | Moderate story             | Admin         |

#### Get Dashboard Stats

```bash
# cURL
curl -X GET http://localhost:8080/api/admin/dashboard/stats \
  -H "Authorization: Bearer <admin-jwt-token>"

# Response
{
  "totalStories": 1250,
  "totalChapters": 15000,
  "totalUsers": 5000,
  "pendingModerations": 25,
  "recentActivity": 150
}
```

### Admin Coin Management

| Method | Route                             | Description          | Auth Required |
| ------ | --------------------------------- | -------------------- | ------------- |
| GET    | `/api/admin/coins/transactions`   | Get all transactions | Admin         |
| POST   | `/api/admin/coins/adjust-balance` | Adjust user balance  | Admin         |
| GET    | `/api/admin/coins/packages`       | Manage coin packages | Admin         |
| POST   | `/api/admin/coins/packages`       | Create coin package  | Admin         |

---

## 8. Notifications

| Method | Route                                      | Description            | Auth Required |
| ------ | ------------------------------------------ | ---------------------- | ------------- |
| GET    | `/api/notifications`                       | Get user notifications | Yes           |
| PUT    | `/api/notifications/{notificationId}/read` | Mark as read           | Yes           |
| PUT    | `/api/notifications/mark-all-read`         | Mark all as read       | Yes           |
| DELETE | `/api/notifications/{notificationId}`      | Delete notification    | Yes           |

#### Get Notifications

```bash
# cURL
curl -X GET "http://localhost:8080/api/notifications?page=0&size=20&unreadOnly=true" \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "timestamp": "2024-01-01T00:00:00Z",
  "path": "/api/endpoint"
}
```

### Common Error Codes

- `AUTHENTICATION_ERROR` - Invalid or missing authentication
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `VALIDATION_ERROR` - Invalid request data
- `NOT_FOUND` - Resource not found
- `PURCHASE_PROTECTION_VIOLATION` - Cannot delete content with purchases
- `INSUFFICIENT_COINS` - Not enough coins for purchase

---

## Rate Limiting

Some endpoints have rate limiting:

- Authentication endpoints: 5 requests per minute
- Password reset: 3 requests per hour
- Email verification: 5 requests per hour

---

## Pagination

Paginated endpoints support these query parameters:

- `page` - Page number (0-based, default: 0)
- `size` - Page size (default: 20, max: 100)
- `sort` - Sort field and direction (e.g., `createdAt,desc`)

Example paginated response:

```json
{
  "content": [...],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalElements": 150,
  "totalPages": 8,
  "first": true,
  "last": false
}
```

---

## WebSocket/SSE Endpoints

### Real-time Updates

- `/api/users/sse/social-updates` - Social activity updates
- `/api/admin/coins/sse/package-updates` - Coin package updates (Admin)

---

This API reference provides comprehensive documentation for testing with Postman or cURL. Each endpoint includes the HTTP method, route, description, authentication requirements, and example requests/responses where applicable.
