# Malkuth Platform API Documentation

## 🔌 API Overview

The Malkuth Platform provides a comprehensive RESTful API built on Next.js 15 API routes. The API supports content management, bot orchestration, engagement campaigns, and real-time analytics.

## 🏗 API Architecture

### Base URL
```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

### API Structure
```
/api/
├── content/               # Content management endpoints
│   ├── upload            # Content upload
│   ├── [id]              # Individual content operations
│   └── search            # Content search and filtering
├── analytics/            # Analytics and reporting endpoints
│   ├── overview          # Dashboard metrics
│   ├── bots              # Bot performance analytics
│   ├── content           # Content performance analytics
│   ├── engagement-patterns # Engagement pattern analysis
│   ├── trending-topics   # Trending content analysis
│   ├── reports           # Report generation
│   ├── export            # Data export
│   └── system            # System health metrics
├── engagement/           # Engagement orchestration endpoints
│   ├── campaigns         # Campaign management
│   ├── bots              # Bot persona management
│   ├── queue             # Engagement queue operations
│   └── control           # Admin controls
└── health                # System health check
```

## 🔐 Authentication

### API Key Authentication
```http
Authorization: Bearer YOUR_API_KEY
```

### Request Headers
```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_API_KEY
X-Client-Version: 1.0.0
```

## 📊 Response Format

### Standard Response Structure
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}
```

### Success Response Example
```json
{
  "success": true,
  "data": {
    "id": "content_123",
    "title": "Example Content",
    "type": "video"
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_abc123",
    "version": "1.0.0"
  }
}
```

### Error Response Example
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid content type",
    "details": {
      "field": "type",
      "expected": ["video", "music", "writing"],
      "received": "invalid_type"
    }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_abc123",
    "version": "1.0.0"
  }
}
```

## 📄 Pagination

### Pagination Parameters
```typescript
interface PaginationParams {
  page?: number;      // Page number (default: 1)
  limit?: number;     // Items per page (default: 10, max: 100)
  sort?: string;      // Sort field
  order?: 'asc' | 'desc'; // Sort order (default: 'desc')
}
```

### Pagination Response
```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

### Example Paginated Request
```http
GET /api/content?page=2&limit=20&sort=createdAt&order=desc
```

## 🔍 Filtering and Search

### Query Parameters
```typescript
interface FilterParams {
  search?: string;        // Full-text search
  type?: ContentType;     // Filter by content type
  category?: string;      // Filter by category
  author?: string;        // Filter by author
  tags?: string[];        // Filter by tags (comma-separated)
  startDate?: string;     // Filter by creation date (ISO 8601)
  endDate?: string;       // Filter by creation date (ISO 8601)
  isPublished?: boolean;  // Filter by publication status
}
```

### Example Filtered Request
```http
GET /api/content?search=tutorial&type=video&tags=javascript,react&isPublished=true
```

## ⚡ Rate Limiting

### Rate Limits
- **General API**: 1000 requests per hour
- **Upload Endpoints**: 100 requests per hour
- **Analytics Endpoints**: 500 requests per hour
- **Admin Endpoints**: 200 requests per hour

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248000
X-RateLimit-Window: 3600
```

### Rate Limit Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again later.",
    "details": {
      "limit": 1000,
      "window": 3600,
      "resetTime": "2024-01-15T11:00:00Z"
    }
  }
}
```

## 📁 Content API

### Upload Content
```http
POST /api/content/upload
Content-Type: multipart/form-data
```

**Form Data:**
```typescript
interface ContentUploadRequest {
  file: File;                    // Content file
  title: string;                 // Content title
  description?: string;          // Content description
  type: ContentType;             // 'video' | 'music' | 'writing'
  category: string;              // Content category
  tags?: string;                 // Comma-separated tags
  author: string;                // Content author
  isPublished?: boolean;         // Publication status (default: false)
}
```

**Response:**
```typescript
interface ContentUploadResponse {
  id: string;
  title: string;
  type: ContentType;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  uploadProgress: number;        // 0-100
  processingSteps: string[];
  url?: string;                  // Available after processing
  thumbnailUrl?: string;
}
```

### Get Content List
```http
GET /api/content
```

**Query Parameters:**
```typescript
interface ContentListParams extends PaginationParams, FilterParams {
  includeMetadata?: boolean;     // Include detailed metadata
  includeAnalytics?: boolean;    // Include performance analytics
}
```

**Response:**
```typescript
interface ContentListResponse extends PaginatedResponse<Content> {
  analytics?: {
    totalContent: number;
    contentByType: Record<ContentType, number>;
    averageViews: number;
    topPerformers: Content[];
  };
}
```

### Get Individual Content
```http
GET /api/content/[id]
```

**Response:**
```typescript
interface ContentDetailsResponse {
  content: Content;
  analytics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
    viewingPatterns: ViewingPattern[];
  };
  relatedContent: Content[];
}
```

## 🤖 Bot Management API

### Create Bot Persona
```http
POST /api/engagement/bots
```

**Request Body:**
```typescript
interface CreateBotRequest {
  name?: string;
  personality?: string;
  interests?: string[];
  engagementStyle?: EngagementStyle;
  demographics?: {
    ageRange?: [number, number];
    location?: string;
    timezone?: string;
  };
  behaviorPatterns?: {
    activeHours?: number[];
    engagementFrequency?: 'low' | 'medium' | 'high';
    contentPreferences?: string[];
  };
}
```

**Response:**
```typescript
interface BotPersona {
  id: string;
  name: string;
  personality: string;
  interests: string[];
  engagementStyle: EngagementStyle;
  demographics: BotDemographics;
  behaviorPatterns: BotBehaviorPatterns;
  createdAt: string;
  isActive: boolean;
}
```

### Get Bot Analytics
```http
GET /api/analytics/bots?botId=bot_123
```

**Response:**
```typescript
interface BotAnalyticsResponse {
  bot: BotPersona;
  analytics: {
    totalEngagements: number;
    engagementsByType: Record<EngagementType, number>;
    averageAuthenticityScore: number;
    activityPattern: Array<{
      hour: number;
      activity: number;
    }>;
    contentPreferences: Array<{
      category: string;
      engagement: number;
    }>;
    performanceMetrics: {
      successRate: number;
      averageResponseTime: number;
      qualityScore: number;
    };
  };
}
```

## 🎯 Campaign Management API

### Create Engagement Campaign
```http
POST /api/engagement/campaigns
```

**Request Body:**
```typescript
interface CreateCampaignRequest {
  contentId: string;
  targetMetrics?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
  parameters?: Partial<EngagementParameters>;
  scheduledStart?: string;       // ISO 8601 date
}
```

**Response:**
```typescript
interface EngagementCampaign {
  id: string;
  contentId: string;
  targetMetrics: TargetMetrics;
  parameters: EngagementParameters;
  status: CampaignStatus;
  createdAt: string;
  startDate: string;
  endDate?: string;
  analytics: CampaignAnalytics;
}
```

### Control Campaign
```http
POST /api/engagement/control
```

**Request Body:**
```typescript
interface CampaignControlRequest {
  campaignId: string;
  action: 'start' | 'pause' | 'resume' | 'stop' | 'emergency-stop';
  reason?: string;
  parameters?: Partial<EngagementParameters>;
}
```

## 📊 Analytics API

### Get Overview Metrics
```http
GET /api/analytics/overview
```

**Query Parameters:**
```typescript
interface OverviewParams {
  period?: '24h' | '7d' | '30d' | '90d';
  metrics?: string[];            // Specific metrics to include
  breakdown?: 'hourly' | 'daily' | 'weekly';
}
```

**Response:**
```typescript
interface OverviewMetrics {
  summary: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    activeContent: number;
    activeBots: number;
    activeCampaigns: number;
  };
  trends: {
    viewsTrend: number;           // Percentage change
    engagementTrend: number;
    contentTrend: number;
  };
  charts: {
    engagementOverTime: ChartData;
    contentPerformance: ChartData;
    botActivity: ChartData;
  };
  topPerformers: {
    content: Content[];
    bots: BotPersona[];
    campaigns: EngagementCampaign[];
  };
}
```

### Export Analytics Data
```http
POST /api/analytics/export
```

**Request Body:**
```typescript
interface ExportRequest {
  format: 'csv' | 'json' | 'pdf';
  dateRange: {
    start: string;               // ISO 8601 date
    end: string;                 // ISO 8601 date
  };
  metrics: string[];
  filters?: FilterParams;
  includeCharts?: boolean;
  includeRawData?: boolean;
}
```

**Response:**
```typescript
interface ExportResponse {
  downloadUrl: string;
  expiresAt: string;
  fileSize: number;
  format: string;
}
```

## 🔄 Real-time Updates

### WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:3000/api/ws');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  
  switch (update.type) {
    case 'analytics_update':
      updateDashboard(update.data);
      break;
    case 'campaign_status':
      updateCampaignStatus(update.data);
      break;
    case 'bot_activity':
      updateBotActivity(update.data);
      break;
  }
};
```

### Real-time Events
```typescript
interface RealTimeUpdate {
  type: 'analytics_update' | 'campaign_status' | 'bot_activity' | 'system_alert';
  timestamp: string;
  data: any;
  metadata?: {
    campaignId?: string;
    botId?: string;
    contentId?: string;
  };
}
```

## ❌ Error Codes

### Common Error Codes
```typescript
enum ErrorCode {
  // Authentication Errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_API_KEY = 'INVALID_API_KEY',
  
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Resource Errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  RESOURCE_LIMIT_EXCEEDED = 'RESOURCE_LIMIT_EXCEEDED',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // System Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  
  // Business Logic Errors
  CAMPAIGN_NOT_ACTIVE = 'CAMPAIGN_NOT_ACTIVE',
  BOT_LIMIT_EXCEEDED = 'BOT_LIMIT_EXCEEDED',
  INVALID_CAMPAIGN_STATE = 'INVALID_CAMPAIGN_STATE'
}
```

## 📚 SDK and Libraries

### JavaScript/TypeScript SDK
```typescript
import { MalkuthAPI } from '@malkuth/api-client';

const client = new MalkuthAPI({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.malkuth.com'
});

// Upload content
const content = await client.content.upload({
  file: fileBlob,
  title: 'My Video',
  type: 'video',
  author: 'John Doe'
});

// Create campaign
const campaign = await client.engagement.createCampaign({
  contentId: content.id,
  targetMetrics: {
    views: 10000,
    likes: 1000
  }
});

// Get analytics
const analytics = await client.analytics.getOverview({
  period: '7d'
});
```

### Python SDK
```python
from malkuth_api import MalkuthClient

client = MalkuthClient(api_key='your_api_key')

# Upload content
content = client.content.upload(
    file=open('video.mp4', 'rb'),
    title='My Video',
    type='video',
    author='John Doe'
)

# Create campaign
campaign = client.engagement.create_campaign(
    content_id=content['id'],
    target_metrics={
        'views': 10000,
        'likes': 1000
    }
)

# Get analytics
analytics = client.analytics.get_overview(period='7d')
```

## 🧪 Testing

### API Testing
```bash
# Install testing tools
npm install -g @malkuth/api-test-suite

# Run API tests
malkuth-test --config test-config.json
```

### Example Test Configuration
```json
{
  "baseUrl": "http://localhost:3000/api",
  "apiKey": "test_api_key",
  "tests": [
    {
      "name": "Content Upload",
      "endpoint": "/content/upload",
      "method": "POST",
      "file": "./test-files/sample-video.mp4",
      "expectedStatus": 200
    },
    {
      "name": "Get Content List",
      "endpoint": "/content",
      "method": "GET",
      "expectedStatus": 200,
      "assertions": [
        "response.data.length > 0",
        "response.pagination.total >= 0"
      ]
    }
  ]
}
```

## 📖 Additional Resources

- [Content API Reference](./CONTENT.md)
- [Analytics API Reference](./ANALYTICS.md)
- [Engagement API Reference](./ENGAGEMENT.md)
- [Authentication Guide](./AUTHENTICATION.md)
- [API Examples and Tutorials](./EXAMPLES.md)

## 🤝 Support

For API support:
- 📧 Email: api-support@malkuth-platform.com
- 📚 Documentation: https://docs.malkuth.com
- 💬 Discord: https://discord.gg/malkuth
- 🐛 Issues: https://github.com/malkuth/platform/issues

---

**Note**: This API is currently in version 1.0. Breaking changes will be versioned and communicated in advance.