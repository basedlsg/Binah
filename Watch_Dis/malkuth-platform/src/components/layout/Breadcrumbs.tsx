import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface BreadcrumbsProps extends HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
}

const Breadcrumbs = ({ 
  className, 
  items, 
  separator,
  ...props 
}: BreadcrumbsProps) => {
  const defaultSeparator = (
    <svg
      className="h-4 w-4 text-gray-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
  
  return (
    <nav
      className={cn('flex items-center space-x-2 text-sm', className)}
      aria-label="Breadcrumb"
      {...props}
    >
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          {index > 0 && (
            <span className="flex-shrink-0">
              {separator || defaultSeparator}
            </span>
          )}
          
          {item.href && !item.isActive ? (
            <a
              href={item.href}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span
              className={cn(
                item.isActive 
                  ? 'text-white font-medium' 
                  : 'text-gray-400'
              )}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
};

Breadcrumbs.displayName = 'Breadcrumbs';

export { Breadcrumbs, type BreadcrumbsProps, type BreadcrumbItem };