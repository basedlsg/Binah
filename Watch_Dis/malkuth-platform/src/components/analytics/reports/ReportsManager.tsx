'use client';

import React, { useState, useEffect } from 'react';
import { AnalyticsReport, ExportOptions } from '@/types';
import { analyticsService } from '@/services/AnalyticsService';

interface ReportsManagerProps {
  className?: string;
}

const ReportsManager: React.FC<ReportsManagerProps> = ({ className = '' }) => {
  const [reports, setReports] = useState<AnalyticsReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<AnalyticsReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Report generation form
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('weekly');
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Export form
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date()
    },
    includeCharts: true,
    includeRawData: false,
    metrics: ['overview', 'content', 'bots', 'engagement']
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch existing reports
      // For now, we'll create a sample report
      const sampleReport = await analyticsService.generateReport('weekly');
      setReports([sampleReport]);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      
      let dateRange;
      if (reportType === 'custom') {
        dateRange = {
          start: new Date(customDateRange.start),
          end: new Date(customDateRange.end)
        };
      }

      const report = await analyticsService.generateReport(reportType, dateRange);
      setReports(prev => [report, ...prev]);
      setShowReportModal(false);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      setExportLoading(true);
      
      const blob = await analyticsService.exportData(exportOptions);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-export-${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setShowExportModal(false);
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const getReportTypeDisplay = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'daily': return '📅';
      case 'weekly': return '📊';
      case 'monthly': return '📈';
      case 'custom': return '🔧';
      default: return '📋';
    }
  };

  return (
    <div className={`bg-black text-white p-8 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Reports Manager</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Export Data
          </button>
          <button
            onClick={() => setShowReportModal(true)}
            className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200 transition-colors"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-gray-900 border border-gray-800 rounded">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold">Generated Reports</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-gray-600 border-t-white rounded-full mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading reports...</p>
          </div>
        ) : reports.length > 0 ? (
          <div className="divide-y divide-gray-800">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-6 hover:bg-gray-800/50 cursor-pointer transition-colors"
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">{getReportIcon(report.type)}</span>
                    <div>
                      <h3 className="font-medium">{report.title}</h3>
                      <p className="text-sm text-gray-400">
                        {getReportTypeDisplay(report.type)} Report • 
                        {formatDate(report.dateRange.start)} - {formatDate(report.dateRange.end)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">
                      Generated {formatDate(report.generatedAt)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {report.metrics.length} metrics • {report.insights.length} insights
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-lg font-medium mb-2">No reports generated yet</p>
            <p className="text-sm">Generate your first analytics report to get started</p>
          </div>
        )}
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded w-full max-w-4xl h-5/6 overflow-hidden">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold">{selectedReport.title}</h2>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto h-full">
              {/* Report Info */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Type:</span>
                    <span className="ml-2">{getReportTypeDisplay(selectedReport.type)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Period:</span>
                    <span className="ml-2">
                      {formatDate(selectedReport.dateRange.start)} - {formatDate(selectedReport.dateRange.end)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Generated:</span>
                    <span className="ml-2">{formatDate(selectedReport.generatedAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Metrics:</span>
                    <span className="ml-2">{selectedReport.metrics.length} included</span>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedReport.metrics.map((metric) => (
                    <div key={metric.id} className="bg-gray-800 p-4 rounded">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm text-gray-400">{metric.name}</span>
                        <span className={`text-sm ${
                          metric.changeType === 'increase' ? 'text-green-400' :
                          metric.changeType === 'decrease' ? 'text-red-400' :
                          'text-gray-400'
                        }`}>
                          {metric.changeType === 'increase' ? '↗' :
                           metric.changeType === 'decrease' ? '↘' : '→'}
                        </span>
                      </div>
                      <div className="text-xl font-bold">{metric.value.toLocaleString()}</div>
                      <div className={`text-sm ${
                        metric.changeType === 'increase' ? 'text-green-400' :
                        metric.changeType === 'decrease' ? 'text-red-400' :
                        'text-gray-400'
                      }`}>
                        {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insights */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
                <ul className="space-y-2">
                  {selectedReport.insights.map((insight, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span className="text-gray-300">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
                <ul className="space-y-2">
                  {selectedReport.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-green-400 mt-1">→</span>
                      <span className="text-gray-300">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded w-full max-w-md">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold">Generate New Report</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-gray-500 focus:outline-none"
                >
                  <option value="daily">Daily Report</option>
                  <option value="weekly">Weekly Report</option>
                  <option value="monthly">Monthly Report</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>

              {reportType === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customDateRange.start}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-gray-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customDateRange.end}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-gray-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-800 flex justify-end space-x-4">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={generateReport}
                disabled={loading}
                className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded w-full max-w-md">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold">Export Analytics Data</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Export Format
                </label>
                <select
                  value={exportOptions.format}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as any }))}
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-gray-500 focus:outline-none"
                >
                  <option value="pdf">PDF Report</option>
                  <option value="csv">CSV Data</option>
                  <option value="json">JSON Data</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={exportOptions.dateRange.start.toISOString().split('T')[0]}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: new Date(e.target.value) }
                    }))}
                    className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-gray-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={exportOptions.dateRange.end.toISOString().split('T')[0]}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: new Date(e.target.value) }
                    }))}
                    className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-gray-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeCharts}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Include Charts</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeRawData}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeRawData: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Include Raw Data</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-800 flex justify-end space-x-4">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={exportData}
                disabled={exportLoading}
                className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {exportLoading ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsManager;