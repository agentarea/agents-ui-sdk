import { useState, useEffect } from 'react'
import { 
  AgentUI,
  Task,
  Chat,
  Artifact,
  Input,
  Block,
  useAgentConnection,
  useTask,
  useRuntimeEnvironment
} from '@agentarea/react'

// Mock runtime configurations
const runtimeConfigs = {
  a2a: {
    id: 'a2a',
    name: 'A2A Protocol',
    description: 'Google Agent-to-Agent communication protocol',
    endpoint: 'https://a2a-demo.example.com',
    features: [
      'Standardized agent discovery',
      'Capability negotiation',
      'Protocol compliance validation',
      'Real-time streaming',
      'Cross-platform compatibility'
    ],
    authentication: {
      type: 'oauth2' as const,
      clientId: 'demo-client-id'
    }
  },
  agentarea: {
    id: 'agentarea',
    name: 'AgentArea Custom',
    description: 'Custom protocol with enhanced features',
    endpoint: 'wss://agentarea-demo.example.com',
    features: [
      'Custom authentication',
      'Batch task submission',
      'Task analytics and metrics',
      'Template-based workflows',
      'Advanced scheduling'
    ],
    authentication: {
      type: 'bearer' as const,
      token: 'demo-bearer-token'
    }
  }
}

// Mock data for demonstrations
const mockTasks = {
  a2a: [
    {
      id: 'a2a-task-1',
      title: 'Discover Available Agents',
      status: 'completed' as const,
      progress: 1.0,
      result: {
        agents: [
          { id: 'data-agent', name: 'Data Analysis Agent', capabilities: ['analyze', 'visualize'] },
          { id: 'ml-agent', name: 'ML Training Agent', capabilities: ['train', 'predict'] }
        ]
      }
    },
    {
      id: 'a2a-task-2',
      title: 'Negotiate Capabilities',
      status: 'working' as const,
      progress: 0.7,
      result: null
    }
  ],
  agentarea: [
    {
      id: 'custom-task-1',
      title: 'Batch Process Documents',
      status: 'completed' as const,
      progress: 1.0,
      result: {
        processed: 150,
        errors: 2,
        artifacts: ['batch-report.pdf', 'error-log.txt']
      }
    },
    {
      id: 'custom-task-2',
      title: 'Generate Analytics Dashboard',
      status: 'working' as const,
      progress: 0.4,
      result: null
    }
  ]
}

const mockArtifacts = {
  a2a: [
    {
      id: 'a2a-artifact-1',
      displayType: 'data' as const,
      content: {
        data: {
          schema: { type: 'object' },
          content: {
            discoveredAgents: 12,
            compatibleProtocols: ['A2A-1.0', 'A2A-1.1'],
            averageLatency: 45,
            successRate: 0.98
          }
        }
      },
      metadata: {
        filename: 'agent-discovery-results.json',
        size: 1024,
        createdAt: new Date()
      },
      downloadable: true,
      shareable: true
    }
  ],
  agentarea: [
    {
      id: 'custom-artifact-1',
      displayType: 'code' as const,
      content: {
        code: {
          language: 'python',
          content: `# Custom Agent Workflow Template
class DocumentProcessor:
    def __init__(self, batch_size=50):
        self.batch_size = batch_size
        self.processed_count = 0
        
    async def process_batch(self, documents):
        results = []
        for doc in documents:
            try:
                result = await self.process_document(doc)
                results.append(result)
                self.processed_count += 1
            except Exception as e:
                self.log_error(doc.id, str(e))
        
        return results
    
    async def process_document(self, document):
        # Custom processing logic
        return {
            'id': document.id,
            'status': 'processed',
            'metadata': document.extract_metadata()
        }`
        }
      },
      metadata: {
        filename: 'document-processor.py',
        size: 2048,
        createdAt: new Date()
      },
      downloadable: true,
      shareable: true
    }
  ]
}

function RuntimeSelector({ 
  selectedRuntime, 
  onRuntimeChange 
}: { 
  selectedRuntime: keyof typeof runtimeConfigs
  onRuntimeChange: (runtime: keyof typeof runtimeConfigs) => void 
}) {
  return (
    <div className="runtime-selector">
      {Object.entries(runtimeConfigs).map(([key, config]) => (
        <div
          key={key}
          className={`runtime-card ${selectedRuntime === key ? 'active' : ''}`}
          onClick={() => onRuntimeChange(key as keyof typeof runtimeConfigs)}
        >
          <h3>{config.name}</h3>
          <p>{config.description}</p>
        </div>
      ))}
    </div>
  )
}

function ConnectionStatus({ runtime }: { runtime: keyof typeof runtimeConfigs }) {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  
  useEffect(() => {
    // Simulate connection process
    setStatus('connecting')
    const timer = setTimeout(() => {
      setStatus('connected')
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [runtime])

  const statusIcons = {
    connected: '🟢',
    connecting: '🟡',
    disconnected: '🔴'
  }

  return (
    <div className={`connection-status ${status}`}>
      <span>{statusIcons[status]}</span>
      <span>
        {status === 'connected' && `Connected to ${runtimeConfigs[runtime].name}`}
        {status === 'connecting' && `Connecting to ${runtimeConfigs[runtime].name}...`}
        {status === 'disconnected' && `Disconnected from ${runtimeConfigs[runtime].name}`}
      </span>
    </div>
  )
}

function ProtocolComparison() {
  return (
    <div className="protocol-comparison">
      <div className="protocol-info">
        <h4>🔗 A2A Protocol Features</h4>
        <ul>
          <li>Standardized agent discovery mechanism</li>
          <li>Automatic capability negotiation</li>
          <li>Protocol compliance validation</li>
          <li>Cross-platform interoperability</li>
          <li>Built-in security and authentication</li>
          <li>Real-time bidirectional communication</li>
        </ul>
      </div>
      
      <div className="protocol-info">
        <h4>⚡ AgentArea Custom Features</h4>
        <ul>
          <li>Flexible authentication methods</li>
          <li>Batch task submission and processing</li>
          <li>Advanced task analytics and metrics</li>
          <li>Template-based workflow automation</li>
          <li>Intelligent task scheduling</li>
          <li>Custom protocol extensions</li>
        </ul>
      </div>
    </div>
  )
}

function RuntimeDemo({ runtime }: { runtime: keyof typeof runtimeConfigs }) {
  const config = runtimeConfigs[runtime]
  const tasks = mockTasks[runtime]
  const artifacts = mockArtifacts[runtime]

  return (
    <div className="demo-section">
      <h2>{config.name} Demo</h2>
      
      {/* Protocol Information */}
      <div style={{ marginBottom: '2rem' }}>
        <Block.Protocol
          protocol={{
            type: config.name,
            version: '1.0.0',
            features: config.features,
            compliance: {
              level: 'full' as const,
              issues: []
            }
          }}
          showFeatures
          showCompliance
        />
      </div>

      {/* Connection Status */}
      <div style={{ marginBottom: '2rem' }}>
        <Block.Status
          status={{
            type: 'connection' as const,
            state: 'online' as const,
            message: `Connected to ${config.endpoint}`,
            lastUpdate: new Date(),
            metrics: {
              latency: runtime === 'a2a' ? 45 : 32,
              uptime: 7200,
              errorRate: 0.001
            }
          }}
          showMetrics
          realTime
        />
      </div>

      {/* Task Examples */}
      <div style={{ marginBottom: '2rem' }}>
        <h3>Active Tasks</h3>
        {tasks.map(task => (
          <div key={task.id} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #333', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <strong>{task.title}</strong>
              <span style={{ 
                padding: '0.25rem 0.5rem', 
                borderRadius: '4px', 
                fontSize: '0.8rem',
                backgroundColor: task.status === 'completed' ? '#1a4a1a' : '#4a4a1a',
                color: task.status === 'completed' ? '#4ade80' : '#fbbf24'
              }}>
                {task.status.toUpperCase()}
              </span>
            </div>
            <div style={{ 
              width: '100%', 
              height: '4px', 
              backgroundColor: '#333', 
              borderRadius: '2px',
              marginBottom: '0.5rem'
            }}>
              <div style={{ 
                width: `${task.progress * 100}%`, 
                height: '100%', 
                backgroundColor: task.status === 'completed' ? '#4ade80' : '#fbbf24',
                borderRadius: '2px'
              }} />
            </div>
            {task.result && (
              <pre style={{ 
                fontSize: '0.8rem', 
                backgroundColor: '#2a2a2a', 
                padding: '0.5rem', 
                borderRadius: '4px',
                overflow: 'auto'
              }}>
                {JSON.stringify(task.result, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>

      {/* Artifacts */}
      <div>
        <h3>Generated Artifacts</h3>
        {artifacts.map(artifact => (
          <div key={artifact.id} style={{ marginBottom: '1rem' }}>
            <Artifact
              artifact={artifact}
              onDownload={(artifact) => console.log(`Download ${runtime}:`, artifact.id)}
              onShare={(artifact) => console.log(`Share ${runtime}:`, artifact.id)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function App() {
  const [selectedRuntime, setSelectedRuntime] = useState<keyof typeof runtimeConfigs>('a2a')
  const environment = useRuntimeEnvironment()

  return (
    <div className="App">
      <header>
        <h1>Multi-Runtime Integration Demo</h1>
        <p>
          Showcasing AgentArea UI SDK with multiple agent communication protocols
        </p>
        
        {/* Environment Info */}
        <div style={{ 
          display: 'inline-flex', 
          gap: '1rem', 
          fontSize: '0.8rem', 
          color: '#ccc',
          marginBottom: '2rem'
        }}>
          <span>Environment: {environment.isVite ? 'Vite' : 'Unknown'}</span>
          <span>WebSockets: {environment.supportsWebSockets ? '✓' : '✗'}</span>
          <span>File API: {environment.supportsFileAPI ? '✓' : '✗'}</span>
        </div>
      </header>

      {/* Runtime Selection */}
      <section>
        <h2>Select Agent Runtime</h2>
        <RuntimeSelector 
          selectedRuntime={selectedRuntime}
          onRuntimeChange={setSelectedRuntime}
        />
        <ConnectionStatus runtime={selectedRuntime} />
      </section>

      {/* Protocol Comparison */}
      <section className="demo-section">
        <h2>Protocol Comparison</h2>
        <ProtocolComparison />
      </section>

      {/* AgentUI Integration */}
      <AgentUI
        runtime={selectedRuntime}
        endpoint={runtimeConfigs[selectedRuntime].endpoint}
        authentication={runtimeConfigs[selectedRuntime].authentication}
        autoConnect={false}
        debug={true}
        theme="dark"
      >
        {/* Runtime-specific Demo */}
        <RuntimeDemo runtime={selectedRuntime} />

        {/* Communication Examples */}
        <section className="demo-section">
          <h2>Protocol Messages</h2>
          
          <Block.Message
            message={{
              id: `${selectedRuntime}-msg-1`,
              type: selectedRuntime === 'a2a' ? 'agent.discovery' : 'task.batch_submit',
              source: 'client-app',
              target: selectedRuntime === 'a2a' ? 'a2a-registry' : 'agentarea-server',
              payload: selectedRuntime === 'a2a' 
                ? { query: { capabilities: ['analyze', 'visualize'] } }
                : { tasks: [{ id: 'task-1', type: 'document-process' }] },
              timestamp: new Date(),
              metadata: {
                protocol: runtimeConfigs[selectedRuntime].name,
                version: '1.0.0'
              }
            }}
            showMetadata
            showTimestamp
            showRouting
            expandable
          />

          <div style={{ marginTop: '1rem' }}>
            <Block.Message
              message={{
                id: `${selectedRuntime}-msg-2`,
                type: selectedRuntime === 'a2a' ? 'agent.discovery.response' : 'task.batch_submit.response',
                source: selectedRuntime === 'a2a' ? 'a2a-registry' : 'agentarea-server',
                target: 'client-app',
                payload: selectedRuntime === 'a2a'
                  ? { agents: [{ id: 'agent-1', capabilities: ['analyze'] }] }
                  : { batchId: 'batch-123', accepted: 1, rejected: 0 },
                timestamp: new Date(),
                metadata: {
                  correlationId: `${selectedRuntime}-msg-1`,
                  processingTime: 150
                }
              }}
              showMetadata
              showTimestamp
              showRouting
              expandable
            />
          </div>
        </section>

        {/* Input Collection Examples */}
        <section className="demo-section">
          <h2>Runtime-Specific Input Collection</h2>
          
          {selectedRuntime === 'a2a' && (
            <div>
              <h4>A2A Agent Selection</h4>
              <Input.Selection
                request={{
                  id: 'a2a-agent-select',
                  type: 'selection' as const,
                  prompt: 'Select agents for capability negotiation:',
                  required: true,
                  options: [
                    { value: 'data-agent', label: 'Data Analysis Agent', description: 'Specialized in data processing and analysis' },
                    { value: 'ml-agent', label: 'ML Training Agent', description: 'Machine learning model training and inference' },
                    { value: 'viz-agent', label: 'Visualization Agent', description: 'Data visualization and reporting' }
                  ],
                  metadata: { multiSelect: true }
                }}
                onSelect={(values) => console.log('A2A agents selected:', values)}
                multiSelect
              />
            </div>
          )}

          {selectedRuntime === 'agentarea' && (
            <div>
              <h4>Batch Processing Configuration</h4>
              <Input.Form
                schema={{
                  fields: [
                    { name: 'batchSize', type: 'number', label: 'Batch Size', required: true },
                    { name: 'priority', type: 'select', label: 'Priority Level', options: [
                      { value: 'low', label: 'Low Priority' },
                      { value: 'normal', label: 'Normal Priority' },
                      { value: 'high', label: 'High Priority' }
                    ]},
                    { name: 'schedule', type: 'datetime-local', label: 'Schedule Time' }
                  ]
                }}
                onSubmit={(data) => console.log('AgentArea batch config:', data)}
              />
            </div>
          )}
        </section>

        {/* Debug Information */}
        <AgentUI.Debug 
          showEnvironment 
          showRuntime 
          showConnections 
        />
      </AgentUI>
    </div>
  )
}

export default App