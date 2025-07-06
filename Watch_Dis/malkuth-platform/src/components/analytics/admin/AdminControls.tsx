'use client';

import React, { useState, useEffect } from 'react';
import { AlertRule, DashboardConfig } from '@/types';

interface AdminControlsProps {
  className?: string;
}

const AdminControls: React.FC<AdminControlsProps> = ({ className = '' }) => {
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>({
    userId: 'admin',
    layout: 'grid',
    widgets: ['overview', 'content', 'bots', 'engagement', 'realtime'],
    refreshInterval: 30000,
    theme: 'dark',
    alertsEnabled: true,
    emailNotifications: true
  });
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState<AlertRule | null>(null);
  const [newAlert, setNewAlert] = useState<Partial<AlertRule>>({
    name: '',
    metric: '',
    condition: 'above',
    threshold: 0,
    severity: 'medium',
    isActive: true
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = () => {
    // Sample alert rules
    const sampleAlerts: AlertRule[] = [
      {
        id: '1',
        name: 'High Error Rate',
        metric: 'error_rate',
        condition: 'above',
        threshold: 5,
        isActive: true,
        severity: 'high',
        lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: '2',
        name: 'Low Engagement',
        metric: 'engagement_rate',
        condition: 'below',
        threshold: 2,
        isActive: true,
        severity: 'medium'
      },
      {
        id: '3',
        name: 'API Rate Limit',
        metric: 'api_calls_per_minute',
        condition: 'above',
        threshold: 1000,
        isActive: true,
        severity: 'critical'
      },
      {
        id: '4',
        name: 'Bot Inactivity',
        metric: 'inactive_bots',
        condition: 'above',
        threshold: 3,
        isActive: false,
        severity: 'low'
      }
    ];
    
    setAlertRules(sampleAlerts);
  };

  const createAlert = () => {
    if (!newAlert.name || !newAlert.metric || newAlert.threshold === undefined) return;
    
    const alert: AlertRule = {
      id: Date.now().toString(),
      name: newAlert.name,
      metric: newAlert.metric,
      condition: newAlert.condition || 'above',
      threshold: newAlert.threshold,
      isActive: newAlert.isActive || true,
      severity: newAlert.severity || 'medium'
    };
    
    setAlertRules(prev => [...prev, alert]);
    setNewAlert({
      name: '',
      metric: '',
      condition: 'above',
      threshold: 0,
      severity: 'medium',
      isActive: true
    });
    setShowAlertModal(false);
  };

  const updateAlert = (id: string, updates: Partial<AlertRule>) => {
    setAlertRules(prev => prev.map(alert => 
      alert.id === id ? { ...alert, ...updates } : alert
    ));
  };

  const deleteAlert = (id: string) => {
    setAlertRules(prev => prev.filter(alert => alert.id !== id));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-900/20';
      case 'high': return 'text-orange-400 bg-orange-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'low': return 'text-blue-400 bg-blue-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getConditionDisplay = (condition: string) => {
    switch (condition) {
      case 'above': return '>';
      case 'below': return '<';
      case 'equals': return '=';
      default: return condition;
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const availableMetrics = [
    { value: 'error_rate', label: 'Error Rate (%)' },
    { value: 'engagement_rate', label: 'Engagement Rate (%)' },
    { value: 'api_calls_per_minute', label: 'API Calls per Minute' },
    { value: 'response_time', label: 'Average Response Time (ms)' },
    { value: 'active_users', label: 'Active Users' },
    { value: 'inactive_bots', label: 'Inactive Bots' },
    { value: 'storage_usage', label: 'Storage Usage (MB)' },
    { value: 'authenticity_score', label: 'Authenticity Score (%)' }
  ];

  return (
    <div className={`bg-black text-white p-8 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Controls</h1>
        <button
          onClick={() => setShowAlertModal(true)}
          className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200 transition-colors"
        >
          Create Alert Rule
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Alert Rules */}
        <div className="bg-gray-900 border border-gray-800 rounded">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-bold">Alert Rules</h2>
            <p className="text-sm text-gray-400">Monitor key metrics and get notified of issues</p>
          </div>
          
          <div className="divide-y divide-gray-800">
            {alertRules.map((alert) => (
              <div key={alert.id} className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${alert.isActive ? 'bg-green-400' : 'bg-gray-600'}`}></div>
                    <h3 className="font-medium">{alert.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => updateAlert(alert.id, { isActive: !alert.isActive })}
                      className={`text-xs px-3 py-1 rounded transition-colors ${
                        alert.isActive 
                          ? 'bg-red-900 text-red-300 hover:bg-red-800' 
                          : 'bg-green-900 text-green-300 hover:bg-green-800'
                      }`}
                    >
                      {alert.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="text-xs px-3 py-1 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-400 mb-2">
                  Trigger when <span className="font-mono">{alert.metric}</span> is{' '}
                  <span className="font-mono">{getConditionDisplay(alert.condition)} {alert.threshold}</span>
                </div>
                
                {alert.lastTriggered && (
                  <div className="text-xs text-red-400">
                    Last triggered: {formatTime(alert.lastTriggered)}
                  </div>
                )}
              </div>
            ))}
            
            {alertRules.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <div className="text-4xl mb-4">🔔</div>
                <p className="text-lg font-medium mb-2">No alert rules configured</p>
                <p className="text-sm">Create alert rules to monitor your platform</p>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Configuration */}
        <div className="bg-gray-900 border border-gray-800 rounded">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-bold">Dashboard Configuration</h2>
            <p className="text-sm text-gray-400">Customize dashboard appearance and behavior</p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Layout Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Layout</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Dashboard Layout
                  </label>
                  <select
                    value={dashboardConfig.layout}
                    onChange={(e) => setDashboardConfig(prev => ({ ...prev, layout: e.target.value as any }))}
                    className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-gray-500 focus:outline-none"
                  >
                    <option value="grid">Grid Layout</option>
                    <option value="list">List Layout</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Refresh Interval (seconds)
                  </label>
                  <select
                    value={dashboardConfig.refreshInterval / 1000}
                    onChange={(e) => setDashboardConfig(prev => ({ 
                      ...prev, 
                      refreshInterval: parseInt(e.target.value) * 1000 
                    }))}
                    className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-gray-500 focus:outline-none"
                  >
                    <option value="10">10 seconds</option>
                    <option value="30">30 seconds</option>
                    <option value="60">1 minute</option>
                    <option value="300">5 minutes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Widget Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Enabled Widgets</h3>
              <div className="space-y-2">
                {[
                  { id: 'overview', label: 'Overview Dashboard' },
                  { id: 'content', label: 'Content Analytics' },
                  { id: 'bots', label: 'Bot Activity' },
                  { id: 'engagement', label: 'Engagement Metrics' },
                  { id: 'realtime', label: 'Real-time Stats' }
                ].map((widget) => (
                  <label key={widget.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={dashboardConfig.widgets.includes(widget.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setDashboardConfig(prev => ({
                            ...prev,
                            widgets: [...prev.widgets, widget.id]
                          }));
                        } else {
                          setDashboardConfig(prev => ({
                            ...prev,
                            widgets: prev.widgets.filter(w => w !== widget.id)
                          }));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{widget.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notification Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Notifications</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={dashboardConfig.alertsEnabled}
                    onChange={(e) => setDashboardConfig(prev => ({ 
                      ...prev, 
                      alertsEnabled: e.target.checked 
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm">Enable Dashboard Alerts</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={dashboardConfig.emailNotifications}
                    onChange={(e) => setDashboardConfig(prev => ({ 
                      ...prev, 
                      emailNotifications: e.target.checked 
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm">Email Notifications</span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={() => console.log('Saving config:', dashboardConfig)}
              className="w-full bg-white text-black py-2 rounded hover:bg-gray-200 transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>

      {/* Create Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded w-full max-w-md">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold">Create Alert Rule</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Alert Name
                </label>
                <input
                  type="text"
                  value={newAlert.name}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-gray-500 focus:outline-none"
                  placeholder="e.g., High Error Rate"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Metric to Monitor
                </label>
                <select
                  value={newAlert.metric}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, metric: e.target.value }))}
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-gray-500 focus:outline-none"
                >
                  <option value="">Select a metric</option>
                  {availableMetrics.map((metric) => (
                    <option key={metric.value} value={metric.value}>
                      {metric.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Condition
                  </label>
                  <select
                    value={newAlert.condition}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, condition: e.target.value as any }))}
                    className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-gray-500 focus:outline-none"
                  >
                    <option value="above">Above</option>
                    <option value="below">Below</option>
                    <option value="equals">Equals</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Threshold
                  </label>
                  <input
                    type="number"
                    value={newAlert.threshold}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, threshold: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-gray-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Severity
                </label>
                <select
                  value={newAlert.severity}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, severity: e.target.value as any }))}
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-gray-500 focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newAlert.isActive}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Enable immediately</span>
              </label>
            </div>

            <div className="p-6 border-t border-gray-800 flex justify-end space-x-4">
              <button
                onClick={() => setShowAlertModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createAlert}
                className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200 transition-colors"
              >
                Create Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminControls;