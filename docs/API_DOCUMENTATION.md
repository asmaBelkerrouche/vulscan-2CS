# VulnScan API Documentation

## Overview
VulnScan provides a RESTful API for vulnerability scanning operations. All endpoints require authentication except for registration and login.

**Base URL**: `http://localhost:8000/api`

## Authentication
All endpoints (except `/register` and `/login`) require JWT authentication via HTTP-only cookies.

## 🔐 Authentication Endpoints

### POST `/api/auth/register`
Create a new user account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "userId": "u_12345",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2025-10-01T09:00:00Z"
  }
}
```

**Errors:**
- `400` - Invalid input data
- `409` - Email already registered

### POST `/api/auth/login`
Authenticate user and set authentication cookie.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
- Sets `auth_token` cookie (HTTP-only, Secure)
- Returns user profile data

**Response Body:**
```json
{
  "user": {
    "userId": "u_12345",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Errors:**
- `401` - Invalid email or password
- `403` - Account disabled/banned

### POST `/api/auth/logout`
Log out current user by clearing authentication cookie.

**Request Body:** None

**Response:** `204 No Content`

### GET `/api/auth/profile`
Get current user's profile.

**Request Body:** None

**Response (200 OK):**
```json
{
  "user": {
    "userId": "u_12345",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2025-10-01T09:00:00Z",
    "avatarUrl": "/media/avatars/12345/avatar.jpg"
  }
}
```

**Errors:**
- `401` - Missing/invalid cookie

### POST `/api/auth/change-password`
Change user password.

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456",
  "newPasswordConfirm": "newSecurePassword456"
}
```

**Response (200 OK):**
```json
{
  "detail": "Password updated successfully"
}
```

**Errors:**
- `401` - Current password is incorrect
- `400` - Weak password or password mismatch

### POST `/api/profile/name`
Update user's first and last name.

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Smith"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "userId": "u_12345",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "createdAt": "2025-10-01T09:00:00Z",
    "avatarUrl": "/media/avatars/12345/avatar.jpg"
  }
}
```

### POST `/api/profile/photo`
Upload user profile photo.

**Request:** Multipart form-data with image file

**Response (200 OK):**
```json
{
  "user": {
    "userId": "u_12345",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "createdAt": "2025-10-01T09:00:00Z",
    "avatarUrl": "/media/avatars/12345/new_avatar.jpg"
  }
}
```

### POST `/api/profile/delete-account`
Delete user account.

**Request Body:**
```json
{
  "currentPassword": "string",
  "confirm": true,
  "phrase": "DELETE"
}
```

**Response:** `204 No Content`

## 🔍 Scanning Endpoints

### POST `/api/scans/`
Start a new vulnerability scan.

**Request Body:**
```json
{
  "target": "https://example.com",
  "mode": "quick"
}
```

**Parameters:**
- `target` (string): URL or IP address to scan
- `mode` (string): `"quick"` or `"full"` scan type

**Response (201 Created):**
```json
{
  "scanId": "s_67890",
  "target": "https://example.com",
  "mode": "quick",
  "status": "queued",
  "createdAt": "2025-10-01T10:00:00Z"
}
```

**Errors:**
- `400` - Invalid target (bad URL/IP)
- `401` - Not authenticated

### GET `/api/scans/{scanId}`
Get scan progress and details.

**Response (200 OK):**
```json
{
  "scanId": "s_67890",
  "target": "https://example.com",
  "mode": "quick",
  "status": "running",
  "progress": 65,
  "startedAt": "2025-10-01T10:01:00Z",
  "estimatedTimeLeft": "2m30s"
}
```

**Errors:**
- `404` - Scan not found
- `401` - Not authenticated

### POST `/api/scans/{scanId}/cancel`
Cancel an ongoing scan.

**Response (200 OK):**
```json
{
  "scanId": "s_67890",
  "status": "canceled"
}
```

## 📊 Reports Endpoints

### GET `/api/scans/{scanId}/report`
Get detailed scan report with vulnerabilities.

**Response (200 OK):**
```json
{
  "scanId": "s_67890",
  "target": "https://example.com",
  "mode": "quick",
  "status": "completed",
  "summary": {
    "total": 8,
    "critical": 2,
    "high": 3,
    "medium": 2,
    "low": 1,
    "info": 0,
    "duration": "3m40s"
  },
  "vulnerabilities": [
    {
      "id": "vuln_001",
      "severity": "critical",
      "name": "SQL Injection",
      "path": "/login",
      "description": "Unsanitized SQL query allows injection",
      "impact": "Database exfiltration",
      "remediation": "Use parameterized queries",
      "references": ["https://owasp.org/Top10/A03_2021-Injection/"],
      "status": "new"
    },
    {
      "id": "vuln_002",
      "severity": "high",
      "name": "XSS (Cross-Site Scripting)",
      "path": "/search",
      "description": "Reflected XSS via query parameter",
      "impact": "Stealing session cookies",
      "remediation": "HTML encode all user inputs before rendering",
      "references": ["https://owasp.org/Top10/A07_2021-XSS/"],
      "status": "new"
    }
  ]
}
```

### GET `/api/scans/{scanId}/download?format=pdf`
Download scan report in various formats.

**Parameters:**
- `format` (string): `"pdf"`, `"json"`, or `"csv"`

**Response:** File download with appropriate Content-Type

**Errors:**
- `400` - Unsupported format

## 📋 History Endpoints

### GET `/api/scans/`
List user's scan history with filtering options.

**Query Parameters:**
- `limit` (number): Number of results (default: 10)
- `offset` (number): Pagination offset (default: 0)
- `status` (string): Filter by status (`queued`, `running`, `completed`, `failed`, `canceled`)
- `mode` (string): Filter by scan mode (`quick`, `full`)

**Response (200 OK):**
```json
{
  "scans": [
    {
      "scanId": "s_67890",
      "target": "https://example.com",
      "mode": "quick",
      "status": "completed",
      "summary": {
        "critical": 2,
        "high": 3,
        "medium": 2,
        "low": 1,
        "info": 0
      },
      "createdAt": "2025-10-01T10:00:00Z",
      "duration": "3m40s"
    },
    {
      "scanId": "s_67891",
      "target": "192.168.1.1",
      "mode": "full",
      "status": "running",
      "createdAt": "2025-10-01T11:00:00Z",
      "progress": 45
    }
  ]
}
```

## Error Responses
All errors follow this format:
```json
{
  "error": {
    "code": 400,
    "message": "Descriptive error message"
  }
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Resource created
- `204` - No content
- `400` - Bad request
- `401` - Unauthorized
- `404` - Resource not found
- `409` - Conflict
- `500` - Internal server error

## Authentication Flow
1. User registers or logs in to get JWT token
2. Token is stored in HTTP-only cookie automatically
3. All subsequent requests include the cookie automatically
4. Frontend doesn't need to manually handle tokens

## Rate Limits
- Authentication endpoints: 10 requests per minute
- Scan creation: 5 scans per hour
- Report downloads: 20 downloads per hour

## Security Notes
- All passwords must be at least 8 characters with mixed case and numbers
- JWT tokens expire after 24 hours
- HTTPS is required in production
- All user input is validated and sanitized
- File uploads are restricted to image types only
- CORS is configured for secure cross-origin requests

## API Usage Examples

### Starting a Scan
```javascript
// Start a quick scan
const response = await fetch('/api/scans/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    target: 'https://example.com',
    mode: 'quick'
  })
});
```

### Checking Scan Progress
```javascript
// Check scan status
const response = await fetch('/api/scans/s_67890');
const scanData = await response.json();
console.log(`Progress: ${scanData.progress}%`);
```

### Downloading Reports
```javascript
// Download PDF report
const response = await fetch('/api/scans/s_67890/download?format=pdf');
const blob = await response.blob();
// Create download link
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'scan_report.pdf';
a.click();
```
