import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { vi, expect } from 'vitest'
import { AgentProvider } from '@agentarea/react'
import type { 
  AgentCard, 
  Task, 
  EnhancedArtifact, 
  TaskInputRequest, 
  InputResponse,
  CommunicationBlock,
  TaskInput,
  Capability
} from '@agentarea/core'

// Mock data generators
export const mockAgentCard = (overrides: Partial<AgentCard> = {}): AgentCard => ({
  name: 'Test Agent',
  description: 'A test agent for unit testing',
  capabilities: [
    {
      name: 'task-execution',
      description: 'Execute tasks',
      inputTypes: ['text'],
      outputTypes: ['text']
    },
    {
      name: 'file-processing',
      description: 'Process files',
      inputTypes: ['file'],
      outputTypes: ['text']
    }
  ],
  endpoints: {
    default: 'https://test-agent.example.com'
  },
  ...overrides
})

export const mockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  status: 'submitted',
  input: {
    message: {
      role: 'user',
      parts: [{
        type: 'text',
        content: 'Test prompt'
      }]
    }
  },
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides
})

export const mockArtifact = (overrides: Partial<EnhancedArtifact> = {}): EnhancedArtifact => ({
  id: 'artifact-1',
  type: 'text',
  displayType: 'text',
  content: { text: 'Test artifact content' },
  metadata: {
    createdAt: new Date('2024-01-01T00:00:00Z'),
    size: 1024,
    mimeType: 'text/plain'
  },
  downloadable: true,
  shareable: true,
  ...overrides
})

export const mockInputRequest = (overrides: Partial<TaskInputRequest> = {}): TaskInputRequest => ({
  id: 'input-1',
  taskId: 'task-1',
  type: 'text',
  prompt: 'Please provide input',
  required: true,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides
})

export const mockInputResponse = (overrides: Partial<InputResponse> = {}): InputResponse => ({
  requestId: 'input-1',
  taskId: 'task-1',
  value: 'Test response',
  timestamp: new Date('2024-01-01T00:00:00Z'),
  ...overrides
})

export const mockCommunicationBlock = (overrides: Partial<CommunicationBlock> = {}): CommunicationBlock => ({
  id: 'block-1',
  type: 'message',
  timestamp: new Date('2024-01-01T00:00:00Z'),
  source: 'agent-1',
  target: 'agent-2',
  content: { message: 'Test communication' },
  metadata: {},
  ...overrides
})

// ProtocolMessage type removed as it's not in core types

// Test wrapper component
interface TestWrapperProps {
  children: React.ReactNode
  agentProviderProps?: React.ComponentProps<typeof AgentProvider>
}

const TestWrapper: React.FC<TestWrapperProps> = ({ 
  children, 
  agentProviderProps = {} 
}) => {
  return (
    <AgentProvider {...agentProviderProps}>
      {children}
    </AgentProvider>
  )
}

// Custom render function
const customRender = (
  ui: React.ReactElement,
  options: RenderOptions & { wrapperProps?: TestWrapperProps['agentProviderProps'] } = {}
) => {
  const { wrapperProps, ...renderOptions } = options
  
  return render(ui, {
    wrapper: ({ children }) => (
      <TestWrapper agentProviderProps={wrapperProps}>
        {children}
      </TestWrapper>
    ),
    ...renderOptions
  })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Accessibility testing utilities
export const setupAxeMatchers = async () => {
  const { toHaveNoViolations } = await import('jest-axe')
  expect.extend(toHaveNoViolations)
}

// Call setup immediately
setupAxeMatchers()

// Performance testing utilities
export const measureRenderTime = async (renderFn: () => void): Promise<number> => {
  const start = performance.now()
  renderFn()
  const end = performance.now()
  return end - start
}

// Mock WebSocket for real-time testing
export class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.CONNECTING
  url: string
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  constructor(url: string) {
    this.url = url
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      this.onopen?.(new Event('open'))
    }, 0)
  }

  send(data: string | ArrayBuffer | Blob) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open')
    }
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.(new CloseEvent('close', { code, reason }))
  }

  // Test utilities
  simulateMessage(data: any) {
    if (this.readyState === MockWebSocket.OPEN) {
      this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }))
    }
  }

  simulateError() {
    this.onerror?.(new Event('error'))
  }
}

// Global WebSocket mock
global.WebSocket = MockWebSocket as any