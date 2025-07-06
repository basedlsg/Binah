import type { Meta, StoryObj } from '@storybook/nextjs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile card component for grouping related content. Supports multiple variants and hover effects.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outlined', 'glass'],
      description: 'Visual style variant of the card'
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Internal padding size'
    },
    hover: {
      control: 'boolean',
      description: 'Enables hover effects'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>This is a card description that explains what this card is about.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is the main content of the card. It can contain any React elements.</p>
        </CardContent>
        <CardFooter>
          <Button variant="primary">Action</Button>
          <Button variant="outline">Cancel</Button>
        </CardFooter>
      </>
    )
  }
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: (
      <>
        <CardHeader>
          <CardTitle>Outlined Card</CardTitle>
          <CardDescription>This card has a outlined variant style.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Content with outlined styling.</p>
        </CardContent>
      </>
    )
  }
};

export const Glass: Story = {
  args: {
    variant: 'glass',
    children: (
      <>
        <CardHeader>
          <CardTitle>Glass Card</CardTitle>
          <CardDescription>This card has a glass effect with backdrop blur.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Content with glass morphism effect.</p>
        </CardContent>
      </>
    )
  }
};

export const Hoverable: Story = {
  args: {
    hover: true,
    children: (
      <>
        <CardHeader>
          <CardTitle>Hoverable Card</CardTitle>
          <CardDescription>This card has hover effects enabled.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Hover over this card to see the effect.</p>
        </CardContent>
      </>
    )
  }
};

export const NoPadding: Story = {
  args: {
    padding: 'none',
    children: (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Custom Padding</h3>
        <p className="text-gray-300">This card has no default padding, allowing for custom spacing.</p>
      </div>
    )
  }
};

export const SimpleContent: Story = {
  args: {
    children: (
      <CardContent>
        <h3 className="text-lg font-semibold text-white mb-2">Simple Card</h3>
        <p className="text-gray-300">A card with just content, no header or footer.</p>
      </CardContent>
    )
  }
};

export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Feature 1</CardTitle>
          <CardDescription>Description of the first feature</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Detailed information about this feature.</p>
        </CardContent>
      </Card>
      
      <Card variant="outlined">
        <CardHeader>
          <CardTitle>Feature 2</CardTitle>
          <CardDescription>Description of the second feature</CardDescription>
        </CardHeader>
        <CardContent>
          <p>More information about this outlined card.</p>
        </CardContent>
      </Card>
      
      <Card variant="glass" hover>
        <CardHeader>
          <CardTitle>Feature 3</CardTitle>
          <CardDescription>Interactive glass card</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This card combines glass effect with hover interactions.</p>
        </CardContent>
      </Card>
      
      <Card hover>
        <CardHeader>
          <CardTitle>Feature 4</CardTitle>
          <CardDescription>Hoverable card</CardDescription>
        </CardHeader>
        <CardContent>
          <p>A standard card with hover effects enabled.</p>
        </CardContent>
        <CardFooter>
          <Button size="sm">Learn More</Button>
        </CardFooter>
      </Card>
    </div>
  ),
  parameters: {
    layout: 'padded'
  }
};