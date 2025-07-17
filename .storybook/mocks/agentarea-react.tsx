import React, { createContext, useContext } from 'react'

// Mock contexts that match the expected interfaces
const MockAgentContext = createContext({
  runtime: null,
  isConnected: true,
  agentCard: {
    name: 'Demo Agent',
    description: 'A demonstration agent for Storybook stories',
    version: '1.0.0',
    logoUrl: 'https://via.placeholder.com/64x64/4169e1/white?text=A',
    supportedFeatures: ['streaming', 'realtime', 'cancellation']
  },
  capabilities: [
    {
      name: 'Data Analysis',
      description: 'Analyze datasets and generate insights',
      inputTypes: ['csv', 'json', 'text'],
      outputTypes: ['json', 'chart', 'report']
    }
  ],
  connect: async () => {},
  disconnect: async () => {},
  sendTask: async () => ({ taskId: 'mock-task', task: {} }),
  getTask: async () => ({}),
  getAllTasks: async () => [],
  cancelTask: async () => {}
})

const MockInputContext = createContext({
  activeRequests: [],
  pendingResponses: new Map(),
  validationErrors: new Map(),
  submissionStatus: new Map(),
  error: null,
  submitResponse: async (requestId: string, value: unknown) => {
    console.log('Mock submitResponse:', requestId, value)
  },
  validateInput: (requestId: string, value: unknown) => ({ valid: true, errors: [] }),
  cancelInputRequest: async (requestId: string) => {
    console.log('Mock cancelInputRequest:', requestId)
  },
  clearValidationErrors: (requestId: string) => {
    console.log('Mock clearValidationErrors:', requestId)
  },
  addInputRequest: (request: any) => {
    console.log('Mock addInputRequest:', request)
  },
  removeInputRequest: (requestId: string) => {
    console.log('Mock removeInputRequest:', requestId)
  },
  updateInputRequest: (requestId: string, updates: any) => {
    console.log('Mock updateInputRequest:', requestId, updates)
  }
})

const MockArtifactContext = createContext({
  artifacts: new Map(),
  getArtifact: (id: string) => null,
  addArtifact: (artifact: any) => {
    console.log('Mock addArtifact:', artifact)
  },
  removeArtifact: (id: string) => {
    console.log('Mock removeArtifact:', id)
  },
  updateArtifact: (id: string, updates: any) => {
    console.log('Mock updateArtifact:', id, updates)
  }
})

const MockCommunicationContext = createContext({
  messages: [],
  sendMessage: (message: any) => {
    console.log('Mock sendMessage:', message)
  },
  clearMessages: () => {
    console.log('Mock clearMessages')
  }
})

// Mock hook functions
export const useAgentContext = () => useContext(MockAgentContext)
export const useInputContext = () => useContext(MockInputContext)
export const useArtifactContext = () => useContext(MockArtifactContext)
export const useCommunicationContext = () => useContext(MockCommunicationContext)

// Additional mock hooks
export const useAgent = () => ({
  runtime: null,
  isConnected: true,
  connect: async () => {},
  disconnect: async () => {},
  sendTask: async () => ({ taskId: 'mock-task', task: {} }),
  error: null
})

export const useAgentCard = () => ({
  agentCard: {
    name: 'Demo Agent',
    description: 'A demonstration agent for Storybook stories',
    version: '1.0.0',
    logoUrl: 'https://via.placeholder.com/64x64/4169e1/white?text=A'
  },
  loading: false,
  error: null
})

export const useAgentCapabilities = () => ({
  capabilities: [
    {
      name: 'Data Analysis',
      description: 'Analyze datasets and generate insights',
      inputTypes: ['csv', 'json', 'text'],
      outputTypes: ['json', 'chart', 'report']
    }
  ],
  loading: false,
  error: null
})

export const useConnection = () => ({
  isConnected: true,
  connectionStatus: 'connected',
  connect: async () => {},
  disconnect: async () => {},
  error: null
})

export const useTask = (taskId?: string) => ({
  task: taskId ? {
    id: taskId,
    title: 'Mock Task',
    status: 'pending',
    progress: 0.5
  } : null,
  loading: false,
  error: null,
  cancel: async () => {},
  retry: async () => {}
})

export const useTaskList = () => ({
  tasks: [
    { id: 'task-1', title: 'Mock Task 1', status: 'completed', progress: 1 },
    { id: 'task-2', title: 'Mock Task 2', status: 'working', progress: 0.7 },
    { id: 'task-3', title: 'Mock Task 3', status: 'pending', progress: 0 }
  ],
  loading: false,
  error: null,
  refresh: async () => {}
})

export const useTaskCreation = () => ({
  createTask: async (input: any) => ({ taskId: 'new-task', task: {} }),
  loading: false,
  error: null
})

// Mock UI Components
export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
  }
>(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
  
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline'
  }
  
  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10'
  }
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className || ''}`}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = 'Button'

// Mock Artifact Components
export const Artifact = {
  Container: ({ children, ...props }: any) => (
    <div className="border rounded-lg bg-background shadow-sm p-4" {...props}>
      {children}
    </div>
  ),
  Text: ({ artifact, ...props }: any) => (
    <div className="border rounded-lg bg-background shadow-sm p-4" {...props}>
      <div className="text-sm font-medium mb-2">Text Artifact</div>
      <div className="text-sm text-muted-foreground">
        {typeof artifact?.content === 'string' ? artifact.content : 'Mock text content'}
      </div>
    </div>
  ),
  Code: ({ artifact, ...props }: any) => (
    <div className="border rounded-lg bg-background shadow-sm p-4" {...props}>
      <div className="text-sm font-medium mb-2">Code Artifact</div>
      <pre className="text-xs bg-muted p-2 rounded overflow-auto">
        {artifact?.content?.code?.content || 'Mock code content'}
      </pre>
    </div>
  ),
  Data: ({ artifact, ...props }: any) => (
    <div className="border rounded-lg bg-background shadow-sm p-4" {...props}>
      <div className="text-sm font-medium mb-2">Data Artifact</div>
      <pre className="text-xs bg-muted p-2 rounded overflow-auto">
        {JSON.stringify(artifact?.content || { mock: 'data' }, null, 2)}
      </pre>
    </div>
  ),
  File: ({ artifact, ...props }: any) => (
    <div className="border rounded-lg bg-background shadow-sm p-4" {...props}>
      <div className="text-sm font-medium mb-2">File Artifact</div>
      <div className="text-sm text-muted-foreground">
        {artifact?.metadata?.name || 'Mock file'}
      </div>
    </div>
  ),
  Image: ({ artifact, ...props }: any) => (
    <div className="border rounded-lg bg-background shadow-sm p-4" {...props}>
      <div className="text-sm font-medium mb-2">Image Artifact</div>
      <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
        <span className="text-muted-foreground">Mock Image</span>
      </div>
    </div>
  )
}

// Auto-detecting Artifact component
const ArtifactRoot = ({ artifact, ...props }: any) => {
  const displayType = artifact?.displayType || 'text'
  
  switch (displayType) {
    case 'code':
      return <Artifact.Code artifact={artifact} {...props} />
    case 'data':
      return <Artifact.Data artifact={artifact} {...props} />
    case 'file':
      return <Artifact.File artifact={artifact} {...props} />
    case 'image':
      return <Artifact.Image artifact={artifact} {...props} />
    default:
      return <Artifact.Text artifact={artifact} {...props} />
  }
}

// Assign the root component to Artifact
Object.assign(Artifact, ArtifactRoot)

// Mock Input Components
export const Input = {
  Form: ({ request, onSubmit, onCancel, ...props }: any) => (
    <div className="border rounded-lg bg-background shadow-sm p-4" {...props}>
      <div className="text-sm font-medium mb-2">Mock Form Input</div>
      <div className="text-sm text-muted-foreground mb-4">
        {request?.prompt || 'Mock form prompt'}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSubmit?.({ value: 'mock-response' })}>
          Submit
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  ),
  Approval: ({ request, onSubmit, onCancel, ...props }: any) => (
    <div className="border rounded-lg bg-background shadow-sm p-4" {...props}>
      <div className="text-sm font-medium mb-2">Mock Approval Input</div>
      <div className="text-sm text-muted-foreground mb-4">
        {request?.prompt || 'Mock approval prompt'}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSubmit?.({ value: { approved: true } })}>
          Approve
        </Button>
        <Button variant="destructive" onClick={() => onSubmit?.({ value: { approved: false } })}>
          Reject
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  ),
  Field: ({ label, value, onChange, ...props }: any) => (
    <div className="space-y-2" {...props}>
      {label && <label className="text-sm font-medium">{label}</label>}
      <input
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  ),
  Selection: ({ request, onSubmit, ...props }: any) => (
    <div className="border rounded-lg bg-background shadow-sm p-4" {...props}>
      <div className="text-sm font-medium mb-2">Mock Selection Input</div>
      <div className="text-sm text-muted-foreground mb-4">
        {request?.prompt || 'Mock selection prompt'}
      </div>
      <Button onClick={() => onSubmit?.({ value: 'mock-selection' })}>
        Select
      </Button>
    </div>
  ),
  Upload: ({ request, onSubmit, ...props }: any) => (
    <div className="border rounded-lg bg-background shadow-sm p-4" {...props}>
      <div className="text-sm font-medium mb-2">Mock Upload Input</div>
      <div className="text-sm text-muted-foreground mb-4">
        {request?.prompt || 'Mock upload prompt'}
      </div>
      <Button onClick={() => onSubmit?.({ value: 'mock-upload' })}>
        Upload
      </Button>
    </div>
  )
}

// Mock Chat Components
export const Chat = {
  Root: ({ children, ...props }: any) => (
    <div className="border rounded-lg bg-background shadow-sm" {...props}>
      {children}
    </div>
  ),
  Message: ({ role, children, ...props }: any) => (
    <div className={`p-3 ${role === 'user' ? 'bg-primary/10' : 'bg-muted/50'}`} {...props}>
      <div className="text-sm">{children}</div>
    </div>
  ),
  Input: ({ onSend, placeholder, ...props }: any) => (
    <div className="p-3 border-t" {...props}>
      <div className="flex gap-2">
        <input
          className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder={placeholder || 'Type a message...'}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSend?.({ text: (e.target as HTMLInputElement).value })
              ;(e.target as HTMLInputElement).value = ''
            }
          }}
        />
        <Button onClick={() => onSend?.({ text: 'Mock message' })}>
          Send
        </Button>
      </div>
    </div>
  ),
  File: ({ file, ...props }: any) => (
    <div className="border rounded p-2 bg-muted" {...props}>
      <div className="text-xs font-medium">{file?.name || 'Mock file'}</div>
      <div className="text-xs text-muted-foreground">
        {file?.size ? `${Math.round(file.size / 1024)}KB` : 'Mock size'}
      </div>
    </div>
  ),
  Markdown: ({ content, ...props }: any) => (
    <div className="prose prose-sm max-w-none" {...props}>
      <div dangerouslySetInnerHTML={{ __html: content?.replace(/\n/g, '<br>') || 'Mock markdown' }} />
    </div>
  ),
  ToolCall: ({ toolCall, onApprove, onReject, ...props }: any) => (
    <div className="border rounded-lg bg-background shadow-sm p-4" {...props}>
      <div className="text-sm font-medium mb-2">Tool Call: {toolCall?.name || 'Mock Tool'}</div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onApprove?.(toolCall?.id)}>
          Approve
        </Button>
        <Button size="sm" variant="destructive" onClick={() => onReject?.(toolCall?.id)}>
          Reject
        </Button>
      </div>
    </div>
  ),
  Typing: ({ isTyping, ...props }: any) => (
    isTyping ? (
      <div className="p-3 text-sm text-muted-foreground" {...props}>
        <span className="animate-pulse">Agent is typing...</span>
      </div>
    ) : null
  )
}

// Mock Block Components
export const Block = {
  Message: ({ message, ...props }: any) => (
    <div className="border rounded-lg bg-background shadow-sm p-4" {...props}>
      <div className="text-sm font-medium mb-2">Block Message</div>
      <div className="text-sm text-muted-foreground">
        {typeof message?.content === 'string' ? message.content : 'Mock block message'}
      </div>
    </div>
  ),
  Protocol: ({ protocol, ...props }: any) => (
    <div className="border rounded-lg bg-background shadow-sm p-4" {...props}>
      <div className="text-sm font-medium mb-2">Protocol: {protocol?.type || 'Mock Protocol'}</div>
      <div className="text-sm text-muted-foreground">
        Version: {protocol?.version || '1.0.0'}
      </div>
    </div>
  ),
  Status: ({ status, ...props }: any) => (
    <div className="border rounded-lg bg-background shadow-sm p-4" {...props}>
      <div className="text-sm font-medium mb-2">Status: {status?.type || 'Mock Status'}</div>
      <div className="text-sm text-muted-foreground">
        State: {status?.state || 'online'}
      </div>
    </div>
  ),
  Metadata: ({ metadata, title, ...props }: any) => (
    <div className="border rounded-lg bg-background shadow-sm p-4" {...props}>
      <div className="text-sm font-medium mb-2">{title || 'Metadata'}</div>
      <pre className="text-xs bg-muted p-2 rounded overflow-auto">
        {JSON.stringify(metadata || { mock: 'metadata' }, null, 2)}
      </pre>
    </div>
  )
}

// Mock Task Components
export const Task = ({ task, ...props }: any) => (
  <div className="border rounded-lg bg-background shadow-sm p-4" {...props}>
    <div className="text-sm font-medium mb-2">Task: {task?.title || 'Mock Task'}</div>
    <div className="text-sm text-muted-foreground mb-2">
      Status: {task?.status || 'pending'}
    </div>
    {task?.progress && (
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full" 
          style={{ width: `${(task.progress * 100) || 0}%` }}
        />
      </div>
    )}
  </div>
)

// Mock Agent Primitive Components
export const AgentPrimitive = {
  Root: ({ children, ...props }: any) => (
    <div className="border rounded-lg bg-background shadow-sm p-4" {...props}>
      {children}
    </div>
  ),
  Card: ({ agent, ...props }: any) => (
    <div className="border rounded-lg bg-background shadow-sm p-4" {...props}>
      <div className="text-sm font-medium mb-2">{agent?.name || 'Mock Agent'}</div>
      <div className="text-sm text-muted-foreground">
        {agent?.description || 'Mock agent description'}
      </div>
    </div>
  ),
  Status: ({ status, ...props }: any) => (
    <div className="flex items-center gap-2" {...props}>
      <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`} />
      <span className="text-sm">{status || 'online'}</span>
    </div>
  ),
  Capabilities: ({ capabilities, ...props }: any) => (
    <div className="space-y-2" {...props}>
      <div className="text-sm font-medium">Capabilities</div>
      <div className="flex flex-wrap gap-1">
        {(capabilities || ['Mock Capability']).map((cap: any, index: number) => (
          <span key={index} className="text-xs bg-muted px-2 py-1 rounded">
            {typeof cap === 'string' ? cap : cap.name}
          </span>
        ))}
      </div>
    </div>
  )
}

// Mock Task Primitive Components
export const TaskPrimitive = {
  Root: ({ children, ...props }: any) => (
    <div className="border rounded-lg bg-background shadow-sm p-4" {...props}>
      {children}
    </div>
  ),
  Header: ({ task, ...props }: any) => (
    <div className="flex items-center justify-between mb-2" {...props}>
      <div className="text-sm font-medium">{task?.title || 'Mock Task'}</div>
      <div className="text-xs text-muted-foreground">{task?.status || 'pending'}</div>
    </div>
  ),
  Progress: ({ progress, ...props }: any) => (
    <div className="w-full bg-muted rounded-full h-2" {...props}>
      <div 
        className="bg-primary h-2 rounded-full" 
        style={{ width: `${(progress * 100) || 0}%` }}
      />
    </div>
  ),
  Actions: ({ children, ...props }: any) => (
    <div className="flex gap-2 mt-2" {...props}>
      {children}
    </div>
  )
}

// Mock Provider Components (these won't be used due to the alias, but included for completeness)
export const AgentProvider = ({ children }: { children: React.ReactNode }) => (
  <MockAgentContext.Provider value={MockAgentContext._currentValue}>
    {children}
  </MockAgentContext.Provider>
)

export const InputProvider = ({ children }: { children: React.ReactNode }) => (
  <MockInputContext.Provider value={MockInputContext._currentValue}>
    {children}
  </MockInputContext.Provider>
)

export const ArtifactProvider = ({ children }: { children: React.ReactNode }) => (
  <MockArtifactContext.Provider value={MockArtifactContext._currentValue}>
    {children}
  </MockArtifactContext.Provider>
)

export const CommunicationProvider = ({ children }: { children: React.ReactNode }) => (
  <MockCommunicationContext.Provider value={MockCommunicationContext._currentValue}>
    {children}
  </MockCommunicationContext.Provider>
)

// Default export for compatibility
export default {
  useAgentContext,
  useInputContext,
  useArtifactContext,
  useCommunicationContext,
  Button,
  Artifact,
  Input,
  Chat,
  Block,
  Task,
  AgentPrimitive,
  TaskPrimitive,
  AgentProvider,
  InputProvider,
  ArtifactProvider,
  CommunicationProvider
}