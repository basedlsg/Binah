import type { Meta, StoryObj } from '@storybook/nextjs';
import AnimatedOwlLogo from '@/components/ui/AnimatedOwlLogo';
import PageTransition from '@/components/ui/PageTransition';
import { Card, CardContent } from '@/components/ui/Card';

const meta: Meta<typeof AnimatedOwlLogo> = {
  title: 'UI/Animations',
  component: AnimatedOwlLogo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Animated components and transitions for the Malkuth platform. These respect user motion preferences and provide engaging visual feedback.'
      }
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

export const OwlLogoPulse: Story = {
  args: {
    size: 'header',
    animationType: 'pulse'
  }
};

export const OwlLogoFloat: Story = {
  args: {
    size: 'header',
    animationType: 'float'
  }
};

export const OwlLogoGlow: Story = {
  args: {
    size: 'header',
    animationType: 'glow'
  }
};

export const OwlLogoBlink: Story = {
  args: {
    size: 'header',
    animationType: 'blink'
  }
};

export const OwlLogoCombined: Story = {
  args: {
    size: 'landing',
    animationType: 'combined'
  }
};

export const OwlLogoSizes: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="text-center">
        <AnimatedOwlLogo size="icon" animationType="pulse" />
        <p className="text-sm text-gray-400 mt-2">Icon</p>
      </div>
      <div className="text-center">
        <AnimatedOwlLogo size="header" animationType="float" />
        <p className="text-sm text-gray-400 mt-2">Header</p>
      </div>
      <div className="text-center">
        <AnimatedOwlLogo size="landing" animationType="combined" />
        <p className="text-sm text-gray-400 mt-2">Landing</p>
      </div>
    </div>
  )
};

export const PageTransitions: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
      <PageTransition variant="fade">
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold text-white mb-2">Fade Transition</h3>
            <p className="text-gray-300">Content appears with a gentle fade effect.</p>
          </CardContent>
        </Card>
      </PageTransition>
      
      <PageTransition variant="slideLeft" delay={100}>
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold text-white mb-2">Slide Left</h3>
            <p className="text-gray-300">Content slides in from the right side.</p>
          </CardContent>
        </Card>
      </PageTransition>
      
      <PageTransition variant="slideRight" delay={200}>
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold text-white mb-2">Slide Right</h3>
            <p className="text-gray-300">Content slides in from the left side.</p>
          </CardContent>
        </Card>
      </PageTransition>
      
      <PageTransition variant="scale" delay={300}>
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold text-white mb-2">Scale Transition</h3>
            <p className="text-gray-300">Content appears with a scaling effect.</p>
          </CardContent>
        </Card>
      </PageTransition>
    </div>
  ),
  parameters: {
    layout: 'padded'
  }
};

export const LoadingStates: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-4">Loading Animations</h3>
      </div>
      
      <div className="flex justify-center items-center gap-8">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-gray-400">Spin</p>
        </div>
        
        <div className="text-center">
          <div className="flex space-x-1 mb-2">
            <div className="h-3 w-3 bg-white rounded-full animate-bounce"></div>
            <div className="h-3 w-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="h-3 w-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-sm text-gray-400">Dots</p>
        </div>
        
        <div className="text-center">
          <AnimatedOwlLogo size="icon" animationType="pulse" className="mb-2" />
          <p className="text-sm text-gray-400">Owl Pulse</p>
        </div>
      </div>
    </div>
  )
};

export const InteractiveAnimations: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-4">Interactive Animations</h3>
        <p className="text-gray-400 mb-6">Hover and click the elements below</p>
      </div>
      
      <div className="flex justify-center gap-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer mb-2"></div>
          <p className="text-sm text-gray-400">Hover Scale</p>
        </div>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-green-600 rounded-lg transition-all hover:rotate-12 hover:shadow-lg cursor-pointer mb-2"></div>
          <p className="text-sm text-gray-400">Hover Rotate</p>
        </div>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-600 rounded-lg transition-all hover:rounded-full cursor-pointer mb-2"></div>
          <p className="text-sm text-gray-400">Hover Shape</p>
        </div>
        
        <div className="text-center cursor-pointer">
          <AnimatedOwlLogo 
            size="header" 
            animationType="blink" 
            className="transition-transform hover:scale-110 mb-2" 
          />
          <p className="text-sm text-gray-400">Hover Owl</p>
        </div>
      </div>
    </div>
  )
};

export const AccessibilityRespectful: Story = {
  render: () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Accessibility Aware</h3>
        <p className="text-gray-400">
          All animations respect the user's motion preferences. 
          Users with reduced motion preferences will see simplified or no animations.
        </p>
      </div>
      
      <Card>
        <CardContent>
          <h4 className="font-semibold text-white mb-3">Motion Preference Support</h4>
          <ul className="space-y-2 text-gray-300">
            <li>• Automatically detects prefers-reduced-motion setting</li>
            <li>• Provides fallback static states for reduced motion</li>
            <li>• Maintains functionality without animations</li>
            <li>• Uses semantic duration and easing values</li>
          </ul>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-2 gap-4">
        <PageTransition variant="fade">
          <Card variant="outlined">
            <CardContent>
              <h5 className="font-medium text-white mb-1">Normal Motion</h5>
              <p className="text-sm text-gray-400">Full animations enabled</p>
            </CardContent>
          </Card>
        </PageTransition>
        
        <Card variant="outlined">
          <CardContent>
            <h5 className="font-medium text-white mb-1">Reduced Motion</h5>
            <p className="text-sm text-gray-400">Instant or minimal animations</p>
          </CardContent>
        </Card>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded'
  }
};