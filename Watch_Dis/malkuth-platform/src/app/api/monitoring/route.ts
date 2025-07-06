import { NextRequest, NextResponse } from 'next/server';
import { integrationService } from '@/services/IntegrationService';
import { performanceService } from '@/services/PerformanceService';
import { authService } from '@/services/AuthService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'health';

    // Basic health check doesn't require auth
    if (type === 'health') {
      return handleHealthCheck();
    }

    // Other monitoring endpoints require authentication
    const user = await authService.authenticateRequest(request);
    if (!user || !authService.hasPermission(user, 'monitor')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Monitoring access required' },
        { status: 401 }
      );
    }

    switch (type) {
      case 'metrics':
        return handleMetrics();
      case 'performance':
        return handlePerformance();
      case 'system':
        return handleSystemStatus();
      case 'recommendations':
        return handleRecommendations();
      default:
        return NextResponse.json(
          { error: 'Invalid monitoring type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Monitoring API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleHealthCheck() {
  try {
    const health = await integrationService.getSystemHealth();
    
    const response = {
      status: health.status,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      components: health.components,
      metrics: {
        activeBots: health.metrics.activeBots,
        activeCampaigns: health.metrics.activeCampaigns,
        systemHealth: health.status
      }
    };

    const httpStatus = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;

    return NextResponse.json(response, { status: httpStatus });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'critical',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}

async function handleMetrics() {
  try {
    const performanceMetrics = performanceService.getMetrics();
    const memoryUsage = performanceService.getMemoryUsage();
    const systemHealth = await integrationService.getSystemHealth();

    const metrics = {
      performance: performanceMetrics,
      memory: memoryUsage,
      system: systemHealth.metrics,
      timestamp: new Date().toISOString(),
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime()
      }
    };

    return NextResponse.json({ success: true, data: metrics });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve metrics', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handlePerformance() {
  try {
    const performanceData = performanceService.getMetrics();
    const recommendations = performanceService.getPerformanceRecommendations();
    const realTimeAnalytics = await integrationService.getRealTimeAnalytics();

    const performance = {
      metrics: performanceData,
      recommendations,
      analytics: {
        activeCampaigns: realTimeAnalytics.activeCampaigns.length,
        activeBots: realTimeAnalytics.botMetrics.length,
        systemMetrics: realTimeAnalytics.systemMetrics
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({ success: true, data: performance });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve performance data', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleSystemStatus() {
  try {
    const [health, analytics, performanceMetrics] = await Promise.all([
      integrationService.getSystemHealth(),
      integrationService.getRealTimeAnalytics(),
      performanceService.getMetrics()
    ]);

    const systemStatus = {
      health: health.status,
      components: health.components,
      metrics: {
        ...health.metrics,
        performance: {
          cacheHitRate: performanceMetrics.cacheHitRate,
          averageResponseTime: performanceMetrics.averageResponseTime,
          errorRate: performanceMetrics.errors / Math.max(performanceMetrics.apiCalls, 1)
        }
      },
      analytics: {
        activeCampaigns: analytics.activeCampaigns.length,
        activeBots: analytics.botMetrics.filter(bot => bot.isActive).length,
        totalEngagements: analytics.engagementPatterns.reduce((sum, pattern) => sum + pattern.interactions, 0)
      },
      resources: {
        memory: performanceService.getMemoryUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({ success: true, data: systemStatus });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve system status', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleRecommendations() {
  try {
    const performanceRecommendations = performanceService.getPerformanceRecommendations();
    const systemHealth = await integrationService.getSystemHealth();
    
    const recommendations = {
      performance: performanceRecommendations,
      system: generateSystemRecommendations(systemHealth),
      security: generateSecurityRecommendations(),
      optimization: generateOptimizationRecommendations(),
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({ success: true, data: recommendations });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate recommendations', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function generateSystemRecommendations(health: any): string[] {
  const recommendations: string[] = [];

  if (health.status === 'degraded') {
    recommendations.push('System is in degraded state - investigate component issues');
  }

  if (health.status === 'critical') {
    recommendations.push('CRITICAL: System requires immediate attention');
  }

  if (health.metrics.activeBots < 10) {
    recommendations.push('Consider increasing the number of active bots for better engagement');
  }

  if (health.metrics.activeCampaigns > 50) {
    recommendations.push('High number of active campaigns - monitor resource usage');
  }

  return recommendations;
}

function generateSecurityRecommendations(): string[] {
  const recommendations: string[] = [];

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-api-key') {
    recommendations.push('Configure proper Gemini API key');
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-jwt-secret') {
    recommendations.push('Set a strong JWT secret');
  }

  if (process.env.NODE_ENV !== 'production') {
    recommendations.push('Ensure NODE_ENV is set to production in production environment');
  }

  return recommendations;
}

function generateOptimizationRecommendations(): string[] {
  const recommendations: string[] = [];
  const memoryUsage = performanceService.getMemoryUsage();

  if (memoryUsage.heapUsed / memoryUsage.heapTotal > 0.8) {
    recommendations.push('High memory usage detected - consider optimizing memory allocation');
  }

  if (memoryUsage.cacheMemoryEstimate > 50 * 1024 * 1024) { // 50MB
    recommendations.push('Cache memory usage is high - consider cache optimization');
  }

  recommendations.push('Enable compression for API responses');
  recommendations.push('Implement CDN for static assets');
  recommendations.push('Consider implementing database connection pooling');

  return recommendations;
}

export async function POST(request: NextRequest) {
  try {
    const user = await authService.authenticateRequest(request);
    if (!user || !authService.hasPermission(user, 'monitor')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Monitoring access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'reset-metrics':
        performanceService.resetMetrics();
        return NextResponse.json({ success: true, message: 'Metrics reset successfully' });

      case 'clear-cache':
        const pattern = body.pattern || '';
        await performanceService.invalidateCache(pattern);
        return NextResponse.json({ success: true, message: 'Cache cleared successfully' });

      case 'preload-data':
        await performanceService.preloadCriticalData();
        return NextResponse.json({ success: true, message: 'Critical data preloaded' });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Monitoring POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}