import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface VisuallyHiddenProps extends HTMLAttributes<HTMLSpanElement> {
  asChild?: boolean;
}

const VisuallyHidden = forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'div' : 'span';
    
    return (
      <Comp
        ref={ref}
        className={cn('sr-only', className)}
        {...props}
      />
    );
  }
);

VisuallyHidden.displayName = 'VisuallyHidden';

export { VisuallyHidden, type VisuallyHiddenProps };