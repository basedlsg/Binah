'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ActivityFeedItem, SystemMetrics, BotMetrics } from '@/types';
import { analyticsService } from '@/services/AnalyticsService';

interface RealTimeStatsProps {
  className?: string;
}

const RealTimeStats: React.FC<RealTimeStatsProps> = ({ className = '' }) => {
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [activeBots, setActiveBots] = useState<BotMetrics[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Real-time counters
  const [liveCounters, setLiveCounters] = useState({
    totalInteractions: 0,
    activeUsers: 0,
    contentCreated: 0,
    apiCalls: 0
  });

  useEffect(() => {
    loadInitialData();
    startRealTimeUpdates();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const [activityData, systemData, botsData] = await Promise.all([
        analyticsService.getActivityFeed(20),
        analyticsService.getSystemMetrics(),
        analyticsService.getBotMetrics({ includeInactive: false })
      ]);

      setActivityFeed(activityData);
      setSystemMetrics(systemData);
      setActiveBots(botsData);
      
      // Initialize live counters
      setLiveCounters({
        totalInteractions: botsData.reduce((sum, bot) => sum + bot.totalInteractions, 0),
        activeUsers: systemData.activeUsers,
        contentCreated: activityData.filter(item => item.type === 'content_creation').length,
        apiCalls: systemData.apiCalls
      });
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const startRealTimeUpdates = () => {
    setIsConnected(true);
    
    // Subscribe to real-time updates
    const unsubscribe = analyticsService.subscribeToUpdates((newActivity) => {
      setActivityFeed(prev => [newActivity, ...prev.slice(0, 19)]);
      setLastUpdate(new Date());
      
      // Update live counters based on activity type
      setLiveCounters(prev => {
        const updated = { ...prev };
        
        switch (newActivity.type) {
          case 'bot_activity':
            updated.totalInteractions += 1;
            break;
          case 'content_creation':
            updated.contentCreated += 1;
            break;
          case 'system_event':
            updated.apiCalls += 1;
            break;
        }
        
        return updated;
      });
    });
    
    unsubscribeRef.current = unsubscribe;
    
    // Periodic system metrics refresh
    const metricsInterval = setInterval(async () => {
      try {
        const [systemData, botsData] = await Promise.all([
          analyticsService.getSystemMetrics(),
          analyticsService.getBotMetrics({ includeInactive: false })
        ]);
        
        setSystemMetrics(systemData);
        setActiveBots(botsData);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error refreshing metrics:', error);
        setIsConnected(false);
      }
    }, 30000); // Every 30 seconds

    return () => {
      clearInterval(metricsInterval);
      if (unsubscribe) unsubscribe();
    };
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'bot_activity': return '🤖';
      case 'content_creation': return '📝';
      case 'engagement': return '❤️';
      case 'system_event': return '⚙️';
      default: return '📊';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-red-400 bg-red-900/20';
      case 'warning': return 'text-yellow-400 bg-yellow-900/20';
      case 'info': return 'text-blue-400 bg-blue-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getBotStatusColor = (bot: BotMetrics) => {
    if (!bot.isActive) return 'text-gray-400';
    if (bot.errorRate > 0.1) return 'text-red-400';
    if (bot.averageResponseTime > 5000) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-400';
      case 'degraded': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`bg-black text-white p-8 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Real-Time Stats</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="text-sm text-gray-400">
            Last update: {formatTime(lastUpdate)}
          </div>
        </div>
      </div>

      {/* Live Counters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Total Interactions</h3>
            <span className="text-2xl">🔄</span>
          </div>
          <div className="text-2xl font-bold">{formatNumber(liveCounters.totalInteractions)}</div>
          <div className="text-sm text-green-400">Live tracking</div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Active Users</h3>
            <span className="text-2xl">👥</span>
          </div>
          <div className="text-2xl font-bold">{formatNumber(liveCounters.activeUsers)}</div>
          <div className="text-sm text-blue-400">Currently online</div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Content Created</h3>
            <span className="text-2xl">📝</span>
          </div>
          <div className="text-2xl font-bold">{formatNumber(liveCounters.contentCreated)}</div>
          <div className="text-sm text-purple-400">Today</div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">API Calls</h3>
            <span className="text-2xl">⚡</span>
          </div>
          <div className="text-2xl font-bold">{formatNumber(liveCounters.apiCalls)}</div>
          <div className="text-sm text-orange-400">Today</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Activity Feed */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-bold">Live Activity Feed</h2>
            <p className="text-sm text-gray-400">Real-time platform activity</p>
          </div>
          <div className="h-96 overflow-y-auto">
            <div className="p-6 space-y-3">
              {activityFeed.map((item) => (
                <div 
                  key={item.id} 
                  className={`p-3 rounded border-l-4 ${getSeverityColor(item.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className="text-xl">{getActivityIcon(item.type)}</span>
                      <div>
                        <div className="font-medium text-sm">{item.title}</div>
                        <div className="text-xs text-gray-400 mt-1">{item.description}</div>
                        {item.metadata && (
                          <div className="text-xs text-gray-500 mt-1">
                            {Object.entries(item.metadata).map(([key, value]) => (
                              <span key={key} className="mr-2">
                                {key}: {String(value)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatTime(item.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Status & Active Bots */}
        <div className="space-y-8">
          {/* System Status */}
          <div className="bg-gray-900 border border-gray-800 rounded">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold">System Status</h2>
            </div>
            <div className="p-6">
              {systemMetrics ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getSystemHealthColor(systemMetrics.systemHealth)}`}>
                      {systemMetrics.systemHealth.toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-400">System Health</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Uptime</span>
                      <span className="font-medium">{systemMetrics.uptime.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">API Errors</span>
                      <span className={`font-medium ${
                        systemMetrics.apiErrors > 100 ? 'text-red-400' : 
                        systemMetrics.apiErrors > 50 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {systemMetrics.apiErrors}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Storage Usage</span>
                      <span className="font-medium">{formatNumber(systemMetrics.storageUsage)} MB</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Gemini API Usage</span>
                      <span className="font-medium">{formatNumber(systemMetrics.geminiApiUsage)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400">Loading system status...</div>
              )}
            </div>
          </div>

          {/* Active Bots */}
          <div className="bg-gray-900 border border-gray-800 rounded">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold">Active Bots</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {activeBots.slice(0, 5).map((bot) => (
                  <div key={bot.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${getBotStatusColor(bot) === 'text-green-400' ? 'bg-green-400' : 
                                       getBotStatusColor(bot) === 'text-yellow-400' ? 'bg-yellow-400' : 
                                       getBotStatusColor(bot) === 'text-red-400' ? 'bg-red-400' : 'bg-gray-400'}`}>
                      </div>
                      <div>
                        <div className="font-medium text-sm">{bot.botName}</div>
                        <div className="text-xs text-gray-400">{bot.personality}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">{bot.activeSessions}</div>
                      <div className="text-xs text-gray-400">sessions</div>
                    </div>
                  </div>
                ))}
                
                {activeBots.length === 0 && (
                  <div className="text-center text-gray-400">No active bots</div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-900 border border-gray-800 rounded">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-3">
              <button 
                onClick={loadInitialData}
                className="w-full bg-white text-black py-2 rounded hover:bg-gray-200 transition-colors"
              >
                Refresh All Data
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-gray-800 text-white py-2 rounded hover:bg-gray-700 transition-colors"
              >
                Restart Connection
              </button>
              <button 
                onClick={() => setActivityFeed([])}
                className="w-full bg-red-900 text-white py-2 rounded hover:bg-red-800 transition-colors"
              >
                Clear Activity Feed
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeStats;