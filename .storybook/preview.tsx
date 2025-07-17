import type { Preview } from '@storybook/react'
import React from 'react'
import './globals.css'

// Error Boundary for Storybook
class StorybookErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Storybook Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 border border-destructive bg-destructive/10 rounded-lg">
          <h2 className="text-lg font-semibold text-destructive mb-2">
            Story Error
          </h2>
          <p className="text-sm text-destructive/80 mb-4">
            This story encountered an error while rendering. Check the console for details.
          </p>
          <details className="text-xs">
            <summary className="cursor-pointer font-medium">Error Details</summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {this.state.error?.toString()}
            </pre>
          </details>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="mt-4 px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    docs: {
      toc: true,
    },
  },
  
  decorators: [
    (Story, context) => {
      return (
        <StorybookErrorBoundary>
          <div className="min-h-screen bg-background text-foreground">
            <div className="p-5">
              <Story />
            </div>
          </div>
        </StorybookErrorBoundary>
      )
    },
  ],
}

export default preview