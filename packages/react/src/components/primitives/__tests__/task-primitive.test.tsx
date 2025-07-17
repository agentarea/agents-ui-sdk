import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@test-utils'
import { axe } from 'jest-axe'
import { TaskPrimitive } from '../task-primitive'
import { mockTask } from '@test-utils'

describe('TaskPrimitive', () => {
  const task = mockTask({
    id: 'task-1',
    title: 'Test Task',
    description: 'A test task description',
    status: 'working',
    progress: 75
  })

  it('renders task root component', () => {
    render(
      <TaskPrimitive.Root task={task}>
        <div>Task content</div>
      </TaskPrimitive.Root>
    )
    
    expect(screen.getByText('Task content')).toBeInTheDocument()
  })

  it('displays task title', () => {
    render(
      <TaskPrimitive.Root task={task}>
        <TaskPrimitive.Title />
      </TaskPrimitive.Root>
    )
    
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('displays task description', () => {
    render(
      <TaskPrimitive.Root task={task}>
        <TaskPrimitive.Description />
      </TaskPrimitive.Root>
    )
    
    expect(screen.getByText('A test task description')).toBeInTheDocument()
  })

  it('displays task status', () => {
    render(
      <TaskPrimitive.Root task={task}>
        <TaskPrimitive.Status />
      </TaskPrimitive.Root>
    )
    
    expect(screen.getByText('working')).toBeInTheDocument()
  })

  it('displays task progress', () => {
    render(
      <TaskPrimitive.Root task={task}>
        <TaskPrimitive.Progress />
      </TaskPrimitive.Root>
    )
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '75')
    expect(progressBar).toHaveAttribute('aria-valuemax', '100')
  })

  it('displays task input', () => {
    render(
      <TaskPrimitive.Root task={task}>
        <TaskPrimitive.Input />
      </TaskPrimitive.Root>
    )
    
    expect(screen.getByText('Test prompt')).toBeInTheDocument()
  })

  it('displays task output when available', () => {
    const taskWithOutput = mockTask({
      ...task,
      output: { result: 'Task completed successfully' }
    })
    
    render(
      <TaskPrimitive.Root task={taskWithOutput}>
        <TaskPrimitive.Output />
      </TaskPrimitive.Root>
    )
    
    expect(screen.getByText('Task completed successfully')).toBeInTheDocument()
  })

  it('hides output when not available', () => {
    render(
      <TaskPrimitive.Root task={task}>
        <TaskPrimitive.Output />
      </TaskPrimitive.Root>
    )
    
    expect(screen.queryByText(/result/i)).not.toBeInTheDocument()
  })

  it('conditionally renders based on task status', () => {
    render(
      <TaskPrimitive.Root task={task}>
        <TaskPrimitive.If condition="working">
          <div>Task is working</div>
        </TaskPrimitive.If>
        <TaskPrimitive.If condition="completed">
          <div>Task is completed</div>
        </TaskPrimitive.If>
      </TaskPrimitive.Root>
    )
    
    expect(screen.getByText('Task is working')).toBeInTheDocument()
    expect(screen.queryByText('Task is completed')).not.toBeInTheDocument()
  })

  it('supports custom condition functions', () => {
    render(
      <TaskPrimitive.Root task={task}>
        <TaskPrimitive.If condition={(task) => task.progress > 50}>
          <div>More than half done</div>
        </TaskPrimitive.If>
        <TaskPrimitive.If condition={(task) => task.progress < 50}>
          <div>Less than half done</div>
        </TaskPrimitive.If>
      </TaskPrimitive.Root>
    )
    
    expect(screen.getByText('More than half done')).toBeInTheDocument()
    expect(screen.queryByText('Less than half done')).not.toBeInTheDocument()
  })

  it('handles task actions', () => {
    const onCancel = vi.fn()
    const onRetry = vi.fn()
    
    render(
      <TaskPrimitive.Root task={task}>
        <TaskPrimitive.Actions>
          <button onClick={onCancel}>Cancel</button>
          <button onClick={onRetry}>Retry</button>
        </TaskPrimitive.Actions>
      </TaskPrimitive.Root>
    )
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    const retryButton = screen.getByRole('button', { name: /retry/i })
    
    fireEvent.click(cancelButton)
    fireEvent.click(retryButton)
    
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('displays task metadata', () => {
    const taskWithMetadata = mockTask({
      ...task,
      metadata: {
        priority: 'high',
        tags: ['urgent', 'important']
      }
    })
    
    render(
      <TaskPrimitive.Root task={taskWithMetadata}>
        <TaskPrimitive.Metadata />
      </TaskPrimitive.Root>
    )
    
    expect(screen.getByText(/priority: high/i)).toBeInTheDocument()
    expect(screen.getByText(/urgent/i)).toBeInTheDocument()
    expect(screen.getByText(/important/i)).toBeInTheDocument()
  })

  it('displays task timestamps', () => {
    render(
      <TaskPrimitive.Root task={task}>
        <TaskPrimitive.Timestamps />
      </TaskPrimitive.Root>
    )
    
    expect(screen.getByText(/created/i)).toBeInTheDocument()
    expect(screen.getByText(/updated/i)).toBeInTheDocument()
  })

  it('applies custom className to root', () => {
    const { container } = render(
      <TaskPrimitive.Root task={task} className="custom-task">
        <div>Content</div>
      </TaskPrimitive.Root>
    )
    
    expect(container.firstChild).toHaveClass('custom-task')
  })

  it('provides task context to children', () => {
    const ContextConsumer = () => {
      const { task: contextTask } = TaskPrimitive.useTaskContext()
      return <div>Task ID: {contextTask.id}</div>
    }
    
    render(
      <TaskPrimitive.Root task={task}>
        <ContextConsumer />
      </TaskPrimitive.Root>
    )
    
    expect(screen.getByText('Task ID: task-1')).toBeInTheDocument()
  })

  it('throws error when context is used outside provider', () => {
    const ContextConsumer = () => {
      TaskPrimitive.useTaskContext()
      return null
    }
    
    // Suppress console.error for this test
    const originalError = console.error
    console.error = vi.fn()
    
    expect(() => {
      render(<ContextConsumer />)
    }).toThrow('useTaskContext must be used within TaskPrimitive.Root')
    
    console.error = originalError
  })

  it('meets accessibility standards', async () => {
    const { container } = render(
      <TaskPrimitive.Root task={task}>
        <TaskPrimitive.Title />
        <TaskPrimitive.Description />
        <TaskPrimitive.Status />
        <TaskPrimitive.Progress />
      </TaskPrimitive.Root>
    )
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('supports keyboard navigation', () => {
    const onAction = vi.fn()
    
    render(
      <TaskPrimitive.Root task={task}>
        <TaskPrimitive.Actions>
          <button onClick={onAction}>Action</button>
        </TaskPrimitive.Actions>
      </TaskPrimitive.Root>
    )
    
    const button = screen.getByRole('button')
    button.focus()
    expect(button).toHaveFocus()
    
    fireEvent.keyDown(button, { key: 'Enter' })
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('handles different task statuses', () => {
    const statuses = ['pending', 'working', 'completed', 'failed', 'cancelled'] as const
    
    statuses.forEach(status => {
      const taskWithStatus = mockTask({ ...task, status })
      
      const { unmount } = render(
        <TaskPrimitive.Root task={taskWithStatus}>
          <TaskPrimitive.Status />
        </TaskPrimitive.Root>
      )
      
      expect(screen.getByText(status)).toBeInTheDocument()
      unmount()
    })
  })

  it('handles progress edge cases', () => {
    const progressCases = [0, 50, 100, -1, 150]
    
    progressCases.forEach(progress => {
      const taskWithProgress = mockTask({ ...task, progress })
      
      const { unmount } = render(
        <TaskPrimitive.Root task={taskWithProgress}>
          <TaskPrimitive.Progress />
        </TaskPrimitive.Root>
      )
      
      const progressBar = screen.getByRole('progressbar')
      const expectedValue = Math.max(0, Math.min(100, progress))
      expect(progressBar).toHaveAttribute('aria-valuenow', expectedValue.toString())
      
      unmount()
    })
  })

  it('supports custom formatters', () => {
    const formatStatus = (status: string) => status.toUpperCase()
    const formatProgress = (progress: number) => `${progress}% complete`
    
    render(
      <TaskPrimitive.Root task={task}>
        <TaskPrimitive.Status formatter={formatStatus} />
        <TaskPrimitive.Progress formatter={formatProgress} />
      </TaskPrimitive.Root>
    )
    
    expect(screen.getByText('WORKING')).toBeInTheDocument()
    expect(screen.getByText('75% complete')).toBeInTheDocument()
  })

  it('handles missing task data gracefully', () => {
    const incompleteTask = {
      id: 'incomplete',
      status: 'pending' as const,
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      agentId: 'agent-1',
      input: {},
      metadata: {}
    }
    
    render(
      <TaskPrimitive.Root task={incompleteTask}>
        <TaskPrimitive.Title />
        <TaskPrimitive.Description />
        <TaskPrimitive.Input />
        <TaskPrimitive.Output />
      </TaskPrimitive.Root>
    )
    
    // Should not crash and should handle missing data
    expect(screen.queryByText('undefined')).not.toBeInTheDocument()
  })
})