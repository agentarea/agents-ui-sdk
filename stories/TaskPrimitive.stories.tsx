import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { TaskPrimitive } from '@agentarea/react'

// Mock runtime and provider for stories
const meta: Meta<typeof TaskPrimitive.Root> = {
  title: 'Components/TaskPrimitive',
  component: TaskPrimitive.Root,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Task primitive components for creating and managing agent tasks',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    taskId: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Task Input Story
export const TaskInput: Story = {
  render: () => (
    <div style={{ width: '400px' }}>
      <TaskPrimitive.Input
        onSubmit={fn()}
        placeholder="Describe your task..."
        style={{ 
          width: '100%', 
          minHeight: '100px', 
          padding: '12px',
          border: '1px solid #ccc',
          borderRadius: '8px',
          fontFamily: 'inherit'
        }}
      />
    </div>
  ),
}

// Task Send Button Story
export const TaskSend: Story = {
  render: () => (
    <TaskPrimitive.Send
      taskInput="Example task description"
      style={{
        padding: '12px 24px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer'
      }}
    >
      Send Task
    </TaskPrimitive.Send>
  ),
}

// Task Status Story
export const TaskStatus: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      {(['submitted', 'working', 'completed', 'failed', 'canceled'] as const).map(status => (
        <TaskPrimitive.Status
          key={status}
          status={status}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            backgroundColor: getStatusColor(status),
            color: status === 'completed' ? 'black' : 'white'
          }}
        />
      ))}
    </div>
  ),
}

// Task Progress Story
export const TaskProgress: Story = {
  render: () => (
    <div style={{ width: '300px' }}>
      <TaskPrimitive.Progress>
        <div>
          <div style={{ marginBottom: '8px' }}>Processing data...</div>
          <div style={{ 
            width: '100%', 
            height: '8px', 
            backgroundColor: '#e0e0e0', 
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: '65%', 
              height: '100%', 
              backgroundColor: '#007bff',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
            65% complete
          </div>
        </div>
      </TaskPrimitive.Progress>
    </div>
  ),
}

// Complete Task Interface Story
export const CompleteTaskInterface: Story = {
  render: () => (
    <div style={{ width: '500px', fontFamily: 'system-ui' }}>
      <TaskPrimitive.Root style={{ 
        padding: '24px', 
        border: '1px solid #e0e0e0', 
        borderRadius: '12px',
        backgroundColor: '#fafafa'
      }}>
        <h3 style={{ margin: '0 0 16px 0' }}>Create New Task</h3>
        
        <TaskPrimitive.Input
          onSubmit={fn()}
          placeholder="Describe what you want the agent to do..."
          style={{ 
            width: '100%', 
            minHeight: '80px', 
            padding: '12px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            fontFamily: 'inherit',
            marginBottom: '12px',
            resize: 'vertical'
          }}
        />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TaskPrimitive.Status
            status="submitted"
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              backgroundColor: '#ffa500',
              color: 'black'
            }}
          />
          
          <TaskPrimitive.Send
            taskInput="Example task"
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Send Task
          </TaskPrimitive.Send>
        </div>
      </TaskPrimitive.Root>
    </div>
  ),
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