import type { Meta, StoryObj } from '@storybook/react'
import { Block } from '@agentarea/react'
import type { ProtocolMessage, CommunicationBlock } from '@agentarea/core'

const meta: Meta<typeof Block.Message> = {
  title: 'Components/Block',
  component: Block.Message,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Communication block components for displaying agent-to-agent messages and protocol exchanges',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onExpand: { action: 'expand' },
    onCollapse: { action: 'collapse' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Mock protocol messages for stories
const mockProtocolMessage: ProtocolMessage = {
  id: 'msg-001',
  type: 'task_request',
  source: 'user-agent',
  target: 'analytics-agent',
  payload: {
    taskType: 'data_analysis',
    parameters: {
      dataset: 'sales_q4_2024.csv',
      analysisType: 'descriptive',
      outputFormat: 'report'
    },
    priority: 'high',
    deadline: '2024-01-20T18:00:00Z'
  },
  timestamp: new Date('2024-01-15T14:30:00Z'),
  metadata: {
    correlationId: 'corr-123',
    sessionId: 'session-456',
    version: '1.0'
  }
}

const mockResponseMessage: ProtocolMessage = {
  id: 'msg-002',
  type: 'task_response',
  source: 'analytics-agent',
  target: 'user-agent',
  payload: {
    status: 'completed',
    result: {
      summary: 'Analysis completed successfully',
      insights: [
        'Revenue increased by 23% compared to Q3',
        'Top performing product category: Electronics',
        'Customer retention rate improved to 87%'
      ],
      artifactIds: ['artifact-001', 'artifact-002']
    },
    executionTime: 45.2
  },
  timestamp: new Date('2024-01-15T14:32:15Z'),
  metadata: {
    correlationId: 'corr-123',
    sessionId: 'session-456',
    version: '1.0'
  }
}

const mockErrorMessage: ProtocolMessage = {
  id: 'msg-003',
  type: 'error',
  source: 'database-agent',
  target: 'analytics-agent',
  payload: {
    errorCode: 'CONNECTION_TIMEOUT',
    message: 'Failed to connect to database after 30 seconds',
    details: {
      host: 'db.example.com',
      port: 5432,
      database: 'analytics',
      retryAttempts: 3
    },
    recoverable: true
  },
  timestamp: new Date('2024-01-15T14:31:45Z'),
  metadata: {
    correlationId: 'corr-124',
    severity: 'high'
  }
}

const mockCommunicationBlock: CommunicationBlock = {
  id: 'block-001',
  type: 'message',
  source: 'workflow-orchestrator',
  target: 'broadcast',
  content: {
    announcement: 'System maintenance scheduled for tonight at 2 AM UTC',
    duration: '30 minutes',
    affectedServices: ['analytics', 'reporting', 'data-export'],
    alternativeEndpoint: 'backup.example.com'
  },
  timestamp: new Date('2024-01-15T16:00:00Z'),
  metadata: {
    priority: 'high',
    category: 'maintenance',
    broadcastType: 'system'
  }
}

// Basic message stories
export const BasicMessage: Story = {
  args: {
    message: mockProtocolMessage,
    showMetadata: true,
    showTimestamp: true,
    showRouting: true,
  },
}

export const ResponseMessage: Story = {
  args: {
    message: mockResponseMessage,
    showMetadata: true,
    showTimestamp: true,
    showRouting: true,
  },
}

export const ErrorMessage: Story = {
  args: {
    message: mockErrorMessage,
    showMetadata: true,
    showTimestamp: true,
    showRouting: true,
    isError: true,
  },
}

export const CommunicationBlockMessage: Story = {
  args: {
    message: mockCommunicationBlock,
    showMetadata: true,
    showTimestamp: true,
    showRouting: true,
  },
}

// Expandable message
export const ExpandableMessage: Story = {
  args: {
    message: {
      ...mockProtocolMessage,
      payload: {
        ...mockProtocolMessage.payload,
        largeDataset: Array(20).fill(0).map((_, i) => ({
          id: i + 1,
          name: `Item ${i + 1}`,
          value: Math.random() * 1000,
          category: ['A', 'B', 'C'][i % 3]
        }))
      }
    },
    expandable: true,
    showMetadata: true,
  },
}

// Correlated messages
export const CorrelatedMessages: Story = {
  render: () => (
    <div className="w-[700px] space-y-4">
      <Block.Message
        message={mockProtocolMessage}
        showCorrelation={true}
        showMetadata={false}
      />
      
      <Block.Message
        message={mockResponseMessage}
        correlatedMessage={mockProtocolMessage}
        showCorrelation={true}
        showMetadata={false}
      />
    </div>
  ),
}

// Protocol component stories
export const ProtocolDisplay: Story = {
  render: () => (
    <div className="w-[600px] space-y-4">
      <Block.Protocol
        protocol={{
          type: 'A2A',
          version: '1.2.0',
          features: [
            'task_delegation',
            'real_time_updates',
            'file_transfer',
            'authentication',
            'encryption'
          ],
          compliance: {
            level: 'full',
            issues: []
          }
        }}
        showFeatures={true}
        showCompliance={true}
      />
      
      <Block.Protocol
        protocol={{
          type: 'AgentArea Custom',
          version: '2.1.0',
          features: [
            'batch_processing',
            'streaming',
            'webhooks',
            'analytics'
          ],
          compliance: {
            level: 'partial',
            issues: [
              {
                severity: 'warning',
                message: 'Rate limiting not implemented for batch operations'
              },
              {
                severity: 'info',
                message: 'Consider implementing request signing for enhanced security'
              }
            ]
          }
        }}
        showFeatures={true}
        showCompliance={true}
      />
    </div>
  ),
}

export const ProtocolWithIssues: Story = {
  render: () => (
    <div className="w-[600px]">
      <Block.Protocol
        protocol={{
          type: 'Legacy Protocol',
          version: '0.9.0',
          features: ['basic_messaging'],
          compliance: {
            level: 'minimal',
            issues: [
              {
                severity: 'error',
                message: 'Missing required authentication headers'
              },
              {
                severity: 'error',
                message: 'Deprecated message format detected'
              },
              {
                severity: 'warning',
                message: 'No encryption support available'
              },
              {
                severity: 'info',
                message: 'Consider upgrading to version 2.0+'
              }
            ]
          }
        }}
        showFeatures={true}
        showCompliance={true}
        expandable={true}
      />
    </div>
  ),
}

// Status component stories
export const ConnectionStatus: Story = {
  render: () => (
    <div className="w-[500px] space-y-4">
      <Block.Status
        status={{
          type: 'connection',
          state: 'online',
          message: 'Connected to analytics-agent',
          lastUpdate: new Date(),
          metrics: {
            latency: 45,
            uptime: 86400, // 24 hours
            errorRate: 0.02
          }
        }}
        showMetrics={true}
      />
      
      <Block.Status
        status={{
          type: 'connection',
          state: 'connecting',
          message: 'Establishing connection to database-agent...',
          lastUpdate: new Date(),
          metrics: {
            latency: 120
          }
        }}
        showMetrics={true}
      />
      
      <Block.Status
        status={{
          type: 'connection',
          state: 'error',
          message: 'Failed to connect to payment-agent',
          lastUpdate: new Date(),
          details: {
            errorCode: 'ECONNREFUSED',
            host: 'payment-service.internal',
            port: 8080,
            lastSuccessfulConnection: '2024-01-15T12:30:00Z'
          }
        }}
        showMetrics={false}
        showDetails={true}
      />
    </div>
  ),
}

export const TaskStatus: Story = {
  render: () => (
    <div className="w-[500px] space-y-4">
      <Block.Status
        status={{
          type: 'task',
          state: 'working',
          message: 'Processing data analysis request',
          lastUpdate: new Date(),
          details: {
            taskId: 'task-123',
            progress: 0.65,
            estimatedCompletion: '2024-01-15T15:00:00Z',
            currentStep: 'feature_extraction'
          }
        }}
        showDetails={true}
      />
      
      <Block.Status
        status={{
          type: 'task',
          state: 'idle',
          message: 'Waiting for new tasks',
          lastUpdate: new Date(),
          metrics: {
            uptime: 3600,
            errorRate: 0
          }
        }}
        showMetrics={true}
      />
    </div>
  ),
}

export const AgentStatus: Story = {
  render: () => (
    <div className="w-[500px] space-y-4">
      <Block.Status
        status={{
          type: 'agent',
          state: 'online',
          message: 'Analytics Agent v2.1.0 ready',
          lastUpdate: new Date(),
          metrics: {
            uptime: 172800, // 48 hours
            errorRate: 0.01
          },
          details: {
            version: '2.1.0',
            capabilities: ['data_analysis', 'visualization', 'reporting'],
            loadAverage: 0.3,
            memoryUsage: 0.45
          }
        }}
        showMetrics={true}
        showDetails={true}
      />
      
      <Block.Status
        status={{
          type: 'agent',
          state: 'error',
          message: 'Agent crashed due to memory overflow',
          lastUpdate: new Date(),
          details: {
            errorType: 'OutOfMemoryError',
            stackTrace: 'java.lang.OutOfMemoryError: Java heap space...',
            restartAttempts: 2,
            lastRestart: '2024-01-15T14:45:00Z'
          }
        }}
        showDetails={true}
      />
    </div>
  ),
}

// Real-time status updates
export const RealTimeStatus: Story = {
  render: () => (
    <div className="w-[500px]">
      <Block.Status
        status={{
          type: 'system',
          state: 'working',
          message: 'Live system monitoring',
          lastUpdate: new Date(),
          metrics: {
            latency: Math.floor(Math.random() * 100) + 20,
            uptime: 259200, // 72 hours
            errorRate: Math.random() * 0.05
          }
        }}
        showMetrics={true}
        realTime={true}
      />
      <div className="mt-4 p-3 bg-muted rounded text-sm">
        <p><strong>This status block simulates real-time updates with animation.</strong></p>
      </div>
    </div>
  ),
}

// Metadata component stories
export const MetadataDisplay: Story = {
  render: () => (
    <div className="w-[600px] space-y-4">
      <Block.Metadata
        metadata={{
          sessionId: 'session-789',
          userId: 'user-456',
          timestamp: '2024-01-15T14:30:00Z',
          version: '1.0',
          environment: 'production',
          region: 'us-east-1'
        }}
        title="Session Metadata"
        expandable={true}
        defaultExpanded={false}
      />
      
      <Block.Metadata
        metadata={{
          requestId: 'req-001',
          correlationId: 'corr-123',
          traceId: 'trace-456',
          spanId: 'span-789',
          parentSpanId: 'span-012',
          baggage: {
            userId: 'user-456',
            sessionId: 'session-789',
            feature: 'analytics'
          },
          tags: {
            service: 'analytics-agent',
            version: '2.1.0',
            environment: 'production'
          },
          logs: [
            { level: 'info', message: 'Request received', timestamp: '2024-01-15T14:30:00Z' },
            { level: 'debug', message: 'Validating input parameters', timestamp: '2024-01-15T14:30:01Z' },
            { level: 'info', message: 'Processing started', timestamp: '2024-01-15T14:30:02Z' }
          ]
        }}
        title="Request Tracing"
        expandable={true}
        defaultExpanded={true}
        maxHeight={300}
      />
    </div>
  ),
}

// Complex message thread
export const MessageThread: Story = {
  render: () => {
    const messages = [
      {
        ...mockProtocolMessage,
        id: 'msg-thread-1',
        type: 'task_request',
        timestamp: new Date('2024-01-15T14:30:00Z')
      },
      {
        id: 'msg-thread-2',
        type: 'task_accepted',
        source: 'analytics-agent',
        target: 'user-agent',
        payload: {
          taskId: 'task-123',
          estimatedDuration: '2-3 minutes',
          status: 'accepted'
        },
        timestamp: new Date('2024-01-15T14:30:05Z'),
        metadata: { correlationId: 'corr-123' }
      },
      {
        id: 'msg-thread-3',
        type: 'task_progress',
        source: 'analytics-agent',
        target: 'user-agent',
        payload: {
          taskId: 'task-123',
          progress: 0.5,
          currentStep: 'data_processing',
          message: 'Processing 50% complete'
        },
        timestamp: new Date('2024-01-15T14:31:30Z'),
        metadata: { correlationId: 'corr-123' }
      },
      {
        ...mockResponseMessage,
        id: 'msg-thread-4',
        timestamp: new Date('2024-01-15T14:32:15Z')
      }
    ]
    
    return (
      <div className="w-[700px] space-y-3">
        <h3 className="text-lg font-semibold mb-4">Message Thread</h3>
        {messages.map((message, index) => (
          <Block.Message
            key={message.id}
            message={message as ProtocolMessage}
            showMetadata={false}
            showTimestamp={true}
            showRouting={true}
            correlatedMessage={index > 0 ? messages[0] as ProtocolMessage : undefined}
            showCorrelation={index > 0}
          />
        ))}
      </div>
    )
  },
}

// Error handling and edge cases
export const ErrorStates: Story = {
  render: () => (
    <div className="w-[600px] space-y-4">
      <Block.Message
        message={{
          id: 'error-msg-1',
          type: 'malformed_request',
          source: 'unknown',
          target: 'system',
          payload: null,
          timestamp: new Date(),
          metadata: {}
        } as ProtocolMessage}
        isError={true}
        showMetadata={true}
      />
      
      <Block.Status
        status={{
          type: 'connection',
          state: 'error',
          message: 'Critical system failure',
          lastUpdate: new Date(),
          details: {
            errorCode: 'SYSTEM_FAILURE',
            severity: 'critical',
            affectedServices: ['all']
          }
        }}
        showDetails={true}
      />
      
      <Block.Metadata
        metadata={{}}
        title="Empty Metadata"
        expandable={false}
      />
    </div>
  ),
}

// Performance with large data
export const LargeDataHandling: Story = {
  render: () => {
    const largePayload = {
      dataPoints: Array(1000).fill(0).map((_, i) => ({
        id: i,
        timestamp: new Date(Date.now() - i * 1000).toISOString(),
        value: Math.random() * 100,
        category: `Category ${i % 10}`,
        metadata: {
          source: `sensor-${i % 50}`,
          quality: Math.random() > 0.1 ? 'good' : 'poor'
        }
      })),
      summary: {
        totalPoints: 1000,
        averageValue: 50.5,
        categories: 10,
        timeRange: '16.7 minutes'
      }
    }
    
    return (
      <div className="w-[700px]">
        <Block.Message
          message={{
            id: 'large-msg-1',
            type: 'data_stream',
            source: 'sensor-array',
            target: 'analytics-engine',
            payload: largePayload,
            timestamp: new Date(),
            metadata: {
              size: JSON.stringify(largePayload).length,
              compression: 'gzip'
            }
          } as ProtocolMessage}
          expandable={true}
          showMetadata={true}
        />
        <div className="mt-4 p-3 bg-muted rounded text-sm">
          <p><strong>This message contains 1000 data points to test large payload handling.</strong></p>
        </div>
      </div>
    )
  },
}