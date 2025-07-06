import React from 'react'
import { cn } from '@/lib/utils'
import OwlLogo from '@/components/ui/icons/OwlLogo'
import Typography from '../atoms/Typography'
import Button from '../atoms/Button'

interface NavigationItem {
  label: string
  href: string
  icon?: React.ReactNode
  active?: boolean
}

interface PageLayoutProps {
  title: string
  subtitle?: string
  navigation?: NavigationItem[]
  headerActions?: React.ReactNode
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

const PageLayout = React.forwardRef<HTMLDivElement, PageLayoutProps>(
  ({ 
    title, 
    subtitle, 
    navigation, 
    headerActions, 
    children, 
    className,
    maxWidth = '2xl',
    ...props 
  }, ref) => {
    const maxWidthClasses = {
      sm: 'max-w-3xl',
      md: 'max-w-5xl',
      lg: 'max-w-6xl',
      xl: 'max-w-7xl',
      '2xl': 'max-w-8xl',
      full: 'max-w-full'
    }

    return (
      <div ref={ref} className={cn('min-h-screen bg-black text-white', className)} {...props}>
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-gray-800 bg-black/90 backdrop-blur-sm">
          <div className={cn('mx-auto px-6 py-4', maxWidthClasses[maxWidth])}>
            <div className="flex items-center justify-between">
              {/* Logo and title */}
              <div className="flex items-center space-x-4">
                <OwlLogo className="w-12 h-12 text-white" />
                <div>
                  <Typography variant="h3" weight="bold">
                    {title}
                  </Typography>
                  {subtitle && (
                    <Typography variant="small" color="secondary">
                      {subtitle}
                    </Typography>
                  )}
                </div>
              </div>

              {/* Navigation */}
              {navigation && navigation.length > 0 && (
                <nav className="hidden md:flex items-center space-x-1">
                  {navigation.map((item, index) => (
                    <a
                      key={index}
                      href={item.href}
                      className={cn(
                        'flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors',
                        item.active 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-300 hover:text-white hover:bg-gray-800'
                      )}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </a>
                  ))}
                </nav>
              )}

              {/* Header actions */}
              {headerActions && (
                <div className="flex items-center space-x-3">
                  {headerActions}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className={cn('mx-auto px-6 py-8', maxWidthClasses[maxWidth])}>
          {children}
        </main>
      </div>
    )
  }
)

PageLayout.displayName = 'PageLayout'

export default PageLayout