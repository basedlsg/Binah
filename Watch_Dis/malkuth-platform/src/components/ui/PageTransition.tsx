import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/lib/accessibility';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  variant?: 'fade' | 'slideLeft' | 'slideRight' | 'slideUp' | 'slideDown' | 'scale';
  duration?: 'fast' | 'normal' | 'slow';
  delay?: number;
}

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className,
  variant = 'fade',
  duration = 'normal',
  delay = 0
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  
  const durationClasses = {
    fast: 'duration-200',
    normal: 'duration-300',
    slow: 'duration-500'
  };
  
  const variantClasses = {
    fade: 'animate-fade-in',
    slideLeft: 'animate-slide-in-left',
    slideRight: 'animate-slide-in-right',
    slideUp: 'animate-slide-in-up',
    slideDown: 'animate-slide-in-down',
    scale: 'animate-scale-in'
  };
  
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }
  
  return (
    <div
      className={cn(
        'transition-all',
        durationClasses[duration],
        variantClasses[variant],
        className
      )}
      style={{
        animationDelay: delay ? `${delay}ms` : undefined
      }}
    >
      {children}
    </div>
  );
};

export default PageTransition;