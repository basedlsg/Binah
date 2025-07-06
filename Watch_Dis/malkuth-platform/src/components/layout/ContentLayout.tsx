import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { MainLayout } from './MainLayout';
import { BreadcrumbItem } from './Breadcrumbs';

interface ContentLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
  breadcrumbs?: BreadcrumbItem[];
  sidebar?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  centered?: boolean;
}

const ContentLayout = ({
  children,
  title,
  description,
  className,
  breadcrumbs,
  sidebar,
  maxWidth = 'full',
  centered = false
}: ContentLayoutProps) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-none'
  };
  
  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className={cn(
        'w-full',
        centered && 'mx-auto',
        maxWidthClasses[maxWidth]
      )}>
        {/* Content Header */}
        {(title || description) && (
          <div className="mb-8">
            {title && (
              <h1 className="text-3xl font-bold text-white mb-2">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-gray-400 text-lg">
                {description}
              </p>
            )}
          </div>
        )}
        
        {/* Content Body */}
        <div className={cn(
          sidebar ? 'flex gap-8' : '',
          className
        )}>
          {/* Main Content */}
          <div className={cn(
            'flex-1',
            sidebar && 'min-w-0' // Prevent flex item from overflowing
          )}>
            {children}
          </div>
          
          {/* Sidebar */}
          {sidebar && (
            <aside className="w-64 flex-shrink-0 hidden lg:block">
              {sidebar}
            </aside>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

// Content-specific components
const ContentSection = ({
  title,
  children,
  className,
  id
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) => {
  return (
    <section id={id} className={cn('mb-12', className)}>
      {title && (
        <h2 className="text-2xl font-semibold text-white mb-6 border-b border-gray-800 pb-2">
          {title}
        </h2>
      )}
      <div className="text-gray-200 space-y-4">
        {children}
      </div>
    </section>
  );
};

const ContentSidebar = ({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn('space-y-6', className)}>
      {children}
    </div>
  );
};

const ContentSidebarSection = ({
  title,
  children,
  className
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn('bg-gray-900 rounded-lg border border-gray-800 p-4', className)}>
      {title && (
        <h3 className="text-lg font-medium text-white mb-3">
          {title}
        </h3>
      )}
      <div className="text-gray-300 text-sm space-y-2">
        {children}
      </div>
    </div>
  );
};

const ContentTOC = ({
  items,
  className
}: {
  items: { id: string; title: string; level?: number }[];
  className?: string;
}) => {
  return (
    <ContentSidebarSection title="Table of Contents" className={className}>
      <nav>
        <ul className="space-y-1">
          {items.map((item) => (
            <li
              key={item.id}
              className={cn(
                'text-sm',
                item.level && item.level > 1 && 'ml-4'
              )}
            >
              <a
                href={`#${item.id}`}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </ContentSidebarSection>
  );
};

ContentLayout.displayName = 'ContentLayout';
ContentSection.displayName = 'ContentSection';
ContentSidebar.displayName = 'ContentSidebar';
ContentSidebarSection.displayName = 'ContentSidebarSection';
ContentTOC.displayName = 'ContentTOC';

export { 
  ContentLayout, 
  ContentSection, 
  ContentSidebar, 
  ContentSidebarSection, 
  ContentTOC,
  type ContentLayoutProps 
};