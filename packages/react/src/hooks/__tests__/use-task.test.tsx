import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTask } from '../use-task'
import { mockTask, mockInputRequest, mockArtifact, TestWrapper } from '@test-utils'

// Mock the runtime
const mockRuntime = {
  submitTask: vi.fn(),
  cancelTask: vi.fn(),
  handleInputRequest: vi.fn(),
  subscribeToTask: vi.fn(),
  downloadArtifact: vi.fn()
}

vi.mock('@agentarea/core', () => ({
  RuntimeFactory: {
    createRuntime: () => mockRuntime
  }
}))

describe('useTask', () => {
  const task = mockTask({
    id: 'task-1',
    status: 'working',
    progress: 50
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns task data when task ID is provided', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper agentProviderProps={{ tasks: [task] }}>
        {children}
      </TestWrapper>
    )

    const { result } = renderHook(() => useTask('task-1'), { wrapper })

    expect(result.current.task).toEqual(task)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('returns undefined when task is not found', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper agentProviderProps={{ tasks: [] }}>
        {children}
      </TestWrapper>
    )

    const { result } = renderHook(() => useTask('nonexistent-task'), { wrapper })

    expect(result.current.task).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('submits task successfully', async () => {
    const mockSubmitTask = vi.fn().mockResolvedValue(task)
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper agentProviderProps={{ 
        tasks: [],
        submitTask: mockSubmitTask
      }}>
        {children}
      </TestWrapper>
    )

    const { result } = renderHook(() => useTask(), { wrapper })

    const taskInput = { prompt: 'Test task' }
    
    await act(async () => {
      await result.current.submitTask(taskInput)
    })

    expect(mockSubmitTask).toHaveBeenCalledWith(taskInput, undefined)
  })

  it('handles task submission errors', async () => {
    const error = new Error('Submission failed')
    const mockSubmitTask = vi.fn().mockRejectedValue(error)
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper agentProviderProps={{ 
        tasks: [],
        submitTask: mockSubmitTask
      }}>
        {children}
      </TestWrapper>
    )

    const { result } = renderHook(() => useTask(), { wrapper })

    await act(async () => {
      try {
        await result.current.submitTask({ prompt: 'Test task' })
      } catch (e) {
        // Expected to throw
      }
    })

    expect(result.current.error).toEqual(error)
  })

  it('cancels task successfully', async () => {
    mockRuntime.cancelTask.mockResolvedValue(undefined)
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper agentProviderProps={{ tasks: [task] }}>
        {children}
      </TestWrapper>
    )

    const { result } = renderHook(() => useTask('task-1'), { wrapper })

    await act(async () => {
      await result.current.cancelTask()
    })

    expect(mockRuntime.cancelTask).toHaveBeenCalledWith('task-1')
  })

  it('responds to input requests', async () => {
    const inputRequest = mockInputRequest()
    const taskWithInput = mockTask({
      ...task,
      inputRequests: [inputRequest]
    })
    
    const mockRespondToInput = vi.fn().mockResolvedValue(undefined)
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper agentProviderProps={{ 
        tasks: [taskWithInput],
        respondToInputRequest: mockRespondToInput
      }}>
        {children}
      </TestWrapper>
    )

    const { result } = renderHook(() => useTask('task-1'), { wrapper })

    const response = { value: 'Test response' }
    
    await act(async () => {
      await result.current.respondToInput(inputRequest.id, response)
    })

    expect(mockRespondToInput).toHaveBeenCalledWith(inputRequest.id, response)
  })

  it('downloads artifacts', async () => {
    const artifact = mockArtifact()
    const taskWithArtifact = mockTask({
      ...task,
      artifacts: [artifact]
    })
    
    const mockBlob = new Blob(['test content'])
    mockRuntime.downloadArtifact.mockResolvedValue(mockBlob)
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper agentProviderProps={{ tasks: [taskWithArtifact] }}>
        {children}
      </TestWrapper>
    )

    const { result } = renderHook(() => useTask('task-1'), { wrapper })

    let downloadedBlob: Blob | undefined
    await act(async () => {
      downloadedBlob = await result.current.downloadArtifact(artifact.id)
    })

    expect(mockRuntime.downloadArtifact).toHaveBeenCalledWith(artifact.id)
    expect(downloadedBlob).toBe(mockBlob)
  })

  it('subscribes to task updates', () => {
    const mockSubscription = { unsubscribe: vi.fn() }
    const mockCallback = vi.fn()
    mockRuntime.subscribeToTask.mockReturnValue(mockSubscription)
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper agentProviderProps={{ tasks: [task] }}>
        {children}
      </TestWrapper>
    )

    const { result } = renderHook(() => useTask('task-1'), { wrapper })

    let subscription: any
    act(() => {
      subscription = result.current.subscribe(mockCallback)
    })

    expect(mockRuntime.subscribeToTask).toHaveBeenCalledWith('task-1', mockCallback)
    expect(subscription).toBe(mockSubscription)
  })

  it('returns input requests for the task', () => {
    const inputRequest = mockInputRequest()
    const taskWithInput = mockTask({
      ...task,
      inputRequests: [inputRequest]
    })
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper agentProviderProps={{ tasks: [taskWithInput] }}>
        {children}
      </TestWrapper>
    )

    const { result } = renderHook(() => useTask('task-1'), { wrapper })

    expect(result.current.inputRequests).toEqual([inputRequest])
  })

  it('returns artifacts for the task', () => {
    const artifact = mockArtifact()
    const taskWithArtifact = mockTask({
      ...task,
      artifacts: [artifact]
    })
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper agentProviderProps={{ tasks: [taskWithArtifact] }}>
        {children}
      </TestWrapper>
    )

    const { result } = renderHook(() => useTask('task-1'), { wrapper })

    expect(result.current.artifacts).toEqual([artifact])
  })

  it('handles loading states correctly', async () => {
    const mockSubmitTask = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(task), 100))
    )
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper agentProviderProps={{ 
        tasks: [],
        submitTask: mockSubmitTask
      }}>
        {children}
      </TestWrapper>
    )

    const { result } = renderHook(() => useTask(), { wrapper })

    expect(result.current.isLoading).toBe(false)

    act(() => {
      result.current.submitTask({ prompt: 'Test task' })
    })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('clears errors when new operations start', async () => {
    const error = new Error('Previous error')
    const mockSubmitTask = vi.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(task)
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper agentProviderProps={{ 
        tasks: [],
        submitTask: mockSubmitTask
      }}>
        {children}
      </TestWrapper>
    )

    const { result } = renderHook(() => useTask(), { wrapper })

    // First submission fails
    await act(async () => {
      try {
        await result.current.submitTask({ prompt: 'Test task' })
      } catch (e) {
        // Expected to throw
      }
    })

    expect(result.current.error).toEqual(error)

    // Second submission succeeds and clears error
    await act(async () => {
      await result.current.submitTask({ prompt: 'Test task 2' })
    })

    expect(result.current.error).toBeNull()
  })

  it('handles communication blocks for the task', () => {
    const communicationBlock = {
      id: 'block-1',
      type: 'message' as const,
      timestamp: new Date(),
      source: 'agent-1',
      target: 'agent-2',
      content: { message: 'Test message' },
      metadata: {}
    }
    
    const taskWithBlocks = mockTask({
      ...task,
      communicationBlocks: [communicationBlock]
    })
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper agentProviderProps={{ tasks: [taskWithBlocks] }}>
        {children}
      </TestWrapper>
    )

    const { result } = renderHook(() => useTask('task-1'), { wrapper })

    expect(result.current.communicationBlocks).toEqual([communicationBlock])
  })
})