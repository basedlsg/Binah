import { NextRequest, NextResponse } from 'next/server';
import { BotMetrics } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const botId = searchParams.get('botId');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Mock bot personalities
    const personalities = [
      'Friendly Assistant', 'Professional Expert', 'Casual Conversationalist',
      'Creative Writer', 'Technical Advisor', 'Supportive Companion',
      'Analytical Thinker', 'Humorous Entertainer'
    ];

    // Generate mock bot metrics
    const botMetrics: BotMetrics[] = Array.from({ length: 12 }, (_, i) => {
      const isActive = Math.random() > 0.3; // 70% chance of being active
      const errorRate = Math.random() * 0.2; // 0-20% error rate
      const responseTime = Math.random() * 5000 + 500; // 500-5500ms
      const engagementQuality = Math.random() * 40 + 40; // 40-80 quality score
      
      return {
        id: `bot-${i + 1}`,
        botId: `bot-${String(i + 1).padStart(3, '0')}`,
        botName: `Bot ${String.fromCharCode(65 + i % 26)}${Math.floor(i / 26) + 1}`,
        personality: personalities[i % personalities.length],
        activeSessions: isActive ? Math.floor(Math.random() * 20) + 1 : 0,
        totalInteractions: Math.floor(Math.random() * 10000) + (isActive ? 100 : 0),
        averageResponseTime: responseTime,
        engagementQuality: engagementQuality,
        errorRate: errorRate,
        isActive: isActive,
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      };
    });

    // Apply filters
    let filteredMetrics = botMetrics;

    if (botId) {
      filteredMetrics = filteredMetrics.filter(bot => bot.botId === botId);
    }

    if (!includeInactive) {
      filteredMetrics = filteredMetrics.filter(bot => bot.isActive);
    }

    // Sort by total interactions (most active first)
    filteredMetrics.sort((a, b) => b.totalInteractions - a.totalInteractions);

    return NextResponse.json({
      data: filteredMetrics,
      success: true,
      message: 'Bot metrics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching bot metrics:', error);
    return NextResponse.json(
      { 
        data: [], 
        success: false, 
        error: 'Failed to fetch bot metrics' 
      },
      { status: 500 }
    );
  }
}