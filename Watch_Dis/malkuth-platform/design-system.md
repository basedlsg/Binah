# Malkuth Platform Design System

## 🎨 Design Philosophy

### Core Principles
1. **Dark Minimalism**: Black backgrounds, white text, clean aesthetics
2. **Content-First**: Grid layouts that showcase creative work prominently
3. **Bento Grid Design**: Modern 2024 trend inspired by Japanese Bento boxes
4. **Responsive Modularity**: Adaptive components across all screen sizes
5. **Accessibility-First**: WCAG 2.1 AA compliance throughout

## 🎯 Grid System

### Bento Grid Layout (Inspired by YouTube/Behance)
- **Desktop**: 4-column modular grid with variable heights
- **Tablet**: 3-column responsive grid
- **Mobile**: 2-column stacked layout
- **Gutters**: 24px horizontal, 20px vertical
- **Margins**: 32px on desktop, 16px on mobile

### Grid Specifications
```
Desktop (1200px+):  4 columns × 280px + 72px gutters
Tablet (768-1199px): 3 columns × 240px + 48px gutters  
Mobile (320-767px):  2 columns × 160px + 32px gutters
```

## 🎨 Color System

### Primary Palette
```css
--bg-primary: #000000      /* Pure black backgrounds */
--bg-secondary: #111111    /* Cards and elevated surfaces */
--bg-tertiary: #1a1a1a     /* Interactive elements */

--text-primary: #ffffff    /* Primary text */
--text-secondary: #b3b3b3  /* Secondary text */
--text-muted: #666666      /* Muted text */

--accent-blue: #3b82f6     /* Primary actions */
--accent-purple: #8b5cf6   /* Bot management */
--accent-green: #10b981    /* Success states */
--accent-red: #ef4444      /* Destructive actions */
--accent-yellow: #f59e0b   /* Warning states */
```

### Semantic Colors
```css
--success: #22c55e
--warning: #f59e0b  
--error: #ef4444
--info: #3b82f6
```

## 📝 Typography

### Font Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Type Scale
```css
--text-xs: 12px / 16px     /* Small labels */
--text-sm: 14px / 20px     /* Body small */
--text-base: 16px / 24px   /* Body text */
--text-lg: 18px / 28px     /* Large body */
--text-xl: 20px / 28px     /* Subheadings */
--text-2xl: 24px / 32px    /* Headings */
--text-3xl: 30px / 36px    /* Large headings */
--text-4xl: 36px / 40px    /* Display text */
```

### Font Weights
```css
--font-light: 300
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
```

## 📏 Spacing System

### 8-Point Grid
```css
--space-1: 4px    /* 0.25rem */
--space-2: 8px    /* 0.5rem */
--space-3: 12px   /* 0.75rem */
--space-4: 16px   /* 1rem */
--space-5: 20px   /* 1.25rem */
--space-6: 24px   /* 1.5rem */
--space-8: 32px   /* 2rem */
--space-10: 40px  /* 2.5rem */
--space-12: 48px  /* 3rem */
--space-16: 64px  /* 4rem */
--space-20: 80px  /* 5rem */
--space-24: 96px  /* 6rem */
```

## 🔲 Component Specifications

### Card Components
```css
.card-base {
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid #333;
  overflow: hidden;
  transition: all 0.2s ease;
}

.card-hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.4);
  border-color: #555;
}
```

### Button System
```css
/* Primary Button */
.btn-primary {
  background: var(--accent-blue);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

/* Secondary Button */
.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid #333;
}

/* Destructive Button */
.btn-destructive {
  background: var(--accent-red);
  color: white;
}
```

### Input Components
```css
.input-base {
  background: var(--bg-tertiary);
  border: 1px solid #333;
  border-radius: 8px;
  padding: 12px 16px;
  color: var(--text-primary);
  font-size: 16px;
}

.input-focus {
  border-color: var(--accent-blue);
  outline: 2px solid rgba(59, 130, 246, 0.2);
}
```

## 📱 Responsive Breakpoints

```css
/* Mobile First Approach */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

## 🎯 Grid Layout Patterns

### Content Grid (YouTube/Behance Style)
```css
.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px 20px;
  padding: 32px;
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
    padding: 16px;
  }
}
```

### Bento Grid (Variable Heights)
```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 200px;
  gap: 20px;
}

.bento-item-large {
  grid-column: span 2;
  grid-row: span 2;
}

.bento-item-wide {
  grid-column: span 2;
}

.bento-item-tall {
  grid-row: span 2;
}
```

## 🎨 Animation & Transitions

### Micro-interactions
```css
/* Hover Transitions */
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.4);
}

/* Loading States */
.loading-shimmer {
  background: linear-gradient(90deg, #1a1a1a 25%, #333 50%, #1a1a1a 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

## 🔍 Accessibility Guidelines

### Focus Management
```css
.focus-visible {
  outline: 2px solid var(--accent-blue);
  outline-offset: 2px;
}
```

### Color Contrast
- All text maintains minimum 4.5:1 contrast ratio
- Interactive elements have 3:1 minimum contrast
- Focus indicators are clearly visible

### Screen Reader Support
- Semantic HTML structure
- ARIA labels for complex interactions
- Proper heading hierarchy

## 🧩 Component Architecture

### Atomic Design Structure
```
Atoms/
  ├── Button/
  ├── Input/
  ├── Typography/
  └── Icon/

Molecules/
  ├── Card/
  ├── ProjectCard/
  ├── BotCard/
  └── FormField/

Organisms/
  ├── ProjectGrid/
  ├── Header/
  ├── AdminPanel/
  └── BotManagement/

Templates/
  ├── PageLayout/
  ├── GridLayout/
  └── AdminLayout/
```

## 📐 Implementation Guidelines

### CSS Custom Properties
Use CSS variables for consistent theming and easy customization.

### Component Props
Every component should accept:
- `className` for style overrides
- `variant` for different styles
- `size` for scale variations
- `disabled` for interaction states

### Performance
- Use CSS Grid for layouts
- Implement lazy loading for images
- Optimize animations with `transform` and `opacity`
- Use React.memo for expensive components

This design system ensures consistency, accessibility, and modern aesthetics while providing the flexibility needed for the Malkuth platform's unique requirements.