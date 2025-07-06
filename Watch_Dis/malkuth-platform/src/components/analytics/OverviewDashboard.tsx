'use client';

import React, { useState, useEffect } from 'react';
import { 
  AnalyticsMetric, 
  SystemMetrics, 
  BotMetrics, 
  ContentMetrics,
  ActivityFeedItem 
} from '@/types';
import { analyticsService } from '@/services/AnalyticsService';
import { metricsCalculator } from '@/services/MetricsCalculator';

interface OverviewDashboardProps {
  className?: string;
}

const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ className = '' }) => {
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [botMetrics, setBotMetrics] = useState<BotMetrics[]>([]);
  const [contentMetrics, setContentMetrics] = useState<ContentMetrics[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        overviewMetrics,
        systemData,
        botData,
        contentData,
        activityData
      ] = await Promise.all([
        analyticsService.getOverviewMetrics(),
        analyticsService.getSystemMetrics(),
        analyticsService.getBotMetrics({ includeInactive: false }),
        analyticsService.getContentMetrics({ limit: 10 }),
        analyticsService.getActivityFeed(10)
      ]);

      setMetrics(overviewMetrics);
      setSystemMetrics(systemData);
      setBotMetrics(botData);
      setContentMetrics(contentData);
      setActivityFeed(activityData);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-400';
      case 'degraded': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase': return '↗';
      case 'decrease': return '↘';
      default: return '→';
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'increase': return 'text-green-400';
      case 'decrease': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className={`bg-black text-white p-8 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-64 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded p-6">
                <div className="h-4 bg-gray-800 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-800 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-800 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-black text-white p-8 ${className}`}>
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠ Error Loading Dashboard</div>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={loadDashboardData}
            className="bg-white text-black px-6 py-2 rounded hover:bg-gray-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-black text-white p-8 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Analytics Overview</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <button 
            onClick={loadDashboardData}
            className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => (
          <div key={metric.id} className="bg-gray-900 border border-gray-800 rounded p-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-medium text-gray-400">{metric.name}</h3>
              <span className={`text-lg ${getChangeColor(metric.changeType)}`}>
                {getChangeIcon(metric.changeType)}
              </span>
            </div>
            <div className="text-2xl font-bold mb-1">
              {formatNumber(metric.value)}
            </div>
            <div className={`text-sm ${getChangeColor(metric.changeType)}`}>
              {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>

      {/* System Health */}
      {systemMetrics && (
        <div className="bg-gray-900 border border-gray-800 rounded p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">System Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getSystemHealthColor(systemMetrics.systemHealth)}`}>
                {systemMetrics.systemHealth.toUpperCase()}
              </div>
              <div className="text-sm text-gray-400">System Status</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatNumber(systemMetrics.activeUsers)}</div>
              <div className="text-sm text-gray-400">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatNumber(systemMetrics.apiCalls)}</div>
              <div className="text-sm text-gray-400">API Calls Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{systemMetrics.uptime.toFixed(1)}%</div>
              <div className="text-sm text-gray-400">Uptime</div>
            </div>
          </div>
        </div>
      )}

      {/* Bot Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded p-6">
          <h2 className="text-xl font-bold mb-4">Bot Performance</h2>
          <div className="space-y-4">
            {botMetrics.slice(0, 5).map((bot) => (
              <div key={bot.id} className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{bot.botName}</div>
                  <div className="text-sm text-gray-400">{bot.personality}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{formatNumber(bot.totalInteractions)} interactions</div>
                  <div className="text-sm text-gray-400">
                    {bot.averageResponseTime}ms avg response
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded p-6">
          <h2 className="text-xl font-bold mb-4">Top Content</h2>
          <div className="space-y-4">
            {contentMetrics.slice(0, 5).map((content) => (
              <div key={content.id} className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-sm">
                    {content.contentType.toUpperCase()} #{content.contentId.slice(0, 8)}
                  </div>
                  <div className="text-sm text-gray-400">
                    {metricsCalculator.calculateEngagementRate(content).toFixed(1)}% engagement
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{formatNumber(content.views)} views</div>
                  <div className="text-sm text-gray-400">
                    {formatNumber(content.likes)} likes
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-gray-900 border border-gray-800 rounded p-6">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {activityFeed.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  item.severity === 'error' ? 'bg-red-400' :
                  item.severity === 'warning' ? 'bg-yellow-400' :
                  'bg-green-400'
                }`}></div>
                <div>
                  <div className="font-medium text-sm">{item.title}</div>
                  <div className="text-xs text-gray-400">{item.description}</div>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                {formatTime(item.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OverviewDashboard;