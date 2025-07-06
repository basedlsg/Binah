import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SkipLinkProps extends HTMLAttributes<HTMLAnchorElement> {
  href?: string;
  children?: React.ReactNode;
}

const SkipLink = ({ 
  href = '#main-content', 
  children = 'Skip to main content',
  className,
  ...props 
}: SkipLinkProps) => {
  return (
    <a
      href={href}
      className={cn(
        // Hidden by default, visible when focused
        'sr-only focus:not-sr-only',
        // Positioning
        'absolute top-4 left-4 z-50',
        // Styling
        'bg-white text-black px-4 py-2 rounded-md font-medium',
        'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black',
        // Animation
        'transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
};

SkipLink.displayName = 'SkipLink';

export { SkipLink, type SkipLinkProps };