'use client';

import { useState, useEffect } from 'react';

interface SystemStatus {
  overallStatus: 'healthy' | 'warning' | 'critical' | 'emergency';
  activeCampaigns: number;
  totalBots: number;
  queueSize: number;
  runningJobs: number;
  averageAuthenticityScore: number;
  systemLoad: number;
  lastUpdate: string;
}

interface Campaign {
  id: string;
  contentId: string;
  status: string;
  targetMetrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  analytics: {
    totalEngagements: number;
    averageAuthenticityScore: number;
    successRate: number;
  };
}

export default function EngagementOrchestrationPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSystemData();
    const interval = setInterval(loadSystemData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSystemData = async () => {
    try {
      const [statusResponse, campaignsResponse] = await Promise.all([
        fetch('/api/engagement?type=system_status'),
        fetch('/api/engagement?type=campaigns')
      ]);

      if (!statusResponse.ok || !campaignsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const statusData = await statusResponse.json();
      const campaignsData = await campaignsResponse.json();

      if (statusData.success) {
        setSystemStatus(statusData.data.systemStatus);
      }

      if (campaignsData.success) {
        setCampaigns(campaignsData.data.campaigns);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createDemoCampaign = async () => {
    try {
      const demoContent = {
        id: `content_${Date.now()}`,
        title: 'Demo Content: AI-Powered Social Media Strategy',
        description: 'Learn how AI is revolutionizing social media engagement and content strategy',
        url: 'https://example.com/demo-content',
        tags: ['ai', 'social-media', 'technology', 'marketing'],
        category: 'technology',
        createdAt: new Date().toISOString(),
        authorId: 'demo_author',
        metadata: {
          duration: 180,
          views: 100,
          likes: 10,
          comments: 2,
          shares: 1
        }
      };

      const response = await fetch('/api/engagement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_campaign',
          content: demoContent,
          autoStart: true
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`Campaign created successfully! ID: ${result.data.campaignId}`);
        loadSystemData(); // Refresh data
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      alert(`Error creating campaign: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const controlCampaign = async (campaignId: string, action: string) => {
    try {
      const response = await fetch('/api/engagement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'control_campaign',
          campaignId,
          action,
          reason: `Manual ${action} from dashboard`,
          executedBy: 'demo_user'
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
        loadSystemData(); // Refresh data
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      alert(`Error controlling campaign: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const emergencyStop = async () => {
    if (!confirm('Are you sure you want to execute an emergency stop? This will halt all campaigns immediately.')) {
      return;
    }

    try {
      const response = await fetch('/api/engagement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'control_system',
          action: 'emergency-stop',
          reason: 'Manual emergency stop from dashboard',
          executedBy: 'demo_user'
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
        loadSystemData(); // Refresh data
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      alert(`Error executing emergency stop: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading engagement orchestration system...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold">Error Loading System</h2>
            <p className="text-red-600 mt-2">{error}</p>
            <button
              onClick={loadSystemData}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      case 'emergency': return 'text-red-800 bg-red-100';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Engagement Orchestration Engine
          </h1>
          <p className="text-gray-600 mt-2">
            Manage realistic bot interactions and engagement campaigns
          </p>
        </div>

        {/* System Status */}
        {systemStatus && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">System Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(systemStatus.overallStatus)}`}>
                  {systemStatus.overallStatus.toUpperCase()}
                </div>
                <p className="text-gray-500 text-sm mt-1">Overall Status</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{systemStatus.activeCampaigns}</div>
                <p className="text-gray-500 text-sm">Active Campaigns</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{systemStatus.totalBots}</div>
                <p className="text-gray-500 text-sm">Total Bots</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{systemStatus.queueSize}</div>
                <p className="text-gray-500 text-sm">Queue Size</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {(systemStatus.averageAuthenticityScore * 100).toFixed(1)}%
                </div>
                <p className="text-gray-500 text-sm">Avg Authenticity Score</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {(systemStatus.systemLoad * 100).toFixed(1)}%
                </div>
                <p className="text-gray-500 text-sm">System Load</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{systemStatus.runningJobs}</div>
                <p className="text-gray-500 text-sm">Running Jobs</p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">System Controls</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={createDemoCampaign}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Demo Campaign
            </button>
            <button
              onClick={emergencyStop}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Emergency Stop
            </button>
            <button
              onClick={loadSystemData}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Campaigns */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Active Campaigns</h2>
          {campaigns.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No campaigns found. Create a demo campaign to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Engagements
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Authenticity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {campaign.id.substring(0, 12)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCampaignStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {campaign.targetMetrics.views.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {campaign.analytics.totalEngagements}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(campaign.analytics.averageAuthenticityScore * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {campaign.status === 'active' && (
                          <button
                            onClick={() => controlCampaign(campaign.id, 'pause')}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            Pause
                          </button>
                        )}
                        {campaign.status === 'paused' && (
                          <button
                            onClick={() => controlCampaign(campaign.id, 'resume')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Resume
                          </button>
                        )}
                        <button
                          onClick={() => controlCampaign(campaign.id, 'stop')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Stop
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            Engagement Orchestration Engine - Managing authentic bot interactions
            with realistic patterns and comprehensive analytics
          </p>
        </div>
      </div>
    </div>
  );
}