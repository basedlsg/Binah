import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { MainLayout } from './MainLayout';
import { BreadcrumbItem } from './Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
}

const DashboardLayout = ({
  children,
  title,
  description,
  className,
  breadcrumbs,
  actions
}: DashboardLayoutProps) => {
  return (
    <MainLayout breadcrumbs={breadcrumbs} className={className}>
      {/* Dashboard Header */}
      {(title || description || actions) && (
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h1 className="text-3xl font-bold text-white mb-2">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-gray-400">
                  {description}
                </p>
              )}
            </div>
            
            {actions && (
              <div className="flex items-center gap-3">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Dashboard Content */}
      <div className={cn('space-y-6', className)}>
        {children}
      </div>
    </MainLayout>
  );
};

// Dashboard-specific components
const DashboardGrid = ({ 
  children, 
  className,
  cols = 'auto'
}: { 
  children: ReactNode; 
  className?: string;
  cols?: 'auto' | 1 | 2 | 3 | 4 | 6 | 12;
}) => {
  const gridCols = {
    'auto': 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3',
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
    12: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-12'
  };
  
  return (
    <div className={cn('grid gap-6', gridCols[cols], className)}>
      {children}
    </div>
  );
};

const DashboardCard = ({ 
  title, 
  children, 
  className,
  actions,
  ...props 
}: { 
  title?: string; 
  children: ReactNode; 
  className?: string;
  actions?: ReactNode;
}) => {
  return (
    <Card className={cn('h-fit', className)} {...props}>
      {title && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-medium">
            {title}
          </CardTitle>
          {actions}
        </CardHeader>
      )}
      <CardContent className={title ? 'pt-0' : ''}>
        {children}
      </CardContent>
    </Card>
  );
};

const DashboardMetric = ({
  label,
  value,
  change,
  changeType = 'neutral',
  icon,
  className
}: {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: ReactNode;
  className?: string;
}) => {
  const changeColors = {
    positive: 'text-green-500',
    negative: 'text-red-500',
    neutral: 'text-gray-400'
  };
  
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{label}</p>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        {change && (
          <p className={cn('text-sm', changeColors[changeType])}>
            {change}
          </p>
        )}
      </div>
    </div>
  );
};

DashboardLayout.displayName = 'DashboardLayout';
DashboardGrid.displayName = 'DashboardGrid';
DashboardCard.displayName = 'DashboardCard';
DashboardMetric.displayName = 'DashboardMetric';

export { 
  DashboardLayout, 
  DashboardGrid, 
  DashboardCard, 
  DashboardMetric,
  type DashboardLayoutProps 
};