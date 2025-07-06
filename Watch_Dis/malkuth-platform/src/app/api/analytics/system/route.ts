import { NextRequest, NextResponse } from 'next/server';
import { SystemMetrics } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Generate realistic system metrics
    const now = new Date();
    const systemHealth = Math.random() > 0.1 ? 'healthy' : Math.random() > 0.5 ? 'degraded' : 'critical';
    
    const systemMetrics: SystemMetrics = {
      id: 'system-current',
      apiCalls: Math.floor(Math.random() * 100000) + 50000,
      apiErrors: Math.floor(Math.random() * 500) + 10,
      geminiApiUsage: Math.floor(Math.random() * 10000) + 5000,
      storageUsage: Math.floor(Math.random() * 50000) + 25000, // MB
      activeUsers: Math.floor(Math.random() * 5000) + 1000,
      systemHealth: systemHealth as 'healthy' | 'degraded' | 'critical',
      uptime: Math.random() * 5 + 95, // 95-100% uptime
      createdAt: now,
      updatedAt: now
    };

    return NextResponse.json({
      data: systemMetrics,
      success: true,
      message: 'System metrics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    return NextResponse.json(
      { 
        data: null, 
        success: false, 
        error: 'Failed to fetch system metrics' 
      },
      { status: 500 }
    );
  }
}