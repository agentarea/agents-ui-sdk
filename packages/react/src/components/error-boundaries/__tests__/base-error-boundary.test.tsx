import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@test-utils'
import { BaseErrorBoundary } from '../base-error-boundary'

// Component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

// Custom fallback component
const CustomFallback = ({ error, retry }: { error: Error; retry: () => void }) => (
  <div>
    <h2>Custom Error</h2>
    <p>{error.message}</p>
    <button onClick={retry}>Try Again</button>
  </div>
)

describe('BaseErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error
  beforeEach(() => {
    console.error = vi.fn()
  })
  afterEach(() => {
    console.error = originalError
  })

  it('renders children when there is no error', () => {
    render(
      <BaseErrorBoundary>
        <ThrowError shouldThrow={false} />
      </BaseErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('renders default error fallback when error occurs', () => {
    render(
      <BaseErrorBoundary>
        <ThrowError shouldThrow={true} />
      </BaseErrorBoundary>
    )

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('renders custom fallback component when provided', () => {
    render(
      <BaseErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </BaseErrorBoundary>
    )

    expect(screen.getByText('Custom Error')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn()
    
    render(
      <BaseErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </BaseErrorBoundary>
    )

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    )
  })

  it('resets error state when retry is clicked', () => {
    const { rerender } = render(
      <BaseErrorBoundary>
        <ThrowError shouldThrow={true} />
      </BaseErrorBoundary>
    )

    // Error should be displayed
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /try again/i })
    fireEvent.click(retryButton)

    // Re-render with no error
    rerender(
      <BaseErrorBoundary>
        <ThrowError shouldThrow={false} />
      </BaseErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('isolates errors when isolateErrors is true', () => {
    const onError = vi.fn()
    
    render(
      <div>
        <BaseErrorBoundary isolateErrors onError={onError}>
          <ThrowError shouldThrow={true} />
        </BaseErrorBoundary>
        <div>Other content</div>
      </div>
    )

    // Error should be isolated to the boundary
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    expect(screen.getByText('Other content')).toBeInTheDocument()
    expect(onError).toHaveBeenCalled()
  })

  it('handles multiple errors correctly', () => {
    const onError = vi.fn()
    
    const { rerender } = render(
      <BaseErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </BaseErrorBoundary>
    )

    expect(onError).toHaveBeenCalledTimes(1)

    // Reset and throw another error
    const retryButton = screen.getByRole('button', { name: /try again/i })
    fireEvent.click(retryButton)

    rerender(
      <BaseErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </BaseErrorBoundary>
    )

    expect(onError).toHaveBeenCalledTimes(2)
  })

  it('displays error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <BaseErrorBoundary>
        <ThrowError shouldThrow={true} />
      </BaseErrorBoundary>
    )

    expect(screen.getByText(/component stack/i)).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('hides error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    render(
      <BaseErrorBoundary>
        <ThrowError shouldThrow={true} />
      </BaseErrorBoundary>
    )

    expect(screen.queryByText(/component stack/i)).not.toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('handles async errors in useEffect', async () => {
    const AsyncErrorComponent = () => {
      React.useEffect(() => {
        // Simulate async error
        setTimeout(() => {
          throw new Error('Async error')
        }, 0)
      }, [])
      return <div>Async component</div>
    }

    const onError = vi.fn()
    
    render(
      <BaseErrorBoundary onError={onError}>
        <AsyncErrorComponent />
      </BaseErrorBoundary>
    )

    // Note: Error boundaries don't catch async errors
    // This test documents the current behavior
    expect(screen.getByText('Async component')).toBeInTheDocument()
    expect(onError).not.toHaveBeenCalled()
  })

  it('provides error context to fallback component', () => {
    const FallbackWithContext = ({ error, retry, errorInfo }: any) => (
      <div>
        <p>Error: {error.message}</p>
        <p>Stack: {errorInfo?.componentStack ? 'Present' : 'Missing'}</p>
        <button onClick={retry}>Retry</button>
      </div>
    )

    render(
      <BaseErrorBoundary fallback={FallbackWithContext}>
        <ThrowError shouldThrow={true} />
      </BaseErrorBoundary>
    )

    expect(screen.getByText('Error: Test error')).toBeInTheDocument()
    expect(screen.getByText('Stack: Present')).toBeInTheDocument()
  })

  it('handles errors in event handlers', () => {
    const ErrorInHandler = () => {
      const handleClick = () => {
        throw new Error('Handler error')
      }
      return <button onClick={handleClick}>Click me</button>
    }

    const onError = vi.fn()
    
    render(
      <BaseErrorBoundary onError={onError}>
        <ErrorInHandler />
      </BaseErrorBoundary>
    )

    const button = screen.getByRole('button', { name: /click me/i })
    
    // Error boundaries don't catch errors in event handlers
    expect(() => fireEvent.click(button)).toThrow('Handler error')
    expect(onError).not.toHaveBeenCalled()
  })

  it('supports custom error classification', () => {
    const classifyError = (error: Error) => {
      if (error.message.includes('network')) return 'network'
      if (error.message.includes('validation')) return 'validation'
      return 'unknown'
    }

    const ClassifiedFallback = ({ error }: { error: Error }) => {
      const errorType = classifyError(error)
      return <div>Error type: {errorType}</div>
    }

    render(
      <BaseErrorBoundary fallback={ClassifiedFallback}>
        <ThrowError shouldThrow={true} />
      </BaseErrorBoundary>
    )

    expect(screen.getByText('Error type: unknown')).toBeInTheDocument()
  })
})