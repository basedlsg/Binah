// Core application types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

// Configuration types
export interface AppConfig {
  apiUrl: string;
  geminiApiKey: string;
  googleCloudProjectId: string;
}

// Component prop types
export interface ComponentProps {
  children?: React.ReactNode;
  className?: string;
}

// Theme types
export type Theme = 'dark' | 'light';

// Common utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredKeys<T> = {
  [K in keyof T]-?: Record<string, never> extends Pick<T, K> ? never : K;
}[keyof T];

// Content Management Types
export type ContentType = 'video' | 'writing' | 'music';

export interface BaseContent {
  id: string;
  title: string;
  description?: string;
  type: ContentType;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  author: string;
  isPublished: boolean;
}

export interface VideoContent extends BaseContent {
  type: 'video';
  duration: number;
  resolution: string;
  codec: string;
  bitrate: number;
  thumbnailUrl: string;
  processedFormats: {
    format: string;
    url: string;
    resolution: string;
    bitrate: number;
  }[];
}

export interface WritingContent extends BaseContent {
  type: 'writing';
  content: string;
  wordCount: number;
  readingTime: number;
  format: 'markdown' | 'html';
  excerpt?: string;
}

export interface MusicContent extends BaseContent {
  type: 'music';
  duration: number;
  genre?: string;
  bpm?: number;
  album?: string;
  artist: string;
  trackNumber?: number;
  waveformData?: number[];
  metadata: {
    title: string;
    artist: string;
    album?: string;
    year?: number;
    genre?: string;
    duration: number;
    bitrate: number;
    sampleRate: number;
  };
}

export type Content = VideoContent | WritingContent | MusicContent;

export interface ContentFilter {
  type?: ContentType;
  tags?: string[];
  author?: string;
  isPublished?: boolean;
  search?: string;
}

export interface ContentUploadProgress {
  filename: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface PlaylistItem {
  id: string;
  contentId: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
  thumbnailUrl?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  items: PlaylistItem[];
  totalDuration: number;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics types
export interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  timestamp: Date;
}

export interface ContentMetrics extends BaseEntity {
  contentId: string;
  contentType: 'post' | 'comment' | 'reply';
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  authenticityScore: number;
  performanceScore: number;
}

export interface BotMetrics extends BaseEntity {
  botId: string;
  botName: string;
  personality: string;
  activeSessions: number;
  totalInteractions: number;
  averageResponseTime: number;
  engagementQuality: number;
  errorRate: number;
  isActive: boolean;
}

export interface SystemMetrics extends BaseEntity {
  apiCalls: number;
  apiErrors: number;
  geminiApiUsage: number;
  storageUsage: number;
  activeUsers: number;
  systemHealth: 'healthy' | 'degraded' | 'critical';
  uptime: number;
}

export interface EngagementPattern {
  timeSlot: string;
  hour: number;
  day: number;
  interactions: number;
  authenticity: number;
  botActivity: number;
  contentCreation: number;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'above' | 'below' | 'equals';
  threshold: number;
  isActive: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  lastTriggered?: Date;
}

export interface AnalyticsReport {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  dateRange: {
    start: Date;
    end: Date;
  };
  metrics: AnalyticsMetric[];
  insights: string[];
  recommendations: string[];
  generatedAt: Date;
}

export interface DashboardConfig {
  userId: string;
  layout: 'grid' | 'list';
  widgets: string[];
  refreshInterval: number;
  theme: 'dark' | 'light';
  alertsEnabled: boolean;
  emailNotifications: boolean;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
  }[];
}

export interface HeatmapData {
  x: number;
  y: number;
  value: number;
  label?: string;
}

export interface ActivityFeedItem {
  id: string;
  type: 'bot_activity' | 'content_creation' | 'engagement' | 'system_event';
  title: string;
  description: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error';
  metadata?: Record<string, any>;
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeCharts: boolean;
  includeRawData: boolean;
  metrics: string[];
}

export interface BotBehaviorAnalysis {
  botId: string;
  patterns: {
    activityHours: number[];
    interactionTypes: Record<string, number>;
    responsePatterns: string[];
    engagementTrends: number[];
  };
  anomalies: {
    timestamp: Date;
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }[];
  recommendations: string[];
}

export interface ContentPerformanceAnalysis {
  contentId: string;
  performanceMetrics: {
    reach: number;
    engagement: number;
    virality: number;
    authenticity: number;
  };
  audienceInsights: {
    demographics: Record<string, number>;
    preferences: string[];
    engagementTimes: number[];
  };
  optimization: {
    suggestedTags: string[];
    bestPostTimes: number[];
    contentRecommendations: string[];
  };
}

// Bot and Content types
export interface BotPersona {
  id: string;
  name: string;
  personality: string;
  interests: string[];
  engagementStyle: EngagementStyle;
  demographics: {
    age: number;
    location: string;
    timezone: string;
  };
  behaviorPatterns: {
    activeHours: number[];
    engagementFrequency: 'low' | 'medium' | 'high';
    contentPreferences: string[];
  };
  createdAt: Date;
  isActive: boolean;
}

export interface Content {
  id: string;
  title: string;
  description: string;
  url: string;
  tags: string[];
  category: string;
  createdAt: Date;
  authorId: string;
  metadata: {
    duration?: number;
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
}

export interface Comment {
  id: string;
  contentId: string;
  authorId: string;
  text: string;
  parentId?: string;
  createdAt: Date;
  isBot: boolean;
  likes: number;
  replies: Comment[];
}

export interface Engagement {
  id: string;
  contentId: string;
  botId: string;
  type: EngagementType;
  value?: string;
  scheduledAt: Date;
  executedAt?: Date;
  status: EngagementStatus;
  phase: EngagementPhase;
  metadata: EngagementMetadata;
}

export interface EngagementCampaign {
  id: string;
  contentId: string;
  targetMetrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  parameters: EngagementParameters;
  status: CampaignStatus;
  createdAt: Date;
  startDate: Date;
  endDate?: Date;
  analytics: CampaignAnalytics;
}

// Engagement types
export type EngagementType = 'view' | 'like' | 'comment' | 'share' | 'follow';
export type EngagementStatus = 'scheduled' | 'executing' | 'completed' | 'failed' | 'cancelled';
export type EngagementPhase = 'discovery' | 'viral-growth' | 'sustained-interest' | 'archive';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type EngagementStyle = 'casual' | 'professional' | 'enthusiastic' | 'analytical' | 'humorous';

export interface EngagementMetadata {
  priority: number;
  retryCount: number;
  maxRetries: number;
  authenticityScore: number;
  context?: string;
}

export interface EngagementParameters {
  phases: {
    discovery: PhaseConfig;
    viralGrowth: PhaseConfig;
    sustainedInterest: PhaseConfig;
    archive: PhaseConfig;
  };
  rateLimit: {
    maxEngagementsPerHour: number;
    maxEngagementsPerDay: number;
  };
  authenticity: {
    minDelay: number;
    maxDelay: number;
    varianceFactors: string[];
  };
}

export interface PhaseConfig {
  durationDays: number;
  engagementPercentage: number;
  primaryEngagementTypes: EngagementType[];
  timing: {
    peakHours: number[];
    distributionPattern: 'uniform' | 'natural' | 'burst';
  };
}

export interface CampaignAnalytics {
  totalEngagements: number;
  engagementsByType: Record<EngagementType, number>;
  engagementsByPhase: Record<EngagementPhase, number>;
  averageAuthenticityScore: number;
  botsParticipated: number;
  successRate: number;
  realTimeMetrics: {
    currentViews: number;
    currentLikes: number;
    currentComments: number;
    currentShares: number;
  };
}

export interface ViewingPattern {
  duration: number;
  segments: ViewingSegment[];
  dropOffPoints: number[];
  engagementMoments: number[];
}

export interface ViewingSegment {
  startTime: number;
  endTime: number;
  watchPercentage: number;
  engagementLevel: 'low' | 'medium' | 'high';
}

export interface CommentThread {
  id: string;
  contentId: string;
  rootCommentId: string;
  participants: string[];
  depth: number;
  conversationFlow: ConversationNode[];
  isActive: boolean;
  createdAt: Date;
}

export interface ConversationNode {
  commentId: string;
  authorId: string;
  text: string;
  timestamp: Date;
  responses: ConversationNode[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface EngagementQueue {
  id: string;
  priority: number;
  scheduledFor: Date;
  engagement: Engagement;
  attempts: number;
  lastAttempt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface BotInteractionPattern {
  discoveryAlgorithm: 'trending' | 'recommended' | 'hashtag' | 'user-follow';
  temporalPattern: 'morning' | 'afternoon' | 'evening' | 'night' | 'random';
  engagementDepth: 'shallow' | 'moderate' | 'deep';
  relationshipLevel: 'stranger' | 'follower' | 'friend' | 'superfan';
}

export interface AdminControl {
  campaignId: string;
  action: 'start' | 'pause' | 'resume' | 'stop' | 'emergency-stop';
  parameters?: Partial<EngagementParameters>;
  reason?: string;
  executedBy: string;
  executedAt: Date;
}