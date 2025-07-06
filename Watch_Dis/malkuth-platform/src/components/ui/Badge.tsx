import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md',
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center rounded-full font-medium transition-colors';
    
    const variants = {
      default: 'bg-white text-black',
      secondary: 'bg-gray-800 text-gray-200 border border-gray-700',
      outline: 'border border-white/20 bg-transparent text-white',
      destructive: 'bg-red-600 text-white',
      success: 'bg-green-600 text-white',
      warning: 'bg-yellow-600 text-black',
      info: 'bg-blue-600 text-white'
    };
    
    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-1.5 text-base'
    };
    
    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge, type BadgeProps };