# SPAC OS API Reference

## Overview

SPAC OS provides both **tRPC** (type-safe) and **REST** APIs for all operations.

## Base URLs

- **tRPC**: `/api/trpc/*`
- **REST**: `/api/*`

## Authentication

All endpoints require authentication via NextAuth.js session cookies or API keys.

### Headers
```
Authorization: Bearer <api_key>
Cookie: next-auth.session-token=<session_token>
```

---

## REST API Endpoints

### Health Check

#### GET /api/health
Check system health and database connectivity.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00Z",
  "version": "1.0.0",
  "checks": {
    "database": "connected",
    "responseTimeMs": 5
  }
}
```

---

### SPACs

#### GET /api/spacs
List SPACs for an organization.

**Query Parameters:**
- `organizationId` (required): UUID
- `status`: Filter by status
- `search`: Search by name/ticker
- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 20, max: 100)
- `sortBy`: Field to sort by (name, ticker, createdAt, deadline, ipoAmount)
- `sortOrder`: asc or desc

**Response:**
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "totalPages": 5
}
```

#### POST /api/spacs
Create a new SPAC.

**Request Body:**
```json
{
  "organizationId": "uuid",
  "name": "Example SPAC",
  "ticker": "EXSP",
  "status": "SEARCHING",
  "ipoAmount": 200000000,
  "deadline": "2025-12-31T00:00:00Z"
}
```

#### GET /api/spacs/:id
Get SPAC details.

#### PUT /api/spacs/:id
Update SPAC.

#### DELETE /api/spacs/:id
Soft delete SPAC (admin only).

---

### Documents

#### POST /api/documents/upload
Upload a document.

**Request:** `multipart/form-data`
- `file`: The file to upload
- `metadata`: JSON object with:
  - `spacId` (required): UUID
  - `type` (required): Document type
  - `title` (required): Document title
  - `description`: Optional description
  - `accessLevel`: PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED
  - `tags`: Array of strings

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "uuid",
    "title": "Document Title",
    "type": "CONTRACT",
    "fileName": "document.pdf",
    "fileSize": 1024000,
    "version": 1
  }
}
```

#### GET /api/documents/:id
Get document details and download URL.

**Query Parameters:**
- `version`: Specific version number (optional)

#### PATCH /api/documents/:id
Update document metadata.

#### DELETE /api/documents/:id
Soft delete document (admin only).

---

### Webhooks

#### POST /api/webhooks/receive
Receive incoming webhooks from external services.

**Headers:**
- `X-Webhook-Signature`: HMAC signature for verification
- `X-Webhook-Source`: Source identifier

**Request Body:**
```json
{
  "source": "sec_edgar",
  "event": "filing_accepted",
  "timestamp": "2025-01-01T00:00:00Z",
  "data": {...}
}
```

---

### Export

#### POST /api/export
Export data in JSON or CSV format.

**Request Body:**
```json
{
  "organizationId": "uuid",
  "entityType": "spacs|targets|tasks|documents|filings|compliance|transactions|audit_logs",
  "format": "json|csv",
  "filters": {
    "spacId": "uuid",
    "status": "ACTIVE",
    "startDate": "2025-01-01",
    "endDate": "2025-12-31"
  },
  "fields": ["id", "name", "status"]
}
```

---

### Batch Operations

#### POST /api/batch
Execute multiple operations in a single request.

**Request Body:**
```json
{
  "organizationId": "uuid",
  "operations": [
    {
      "id": "op1",
      "action": "create",
      "entityType": "task",
      "data": { "title": "New Task", "spacId": "uuid" }
    },
    {
      "id": "op2",
      "action": "update",
      "entityType": "task",
      "entityId": "uuid",
      "data": { "status": "COMPLETED" }
    },
    {
      "id": "op3",
      "action": "delete",
      "entityType": "task",
      "entityId": "uuid"
    }
  ]
}
```

**Response:**
```json
{
  "total": 3,
  "successful": 2,
  "failed": 1,
  "results": [
    { "id": "op1", "success": true, "entityType": "task", "entityId": "new-uuid" },
    { "id": "op2", "success": true, "entityType": "task", "entityId": "uuid" },
    { "id": "op3", "success": false, "entityType": "task", "error": "Task not found" }
  ]
}
```

---

## tRPC API

The tRPC API provides type-safe access to all SPAC OS features.

### Available Routers

| Router | Description |
|--------|-------------|
| `spac.*` | SPAC management |
| `target.*` | Acquisition target management |
| `filing.*` | SEC filing management |
| `task.*` | Task/workflow management |
| `document.*` | Document management |
| `compliance.*` | Compliance tracking |
| `financial.*` | Financial entities |
| `analytics.*` | Analytics and reporting |
| `webhook.*` | Webhook management |

### Compliance Sub-routers
- `compliance.complianceItems.*`
- `compliance.boardMeetings.*`
- `compliance.conflicts.*`
- `compliance.tradingWindows.*`

### Financial Sub-routers
- `financial.trustAccounts.*`
- `financial.capTable.*`
- `financial.warrants.*`
- `financial.redemptions.*`
- `financial.pipe.*`
- `financial.earnouts.*`

### Example Usage (Client)

```typescript
import { api } from '@/lib/trpc';

// List SPACs
const { data } = api.spac.list.useQuery({
  organizationId: 'uuid',
  page: 1,
  pageSize: 20,
});

// Create a task
const mutation = api.task.create.useMutation();
await mutation.mutateAsync({
  spacId: 'uuid',
  title: 'Review LOI',
  priority: 'HIGH',
});
```

---

## WebSocket Events

Real-time updates are available via Socket.IO.

### Connection
```javascript
import { io } from 'socket.io-client';

const socket = io('/api/ws', {
  transports: ['websocket'],
});
```

### Events
- `spac:created`, `spac:updated`, `spac:status_changed`
- `target:created`, `target:updated`, `target:status_changed`
- `task:created`, `task:updated`, `task:completed`, `task:assigned`
- `document:uploaded`, `document:updated`
- `filing:created`, `filing:status_changed`, `filing:sec_comment`
- `compliance:alert`
- `notification`

### Room Subscriptions
```javascript
// Join organization room
socket.emit('join:organization', organizationId);

// Join SPAC room
socket.emit('join:spac', spacId);
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": {...}
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error
- `503` - Service Unavailable

---

## Rate Limiting

API requests are rate limited per organization:
- Standard: 1000 requests/minute
- Batch endpoints: 100 requests/minute
- Export endpoints: 10 requests/minute

---

## Pagination

List endpoints support cursor-based and offset pagination:

```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "totalPages": 5
}
```
