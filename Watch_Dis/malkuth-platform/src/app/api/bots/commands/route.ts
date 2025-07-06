import { NextResponse } from 'next/server'
import { botManager } from '@/lib/bots'
import { getPublishedProjects } from '@/lib/storage'

// POST /api/bots/commands - Execute multiple bot commands or batch operations
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Handle different command types
    if (body.type === 'engage_project') {
      // Engage all active bots with a specific project
      const { projectId, intensity = 'normal' } = body
      
      if (!projectId) {
        return NextResponse.json(
          { error: 'projectId is required for engage_project command' },
          { status: 400 }
        )
      }
      
      const activeBots = botManager.getActiveBots()
      const results = []
      
      for (const bot of activeBots) {
        // Adjust engagement based on intensity
        const command = {
          botId: bot.id,
          action: intensity === 'high' ? 'engage_all' : 'simulate_activity',
          projectId
        }
        
        const success = await botManager.executeCommand(command)
        results.push({ botId: bot.id, success })
      }
      
      return NextResponse.json({
        success: true,
        message: `Engaged ${activeBots.length} bots with project ${projectId}`,
        results
      })
    }
    
    if (body.type === 'engage_all_projects') {
      // Engage bots with all published projects
      const { intensity = 'normal' } = body
      
      const projects = await getPublishedProjects()
      const activeBots = botManager.getActiveBots()
      const results = []
      
      for (const project of projects) {
        for (const bot of activeBots) {
          const command = {
            botId: bot.id,
            action: intensity === 'high' ? 'engage_all' : 'simulate_activity',
            projectId: project.id
          }
          
          const success = await botManager.executeCommand(command)
          results.push({ botId: bot.id, projectId: project.id, success })
        }
      }
      
      return NextResponse.json({
        success: true,
        message: `Engaged ${activeBots.length} bots with ${projects.length} projects`,
        results
      })
    }
    
    if (body.type === 'batch_commands') {
      // Execute multiple individual commands
      const { commands } = body
      
      if (!Array.isArray(commands)) {
        return NextResponse.json(
          { error: 'commands must be an array' },
          { status: 400 }
        )
      }
      
      const results = []
      
      for (const command of commands) {
        const success = await botManager.executeCommand(command)
        results.push({ command, success })
      }
      
      return NextResponse.json({
        success: true,
        message: `Executed ${commands.length} commands`,
        results
      })
    }
    
    if (body.type === 'set_bot_states') {
      // Activate/deactivate multiple bots
      const { bots } = body
      
      if (!Array.isArray(bots)) {
        return NextResponse.json(
          { error: 'bots must be an array of {botId, active} objects' },
          { status: 400 }
        )
      }
      
      const results = []
      
      for (const { botId, active } of bots) {
        const command = {
          botId,
          action: 'set_active',
          params: { active }
        }
        
        const success = await botManager.executeCommand(command)
        results.push({ botId, active, success })
      }
      
      return NextResponse.json({
        success: true,
        message: `Updated ${bots.length} bot states`,
        results
      })
    }
    
    return NextResponse.json(
      { error: 'Unknown command type. Supported types: engage_project, engage_all_projects, batch_commands, set_bot_states' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Error executing bot commands:', error)
    return NextResponse.json(
      { error: 'Failed to execute bot commands' },
      { status: 500 }
    )
  }
}