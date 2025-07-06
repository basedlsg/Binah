'use client';

import React, { useState } from 'react';
import OverviewDashboard from '@/components/analytics/OverviewDashboard';
import ContentAnalytics from '@/components/analytics/ContentAnalytics';
import BotActivityDashboard from '@/components/analytics/BotActivityDashboard';
import EngagementMetrics from '@/components/analytics/EngagementMetrics';
import RealTimeStats from '@/components/analytics/RealTimeStats';
import ReportsManager from '@/components/analytics/reports/ReportsManager';
import AdminControls from '@/components/analytics/admin/AdminControls';

type TabType = 'overview' | 'content' | 'bots' | 'engagement' | 'realtime' | 'reports' | 'admin';

const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'content', label: 'Content', icon: '📝' },
    { id: 'bots', label: 'Bots', icon: '🤖' },
    { id: 'engagement', label: 'Engagement', icon: '❤️' },
    { id: 'realtime', label: 'Real-time', icon: '⚡' },
    { id: 'reports', label: 'Reports', icon: '📋' },
    { id: 'admin', label: 'Admin', icon: '⚙️' }
  ] as const;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewDashboard />;
      case 'content':
        return <ContentAnalytics />;
      case 'bots':
        return <BotActivityDashboard />;
      case 'engagement':
        return <EngagementMetrics />;
      case 'realtime':
        return <RealTimeStats />;
      case 'reports':
        return <ReportsManager />;
      case 'admin':
        return <AdminControls />;
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title */}
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">MALKUTH Analytics</h1>
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>All Systems Operational</span>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-black'
                      : 'hover:bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Tab Content */}
      <main className="container mx-auto">
        {renderTabContent()}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900/30 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              <p>MALKUTH Platform Analytics Dashboard</p>
              <p className="mt-1">Real-time monitoring and insights for digital reality foundation</p>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Live Data</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Auto-Refresh</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>AI Insights</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AnalyticsPage;