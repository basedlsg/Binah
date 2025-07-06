import React from 'react';
import { cn } from '@/lib/utils';
import { createPolymorphicComponent, PolymorphicComponentProps } from '@/lib/theme';

// Box component - the most basic polymorphic component
interface BoxProps {
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  direction?: 'row' | 'column';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const Box = createPolymorphicComponent<'div', BoxProps>('div');

// Enhanced Box with styled system
export const StyledBox = React.forwardRef<
  HTMLDivElement,
  PolymorphicComponentProps<'div', BoxProps>
>(({ 
  as = 'div',
  className,
  spacing = 'none',
  direction = 'row',
  align = 'start',
  justify = 'start',
  wrap = false,
  gap = 'none',
  children,
  ...props 
}, ref) => {
  const Component = as;
  
  const spacingClasses = {
    none: '',
    xs: 'p-1',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };
  
  const directionClasses = {
    row: 'flex-row',
    column: 'flex-col'
  };
  
  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };
  
  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };
  
  const gapClasses = {
    none: '',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };
  
  return (
    <Component
      ref={ref}
      className={cn(
        'flex',
        spacingClasses[spacing],
        directionClasses[direction],
        alignClasses[align],
        justifyClasses[justify],
        gapClasses[gap],
        wrap && 'flex-wrap',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

StyledBox.displayName = 'StyledBox';

// Text component
interface TextProps {
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'primary' | 'secondary' | 'muted' | 'inverse';
  align?: 'left' | 'center' | 'right' | 'justify';
  truncate?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export const Text = React.forwardRef<
  HTMLParagraphElement,
  PolymorphicComponentProps<'p', TextProps>
>(({ 
  as = 'p',
  className,
  size = 'base',
  weight = 'normal',
  color = 'primary',
  align = 'left',
  truncate = false,
  italic = false,
  underline = false,
  children,
  ...props 
}, ref) => {
  const Component = as;
  
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl'
  };
  
  const weightClasses = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };
  
  const colorClasses = {
    primary: 'text-white',
    secondary: 'text-gray-300',
    muted: 'text-gray-400',
    inverse: 'text-black'
  };
  
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify'
  };
  
  return (
    <Component
      ref={ref}
      className={cn(
        sizeClasses[size],
        weightClasses[weight],
        colorClasses[color],
        alignClasses[align],
        truncate && 'truncate',
        italic && 'italic',
        underline && 'underline',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

Text.displayName = 'Text';

// Stack component for layout
interface StackProps {
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  direction?: 'horizontal' | 'vertical';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between';
  wrap?: boolean;
  divider?: React.ReactNode;
}

export const Stack = React.forwardRef<
  HTMLDivElement,
  PolymorphicComponentProps<'div', StackProps>
>(({ 
  as = 'div',
  className,
  spacing = 'md',
  direction = 'vertical',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  divider,
  children,
  ...props 
}, ref) => {
  const Component = as;
  
  const spacingClasses = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };
  
  const directionClasses = {
    horizontal: 'flex-row',
    vertical: 'flex-col'
  };
  
  const alignClasses = {
    start: direction === 'horizontal' ? 'items-start' : 'items-start',
    center: 'items-center',
    end: direction === 'horizontal' ? 'items-end' : 'items-end',
    stretch: 'items-stretch'
  };
  
  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between'
  };
  
  const childrenArray = React.Children.toArray(children);
  
  return (
    <Component
      ref={ref}
      className={cn(
        'flex',
        directionClasses[direction],
        alignClasses[align],
        justifyClasses[justify],
        !divider && spacingClasses[spacing],
        wrap && 'flex-wrap',
        className
      )}
      {...props}
    >
      {divider 
        ? childrenArray.map((child, index) => (
            <React.Fragment key={index}>
              {child}
              {index < childrenArray.length - 1 && divider}
            </React.Fragment>
          ))
        : children
      }
    </Component>
  );
});

Stack.displayName = 'Stack';

// Center component
interface CenterProps {
  inline?: boolean;
}

export const Center = React.forwardRef<
  HTMLDivElement,
  PolymorphicComponentProps<'div', CenterProps>
>(({ 
  as = 'div',
  className,
  inline = false,
  children,
  ...props 
}, ref) => {
  const Component = as;
  
  return (
    <Component
      ref={ref}
      className={cn(
        inline ? 'inline-flex' : 'flex',
        'items-center justify-center',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

Center.displayName = 'Center';

// Container component
interface ContainerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
  centerContent?: boolean;
}

export const Container = React.forwardRef<
  HTMLDivElement,
  PolymorphicComponentProps<'div', ContainerProps>
>(({ 
  as = 'div',
  className,
  size = 'lg',
  padding = true,
  centerContent = false,
  children,
  ...props 
}, ref) => {
  const Component = as;
  
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-none'
  };
  
  return (
    <Component
      ref={ref}
      className={cn(
        'mx-auto',
        sizeClasses[size],
        padding && 'px-4 sm:px-6 lg:px-8',
        centerContent && 'flex items-center justify-center min-h-screen',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

Container.displayName = 'Container';