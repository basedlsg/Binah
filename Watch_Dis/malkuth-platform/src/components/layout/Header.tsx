import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { OwlLogo, OwlLogoMinimal } from '@/components/ui/icons';
import { Button } from '@/components/ui';

interface HeaderProps extends HTMLAttributes<HTMLElement> {
  variant?: 'default' | 'minimal';
  showNavigation?: boolean;
  onMenuClick?: () => void;
}

const Header = ({ 
  className, 
  variant = 'default',
  showNavigation = true,
  onMenuClick,
  ...props 
}: HeaderProps) => {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-gray-800 bg-black/80 backdrop-blur-md',
        className
      )}
      {...props}
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-800 rounded-md transition-colors"
          >
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          
          <div className="flex items-center gap-3">
            {variant === 'minimal' ? (
              <OwlLogoMinimal size={32} className="text-white" />
            ) : (
              <OwlLogo size="header" className="text-white" />
            )}
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Malkuth
              </h1>
              <p className="text-xs text-gray-400 leading-none">
                Digital Laboratory
              </p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        {showNavigation && (
          <nav className="hidden md:flex items-center space-x-6">
            <a
              href="/dashboard"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Dashboard
            </a>
            <a
              href="/experiments"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Experiments
            </a>
            <a
              href="/data"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Data
            </a>
            <a
              href="/settings"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Settings
            </a>
          </nav>
        )}
        
        {/* User Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
            Search
          </Button>
          <Button variant="outline" size="sm">
            Profile
          </Button>
        </div>
      </div>
    </header>
  );
};

Header.displayName = 'Header';

export { Header, type HeaderProps };