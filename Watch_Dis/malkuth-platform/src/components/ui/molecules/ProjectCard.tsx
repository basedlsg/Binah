import React from 'react'
import { cn } from '@/lib/utils'
import Card from './Card'
import Typography from '../atoms/Typography'
import Button from '../atoms/Button'

interface ProjectCardProps {
  id: string
  title: string
  subtitle?: string
  description: string
  thumbnail: string
  type: 'image' | 'video' | 'document' | 'audio'
  duration?: string
  creator: string
  uploadTime: string
  views: number
  likes: number
  comments: number
  published?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onPublish?: () => void
  className?: string
}

const ProjectCard = React.forwardRef<HTMLDivElement, ProjectCardProps>(
  ({ 
    id,
    title, 
    subtitle, 
    description, 
    thumbnail, 
    type, 
    duration, 
    creator, 
    uploadTime, 
    views, 
    likes, 
    comments,
    published = false,
    onEdit,
    onDelete,
    onPublish,
    className,
    ...props 
  }, ref) => {
    const typeIcons = {
      image: '🖼️',
      video: '🎬',
      document: '📄',
      audio: '🎵'
    }

    const formatTime = (time: string) => {
      return new Date(time).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }

    const formatNumber = (num: number) => {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M'
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K'
      }
      return num.toString()
    }

    return (
      <Card
        ref={ref}
        variant="default"
        padding="none"
        hoverable
        className={cn('group', className)}
        {...props}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-800 overflow-hidden">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <span className="text-6xl opacity-40">
                {typeIcons[type]}
              </span>
            </div>
          )}
          
          {/* Duration overlay for video/audio */}
          {duration && (type === 'video' || type === 'audio') && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium">
              {duration}
            </div>
          )}
          
          {/* Type indicator */}
          <div className="absolute top-2 left-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium capitalize">
            {type}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title and subtitle */}
          <div>
            <Typography variant="h6" className="line-clamp-2 group-hover:text-blue-400 transition-colors">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="small" color="secondary" className="line-clamp-1 mt-1">
                {subtitle}
              </Typography>
            )}
          </div>

          {/* Description */}
          <Typography variant="small" color="muted" className="line-clamp-2">
            {description}
          </Typography>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center space-x-4">
              <span>{formatNumber(views)} views</span>
              <span>{formatNumber(likes)} likes</span>
              <span>{formatNumber(comments)} comments</span>
            </div>
            <span>{formatTime(uploadTime)}</span>
          </div>

          {/* Creator */}
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-xs">👤</span>
            </div>
            <Typography variant="small" color="secondary">
              {creator}
            </Typography>
          </div>

          {/* Status badge */}
          {published !== undefined && (
            <div className="flex items-center justify-between">
              <span className={cn(
                'px-2 py-1 rounded text-xs font-medium',
                published 
                  ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
                  : 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30'
              )}>
                {published ? 'Published' : 'Draft'}
              </span>
            </div>
          )}

          {/* Admin actions */}
          {(onEdit || onDelete || onPublish) && (
            <div className="flex gap-2 pt-2 border-t border-gray-800">
              {onPublish && !published && (
                <Button size="sm" variant="primary" onClick={onPublish} className="flex-1">
                  Publish
                </Button>
              )}
              {onEdit && (
                <Button size="sm" variant="secondary" onClick={onEdit} className="flex-1">
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button size="sm" variant="destructive" onClick={onDelete} className="flex-1">
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    )
  }
)

ProjectCard.displayName = 'ProjectCard'

export default ProjectCard