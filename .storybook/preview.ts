import type { Preview } from '@storybook/react'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      description: {
        component: 'AgentArea UI SDK - Protocol-agnostic React UI library for agent communication',
      },
    },
  },
  tags: ['autodocs'],
}

export default preview