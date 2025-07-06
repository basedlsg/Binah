'use client'

import { useState, useEffect } from 'react'
import PageLayout from '@/components/ui/templates/PageLayout'
import ProjectGrid from '@/components/ui/organisms/ProjectGrid'
import Button from '@/components/ui/atoms/Button'
import Typography from '@/components/ui/atoms/Typography'

interface Project {
  id: string
  title: string
  subtitle?: string
  description: string
  type: 'image' | 'video' | 'document' | 'audio'
  thumbnail: string
  mediaUrl?: string
  duration?: string
  uploadTime: string
  views: number
  likes: number
  comments: number
  botEngagements: number
  creator: string
  creatorAvatar: string
  published: boolean
}

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/projects')
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
      const data = await response.json()
      setProjects(data)
    } catch (err) {
      setError('Failed to load projects. Please try again.')
      console.error('Error fetching projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleProjectClick = async (project: Project) => {
    // Increment view count
    try {
      await fetch(`/api/projects/${project.id}`, { method: 'GET' })
      // Update local state
      setProjects(prev => prev.map(p => 
        p.id === project.id ? { ...p, views: p.views + 1 } : p
      ))
    } catch (err) {
      console.error('Error incrementing views:', err)
    }
  }

  const handleRetry = () => {
    fetchProjects()
  }

  return (
    <PageLayout
      title="MALKUTH"
      subtitle="Personal Creative Platform"
      headerActions={
        <div className="flex items-center space-x-3">
          <div className="hidden sm:block text-right">
            <Typography variant="small" color="secondary">
              {projects.length} projects
            </Typography>
            <Typography variant="caption" color="muted">
              🤖 AI Engaged
            </Typography>
          </div>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => window.location.href = '/admin'}
          >
            Admin
          </Button>
        </div>
      }
      maxWidth="2xl"
    >
      {/* Hero section */}
      <div className="mb-12 text-center">
        <Typography variant="h2" className="mb-4">
          Welcome to My Creative Universe
        </Typography>
        <Typography variant="body" color="secondary" className="max-w-2xl mx-auto">
          Explore my latest projects, creative works, and experiments. 
          Each piece tells a story, engages minds, and pushes creative boundaries.
        </Typography>
      </div>

      {/* Projects section */}
      <div className="space-y-8">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <div>
            <Typography variant="h3" className="mb-2">
              Featured Projects
            </Typography>
            <Typography variant="small" color="secondary">
              Discover my latest creative works and experiments
            </Typography>
          </div>
          
          {/* Refresh button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchProjects}
            loading={loading}
            className="hidden sm:flex"
          >
            Refresh
          </Button>
        </div>

        {/* Projects grid */}
        <ProjectGrid
          projects={projects}
          loading={loading}
          error={error}
          emptyMessage="No projects published yet"
          className="min-h-96"
        />

        {/* Error retry */}
        {error && !loading && (
          <div className="text-center py-8">
            <Button variant="primary" onClick={handleRetry}>
              Try Again
            </Button>
          </div>
        )}
      </div>

      {/* Stats section */}
      {projects.length > 0 && !loading && (
        <div className="mt-16 pt-8 border-t border-gray-800">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <Typography variant="h4" color="accent">
                {projects.length}
              </Typography>
              <Typography variant="small" color="muted">
                Projects Published
              </Typography>
            </div>
            <div className="space-y-2">
              <Typography variant="h4" color="accent">
                {projects.reduce((sum, project) => sum + project.views, 0)}
              </Typography>
              <Typography variant="small" color="muted">
                Total Views
              </Typography>
            </div>
            <div className="space-y-2">
              <Typography variant="h4" color="accent">
                {projects.reduce((sum, project) => sum + project.likes, 0)}
              </Typography>
              <Typography variant="small" color="muted">
                Total Likes
              </Typography>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}