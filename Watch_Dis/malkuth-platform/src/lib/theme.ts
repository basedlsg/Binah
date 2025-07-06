// Theme utilities and composition patterns
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { designTokens } from './design-tokens';

// Theme types
export type ThemeMode = 'dark' | 'light' | 'system';
export type ThemeContrast = 'normal' | 'high';

export interface ThemeContextType {
  mode: ThemeMode;
  contrast: ThemeContrast;
  setMode: (mode: ThemeMode) => void;
  setContrast: (contrast: ThemeContrast) => void;
  resolvedTheme: 'dark' | 'light';
  tokens: typeof designTokens;
}

// Theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider component
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [contrast, setContrast] = useState<ThemeContrast>('normal');
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');
  
  // Resolve system theme
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateResolvedTheme = () => {
      if (mode === 'system') {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      } else {
        setResolvedTheme(mode);
      }
    };
    
    updateResolvedTheme();
    
    mediaQuery.addEventListener('change', updateResolvedTheme);
    return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
  }, [mode]);
  
  // Update CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme mode
    root.setAttribute('data-theme', resolvedTheme);
    root.setAttribute('data-contrast', contrast);
    
    // Update CSS classes
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    
    if (contrast === 'high') {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [resolvedTheme, contrast]);
  
  // Persist theme preferences
  useEffect(() => {
    const stored = localStorage.getItem('malkuth-theme');
    if (stored) {
      try {
        const { mode: storedMode, contrast: storedContrast } = JSON.parse(stored);
        if (storedMode) setMode(storedMode);
        if (storedContrast) setContrast(storedContrast);
      } catch (error) {
        console.warn('Failed to parse stored theme preferences:', error);
      }
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem('malkuth-theme', JSON.stringify({ mode, contrast }));
  }, [mode, contrast]);
  
  const value: ThemeContextType = {
    mode,
    contrast,
    setMode,
    setContrast,
    resolvedTheme,
    tokens: designTokens
  };
  
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Theme hook
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme utilities
export const getThemeValue = (path: string, fallback?: any) => {
  const pathArray = path.split('.');
  let current = designTokens as any;
  
  for (const key of pathArray) {
    if (current?.[key] !== undefined) {
      current = current[key];
    } else {
      return fallback;
    }
  }
  
  return current || fallback;
};

// CSS variable utilities
export const cssVar = (name: string, fallback?: string): string => {
  return `var(--${name}${fallback ? `, ${fallback}` : ''})`;
};

export const setCSSVar = (name: string, value: string): void => {
  document.documentElement.style.setProperty(`--${name}`, value);
};

// Component composition utilities
export interface ComponentProps {
  className?: string;
  children?: ReactNode;
}

// Higher-order component for theme-aware components
export const withTheme = <P extends ComponentProps>(
  Component: React.ComponentType<P>
) => {
  const ThemedComponent = React.forwardRef<any, P>((props, ref) => {
    const theme = useTheme();
    
    return (
      <Component
        {...props}
        ref={ref}
        // Pass theme as additional prop if needed
        // theme={theme}
      />
    );
  });
  
  ThemedComponent.displayName = `withTheme(${Component.displayName || Component.name})`;
  
  return ThemedComponent;
};

// Compound component utilities
export const createCompoundComponent = <T extends Record<string, React.ComponentType<any>>>(
  components: T
) => {
  const compound = components.Root as any;
  
  Object.keys(components).forEach((key) => {
    if (key !== 'Root') {
      compound[key] = components[key];
    }
  });
  
  return compound as T['Root'] & Omit<T, 'Root'>;
};

// Polymorphic component utilities
export interface PolymorphicProps<T extends React.ElementType> {
  as?: T;
  children?: ReactNode;
  className?: string;
}

export type PolymorphicRef<T extends React.ElementType> = React.ComponentPropsWithRef<T>['ref'];

export type PolymorphicComponentProps<
  T extends React.ElementType,
  Props = {}
> = PolymorphicProps<T> & Props & Omit<React.ComponentPropsWithoutRef<T>, keyof PolymorphicProps<T> | keyof Props>;

export const createPolymorphicComponent = <DefaultElement extends React.ElementType, Props = {}>(
  defaultElement: DefaultElement
) => {
  const PolymorphicComponent = React.forwardRef<
    PolymorphicRef<DefaultElement>,
    PolymorphicComponentProps<DefaultElement, Props>
  >(({ as, children, ...props }, ref) => {
    const Element = as || defaultElement;
    return <Element ref={ref} {...props}>{children}</Element>;
  });
  
  PolymorphicComponent.displayName = `Polymorphic${defaultElement}`;
  
  return PolymorphicComponent;
};

// Responsive utilities with theme integration
export const useResponsiveTheme = () => {
  const theme = useTheme();
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };
    
    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);
  
  return {
    ...theme,
    screenSize,
    isMobile: screenSize === 'mobile',
    isTablet: screenSize === 'tablet',
    isDesktop: screenSize === 'desktop'
  };
};

// Theme variant utilities
export const createThemeVariants = <T extends Record<string, any>>(variants: T) => {
  return (variant: keyof T) => variants[variant];
};

// Color scheme utilities
export const getColorScheme = (theme: 'dark' | 'light') => {
  return theme === 'dark' 
    ? {
        background: designTokens.colors.background.primary,
        foreground: designTokens.colors.text.primary,
        muted: designTokens.colors.text.secondary,
        border: designTokens.colors.border.primary
      }
    : {
        background: designTokens.colors.background.inverse,
        foreground: designTokens.colors.text.inverse,
        muted: designTokens.colors.text.muted,
        border: designTokens.colors.border.tertiary
      };
};

// Component state utilities
export const useComponentState = <T extends Record<string, boolean>>(
  initialState: T
) => {
  const [state, setState] = useState(initialState);
  
  const toggleState = (key: keyof T) => {
    setState(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  const setStateValue = (key: keyof T, value: boolean) => {
    setState(prev => ({ ...prev, [key]: value }));
  };
  
  const resetState = () => {
    setState(initialState);
  };
  
  return {
    state,
    toggleState,
    setStateValue,
    resetState,
    setState
  };
};