import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsMetric } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, this would fetch data from your database
    // For now, we'll return mock data
    
    const metrics: AnalyticsMetric[] = [
      {
        id: '1',
        name: 'Total Interactions',
        value: 15420,
        change: 12.5,
        changeType: 'increase',
        timestamp: new Date()
      },
      {
        id: '2',
        name: 'Active Users',
        value: 2847,
        change: 8.3,
        changeType: 'increase',
        timestamp: new Date()
      },
      {
        id: '3',
        name: 'Content Created',
        value: 1256,
        change: -2.1,
        changeType: 'decrease',
        timestamp: new Date()
      },
      {
        id: '4',
        name: 'Engagement Rate',
        value: 4.7,
        change: 15.2,
        changeType: 'increase',
        timestamp: new Date()
      },
      {
        id: '5',
        name: 'Bot Response Time',
        value: 1.2,
        change: -8.7,
        changeType: 'decrease',
        timestamp: new Date()
      },
      {
        id: '6',
        name: 'Authenticity Score',
        value: 87.3,
        change: 3.1,
        changeType: 'increase',
        timestamp: new Date()
      }
    ];

    return NextResponse.json({
      data: metrics,
      success: true,
      message: 'Overview metrics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching overview metrics:', error);
    return NextResponse.json(
      { 
        data: [], 
        success: false, 
        error: 'Failed to fetch overview metrics' 
      },
      { status: 500 }
    );
  }
}