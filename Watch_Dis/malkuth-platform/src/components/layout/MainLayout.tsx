import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Breadcrumbs, BreadcrumbItem } from './Breadcrumbs';

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
  breadcrumbs?: BreadcrumbItem[];
  showSidebar?: boolean;
  sidebarOpen?: boolean;
  onSidebarToggle?: (open: boolean) => void;
}

const MainLayout = ({
  children,
  className,
  breadcrumbs,
  showSidebar = true,
  sidebarOpen: controlledSidebarOpen,
  onSidebarToggle
}: MainLayoutProps) => {
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(false);
  
  const sidebarOpen = controlledSidebarOpen ?? internalSidebarOpen;
  const setSidebarOpen = onSidebarToggle ?? setInternalSidebarOpen;
  
  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <Header 
        onMenuClick={showSidebar ? handleMenuClick : undefined}
        variant="default"
      />
      
      <div className="flex">
        {/* Sidebar */}
        {showSidebar && (
          <Sidebar 
            isOpen={sidebarOpen}
            onClose={handleSidebarClose}
          />
        )}
        
        {/* Main Content */}
        <main 
          className={cn(
            'flex-1 min-h-screen',
            showSidebar && 'lg:ml-64',
            className
          )}
        >
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="border-b border-gray-800 px-6 py-4">
              <Breadcrumbs items={breadcrumbs} />
            </div>
          )}
          
          {/* Page Content */}
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

MainLayout.displayName = 'MainLayout';

export { MainLayout, type MainLayoutProps };