'use client'

import React, { useState, useEffect } from 'react'
import PageLayout from '@/components/ui/templates/PageLayout'
import BotCard from '@/components/ui/molecules/BotCard'
import Card from '@/components/ui/molecules/Card'
import Button from '@/components/ui/atoms/Button'
import Typography from '@/components/ui/atoms/Typography'

interface BotPersonality {
  id: string
  name: string
  avatar: string
  personality: string
  engagementStyle: 'enthusiastic' | 'analytical' | 'artistic' | 'casual' | 'philosophical'
  viewProbability: number
  likeProbability: number
  commentProbability: number
  preferredTypes: Array<'image' | 'video' | 'document' | 'audio'>
  active: boolean
}

interface BotActivity {
  id: string
  botId: string
  projectId: string
  action: 'view' | 'like' | 'comment'
  timestamp: string
  content?: string
}

interface Project {
  id: string
  title: string
  published: boolean
}

export default function BotManagementPage() {
  const [bots, setBots] = useState<BotPersonality[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [activity, setActivity] = useState<BotActivity[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [commandOutput, setCommandOutput] = useState<string>('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      await Promise.all([
        fetchBots(),
        fetchProjects(),
        fetchActivity()
      ])
      setLoading(false)
    }
    fetchData()
  }, [])

  const fetchBots = async () => {
    try {
      const response = await fetch('/api/bots')
      if (response.ok) {
        const data = await response.json()
        setBots(data)
      }
    } catch (error) {
      console.error('Error fetching bots:', error)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/admin/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const fetchActivity = async () => {
    try {
      const response = await fetch('/api/bots/activity')
      if (response.ok) {
        const data = await response.json()
        setActivity(data)
      }
    } catch (error) {
      console.error('Error fetching activity:', error)
    }
  }

  const executeCommand = async (command: any) => {
    setIsExecuting(true)
    try {
      const response = await fetch('/api/bots/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command)
      })
      
      const result = await response.json()
      setCommandOutput(JSON.stringify(result, null, 2))
      
      // Refresh data after command execution
      await Promise.all([fetchBots(), fetchActivity()])
      
    } catch (error) {
      setCommandOutput(`Error: ${error}`)
    } finally {
      setIsExecuting(false)
    }
  }

  const toggleBotActive = async (botId: string, active: boolean) => {
    await executeCommand({
      type: 'set_bot_states',
      bots: [{ botId, active }]
    })
  }

  const engageProject = async (projectId: string, intensity: 'normal' | 'high' = 'normal') => {
    await executeCommand({
      type: 'engage_project',
      projectId,
      intensity
    })
  }

  const engageAllProjects = async (intensity: 'normal' | 'high' = 'normal') => {
    await executeCommand({
      type: 'engage_all_projects',
      intensity
    })
  }

  const activeBots = bots.filter(bot => bot.active)
  const publishedProjects = projects.filter(p => p.published)
  const recentActivity = activity.slice(0, 10)

  if (loading) {
    return (
      <PageLayout
        title="BOT MANAGEMENT"
        subtitle="AI Engagement Control Center"
        headerActions={
          <Button variant="secondary" size="sm" onClick={() => window.location.href = '/admin'}>
            Back to Admin
          </Button>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-800 rounded-xl p-6 h-64" />
            </div>
          ))}
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="BOT MANAGEMENT"
      subtitle="AI Engagement Control Center"
      headerActions={
        <div className="flex items-center space-x-3">
          <div className="hidden sm:block text-right">
            <Typography variant="small" color="secondary">
              {activeBots.length}/{bots.length} bots active
            </Typography>
            <Typography variant="caption" color="muted">
              {publishedProjects.length} published projects
            </Typography>
          </div>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => window.location.href = '/admin'}
          >
            Back to Admin
          </Button>
        </div>
      }
      maxWidth="2xl"
    >
      {/* Quick Actions */}
      <Card className="mb-8" padding="lg">
        <div className="mb-6">
          <Typography variant="h3" className="mb-2">
            Quick Actions
          </Typography>
          <Typography variant="body" color="secondary">
            Execute commands to control bot engagement across your projects
          </Typography>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Button
            onClick={() => engageAllProjects('normal')}
            loading={isExecuting}
            variant="primary"
            className="h-12"
          >
            🤖 Engage All Projects
          </Button>
          <Button
            onClick={() => engageAllProjects('high')}
            loading={isExecuting}
            variant="secondary"
            className="h-12"
          >
            🔥 High Intensity
          </Button>
          <Button
            onClick={fetchActivity}
            loading={isExecuting}
            variant="outline"
            className="h-12"
          >
            🔄 Refresh Activity
          </Button>
          <Button
            onClick={() => setCommandOutput('')}
            variant="ghost"
            className="h-12"
          >
            🗑️ Clear Output
          </Button>
        </div>

        {/* Project Selector */}
        {publishedProjects.length > 0 && (
          <div className="border-t border-gray-800 pt-6">
            <Typography variant="h6" className="mb-3">
              Project-Specific Actions
            </Typography>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              >
                <option value="">Select a project...</option>
                {publishedProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
              <Button
                onClick={() => selectedProject && engageProject(selectedProject, 'normal')}
                disabled={!selectedProject || isExecuting}
                variant="primary"
              >
                Engage Selected
              </Button>
              <Button
                onClick={() => selectedProject && engageProject(selectedProject, 'high')}
                disabled={!selectedProject || isExecuting}
                variant="secondary"
              >
                High Intensity
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Bots Grid */}
        <div className="xl:col-span-2">
          <div className="mb-6">
            <Typography variant="h3" className="mb-2">
              AI Bots ({activeBots.length} active)
            </Typography>
            <Typography variant="body" color="secondary">
              Manage your AI personalities and their engagement patterns
            </Typography>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {bots.map((bot) => (
              <BotCard
                key={bot.id}
                id={bot.id}
                name={bot.name}
                avatar={bot.avatar}
                personality={bot.personality}
                engagementStyle={bot.engagementStyle}
                viewProbability={bot.viewProbability}
                likeProbability={bot.likeProbability}
                commentProbability={bot.commentProbability}
                preferredTypes={bot.preferredTypes}
                active={bot.active}
                onToggleActive={toggleBotActive}
              />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Activity Log */}
          <Card padding="md">
            <Typography variant="h6" className="mb-4">
              Recent Bot Activity
            </Typography>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentActivity.length > 0 ? (
                recentActivity.map((activityItem) => {
                  const bot = bots.find(b => b.id === activityItem.botId)
                  const project = projects.find(p => p.id === activityItem.projectId)
                  return (
                    <div key={activityItem.id} className="bg-gray-800 rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <Typography variant="small" color="primary">
                          {bot?.name || 'Unknown Bot'}
                        </Typography>
                        <Typography variant="caption" color="muted">
                          {new Date(activityItem.timestamp).toLocaleTimeString()}
                        </Typography>
                      </div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-1 rounded text-xs ${
                          activityItem.action === 'view' ? 'bg-blue-600/20 text-blue-400' :
                          activityItem.action === 'like' ? 'bg-green-600/20 text-green-400' :
                          'bg-purple-600/20 text-purple-400'
                        }`}>
                          {activityItem.action}
                        </span>
                        <Typography variant="caption" color="secondary">
                          {project?.title || 'Unknown Project'}
                        </Typography>
                      </div>
                      {activityItem.content && (
                        <Typography variant="caption" color="muted" className="italic">
                          "{activityItem.content}"
                        </Typography>
                      )}
                    </div>
                  )
                })
              ) : (
                <Typography variant="small" color="muted" className="text-center py-4">
                  No recent activity
                </Typography>
              )}
            </div>
          </Card>

          {/* Stats */}
          <Card padding="md">
            <Typography variant="h6" className="mb-4">
              Bot Statistics
            </Typography>
            <div className="space-y-4">
              <div className="flex justify-between">
                <Typography variant="small" color="secondary">
                  Total Bots
                </Typography>
                <Typography variant="small" weight="medium">
                  {bots.length}
                </Typography>
              </div>
              <div className="flex justify-between">
                <Typography variant="small" color="secondary">
                  Active Bots
                </Typography>
                <Typography variant="small" weight="medium" color="accent">
                  {activeBots.length}
                </Typography>
              </div>
              <div className="flex justify-between">
                <Typography variant="small" color="secondary">
                  Published Projects
                </Typography>
                <Typography variant="small" weight="medium">
                  {publishedProjects.length}
                </Typography>
              </div>
              <div className="flex justify-between">
                <Typography variant="small" color="secondary">
                  Total Activity
                </Typography>
                <Typography variant="small" weight="medium">
                  {activity.length}
                </Typography>
              </div>
            </div>
          </Card>

          {/* Command Output */}
          {commandOutput && (
            <Card padding="md">
              <div className="flex items-center justify-between mb-3">
                <Typography variant="h6">
                  Command Output
                </Typography>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setCommandOutput('')}
                >
                  Clear
                </Button>
              </div>
              <pre className="bg-black rounded-lg p-3 text-xs text-green-400 overflow-x-auto max-h-32">
                {commandOutput}
              </pre>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  )
}