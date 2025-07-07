import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import Typography from '../atoms/Typography'
import Button from '../atoms/Button'
import { Eye, Heart, MessageCircle, MoreVertical } from 'lucide-react'

interface ProjectCardProps {
  id: string
  title: string
  thumbnail: string
  creator: string
  creatorAvatar: string
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
    thumbnail, 
    creator, 
    creatorAvatar,
    views, 
    likes, 
    comments,
    published,
    onEdit,
    onDelete,
    onPublish,
    className,
    ...props 
  }, ref) => {
    const [isHovered, setIsHovered] = useState(false)

    const formatNumber = (num: number) => {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'm'
      if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
      return num.toString()
    }

    return (
      <div
        ref={ref}
        className={cn('group relative overflow-hidden rounded-lg cursor-pointer break-inside-avoid', className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-auto object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
          loading="lazy"
        />

        <div 
          className={cn(
            "absolute bottom-0 left-0 w-full p-4 transition-all duration-300 ease-in-out",
            "bg-gradient-to-t from-black/70 via-black/50 to-transparent",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <Typography variant="h6" className="text-white font-bold truncate">
            {title}
          </Typography>
        </div>

        <div
          className={cn(
            "absolute bottom-0 left-0 w-full p-4 flex justify-between items-center transition-all duration-300 ease-in-out",
            isHovered ? "opacity-0" : "opacity-100"
          )}
        >
          <div className="flex items-center space-x-2">
            <img src={creatorAvatar} alt={creator} className="w-6 h-6 rounded-full border-2 border-white/50" />
            <Typography variant="small" className="text-white font-medium">
              {creator}
            </Typography>
          </div>
          <div className="flex items-center space-x-3 text-white">
            <div className="flex items-center space-x-1">
              <Heart size={14} />
              <Typography variant="small">{formatNumber(likes)}</Typography>
            </div>
            <div className="flex items-center space-x-1">
              <Eye size={14} />
              <Typography variant="small">{formatNumber(views)}</Typography>
            </div>
          </div>
        </div>

        {/* Admin actions - kept separate for clarity */}
        {(onEdit || onDelete || onPublish) && (
          <div className="absolute top-2 right-2">
            <div className="relative">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white hover:bg-black/50">
                <MoreVertical size={16} />
              </Button>
            </div>
          </div>
        )}

      </div>
    )
  }
)

ProjectCard.displayName = 'ProjectCard'

export default ProjectCard