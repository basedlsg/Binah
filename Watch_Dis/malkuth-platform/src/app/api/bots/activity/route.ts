import { NextResponse } from 'next/server'
import { botManager } from '@/lib/bots'

// GET /api/bots/activity - Get bot activity log
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    
    let activities
    if (projectId) {
      activities = botManager.getProjectActivity(projectId)
    } else {
      activities = botManager.getActivityLog()
    }
    
    return NextResponse.json(activities)
  } catch (error) {
    console.error('Error fetching bot activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bot activity' },
      { status: 500 }
    )
  }
}