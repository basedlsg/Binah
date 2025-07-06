// Responsive design utilities and hooks
import { useEffect, useState } from 'react';

// Breakpoint definitions matching design tokens
export const breakpoints = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

export type Breakpoint = keyof typeof breakpoints;

// Hook to get current breakpoint
export const useBreakpoint = () => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>('lg');
  
  useEffect(() => {
    const getBreakpoint = (): Breakpoint => {
      const width = window.innerWidth;
      
      if (width >= breakpoints['2xl']) return '2xl';
      if (width >= breakpoints.xl) return 'xl';
      if (width >= breakpoints.lg) return 'lg';
      if (width >= breakpoints.md) return 'md';
      if (width >= breakpoints.sm) return 'sm';
      return 'xs';
    };
    
    const handleResize = () => {
      setCurrentBreakpoint(getBreakpoint());
    };
    
    // Set initial breakpoint
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return currentBreakpoint;
};

// Hook to check if current viewport matches breakpoint
export const useMediaQuery = (breakpoint: Breakpoint, type: 'min' | 'max' = 'min') => {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const query = `(${type}-width: ${breakpoints[breakpoint]}px)`;
    const mediaQuery = window.matchMedia(query);
    
    setMatches(mediaQuery.matches);
    
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [breakpoint, type]);
  
  return matches;
};

// Responsive value hook - returns different values based on breakpoint
export const useResponsiveValue = <T>(values: Partial<Record<Breakpoint, T>>) => {
  const currentBreakpoint = useBreakpoint();
  
  // Find the appropriate value for current breakpoint
  const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  
  // Look for the value at current breakpoint or the nearest smaller one
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }
  
  // Fallback to the first available value
  for (const bp of breakpointOrder) {
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }
  
  return undefined;
};

// Utility to generate responsive class names
export const responsive = <T extends string>(
  base: T,
  variants: Partial<Record<Breakpoint, string>>
): string => {
  let classes = base;
  
  Object.entries(variants).forEach(([bp, value]) => {
    if (value) {
      const prefix = bp === 'xs' ? '' : `${bp}:`;
      classes += ` ${prefix}${value}`;
    }
  });
  
  return classes;
};

// Touch and interaction utilities
export const useTouch = () => {
  const [isTouch, setIsTouch] = useState(false);
  
  useEffect(() => {
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    
    checkTouch();
    
    // Listen for touch events to detect touch capability
    const handleTouch = () => setIsTouch(true);
    window.addEventListener('touchstart', handleTouch, { once: true });
    
    return () => window.removeEventListener('touchstart', handleTouch);
  }, []);
  
  return isTouch;
};

// Viewport dimensions hook
export const useViewport = () => {
  const [viewport, setViewport] = useState({
    width: 0,
    height: 0
  });
  
  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    updateViewport();
    
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);
  
  return viewport;
};

// Safe area utilities for mobile devices
export const useSafeArea = () => {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });
  
  useEffect(() => {
    const updateSafeArea = () => {
      const style = getComputedStyle(document.documentElement);
      setSafeArea({
        top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
        right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
        bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
        left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0')
      });
    };
    
    updateSafeArea();
    
    window.addEventListener('resize', updateSafeArea);
    return () => window.removeEventListener('resize', updateSafeArea);
  }, []);
  
  return safeArea;
};