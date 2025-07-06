import React from 'react';
import { cn } from '@/lib/utils';

interface OwlLogoMinimalProps {
  size?: number;
  className?: string;
}

const OwlLogoMinimal: React.FC<OwlLogoMinimalProps> = ({ 
  size = 24, 
  className 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('transition-all duration-300', className)}
    >
      {/* Simplified owl head */}
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      
      {/* Ear tufts */}
      <path d="M7 4 L9 2 L11 4 Z" fill="currentColor" />
      <path d="M13 4 L15 2 L17 4 Z" fill="currentColor" />
      
      {/* Eyes */}
      <circle cx="9" cy="10" r="2" fill="white" />
      <circle cx="15" cy="10" r="2" fill="white" />
      
      {/* Pupils */}
      <circle cx="9" cy="10" r="1" fill="black" />
      <circle cx="15" cy="10" r="1" fill="black" />
      
      {/* Beak */}
      <path d="M11 14 L12 16 L13 14 Z" fill="currentColor" />
    </svg>
  );
};

export default OwlLogoMinimal;