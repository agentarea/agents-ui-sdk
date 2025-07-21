"use client";

import { useState } from "react";
import { AgentUI, Task, Chat, Artifact } from "@agentarea/react";

export default function Home() {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState("wss://api.agentarea.com/ws");
  const [isConnected, setIsConnected] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AgentArea UI SDK - A2A Demo
          </h1>
          <p className="text-gray-600 mb-4">
            A demonstration of the AgentArea UI SDK components with Agent-to-Agent (A2A) protocol support.
          </p>
          
          {/* Connection Controls */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700 mb-1">
                A2A Endpoint
              </label>
              <input
                type="text"
                id="endpoint"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="wss://api.agentarea.com/ws"
              />
            </div>
            <button
              onClick={() => setIsConnected(!isConnected)}
              className={`px-4 py-2 rounded-md font-medium ${
                isConnected
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {isConnected ? "Disconnect" : "Connect"}
            </button>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-sm text-gray-600">
              {isConnected ? "Connected to A2A endpoint" : "Disconnected"}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <AgentUI
          runtime="a2a"
          endpoint={endpoint}
          autoConnect={isConnected}
          debug={true}
          theme="light"
          className="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Task Management */}
            <div className="space-y-6">
              {/* Task Creation */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Create Task
                </h2>
                <div className="space-y-4">
                  <Task.Input
                    placeholder="Describe what you want the agent to do..."
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-between items-center">
                    <Task.Send
                      onClick={() => {
                        // Simulate task creation with a mock ID
                        const newTaskId = `task-${Date.now()}`;
                        setTaskId(newTaskId);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Send Task
                    </Task.Send>
                    {taskId && (
                      <span className="text-sm text-gray-500">
                        Active: {taskId}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Task Status */}
              {taskId && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Task Status
                  </h2>
                  <div className="space-y-3">
                    <Task.Status
                      taskId={taskId}
                      className="flex items-center gap-2"
                    />
                    <Task.Progress
                      taskId={taskId}
                      showPercentage={true}
                      className="w-full"
                    />
                    <div className="flex gap-2">
                      <Task.Cancel
                        taskId={taskId}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Task.Cancel>
                      <Task.Retry
                        taskId={taskId}
                        variant="outline"
                        size="sm"
                      >
                        Retry
                      </Task.Retry>
                    </div>
                  </div>
                </div>
              )}

              {/* Debug Panel */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Debug Information
                </h2>
                <AgentUI.Debug
                  showEnvironment={true}
                  showRuntime={true}
                  showConnections={true}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Right Column - Communication */}
            <div className="space-y-6">
              {/* Chat Interface */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Agent Chat
                </h2>
                <Chat.Root maxHeight="400px" className="mb-4">
                  <Chat.Message
                    role="user"
                    timestamp={new Date()}
                    avatar="U"
                  >
                    <Chat.Content>
                      Hello! Can you help me analyze this data and create a visualization?
                    </Chat.Content>
                  </Chat.Message>
                  
                  <Chat.Message
                    role="agent"
                    timestamp={new Date()}
                    avatar="A"
                    isStreaming={false}
                  >
                    <Chat.Content>
                      I'd be happy to help you analyze data and create visualizations! 
                      I can work with various data formats and create charts, graphs, and other visual representations. 
                      Could you please share the data you'd like me to analyze?
                    </Chat.Content>
                  </Chat.Message>

                  <Chat.Message
                    role="agent"
                    timestamp={new Date()}
                    avatar="A"
                    artifacts={[
                      {
                        id: "chart-1",
                        type: "code",
                        title: "Data Visualization",
                        content: `import matplotlib.pyplot as plt
import pandas as pd

# Sample data analysis
data = {
    'month': ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    'sales': [100, 120, 140, 110, 160]
}

df = pd.DataFrame(data)
plt.figure(figsize=(10, 6))
plt.plot(df['month'], df['sales'], marker='o')
plt.title('Monthly Sales Trend')
plt.xlabel('Month')
plt.ylabel('Sales')
plt.grid(True)
plt.show()`,
                        metadata: {
                          language: "python",
                          size: 234,
                          createdAt: new Date().toISOString()
                        }
                      }
                    ]}
                  >
                    <Chat.Content>
                      I've created a sample data visualization for you. Here's the Python code that generates a monthly sales trend chart.
                    </Chat.Content>
                  </Chat.Message>
                </Chat.Root>

                <Chat.Input
                  placeholder="Type your message..."
                  onSend={(message) => {
                    console.log("Sending message:", message);
                  }}
                />
              </div>

              {/* Artifacts Display */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Generated Artifacts
                </h2>
                <Artifact.Container
                  taskId={taskId}
                  className="space-y-4"
                >
                  <Artifact.Code
                    title="Data Analysis Script"
                    language="python"
                    content={`import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

# Load and process data
data = pd.read_csv('data.csv')
X = data[['feature1', 'feature2']]
y = data['target']

# Train model
model = LinearRegression()
model.fit(X, y)

# Make predictions
predictions = model.predict(X)
print(f"Model R² score: {model.score(X, y):.3f}")
`}
                    showActions={true}
                    className="border rounded"
                  />

                  <Artifact.Data
                    title="Analysis Results"
                    data={{
                      model_performance: {
                        r2_score: 0.892,
                        mae: 2.34,
                        rmse: 3.12
                      },
                      feature_importance: {
                        feature1: 0.67,
                        feature2: 0.33
                      },
                      predictions: [10.2, 15.8, 22.1, 18.9, 25.3]
                    }}
                    format="json"
                    showActions={true}
                    className="border rounded"
                  />
                </Artifact.Container>
              </div>
            </div>
          </div>

          {/* Connection Monitor */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Connection Monitor
            </h2>
            <AgentUI.Connection
              showStatus={true}
              showLatency={true}
              showActions={true}
              className="space-y-2"
            />
          </div>
        </AgentUI>
      </div>
    </div>
  );
}
