import { useState } from 'react'
import { 
  AgentUI,
  Task,
  Chat,
  Artifact,
  Input,
  Block,
  useTask,
  useArtifacts,
  useAgentConnection
} from '@agentarea/react'

// Mock data for demonstration
const mockArtifacts = [
  {
    id: 'artifact-1',
    displayType: 'code' as const,
    content: {
      code: {
        language: 'javascript',
        content: `function analyzeData(data) {
  const results = data.map(item => ({
    id: item.id,
    score: calculateScore(item),
    category: classifyItem(item)
  }));
  
  return {
    total: results.length,
    averageScore: results.reduce((sum, r) => sum + r.score, 0) / results.length,
    categories: groupBy(results, 'category')
  };
}`
      }
    },
    metadata: {
      filename: 'data-analyzer.js',
      size: 1024,
      createdAt: new Date('2024-01-15T10:30:00Z')
    },
    downloadable: true,
    shareable: true
  },
  {
    id: 'artifact-2',
    displayType: 'data' as const,
    content: {
      data: {
        schema: {
          type: 'object',
          properties: {
            sales: { type: 'array' },
            summary: { type: 'object' }
          }
        },
        content: {
          sales: [
            { month: 'Jan', revenue: 45000, units: 120 },
            { month: 'Feb', revenue: 52000, units: 135 },
            { month: 'Mar', revenue: 48000, units: 128 }
          ],
          summary: {
            totalRevenue: 145000,
            totalUnits: 383,
            averageMonthly: 48333
          }
        }
      }
    },
    metadata: {
      filename: 'q1-sales-data.json',
      size: 2048,
      createdAt: new Date('2024-01-15T11:00:00Z')
    },
    downloadable: true,
    shareable: false
  },
  {
    id: 'artifact-3',
    displayType: 'file' as const,
    content: {
      file: {
        name: 'quarterly-report.pdf',
        url: '/mock-files/quarterly-report.pdf',
        size: 1024000,
        mimeType: 'application/pdf'
      }
    },
    metadata: {
      filename: 'quarterly-report.pdf',
      size: 1024000,
      createdAt: new Date('2024-01-15T12:00:00Z')
    },
    downloadable: true,
    shareable: true
  }
]

const mockMessages = [
  {
    id: 'msg-1',
    type: 'task.submitted',
    source: 'user-client',
    target: 'data-agent',
    payload: {
      taskId: 'task-123',
      instruction: 'Analyze Q1 sales data and generate insights'
    },
    timestamp: new Date('2024-01-15T10:00:00Z'),
    metadata: {
      clientVersion: '1.2.0',
      sessionId: 'sess-abc123'
    }
  },
  {
    id: 'msg-2',
    type: 'task.progress',
    source: 'data-agent',
    target: 'user-client',
    payload: {
      taskId: 'task-123',
      progress: 0.6,
      status: 'Processing sales records...'
    },
    timestamp: new Date('2024-01-15T10:15:00Z'),
    metadata: {
      processingNode: 'worker-02'
    }
  },
  {
    id: 'msg-3',
    type: 'task.completed',
    source: 'data-agent',
    target: 'user-client',
    payload: {
      taskId: 'task-123',
      result: {
        insights: ['Revenue increased 15% from Jan to Feb', 'March showed slight decline'],
        artifacts: ['artifact-1', 'artifact-2', 'artifact-3']
      }
    },
    timestamp: new Date('2024-01-15T10:30:00Z'),
    metadata: {
      executionTime: 1800000,
      resourcesUsed: { cpu: '2.4 cores', memory: '1.2GB' }
    }
  }
]

const mockInputRequests = [
  {
    id: 'input-1',
    type: 'approval' as const,
    prompt: 'The analysis found potential data quality issues. Should we proceed with the current dataset or request data cleaning first?',
    required: true,
    options: [
      { value: 'proceed', label: 'Proceed with current data', description: 'Continue analysis with existing data quality' },
      { value: 'clean', label: 'Clean data first', description: 'Run data cleaning process before analysis' },
      { value: 'manual', label: 'Manual review', description: 'Review data quality issues manually' }
    ],
    metadata: {
      context: 'Data quality check found 12% missing values and 3 outliers',
      severity: 'medium'
    }
  },
  {
    id: 'input-2',
    type: 'selection' as const,
    prompt: 'Which visualization types would you like to include in the report?',
    required: false,
    options: [
      { value: 'bar', label: 'Bar Charts', description: 'Monthly revenue comparison' },
      { value: 'line', label: 'Line Graphs', description: 'Trend analysis over time' },
      { value: 'pie', label: 'Pie Charts', description: 'Category distribution' },
      { value: 'scatter', label: 'Scatter Plots', description: 'Correlation analysis' }
    ],
    metadata: {
      multiSelect: true,
      defaultSelections: ['bar', 'line']
    }
  }
]

function ComprehensiveDemo() {
  const [selectedTab, setSelectedTab] = useState('overview')
  const [inputResponses, setInputResponses] = useState<Record<string, any>>({})

  const handleInputResponse = (requestId: string, value: any) => {
    setInputResponses(prev => ({ ...prev, [requestId]: value }))
    console.log('Input response:', { requestId, value })
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'artifacts', label: 'Artifacts' },
    { id: 'inputs', label: 'Input Collection' },
    { id: 'communication', label: 'Communication' },
    { id: 'tasks', label: 'Task Management' }
  ]

  return (
    <div className="comprehensive-demo">
      <header className="demo-header">
        <h1>AgentArea UI SDK - Comprehensive Demo</h1>
        <p>Showcasing all new components and capabilities</p>
      </header>

      {/* Tab Navigation */}
      <nav className="demo-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`tab-button ${selectedTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <main className="demo-content">
        {selectedTab === 'overview' && (
          <section className="overview-section">
            <h2>AgentUI Entry Point Component</h2>
            <p>The new AgentUI component provides a unified entry point with runtime management:</p>
            
            <div className="code-example">
              <h3>Basic Usage</h3>
              <pre>{`<AgentUI 
  runtime="a2a" 
  endpoint="https://api.example.com"
  autoConnect
  debug
>
  <Task id="task-1" />
  <Chat taskId="task-1" />
</AgentUI>`}</pre>
            </div>

            <div className="code-example">
              <h3>Compound Component Pattern</h3>
              <pre>{`<AgentUI.Provider runtime="agentarea" endpoint="wss://realtime.example.com">
  <AgentUI.Connection showLatency showActions />
  <Task.List filter={{ status: ['working', 'completed'] }} />
  <AgentUI.Debug showEnvironment showConnections />
</AgentUI.Provider>`}</pre>
            </div>

            <div className="feature-grid">
              <div className="feature-card">
                <h4>🔄 Multi-Runtime Support</h4>
                <p>Supports A2A protocol, AgentArea custom protocol, and extensible runtime system</p>
              </div>
              <div className="feature-card">
                <h4>🎨 Artifact Display</h4>
                <p>Rich rendering for code, files, data, images, and text artifacts</p>
              </div>
              <div className="feature-card">
                <h4>📝 Input Collection</h4>
                <p>Dynamic forms, approvals, selections, and file uploads</p>
              </div>
              <div className="feature-card">
                <h4>💬 Communication Blocks</h4>
                <p>Protocol messages, status updates, and metadata display</p>
              </div>
            </div>
          </section>
        )}

        {selectedTab === 'artifacts' && (
          <section className="artifacts-section">
            <h2>Artifact Display Components</h2>
            <p>Rich rendering for different types of task outputs and results:</p>

            <div className="artifacts-grid">
              {mockArtifacts.map(artifact => (
                <div key={artifact.id} className="artifact-demo">
                  <Artifact
                    artifact={artifact}
                    onDownload={(artifact) => console.log('Download:', artifact.id)}
                    onShare={(artifact) => console.log('Share:', artifact.id)}
                    onPreview={(artifact) => console.log('Preview:', artifact.id)}
                  />
                </div>
              ))}
            </div>

            <div className="code-example">
              <h3>Usage Examples</h3>
              <pre>{`// Auto-detecting artifact component
<Artifact 
  artifact={artifact}
  onDownload={handleDownload}
  onShare={handleShare}
/>

// Specific artifact types
<Artifact.Code artifact={codeArtifact} />
<Artifact.Data artifact={dataArtifact} />
<Artifact.File artifact={fileArtifact} />

// Container with custom content
<Artifact.Container 
  artifact={artifact}
  downloadable
  shareable
>
  <CustomRenderer data={artifact.content} />
</Artifact.Container>`}</pre>
            </div>
          </section>
        )}

        {selectedTab === 'inputs' && (
          <section className="inputs-section">
            <h2>Input Collection Components</h2>
            <p>Handle user input requests from agent tasks:</p>

            <div className="inputs-demo">
              {mockInputRequests.map(request => (
                <div key={request.id} className="input-demo">
                  <h4>{request.prompt}</h4>
                  
                  {request.type === 'approval' && (
                    <Input.Approval
                      request={request}
                      onApprove={(value, reason) => handleInputResponse(request.id, { approved: true, value, reason })}
                      onReject={(reason) => handleInputResponse(request.id, { approved: false, reason })}
                      context={request.metadata?.context}
                    />
                  )}

                  {request.type === 'selection' && (
                    <Input.Selection
                      request={request}
                      onSelect={(values) => handleInputResponse(request.id, values)}
                      multiSelect={request.metadata?.multiSelect}
                      defaultValues={request.metadata?.defaultSelections}
                    />
                  )}

                  {inputResponses[request.id] && (
                    <div className="response-preview">
                      <strong>Response:</strong>
                      <pre>{JSON.stringify(inputResponses[request.id], null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}

              <div className="input-demo">
                <h4>File Upload Example</h4>
                <Input.Upload
                  accept=".csv,.json,.xlsx"
                  maxSize={10 * 1024 * 1024} // 10MB
                  onUpload={(files) => console.log('Files uploaded:', files)}
                  onProgress={(progress) => console.log('Upload progress:', progress)}
                  multiple
                />
              </div>

              <div className="input-demo">
                <h4>Dynamic Form Example</h4>
                <Input.Form
                  schema={{
                    fields: [
                      { name: 'name', type: 'text', label: 'Project Name', required: true },
                      { name: 'description', type: 'textarea', label: 'Description' },
                      { name: 'priority', type: 'select', label: 'Priority', options: [
                        { value: 'low', label: 'Low' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'high', label: 'High' }
                      ]}
                    ]
                  }}
                  onSubmit={(data) => console.log('Form submitted:', data)}
                  onValidate={(data) => {
                    const errors: any = {}
                    if (!data.name) errors.name = 'Name is required'
                    return errors
                  }}
                />
              </div>
            </div>

            <div className="code-example">
              <h3>Usage Examples</h3>
              <pre>{`// Approval input
<Input.Approval
  request={approvalRequest}
  onApprove={(value, reason) => handleApproval(true, value, reason)}
  onReject={(reason) => handleApproval(false, null, reason)}
  showContext
/>

// Multi-select input
<Input.Selection
  request={selectionRequest}
  multiSelect
  searchable
  onSelect={handleSelection}
/>

// File upload with progress
<Input.Upload
  accept=".pdf,.doc,.docx"
  maxSize={5 * 1024 * 1024}
  onUpload={handleFileUpload}
  onProgress={handleProgress}
  dragAndDrop
/>`}</pre>
            </div>
          </section>
        )}

        {selectedTab === 'communication' && (
          <section className="communication-section">
            <h2>Communication Block Components</h2>
            <p>Display agent-to-agent protocol messages and system communications:</p>

            <div className="communication-demo">
              {mockMessages.map(message => (
                <Block.Message
                  key={message.id}
                  message={message}
                  showMetadata
                  showTimestamp
                  showRouting
                  expandable
                />
              ))}

              <div className="protocol-demo">
                <h4>Protocol Information</h4>
                <Block.Protocol
                  protocol={{
                    type: 'A2A',
                    version: '1.0.0',
                    features: ['streaming', 'file-transfer', 'real-time-updates'],
                    compliance: {
                      level: 'full',
                      issues: []
                    }
                  }}
                  showFeatures
                  showCompliance
                />
              </div>

              <div className="status-demo">
                <h4>System Status</h4>
                <Block.Status
                  status={{
                    type: 'connection',
                    state: 'online',
                    message: 'Connected to data-agent via WebSocket',
                    lastUpdate: new Date(),
                    metrics: {
                      latency: 45,
                      uptime: 7200,
                      errorRate: 0.02
                    }
                  }}
                  showMetrics
                  realTime
                />
              </div>

              <div className="metadata-demo">
                <h4>Technical Metadata</h4>
                <Block.Metadata
                  metadata={{
                    executionEnvironment: 'node-worker-02',
                    resourceUsage: {
                      cpu: '2.4 cores',
                      memory: '1.2GB',
                      storage: '45MB'
                    },
                    performance: {
                      executionTime: 1800,
                      cacheHits: 23,
                      cacheMisses: 4
                    },
                    security: {
                      authMethod: 'bearer-token',
                      permissions: ['read', 'write', 'execute'],
                      auditTrail: 'audit-log-456'
                    }
                  }}
                  title="Execution Metadata"
                  expandable
                />
              </div>
            </div>

            <div className="code-example">
              <h3>Usage Examples</h3>
              <pre>{`// Protocol message display
<Block.Message
  message={protocolMessage}
  showMetadata
  showRouting
  expandable
  correlatedMessage={relatedMessage}
/>

// Protocol information
<Block.Protocol
  protocol={{
    type: 'A2A',
    version: '1.0.0',
    features: ['streaming', 'file-transfer'],
    compliance: { level: 'full' }
  }}
/>

// Real-time status
<Block.Status
  status={{
    type: 'agent',
    state: 'working',
    metrics: { latency: 45, uptime: 7200 }
  }}
  realTime
/>`}</pre>
            </div>
          </section>
        )}

        {selectedTab === 'tasks' && (
          <section className="tasks-section">
            <h2>Enhanced Task Management</h2>
            <p>Comprehensive task handling with input requests and artifact management:</p>

            <div className="task-demo">
              <h4>Task with Input Requests</h4>
              <Task.Root taskId="demo-task-1">
                <Task.Status />
                <Task.Progress />
                <Task.InputRequest 
                  requests={mockInputRequests}
                  onResponse={handleInputResponse}
                />
                <Task.Artifacts artifacts={mockArtifacts} />
                <Task.Chat />
              </Task.Root>
            </div>

            <div className="chat-demo">
              <h4>Enhanced Chat Interface</h4>
              <Chat.Root taskId="demo-task-1">
                <Chat.Message 
                  message={{
                    id: 'chat-1',
                    content: 'I need to analyze the sales data. Can you help me choose the right approach?',
                    sender: 'user',
                    timestamp: new Date()
                  }}
                />
                <Chat.InputForm
                  schema={{
                    fields: [
                      { 
                        name: 'approach', 
                        type: 'select', 
                        label: 'Analysis Approach',
                        options: [
                          { value: 'statistical', label: 'Statistical Analysis' },
                          { value: 'ml', label: 'Machine Learning' },
                          { value: 'visual', label: 'Visual Analysis' }
                        ]
                      }
                    ]
                  }}
                  onSubmit={(data) => console.log('Chat form submitted:', data)}
                />
              </Chat.Root>
            </div>

            <div className="code-example">
              <h3>Usage Examples</h3>
              <pre>{`// Enhanced task component
<Task.Root taskId="task-123">
  <Task.Status />
  <Task.Progress />
  <Task.InputRequest 
    requests={inputRequests}
    onResponse={handleInputResponse}
  />
  <Task.Artifacts 
    artifacts={artifacts}
    onDownload={handleDownload}
  />
  <Task.Chat />
</Task.Root>

// Chat with structured input
<Chat.Root taskId="task-123">
  <Chat.Message message={message} />
  <Chat.InputForm
    schema={formSchema}
    onSubmit={handleFormSubmit}
  />
</Chat.Root>`}</pre>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function App() {
  const [runtime, setRuntime] = useState<'a2a' | 'agentarea'>('a2a')
  const [endpoint, setEndpoint] = useState('http://localhost:9999')
  const [token, setToken] = useState('')

  return (
    <AgentUI
      runtime={runtime}
      endpoint={endpoint}
      authentication={token ? { type: 'bearer', token } : undefined}
      autoConnect={false}
      debug={true}
      devTools={true}
      theme="system"
    >
      <div className="app">
        {/* Configuration Panel */}
        <div className="config-panel">
          <h3>Runtime Configuration</h3>
          <div className="config-row">
            <label>
              Runtime:
              <select 
                value={runtime} 
                onChange={(e) => setRuntime(e.target.value as 'a2a' | 'agentarea')}
              >
                <option value="a2a">A2A Protocol</option>
                <option value="agentarea">AgentArea Custom</option>
              </select>
            </label>
          </div>
          <div className="config-row">
            <label>
              Endpoint:
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="http://localhost:9999"
              />
            </label>
          </div>
          <div className="config-row">
            <label>
              Token:
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Bearer token (optional)"
              />
            </label>
          </div>
        </div>

        {/* Connection Status */}
        <AgentUI.Connection 
          showStatus 
          showLatency 
          showActions 
        />

        {/* Main Demo */}
        <ComprehensiveDemo />

        {/* Debug Panel */}
        <AgentUI.Debug 
          showEnvironment 
          showRuntime 
          showConnections 
          showConfig 
        />
      </div>
    </AgentUI>
  )
}

export default App