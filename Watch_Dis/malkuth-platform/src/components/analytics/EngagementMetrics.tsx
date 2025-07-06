'use client';

import React, { useState, useEffect } from 'react';
import { EngagementPattern, AnalyticsMetric, HeatmapData } from '@/types';
import { analyticsService } from '@/services/AnalyticsService';
import { metricsCalculator } from '@/services/MetricsCalculator';

interface EngagementMetricsProps {
  className?: string;
}

const EngagementMetrics: React.FC<EngagementMetricsProps> = ({ className = '' }) => {
  const [engagementPatterns, setEngagementPatterns] = useState<EngagementPattern[]>([]);
  const [heatmapData, setHeatmapData] = useState<number[][]>([]);
  const [trendingTopics, setTrendingTopics] = useState<{ topic: string; count: number; growth: number }[]>([]);
  const [engagementMetrics, setEngagementMetrics] = useState<AnalyticsMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);

  useEffect(() => {
    loadEngagementData();
  }, [selectedTimeRange]);

  const loadEngagementData = async () => {
    try {
      setLoading(true);
      
      const endDate = new Date();
      let startDate = new Date();
      
      switch (selectedTimeRange) {
        case '24h':
          startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      const [patterns, trending, metrics] = await Promise.all([
        analyticsService.getEngagementPatterns({ start: startDate, end: endDate }),
        analyticsService.getTrendingTopics(),
        analyticsService.getOverviewMetrics()
      ]);

      setEngagementPatterns(patterns);
      setTrendingTopics(trending);
      setEngagementMetrics(metrics.filter(m => 
        m.name.toLowerCase().includes('engagement') || 
        m.name.toLowerCase().includes('interaction')
      ));

      // Generate heatmap data
      const heatmap = metricsCalculator.calculateEngagementHeatmap(patterns);
      setHeatmapData(heatmap);
    } catch (error) {
      console.error('Error loading engagement data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHeatmapIntensity = (value: number) => {
    if (!heatmapData.length) return 'bg-gray-800';
    
    const maxValue = Math.max(...heatmapData.flat());
    const intensity = maxValue > 0 ? value / maxValue : 0;
    
    if (intensity === 0) return 'bg-gray-800';
    if (intensity < 0.25) return 'bg-blue-900';
    if (intensity < 0.5) return 'bg-blue-700';
    if (intensity < 0.75) return 'bg-blue-500';
    return 'bg-blue-300';
  };

  const getSelectedCellInfo = () => {
    if (selectedDay === null || selectedHour === null || !heatmapData.length) {
      return null;
    }
    
    const value = heatmapData[selectedHour][selectedDay];
    const pattern = engagementPatterns.find(p => p.hour === selectedHour && p.day === selectedDay);
    
    return {
      day: dayNames[selectedDay],
      hour: selectedHour,
      interactions: value,
      authenticity: pattern?.authenticity || 0,
      botActivity: pattern?.botActivity || 0,
      contentCreation: pattern?.contentCreation || 0
    };
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getTrendIcon = (growth: number) => {
    if (growth > 5) return '🔥';
    if (growth > 0) return '📈';
    if (growth < -5) return '📉';
    return '➡️';
  };

  const getMetricChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'increase': return 'text-green-400';
      case 'decrease': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`bg-black text-white p-8 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Engagement Metrics</h1>
        <div className="flex items-center space-x-4">
          <select 
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-gray-500 focus:outline-none"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button 
            onClick={loadEngagementData}
            className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Engagement Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {engagementMetrics.map((metric) => (
          <div key={metric.id} className="bg-gray-900 border border-gray-800 rounded p-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-medium text-gray-400">{metric.name}</h3>
              <span className={`text-lg ${getMetricChangeColor(metric.changeType)}`}>
                {metric.changeType === 'increase' ? '↗' : metric.changeType === 'decrease' ? '↘' : '→'}
              </span>
            </div>
            <div className="text-2xl font-bold mb-1">
              {formatNumber(metric.value)}
            </div>
            <div className={`text-sm ${getMetricChangeColor(metric.changeType)}`}>
              {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Engagement Heatmap */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-bold mb-2">Engagement Heatmap</h2>
            <p className="text-sm text-gray-400">
              Click on cells to see detailed engagement data for specific times
            </p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-gray-600 border-t-white rounded-full mx-auto"></div>
                <p className="text-gray-400 mt-2">Loading heatmap...</p>
              </div>
            ) : (
              <>
                {/* Heatmap */}
                <div className="mb-4">
                  <div className="grid grid-cols-8 gap-1 mb-2">
                    <div></div>
                    {dayNames.map((day, index) => (
                      <div key={day} className="text-xs text-gray-400 text-center py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  {heatmapData.map((hourData, hour) => (
                    <div key={hour} className="grid grid-cols-8 gap-1 mb-1">
                      <div className="text-xs text-gray-400 text-right py-1 pr-2">
                        {hour}:00
                      </div>
                      {hourData.map((value, day) => (
                        <div
                          key={`${hour}-${day}`}
                          className={`h-6 rounded cursor-pointer border-2 transition-all ${
                            selectedHour === hour && selectedDay === day
                              ? 'border-white'
                              : 'border-transparent'
                          } ${getHeatmapIntensity(value)}`}
                          onClick={() => {
                            setSelectedHour(hour);
                            setSelectedDay(day);
                          }}
                          title={`${dayNames[day]} ${hour}:00 - ${value} interactions`}
                        ></div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Heatmap Legend */}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Less</span>
                  <div className="flex space-x-1">
                    <div className="w-3 h-3 bg-gray-800 rounded"></div>
                    <div className="w-3 h-3 bg-blue-900 rounded"></div>
                    <div className="w-3 h-3 bg-blue-700 rounded"></div>
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <div className="w-3 h-3 bg-blue-300 rounded"></div>
                  </div>
                  <span>More</span>
                </div>

                {/* Selected Cell Info */}
                {getSelectedCellInfo() && (
                  <div className="mt-6 p-4 bg-gray-800 rounded">
                    <h3 className="text-lg font-semibold mb-3">
                      {getSelectedCellInfo()?.day} at {getSelectedCellInfo()?.hour}:00
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Interactions:</span>
                        <span className="ml-2 font-medium">{formatNumber(getSelectedCellInfo()?.interactions || 0)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Authenticity:</span>
                        <span className="ml-2 font-medium">{getSelectedCellInfo()?.authenticity?.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Bot Activity:</span>
                        <span className="ml-2 font-medium">{formatNumber(getSelectedCellInfo()?.botActivity || 0)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Content Created:</span>
                        <span className="ml-2 font-medium">{formatNumber(getSelectedCellInfo()?.contentCreation || 0)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Trending Topics */}
        <div className="bg-gray-900 border border-gray-800 rounded">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-bold">Trending Topics</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-gray-600 border-t-white rounded-full mx-auto"></div>
                <p className="text-gray-400 mt-2">Loading trends...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trendingTopics.map((topic, index) => (
                  <div key={topic.topic} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getTrendIcon(topic.growth)}</span>
                      <div>
                        <div className="font-medium text-sm">#{topic.topic}</div>
                        <div className="text-xs text-gray-400">
                          {formatNumber(topic.count)} mentions
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        topic.growth > 0 ? 'text-green-400' : 
                        topic.growth < 0 ? 'text-red-400' : 
                        'text-gray-400'
                      }`}>
                        {topic.growth > 0 ? '+' : ''}{topic.growth.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400">#{index + 1}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Peak Hours Analysis */}
      <div className="mt-8 bg-gray-900 border border-gray-800 rounded p-6">
        <h2 className="text-xl font-bold mb-4">Peak Engagement Hours</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Daily Peaks</h3>
            <div className="space-y-2">
              {dayNames.map((day, dayIndex) => {
                const dayPatterns = engagementPatterns.filter(p => p.day === dayIndex);
                const peakHour = dayPatterns.reduce((max, pattern) => 
                  pattern.interactions > max.interactions ? pattern : max,
                  { hour: 0, interactions: 0 }
                );
                
                return (
                  <div key={day} className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">{day}</span>
                    <span>{peakHour.hour}:00 ({formatNumber(peakHour.interactions)})</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Hourly Averages</h3>
            <div className="space-y-1">
              {Array.from({ length: 6 }, (_, i) => i * 4).map(hour => {
                const hourPatterns = engagementPatterns.filter(p => p.hour === hour);
                const avgInteractions = hourPatterns.length > 0 
                  ? hourPatterns.reduce((sum, p) => sum + p.interactions, 0) / hourPatterns.length
                  : 0;
                
                return (
                  <div key={hour} className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">{hour}:00</span>
                    <span>{formatNumber(avgInteractions)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Authenticity Scores</h3>
            <div className="space-y-2">
              {dayNames.map((day, dayIndex) => {
                const dayPatterns = engagementPatterns.filter(p => p.day === dayIndex);
                const avgAuthenticity = dayPatterns.length > 0 
                  ? dayPatterns.reduce((sum, p) => sum + p.authenticity, 0) / dayPatterns.length
                  : 0;
                
                return (
                  <div key={day} className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">{day}</span>
                    <span className={avgAuthenticity >= 80 ? 'text-green-400' : 
                                   avgAuthenticity >= 60 ? 'text-yellow-400' : 'text-red-400'}>
                      {avgAuthenticity.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngagementMetrics;