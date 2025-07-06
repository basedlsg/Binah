import React from 'react'
import { cn } from '@/lib/utils'
import Card from './Card'
import Typography from '../atoms/Typography'
import Button from '../atoms/Button'

interface BotCardProps {
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
  onToggleActive?: (botId: string, active: boolean) => void
  className?: string
}

const BotCard = React.forwardRef<HTMLDivElement, BotCardProps>(
  ({ 
    id,
    name,
    avatar,
    personality,
    engagementStyle,
    viewProbability,
    likeProbability,
    commentProbability,
    preferredTypes,
    active,
    onToggleActive,
    className,
    ...props 
  }, ref) => {
    const getEngagementColor = (style: string) => {
      const colors = {
        enthusiastic: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
        analytical: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
        artistic: 'bg-purple-600/20 text-purple-400 border-purple-600/30',
        casual: 'bg-green-600/20 text-green-400 border-green-600/30',
        philosophical: 'bg-indigo-600/20 text-indigo-400 border-indigo-600/30'
      }
      return colors[style as keyof typeof colors] || 'bg-gray-600/20 text-gray-400 border-gray-600/30'
    }

    const formatPercentage = (value: number) => Math.round(value * 100)

    return (
      <Card
        ref={ref}
        variant="default"
        padding="md"
        hoverable
        className={cn('group', className)}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-xl">🤖</span>
            </div>
            <div>
              <Typography variant="h6" className="group-hover:text-blue-400 transition-colors">
                {name}
              </Typography>
              <div className="flex items-center space-x-2 mt-1">
                <span className={cn(
                  'px-2 py-1 rounded text-xs font-medium border',
                  getEngagementColor(engagementStyle)
                )}>
                  {engagementStyle}
                </span>
                <span className={cn(
                  'px-2 py-1 rounded text-xs font-medium',
                  active 
                    ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
                    : 'bg-red-600/20 text-red-400 border border-red-600/30'
                )}>
                  {active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
          
          {onToggleActive && (
            <Button
              size="sm"
              variant={active ? "destructive" : "primary"}
              onClick={() => onToggleActive(id, !active)}
            >
              {active ? 'Deactivate' : 'Activate'}
            </Button>
          )}
        </div>

        {/* Personality */}
        <Typography variant="small" color="muted" className="mb-4">
          {personality}
        </Typography>

        {/* Engagement Stats */}
        <div className="space-y-3 mb-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <Typography variant="small" color="secondary">
                View Probability
              </Typography>
              <Typography variant="small" weight="medium">
                {formatPercentage(viewProbability)}%
              </Typography>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${formatPercentage(viewProbability)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <Typography variant="small" color="secondary">
                Like Probability
              </Typography>
              <Typography variant="small" weight="medium">
                {formatPercentage(likeProbability)}%
              </Typography>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${formatPercentage(likeProbability)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <Typography variant="small" color="secondary">
                Comment Probability
              </Typography>
              <Typography variant="small" weight="medium">
                {formatPercentage(commentProbability)}%
              </Typography>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${formatPercentage(commentProbability)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Preferred Types */}
        <div>
          <Typography variant="small" color="secondary" className="mb-2">
            Preferred Content Types
          </Typography>
          <div className="flex flex-wrap gap-1">
            {preferredTypes.map((type) => (
              <span
                key={type}
                className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs capitalize border border-gray-700"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </Card>
    )
  }
)

BotCard.displayName = 'BotCard'

export default BotCard