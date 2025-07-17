import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AgentProvider, useAgent } from '../agent-provider'
import { mockAgentCard, mockTask, mockInputRequest } from '@test-utils'

// Test component that uses the agent context
const TestConsumer = () => {
  const {
    agents,
    selectedAgent,
    tasks,
    connections,
    connectionStatus,
    activeInputRequests,
    connectToAgent,
    disconnectFromAgent,
    submitTask,
    respondToInputRequest
  } = useAgent()

  return (
    <div>
      <div data-testid="agents-count">{agents.length}</div>
      <div data-testid="selected-agent">{selectedAgent?.name || 'None'}</div>
      <div data-testid="tasks-count">{tasks.length}</div>
      <div data-testid="connections-count">{connections.length}</div>
      <div data-testid="input-requests-count">{activeInputRequests.length}</div>
      
      <button onClick={() => connectToAgent('https://test.com', {})}>
        Connect
      </button>
      <button onClick={() => disconnectFromAgent('conn-1')}>
        Disconnect
      </button>
      <button onClick={() => submitTask({ prompt: 'test' })}>
        Submit Task
      </button>
      <button onClick={() => respondToInputRequest('input-1', { value: 'response' })}>
        Respond to Input
      </button>
    </div>
  )
}

describe('AgentProvider', () => {
  const mockAgents = [
    mockAgentCard({ id: 'agent-1', name: 'Agent 1' }),
    mockAgentCard({ id: 'agent-2', name: 'Agent 2' })
  ]

  const mockTasks = [
    mockTask({ id: 'task-1', agentId: 'agent-1' }),
    mockTask({ id: 'task-2', agentId: 'agent-2' })
  ]

  const mockConnections = [
    {
      id: 'conn-1',
      agentId: 'agent-1',
      endpoint: 'https://agent1.com',
      status: 'connected' as const,
      protocols: ['a2a'],
      metadata: {},
      createdAt: new Date(),
      lastActivity: new Date()
    }
  ]

  const mockInputRequests = [
    mockInputRequest({ id: 'input-1' }),
    mockInputRequest({ id: 'input-2' })
  ]

  const defaultProps = {
    agents: mockAgents,
    selectedAgent: mockAgents[0],
    tasks: mockTasks,
    connections: mockConnections,
    connectionStatus: { 'conn-1': 'connected' as const },
    activeInputRequests: mockInputRequests,
    protocolMessages: [],
    communicationBlocks: [],
    connectToAgent: vi.fn(),
    disconnectFromAgent: vi.fn(),
    submitTask: vi.fn(),
    respondToInputRequest: vi.fn(),
    sendProtocolMessage: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('provides agent context to children', () => {
    render(
      <AgentProvider {...defaultProps}>
        <TestConsumer />
      </AgentProvider>
    )

    expect(screen.getByTestId('agents-count')).toHaveTextContent('2')
    expect(screen.getByTestId('selected-agent')).toHaveTextContent('Agent 1')
    expect(screen.getByTestId('tasks-count')).toHaveTextContent('2')
    expect(screen.getByTestId('connections-count')).toHaveTextContent('1')
    expect(screen.getByTestId('input-requests-count')).toHaveTextContent('2')
  })

  it('calls connectToAgent when connect button is clicked', () => {
    render(
      <AgentProvider {...defaultProps}>
        <TestConsumer />
      </AgentProvider>
    )

    const connectButton = screen.getByRole('button', { name: /connect/i })
    fireEvent.click(connectButton)

    expect(defaultProps.connectToAgent).toHaveBeenCalledWith('https://test.com', {})
  })

  it('calls disconnectFromAgent when disconnect button is clicked', () => {
    render(
      <AgentProvider {...defaultProps}>
        <TestConsumer />
      </AgentProvider>
    )

    const disconnectButton = screen.getByRole('button', { name: /disconnect/i })
    fireEvent.click(disconnectButton)

    expect(defaultProps.disconnectFromAgent).toHaveBeenCalledWith('conn-1')
  })

  it('calls submitTask when submit task button is clicked', () => {
    render(
      <AgentProvider {...defaultProps}>
        <TestConsumer />
      </AgentProvider>
    )

    const submitButton = screen.getByRole('button', { name: /submit task/i })
    fireEvent.click(submitButton)

    expect(defaultProps.submitTask).toHaveBeenCalledWith({ prompt: 'test' })
  })

  it('calls respondToInputRequest when respond button is clicked', () => {
    render(
      <AgentProvider {...defaultProps}>
        <TestConsumer />
      </AgentProvider>
    )

    const respondButton = screen.getByRole('button', { name: /respond to input/i })
    fireEvent.click(respondButton)

    expect(defaultProps.respondToInputRequest).toHaveBeenCalledWith('input-1', { value: 'response' })
  })

  it('handles empty agents list', () => {
    render(
      <AgentProvider {...defaultProps} agents={[]} selectedAgent={undefined}>
        <TestConsumer />
      </AgentProvider>
    )

    expect(screen.getByTestId('agents-count')).toHaveTextContent('0')
    expect(screen.getByTestId('selected-agent')).toHaveTextContent('None')
  })

  it('handles empty tasks list', () => {
    render(
      <AgentProvider {...defaultProps} tasks={[]}>
        <TestConsumer />
      </AgentProvider>
    )

    expect(screen.getByTestId('tasks-count')).toHaveTextContent('0')
  })

  it('handles empty connections list', () => {
    render(
      <AgentProvider {...defaultProps} connections={[]} connectionStatus={{}}>
        <TestConsumer />
      </AgentProvider>
    )

    expect(screen.getByTestId('connections-count')).toHaveTextContent('0')
  })

  it('handles empty input requests list', () => {
    render(
      <AgentProvider {...defaultProps} activeInputRequests={[]}>
        <TestConsumer />
      </AgentProvider>
    )

    expect(screen.getByTestId('input-requests-count')).toHaveTextContent('0')
  })

  it('throws error when useAgent is used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error
    console.error = vi.fn()

    expect(() => {
      render(<TestConsumer />)
    }).toThrow('useAgent must be used within an AgentProvider')

    console.error = originalError
  })

  it('updates context when props change', () => {
    const { rerender } = render(
      <AgentProvider {...defaultProps}>
        <TestConsumer />
      </AgentProvider>
    )

    expect(screen.getByTestId('agents-count')).toHaveTextContent('2')

    const newAgents = [...mockAgents, mockAgentCard({ id: 'agent-3', name: 'Agent 3' })]
    
    rerender(
      <AgentProvider {...defaultProps} agents={newAgents}>
        <TestConsumer />
      </AgentProvider>
    )

    expect(screen.getByTestId('agents-count')).toHaveTextContent('3')
  })

  it('handles async operations', async () => {
    const asyncSubmitTask = vi.fn().mockResolvedValue(mockTask())
    
    render(
      <AgentProvider {...defaultProps} submitTask={asyncSubmitTask}>
        <TestConsumer />
      </AgentProvider>
    )

    const submitButton = screen.getByRole('button', { name: /submit task/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(asyncSubmitTask).toHaveBeenCalledWith({ prompt: 'test' })
    })
  })

  it('handles async operation errors', async () => {
    const asyncSubmitTask = vi.fn().mockRejectedValue(new Error('Submit failed'))
    
    render(
      <AgentProvider {...defaultProps} submitTask={asyncSubmitTask}>
        <TestConsumer />
      </AgentProvider>
    )

    const submitButton = screen.getByRole('button', { name: /submit task/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(asyncSubmitTask).toHaveBeenCalledWith({ prompt: 'test' })
    })
  })

  it('provides stable context reference', () => {
    const contextValues: any[] = []
    
    const ContextCapture = () => {
      const context = useAgent()
      contextValues.push(context)
      return null
    }

    const { rerender } = render(
      <AgentProvider {...defaultProps}>
        <ContextCapture />
      </AgentProvider>
    )

    rerender(
      <AgentProvider {...defaultProps}>
        <ContextCapture />
      </AgentProvider>
    )

    // Context should be stable when props don't change
    expect(contextValues).toHaveLength(2)
    expect(contextValues[0]).toBe(contextValues[1])
  })

  it('supports nested providers', () => {
    const NestedConsumer = () => {
      const { selectedAgent } = useAgent()
      return <div data-testid="nested-agent">{selectedAgent?.name}</div>
    }

    render(
      <AgentProvider {...defaultProps}>
        <AgentProvider {...defaultProps} selectedAgent={mockAgents[1]}>
          <NestedConsumer />
        </AgentProvider>
      </AgentProvider>
    )

    expect(screen.getByTestId('nested-agent')).toHaveTextContent('Agent 2')
  })

  it('handles connection status updates', () => {
    const { rerender } = render(
      <AgentProvider {...defaultProps}>
        <TestConsumer />
      </AgentProvider>
    )

    expect(screen.getByTestId('connections-count')).toHaveTextContent('1')

    const updatedConnectionStatus = {
      'conn-1': 'disconnected' as const,
      'conn-2': 'connected' as const
    }

    rerender(
      <AgentProvider {...defaultProps} connectionStatus={updatedConnectionStatus}>
        <TestConsumer />
      </AgentProvider>
    )

    // Connection status should be updated
    expect(screen.getByTestId('connections-count')).toHaveTextContent('1')
  })

  it('handles protocol messages', () => {
    const protocolMessages = [
      {
        id: 'msg-1',
        type: 'task-request',
        source: 'agent-1',
        target: 'agent-2',
        payload: { task: 'test' },
        timestamp: new Date(),
        metadata: {}
      }
    ]

    const ProtocolConsumer = () => {
      const { protocolMessages: messages } = useAgent()
      return <div data-testid="messages-count">{messages.length}</div>
    }

    render(
      <AgentProvider {...defaultProps} protocolMessages={protocolMessages}>
        <ProtocolConsumer />
      </AgentProvider>
    )

    expect(screen.getByTestId('messages-count')).toHaveTextContent('1')
  })

  it('handles communication blocks', () => {
    const communicationBlocks = [
      {
        id: 'block-1',
        type: 'message' as const,
        timestamp: new Date(),
        source: 'agent-1',
        target: 'agent-2',
        content: { message: 'test' },
        metadata: {}
      }
    ]

    const BlocksConsumer = () => {
      const { communicationBlocks: blocks } = useAgent()
      return <div data-testid="blocks-count">{blocks.length}</div>
    }

    render(
      <AgentProvider {...defaultProps} communicationBlocks={communicationBlocks}>
        <BlocksConsumer />
      </AgentProvider>
    )

    expect(screen.getByTestId('blocks-count')).toHaveTextContent('1')
  })
})