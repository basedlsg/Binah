import type { Preview } from '@storybook/nextjs'
import '../src/styles/globals.css'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#000000',
        },
        {
          name: 'light',
          value: '#ffffff',
        },
      ],
    },
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    docs: {
      theme: {
        base: 'dark',
        brandTitle: 'Malkuth Platform',
        brandUrl: 'https://malkuth-platform.com',
        colorPrimary: '#ffffff',
        colorSecondary: '#a3a3a3',
        appBg: '#000000',
        appContentBg: '#0a0a0a',
        appBorderColor: '#262626',
        textColor: '#ffffff',
        textInverseColor: '#000000',
        barTextColor: '#a3a3a3',
        barSelectedColor: '#ffffff',
        barBg: '#171717',
        inputBg: '#262626',
        inputBorder: '#404040',
        inputTextColor: '#ffffff',
      }
    },
    layout: 'centered',
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'dark',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'dark', title: 'Dark' },
          { value: 'light', title: 'Light' },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;