'use client';

import React, { useState, useEffect } from 'react';
import { ContentMetrics, ContentPerformanceAnalysis } from '@/types';
import { analyticsService } from '@/services/AnalyticsService';
import { contentPerformanceTracker } from '@/services/ContentPerformanceTracker';
import { metricsCalculator } from '@/services/MetricsCalculator';

interface ContentAnalyticsProps {
  className?: string;
}

const ContentAnalytics: React.FC<ContentAnalyticsProps> = ({ className = '' }) => {
  const [contentMetrics, setContentMetrics] = useState<ContentMetrics[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentMetrics | null>(null);
  const [contentAnalysis, setContentAnalysis] = useState<ContentPerformanceAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  });
  const [contentType, setContentType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'views' | 'likes' | 'comments' | 'shares' | 'engagement'>('views');

  useEffect(() => {
    loadContentMetrics();
  }, [dateRange, contentType]);

  const loadContentMetrics = async () => {
    try {
      setLoading(true);
      const filters = {
        dateRange,
        ...(contentType !== 'all' && { contentType }),
        limit: 50
      };
      
      const data = await analyticsService.getContentMetrics(filters);
      setContentMetrics(data);
    } catch (error) {
      console.error('Error loading content metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeContent = async (content: ContentMetrics) => {
    try {
      setAnalysisLoading(true);
      setSelectedContent(content);
      
      // Get historical data for this content
      const historicalData = contentMetrics.filter(c => c.contentId === content.contentId);
      
      const analysis = contentPerformanceTracker.analyzeContentPerformance(
        content,
        historicalData
      );
      
      setContentAnalysis(analysis);
    } catch (error) {
      console.error('Error analyzing content:', error);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const getSortedContent = () => {
    return [...contentMetrics].sort((a, b) => {
      switch (sortBy) {
        case 'views':
          return b.views - a.views;
        case 'likes':
          return b.likes - a.likes;
        case 'comments':
          return b.comments - a.comments;
        case 'shares':
          return b.shares - a.shares;
        case 'engagement':
          return metricsCalculator.calculateEngagementRate(b) - metricsCalculator.calculateEngagementRate(a);
        default:
          return 0;
      }
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getPerformanceBar = (score: number) => {
    const percentage = Math.min(100, Math.max(0, score));
    const color = score >= 80 ? 'bg-green-400' : score >= 60 ? 'bg-yellow-400' : score >= 40 ? 'bg-orange-400' : 'bg-red-400';
    
    return (
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };

  return (
    <div className={`bg-black text-white p-8 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Content Analytics</h1>
        <div className="flex items-center space-x-4">
          <select 
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-gray-500 focus:outline-none"
          >
            <option value="all">All Content</option>
            <option value="post">Posts</option>
            <option value="comment">Comments</option>
            <option value="reply">Replies</option>
          </select>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-gray-500 focus:outline-none"
          >
            <option value="views">Sort by Views</option>
            <option value="likes">Sort by Likes</option>
            <option value="comments">Sort by Comments</option>
            <option value="shares">Sort by Shares</option>
            <option value="engagement">Sort by Engagement</option>
          </select>
        </div>
      </div>

      {/* Content List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Content Table */}
        <div className="bg-gray-900 border border-gray-800 rounded">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-bold">Content Performance</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-gray-600 border-t-white rounded-full mx-auto"></div>
                <p className="text-gray-400 mt-2">Loading content...</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="text-left p-4 text-sm font-medium">Content</th>
                    <th className="text-left p-4 text-sm font-medium">Views</th>
                    <th className="text-left p-4 text-sm font-medium">Engagement</th>
                    <th className="text-left p-4 text-sm font-medium">Authenticity</th>
                    <th className="text-left p-4 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedContent().map((content) => (
                    <tr 
                      key={content.id} 
                      className={`border-b border-gray-800 hover:bg-gray-800 cursor-pointer ${
                        selectedContent?.id === content.id ? 'bg-gray-800' : ''
                      }`}
                      onClick={() => analyzeContent(content)}
                    >
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-sm">
                            {content.contentType.toUpperCase()} #{content.contentId.slice(0, 8)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(content.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{formatNumber(content.views)}</div>
                        <div className="text-xs text-gray-400">
                          {formatNumber(content.likes)} likes
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {metricsCalculator.calculateEngagementRate(content).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatNumber(content.comments)} comments
                        </div>
                      </td>
                      <td className="p-4">
                        <div className={`text-sm ${getPerformanceColor(content.authenticityScore)}`}>
                          {content.authenticityScore.toFixed(0)}%
                        </div>
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            analyzeContent(content);
                          }}
                          className="text-xs bg-white text-black px-3 py-1 rounded hover:bg-gray-200 transition-colors"
                        >
                          Analyze
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Content Analysis */}
        <div className="bg-gray-900 border border-gray-800 rounded">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-bold">Content Analysis</h2>
          </div>
          <div className="p-6">
            {analysisLoading ? (
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-gray-600 border-t-white rounded-full mx-auto"></div>
                <p className="text-gray-400 mt-2">Analyzing content...</p>
              </div>
            ) : contentAnalysis ? (
              <div className="space-y-6">
                {/* Performance Metrics */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Reach</span>
                        <span className="text-sm">{contentAnalysis.performanceMetrics.reach.toFixed(0)}/100</span>
                      </div>
                      {getPerformanceBar(contentAnalysis.performanceMetrics.reach)}
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Engagement</span>
                        <span className="text-sm">{contentAnalysis.performanceMetrics.engagement.toFixed(0)}/100</span>
                      </div>
                      {getPerformanceBar(contentAnalysis.performanceMetrics.engagement)}
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Virality</span>
                        <span className="text-sm">{contentAnalysis.performanceMetrics.virality.toFixed(0)}/100</span>
                      </div>
                      {getPerformanceBar(contentAnalysis.performanceMetrics.virality)}
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Authenticity</span>
                        <span className="text-sm">{contentAnalysis.performanceMetrics.authenticity.toFixed(0)}/100</span>
                      </div>
                      {getPerformanceBar(contentAnalysis.performanceMetrics.authenticity)}
                    </div>
                  </div>
                </div>

                {/* Audience Insights */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Audience Insights</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Demographics</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(contentAnalysis.audienceInsights.demographics).map(([age, percentage]) => (
                          <div key={age} className="flex justify-between">
                            <span className="text-gray-400">{age.replace('_', '-')}</span>
                            <span>{percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Preferences</h4>
                      <div className="flex flex-wrap gap-2">
                        {contentAnalysis.audienceInsights.preferences.map((pref) => (
                          <span 
                            key={pref}
                            className="bg-gray-800 text-xs px-2 py-1 rounded"
                          >
                            {pref.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optimization Suggestions */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Optimization</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Best Post Times</h4>
                      <div className="flex flex-wrap gap-2">
                        {contentAnalysis.optimization.bestPostTimes.map((time) => (
                          <span 
                            key={time}
                            className="bg-gray-800 text-xs px-2 py-1 rounded"
                          >
                            {time}:00
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Suggested Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {contentAnalysis.optimization.suggestedTags.map((tag) => (
                          <span 
                            key={tag}
                            className="bg-gray-800 text-xs px-2 py-1 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                      <ul className="space-y-1 text-sm text-gray-400">
                        {contentAnalysis.optimization.contentRecommendations.map((rec, index) => (
                          <li key={index}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <p>Select content to view detailed analysis</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentAnalytics;