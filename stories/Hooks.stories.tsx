import type { Meta, StoryObj } from '@storybook/react'
import React, { useState } from 'react'
import { 
  useAgent, 
  useAgentCard, 
  useAgentCapabilities, 
  useConnection,
  useTask,
  useTaskList,
  useTaskCreation
} from '@agentarea/react'

const meta: Meta = {
  title: 'Hooks/Examples',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Examples of AgentArea hooks in action',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// useAgent hook example
const UseAgentExample = () => {
  const { 
    isConnected, 
    agentCard, 
    capabilities, 
    supportsStreaming, 
    supportsPushNotifications,
    error 
  } = useAgent()

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h3>useAgent() Hook</h3>
      <div style={{ marginBottom: '16px' }}>
        <strong>Connection Status:</strong> {isConnected ? '✅ Connected' : '❌ Disconnected'}
      </div>
      
      {agentCard && (
        <div style={{ marginBottom: '16px' }}>
          <strong>Agent:</strong> {agentCard.name}
          <div style={{ color: '#666', fontSize: '14px' }}>{agentCard.description}</div>
        </div>
      )}
      
      <div style={{ marginBottom: '16px' }}>
        <strong>Features:</strong>
        <div>
          Streaming: {supportsStreaming() ? '✅' : '❌'} | 
          Push Notifications: {supportsPushNotifications() ? '✅' : '❌'}
        </div>
      </div>
      
      <div>
        <strong>Capabilities:</strong> {capabilities.length} available
      </div>
      
      {error && (
        <div style={{ color: 'red', marginTop: '16px' }}>
          Error: {error.message}
        </div>
      )}
    </div>
  )
}

export const UseAgentHook: Story = {
  render: () => <UseAgentExample />
}

// useAgentCard hook example
const UseAgentCardExample = () => {
  const agentCard = useAgentCard()

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h3>useAgentCard() Hook</h3>
      {agentCard ? (
        <div style={{ 
          border: '1px solid #e0e0e0', 
          borderRadius: '8px', 
          padding: '16px',
          backgroundColor: '#f9f9f9'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
            {agentCard.name}
          </div>
          <div style={{ color: '#666', marginBottom: '12px' }}>
            {agentCard.description}
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            Version: {agentCard.version}
          </div>
          {agentCard.supportedFeatures && (
            <div style={{ marginTop: '8px' }}>
              <strong>Features:</strong> {agentCard.supportedFeatures.join(', ')}
            </div>
          )}
        </div>
      ) : (
        <div>No agent card available</div>
      )}
    </div>
  )
}

export const UseAgentCardHook: Story = {
  render: () => <UseAgentCardExample />
}

// useAgentCapabilities hook example
const UseAgentCapabilitiesExample = () => {
  const capabilities = useAgentCapabilities()

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h3>useAgentCapabilities() Hook</h3>
      <div>Found {capabilities.length} capabilities:</div>
      <div style={{ marginTop: '16px' }}>
        {capabilities.map((capability, index) => (
          <div key={index} style={{ 
            border: '1px solid #e0e0e0', 
            borderRadius: '6px', 
            padding: '12px',
            marginBottom: '8px',
            backgroundColor: '#f8f9fa'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              {capability.name}
            </div>
            <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
              {capability.description}
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              Input: {capability.inputTypes.join(', ')} | 
              Output: {capability.outputTypes.join(', ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const UseAgentCapabilitiesHook: Story = {
  render: () => <UseAgentCapabilitiesExample />
}

// useConnection hook example
const UseConnectionExample = () => {
  const { isConnected, error, connect, disconnect } = useConnection()

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h3>useConnection() Hook</h3>
      <div style={{ marginBottom: '16px' }}>
        <strong>Status:</strong> {isConnected ? '✅ Connected' : '❌ Disconnected'}
      </div>
      
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <button 
          onClick={connect}
          disabled={isConnected}
          style={{
            padding: '8px 16px',
            backgroundColor: isConnected ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isConnected ? 'not-allowed' : 'pointer'
          }}
        >
          Connect
        </button>
        <button 
          onClick={disconnect}
          disabled={!isConnected}
          style={{
            padding: '8px 16px',
            backgroundColor: !isConnected ? '#ccc' : '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !isConnected ? 'not-allowed' : 'pointer'
          }}
        >
          Disconnect
        </button>
      </div>
      
      {error && (
        <div style={{ color: 'red', padding: '8px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
          Error: {error.message}
        </div>
      )}
    </div>
  )
}

export const UseConnectionHook: Story = {
  render: () => <UseConnectionExample />
}

// useTaskCreation hook example
const UseTaskCreationExample = () => {
  const { createTask, createStreamingTask, isCreating, error, canStream } = useTaskCreation()
  const [taskInput, setTaskInput] = useState('Analyze the quarterly sales data')
  const [lastTaskId, setLastTaskId] = useState<string | null>(null)
  const [streamingResults, setStreamingResults] = useState<string[]>([])

  const handleCreateTask = async () => {
    try {
      const response = await createTask({
        message: {
          role: 'user',
          parts: [{ type: 'text', content: taskInput }]
        }
      })
      setLastTaskId(response.taskId)
    } catch (err) {
      console.error('Failed to create task:', err)
    }
  }

  const handleCreateStreamingTask = async () => {
    try {
      setStreamingResults([])
      for await (const update of createStreamingTask({
        message: {
          role: 'user',
          parts: [{ type: 'text', content: taskInput }]
        }
      })) {
        setStreamingResults(prev => [...prev, `${update.type}: ${update.task.status}`])
        if (update.type === 'task-completed') {
          setLastTaskId(update.taskId)
        }
      }
    } catch (err) {
      console.error('Failed to create streaming task:', err)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h3>useTaskCreation() Hook</h3>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Task Description:
        </label>
        <textarea
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          style={{
            width: '100%',
            minHeight: '60px',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontFamily: 'inherit'
          }}
        />
      </div>
      
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <button 
          onClick={handleCreateTask}
          disabled={isCreating}
          style={{
            padding: '8px 16px',
            backgroundColor: isCreating ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isCreating ? 'not-allowed' : 'pointer'
          }}
        >
          {isCreating ? 'Creating...' : 'Create Task'}
        </button>
        
        {canStream && (
          <button 
            onClick={handleCreateStreamingTask}
            disabled={isCreating}
            style={{
              padding: '8px 16px',
              backgroundColor: isCreating ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isCreating ? 'not-allowed' : 'pointer'
            }}
          >
            {isCreating ? 'Streaming...' : 'Create Streaming Task'}
          </button>
        )}
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <strong>Can Stream:</strong> {canStream ? '✅ Yes' : '❌ No'}
      </div>
      
      {lastTaskId && (
        <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#d4edda', borderRadius: '4px' }}>
          Last created task ID: <code>{lastTaskId}</code>
        </div>
      )}
      
      {streamingResults.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <strong>Streaming Results:</strong>
          <div style={{ 
            maxHeight: '150px', 
            overflowY: 'auto', 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            padding: '8px',
            backgroundColor: '#f8f9fa',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            {streamingResults.map((result, index) => (
              <div key={index}>{result}</div>
            ))}
          </div>
        </div>
      )}
      
      {error && (
        <div style={{ color: 'red', padding: '8px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
          Error: {error.message}
        </div>
      )}
    </div>
  )
}

export const UseTaskCreationHook: Story = {
  render: () => <UseTaskCreationExample />
}

// useTaskList hook example
const UseTaskListExample = () => {
  const { 
    tasks, 
    getTasksByStatus, 
    getActiveTasks, 
    getCompletedTasks,
    totalTasks,
    activeTasks,
    completedTasks 
  } = useTaskList()

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h3>useTaskList() Hook</h3>
      
      <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
        <div>
          <strong>Total:</strong> {totalTasks}
        </div>
        <div>
          <strong>Active:</strong> {activeTasks}
        </div>
        <div>
          <strong>Completed:</strong> {completedTasks}
        </div>
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <strong>All Tasks ({tasks.length}):</strong>
        {tasks.length === 0 ? (
          <div style={{ color: '#666', fontStyle: 'italic' }}>
            No tasks yet. Create a task using the useTaskCreation hook above.
          </div>
        ) : (
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {tasks.map((task) => (
              <div key={task.id} style={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: '4px', 
                padding: '8px',
                marginBottom: '4px',
                backgroundColor: '#f8f9fa'
              }}>
                <div style={{ fontSize: '12px', color: '#888' }}>ID: {task.id}</div>
                <div>
                  <span style={{ 
                    padding: '2px 6px', 
                    borderRadius: '3px', 
                    fontSize: '11px',
                    backgroundColor: getStatusColor(task.status),
                    color: 'white'
                  }}>
                    {task.status.toUpperCase()}
                  </span>
                </div>
                {task.progress && (
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {task.progress.percentage}% - {task.progress.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function getStatusColor(status: string) {
  const colors = {
    submitted: '#ffa500',
    working: '#4169e1',
    completed: '#32cd32',
    failed: '#ff4444',
    canceled: '#666666'
  }
  return colors[status as keyof typeof colors] || '#ccc'
}

export const UseTaskListHook: Story = {
  render: () => <UseTaskListExample />
}