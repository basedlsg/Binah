'use client';

import React from 'react';

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: string;
  description?: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  format?: 'number' | 'percentage' | 'currency' | 'time';
  loading?: boolean;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  description,
  className = '',
  size = 'medium',
  format = 'number',
  loading = false,
  onClick
}) => {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'currency':
        return `$${val.toLocaleString()}`;
      case 'time':
        if (val < 1000) return `${val}ms`;
        if (val < 60000) return `${(val / 1000).toFixed(1)}s`;
        return `${(val / 60000).toFixed(1)}m`;
      case 'number':
      default:
        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
        return val.toLocaleString();
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase': return '↗';
      case 'decrease': return '↘';
      default: return '→';
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'increase': return 'text-green-400';
      case 'decrease': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'p-4',
          title: 'text-sm',
          value: 'text-xl',
          change: 'text-xs',
          icon: 'text-lg'
        };
      case 'large':
        return {
          container: 'p-8',
          title: 'text-lg',
          value: 'text-4xl',
          change: 'text-base',
          icon: 'text-3xl'
        };
      case 'medium':
      default:
        return {
          container: 'p-6',
          title: 'text-sm',
          value: 'text-2xl',
          change: 'text-sm',
          icon: 'text-2xl'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  if (loading) {
    return (
      <div className={`bg-gray-900 border border-gray-800 rounded animate-pulse ${sizeClasses.container} ${className}`}>
        <div className="flex justify-between items-start mb-4">
          <div className={`bg-gray-800 rounded w-24 h-4`}></div>
          {icon && <div className={`bg-gray-800 rounded w-8 h-8`}></div>}
        </div>
        <div className={`bg-gray-800 rounded w-16 h-8 mb-2`}></div>
        <div className={`bg-gray-800 rounded w-20 h-3`}></div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-gray-900 border border-gray-800 rounded transition-all hover:border-gray-700 ${
        onClick ? 'cursor-pointer hover:bg-gray-800/50' : ''
      } ${sizeClasses.container} ${className}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <h3 className={`font-medium text-gray-400 ${sizeClasses.title}`}>
          {title}
        </h3>
        {icon && (
          <span className={`${sizeClasses.icon}`}>
            {icon}
          </span>
        )}
        {change !== undefined && (
          <span className={`${getChangeColor()} ${sizeClasses.change}`}>
            {getChangeIcon()}
          </span>
        )}
      </div>

      {/* Value */}
      <div className={`font-bold text-white mb-2 ${sizeClasses.value}`}>
        {formatValue(value)}
      </div>

      {/* Change and Description */}
      <div className="flex items-center justify-between">
        {change !== undefined && (
          <div className={`${getChangeColor()} ${sizeClasses.change} font-medium`}>
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </div>
        )}
        {description && (
          <div className={`text-gray-500 ${sizeClasses.change} ${change !== undefined ? '' : 'w-full'}`}>
            {description}
          </div>
        )}
      </div>
    </div>
  );
};

// Skeleton component for loading states
export const MetricCardSkeleton: React.FC<{ size?: 'small' | 'medium' | 'large' }> = ({ 
  size = 'medium' 
}) => {
  return <MetricCard title="" value="" loading size={size} />;
};

// Grid component for multiple metric cards
export const MetricGrid: React.FC<{
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'small' | 'medium' | 'large';
  className?: string;
}> = ({ 
  children, 
  cols = 4, 
  gap = 'medium',
  className = '' 
}) => {
  const getGridClasses = () => {
    const colsClass = `grid-cols-1 md:grid-cols-2 lg:grid-cols-${cols}`;
    const gapClass = gap === 'small' ? 'gap-4' : gap === 'large' ? 'gap-8' : 'gap-6';
    return `grid ${colsClass} ${gapClass}`;
  };

  return (
    <div className={`${getGridClasses()} ${className}`}>
      {children}
    </div>
  );
};

export default MetricCard;