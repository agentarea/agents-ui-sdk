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
  ProtocolMessage 
} from '@agentarea/core'

// Mock data generators
export const mockAgentCard = (overrides: Partial<AgentCard> = {}): AgentCard => ({
  id: 'agent-1',
  name: 'Test Agent',
  description: 'A test agent for unit testing',
  endpoint: 'https://test-agent.example.com',
  capabilities: ['task-execution', 'file-processing'],
  status: 'online',
  version: '1.0.0',
  metadata: {},
  ...overrides
})

export const mockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Test Task',
  description: 'A test task for unit testing',
  status: 'pending',
  progress: 0,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  agentId: 'agent-1',
  input: { prompt: 'Test prompt' },
  metadata: {},
  ...overrides
})

export const mockArtifact = (overrides: Partial<EnhancedArtifact> = {}): EnhancedArtifact => ({
  id: 'artifact-1',
  taskId: 'task-1',
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
  type: 'text',
  prompt: 'Please provide input',
  required: true,
  validation: [],
  metadata: {},
  ...overrides
})

export const mockInputResponse = (overrides: Partial<InputResponse> = {}): InputResponse => ({
  requestId: 'input-1',
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

export const mockProtocolMessage = (overrides: Partial<ProtocolMessage> = {}): ProtocolMessage => ({
  id: 'msg-1',
  type: 'task-request',
  source: 'agent-1',
  target: 'agent-2',
  payload: { task: 'test task' },
  timestamp: new Date('2024-01-01T00:00:00Z'),
  metadata: {},
  ...overrides
})

// Test wrapper component
interface TestWrapperProps {
  children: React.ReactNode
  agentProviderProps?: React.ComponentProps<typeof AgentProvider>
}

const TestWrapper: React.FC<TestWrapperProps> = ({ 
  children, 
  agentProviderProps = {} 
}) => {
  const defaultProps = {
    agents: [mockAgentCard()],
    selectedAgent: mockAgentCard(),
    tasks: [mockTask()],
    connections: [],
    connectionStatus: {},
    activeInputRequests: [],
    protocolMessages: [],
    communicationBlocks: [],
    connectToAgent: vi.fn(),
    disconnectFromAgent: vi.fn(),
    submitTask: vi.fn(),
    respondToInputRequest: vi.fn(),
    sendProtocolMessage: vi.fn()
  }

  return (
    <AgentProvider {...defaultProps} {...agentProviderProps}>
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
export const axeMatchers = {
  toHaveNoViolations: expect.extend({
    async toHaveNoViolations(received: any) {
      const { axe, toHaveNoViolations } = await import('jest-axe')
      expect.extend(toHaveNoViolations)
      
      const results = await axe(received)
      return {
        pass: results.violations.length === 0,
        message: () => {
          if (results.violations.length === 0) {
            return 'Expected element to have accessibility violations, but none were found'
          }
          return `Expected element to have no accessibility violations, but found ${results.violations.length}:\n${
            results.violations.map(v => `- ${v.description}`).join('\n')
          }`
        }
      }
    }
  })
}

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