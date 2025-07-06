# Malkuth Platform - Advanced Content Orchestration System

Foundation of Digital Reality - A sophisticated Next.js application featuring intelligent content management with AI-powered bot persona system and automated engagement orchestration.

## 🌟 Overview

Malkuth Platform is an advanced content management and engagement orchestration system that combines traditional content management with intelligent bot personas and automated social engagement. The platform simulates authentic social interactions while providing comprehensive analytics and content performance tracking.

### Key Concepts

- **Content Management**: Upload, process, and manage video, writing, and music content
- **Bot Persona System**: AI-powered virtual personas with unique personalities and behaviors
- **Engagement Orchestration**: Automated, authentic-looking engagement campaigns
- **Analytics Dashboard**: Real-time monitoring and performance insights
- **Phase-based Campaigns**: Strategic content promotion through discovery, viral, sustained, and archive phases

## 🚀 Features

### Core Platform
- **Modern Architecture**: Next.js 15 with App Router and TypeScript
- **Responsive Design**: Tailwind CSS with minimalist black/white theme
- **Real-time Analytics**: Live dashboard with comprehensive metrics
- **Cloud Integration**: Google Cloud Storage with CDN optimization
- **Component Library**: Storybook-documented UI components

### Content Management System
- **Multi-format Support**: Video, writing, and music content types
- **Advanced Processing**: Automatic transcoding, thumbnail generation, metadata extraction
- **Search & Filtering**: Powerful content discovery with tagging system
- **Bulk Operations**: Efficient management of multiple content items
- **Version Control**: Track content changes and revisions

### Bot Persona System
- **Realistic Profiles**: AI-generated personas with unique personalities, interests, and demographics
- **Behavioral Patterns**: Authentic interaction timing and engagement styles
- **Interest Matching**: Content-persona alignment for natural engagement
- **Activity Simulation**: Realistic viewing patterns and social behaviors
- **Scalable Management**: Support for up to 1,000 concurrent bot personas

### Engagement Orchestration
- **Campaign Management**: Create and monitor engagement campaigns
- **Phase-based Strategy**: Discovery → Viral Growth → Sustained Interest → Archive
- **Authenticity Focus**: Realistic timing, delays, and interaction patterns
- **Rate Limiting**: Prevents detection through controlled engagement rates
- **Emergency Controls**: Instant stop mechanisms for campaign management

### Analytics & Monitoring
- **Real-time Metrics**: Live tracking of views, likes, comments, shares
- **Bot Performance**: Individual and aggregate bot behavior analysis
- **Content Analytics**: Performance tracking with optimization recommendations
- **System Health**: API usage, storage metrics, and error monitoring
- **Export Capabilities**: CSV, JSON, and PDF report generation

## 🛠 Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **React 19**: Latest React with concurrent features
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first styling with custom design tokens
- **Storybook**: Component development and documentation

### Backend & Services
- **Google Cloud Storage**: Scalable file storage with CDN
- **FFmpeg**: Video processing and transcoding
- **Gemini API**: AI integration for content analysis (planned)
- **RESTful APIs**: Comprehensive API design for all features

### Development Tools
- **ESLint**: Code quality and consistency
- **PostCSS**: CSS processing and optimization
- **Turbopack**: Fast development builds
- **Git**: Version control with feature branches

## 📋 Prerequisites

Before installing Malkuth Platform, ensure you have:

- **Node.js 18+** (recommended: 20+)
- **npm** or **yarn** package manager
- **Google Cloud Platform** account with billing enabled
- **FFmpeg** installed for video processing
- **Git** for version control

### System Requirements
- **Memory**: 4GB RAM minimum (8GB recommended)
- **Storage**: 10GB free space for development
- **Network**: Stable internet connection for cloud services

## 🏗 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/malkuth-platform.git
cd malkuth-platform
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Configuration
```bash
cp .env.example .env.local
```

Configure your `.env.local` file with the following variables:

```env
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEY_FILE=./path/to/service-account-key.json
GOOGLE_CLOUD_STORAGE_BUCKET=your-bucket-name

# Gemini API Configuration (optional)
GEMINI_API_KEY=your-gemini-api-key

# CDN Configuration (optional)
CDN_BASE_URL=https://cdn.yourdomain.com

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Analytics Configuration
ANALYTICS_ENABLED=true
REAL_TIME_UPDATES=true
```

### 4. Google Cloud Setup

#### Create a Google Cloud Project
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable required APIs:
   - Cloud Storage API
   - Cloud CDN API (optional)

#### Configure Service Account
1. Navigate to **IAM & Admin > Service Accounts**
2. Create a new service account
3. Grant **Storage Admin** role
4. Download the JSON key file
5. Place in your project root and update `GOOGLE_CLOUD_KEY_FILE` path

#### Create Storage Bucket
1. Go to **Cloud Storage > Buckets**
2. Create a new bucket with appropriate settings:
   - **Location**: Choose based on your audience
   - **Storage class**: Standard (for active content)
   - **Access control**: Uniform (recommended)

### 5. Development Server
```bash
npm run dev
# or
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📚 Project Structure

```
malkuth-platform/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API routes
│   │   │   ├── analytics/            # Analytics endpoints
│   │   │   ├── content/              # Content management
│   │   │   └── engagement/           # Engagement system
│   │   ├── analytics/                # Analytics dashboard
│   │   ├── content/                  # Content management UI
│   │   ├── engagement/               # Engagement UI
│   │   └── layout.tsx                # Root layout
│   │
│   ├── components/
│   │   ├── analytics/                # Analytics components
│   │   │   ├── admin/                # Admin controls
│   │   │   ├── reports/              # Report generation
│   │   │   └── visualizations/       # Charts and graphs
│   │   ├── content/                  # Content management
│   │   ├── layout/                   # Layout components
│   │   └── ui/                       # Base UI components
│   │
│   ├── services/                     # Business logic services
│   │   ├── BotPersonaService.ts      # Bot management
│   │   ├── EngagementOrchestrator.ts # Campaign orchestration
│   │   ├── AnalyticsService.ts       # Analytics processing
│   │   └── ContentPerformanceTracker.ts
│   │
│   ├── lib/                          # Utility libraries
│   │   ├── utils.ts                  # General utilities
│   │   ├── design-tokens.ts          # Design system
│   │   └── content-utils.ts          # Content helpers
│   │
│   ├── types/                        # TypeScript definitions
│   │   └── index.ts                  # Type definitions
│   │
│   └── styles/                       # Global styles
│       └── globals.css
│
├── docs/                             # Documentation
├── public/                           # Static assets
├── .storybook/                       # Storybook configuration
└── package.json                      # Project configuration
```

## 🔧 Configuration

### Environment Variables

#### Required Variables
- `GOOGLE_CLOUD_PROJECT_ID`: Your GCP project ID
- `GOOGLE_CLOUD_KEY_FILE`: Path to service account JSON
- `GOOGLE_CLOUD_STORAGE_BUCKET`: Storage bucket name

#### Optional Variables
- `GEMINI_API_KEY`: For AI content analysis
- `CDN_BASE_URL`: CDN endpoint for faster content delivery
- `ANALYTICS_ENABLED`: Enable/disable analytics (default: true)
- `REAL_TIME_UPDATES`: Enable real-time dashboard updates

### Application Settings

You can customize various aspects of the platform:

```typescript
// src/lib/config.ts
export const config = {
  content: {
    maxFileSize: '100MB',
    supportedFormats: ['mp4', 'mov', 'mp3', 'wav', 'md', 'txt'],
    processOnUpload: true
  },
  bots: {
    maxConcurrent: 1000,
    defaultPersonalities: ['casual', 'professional', 'enthusiastic'],
    engagementRates: { low: 0.1, medium: 0.3, high: 0.6 }
  },
  campaigns: {
    maxConcurrent: 10,
    phaseDefaults: {
      discovery: { durationDays: 7, engagementPercentage: 15 },
      viralGrowth: { durationDays: 37, engagementPercentage: 60 }
    }
  }
};
```

## 📖 Usage Guide

### Content Management

#### Uploading Content
1. Navigate to **Content → Upload**
2. Select content type (Video, Writing, Music)
3. Drag & drop or select files
4. Fill in metadata:
   - Title and description
   - Tags for categorization
   - Author information
5. Monitor upload progress and processing status

#### Managing Content
- **Browse**: View all content with filtering options
- **Search**: Find content by title, description, or tags
- **Bulk Actions**: Select multiple items for batch operations
- **Analytics**: View performance metrics for each piece

### Bot Persona System

#### Creating Bot Personas
```typescript
// Example: Creating a tech-focused bot
const techBot = await botPersonaService.createBot({
  name: 'Alex Tech',
  personality: 'analytical and tech-savvy',
  interests: ['technology', 'science', 'innovation'],
  engagementStyle: 'analytical',
  demographics: {
    ageRange: [25, 35],
    location: 'San Francisco, CA',
    timezone: 'America/Los_Angeles'
  }
});
```

#### Bot Management
- **Dashboard**: Monitor all active bots
- **Performance**: Track engagement quality and authenticity scores
- **Behavior Patterns**: Analyze activity hours and content preferences
- **Bulk Creation**: Generate multiple bots with different characteristics

### Engagement Campaigns

#### Creating Campaigns
1. Select target content
2. Configure campaign parameters:
   - **Target Metrics**: Views, likes, comments, shares
   - **Phase Configuration**: Duration and engagement levels
   - **Bot Selection**: Choose appropriate personas
3. Review and start campaign

#### Campaign Phases
- **Discovery (7 days)**: Initial organic discovery simulation
- **Viral Growth (37 days)**: Peak engagement and sharing
- **Sustained Interest (75 days)**: Continued engagement
- **Archive (365 days)**: Long-tail engagement

#### Monitoring & Control
- **Real-time Dashboard**: Live campaign metrics
- **Phase Tracking**: Monitor progression through campaign phases
- **Emergency Controls**: Instant stop/pause capabilities
- **Performance Analysis**: Detailed analytics and recommendations

### Analytics Dashboard

#### Key Metrics
- **Content Performance**: Views, engagement rates, virality scores
- **Bot Analytics**: Activity patterns, authenticity scores, performance
- **System Health**: API usage, storage metrics, error rates
- **Engagement Patterns**: Time-based activity analysis

#### Reports & Exports
- **Automated Reports**: Daily, weekly, monthly summaries
- **Custom Reports**: Specific date ranges and metrics
- **Export Formats**: CSV, JSON, PDF with charts
- **Real-time Alerts**: Configurable thresholds and notifications

## 🔌 API Reference

### Content API

#### Upload Content
```http
POST /api/content/upload
Content-Type: multipart/form-data

file: File
contentType: 'video' | 'writing' | 'music'
title: string
description?: string
tags?: string
author: string
```

#### List Content
```http
GET /api/content?type=video&page=1&limit=10&search=query&author=user&tags=tech,ai
```

#### Get Content Details
```http
GET /api/content/[id]
```

### Analytics API

#### Get Overview Metrics
```http
GET /api/analytics/overview?period=7d
```

#### Bot Performance
```http
GET /api/analytics/bots?botId=bot_123&metrics=all
```

#### Export Data
```http
POST /api/analytics/export
Content-Type: application/json

{
  "format": "csv",
  "dateRange": { "start": "2024-01-01", "end": "2024-01-31" },
  "metrics": ["views", "likes", "comments"],
  "includeCharts": true
}
```

### Engagement API

#### Create Campaign
```http
POST /api/engagement
Content-Type: application/json

{
  "contentId": "content_123",
  "targetMetrics": { "views": 10000, "likes": 1000 },
  "parameters": { "phases": {...} }
}
```

#### Control Campaign
```http
POST /api/engagement/control
Content-Type: application/json

{
  "campaignId": "campaign_123",
  "action": "pause",
  "reason": "Manual intervention required"
}
```

## 🚀 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking

# Storybook
npm run storybook           # Start Storybook development server
npm run build-storybook     # Build Storybook for production

# Testing (when implemented)
npm run test         # Run test suite
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### Adding New Features

#### Content Types
1. Extend `ContentType` in `src/types/index.ts`
2. Create processing logic in `src/services/processing.ts`
3. Add upload component in `src/components/content/`
4. Add viewer component for the new type
5. Update content dashboard

#### Bot Behaviors
1. Extend `EngagementStyle` type
2. Update `BotPersonaService` with new patterns
3. Add behavior templates
4. Update analytics tracking

#### Analytics Metrics
1. Define new metric types in `src/types/index.ts`
2. Add calculation logic in `MetricsCalculator.ts`
3. Create visualization components
4. Update dashboard configuration

### Code Style & Standards

- **TypeScript**: Strict mode enabled with comprehensive type safety
- **ESLint**: Enforced code quality rules
- **Prettier**: Consistent code formatting
- **Component Structure**: Functional components with hooks
- **Service Layer**: Business logic separated from UI components

## 🏗 Production Deployment

### Build & Deploy

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Environment Configuration

Ensure all production environment variables are set:

```env
# Production Google Cloud
GOOGLE_CLOUD_PROJECT_ID=prod-project-id
GOOGLE_CLOUD_KEY_FILE=/app/keys/service-account.json
GOOGLE_CLOUD_STORAGE_BUCKET=prod-malkuth-storage

# Production URLs
NEXT_PUBLIC_APP_URL=https://malkuth.yourdomain.com
CDN_BASE_URL=https://cdn.yourdomain.com

# Security
NODE_ENV=production
ANALYTICS_ENABLED=true
```

### Database Integration

The platform is designed to integrate with various databases:

#### PostgreSQL with Prisma
```bash
npm install prisma @prisma/client
npx prisma init
```

#### MongoDB with Mongoose
```bash
npm install mongoose
```

#### Supabase
```bash
npm install @supabase/supabase-js
```

### Performance Optimization

- **CDN Setup**: Configure Google Cloud CDN for static assets
- **Caching Strategy**: Implement Redis for session and API caching
- **Background Processing**: Use job queues for heavy operations
- **Monitoring**: Set up application performance monitoring

### Security Considerations

- **File Validation**: Strict file type and size validation
- **Rate Limiting**: API endpoint protection
- **Authentication**: Implement user authentication system
- **Data Privacy**: GDPR/CCPA compliance measures
- **Audit Logging**: Track all user and system actions

## 📊 Cost Management

### Free Tier Considerations

- **Google Cloud Storage**: 5GB free monthly
- **Cloud Functions**: 2M invocations free monthly
- **Gemini API**: Usage-based pricing with free tier

### Optimization Strategies

- **Storage Lifecycle**: Automatic archiving of old content
- **Compression**: Optimize media files before storage
- **Caching**: Reduce API calls through intelligent caching
- **Monitoring**: Track usage to stay within free tiers

### Scaling Recommendations

- **Horizontal Scaling**: Use Cloud Run for auto-scaling
- **Database Optimization**: Index optimization and query tuning
- **Content Delivery**: Global CDN distribution
- **Load Balancing**: Distribute traffic across regions

## 📚 Additional Resources

- [Technical Documentation](./docs/technical/)
- [API Documentation](./docs/api/)
- [User Guides](./docs/user-guides/)
- [Developer Documentation](./docs/development/)
- [Security Guidelines](./docs/security/)

## 🤝 Contributing

We welcome contributions to Malkuth Platform! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code of Conduct
Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) before contributing.

## 📄 License

This project is proprietary and confidential. All rights reserved.

---

**Malkuth Platform** - Foundation of Digital Reality

For support, please contact: [support@malkuth-platform.com](mailto:support@malkuth-platform.com)