import type { Meta, StoryObj } from '@storybook/react'
import React, { useState } from 'react'
import { Task } from '@agentarea/react'

const meta: Meta = {
  title: 'Components/Task',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Task components for creating and managing agent tasks with chat UI and advanced features',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Basic task input
export const BasicTaskInput: Story = {
  render: () => {
    const [value, setValue] = useState('')
    
    return (
      <div className="w-[400px]">
        <Task.Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onSend={(text) => {
            alert(`Task submitted: ${text}`)
            setValue('')
          }}
          placeholder="Describe what you want the agent to do..."
        />
        <p className="text-sm text-muted-foreground mt-2">
          Press Ctrl/Cmd + Enter to submit
        </p>
      </div>
    )
  },
}

// Task with send button
export const TaskWithSendButton: Story = {
  render: () => {
    const [taskInput, setTaskInput] = useState('Analyze the quarterly sales data')
    
    return (
      <div className="w-[400px] space-y-4">
        <Task.Input
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          placeholder="Describe your task..."
        />
        <Task.Send taskInput={taskInput}>
          Execute Task
        </Task.Send>
      </div>
    )
  },
}

// Task status indicators
export const TaskStatus: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Task.Status status="submitted" />
      <Task.Status status="working" />
      <Task.Status status="completed" />
      <Task.Status status="failed" />
      <Task.Status status="canceled" />
    </div>
  ),
}

// Task progress
export const TaskProgress: Story = {
  render: () => {
    // Mock task with progress
    const mockTask = {
      id: 'task_123',
      status: 'working' as const,
      progress: {
        percentage: 65,
        description: 'Processing customer data...',
        step: 2,
        totalSteps: 4
      },
      input: {
        message: {
          role: 'user' as const,
          parts: [{ type: 'text' as const, content: 'Generate customer report' }]
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return (
      <div className="w-[400px] space-y-4">
        <h3 className="font-semibold">Task Progress</h3>
        {/* Mock the useTask hook behavior */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">{mockTask.progress.description}</span>
            <span className="text-muted-foreground">{mockTask.progress.percentage}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all" 
              style={{ width: `${mockTask.progress.percentage}%` }}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Step {mockTask.progress.step} of {mockTask.progress.totalSteps}</span>
            <div className="flex gap-1 flex-1">
              {Array.from({ length: mockTask.progress.totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1 rounded-full ${
                    i < mockTask.progress!.step! ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  },
}

// Task chat interface
export const TaskChatInterface: Story = {
  render: () => {
    return (
      <div className="w-[600px] h-[500px]">
        <h3 className="mb-4 font-semibold">Task Chat Interface</h3>
        <Task.Chat
          enableMarkdown={true}
          enableFileUploads={true}
          enableToolCallApprovals={true}
          avatarAgent="🤖"
          avatarUser="👤"
          onSendMessage={(content, files) => {
            console.log('Message sent:', { content, files })
          }}
          className="h-full"
        />
      </div>
    )
  },
}

// Task list
export const TaskList: Story = {
  render: () => {
    const [filter, setFilter] = useState({
      status: [] as string[],
      search: ''
    })

    return (
      <div className="w-[600px] space-y-4">
        <h3 className="font-semibold">Task List</h3>
        
        {/* Filter controls */}
        <div className="flex gap-3 p-3 bg-muted rounded-lg">
          <input
            type="text"
            placeholder="Search tasks..."
            value={filter.search}
            onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
            className="flex-1 px-3 py-1 border rounded"
          />
          
          <select
            onChange={(e) => {
              const status = e.target.value
              setFilter(prev => ({
                ...prev,
                status: status ? [status] : []
              }))
            }}
            className="px-3 py-1 border rounded"
          >
            <option value="">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="working">Working</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        
        {/* Task list */}
        <Task.List
          filter={filter}
          sortBy="updatedAt"
          sortOrder="desc"
          maxItems={10}
          className="max-h-[300px] overflow-y-auto"
        />
      </div>
    )
  },
}

// Complete task workflow
export const CompleteTaskWorkflow: Story = {
  render: () => {
    const [currentView, setCurrentView] = useState<'input' | 'chat'>('input')
    const [taskInput, setTaskInput] = useState('')

    const handleTaskSubmit = () => {
      if (taskInput.trim()) {
        setCurrentView('chat')
      }
    }

    return (
      <div className="w-[700px] h-[600px] border border-border rounded-lg">
        <div className="p-4 border-b bg-muted">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Agent Task Interface</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentView('input')}
                className={`px-3 py-1 text-sm rounded ${
                  currentView === 'input' ? 'bg-primary text-primary-foreground' : 'bg-background'
                }`}
              >
                Create Task
              </button>
              <button
                onClick={() => setCurrentView('chat')}
                className={`px-3 py-1 text-sm rounded ${
                  currentView === 'chat' ? 'bg-primary text-primary-foreground' : 'bg-background'
                }`}
              >
                Chat
              </button>
            </div>
          </div>
        </div>

        <div className="h-[calc(100%-80px)]">
          {currentView === 'input' ? (
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Task Description
                </label>
                <Task.Input
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  onSend={handleTaskSubmit}
                  placeholder="Describe what you want the agent to do..."
                  className="min-h-[120px]"
                />
              </div>
              
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Press Ctrl/Cmd + Enter to submit, or click the button
                </p>
                <Task.Send taskInput={taskInput} onClick={handleTaskSubmit}>
                  Start Task
                </Task.Send>
              </div>
            </div>
          ) : (
            <Task.Chat
              enableMarkdown={true}
              enableFileUploads={true}
              enableToolCallApprovals={true}
              className="h-full"
            />
          )}
        </div>
      </div>
    )
  },
}