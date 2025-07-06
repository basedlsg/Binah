import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { OwlLogoMinimal } from './icons';

interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'owl' | 'dots' | 'pulse';
  text?: string;
}

const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ 
    className, 
    size = 'md', 
    variant = 'default',
    text,
    ...props 
  }, ref) => {
    const sizes = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12'
    };
    
    const spinners = {
      default: (
        <svg
          className={cn('animate-spin', sizes[size])}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ),
      
      owl: (
        <div className="animate-pulse-glow">
          <OwlLogoMinimal 
            size={size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 48 : 64}
            className="text-white"
          />
        </div>
      ),
      
      dots: (
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'rounded-full bg-current animate-pulse',
                size === 'sm' ? 'h-1.5 w-1.5' : 
                size === 'md' ? 'h-2 w-2' : 
                size === 'lg' ? 'h-3 w-3' : 'h-4 w-4'
              )}
              style={{
                animationDelay: `${i * 0.15}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      ),
      
      pulse: (
        <div className={cn('rounded-full bg-current animate-pulse', sizes[size])} />
      )
    };
    
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center space-y-2 text-gray-400',
          className
        )}
        {...props}
      >
        {spinners[variant]}
        {text && (
          <p className="text-sm animate-pulse">
            {text}
          </p>
        )}
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

export { LoadingSpinner, type LoadingSpinnerProps };