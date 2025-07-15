import { useState } from 'react'
import { createA2ARuntime } from '@agentarea/core'
import { 
  AgentProvider, 
  TaskPrimitive, 
  AgentPrimitive
} from '@agentarea/react'

function App() {
  const [taskInput, setTaskInput] = useState('')
  const [endpoint, setEndpoint] = useState('http://localhost:9999')
  const [token, setToken] = useState('')

  // Create A2A runtime with user-provided configuration
  const runtime = createA2ARuntime({
    agentBaseUrl: endpoint,
    authentication: token ? {
      type: 'bearer',
      token
    } : undefined
  })

  return (
    <div className="app">
      <h1>AgentArea UI SDK Demo</h1>
      
      {/* Configuration Panel */}
      <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
        <h2>Configuration</h2>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            Agent Endpoint:
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="http://localhost:9999"
              style={{ 
                marginLeft: '0.5rem', 
                padding: '0.5rem',
                width: '300px',
                background: '#2a2a2a',
                border: '1px solid #555',
                color: 'white',
                borderRadius: '4px'
              }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            Bearer Token (optional):
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="your-bearer-token"
              style={{ 
                marginLeft: '0.5rem', 
                padding: '0.5rem',
                width: '300px',
                background: '#2a2a2a',
                border: '1px solid #555',
                color: 'white',
                borderRadius: '4px'
              }}
            />
          </label>
        </div>
      </div>

      <AgentProvider runtime={runtime}>
        {/* Agent Information */}
        <AgentPrimitive.Root className="agent-card">
          <h2>Agent Information</h2>
          <AgentPrimitive.Name style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '0.5rem' }} />
          <AgentPrimitive.Description style={{ color: '#ccc', marginBottom: '1rem' }} />
          <AgentPrimitive.Status className="agent-status" />
          
          <AgentPrimitive.If connected>
            <div style={{ marginTop: '1rem' }}>
              <h3>Features</h3>
              <AgentPrimitive.Features />
              
              <h3>Capabilities</h3>
              <AgentPrimitive.Capabilities 
                renderCapability={(capability, index) => (
                  <div key={capability.name} className="capability-item">
                    <div className="capability-name">{capability.name}</div>
                    <div className="capability-description">{capability.description}</div>
                    <div style={{ fontSize: '0.8em', marginTop: '0.25rem' }}>
                      Input: {capability.inputTypes.join(', ')} | 
                      Output: {capability.outputTypes.join(', ')}
                    </div>
                  </div>
                )}
              />
            </div>
          </AgentPrimitive.If>
          
          <AgentPrimitive.If connected={false}>
            <div style={{ color: '#ff4444', marginTop: '1rem' }}>
              Unable to connect to agent. Please check the endpoint and try again.
            </div>
          </AgentPrimitive.If>
        </AgentPrimitive.Root>

        {/* Task Creation Interface */}
        <TaskPrimitive.Root className="task-creator">
          <h2>Create New Task</h2>
          <TaskPrimitive.Input
            className="task-input"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onSubmit={(value) => {
              console.log('Task submitted:', value)
              setTaskInput('')
            }}
            placeholder="Describe what you want the agent to do... (Ctrl/Cmd + Enter to submit)"
          />
          <TaskPrimitive.Send 
            taskInput={taskInput}
            className="task-send-btn"
          />
        </TaskPrimitive.Root>

        {/* Example Task States */}
        <div style={{ marginTop: '2rem' }}>
          <h2>Task Examples</h2>
          <p style={{ color: '#ccc', marginBottom: '2rem' }}>
            These are example task states to demonstrate the UI components:
          </p>
          
          {/* Simulated task examples */}
          <div className="task-item">
            <div style={{ marginBottom: '1rem' }}>
              <span className="task-status" data-status="working">Working</span>
              <span style={{ marginLeft: '1rem', fontWeight: 'bold' }}>
                Analyze sales data for Q4
              </span>
            </div>
            <div className="task-progress">
              <div>Processing sales records...</div>
              <div style={{ 
                background: '#646cff', 
                height: '4px', 
                width: '60%', 
                borderRadius: '2px',
                marginTop: '0.5rem'
              }}></div>
              <span style={{ fontSize: '0.8em' }}>60%</span>
            </div>
          </div>

          <div className="task-item">
            <div style={{ marginBottom: '1rem' }}>
              <span className="task-status" data-status="completed">Completed</span>
              <span style={{ marginLeft: '1rem', fontWeight: 'bold' }}>
                Generate monthly report
              </span>
            </div>
            <div className="task-output">
              <h4>Result:</h4>
              <pre>{JSON.stringify({
                type: "report",
                filename: "monthly_report_2024_12.pdf",
                summary: "Report generated successfully with 45 pages of analysis"
              }, null, 2)}</pre>
            </div>
          </div>

          <div className="task-item">
            <div style={{ marginBottom: '1rem' }}>
              <span className="task-status" data-status="failed">Failed</span>
              <span style={{ marginLeft: '1rem', fontWeight: 'bold' }}>
                Process invalid data
              </span>
            </div>
            <div style={{ color: '#ff4444', padding: '1rem', background: '#2a1a1a', borderRadius: '4px' }}>
              Error: Invalid data format. Expected JSON, received plain text.
            </div>
          </div>
        </div>

        {/* Streaming Example Section */}
        <AgentPrimitive.If supportsStreaming>
          <div style={{ marginTop: '2rem', padding: '1rem', background: '#1a2a1a', borderRadius: '8px' }}>
            <h3 style={{ color: '#32cd32' }}>✨ Real-time Streaming Supported</h3>
            <p>This agent supports real-time streaming for live task updates!</p>
          </div>
        </AgentPrimitive.If>
      </AgentProvider>
    </div>
  )
}

export default App