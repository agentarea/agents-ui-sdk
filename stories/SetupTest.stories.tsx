import type { Meta, StoryObj } from '@storybook/react'
import { useAgentContext, useInputContext, Button } from '@agentarea/react'

const meta: Meta = {
  title: 'Setup/Configuration Test',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Testing that Storybook is properly configured with providers and styling',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Simple test component
function ConfigurationTest() {
  const agentContext = useAgentContext()
  const inputContext = useInputContext()
  
  return (
    <div className="max-w-2xl space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          🎉 Storybook Configuration Test
        </h1>
        <p className="text-muted-foreground">
          Testing providers, styling, and component rendering
        </p>
      </div>
      
      {/* Provider Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <span className={agentContext ? "text-green-600" : "text-red-600"}>
              {agentContext ? "✅" : "❌"}
            </span>
            Agent Provider
          </h3>
          <p className="text-sm text-muted-foreground">
            {agentContext ? "Successfully connected" : "Not available"}
          </p>
          {agentContext && (
            <div className="mt-2 text-xs">
              <div>Connected: {agentContext.isConnected ? "Yes" : "No"}</div>
            </div>
          )}
        </div>
        
        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <span className={inputContext ? "text-green-600" : "text-red-600"}>
              {inputContext ? "✅" : "❌"}
            </span>
            Input Provider
          </h3>
          <p className="text-sm text-muted-foreground">
            {inputContext ? "Successfully loaded" : "Not available"}
          </p>
          {inputContext && (
            <div className="mt-2 text-xs">
              <div>Active Requests: {inputContext.activeRequests.length}</div>
            </div>
          )}
        </div>
      </div>
      
      {/* Styling Test */}
      <div className="p-4 border rounded-lg bg-card">
        <h3 className="font-semibold mb-4">Tailwind CSS & shadcn/ui Styling Test</h3>
        
        <div className="space-y-4">
          {/* Color Palette */}
          <div>
            <h4 className="text-sm font-medium mb-2">Color Palette</h4>
            <div className="grid grid-cols-4 gap-2">
              <div className="p-3 bg-primary text-primary-foreground rounded text-center text-xs">
                Primary
              </div>
              <div className="p-3 bg-secondary text-secondary-foreground rounded text-center text-xs">
                Secondary
              </div>
              <div className="p-3 bg-muted text-muted-foreground rounded text-center text-xs">
                Muted
              </div>
              <div className="p-3 bg-accent text-accent-foreground rounded text-center text-xs">
                Accent
              </div>
            </div>
          </div>
          
          {/* Buttons */}
          <div>
            <h4 className="text-sm font-medium mb-2">Button Components</h4>
            <div className="flex flex-wrap gap-2">
              <Button variant="default" size="sm">Default</Button>
              <Button variant="secondary" size="sm">Secondary</Button>
              <Button variant="outline" size="sm">Outline</Button>
              <Button variant="ghost" size="sm">Ghost</Button>
              <Button variant="destructive" size="sm">Destructive</Button>
            </div>
          </div>
          
          {/* Typography */}
          <div>
            <h4 className="text-sm font-medium mb-2">Typography</h4>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">Heading 1</h1>
              <h2 className="text-xl font-semibold">Heading 2</h2>
              <h3 className="text-lg font-medium">Heading 3</h3>
              <p className="text-base">Regular paragraph text</p>
              <p className="text-sm text-muted-foreground">Muted text</p>
              <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">
                Inline code
              </code>
            </div>
          </div>
        </div>
      </div>
      
      {/* Status Summary */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-green-600 text-xl">🎯</span>
          <div>
            <h3 className="font-semibold text-green-800">Configuration Status</h3>
            <p className="text-sm text-green-700">
              {agentContext && inputContext 
                ? "✅ All providers are working correctly!"
                : "⚠️ Some providers may not be configured properly"
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export const ConfigurationCheck: Story = {
  render: () => <ConfigurationTest />,
}

// Simple component test without complex dependencies
export const BasicComponentTest: Story = {
  render: () => (
    <div className="w-[500px] space-y-4">
      <div className="p-6 border rounded-lg bg-card shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Basic Component Test</h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded">
            <span className="font-medium">Tailwind Classes</span>
            <span className="text-green-600">✅ Working</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted rounded">
            <span className="font-medium">CSS Variables</span>
            <span className="text-green-600">✅ Working</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted rounded">
            <span className="font-medium">Component Rendering</span>
            <span className="text-green-600">✅ Working</span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            🎉 If you can see this styled correctly, the basic setup is working!
          </p>
        </div>
      </div>
    </div>
  ),
}