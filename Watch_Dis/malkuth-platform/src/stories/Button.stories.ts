import type { Meta, StoryObj } from '@storybook/nextjs';
import { Button } from '@/components/ui/Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component with multiple variants, sizes, and states. Supports loading states and full-width layouts.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive', 'success'],
      description: 'Visual style variant of the button'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Size of the button'
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading spinner when true'
    },
    fullWidth: {
      control: 'boolean',
      description: 'Makes button take full width of container'
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Button',
    variant: 'primary'
  }
};

export const Secondary: Story = {
  args: {
    children: 'Button',
    variant: 'secondary'
  }
};

export const Outline: Story = {
  args: {
    children: 'Button',
    variant: 'outline'
  }
};

export const Ghost: Story = {
  args: {
    children: 'Button',
    variant: 'ghost'
  }
};

export const Destructive: Story = {
  args: {
    children: 'Delete',
    variant: 'destructive'
  }
};

export const Success: Story = {
  args: {
    children: 'Save',
    variant: 'success'
  }
};

export const Loading: Story = {
  args: {
    children: 'Loading...',
    loading: true,
    variant: 'primary'
  }
};

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
    variant: 'primary'
  }
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  )
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="success">Success</Button>
    </div>
  )
};

export const FullWidth: Story = {
  args: {
    children: 'Full Width Button',
    fullWidth: true,
    variant: 'primary'
  },
  parameters: {
    layout: 'padded'
  }
};
