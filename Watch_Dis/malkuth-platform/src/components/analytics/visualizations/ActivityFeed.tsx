'use client';

import React, { useState } from 'react';
import { ActivityFeedItem } from '@/types';

interface ActivityFeedProps {
  items: ActivityFeedItem[];
  className?: string;
  maxHeight?: number;
  showFilters?: boolean;
  autoRefresh?: boolean;
  onItemClick?: (item: ActivityFeedItem) => void;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  items,
  className = '',
  maxHeight = 400,
  showFilters = true,
  autoRefresh = false,
  onItemClick
}) => {
  const [filter, setFilter] = useState<'all' | 'bot_activity' | 'content_creation' | 'engagement' | 'system_event'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'info' | 'warning' | 'error'>('all');

  const filteredItems = items.filter(item => {
    const typeMatch = filter === 'all' || item.type === filter;
    const severityMatch = severityFilter === 'all' || item.severity === severityFilter;
    return typeMatch && severityMatch;
  });

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
      case 'error': return 'border-red-500 bg-red-900/20 text-red-300';
      case 'warning': return 'border-yellow-500 bg-yellow-900/20 text-yellow-300';
      case 'info': return 'border-blue-500 bg-blue-900/20 text-blue-300';
      default: return 'border-gray-500 bg-gray-900/20 text-gray-300';
    }
  };

  const getSeverityDot = (severity: string) => {
    switch (severity) {
      case 'error': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  const getTypeDisplayName = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getFilterCount = (filterType: string, filterValue: string) => {
    if (filterType === 'type') {
      return filterValue === 'all' 
        ? items.length 
        : items.filter(item => item.type === filterValue).length;
    } else {
      return filterValue === 'all' 
        ? items.length 
        : items.filter(item => item.severity === filterValue).length;
    }
  };

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Activity Feed</h2>
          <div className="flex items-center space-x-2">
            {autoRefresh && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-400">Live</span>
              </div>
            )}
            <span className="text-sm text-gray-400">
              {filteredItems.length} of {items.length} items
            </span>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-4">
            {/* Type Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Type:</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="bg-gray-800 text-white text-sm px-3 py-1 rounded border border-gray-700 focus:border-gray-500 focus:outline-none"
              >
                <option value="all">All ({getFilterCount('type', 'all')})</option>
                <option value="bot_activity">Bot Activity ({getFilterCount('type', 'bot_activity')})</option>
                <option value="content_creation">Content ({getFilterCount('type', 'content_creation')})</option>
                <option value="engagement">Engagement ({getFilterCount('type', 'engagement')})</option>
                <option value="system_event">System ({getFilterCount('type', 'system_event')})</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="bg-gray-800 text-white text-sm px-3 py-1 rounded border border-gray-700 focus:border-gray-500 focus:outline-none"
              >
                <option value="all">All ({getFilterCount('severity', 'all')})</option>
                <option value="info">Info ({getFilterCount('severity', 'info')})</option>
                <option value="warning">Warning ({getFilterCount('severity', 'warning')})</option>
                <option value="error">Error ({getFilterCount('severity', 'error')})</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Feed Items */}
      <div 
        className="overflow-y-auto"
        style={{ maxHeight: `${maxHeight}px` }}
      >
        {filteredItems.length > 0 ? (
          <div className="p-6 space-y-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`border-l-4 p-4 rounded-r cursor-pointer hover:bg-gray-800/50 transition-all ${getSeverityColor(item.severity)}`}
                onClick={() => onItemClick && onItemClick(item)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className="text-2xl">{getActivityIcon(item.type)}</div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-white">{item.title}</h3>
                        <div className={`w-2 h-2 rounded-full ${getSeverityDot(item.severity)}`}></div>
                      </div>
                      
                      <p className="text-sm text-gray-300 mb-2">{item.description}</p>
                      
                      {/* Metadata */}
                      {item.metadata && Object.keys(item.metadata).length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {Object.entries(item.metadata).map(([key, value]) => (
                            <span
                              key={key}
                              className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400"
                            >
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Type and Time */}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="bg-gray-800 px-2 py-1 rounded">
                          {getTypeDisplayName(item.type)}
                        </span>
                        <span>{formatTime(item.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-lg font-medium mb-2">No activity found</p>
            <p className="text-sm">
              {filter !== 'all' || severityFilter !== 'all' 
                ? 'Try adjusting your filters to see more items'
                : 'Activity will appear here as it happens'
              }
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredItems.length > 0 && (
        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>Showing {filteredItems.length} items</span>
            {autoRefresh && (
              <span className="flex items-center space-x-1">
                <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                <span>Auto-refreshing</span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;