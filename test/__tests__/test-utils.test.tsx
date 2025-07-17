import { describe, it, expect } from 'vitest'
import { 
  mockAgentCard, 
  mockTask, 
  mockArtifact, 
  mockInputRequest, 
  mockInputResponse,
  mockCommunicationBlock,
  mockProtocolMessage,
  MockWebSocket
} from '../test-utils'

describe('Test Utilities', () => {
  describe('mockAgentCard', () => {
    it('creates a valid agent card with defaults', () => {
      const agent = mockAgentCard()
      
      expect(agent).toMatchObject({
        id: 'agent-1',
        name: 'Test Agent',
        description: 'A test agent for unit testing',
        endpoint: 'https://test-agent.example.com',
        capabilities: ['task-execution', 'file-processing'],
        status: 'online',
        version: '1.0.0',
        metadata: {}
      })
    })

    it('allows overriding default values', () => {
      const agent = mockAgentCard({
        id: 'custom-agent',
        name: 'Custom Agent',
        status: 'offline'
      })
      
      expect(agent.id).toBe('custom-agent')
      expect(agent.name).toBe('Custom Agent')
      expect(agent.status).toBe('offline')
      expect(agent.description).toBe('A test agent for unit testing') // Default preserved
    })
  })

  describe('mockTask', () => {
    it('creates a valid task with defaults', () => {
      const task = mockTask()
      
      expect(task).toMatchObject({
        id: 'task-1',
        title: 'Test Task',
        description: 'A test task for unit testing',
        status: 'pending',
        progress: 0,
        agentId: 'agent-1',
        input: { prompt: 'Test prompt' },
        metadata: {}
      })
      
      expect(task.createdAt).toBeInstanceOf(Date)
      expect(task.updatedAt).toBeInstanceOf(Date)
    })

    it('allows overriding default values', () => {
      const task = mockTask({
        id: 'custom-task',
        status: 'completed',
        progress: 100
      })
      
      expect(task.id).toBe('custom-task')
      expect(task.status).toBe('completed')
      expect(task.progress).toBe(100)
    })
  })

  describe('mockArtifact', () => {
    it('creates a valid artifact with defaults', () => {
      const artifact = mockArtifact()
      
      expect(artifact).toMatchObject({
        id: 'artifact-1',
        taskId: 'task-1',
        type: 'text',
        displayType: 'text',
        content: { text: 'Test artifact content' },
        downloadable: true,
        shareable: true
      })
      
      expect(artifact.metadata).toMatchObject({
        size: 1024,
        mimeType: 'text/plain'
      })
      expect(artifact.metadata.createdAt).toBeInstanceOf(Date)
    })

    it('allows overriding default values', () => {
      const artifact = mockArtifact({
        id: 'custom-artifact',
        displayType: 'code',
        downloadable: false
      })
      
      expect(artifact.id).toBe('custom-artifact')
      expect(artifact.displayType).toBe('code')
      expect(artifact.downloadable).toBe(false)
    })
  })

  describe('mockInputRequest', () => {
    it('creates a valid input request with defaults', () => {
      const request = mockInputRequest()
      
      expect(request).toMatchObject({
        id: 'input-1',
        type: 'text',
        prompt: 'Please provide input',
        required: true,
        validation: [],
        metadata: {}
      })
    })

    it('allows overriding default values', () => {
      const request = mockInputRequest({
        type: 'selection',
        required: false,
        options: [{ value: 'a', label: 'Option A' }]
      })
      
      expect(request.type).toBe('selection')
      expect(request.required).toBe(false)
      expect(request.options).toEqual([{ value: 'a', label: 'Option A' }])
    })
  })

  describe('mockInputResponse', () => {
    it('creates a valid input response with defaults', () => {
      const response = mockInputResponse()
      
      expect(response).toMatchObject({
        requestId: 'input-1',
        value: 'Test response'
      })
      expect(response.timestamp).toBeInstanceOf(Date)
    })

    it('allows overriding default values', () => {
      const customTimestamp = new Date('2024-02-01')
      const response = mockInputResponse({
        requestId: 'custom-input',
        value: { selection: 'option-b' },
        timestamp: customTimestamp
      })
      
      expect(response.requestId).toBe('custom-input')
      expect(response.value).toEqual({ selection: 'option-b' })
      expect(response.timestamp).toBe(customTimestamp)
    })
  })

  describe('mockCommunicationBlock', () => {
    it('creates a valid communication block with defaults', () => {
      const block = mockCommunicationBlock()
      
      expect(block).toMatchObject({
        id: 'block-1',
        type: 'message',
        source: 'agent-1',
        target: 'agent-2',
        content: { message: 'Test communication' },
        metadata: {}
      })
      expect(block.timestamp).toBeInstanceOf(Date)
    })

    it('allows overriding default values', () => {
      const block = mockCommunicationBlock({
        type: 'status',
        source: 'custom-agent',
        content: { status: 'connected' }
      })
      
      expect(block.type).toBe('status')
      expect(block.source).toBe('custom-agent')
      expect(block.content).toEqual({ status: 'connected' })
    })
  })

  describe('mockProtocolMessage', () => {
    it('creates a valid protocol message with defaults', () => {
      const message = mockProtocolMessage()
      
      expect(message).toMatchObject({
        id: 'msg-1',
        type: 'task-request',
        source: 'agent-1',
        target: 'agent-2',
        payload: { task: 'test task' },
        metadata: {}
      })
      expect(message.timestamp).toBeInstanceOf(Date)
    })

    it('allows overriding default values', () => {
      const message = mockProtocolMessage({
        type: 'task-response',
        payload: { result: 'success' }
      })
      
      expect(message.type).toBe('task-response')
      expect(message.payload).toEqual({ result: 'success' })
    })
  })

  describe('MockWebSocket', () => {
    it('initializes with correct properties', () => {
      const ws = new MockWebSocket('wss://test.com')
      
      expect(ws.url).toBe('wss://test.com')
      expect(ws.readyState).toBe(MockWebSocket.CONNECTING)
    })

    it('transitions to OPEN state automatically', async () => {
      const ws = new MockWebSocket('wss://test.com')
      
      await new Promise<void>((resolve) => {
        ws.onopen = () => {
          expect(ws.readyState).toBe(MockWebSocket.OPEN)
          resolve()
        }
      })
    })

    it('can send messages when open', () => {
      const ws = new MockWebSocket('wss://test.com')
      
      setTimeout(() => {
        expect(() => ws.send('test message')).not.toThrow()
      }, 10)
    })

    it('throws error when sending while not open', () => {
      const ws = new MockWebSocket('wss://test.com')
      
      expect(() => ws.send('test message')).toThrow('WebSocket is not open')
    })

    it('can simulate receiving messages', async () => {
      const ws = new MockWebSocket('wss://test.com')
      
      await new Promise<void>((resolve) => {
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data)
          expect(data).toEqual({ type: 'test', message: 'hello' })
          resolve()
        }
        
        setTimeout(() => {
          ws.simulateMessage({ type: 'test', message: 'hello' })
        }, 10)
      })
    })

    it('can simulate errors', async () => {
      const ws = new MockWebSocket('wss://test.com')
      
      await new Promise<void>((resolve) => {
        ws.onerror = () => {
          resolve()
        }
        
        setTimeout(() => {
          ws.simulateError()
        }, 10)
      })
    })

    it('can be closed', async () => {
      const ws = new MockWebSocket('wss://test.com')
      
      await new Promise<void>((resolve) => {
        ws.onclose = (event) => {
          expect(ws.readyState).toBe(MockWebSocket.CLOSED)
          expect(event.code).toBe(1000)
          expect(event.reason).toBe('Normal closure')
          resolve()
        }
        
        setTimeout(() => {
          ws.close(1000, 'Normal closure')
        }, 10)
      })
    })
  })

  describe('Data consistency', () => {
    it('generates consistent IDs across related objects', () => {
      const agent = mockAgentCard({ id: 'agent-123' })
      const task = mockTask({ agentId: 'agent-123' })
      const artifact = mockArtifact({ taskId: task.id })
      
      expect(task.agentId).toBe(agent.id)
      expect(artifact.taskId).toBe(task.id)
    })

    it('generates realistic timestamps', () => {
      const task = mockTask()
      const artifact = mockArtifact()
      
      expect(task.createdAt.getTime()).toBeLessThanOrEqual(task.updatedAt.getTime())
      expect(artifact.metadata.createdAt).toBeInstanceOf(Date)
    })

    it('generates valid enum values', () => {
      const validStatuses = ['pending', 'working', 'completed', 'failed', 'cancelled']
      const validTypes = ['text', 'selection', 'approval', 'file', 'form']
      
      const task = mockTask()
      const inputRequest = mockInputRequest()
      
      expect(validStatuses).toContain(task.status)
      expect(validTypes).toContain(inputRequest.type)
    })
  })
})