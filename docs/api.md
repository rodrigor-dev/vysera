# Vysera API Documentation

Base URL: `http://localhost:4000/api` (development) or `https://api.vysera.com` (production)

## Authentication

### Bearer Token (Primary)
All protected endpoints require `Authorization: Bearer <access_token>` header.

### Cookie Fallback
Access tokens are also set as HTTPOnly cookies (`accessToken`) on login.

### Admin Authentication
Admin endpoints require JWT with role `admin`.

## Rate Limiting

| Route | Window | Max Requests |
|-------|--------|-------------|
| Auth (login, register, forgot-password, reset-password, OAuth) | 15 min | 10 |
| Auth (refresh) | 15 min | 10 |
| Auth (logout) | 1 min | 30 |
| General API | 15 min | 100 |
| Upload | 1 min | 10 |
| Export | 1 min | 10 |
| Payment | 1 min | 20 |
| Render queue | 1 min | 30 |
| Subscription | 1 min | 30 |
| Video API | 1 min | 30 |
| Webhooks | 1 min | 60 |
| Cleanup | 1 min | 3 |

## API Reference

### Auth

#### `POST /auth/register`
Create a new user account.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "Str0ng!Pass",
  "name": "John Doe"
}
```

**Response:** `201`
```json
{
  "message": "Registration successful",
  "user": { "id": "...", "email": "...", "name": "..." }
}
```

#### `POST /auth/login`
Authenticate user. Sets HTTPOnly cookies and returns tokens.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "Str0ng!Pass"
}
```

**Response:** `200`
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { "id": "...", "email": "...", "name": "...", "role": "user" }
}
```

#### `POST /auth/refresh`
Refresh access token.

**Body:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response:** `200`
```json
{
  "accessToken": "eyJ..."
}
```

#### `POST /auth/logout`
Invalidate refresh token.

**Body:**
```json
{
  "refreshToken": "eyJ..."
}
```

#### `POST /auth/forgot-password`
Request password reset email.

**Body:**
```json
{
  "email": "user@example.com"
}
```

#### `POST /auth/reset-password`
Reset password with token from email.

**Body:**
```json
{
  "token": "reset-token",
  "password": "NewStr0ng!Pass"
}
```

#### OAuth (`/auth/oauth/google`, `/auth/oauth/apple`, `/auth/oauth/facebook`)
Login via OAuth provider.

**Body:**
```json
{
  "email": "user@gmail.com",
  "name": "John Doe",
  "googleId": "12345"
}
```

### User

#### `GET /user/profile`
Get current user profile.

#### `PUT /user/profile`
Update profile.

**Body:**
```json
{
  "name": "New Name",
  "avatarUrl": "https://..."
}
```

#### `PUT /user/password`
Change password (invalidates other sessions).

**Body:**
```json
{
  "currentPassword": "OldPass1!",
  "newPassword": "NewPass1!"
}
```

#### `GET /user/dashboard`
Get dashboard statistics (projects count, exports, templates, uploads).

#### `GET /user/projects?page=1&limit=20&sortBy=createdAt&sortOrder=desc`
List user projects (paginated).

#### `GET /user/exports?page=1&limit=20&sortBy=createdAt&sortOrder=desc`
List user exports (paginated).

### Upload

#### `POST /upload/video`
Upload video file (multipart/form-data, max 500MB).

#### `POST /upload/audio`
Upload audio file (multipart/form-data, max 500MB).

#### `POST /upload/image`
Upload image file (multipart/form-data, max 500MB).

**Response:** `201`
```json
{
  "message": "Upload successful",
  "upload": {
    "id": "...",
    "fileName": "video_1234-uuid.mp4",
    "originalName": "my-video.mp4",
    "mimeType": "video/mp4",
    "size": 12345678,
    "url": "/uploads/videos/video_1234-uuid.mp4"
  }
}
```

#### `GET /upload/list?type=video&page=1&limit=20`
List user uploads (paginated, filterable by type: video/audio/image).

#### `GET /upload/:id`
Get upload details.

#### `DELETE /upload/:id`
Delete upload.

### Video Processing

#### `POST /video/create`
Create AI processing job.

**Body:**
```json
{
  "projectId": "project-id",
  "uploadIds": ["upload-id-1"],
  "format": "mp4",
  "template": "template-vlog",
  "options": {
    "colorGrade": "warm",
    "transition": "dissolve",
    "captionStyle": "minimal"
  }
}
```

**Response:** `201`
```json
{
  "message": "Processing job created",
  "job": { "id": "job-id", "status": "queued" }
}
```

#### `GET /video/job/:jobId`
Get job status and progress.

#### `GET /video/jobs`
List all user jobs.

#### `POST /video/cancel/:jobId`
Cancel a queued/running job.

### Templates

#### `GET /video/templates?category=social`
List templates (optional category filter).

#### `GET /video/templates/:templateId`
Get template details + config.

#### `POST /video/preview`
Generate a preview clip.

**Body:**
```json
{
  "inputPath": "/uploads/videos/video_1234.mp4",
  "duration": 15
}
```

### Exports

#### `POST /exports/create`
Create an export job.

**Body:**
```json
{
  "projectId": "project-id",
  "format": "mp4",
  "resolution": "p1080",
  "fps": 30,
  "quality": "standard",
  "platform": "youtube"
}
```

**Valid formats:** `mp4`, `mov`, `webm`, `gif`
**Valid resolutions:** `p720`, `p1080`, `k2`, `k4`
**Valid FPS:** `24`, `30`, `60`
**Valid platforms:** `tiktok`, `instagram`, `instagram_reels`, `youtube`, `youtube_4k`, `youtube_shorts`, `twitter`, `linkedin`, `whatsapp`

#### `GET /exports?page=1&limit=20&status=completed`
List exports (paginated, optional status filter).

#### `GET /exports/stats`
Get export statistics and supported configurations.

#### `GET /exports/:id`
Get export details.

#### `GET /exports/:id/progress`
Get export progress (real-time polling).

**Response:**
```json
{
  "progress": { "progress": 45, "stage": "rendering", "startedAt": "..." },
  "queue": { "status": "active", "position": 0 }
}
```

#### `POST /exports/:id/cancel`
Cancel an active export.

#### `GET /exports/:id/download`
Download completed export file.

#### `POST /exports/cleanup`
Clean up old export files (body: `{ "days": 7 }`).

### Render Queue

#### `GET /render/status`
Get render queue statistics.

#### `GET /render/job/:jobId`
Get render job status.

#### `POST /render/cancel/:jobId`
Cancel a render job.

### Payments

#### `POST /payments/create-checkout`
Create Stripe Checkout session.

**Body:**
```json
{
  "priceId": "price_abc123",
  "billingType": "monthly"
}
```

**Response:** `{ "url": "https://checkout.stripe.com/..." }`

#### `POST /payments/portal`
Create Stripe Customer Portal session.

**Response:** `{ "url": "https://billing.stripe.com/..." }`

#### `POST /payments/mp-preference`
Create Mercado Pago payment preference.

**Body:**
```json
{
  "plan": "pro",
  "billingType": "monthly"
}
```

#### `POST /payments/webhook`
Stripe webhook endpoint (signature verified via `stripe-signature` header).

#### `POST /payments/mp-webhook`
Mercado Pago webhook endpoint (signature verified via `x-signature` header).

### Subscriptions

#### `GET /subscriptions`
List user subscriptions.

#### `GET /subscriptions/active`
Get active subscription and current plan details.

#### `GET /subscriptions/plans`
List all available plans with features and pricing.

#### `GET /subscriptions/invoices`
List user invoices.

### Admin

All admin endpoints require `admin` role.

#### `GET /admin/users?page=1&limit=20&search=john&sortBy=createdAt&sortOrder=desc`
List all users (paginated, searchable).

#### `GET /admin/users/:id`
Get user details with project/export/upload counts.

#### `PUT /admin/users/:id/role`
Update user role.

**Body:** `{ "role": "pro" }`

#### `DELETE /admin/users/:id`
Delete user.

#### `GET /admin/stats`
Platform statistics (users, projects, exports, uploads).

#### `GET /admin/payments?page=1&limit=20`
Payment history (paginated).

#### `GET /admin/logs?page=1&limit=20`
Login attempt logs.

#### `GET /admin/analytics`
30-day analytics (new users, projects, exports, active users).

#### `GET /admin/errors?page=1&limit=20`
High/critical security events.

#### `GET /admin/audit-logs?page=1&limit=20&action=ADMIN_GRANT_PRO`
Admin audit trail (filterable by action).

#### `GET /admin/financial`
Revenue data (total, monthly breakdown by plan).

#### `GET /admin/subscriptions?page=1&limit=20&status=active`
List all subscriptions (paginated, filterable by status).

#### `POST /admin/subscriptions/grant-pro`
Grant Pro access to user.

**Body:** `{ "userId": "...", "durationDays": 30 }`

#### `POST /admin/subscriptions/cancel`
Cancel user subscription.

**Body:** `{ "userId": "..." }`

#### `POST /admin/subscriptions/change-plan`
Change user plan.

**Body:** `{ "userId": "...", "newPlan": "pro" }`

## Error Responses

All errors follow the format:
```json
{
  "error": "Human-readable error message"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Resource not found |
| 409 | Conflict |
| 413 | Request too large |
| 415 | Unsupported content type |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

## Pagination

Paginated endpoints return:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```
