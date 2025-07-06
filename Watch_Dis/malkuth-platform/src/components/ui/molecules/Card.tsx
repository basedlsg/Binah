import React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered' | 'glass'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
  children: React.ReactNode
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', hoverable = false, children, ...props }, ref) => {
    const baseStyles = 'rounded-xl overflow-hidden transition-all duration-200'
    
    const variants = {
      default: 'bg-gray-900 border border-gray-800',
      elevated: 'bg-gray-900 border border-gray-800 shadow-lg',
      bordered: 'bg-gray-900 border-2 border-gray-700',
      glass: 'bg-gray-900/80 backdrop-blur-sm border border-gray-700/50'
    }
    
    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    }
    
    const hoverStyles = hoverable ? 'hover:transform hover:-translate-y-1 hover:shadow-xl hover:border-gray-600 cursor-pointer' : ''
    
    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          paddings[padding],
          hoverStyles,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export default Card