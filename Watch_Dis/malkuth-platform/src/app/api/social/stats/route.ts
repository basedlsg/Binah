import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Generate realistic stats
    const stats = {
      totalPosts: Math.floor(Math.random() * 20) + 5, // 5-25 posts
      totalEngagement: Math.floor(Math.random() * 5000) + 1000, // 1000-6000 engagement
      activeBots: Math.floor(Math.random() * 50) + 100, // 100-150 active bots
      avgEngagementRate: Math.floor(Math.random() * 30) + 70 // 70-100% engagement rate
    };

    return NextResponse.json({
      success: true,
      stats,
      message: "Stats retrieved successfully"
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}