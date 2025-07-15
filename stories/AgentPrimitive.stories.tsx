import type { Meta, StoryObj } from '@storybook/react'
import { AgentPrimitive } from '@agentarea/react'

const meta: Meta<typeof AgentPrimitive.Root> = {
  title: 'Components/AgentPrimitive',
  component: AgentPrimitive.Root,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Agent primitive components for displaying agent information and status',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Mock data for stories
const mockCapabilities = [
  {
    name: 'Data Analysis',
    description: 'Analyze datasets and generate insights',
    inputTypes: ['csv', 'json', 'text'],
    outputTypes: ['json', 'chart', 'report']
  },
  {
    name: 'Document Generation',
    description: 'Create documents and reports',
    inputTypes: ['text', 'data'],
    outputTypes: ['pdf', 'docx', 'html']
  },
  {
    name: 'Code Review',
    description: 'Review and analyze code for best practices',
    inputTypes: ['javascript', 'typescript', 'python'],
    outputTypes: ['report', 'suggestions']
  }
]

// Agent Name Story
export const AgentName: Story = {
  render: () => (
    <AgentPrimitive.Name style={{ 
      fontSize: '24px', 
      fontWeight: 'bold',
      color: '#333'
    }}>
      Analytics Agent
    </AgentPrimitive.Name>
  ),
}

// Agent Description Story
export const AgentDescription: Story = {
  render: () => (
    <AgentPrimitive.Description style={{ 
      fontSize: '16px', 
      color: '#666',
      lineHeight: '1.5'
    }}>
      A specialized agent for data analysis, visualization, and insights generation. 
      Capable of processing various data formats and producing comprehensive reports.
    </AgentPrimitive.Description>
  ),
}

// Agent Status Story
export const AgentStatus: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px' }}>
      <AgentPrimitive.Status 
        data-connected="true"
        style={{ 
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: '#d4edda',
          color: '#155724',
          fontWeight: 'bold'
        }}
      >
        Connected
      </AgentPrimitive.Status>
      
      <AgentPrimitive.Status 
        data-connected="false"
        style={{ 
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          fontWeight: 'bold'
        }}
      >
        Disconnected
      </AgentPrimitive.Status>
    </div>
  ),
}

// Agent Capabilities Story
export const AgentCapabilities: Story = {
  render: () => (
    <div style={{ width: '400px' }}>
      <AgentPrimitive.Capabilities
        renderCapability={(capability) => (
          <div style={{ 
            padding: '12px',
            margin: '8px 0',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              {capability.name}
            </div>
            <div style={{ color: '#666', marginBottom: '8px' }}>
              {capability.description}
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              <span>Input: {capability.inputTypes.join(', ')}</span>
              <br />
              <span>Output: {capability.outputTypes.join(', ')}</span>
            </div>
          </div>
        )}
      >
        {mockCapabilities.map((capability, index) => (
          <AgentPrimitive.Capability
            key={capability.name}
            capability={capability}
          />
        ))}
      </AgentPrimitive.Capabilities>
    </div>
  ),
}

// Agent Features Story
export const AgentFeatures: Story = {
  render: () => (
    <AgentPrimitive.Features>
      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ 
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: '#d1ecf1',
          color: '#0c5460'
        }}>
          ✓ Streaming Supported
        </div>
        <div style={{ 
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: '#f8d7da',
          color: '#721c24'
        }}>
          ✗ Push Notifications
        </div>
      </div>
    </AgentPrimitive.Features>
  ),
}

// Complete Agent Card Story
export const CompleteAgentCard: Story = {
  render: () => (
    <div style={{ width: '500px', fontFamily: 'system-ui' }}>
      <AgentPrimitive.Root style={{ 
        padding: '24px', 
        border: '1px solid #e0e0e0', 
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <AgentPrimitive.Name style={{ 
            fontSize: '24px', 
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '8px'
          }}>
            Analytics Agent
          </AgentPrimitive.Name>
          
          <AgentPrimitive.Description style={{ 
            fontSize: '16px', 
            color: '#666',
            lineHeight: '1.5',
            marginBottom: '12px'
          }}>
            Advanced data analysis and visualization agent with machine learning capabilities
          </AgentPrimitive.Description>
          
          <AgentPrimitive.Status 
            data-connected="true"
            style={{ 
              display: 'inline-block',
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: '#d4edda',
              color: '#155724',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>Features</h4>
          <AgentPrimitive.Features>
            <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
              <span style={{ 
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: '#d1ecf1',
                color: '#0c5460'
              }}>
                Streaming
              </span>
              <span style={{ 
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: '#d4edda',
                color: '#155724'
              }}>
                Real-time Updates
              </span>
            </div>
          </AgentPrimitive.Features>
        </div>
        
        <div>
          <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Capabilities</h4>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {mockCapabilities.map((capability) => (
              <div key={capability.name} style={{ 
                padding: '8px',
                margin: '4px 0',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                backgroundColor: '#f8f9fa'
              }}>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>
                  {capability.name}
                </div>
                <div style={{ color: '#666', fontSize: '12px', marginTop: '2px' }}>
                  {capability.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </AgentPrimitive.Root>
    </div>
  ),
}