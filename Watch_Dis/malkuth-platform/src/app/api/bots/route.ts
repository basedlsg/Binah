import { NextResponse } from 'next/server'
import { botManager } from '@/lib/bots'

// GET /api/bots - Get all bots
export async function GET() {
  try {
    const bots = botManager.getBots()
    return NextResponse.json(bots)
  } catch (error) {
    console.error('Error fetching bots:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bots' },
      { status: 500 }
    )
  }
}

// POST /api/bots - Execute bot command
export async function POST(request: Request) {
  try {
    const command = await request.json()
    
    // Validate command structure
    if (!command.botId || !command.action) {
      return NextResponse.json(
        { error: 'Invalid command: botId and action are required' },
        { status: 400 }
      )
    }

    const success = await botManager.executeCommand(command)
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: `Command ${command.action} executed successfully for bot ${command.botId}` 
      })
    } else {
      return NextResponse.json(
        { error: 'Command execution failed' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error executing bot command:', error)
    return NextResponse.json(
      { error: 'Failed to execute bot command' },
      { status: 500 }
    )
  }
}