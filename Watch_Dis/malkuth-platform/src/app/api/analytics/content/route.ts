import { NextRequest, NextResponse } from 'next/server';
import { ContentMetrics } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const contentType = searchParams.get('contentType');
    const limit = parseInt(searchParams.get('limit') || '50');

    // In a real implementation, you would filter by these parameters
    // For now, we'll return mock data
    
    const contentMetrics: ContentMetrics[] = Array.from({ length: limit }, (_, i) => ({
      id: `content-${i + 1}`,
      contentId: `post-${1000 + i}`,
      contentType: ['post', 'comment', 'reply'][Math.floor(Math.random() * 3)] as 'post' | 'comment' | 'reply',
      views: Math.floor(Math.random() * 10000) + 100,
      likes: Math.floor(Math.random() * 1000) + 10,
      comments: Math.floor(Math.random() * 200) + 1,
      shares: Math.floor(Math.random() * 100) + 1,
      engagementRate: Math.random() * 10,
      authenticityScore: Math.random() * 40 + 60, // 60-100 range
      performanceScore: Math.random() * 40 + 60, // 60-100 range
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    }));

    // Apply content type filter if specified
    const filteredMetrics = contentType && contentType !== 'all' 
      ? contentMetrics.filter(metric => metric.contentType === contentType)
      : contentMetrics;

    return NextResponse.json({
      data: filteredMetrics,
      success: true,
      message: 'Content metrics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching content metrics:', error);
    return NextResponse.json(
      { 
        data: [], 
        success: false, 
        error: 'Failed to fetch content metrics' 
      },
      { status: 500 }
    );
  }
}