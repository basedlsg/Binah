import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { OwlLogo } from '@/components/ui/icons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
  showLogo?: boolean;
  variant?: 'center' | 'split';
}

const AuthLayout = ({
  children,
  title,
  description,
  className,
  showLogo = true,
  variant = 'center'
}: AuthLayoutProps) => {
  if (variant === 'split') {
    return (
      <div className="min-h-screen flex">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 to-black items-center justify-center p-12">
          <div className="max-w-md text-center space-y-8">
            <OwlLogo size="landing" animated className="text-white mx-auto" />
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">
                Malkuth Platform
              </h1>
              <p className="text-xl text-gray-300 mb-6">
                Digital Laboratory for Modern Research
              </p>
              <p className="text-gray-400 leading-relaxed">
                A comprehensive platform for data analysis, experiment management, 
                and collaborative research in a minimalist, distraction-free environment.
              </p>
            </div>
          </div>
        </div>
        
        {/* Right side - Auth form */}
        <div className="flex-1 flex items-center justify-center p-8 bg-black">
          <div className="w-full max-w-md">
            {showLogo && (
              <div className="text-center mb-8 lg:hidden">
                <OwlLogo size="header" className="text-white mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white">Malkuth</h2>
                <p className="text-gray-400">Digital Laboratory</p>
              </div>
            )}
            
            <Card variant="glass" className="border-gray-700">
              {(title || description) && (
                <CardHeader className="text-center">
                  {title && (
                    <CardTitle className="text-2xl text-white">
                      {title}
                    </CardTitle>
                  )}
                  {description && (
                    <CardDescription className="text-gray-400">
                      {description}
                    </CardDescription>
                  )}
                </CardHeader>
              )}
              <CardContent>
                {children}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  // Center variant
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and branding */}
        {showLogo && (
          <div className="text-center">
            <OwlLogo size="header" animated className="text-white mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white">Malkuth</h1>
            <p className="text-gray-400">Digital Laboratory</p>
          </div>
        )}
        
        {/* Auth card */}
        <Card variant="glass" className={cn('border-gray-700', className)}>
          {(title || description) && (
            <CardHeader className="text-center">
              {title && (
                <CardTitle className="text-2xl text-white">
                  {title}
                </CardTitle>
              )}
              {description && (
                <CardDescription className="text-gray-400">
                  {description}
                </CardDescription>
              )}
            </CardHeader>
          )}
          <CardContent>
            {children}
          </CardContent>
        </Card>
        
        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            © 2024 Malkuth Platform. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

AuthLayout.displayName = 'AuthLayout';

export { AuthLayout, type AuthLayoutProps };