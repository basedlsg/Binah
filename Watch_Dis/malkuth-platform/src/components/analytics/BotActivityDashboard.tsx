'use client';

import React, { useState, useEffect } from 'react';
import { BotMetrics, BotBehaviorAnalysis, EngagementPattern } from '@/types';
import { analyticsService } from '@/services/AnalyticsService';
import { botBehaviorAnalyzer } from '@/services/BotBehaviorAnalyzer';

interface BotActivityDashboardProps {
  className?: string;
}

const BotActivityDashboard: React.FC<BotActivityDashboardProps> = ({ className = '' }) => {
  const [botMetrics, setBotMetrics] = useState<BotMetrics[]>([]);
  const [selectedBot, setSelectedBot] = useState<BotMetrics | null>(null);
  const [botAnalysis, setBotAnalysis] = useState<BotBehaviorAnalysis | null>(null);
  const [engagementPatterns, setEngagementPatterns] = useState<EngagementPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadBotData();
  }, [filter]);

  const loadBotData = async () => {
    try {
      setLoading(true);
      const [botsData, patternsData] = await Promise.all([
        analyticsService.getBotMetrics({ includeInactive: filter !== 'active' }),
        analyticsService.getEngagementPatterns()
      ]);
      
      let filteredBots = botsData;
      if (filter === 'active') {
        filteredBots = botsData.filter(bot => bot.isActive);
      } else if (filter === 'inactive') {
        filteredBots = botsData.filter(bot => !bot.isActive);
      }
      
      setBotMetrics(filteredBots);
      setEngagementPatterns(patternsData);
    } catch (error) {
      console.error('Error loading bot data:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeBot = async (bot: BotMetrics) => {
    try {
      setAnalysisLoading(true);
      setSelectedBot(bot);
      
      const analysis = botBehaviorAnalyzer.analyzeBotBehavior(bot, engagementPatterns);
      setBotAnalysis(analysis);
    } catch (error) {
      console.error('Error analyzing bot:', error);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatResponseTime = (ms: number) => {
    if (ms >= 1000) return (ms / 1000).toFixed(1) + 's';
    return ms + 'ms';
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getHealthScore = (bot: BotMetrics) => {
    return botBehaviorAnalyzer.calculateBotHealthScore(bot);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIndicator = (isActive: boolean) => {
    return (
      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-gray-600'}`}></div>
    );
  };

  const renderActivityHours = (hours: number[]) => {
    const allHours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="grid grid-cols-12 gap-1">
        {allHours.map((hour) => (
          <div 
            key={hour}
            className={`h-6 rounded text-xs flex items-center justify-center ${
              hours.includes(hour) ? 'bg-green-400 text-black' : 'bg-gray-800 text-gray-400'
            }`}
          >
            {hour}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`bg-black text-white p-8 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Bot Activity Dashboard</h1>
        <div className="flex items-center space-x-4">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-gray-500 focus:outline-none"
          >
            <option value="all">All Bots</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          <button 
            onClick={loadBotData}
            className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Bot Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Total Bots</h3>
          <div className="text-2xl font-bold">{botMetrics.length}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Active Bots</h3>
          <div className="text-2xl font-bold text-green-400">
            {botMetrics.filter(bot => bot.isActive).length}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Total Interactions</h3>
          <div className="text-2xl font-bold">
            {formatNumber(botMetrics.reduce((sum, bot) => sum + bot.totalInteractions, 0))}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Avg Response Time</h3>
          <div className="text-2xl font-bold">
            {formatResponseTime(
              botMetrics.length > 0 
                ? botMetrics.reduce((sum, bot) => sum + bot.averageResponseTime, 0) / botMetrics.length
                : 0
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bot List */}
        <div className="bg-gray-900 border border-gray-800 rounded">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-bold">Bot Performance</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-gray-600 border-t-white rounded-full mx-auto"></div>
                <p className="text-gray-400 mt-2">Loading bots...</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="text-left p-4 text-sm font-medium">Bot</th>
                    <th className="text-left p-4 text-sm font-medium">Status</th>
                    <th className="text-left p-4 text-sm font-medium">Health</th>
                    <th className="text-left p-4 text-sm font-medium">Interactions</th>
                    <th className="text-left p-4 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {botMetrics.map((bot) => (
                    <tr 
                      key={bot.id} 
                      className={`border-b border-gray-800 hover:bg-gray-800 cursor-pointer ${
                        selectedBot?.id === bot.id ? 'bg-gray-800' : ''
                      }`}
                      onClick={() => analyzeBot(bot)}
                    >
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-sm">{bot.botName}</div>
                          <div className="text-xs text-gray-400">{bot.personality}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIndicator(bot.isActive)}
                          <span className="text-sm">
                            {bot.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className={`text-sm font-medium ${getHealthColor(getHealthScore(bot))}`}>
                          {getHealthScore(bot).toFixed(0)}%
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{formatNumber(bot.totalInteractions)}</div>
                        <div className="text-xs text-gray-400">
                          {formatResponseTime(bot.averageResponseTime)} avg
                        </div>
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            analyzeBot(bot);
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

        {/* Bot Analysis */}
        <div className="bg-gray-900 border border-gray-800 rounded">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-bold">Bot Analysis</h2>
          </div>
          <div className="p-6">
            {analysisLoading ? (
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-gray-600 border-t-white rounded-full mx-auto"></div>
                <p className="text-gray-400 mt-2">Analyzing bot behavior...</p>
              </div>
            ) : botAnalysis && selectedBot ? (
              <div className="space-y-6">
                {/* Bot Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">{selectedBot.botName}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Personality:</span>
                      <span className="ml-2">{selectedBot.personality}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Health Score:</span>
                      <span className={`ml-2 font-medium ${getHealthColor(getHealthScore(selectedBot))}`}>
                        {getHealthScore(selectedBot).toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Error Rate:</span>
                      <span className="ml-2">{(selectedBot.errorRate * 100).toFixed(2)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Quality Score:</span>
                      <span className="ml-2">{selectedBot.engagementQuality.toFixed(0)}/100</span>
                    </div>
                  </div>
                </div>

                {/* Activity Hours */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Activity Hours</h3>
                  {renderActivityHours(botAnalysis.patterns.activityHours)}
                  <p className="text-xs text-gray-400 mt-2">Green blocks indicate peak activity hours</p>
                </div>

                {/* Interaction Types */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Interaction Types</h3>
                  <div className="space-y-2">
                    {Object.entries(botAnalysis.patterns.interactionTypes).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                        <span className="text-sm">{formatNumber(count)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Response Patterns */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Response Patterns</h3>
                  <div className="flex flex-wrap gap-2">
                    {botAnalysis.patterns.responsePatterns.map((pattern) => (
                      <span 
                        key={pattern}
                        className="bg-gray-800 text-xs px-2 py-1 rounded"
                      >
                        {pattern.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Anomalies */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Anomalies</h3>
                  {botAnalysis.anomalies.length > 0 ? (
                    <div className="space-y-2">
                      {botAnalysis.anomalies.map((anomaly, index) => (
                        <div key={index} className="bg-gray-800 p-3 rounded">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-medium">{anomaly.type.replace('_', ' ')}</span>
                            <span className={`text-xs ${getSeverityColor(anomaly.severity)}`}>
                              {anomaly.severity.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">{anomaly.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No anomalies detected</p>
                  )}
                </div>

                {/* Recommendations */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
                  <ul className="space-y-1 text-sm text-gray-400">
                    {botAnalysis.recommendations.map((rec, index) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <p>Select a bot to view detailed analysis</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotActivityDashboard;