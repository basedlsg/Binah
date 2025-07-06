import React from 'react';
import { cn } from '@/lib/utils';

interface OwlLogoProps {
  size?: 'icon' | 'header' | 'landing';
  animated?: boolean;
  className?: string;
}

const OwlLogo: React.FC<OwlLogoProps> = ({ 
  size = 'header', 
  animated = false, 
  className 
}) => {
  const sizeConfig = {
    icon: { width: 24, height: 24 },
    header: { width: 48, height: 48 },
    landing: { width: 120, height: 120 }
  };

  const { width, height } = sizeConfig[size];

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        'transition-all duration-300',
        animated && 'animate-pulse',
        className
      )}
    >
      {/* Owl Body */}
      <ellipse
        cx="60"
        cy="75"
        rx="35"
        ry="45"
        fill="currentColor"
        className={animated ? 'animate-fade-in' : ''}
      />
      
      {/* Owl Head */}
      <circle
        cx="60"
        cy="45"
        r="30"
        fill="currentColor"
        className={animated ? 'animate-fade-in-delay' : ''}
      />
      
      {/* Ear Tufts */}
      <path
        d="M35 25 L40 15 L45 25 Z"
        fill="currentColor"
        className={animated ? 'animate-fade-in-delay' : ''}
      />
      <path
        d="M75 25 L80 15 L85 25 Z"
        fill="currentColor"
        className={animated ? 'animate-fade-in-delay' : ''}
      />
      
      {/* Eyes */}
      <circle
        cx="50"
        cy="42"
        r="8"
        fill="white"
        className={animated ? 'animate-fade-in-delay' : ''}
      />
      <circle
        cx="70"
        cy="42"
        r="8"
        fill="white"
        className={animated ? 'animate-fade-in-delay' : ''}
      />
      
      {/* Eye Pupils */}
      <circle
        cx="50"
        cy="42"
        r="4"
        fill="black"
        className={animated ? 'animate-fade-in-delay' : ''}
      />
      <circle
        cx="70"
        cy="42"
        r="4"
        fill="black"
        className={animated ? 'animate-fade-in-delay' : ''}
      />
      
      {/* Beak */}
      <path
        d="M58 50 L60 58 L62 50 Z"
        fill="currentColor"
        className={animated ? 'animate-fade-in-delay' : ''}
      />
      
      {/* Wing Details */}
      <ellipse
        cx="45"
        cy="75"
        rx="12"
        ry="20"
        fill="white"
        fillOpacity="0.2"
        className={animated ? 'animate-fade-in-delay' : ''}
      />
      <ellipse
        cx="75"
        cy="75"
        rx="12"
        ry="20"
        fill="white"
        fillOpacity="0.2"
        className={animated ? 'animate-fade-in-delay' : ''}
      />
      
      {/* Talons */}
      <path
        d="M50 115 L48 120 M52 115 L50 120 M54 115 L52 120"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className={animated ? 'animate-fade-in-delay' : ''}
      />
      <path
        d="M66 115 L68 120 M68 115 L70 120 M70 115 L72 120"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className={animated ? 'animate-fade-in-delay' : ''}
      />
    </svg>
  );
};

export default OwlLogo;