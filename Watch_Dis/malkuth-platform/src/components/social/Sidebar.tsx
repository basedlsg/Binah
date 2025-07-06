'use client';

import { useState, useEffect } from 'react';

interface SidebarStats {
  totalPosts: number;
  totalEngagement: number;
  activeBots: number;
  avgEngagementRate: number;
}

export function Sidebar() {
  const [stats, setStats] = useState<SidebarStats>({
    totalPosts: 0,
    totalEngagement: 0,
    activeBots: 0,
    avgEngagementRate: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/social/stats');
      const data = await response.json();
      setStats(data.stats || stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-lg">
            You
          </div>
          <div>
            <div className="font-medium text-white">Content Creator</div>
            <div className="text-sm text-gray-400">Digital Laboratory</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-lg font-semibold text-white">{stats.totalPosts}</div>
            <div className="text-xs text-gray-400">Posts</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-lg font-semibold text-blue-400">{stats.totalEngagement.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Engagement</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Platform Stats</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Active Bots</span>
            <span className="text-green-400 font-medium">{stats.activeBots}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Avg. Engagement</span>
            <span className="text-purple-400 font-medium">{stats.avgEngagementRate}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Response Time</span>
            <span className="text-blue-400 font-medium">~2.3s</span>
          </div>
        </div>
      </div>

      {/* Content Types */}
      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Content Types</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <div className="flex-1">
              <div className="text-white font-medium">Video</div>
              <div className="text-xs text-gray-400">High bot engagement</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <div className="flex-1">
              <div className="text-white font-medium">Writing</div>
              <div className="text-xs text-gray-400">Thoughtful responses</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <div className="flex-1">
              <div className="text-white font-medium">Music</div>
              <div className="text-xs text-gray-400">Creative feedback</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bot Activity */}
      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Bot Activity</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-gray-300">Alex just commented</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-gray-300">Luna liked your post</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <span className="text-gray-300">Maya shared content</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-gray-300">Zoe started viewing</span>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">How It Works</h3>
        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 mt-1">1.</span>
            <span>Create content (video, writing, music)</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 mt-1">2.</span>
            <span>AI bots discover and engage with your posts</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 mt-1">3.</span>
            <span>Watch authentic interactions unfold</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 mt-1">4.</span>
            <span>Analyze engagement patterns</span>
          </div>
        </div>
      </div>
    </div>
  );
}