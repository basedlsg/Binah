import { NextRequest, NextResponse } from 'next/server';
import { EngagementPattern } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Generate engagement patterns for a week (7 days × 24 hours)
    const patterns: EngagementPattern[] = [];
    
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        // Create realistic engagement patterns
        // Higher engagement during typical awake hours (6 AM - 11 PM)
        // Peak hours around lunch (12-1 PM) and evening (6-9 PM)
        let baseInteractions = 50;
        
        if (hour >= 6 && hour <= 23) {
          baseInteractions = 150;
        }
        
        if (hour >= 12 && hour <= 13) {
          baseInteractions = 300; // Lunch peak
        }
        
        if (hour >= 18 && hour <= 21) {
          baseInteractions = 400; // Evening peak
        }
        
        // Weekend patterns (slightly different for days 0 and 6)
        if (day === 0 || day === 6) {
          if (hour >= 10 && hour <= 14) {
            baseInteractions *= 1.3; // Weekend afternoon boost
          }
          if (hour >= 20 && hour <= 23) {
            baseInteractions *= 1.2; // Weekend evening boost
          }
        }
        
        // Add some randomness
        const interactions = Math.floor(baseInteractions * (0.7 + Math.random() * 0.6));
        const authenticity = Math.random() * 20 + 70; // 70-90% authenticity
        const botActivity = Math.floor(interactions * (0.2 + Math.random() * 0.3)); // 20-50% bot activity
        const contentCreation = Math.floor(interactions * (0.05 + Math.random() * 0.1)); // 5-15% content creation
        
        const pattern: EngagementPattern = {
          timeSlot: new Date(Date.now() - (6 - day) * 24 * 60 * 60 * 1000 + hour * 60 * 60 * 1000).toISOString(),
          hour,
          day,
          interactions,
          authenticity,
          botActivity,
          contentCreation
        };
        
        patterns.push(pattern);
      }
    }

    return NextResponse.json({
      data: patterns,
      success: true,
      message: 'Engagement patterns retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching engagement patterns:', error);
    return NextResponse.json(
      { 
        data: [], 
        success: false, 
        error: 'Failed to fetch engagement patterns' 
      },
      { status: 500 }
    );
  }
}