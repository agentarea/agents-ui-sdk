import type { Meta, StoryObj } from '@storybook/react'
import { useAgentContext, useInputContext } from '@agentarea/react'

const meta: Meta = {
  title: 'Testing/Provider Setup',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Testing that all providers are properly configured in Storybook',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Component to test provider access
function ProviderTestComponent() {
  const agentContext = useAgentContext()
  const inputContext = useInputContext()
  
  return (
    <div className="p-6 border rounded-lg bg-background">
      <h3 className="text-lg font-semibold mb-4">Provider Test</h3>
      
      <div className="space-y-4">
        <div className="p-3 bg-muted rounded">
          <h4 className="font-medium mb-2">Agent Context</h4>
          <p className="text-sm">
            Status: {agentContext ? '✅ Available' : '❌ Missing'}
          </p>
          {agentContext && (
            <div className="text-xs text-muted-foreground mt-1">
              Connected: {agentContext.isConnected ? 'Yes' : 'No'}
            </div>
          )}
        </div>
        
        <div className="p-3 bg-muted rounded">
          <h4 className="font-medium mb-2">Input Context</h4>
          <p className="text-sm">
            Status: {inputContext ? '✅ Available' : '❌ Missing'}
          </p>
          {inputContext && (
            <div className="text-xs text-muted-foreground mt-1">
              Active Requests: {inputContext.activeRequests.length}
            </div>
          )}
        </div>
        
        <div className="p-3 bg-primary/10 border border-primary/20 rounded">
          <h4 className="font-medium mb-2">Styling Test</h4>
          <p className="text-sm mb-2">Testing Tailwind CSS classes:</p>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90">
              Primary Button
            </button>
            <button className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/90">
              Secondary Button
            </button>
            <button className="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm hover:bg-destructive/90">
              Destructive Button
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export const ProviderSetupTest: Story = {
  render: () => <ProviderTestComponent />,
}

// Test individual components without complex dependencies
export const BasicStylingTest: Story = {
  render: () => (
    <div className="w-[600px] space-y-4">
      <div className="p-4 bg-card border rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-card-foreground mb-2">
          Basic Styling Test
        </h3>
        <p className="text-muted-foreground mb-4">
          This tests that Tailwind CSS and shadcn/ui styles are working correctly.
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-primary text-primary-foreground rounded">
            Primary Background
          </div>
          <div className="p-3 bg-secondary text-secondary-foreground rounded">
            Secondary Background
          </div>
          <div className="p-3 bg-muted text-muted-foreground rounded">
            Muted Background
          </div>
          <div className="p-3 bg-accent text-accent-foreground rounded">
            Accent Background
          </div>
        </div>
        
        <div className="mt-4 p-3 border border-border rounded">
          <p className="text-sm">
            Border color test with <code className="bg-muted px-1 rounded">inline code</code>
          </p>
        </div>
      </div>
    </div>
  ),
}