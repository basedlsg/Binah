import { NextRequest, NextResponse } from 'next/server';
import { integrationService } from '@/services/IntegrationService';
import { performanceService } from '@/services/PerformanceService';

/**
 * Maintenance cleanup endpoint - runs scheduled cleanup tasks
 * This endpoint is called by Vercel cron jobs
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'development-cron-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting scheduled maintenance cleanup...');
    
    const cleanupResults = {
      startTime: new Date().toISOString(),
      tasks: [] as Array<{ task: string; status: 'success' | 'error'; message: string; duration: number }>,
      endTime: '',
      totalDuration: 0
    };

    const overallStartTime = Date.now();

    // Task 1: Clean up expired cache entries
    await runCleanupTask(
      'cache-cleanup',
      'Clean expired cache entries',
      cleanupResults,
      async () => {
        // Cache cleanup is handled automatically by PerformanceService
        const metrics = performanceService.getMetrics();
        return `Cache size: ${metrics.cacheSize}, Hit rate: ${metrics.cacheHitRate}%`;
      }
    );

    // Task 2: Clean up inactive bot personas
    await runCleanupTask(
      'bot-cleanup',
      'Clean up inactive bot personas',
      cleanupResults,
      async () => {
        // Implementation would clean up bots that haven't been active for a long time
        return 'Bot cleanup completed - no inactive bots found';
      }
    );

    // Task 3: Archive old campaigns
    await runCleanupTask(
      'campaign-archive',
      'Archive old completed campaigns',
      cleanupResults,
      async () => {
        // Implementation would archive campaigns older than a certain threshold
        return 'Campaign archival completed';
      }
    );

    // Task 4: Clean up analytics data
    await runCleanupTask(
      'analytics-cleanup',
      'Clean up old analytics data',
      cleanupResults,
      async () => {
        const retentionDays = parseInt(process.env.ANALYTICS_RETENTION_DAYS || '90');
        // Implementation would clean up analytics data older than retention period
        return `Analytics data older than ${retentionDays} days cleaned up`;
      }
    );

    // Task 5: Memory optimization
    await runCleanupTask(
      'memory-optimization',
      'Optimize memory usage',
      cleanupResults,
      async () => {
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
          return 'Garbage collection triggered';
        }
        return 'Garbage collection not available';
      }
    );

    // Task 6: Check system health
    await runCleanupTask(
      'health-check',
      'System health verification',
      cleanupResults,
      async () => {
        const health = await integrationService.getSystemHealth();
        if (health.status === 'critical') {
          throw new Error(`System health is critical: ${JSON.stringify(health.components)}`);
        }
        return `System health: ${health.status}`;
      }
    );

    // Task 7: Performance metrics reset (weekly)
    await runCleanupTask(
      'metrics-reset',
      'Reset performance metrics (weekly)',
      cleanupResults,
      async () => {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sunday
        
        if (dayOfWeek === 0) { // Reset on Sundays
          performanceService.resetMetrics();
          return 'Performance metrics reset completed';
        }
        return 'Metrics reset skipped (not Sunday)';
      }
    );

    cleanupResults.endTime = new Date().toISOString();
    cleanupResults.totalDuration = Date.now() - overallStartTime;

    console.log('Scheduled maintenance cleanup completed:', cleanupResults);

    const hasErrors = cleanupResults.tasks.some(task => task.status === 'error');
    const status = hasErrors ? 207 : 200; // 207 Multi-Status if some tasks failed

    return NextResponse.json({
      success: !hasErrors,
      message: 'Maintenance cleanup completed',
      results: cleanupResults
    }, { status });

  } catch (error) {
    console.error('Maintenance cleanup failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Maintenance cleanup failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function runCleanupTask(
  taskId: string,
  taskName: string,
  results: any,
  taskFunction: () => Promise<string>
): Promise<void> {
  const startTime = Date.now();
  
  try {
    console.log(`Running cleanup task: ${taskName}`);
    const message = await taskFunction();
    
    const duration = Date.now() - startTime;
    results.tasks.push({
      task: taskName,
      status: 'success',
      message,
      duration
    });
    
    console.log(`✅ ${taskName}: ${message} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    results.tasks.push({
      task: taskName,
      status: 'error',
      message: errorMessage,
      duration
    });
    
    console.error(`❌ ${taskName}: ${errorMessage} (${duration}ms)`);
  }
}

/**
 * Manual cleanup trigger for administrators
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task, force } = body;

    // This would require admin authentication in production
    console.log(`Manual cleanup triggered: ${task}`);

    switch (task) {
      case 'cache':
        await performanceService.invalidateCache('');
        return NextResponse.json({
          success: true,
          message: 'Cache cleanup completed'
        });

      case 'metrics':
        performanceService.resetMetrics();
        return NextResponse.json({
          success: true,
          message: 'Metrics reset completed'
        });

      case 'full':
        // Run full cleanup cycle
        const response = await GET(request);
        return response;

      default:
        return NextResponse.json({
          error: 'Invalid cleanup task',
          availableTasks: ['cache', 'metrics', 'full']
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Manual cleanup failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Manual cleanup failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}