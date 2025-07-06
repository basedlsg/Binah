import type { Meta, StoryObj } from '@storybook/nextjs';
import { OwlLogo } from '@/components/ui/icons/OwlLogo';

const meta: Meta<typeof OwlLogo> = {
  title: 'UI/Icons/OwlLogo',
  component: OwlLogo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'The main owl logo for the Malkuth platform. Represents wisdom and observation in a minimalist design. Available in multiple sizes with animation support.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['icon', 'header', 'landing'],
      description: 'Size variant of the logo'
    },
    animated: {
      control: 'boolean',
      description: 'Enables subtle animation effects'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Icon: Story = {
  args: {
    size: 'icon'
  }
};

export const Header: Story = {
  args: {
    size: 'header'
  }
};

export const Landing: Story = {
  args: {
    size: 'landing'
  }
};

export const Animated: Story = {
  args: {
    size: 'header',
    animated: true
  }
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="text-center">
        <OwlLogo size="icon" />
        <p className="text-sm text-gray-400 mt-2">Icon (24px)</p>
      </div>
      <div className="text-center">
        <OwlLogo size="header" />
        <p className="text-sm text-gray-400 mt-2">Header (48px)</p>
      </div>
      <div className="text-center">
        <OwlLogo size="landing" />
        <p className="text-sm text-gray-400 mt-2">Landing (120px)</p>
      </div>
    </div>
  )
};

export const WithColors: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="text-center">
        <OwlLogo size="header" className="text-white" />
        <p className="text-sm text-gray-400 mt-2">White</p>
      </div>
      <div className="text-center">
        <OwlLogo size="header" className="text-gray-400" />
        <p className="text-sm text-gray-400 mt-2">Gray</p>
      </div>
      <div className="text-center">
        <OwlLogo size="header" className="text-blue-500" />
        <p className="text-sm text-gray-400 mt-2">Blue</p>
      </div>
    </div>
  )
};