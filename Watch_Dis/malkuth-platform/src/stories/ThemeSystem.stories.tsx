import type { Meta, StoryObj } from '@storybook/nextjs';
import { ThemeProvider, useTheme } from '@/lib/theme';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { Box, StyledBox, Text, Stack, Center, Container } from '@/components/ui/Polymorphic';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';

const meta: Meta = {
  title: 'Theme/System',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The complete theme system for Malkuth Platform, including theme providers, utilities, and composition patterns.'
      }
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

const ThemeShowcase = () => {
  const { resolvedTheme, mode, tokens } = useTheme();
  
  return (
    <Container size="xl" padding>
      <Stack spacing="xl">
        {/* Theme Header */}
        <StyledBox spacing="lg" direction="column" align="center" className="text-center">
          <Text as="h1" size="4xl" weight="bold">
            Malkuth Theme System
          </Text>
          <Text size="lg" color="secondary">
            Current theme: {resolvedTheme} (mode: {mode})
          </Text>
          <StyledBox direction="row" gap="md" className="mt-4">
            <ThemeToggle variant="button" showLabel />
            <ThemeToggle variant="switch" showLabel />
            <ThemeToggle variant="dropdown" />
          </StyledBox>
        </StyledBox>
        
        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
          </CardHeader>
          <CardContent>
            <Stack spacing="lg">
              <StyledBox direction="row" gap="md" wrap>
                <div className="space-y-2">
                  <Text weight="semibold">Primary Colors</Text>
                  <StyledBox direction="row" gap="sm" wrap>
                    {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(shade => (
                      <div key={shade} className="text-center">
                        <div 
                          className="w-12 h-12 rounded border border-gray-600"
                          style={{ backgroundColor: `var(--color-primary-${shade})` }}
                        />
                        <Text size="xs" color="muted">{shade}</Text>
                      </div>
                    ))}
                  </StyledBox>
                </div>
              </StyledBox>
              
              <StyledBox direction="row" gap="md" wrap>
                <div className="space-y-2">
                  <Text weight="semibold">Semantic Colors</Text>
                  <StyledBox direction="row" gap="sm" wrap>
                    {['success', 'warning', 'error', 'info'].map(color => (
                      <div key={color} className="text-center">
                        <div 
                          className="w-12 h-12 rounded border border-gray-600"
                          style={{ backgroundColor: `var(--color-${color}-500)` }}
                        />
                        <Text size="xs" color="muted" className="capitalize">{color}</Text>
                      </div>
                    ))}
                  </StyledBox>
                </div>
              </StyledBox>
            </Stack>
          </CardContent>
        </Card>
        
        {/* Typography Scale */}
        <Card>
          <CardHeader>
            <CardTitle>Typography Scale</CardTitle>
          </CardHeader>
          <CardContent>
            <Stack spacing="md">
              <Text size="xs">Extra Small Text (xs)</Text>
              <Text size="sm">Small Text (sm)</Text>
              <Text size="base">Base Text (base)</Text>
              <Text size="lg">Large Text (lg)</Text>
              <Text size="xl">Extra Large Text (xl)</Text>
              <Text size="2xl">2X Large Text (2xl)</Text>
              <Text size="3xl">3X Large Text (3xl)</Text>
              <Text size="4xl">4X Large Text (4xl)</Text>
            </Stack>
          </CardContent>
        </Card>
        
        {/* Component Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Component Variants</CardTitle>
          </CardHeader>
          <CardContent>
            <Stack spacing="lg">
              <div>
                <Text weight="semibold" className="mb-3">Buttons</Text>
                <StyledBox direction="row" gap="md" wrap>
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="success">Success</Button>
                </StyledBox>
              </div>
              
              <div>
                <Text weight="semibold" className="mb-3">Cards</Text>
                <StyledBox direction="row" gap="md" wrap>
                  <Card className="w-48">
                    <CardContent>
                      <Text>Default Card</Text>
                    </CardContent>
                  </Card>
                  <Card variant="outlined" className="w-48">
                    <CardContent>
                      <Text>Outlined Card</Text>
                    </CardContent>
                  </Card>
                  <Card variant="glass" className="w-48">
                    <CardContent>
                      <Text>Glass Card</Text>
                    </CardContent>
                  </Card>
                </StyledBox>
              </div>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
};

export const CompleteThemeSystem: Story = {
  render: () => (
    <ThemeProvider>
      <div className="min-h-screen bg-black text-white">
        <ThemeShowcase />
      </div>
    </ThemeProvider>
  )
};

export const PolymorphicComponents: Story = {
  render: () => (
    <Container size="lg" padding>
      <Stack spacing="xl">
        <Text as="h1" size="3xl" weight="bold" align="center">
          Polymorphic Components
        </Text>
        
        {/* Box Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Box Component</CardTitle>
          </CardHeader>
          <CardContent>
            <Stack spacing="md">
              <div>
                <Text weight="semibold" className="mb-2">Basic Box</Text>
                <StyledBox 
                  spacing="md" 
                  className="bg-gray-800 rounded"
                >
                  <Text>Content inside a box</Text>
                </StyledBox>
              </div>
              
              <div>
                <Text weight="semibold" className="mb-2">Flex Box (Row)</Text>
                <StyledBox 
                  direction="row" 
                  gap="md" 
                  spacing="md"
                  className="bg-gray-800 rounded"
                >
                  <div className="bg-blue-600 p-2 rounded">Item 1</div>
                  <div className="bg-green-600 p-2 rounded">Item 2</div>
                  <div className="bg-purple-600 p-2 rounded">Item 3</div>
                </StyledBox>
              </div>
              
              <div>
                <Text weight="semibold" className="mb-2">Polymorphic Box (as section)</Text>
                <StyledBox 
                  as="section"
                  spacing="md"
                  className="bg-gray-800 rounded border-l-4 border-blue-500"
                >
                  <Text>This box is rendered as a section element</Text>
                </StyledBox>
              </div>
            </Stack>
          </CardContent>
        </Card>
        
        {/* Text Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Text Component</CardTitle>
          </CardHeader>
          <CardContent>
            <Stack spacing="md">
              <Text as="h2" size="2xl" weight="bold">Heading (h2)</Text>
              <Text as="h3" size="xl" weight="semibold" color="secondary">Subheading (h3)</Text>
              <Text>Regular paragraph text</Text>
              <Text size="sm" color="muted">Small muted text</Text>
              <Text as="span" weight="bold" underline>Inline bold underlined text</Text>
              <Text italic truncate className="max-w-48">
                This is a very long text that will be truncated with an ellipsis
              </Text>
            </Stack>
          </CardContent>
        </Card>
        
        {/* Stack Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Stack Component</CardTitle>
          </CardHeader>
          <CardContent>
            <Stack spacing="lg">
              <div>
                <Text weight="semibold" className="mb-2">Vertical Stack</Text>
                <Stack 
                  spacing="sm" 
                  className="bg-gray-800 rounded p-4"
                >
                  <div className="bg-red-600 p-2 rounded">Item 1</div>
                  <div className="bg-yellow-600 p-2 rounded">Item 2</div>
                  <div className="bg-green-600 p-2 rounded">Item 3</div>
                </Stack>
              </div>
              
              <div>
                <Text weight="semibold" className="mb-2">Horizontal Stack</Text>
                <Stack 
                  direction="horizontal" 
                  spacing="sm"
                  className="bg-gray-800 rounded p-4"
                >
                  <div className="bg-red-600 p-2 rounded">Item 1</div>
                  <div className="bg-yellow-600 p-2 rounded">Item 2</div>
                  <div className="bg-green-600 p-2 rounded">Item 3</div>
                </Stack>
              </div>
              
              <div>
                <Text weight="semibold" className="mb-2">Stack with Divider</Text>
                <Stack 
                  direction="horizontal"
                  divider={<div className="w-px bg-gray-600 h-8" />}
                  className="bg-gray-800 rounded p-4"
                >
                  <div className="px-4">Section 1</div>
                  <div className="px-4">Section 2</div>
                  <div className="px-4">Section 3</div>
                </Stack>
              </div>
            </Stack>
          </CardContent>
        </Card>
        
        {/* Center Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Center Component</CardTitle>
          </CardHeader>
          <CardContent>
            <Stack spacing="md">
              <div>
                <Text weight="semibold" className="mb-2">Centered Content</Text>
                <Center className="bg-gray-800 rounded h-24">
                  <Text>Perfectly centered content</Text>
                </Center>
              </div>
              
              <div>
                <Text weight="semibold" className="mb-2">Inline Center</Text>
                <div className="bg-gray-800 rounded p-4">
                  Some text with <Center inline className="bg-blue-600 px-2 py-1 rounded">inline centered</Center> content.
                </div>
              </div>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  )
};

export const CompositionPatterns: Story = {
  render: () => (
    <Container size="lg" padding>
      <Stack spacing="xl">
        <Text as="h1" size="3xl" weight="bold" align="center">
          Composition Patterns
        </Text>
        
        {/* Layout Composition */}
        <Card>
          <CardHeader>
            <CardTitle>Layout Composition</CardTitle>
          </CardHeader>
          <CardContent>
            <StyledBox direction="column" gap="md">
              {/* Header */}
              <StyledBox 
                direction="row" 
                justify="between" 
                align="center"
                spacing="md"
                className="bg-gray-800 rounded"
              >
                <Text weight="semibold">Header</Text>
                <Button size="sm">Action</Button>
              </StyledBox>
              
              {/* Main Content */}
              <StyledBox direction="row" gap="md">
                {/* Sidebar */}
                <StyledBox 
                  spacing="md"
                  className="bg-gray-800 rounded w-48"
                >
                  <Text weight="semibold" className="mb-2">Sidebar</Text>
                  <Stack spacing="sm">
                    <Text size="sm">Link 1</Text>
                    <Text size="sm">Link 2</Text>
                    <Text size="sm">Link 3</Text>
                  </Stack>
                </StyledBox>
                
                {/* Content */}
                <StyledBox 
                  spacing="md"
                  className="bg-gray-800 rounded flex-1"
                >
                  <Text weight="semibold" className="mb-2">Main Content</Text>
                  <Text color="secondary">
                    This demonstrates how components can be composed together 
                    to create complex layouts while maintaining consistency.
                  </Text>
                </StyledBox>
              </StyledBox>
              
              {/* Footer */}
              <Center className="bg-gray-800 rounded py-4">
                <Text size="sm" color="muted">Footer Content</Text>
              </Center>
            </StyledBox>
          </CardContent>
        </Card>
        
        {/* Responsive Composition */}
        <Card>
          <CardHeader>
            <CardTitle>Responsive Composition</CardTitle>
          </CardHeader>
          <CardContent>
            <Text color="secondary" className="mb-4">
              Components automatically adapt to different screen sizes:
            </Text>
            <Stack spacing="md">
              <Container size="sm">
                <Center className="bg-blue-900 rounded py-8">
                  <Text>Small Container</Text>
                </Center>
              </Container>
              <Container size="md">
                <Center className="bg-green-900 rounded py-8">
                  <Text>Medium Container</Text>
                </Center>
              </Container>
              <Container size="lg">
                <Center className="bg-purple-900 rounded py-8">
                  <Text>Large Container</Text>
                </Center>
              </Container>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  )
};