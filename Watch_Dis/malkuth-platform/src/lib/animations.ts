// Animation utilities and presets
import { usePrefersReducedMotion } from './accessibility';

// Animation presets
export const animations = {
  // Entrance animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4, ease: 'easeOut' }
  },
  
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.4, ease: 'easeOut' }
  },
  
  slideInRight: {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  
  slideInLeft: {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  
  // Owl-specific animations
  owlPulse: {
    initial: { scale: 1 },
    animate: { 
      scale: [1, 1.05, 1],
      transition: { 
        duration: 2, 
        ease: 'easeInOut',
        repeat: Infinity 
      }
    }
  },
  
  owlFloat: {
    initial: { y: 0 },
    animate: { 
      y: [-5, 5, -5],
      transition: { 
        duration: 3, 
        ease: 'easeInOut',
        repeat: Infinity 
      }
    }
  },
  
  owlGlow: {
    initial: { filter: 'drop-shadow(0 0 0px rgba(255, 255, 255, 0))' },
    animate: { 
      filter: [
        'drop-shadow(0 0 0px rgba(255, 255, 255, 0))',
        'drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))',
        'drop-shadow(0 0 0px rgba(255, 255, 255, 0))'
      ],
      transition: { 
        duration: 2, 
        ease: 'easeInOut',
        repeat: Infinity 
      }
    }
  },
  
  // Loading animations
  spin: {
    animate: { 
      rotate: 360,
      transition: { 
        duration: 1, 
        ease: 'linear',
        repeat: Infinity 
      }
    }
  },
  
  bounce: {
    animate: { 
      y: [0, -10, 0],
      transition: { 
        duration: 0.6, 
        ease: 'easeInOut',
        repeat: Infinity 
      }
    }
  },
  
  // Interactive animations
  hover: {
    whileHover: { 
      scale: 1.05,
      transition: { duration: 0.2, ease: 'easeOut' }
    }
  },
  
  tap: {
    whileTap: { 
      scale: 0.95,
      transition: { duration: 0.1, ease: 'easeOut' }
    }
  },
  
  // Page transitions
  pageSlideLeft: {
    initial: { opacity: 0, x: 300 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -300 },
    transition: { duration: 0.3, ease: 'easeInOut' }
  },
  
  pageSlideRight: {
    initial: { opacity: 0, x: -300 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 300 },
    transition: { duration: 0.3, ease: 'easeInOut' }
  },
  
  pageFade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2, ease: 'easeInOut' }
  }
} as const;

// Stagger children animation utility
export const staggerChildren = (delayBetween: number = 0.1) => ({
  animate: {
    transition: {
      staggerChildren: delayBetween
    }
  }
});

// Responsive animation hook that respects user preferences
export const useAnimation = (animationPreset: keyof typeof animations) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  
  if (prefersReducedMotion) {
    // Return simplified animation for reduced motion
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.01 }
    };
  }
  
  return animations[animationPreset];
};

// Custom easing functions
export const easings = {
  // Standard easings
  linear: [0, 0, 1, 1],
  easeIn: [0.4, 0, 1, 1],
  easeOut: [0, 0, 0.2, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  
  // Custom easings
  spring: [0.68, -0.55, 0.265, 1.55],
  smooth: [0.25, 0.46, 0.45, 0.94],
  sharp: [0.4, 0, 0.6, 1],
  
  // Owl-themed easings
  owlBlink: [0.87, 0, 0.13, 1],
  owlSwoosh: [0.19, 1, 0.22, 1]
} as const;

// Duration presets
export const durations = {
  instant: 0,
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  slower: 0.75,
  slowest: 1
} as const;

// Animation sequence builder
export const createSequence = (steps: Array<{
  target: string;
  animation: any;
  delay?: number;
}>) => {
  return steps.reduce((sequence, step, index) => {
    const delay = step.delay || index * 0.1;
    return {
      ...sequence,
      [step.target]: {
        ...step.animation,
        transition: {
          ...step.animation.transition,
          delay
        }
      }
    };
  }, {});
};

// Utility for creating scroll-triggered animations
export const createScrollAnimation = (
  threshold: number = 0.1,
  rootMargin: string = '0px'
) => {
  return {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: threshold, margin: rootMargin },
    transition: { duration: 0.6, ease: 'easeOut' }
  };
};