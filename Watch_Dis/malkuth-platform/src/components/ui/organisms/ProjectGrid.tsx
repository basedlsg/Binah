import React from 'react'
import { cn } from '@/lib/utils'
import ProjectCard from '../molecules/ProjectCard'
import Typography from '../atoms/Typography'

interface Project {
  id: string
  title: string
  subtitle?: string
  description: string
  type: 'image' | 'video' | 'document' | 'audio'
  thumbnail: string
  mediaUrl?: string
  duration?: string
  creator: string
  creatorAvatar: string
  uploadTime: string
  views: number
  likes: number
  comments: number
  botEngagements: number
  published: boolean
}

interface ProjectGridProps {
  projects: Project[]
  loading?: boolean
  error?: string
  emptyMessage?: string
  className?: string
  showAdminActions?: boolean
  onProjectEdit?: (project: Project) => void
  onProjectDelete?: (projectId: string) => void
  onProjectPublish?: (projectId: string) => void
}

const ProjectGrid = React.forwardRef<HTMLDivElement, ProjectGridProps>(
  ({ 
    projects, 
    loading = false, 
    error,
    emptyMessage = "No projects found",
    className,
    showAdminActions = false,
    onProjectEdit,
    onProjectDelete,
    onProjectPublish,
    ...props 
  }, ref) => {
    
    // Loading skeleton
    if (loading) {
      return (
        <div 
          ref={ref}
          className={cn(
            'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
            className
          )}
          {...props}
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-800 rounded-xl overflow-hidden">
                <div className="aspect-video bg-gray-700" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-700 rounded w-3/4" />
                  <div className="h-4 bg-gray-700 rounded w-1/2" />
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-700 rounded" />
                    <div className="h-3 bg-gray-700 rounded w-2/3" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-3 bg-gray-700 rounded w-20" />
                    <div className="h-3 bg-gray-700 rounded w-16" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    // Error state
    if (error) {
      return (
        <div ref={ref} className={cn('text-center py-12', className)} {...props}>
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-600/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <Typography variant="h4" color="primary" className="mb-2">
              Error Loading Projects
            </Typography>
            <Typography variant="body" color="muted">
              {error}
            </Typography>
          </div>
        </div>
      )
    }

    // Empty state
    if (!projects || projects.length === 0) {
      return (
        <div ref={ref} className={cn('text-center py-12', className)} {...props}>
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
              <span className="text-4xl opacity-50">📂</span>
            </div>
            <Typography variant="h4" color="primary" className="mb-2">
              {emptyMessage}
            </Typography>
            <Typography variant="body" color="muted">
              Start creating your first project to see it appear here.
            </Typography>
          </div>
        </div>
      )
    }

    // Projects grid
    return (
      <div 
        ref={ref}
        className={cn(
          // Responsive grid with proper spacing
          'grid gap-6',
          // Mobile: 1 column
          'grid-cols-1',
          // Small screens: 2 columns  
          'sm:grid-cols-2',
          // Medium screens: 3 columns
          'md:grid-cols-2 lg:grid-cols-3',
          // Large screens: 4 columns
          'xl:grid-cols-4',
          // Extra large: 5 columns
          '2xl:grid-cols-5',
          className
        )}
        {...props}
      >
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            id={project.id}
            title={project.title}
            subtitle={project.subtitle}
            description={project.description}
            thumbnail={project.thumbnail}
            type={project.type}
            duration={project.duration}
            creator={project.creator}
            uploadTime={project.uploadTime}
            views={project.views}
            likes={project.likes}
            comments={project.comments}
            published={showAdminActions ? project.published : undefined}
            onEdit={showAdminActions && onProjectEdit ? () => onProjectEdit(project) : undefined}
            onDelete={showAdminActions && onProjectDelete ? () => onProjectDelete(project.id) : undefined}
            onPublish={showAdminActions && onProjectPublish && !project.published ? () => onProjectPublish(project.id) : undefined}
          />
        ))}
      </div>
    )
  }
)

ProjectGrid.displayName = 'ProjectGrid'

export default ProjectGrid