import React from 'react'
import { cn } from '@/lib/utils'

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'small' | 'caption'
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold'
  color?: 'primary' | 'secondary' | 'muted' | 'white' | 'accent'
  as?: React.ElementType
  children: React.ReactNode
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant = 'body', weight = 'normal', color = 'primary', as, children, ...props }, ref) => {
    const variants = {
      h1: 'text-4xl font-bold leading-tight',
      h2: 'text-3xl font-semibold leading-tight',
      h3: 'text-2xl font-semibold leading-snug',
      h4: 'text-xl font-medium leading-snug',
      h5: 'text-lg font-medium leading-normal',
      h6: 'text-base font-medium leading-normal',
      body: 'text-base leading-relaxed',
      small: 'text-sm leading-normal',
      caption: 'text-xs leading-normal'
    }
    
    const weights = {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold'
    }
    
    const colors = {
      primary: 'text-white',
      secondary: 'text-gray-300',
      muted: 'text-gray-500',
      white: 'text-white',
      accent: 'text-blue-400'
    }
    
    const defaultTags = {
      h1: 'h1',
      h2: 'h2',
      h3: 'h3',
      h4: 'h4',
      h5: 'h5',
      h6: 'h6',
      body: 'p',
      small: 'span',
      caption: 'span'
    }
    
    const Component = as || defaultTags[variant]
    
    return React.createElement(
      Component,
      {
        ref,
        className: cn(
          variants[variant],
          weights[weight],
          colors[color],
          className
        ),
        ...props
      },
      children
    )
  }
)

Typography.displayName = 'Typography'

export default Typography