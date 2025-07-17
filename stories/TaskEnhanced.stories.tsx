import type { Meta, StoryObj } from '@storybook/react'
import { Task, Artifact, Input } from '@agentarea/react'
import type { EnhancedTask, TaskInputRequest, EnhancedArtifact } from '@agentarea/core'
import { useState } from 'react'

const meta: Meta<typeof Task> = {
  title: 'Components/Task Enhanced',
  component: Task,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Enhanced Task components with input collection and artifact display capabilities',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Mock enhanced task data
const mockEnhancedTask: EnhancedTask = {
  id: 'task-enhanced-1',
  title: 'Quarterly Sales Analysis',
  description: 'Analyze Q4 2024 sales data and generate comprehensive insights report',
  status: 'working',
  progress: 0.65,
  createdAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-01-15T14:30:00Z'),
  agentId: 'analytics-agent-1',
  metadata: {
    priority: 'high',
    category: 'analytics',
    estimatedDuration: '15-20 minutes'
  },
  inputRequests: [
    {
      id: 'input-req-1',
      taskId: 'task-enhanced-1',
      type: 'approval',
      prompt: 'Database Query Approval',
      required: true,
      metadata: {
        title: 'Execute Analytics Query',
        description: 'Permission needed to run complex analytics query on sales database',
        context: {
          query: 'SELECT * FROM sales_transactions WHERE date >= "2024-10-01"',
          database: 'production_sales',
          estimatedRows: 125000
        }
      }
    },
    {
      id: 'input-req-2',
      taskId: 'task-enhanced-1',
      type: 'form',
      prompt: 'Analysis Parameters',
      required: true,
      metadata: {
        fields: [
          {
            name: 'reportFormat',
            type: 'select',
            label: 'Report Format',
            options: [
              { value: 'pdf', label: 'PDF Report' },
              { value: 'excel', label: 'Excel Workbook' },
              { value: 'dashboard', label: 'Interactive Dashboard' }
            ]
          },
          {
            name: 'includeCharts',
            type: 'checkbox',
            label: 'Include visualizations'
          }
        ]
      }
    }
  ],
  inputResponses: [
    {
      requestId: 'input-req-1',
      taskId: 'task-enhanced-1',
      value: { approved: true, reason: 'Query looks safe for production' },
      timestamp: new Date('2024-01-15T10:15:00Z')
    }
  ],
  enhancedArtifacts: [
    {
      id: 'artifact-1',
      taskId: 'task-enhanced-1',
      displayType: 'data',
      content: {
        summary: {
          totalRevenue: 2450000,
          totalOrders: 8920,
          averageOrderValue: 274.72,
          topProduct: 'Premium Analytics Suite'
        },
        trends: {
          monthlyGrowth: 0.12,
          customerRetention: 0.87,
          newCustomers: 1240
        }
      },
      mimeType: 'application/json',
      size: 1024,
      createdAt: new Date('2024-01-15T14:20:00Z'),
      downloadable: true,
      shareable: true,
      metadata: {
        name: 'Sales Summary Data',
        format: 'JSON'
      }
    },
    {
      id: 'artifact-2',
      taskId: 'task-enhanced-1',
      displayType: 'code',
      content: {
        code: {
          language: 'sql',
          content: `-- Q4 2024 Sales Analysis Query
SELECT 
    DATE_TRUNC('month', order_date) as month,
    COUNT(*) as total_orders,
    SUM(order_total) as total_revenue,
    AVG(order_total) as avg_order_value,
    COUNT(DISTINCT customer_id) as unique_customers
FROM sales_transactions 
WHERE order_date >= '2024-10-01' 
    AND order_date < '2025-01-01'
    AND status = 'completed'
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month;`
        }
      },
      mimeType: 'text/x-sql',
      size: 512,
      createdAt: new Date('2024-01-15T14:25:00Z'),
      downloadable: true,
      shareable: true,
      metadata: {
        name: 'Analysis Query',
        language: 'sql'
      }
    }
  ],
  communicationBlocks: [
    {
      id: 'comm-1',
      type: 'message',
      source: 'analytics-agent-1',
      target: 'user',
      content: 'Starting data extraction from sales database...',
      timestamp: new Date('2024-01-15T10:16:00Z'),
      metadata: { step: 'data_extraction' }
    },
    {
      id: 'comm-2',
      type: 'status',
      source: 'analytics-agent-1',
      target: 'user',
      content: 'Processing 125,000 sales records...',
      timestamp: new Date('2024-01-15T10:18:00Z'),
      metadata: { step: 'data_processing', progress: 0.3 }
    }
  ]
}

const mockCompletedTask: EnhancedTask = {
  ...mockEnhancedTask,
  id: 'task-completed-1',
  title: 'Customer Segmentation Analysis',
  status: 'completed',
  progress: 1.0,
  inputRequests: [],
  inputResponses: [],
  enhancedArtifacts: [
    {
      id: 'artifact-report-1',
      taskId: 'task-completed-1',
      displayType: 'file',
      content: 'https://example.com/reports/customer_segmentation_report.pdf',
      mimeType: 'application/pdf',
      size: 2048576,
      createdAt: new Date('2024-01-15T12:00:00Z'),
      downloadable: true,
      shareable: true,
      metadata: {
        name: 'Customer Segmentation Report',
        pages: 18,
        format: 'PDF'
      }
    }
  ]
}

// Basic enhanced task
export const EnhancedTaskWithInputs: Story = {
  render: () => (
    <div className="w-[800px]">
      <Task 
        task={mockEnhancedTask}
        showProgress={true}
        showMetadata={true}
      />
    </div>
  ),
}

// Task with input requests
export const TaskWithInputRequests: Story = {
  render: () => {
    const [task, setTask] = useState(mockEnhancedTask)
    
    const handleInputResponse = (requestId: string, response: any) => {
      setTask(prev => ({
        ...prev,
        inputResponses: [
          ...(prev.inputResponses || []),
          {
            requestId,
            taskId: prev.id,
            value: response,
            timestamp: new Date()
          }
        ]
      }))
    }
    
    return (
      <div className="w-[800px] space-y-6">
        <Task task={task} showProgress={true} />
        
        {/* Input Requests Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Pending Input Requests</h3>
          {task.inputRequests?.map((request) => {
            const hasResponse = task.inputResponses?.some(r => r.requestId === request.id)
            if (hasResponse) return null
            
            if (request.type === 'approval') {
              return (
                <Input.Approval
                  key={request.id}
                  request={request}
                  onSubmit={(response) => handleInputResponse(request.id, response.value)}
                />
              )
            }
            
            if (request.type === 'form') {
              return (
                <Input.Form
                  key={request.id}
                  request={request}
                  onSubmit={(response) => handleInputResponse(request.id, response.value)}
                />
              )
            }
            
            return null
          })}
        </div>
      </div>
    )
  },
}

// Task with artifacts
export const TaskWithArtifacts: Story = {
  render: () => (
    <div className="w-[800px] space-y-6">
      <Task task={mockCompletedTask} showProgress={true} />
      
      {/* Artifacts Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Generated Artifacts</h3>
        <div className="grid gap-4">
          {mockCompletedTask.enhancedArtifacts?.map((artifact) => (
            <Artifact
              key={artifact.id}
              artifact={artifact}
              onDownload={(artifact) => console.log('Download:', artifact.metadata?.name)}
              onShare={(artifact) => console.log('Share:', artifact.metadata?.name)}
            />
          ))}
        </div>
      </div>
    </div>
  ),
}

// Task chat with enhanced features
export const TaskChatEnhanced: Story = {
  render: () => {
    const [messages, setMessages] = useState([
      {
        role: 'user' as const,
        content: 'Please analyze our Q4 sales data and provide insights',
        timestamp: new Date('2024-01-15T10:00:00Z')
      },
      {
        role: 'agent' as const,
        content: 'I\'ll analyze your Q4 sales data. First, I need permission to access the sales database.',
        timestamp: new Date('2024-01-15T10:01:00Z')
      }
    ])
    
    const [inputRequests, setInputRequests] = useState([
      mockEnhancedTask.inputRequests![0]
    ])
    
    const handleInputResponse = (requestId: string, response: any) => {
      setInputRequests(prev => prev.filter(req => req.id !== requestId))
      setMessages(prev => [...prev, {
        role: 'user' as const,
        content: `✅ Approved database access: ${response.reason || 'No reason provided'}`,
        timestamp: new Date()
      }, {
        role: 'agent' as const,
        content: 'Thank you! I\'ll now proceed with the analysis. This may take a few minutes.',
        timestamp: new Date()
      }])
    }
    
    return (
      <div className="w-[800px] h-[600px] border rounded-lg flex flex-col">
        <div className="p-4 border-b bg-muted/30">
          <h3 className="font-semibold">Task Chat: {mockEnhancedTask.title}</h3>
          <div className="text-sm text-muted-foreground">
            Status: {mockEnhancedTask.status} • Progress: {Math.round(mockEnhancedTask.progress * 100)}%
          </div>
        </div>
        
        <div className="flex-1 p-4 overflow-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <div className="text-sm">{message.content}</div>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {/* Input requests in chat */}
          {inputRequests.map((request) => (
            <div key={request.id} className="border rounded-lg p-4 bg-background">
              <Input.Approval
                request={request}
                onSubmit={(response) => handleInputResponse(request.id, response.value)}
              />
            </div>
          ))}
        </div>
      </div>
    )
  },
}

// Task progress with real-time updates
export const TaskProgressRealTime: Story = {
  render: () => {
    const [task, setTask] = useState({
      ...mockEnhancedTask,
      progress: 0.1,
      status: 'working' as const
    })
    
    // Simulate progress updates
    React.useEffect(() => {
      const interval = setInterval(() => {
        setTask(prev => {
          const newProgress = Math.min(prev.progress + 0.1, 1.0)
          return {
            ...prev,
            progress: newProgress,
            status: newProgress >= 1.0 ? 'completed' as const : 'working' as const,
            updatedAt: new Date()
          }
        })
      }, 2000)
      
      return () => clearInterval(interval)
    }, [])
    
    return (
      <div className="w-[700px] space-y-4">
        <Task task={task} showProgress={true} showMetadata={true} />
        
        <div className="p-3 bg-muted rounded text-sm">
          <p><strong>This task simulates real-time progress updates.</strong></p>
          <p>Progress will automatically increment every 2 seconds.</p>
        </div>
      </div>
    )
  },
}

// Task with communication blocks
export const TaskWithCommunication: Story = {
  render: () => (
    <div className="w-[800px] space-y-6">
      <Task task={mockEnhancedTask} showProgress={true} />
      
      {/* Communication Timeline */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Communication Timeline</h3>
        <div className="space-y-3">
          {mockEnhancedTask.communicationBlocks?.map((block) => (
            <div key={block.id} className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{block.source}</span>
                  <span className="text-xs text-muted-foreground">
                    {block.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm">{String(block.content)}</div>
                {block.metadata?.step && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Step: {block.metadata.step}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
}

// Multiple tasks dashboard
export const TaskDashboard: Story = {
  render: () => {
    const tasks = [
      mockEnhancedTask,
      mockCompletedTask,
      {
        ...mockEnhancedTask,
        id: 'task-3',
        title: 'Inventory Optimization',
        status: 'pending' as const,
        progress: 0,
        inputRequests: [],
        enhancedArtifacts: []
      },
      {
        ...mockEnhancedTask,
        id: 'task-4',
        title: 'Customer Churn Prediction',
        status: 'failed' as const,
        progress: 0.3,
        inputRequests: [],
        enhancedArtifacts: [],
        metadata: {
          ...mockEnhancedTask.metadata,
          error: 'Insufficient training data'
        }
      }
    ]
    
    return (
      <div className="w-[900px] space-y-4">
        <h2 className="text-xl font-bold">Task Dashboard</h2>
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Task
              key={task.id}
              task={task}
              showProgress={true}
              showMetadata={true}
              compact={true}
            />
          ))}
        </div>
      </div>
    )
  },
}

// Task error states
export const TaskErrorStates: Story = {
  render: () => {
    const errorTasks = [
      {
        ...mockEnhancedTask,
        id: 'error-task-1',
        title: 'Failed Database Connection',
        status: 'failed' as const,
        progress: 0.2,
        metadata: {
          error: 'Connection timeout after 30 seconds',
          errorCode: 'DB_TIMEOUT',
          retryCount: 3
        }
      },
      {
        ...mockEnhancedTask,
        id: 'error-task-2',
        title: 'Insufficient Permissions',
        status: 'blocked' as const,
        progress: 0,
        metadata: {
          error: 'Missing required permissions to access customer data',
          errorCode: 'PERMISSION_DENIED',
          requiredPermissions: ['read:customer_data', 'read:sales_data']
        }
      }
    ]
    
    return (
      <div className="w-[700px] space-y-4">
        {errorTasks.map((task) => (
          <Task
            key={task.id}
            task={task}
            showProgress={true}
            showMetadata={true}
          />
        ))}
      </div>
    )
  },
}