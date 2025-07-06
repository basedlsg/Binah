import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Mock trending topics with realistic data
    const topics = [
      'ai', 'machinelearning', 'blockchain', 'cryptocurrency', 'nft', 'web3',
      'react', 'nextjs', 'typescript', 'javascript', 'python', 'nodejs',
      'design', 'ux', 'ui', 'frontend', 'backend', 'fullstack',
      'startup', 'tech', 'innovation', 'productivity', 'remote',
      'gaming', 'streaming', 'content', 'social', 'community',
      'fitness', 'health', 'wellness', 'mindfulness', 'lifestyle',
      'travel', 'photography', 'art', 'music', 'books', 'movies'
    ];

    const trendingTopics = Array.from({ length: Math.min(limit, topics.length) }, (_, i) => {
      const topic = topics[i];
      const baseCount = Math.floor(Math.random() * 10000) + 1000;
      const growth = (Math.random() - 0.3) * 50; // -15% to +35% growth
      
      return {
        topic,
        count: baseCount,
        growth: parseFloat(growth.toFixed(1))
      };
    });

    // Sort by count (most popular first)
    trendingTopics.sort((a, b) => b.count - a.count);

    return NextResponse.json({
      data: trendingTopics,
      success: true,
      message: 'Trending topics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    return NextResponse.json(
      { 
        data: [], 
        success: false, 
        error: 'Failed to fetch trending topics' 
      },
      { status: 500 }
    );
  }
}