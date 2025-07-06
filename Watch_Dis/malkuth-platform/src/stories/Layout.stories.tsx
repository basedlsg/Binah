import type { Meta, StoryObj } from '@storybook/nextjs';
import { MainLayout } from '@/components/layout/MainLayout';
import { DashboardLayout, DashboardGrid, DashboardCard, DashboardMetric } from '@/components/layout/DashboardLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Card, CardContent, Button, Input } from '@/components/ui';

const meta: Meta<typeof MainLayout> = {
  title: 'Layout/MainLayout',
  component: MainLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The main layout component that provides the overall structure with header, sidebar, and content area.'
      }
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Main Content Area</h1>
        <p className="text-gray-300">This is the main content area of the application.</p>
        <Card>
          <CardContent>
            <h2 className="text-xl font-semibold text-white mb-4">Sample Content</h2>
            <p className="text-gray-300">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          </CardContent>
        </Card>
      </div>
    ),
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Current Page', isActive: true }
    ]
  }
};

export const WithoutSidebar: Story = {
  args: {
    showSidebar: false,
    children: (
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white">Centered Content</h1>
        <p className="text-gray-300">This layout doesn't show the sidebar.</p>
        <Card>
          <CardContent>
            <h2 className="text-xl font-semibold text-white mb-4">Full Width Content</h2>
            <p className="text-gray-300">Content can expand across the full width when sidebar is hidden.</p>
          </CardContent>
        </Card>
      </div>
    )
  }
};

// Dashboard Layout Stories
export const DashboardLayoutStory: Story = {
  render: () => (
    <DashboardLayout
      title="Analytics Dashboard"
      description="Overview of platform metrics and performance"
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Dashboard', isActive: true }
      ]}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Export</Button>
          <Button variant="primary" size="sm">Refresh</Button>
        </div>
      }
    >
      <DashboardGrid cols={4}>
        <DashboardCard>
          <DashboardMetric
            label="Total Users"
            value="2,345"
            change="+12% from last month"
            changeType="positive"
            icon={
              <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            }
          />
        </DashboardCard>
        
        <DashboardCard>
          <DashboardMetric
            label="Revenue"
            value="$45,678"
            change="+8% from last month"
            changeType="positive"
            icon={
              <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            }
          />
        </DashboardCard>
        
        <DashboardCard>
          <DashboardMetric
            label="Active Sessions"
            value="1,234"
            change="-2% from last hour"
            changeType="negative"
            icon={
              <svg className="h-5 w-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
        </DashboardCard>
        
        <DashboardCard>
          <DashboardMetric
            label="Conversion Rate"
            value="3.24%"
            change="No change"
            changeType="neutral"
            icon={
              <svg className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </DashboardCard>
      </DashboardGrid>
      
      <DashboardGrid cols={2}>
        <DashboardCard title="Recent Activity">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">User registered</span>
              <span className="text-gray-500 text-sm">2 mins ago</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Payment processed</span>
              <span className="text-gray-500 text-sm">5 mins ago</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Report generated</span>
              <span className="text-gray-500 text-sm">10 mins ago</span>
            </div>
          </div>
        </DashboardCard>
        
        <DashboardCard title="System Status">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">API Status</span>
              <span className="text-green-500">Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Database</span>
              <span className="text-green-500">Healthy</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">CDN</span>
              <span className="text-yellow-500">Degraded</span>
            </div>
          </div>
        </DashboardCard>
      </DashboardGrid>
    </DashboardLayout>
  )
};

// Auth Layout Stories
export const AuthLayoutCenter: Story = {
  render: () => (
    <AuthLayout
      title="Sign In"
      description="Welcome back to Malkuth Platform"
      variant="center"
    >
      <div className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="Enter your email"
        />
        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
        />
        <Button fullWidth>Sign In</Button>
        <div className="text-center">
          <a href="#" className="text-sm text-gray-400 hover:text-white">
            Forgot your password?
          </a>
        </div>
      </div>
    </AuthLayout>
  )
};

export const AuthLayoutSplit: Story = {
  render: () => (
    <AuthLayout
      title="Create Account"
      description="Join the Malkuth Platform today"
      variant="split"
    >
      <div className="space-y-4">
        <Input
          label="Full Name"
          placeholder="Enter your full name"
        />
        <Input
          label="Email"
          type="email"
          placeholder="Enter your email"
        />
        <Input
          label="Password"
          type="password"
          placeholder="Create a password"
        />
        <Button fullWidth>Create Account</Button>
        <div className="text-center">
          <span className="text-sm text-gray-400">
            Already have an account?{' '}
            <a href="#" className="text-white hover:opacity-80">
              Sign in
            </a>
          </span>
        </div>
      </div>
    </AuthLayout>
  )
};