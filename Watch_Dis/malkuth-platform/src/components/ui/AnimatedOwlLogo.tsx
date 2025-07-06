import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/lib/accessibility';

interface AnimatedOwlLogoProps {
  size?: 'icon' | 'header' | 'landing';
  animationType?: 'pulse' | 'float' | 'glow' | 'blink' | 'combined';
  className?: string;
  onAnimationComplete?: () => void;
}

const AnimatedOwlLogo: React.FC<AnimatedOwlLogoProps> = ({ 
  size = 'header', 
  animationType = 'pulse',
  className,
  onAnimationComplete
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  
  const sizeConfig = {
    icon: { width: 24, height: 24 },
    header: { width: 48, height: 48 },
    landing: { width: 120, height: 120 }
  };

  const { width, height } = sizeConfig[size];
  
  // Blink animation for eyes
  useEffect(() => {
    if (prefersReducedMotion || animationType !== 'blink' && animationType !== 'combined') return;
    
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3000 + Math.random() * 2000); // Random blink interval
    
    return () => clearInterval(blinkInterval);
  }, [animationType, prefersReducedMotion]);
  
  // Animation classes based on type
  const getAnimationClasses = () => {
    if (prefersReducedMotion) return '';
    
    const animations = {
      pulse: 'animate-pulse-glow',
      float: 'animate-float',
      glow: 'animate-glow',
      blink: '',
      combined: 'animate-float animate-pulse-glow'
    };
    
    return animations[animationType] || '';
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        'transition-all duration-300',
        getAnimationClasses(),
        className
      )}
      style={{
        filter: animationType === 'glow' || animationType === 'combined' 
          ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))' 
          : undefined
      }}
    >
      {/* Owl Body */}
      <ellipse
        cx="60"
        cy="75"
        rx="35"
        ry="45"
        fill="currentColor"
        className="animate-fade-in"
      />
      
      {/* Owl Head */}
      <circle
        cx="60"
        cy="45"
        r="30"
        fill="currentColor"
        className="animate-fade-in-delay"
      />
      
      {/* Ear Tufts with subtle animation */}
      <path
        d="M35 25 L40 15 L45 25 Z"
        fill="currentColor"
        className={cn(
          "animate-fade-in-delay origin-bottom",
          !prefersReducedMotion && "animate-wiggle"
        )}
        style={{
          animationDelay: '0.3s',
          animationDuration: '4s',
          animationIterationCount: 'infinite'
        }}
      />
      <path
        d="M75 25 L80 15 L85 25 Z"
        fill="currentColor"
        className={cn(
          "animate-fade-in-delay origin-bottom",
          !prefersReducedMotion && "animate-wiggle"
        )}
        style={{
          animationDelay: '0.35s',
          animationDuration: '4s',
          animationIterationCount: 'infinite'
        }}
      />
      
      {/* Eyes with blink animation */}
      <circle
        cx="50"
        cy="42"
        r="8"
        fill="white"
        className="animate-fade-in-delay"
      />
      <circle
        cx="70"
        cy="42"
        r="8"
        fill="white"
        className="animate-fade-in-delay"
      />
      
      {/* Eye Pupils with subtle movement */}
      <circle
        cx="50"
        cy="42"
        r={isBlinking ? "0.5" : "4"}
        fill="black"
        className={cn(
          "animate-fade-in-delay transition-all duration-150",
          !prefersReducedMotion && "animate-eye-movement"
        )}
        style={{
          transformOrigin: '50px 42px'
        }}
      />
      <circle
        cx="70"
        cy="42"
        r={isBlinking ? "0.5" : "4"}
        fill="black"
        className={cn(
          "animate-fade-in-delay transition-all duration-150",
          !prefersReducedMotion && "animate-eye-movement"
        )}
        style={{
          transformOrigin: '70px 42px',
          animationDelay: '0.1s'
        }}
      />
      
      {/* Eyelids for blinking effect */}
      {isBlinking && (
        <>
          <ellipse
            cx="50"
            cy="42"
            rx="8"
            ry="1"
            fill="white"
            className="animate-fade-in"
          />
          <ellipse
            cx="70"
            cy="42"
            rx="8"
            ry="1"
            fill="white"
            className="animate-fade-in"
          />
        </>
      )}
      
      {/* Beak */}
      <path
        d="M58 50 L60 58 L62 50 Z"
        fill="currentColor"
        className="animate-fade-in-delay"
      />
      
      {/* Wing Details with subtle breathing effect */}
      <ellipse
        cx="45"
        cy="75"
        rx="12"
        ry="20"
        fill="white"
        fillOpacity="0.2"
        className={cn(
          "animate-fade-in-delay",
          !prefersReducedMotion && "animate-breathe"
        )}
        style={{
          transformOrigin: '45px 75px',
          animationDuration: '3s',
          animationIterationCount: 'infinite'
        }}
      />
      <ellipse
        cx="75"
        cy="75"
        rx="12"
        ry="20"
        fill="white"
        fillOpacity="0.2"
        className={cn(
          "animate-fade-in-delay",
          !prefersReducedMotion && "animate-breathe"
        )}
        style={{
          transformOrigin: '75px 75px',
          animationDuration: '3s',
          animationDelay: '0.5s',
          animationIterationCount: 'infinite'
        }}
      />
      
      {/* Talons */}
      <path
        d="M50 115 L48 120 M52 115 L50 120 M54 115 L52 120"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="animate-fade-in-delay"
      />
      <path
        d="M66 115 L68 120 M68 115 L70 120 M70 115 L72 120"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="animate-fade-in-delay"
      />
      
      {/* Subtle sparkle effects for glow animation */}
      {(animationType === 'glow' || animationType === 'combined') && !prefersReducedMotion && (
        <g className="animate-sparkle">
          <circle cx="30" cy="30" r="1" fill="white" opacity="0.6">
            <animate
              attributeName="opacity"
              values="0;1;0"
              dur="2s"
              repeatCount="indefinite"
              begin="0s"
            />
          </circle>
          <circle cx="90" cy="35" r="1" fill="white" opacity="0.4">
            <animate
              attributeName="opacity"
              values="0;1;0"
              dur="1.5s"
              repeatCount="indefinite"
              begin="0.5s"
            />
          </circle>
          <circle cx="25" cy="90" r="1" fill="white" opacity="0.8">
            <animate
              attributeName="opacity"
              values="0;1;0"
              dur="3s"
              repeatCount="indefinite"
              begin="1s"
            />
          </circle>
        </g>
      )}
    </svg>
  );
};

export default AnimatedOwlLogo;