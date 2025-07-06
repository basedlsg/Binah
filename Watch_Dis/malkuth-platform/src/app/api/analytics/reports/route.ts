import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsReport, AnalyticsMetric } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, dateRange } = body;

    // Validate input
    if (!type || !['daily', 'weekly', 'monthly', 'custom'].includes(type)) {
      return NextResponse.json(
        { 
          data: null, 
          success: false, 
          error: 'Invalid report type' 
        },
        { status: 400 }
      );
    }

    // Calculate date range if not provided
    let reportDateRange = dateRange;
    if (!reportDateRange) {
      const end = new Date();
      let start = new Date();
      
      switch (type) {
        case 'daily':
          start = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case 'weekly':
          start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
      
      reportDateRange = { start, end };
    } else {
      reportDateRange = {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end)
      };
    }

    // Generate mock metrics for the report
    const metrics: AnalyticsMetric[] = [
      {
        id: 'metric-1',
        name: 'Total Interactions',
        value: Math.floor(Math.random() * 50000) + 10000,
        change: (Math.random() - 0.3) * 30,
        changeType: Math.random() > 0.4 ? 'increase' : Math.random() > 0.7 ? 'decrease' : 'neutral',
        timestamp: new Date()
      },
      {
        id: 'metric-2',
        name: 'Active Users',
        value: Math.floor(Math.random() * 5000) + 1000,
        change: (Math.random() - 0.2) * 25,
        changeType: Math.random() > 0.3 ? 'increase' : Math.random() > 0.8 ? 'decrease' : 'neutral',
        timestamp: new Date()
      },
      {
        id: 'metric-3',
        name: 'Content Created',
        value: Math.floor(Math.random() * 2000) + 500,
        change: (Math.random() - 0.4) * 20,
        changeType: Math.random() > 0.5 ? 'increase' : Math.random() > 0.7 ? 'decrease' : 'neutral',
        timestamp: new Date()
      },
      {
        id: 'metric-4',
        name: 'Engagement Rate',
        value: Math.random() * 5 + 3,
        change: (Math.random() - 0.3) * 15,
        changeType: Math.random() > 0.4 ? 'increase' : Math.random() > 0.8 ? 'decrease' : 'neutral',
        timestamp: new Date()
      },
      {
        id: 'metric-5',
        name: 'Bot Performance',
        value: Math.random() * 20 + 75,
        change: (Math.random() - 0.2) * 10,
        changeType: Math.random() > 0.4 ? 'increase' : Math.random() > 0.8 ? 'decrease' : 'neutral',
        timestamp: new Date()
      },
      {
        id: 'metric-6',
        name: 'System Uptime',
        value: Math.random() * 3 + 97,
        change: (Math.random() - 0.5) * 2,
        changeType: Math.random() > 0.3 ? 'increase' : Math.random() > 0.9 ? 'decrease' : 'neutral',
        timestamp: new Date()
      }
    ];

    // Generate insights based on metrics
    const insights: string[] = [];
    const positiveMetrics = metrics.filter(m => m.changeType === 'increase').length;
    const negativeMetrics = metrics.filter(m => m.changeType === 'decrease').length;

    if (positiveMetrics > negativeMetrics) {
      insights.push('Overall platform performance is trending positively with strong growth across key metrics');
    } else if (negativeMetrics > positiveMetrics) {
      insights.push('Several key metrics are declining - review and optimization may be needed');
    } else {
      insights.push('Platform metrics are showing stable performance with mixed trends');
    }

    const engagementMetric = metrics.find(m => m.name.includes('Engagement'));
    if (engagementMetric && engagementMetric.change > 10) {
      insights.push('Engagement rates are significantly higher - current content strategy is highly effective');
    } else if (engagementMetric && engagementMetric.change < -10) {
      insights.push('Engagement rates have declined - consider reviewing content strategy and user experience');
    }

    const botMetric = metrics.find(m => m.name.includes('Bot'));
    if (botMetric && botMetric.value > 85) {
      insights.push('Bot performance is excellent with high user satisfaction scores');
    } else if (botMetric && botMetric.value < 70) {
      insights.push('Bot performance needs improvement - consider updating algorithms and training data');
    }

    // Generate recommendations
    const recommendations: string[] = [];
    
    metrics.forEach(metric => {
      if (metric.changeType === 'decrease' && metric.change < -15) {
        switch (metric.name) {
          case 'Total Interactions':
            recommendations.push('Implement engagement campaigns to boost user interactions');
            break;
          case 'Active Users':
            recommendations.push('Focus on user retention strategies and re-engagement campaigns');
            break;
          case 'Content Created':
            recommendations.push('Incentivize content creation through rewards or gamification');
            break;
          case 'Engagement Rate':
            recommendations.push('Analyze top-performing content and replicate successful patterns');
            break;
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Continue current strategies while monitoring for new optimization opportunities');
      recommendations.push('Consider A/B testing new features to drive additional growth');
    }

    // Create the report
    const report: AnalyticsReport = {
      id: `report-${Date.now()}`,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Analytics Report`,
      type: type as 'daily' | 'weekly' | 'monthly' | 'custom',
      dateRange: reportDateRange,
      metrics,
      insights,
      recommendations,
      generatedAt: new Date()
    };

    return NextResponse.json({
      data: report,
      success: true,
      message: 'Analytics report generated successfully'
    });
  } catch (error) {
    console.error('Error generating analytics report:', error);
    return NextResponse.json(
      { 
        data: null, 
        success: false, 
        error: 'Failed to generate analytics report' 
      },
      { status: 500 }
    );
  }
}