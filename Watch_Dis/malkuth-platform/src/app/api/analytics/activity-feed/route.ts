import { NextRequest, NextResponse } from 'next/server';
import { ActivityFeedItem } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Generate mock activity feed items
    const activityTypes = ['bot_activity', 'content_creation', 'engagement', 'system_event'] as const;
    const severities = ['info', 'warning', 'error'] as const;
    
    const activities: ActivityFeedItem[] = Array.from({ length: limit }, (_, i) => {
      const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const timestamp = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000); // Last 24 hours
      
      const templates = {
        bot_activity: {
          titles: [
            'Bot A3 engaged with user',
            'Bot B7 completed interaction cycle',
            'Bot C2 responded to query',
            'Bot D9 initiated conversation',
            'Bot E1 processed user request'
          ],
          descriptions: [
            'Successfully processed user query with high engagement score',
            'Completed automated response sequence',
            'Engaged in natural conversation flow',
            'Provided helpful information to user',
            'Maintained conversation context effectively'
          ]
        },
        content_creation: {
          titles: [
            'New post created',
            'Comment thread started',
            'Reply posted',
            'Content shared',
            'Media uploaded'
          ],
          descriptions: [
            'User generated high-quality content with trending hashtags',
            'Interactive discussion thread gaining traction',
            'Thoughtful reply contributing to conversation',
            'Content reshared across multiple platforms',
            'Visual content uploaded with strong engagement potential'
          ]
        },
        engagement: {
          titles: [
            'High engagement detected',
            'Viral content identified',
            'Engagement spike recorded',
            'Popular content trending',
            'User interaction surge'
          ],
          descriptions: [
            'Content receiving above-average engagement rates',
            'Rapid sharing and interaction patterns observed',
            'Significant increase in user interactions',
            'Content gaining momentum across user base',
            'Increased user activity in specific topic area'
          ]
        },
        system_event: {
          titles: [
            'System health check completed',
            'API rate limit adjusted',
            'Database backup finished',
            'Performance optimization applied',
            'Security scan completed'
          ],
          descriptions: [
            'All systems operating within normal parameters',
            'Rate limits updated to handle increased traffic',
            'Scheduled backup completed successfully',
            'Database query optimization improved response times',
            'Security protocols verified and updated'
          ]
        }
      };
      
      const typeTemplates = templates[type];
      const title = typeTemplates.titles[Math.floor(Math.random() * typeTemplates.titles.length)];
      const description = typeTemplates.descriptions[Math.floor(Math.random() * typeTemplates.descriptions.length)];
      
      // Generate metadata based on type
      let metadata: Record<string, any> = {};
      
      switch (type) {
        case 'bot_activity':
          metadata = {
            bot_id: `bot-${Math.floor(Math.random() * 10) + 1}`,
            response_time: `${Math.floor(Math.random() * 2000) + 500}ms`,
            engagement_score: Math.floor(Math.random() * 40) + 60
          };
          break;
        case 'content_creation':
          metadata = {
            content_type: ['post', 'comment', 'reply'][Math.floor(Math.random() * 3)],
            user_id: `user-${Math.floor(Math.random() * 1000) + 1}`,
            content_length: Math.floor(Math.random() * 500) + 50
          };
          break;
        case 'engagement':
          metadata = {
            engagement_rate: `${(Math.random() * 10 + 2).toFixed(1)}%`,
            content_id: `post-${Math.floor(Math.random() * 10000) + 1000}`,
            interactions: Math.floor(Math.random() * 1000) + 100
          };
          break;
        case 'system_event':
          metadata = {
            component: ['api', 'database', 'cache', 'storage'][Math.floor(Math.random() * 4)],
            status: severity === 'error' ? 'failed' : 'success',
            duration: `${Math.floor(Math.random() * 5000) + 100}ms`
          };
          break;
      }
      
      return {
        id: `activity-${i + 1}`,
        type,
        title,
        description,
        timestamp,
        severity,
        metadata
      };
    });

    // Sort by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      data: activities,
      success: true,
      message: 'Activity feed retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    return NextResponse.json(
      { 
        data: [], 
        success: false, 
        error: 'Failed to fetch activity feed' 
      },
      { status: 500 }
    );
  }
}