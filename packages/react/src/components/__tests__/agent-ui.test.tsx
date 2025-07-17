import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@test-utils'
import { axe } from 'jest-axe'
import { AgentUI } from '../agent-ui'

// Mock the runtime factory
const mockRuntime = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  submitTask: vi.fn(),
  subscribeToTask: vi.fn(),
  getSupportedCapabilities: vi.fn().mockReturnValue(['task-execution'])
}

vi.mock('@agentarea/core', () => ({
  RuntimeFactory: {
    createRuntime: vi.fn().mockReturnValue(mockRuntime)
  }
}))

describe('AgentUI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children when provided', () => {
    render(
      <AgentUI runtime="a2a" endpoint="https://test.com">
        <div>Test content</div>
      </AgentUI>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('creates runtime with correct configuration', () => {
    const { RuntimeFactory } = require('@agentarea/core')
    
    render(
      <AgentUI 
        runtime="a2a" 
        endpoint="https://test.com"
        authentication={{ type: 'bearer', token: 'test-token' }}
      >
        <div>Test</div>
      </AgentUI>
    )

    expect(RuntimeFactory.createRuntime).toHaveBeenCalledWith('a2a', {
      endpoint: 'https://test.com',
      authentication: { type: 'bearer', token: 'test-token' }
    })
  })

  it('auto-connects when autoConnect is true', async () => {
    render(
      <AgentUI 
        runtime="a2a" 
        endpoint="https://test.com"
        autoConnect
      >
        <div>Test</div>
      </AgentUI>
    )

    await waitFor(() => {
      expect(mockRuntime.connect).toHaveBeenCalledWith('https://test.com', expect.any(Object))
    })
  })

  it('does not auto-connect when autoConnect is false', () => {
    render(
      <AgentUI 
        runtime="a2a" 
        endpoint="https://test.com"
        autoConnect={false}
      >
        <div>Test</div>
      </AgentUI>
    )

    expect(mockRuntime.connect).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    const { container } = render(
      <AgentUI 
        runtime="a2a" 
        endpoint="https://test.com"
        className="custom-class"
      >
        <div>Test</div>
      </AgentUI>
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('applies theme classes', () => {
    const { container } = render(
      <AgentUI 
        runtime="a2a" 
        endpoint="https://test.com"
        theme="dark"
      >
        <div>Test</div>
      </AgentUI>
    )

    expect(container.firstChild).toHaveClass('theme-dark')
  })

  it('enables debug mode when debug is true', () => {
    render(
      <AgentUI 
        runtime="a2a" 
        endpoint="https://test.com"
        debug
      >
        <div>Test</div>
      </AgentUI>
    )

    expect(screen.getByTestId('debug-panel')).toBeInTheDocument()
  })

  it('shows dev tools when devTools is true', () => {
    render(
      <AgentUI 
        runtime="a2a" 
        endpoint="https://test.com"
        devTools
      >
        <div>Test</div>
      </AgentUI>
    )

    expect(screen.getByTestId('dev-tools')).toBeInTheDocument()
  })

  it('handles connection errors gracefully', async () => {
    mockRuntime.connect.mockRejectedValue(new Error('Connection failed'))

    render(
      <AgentUI 
        runtime="a2a" 
        endpoint="https://test.com"
        autoConnect
      >
        <div>Test</div>
      </AgentUI>
    )

    await waitFor(() => {
      expect(screen.getByText(/connection failed/i)).toBeInTheDocument()
    })
  })

  it('supports reconnection attempts', async () => {
    mockRuntime.connect
      .mockRejectedValueOnce(new Error('Connection failed'))
      .mockResolvedValueOnce({ id: 'conn-1' })

    render(
      <AgentUI 
        runtime="a2a" 
        endpoint="https://test.com"
        autoConnect
        reconnectAttempts={2}
      >
        <div>Test</div>
      </AgentUI>
    )

    await waitFor(() => {
      expect(mockRuntime.connect).toHaveBeenCalledTimes(2)
    })
  })

  it('provides compound components', () => {
    render(
      <AgentUI.Provider runtime="a2a" endpoint="https://test.com">
        <AgentUI.Connection />
        <AgentUI.Debug />
        <div>Test content</div>
      </AgentUI.Provider>
    )

    expect(screen.getByTestId('connection-status')).toBeInTheDocument()
    expect(screen.getByTestId('debug-panel')).toBeInTheDocument()
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('handles runtime switching', async () => {
    const { rerender } = render(
      <AgentUI runtime="a2a" endpoint="https://test.com">
        <div>Test</div>
      </AgentUI>
    )

    const { RuntimeFactory } = require('@agentarea/core')
    expect(RuntimeFactory.createRuntime).toHaveBeenCalledWith('a2a', expect.any(Object))

    rerender(
      <AgentUI runtime="agentarea" endpoint="https://test.com">
        <div>Test</div>
      </AgentUI>
    )

    expect(RuntimeFactory.createRuntime).toHaveBeenCalledWith('agentarea', expect.any(Object))
  })

  it('handles custom runtime objects', () => {
    const customRuntime = {
      ...mockRuntime,
      protocolType: 'custom' as const
    }

    render(
      <AgentUI runtime={customRuntime} endpoint="https://test.com">
        <div>Test</div>
      </AgentUI>
    )

    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('meets accessibility standards', async () => {
    const { container } = render(
      <AgentUI runtime="a2a" endpoint="https://test.com">
        <div>Test content</div>
      </AgentUI>
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('supports keyboard navigation', () => {
    render(
      <AgentUI runtime="a2a" endpoint="https://test.com" debug>
        <button>Test button</button>
      </AgentUI>
    )

    const button = screen.getByRole('button', { name: /test button/i })
    button.focus()
    expect(button).toHaveFocus()

    // Tab should move to debug controls
    fireEvent.keyDown(button, { key: 'Tab' })
    const debugToggle = screen.getByRole('button', { name: /toggle debug/i })
    expect(debugToggle).toHaveFocus()
  })

  it('handles SSR environment', () => {
    // Mock SSR environment
    const originalWindow = global.window
    delete (global as any).window

    render(
      <AgentUI runtime="a2a" endpoint="https://test.com">
        <div>SSR Test</div>
      </AgentUI>
    )

    expect(screen.getByText('SSR Test')).toBeInTheDocument()

    // Restore window
    global.window = originalWindow
  })

  it('handles WebSocket unavailability gracefully', () => {
    // Mock WebSocket unavailability
    const originalWebSocket = global.WebSocket
    delete (global as any).WebSocket

    render(
      <AgentUI runtime="a2a" endpoint="wss://test.com">
        <div>No WebSocket</div>
      </AgentUI>
    )

    expect(screen.getByText('No WebSocket')).toBeInTheDocument()
    expect(screen.getByText(/websocket not supported/i)).toBeInTheDocument()

    // Restore WebSocket
    global.WebSocket = originalWebSocket
  })

  it('provides error recovery mechanisms', async () => {
    mockRuntime.connect.mockRejectedValue(new Error('Network error'))

    render(
      <AgentUI runtime="a2a" endpoint="https://test.com" autoConnect>
        <div>Test</div>
      </AgentUI>
    )

    await waitFor(() => {
      expect(screen.getByText(/connection failed/i)).toBeInTheDocument()
    })

    const retryButton = screen.getByRole('button', { name: /retry/i })
    expect(retryButton).toBeInTheDocument()

    mockRuntime.connect.mockResolvedValue({ id: 'conn-1' })
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(mockRuntime.connect).toHaveBeenCalledTimes(2)
    })
  })

  it('handles configuration validation', () => {
    // Suppress console.error for this test
    const originalError = console.error
    console.error = vi.fn()

    expect(() => {
      render(
        <AgentUI runtime="a2a">
          <div>Invalid config</div>
        </AgentUI>
      )
    }).toThrow(/endpoint is required/i)

    console.error = originalError
  })

  it('supports environment-specific configuration', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <AgentUI 
        runtime="a2a" 
        endpoint="https://test.com"
        debug
        devTools
      >
        <div>Dev mode</div>
      </AgentUI>
    )

    expect(screen.getByTestId('debug-panel')).toBeInTheDocument()
    expect(screen.getByTestId('dev-tools')).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('handles cleanup on unmount', () => {
    const { unmount } = render(
      <AgentUI runtime="a2a" endpoint="https://test.com" autoConnect>
        <div>Test</div>
      </AgentUI>
    )

    unmount()

    expect(mockRuntime.disconnect).toHaveBeenCalled()
  })

  it('supports custom authentication configurations', () => {
    const authConfig = {
      type: 'oauth' as const,
      clientId: 'test-client',
      scope: 'read write'
    }

    const { RuntimeFactory } = require('@agentarea/core')

    render(
      <AgentUI 
        runtime="a2a" 
        endpoint="https://test.com"
        authentication={authConfig}
      >
        <div>Test</div>
      </AgentUI>
    )

    expect(RuntimeFactory.createRuntime).toHaveBeenCalledWith('a2a', {
      endpoint: 'https://test.com',
      authentication: authConfig
    })
  })

  it('handles multiple concurrent connections', async () => {
    mockRuntime.connect.mockResolvedValue({ id: 'conn-1' })

    render(
      <AgentUI runtime="a2a" endpoint="https://test.com" autoConnect>
        <AgentUI.Provider runtime="agentarea" endpoint="https://other.com" autoConnect>
          <div>Multiple connections</div>
        </AgentUI.Provider>
      </AgentUI>
    )

    await waitFor(() => {
      expect(mockRuntime.connect).toHaveBeenCalledTimes(2)
    })
  })
})