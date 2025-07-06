import { 
  AnalyticsMetric, 
  ContentMetrics, 
  BotMetrics, 
  SystemMetrics, 
  EngagementPattern, 
  AnalyticsReport,
  ActivityFeedItem,
  ApiResponse 
} from '@/types';

export class AnalyticsService {
  private baseUrl = '/api/analytics';

  /**
   * Fetch overview metrics for the dashboard
   */
  async getOverviewMetrics(): Promise<AnalyticsMetric[]> {
    try {
      const response = await fetch(`${this.baseUrl}/overview`);
      const data: ApiResponse<AnalyticsMetric[]> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching overview metrics:', error);
      return [];
    }
  }

  /**
   * Fetch content performance metrics
   */
  async getContentMetrics(filters?: {
    dateRange?: { start: Date; end: Date };
    contentType?: string;
    limit?: number;
  }): Promise<ContentMetrics[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.dateRange) {
        params.append('startDate', filters.dateRange.start.toISOString());
        params.append('endDate', filters.dateRange.end.toISOString());
      }
      if (filters?.contentType) params.append('contentType', filters.contentType);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`${this.baseUrl}/content?${params}`);
      const data: ApiResponse<ContentMetrics[]> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching content metrics:', error);
      return [];
    }
  }

  /**
   * Fetch bot activity metrics
   */
  async getBotMetrics(filters?: {
    dateRange?: { start: Date; end: Date };
    botId?: string;
    includeInactive?: boolean;
  }): Promise<BotMetrics[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.dateRange) {
        params.append('startDate', filters.dateRange.start.toISOString());
        params.append('endDate', filters.dateRange.end.toISOString());
      }
      if (filters?.botId) params.append('botId', filters.botId);
      if (filters?.includeInactive) params.append('includeInactive', 'true');

      const response = await fetch(`${this.baseUrl}/bots?${params}`);
      const data: ApiResponse<BotMetrics[]> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching bot metrics:', error);
      return [];
    }
  }

  /**
   * Fetch system health metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const response = await fetch(`${this.baseUrl}/system`);
      const data: ApiResponse<SystemMetrics> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      return {
        id: 'system-default',
        createdAt: new Date(),
        updatedAt: new Date(),
        apiCalls: 0,
        apiErrors: 0,
        geminiApiUsage: 0,
        storageUsage: 0,
        activeUsers: 0,
        systemHealth: 'critical',
        uptime: 0
      };
    }
  }

  /**
   * Fetch engagement patterns for heatmap visualization
   */
  async getEngagementPatterns(dateRange?: { start: Date; end: Date }): Promise<EngagementPattern[]> {
    try {
      const params = new URLSearchParams();
      if (dateRange) {
        params.append('startDate', dateRange.start.toISOString());
        params.append('endDate', dateRange.end.toISOString());
      }

      const response = await fetch(`${this.baseUrl}/engagement-patterns?${params}`);
      const data: ApiResponse<EngagementPattern[]> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching engagement patterns:', error);
      return [];
    }
  }

  /**
   * Fetch real-time activity feed
   */
  async getActivityFeed(limit: number = 50): Promise<ActivityFeedItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/activity-feed?limit=${limit}`);
      const data: ApiResponse<ActivityFeedItem[]> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      return [];
    }
  }

  /**
   * Generate analytics report
   */
  async generateReport(
    type: 'daily' | 'weekly' | 'monthly' | 'custom',
    dateRange?: { start: Date; end: Date }
  ): Promise<AnalyticsReport> {
    try {
      const payload = {
        type,
        dateRange: dateRange || {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date()
        }
      };

      const response = await fetch(`${this.baseUrl}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data: ApiResponse<AnalyticsReport> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  /**
   * Export analytics data
   */
  async exportData(options: {
    format: 'csv' | 'json' | 'pdf';
    dateRange: { start: Date; end: Date };
    metrics: string[];
    includeCharts?: boolean;
  }): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options)
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  /**
   * Get top performing content
   */
  async getTopContent(limit: number = 10): Promise<ContentMetrics[]> {
    try {
      const response = await fetch(`${this.baseUrl}/top-content?limit=${limit}`);
      const data: ApiResponse<ContentMetrics[]> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching top content:', error);
      return [];
    }
  }

  /**
   * Get trending hashtags/topics
   */
  async getTrendingTopics(limit: number = 20): Promise<{ topic: string; count: number; growth: number }[]> {
    try {
      const response = await fetch(`${this.baseUrl}/trending-topics?limit=${limit}`);
      const data: ApiResponse<{ topic: string; count: number; growth: number }[]> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      return [];
    }
  }

  /**
   * Get cost analysis
   */
  async getCostAnalysis(period: 'daily' | 'weekly' | 'monthly' = 'monthly'): Promise<{
    totalCost: number;
    geminiApiCost: number;
    storageCost: number;
    computeCost: number;
    costTrend: number;
    breakdown: { category: string; cost: number; percentage: number }[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/cost-analysis?period=${period}`);
      const data: ApiResponse<any> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching cost analysis:', error);
      return {
        totalCost: 0,
        geminiApiCost: 0,
        storageCost: 0,
        computeCost: 0,
        costTrend: 0,
        breakdown: []
      };
    }
  }

  /**
   * Subscribe to real-time updates
   */
  subscribeToUpdates(callback: (data: ActivityFeedItem) => void): () => void {
    // In a real implementation, this would use WebSocket or Server-Sent Events
    const interval = setInterval(async () => {
      try {
        const feed = await this.getActivityFeed(1);
        if (feed.length > 0) {
          callback(feed[0]);
        }
      } catch (error) {
        console.error('Error in real-time subscription:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }
}

export const analyticsService = new AnalyticsService();