import type { Meta, StoryObj } from "@storybook/react";
import { Chat, Artifact, Input } from "@agentarea/react";
import type { EnhancedArtifact, TaskInputRequest } from "@agentarea/core";
import { useState } from "react";
import React from "react";

const meta: Meta<typeof Chat.Root> = {
  title: "Components/Chat Enhanced",
  component: Chat.Root,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Enhanced Chat components with artifact rendering and input collection capabilities",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock artifacts for chat
const mockCodeArtifact: EnhancedArtifact = {
  id: "chat-artifact-1",
  taskId: "chat-task-1",
  displayType: "code",
  content: {
    code: {
      language: "python",
      content: `import pandas as pd
import matplotlib.pyplot as plt

# Load and analyze sales data
df = pd.read_csv('sales_data.csv')

# Calculate monthly revenue
monthly_revenue = df.groupby('month')['revenue'].sum()

# Create visualization
plt.figure(figsize=(10, 6))
monthly_revenue.plot(kind='bar')
plt.title('Monthly Revenue Analysis')
plt.xlabel('Month')
plt.ylabel('Revenue ($)')
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()

print(f"Total revenue: {monthly_revenue.sum():,.2f}")
print(f"Average monthly revenue: {monthly_revenue.mean():,.2f}")`,
    },
  },
  mimeType: "text/x-python",
  size: 512,
  createdAt: new Date(),
  downloadable: true,
  shareable: true,
  metadata: {
    name: "Sales Analysis Script",
    language: "python",
  },
};

const mockDataArtifact: EnhancedArtifact = {
  id: "chat-artifact-2",
  taskId: "chat-task-1",
  displayType: "data",
  content: {
    analysis_results: {
      total_revenue: 1250000,
      total_orders: 3420,
      average_order_value: 365.5,
      top_products: [
        { name: "Premium Widget", revenue: 280000, units: 560 },
        { name: "Standard Widget", revenue: 220000, units: 880 },
        { name: "Deluxe Widget", revenue: 180000, units: 300 },
      ],
      monthly_breakdown: {
        october: { revenue: 420000, orders: 1150 },
        november: { revenue: 380000, orders: 1040 },
        december: { revenue: 450000, orders: 1230 },
      },
    },
  },
  mimeType: "application/json",
  size: 1024,
  createdAt: new Date(),
  downloadable: true,
  shareable: true,
  metadata: {
    name: "Analysis Results",
    format: "JSON",
  },
};

const mockInputRequest: TaskInputRequest = {
  id: "chat-input-1",
  taskId: "chat-task-1",
  type: "approval",
  prompt: "Database Query Approval",
  required: true,
  metadata: {
    title: "Execute Analytics Query",
    description:
      "I need permission to run a query on the sales database to get the latest data.",
    context: {
      query: 'SELECT * FROM sales WHERE date >= "2024-01-01"',
      database: "production_sales",
      estimatedRows: 50000,
    },
  },
};

// Enhanced chat with artifacts
export const ChatWithArtifacts: Story = {
  render: () => {
    const [messages, setMessages] = useState([
      {
        role: "user" as const,
        content: "Can you analyze our sales data and create a visualization?",
        timestamp: new Date(Date.now() - 300000),
      },
      {
        role: "agent" as const,
        content:
          "I will analyze your sales data and create a visualization. Let me start by generating the analysis script.",
        timestamp: new Date(Date.now() - 240000),
      },
      {
        role: "agent" as const,
        content:
          "Here is the Python script I have created for your sales analysis:",
        timestamp: new Date(Date.now() - 180000),
        artifacts: [mockCodeArtifact],
      },
      {
        role: "agent" as const,
        content:
          "I have also processed your data and here are the key insights:",
        timestamp: new Date(Date.now() - 120000),
        artifacts: [mockDataArtifact],
      },
    ]);

    return (
      <div className="w-[800px] h-[600px] border rounded-lg flex flex-col">
        <div className="p-4 border-b bg-muted/30">
          <h3 className="font-semibold">Sales Analysis Chat</h3>
        </div>

        <div className="flex-1 p-4 overflow-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div className="max-w-[80%] space-y-3">
                <div
                  className={`p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="text-sm">{message.content}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>

                {/* Render artifacts */}
                {message.artifacts?.map((artifact) => (
                  <Artifact
                    key={artifact.id}
                    artifact={artifact}
                    onDownload={(artifact) =>
                      console.log("Download:", artifact.metadata?.name)
                    }
                    onShare={(artifact) =>
                      console.log("Share:", artifact.metadata?.name)
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t">
          <Chat.Input
            onSend={({ text }) => {
              setMessages((prev) => [
                ...prev,
                {
                  role: "user" as const,
                  content: text,
                  timestamp: new Date(),
                },
              ]);
            }}
            placeholder="Ask about the analysis..."
          />
        </div>
      </div>
    );
  },
};

// Chat with input forms
export const ChatWithInputForms: Story = {
  render: () => {
    const [messages, setMessages] = useState([
      {
        role: "user" as const,
        content: "I need you to analyze our customer database",
        timestamp: new Date(Date.now() - 180000),
      },
      {
        role: "agent" as const,
        content:
          "I can help you analyze your customer database. However, I need your approval to access the production database.",
        timestamp: new Date(Date.now() - 120000),
      },
    ]);

    const [pendingInputs, setPendingInputs] = useState([mockInputRequest]);

    const handleInputResponse = (requestId: string, response: any) => {
      setPendingInputs((prev) => prev.filter((req) => req.id !== requestId));

      const approved = response.approved;
      const reasonText = response.reason ? `: ${response.reason}` : "";
      setMessages((prev) => [
        ...prev,
        {
          role: "user" as const,
          content: approved
            ? `✅ Approved database access${reasonText}`
            : `❌ Rejected database access${reasonText}`,
          timestamp: new Date(),
        },
        {
          role: "agent" as const,
          content: approved
            ? "Thank you! I will now access the database and perform the analysis. This may take a few minutes."
            : "I understand. Is there an alternative approach you would prefer for the analysis?",
          timestamp: new Date(),
        },
      ]);
    };

    return (
      <div className="w-[800px] h-[600px] border rounded-lg flex flex-col">
        <div className="p-4 border-b bg-muted/30">
          <h3 className="font-semibold">Customer Analysis Chat</h3>
        </div>

        <div className="flex-1 p-4 overflow-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="text-sm">{message.content}</div>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {/* Render pending input requests */}
          {pendingInputs.map((request) => (
            <div
              key={request.id}
              className="border rounded-lg p-4 bg-background"
            >
              <Input.Approval
                request={request}
                onSubmit={(response) =>
                  handleInputResponse(request.id, response.value)
                }
              />
            </div>
          ))}
        </div>

        <div className="p-3 border-t">
          <Chat.Input
            onSend={({ text }) => {
              setMessages((prev) => [
                ...prev,
                {
                  role: "user" as const,
                  content: text,
                  timestamp: new Date(),
                },
              ]);
            }}
            placeholder="Continue the conversation..."
          />
        </div>
      </div>
    );
  },
};

// Multi-agent conversation
export const MultiAgentChat: Story = {
  render: () => {
    const [messages] = useState([
      {
        role: "user" as const,
        content: "I need a comprehensive business report for Q4",
        timestamp: new Date(Date.now() - 600000),
        agent: "User",
      },
      {
        role: "agent" as const,
        content:
          "I will coordinate with our specialized agents to create a comprehensive Q4 report. Let me delegate the tasks.",
        timestamp: new Date(Date.now() - 540000),
        agent: "Coordinator Agent",
      },
      {
        role: "agent" as const,
        content:
          "I will handle the financial analysis portion. Gathering revenue, profit, and expense data now.",
        timestamp: new Date(Date.now() - 480000),
        agent: "Finance Agent",
      },
      {
        role: "agent" as const,
        content:
          "I will analyze customer metrics including acquisition, retention, and satisfaction scores.",
        timestamp: new Date(Date.now() - 420000),
        agent: "Customer Analytics Agent",
      },
      {
        role: "agent" as const,
        content:
          "I will create the visualizations and format the final report once all data is collected.",
        timestamp: new Date(Date.now() - 360000),
        agent: "Report Generation Agent",
      },
      {
        role: "agent" as const,
        content:
          "Financial analysis complete. Q4 revenue increased 18% YoY to $2.4M. Detailed breakdown attached.",
        timestamp: new Date(Date.now() - 240000),
        agent: "Finance Agent",
        artifacts: [mockDataArtifact],
      },
      {
        role: "agent" as const,
        content:
          "Customer analysis shows 87% retention rate and NPS of 72. Customer acquisition cost decreased by 12%.",
        timestamp: new Date(Date.now() - 180000),
        agent: "Customer Analytics Agent",
      },
      {
        role: "agent" as const,
        content:
          "All analyses are complete. Generating the comprehensive Q4 business report now.",
        timestamp: new Date(Date.now() - 120000),
        agent: "Report Generation Agent",
      },
    ]);

    const getAgentColor = (agent: string) => {
      const colors = {
        User: "bg-primary text-primary-foreground",
        "Coordinator Agent": "bg-blue-100 text-blue-900 border-blue-200",
        "Finance Agent": "bg-green-100 text-green-900 border-green-200",
        "Customer Analytics Agent":
          "bg-purple-100 text-purple-900 border-purple-200",
        "Report Generation Agent":
          "bg-orange-100 text-orange-900 border-orange-200",
      };
      return colors[agent as keyof typeof colors] || "bg-muted";
    };

    const getAgentIcon = (agent: string) => {
      const icons = {
        User: "👤",
        "Coordinator Agent": "🎯",
        "Finance Agent": "💰",
        "Customer Analytics Agent": "📊",
        "Report Generation Agent": "📄",
      };
      return icons[agent as keyof typeof icons] || "🤖";
    };

    return (
      <div className="w-[900px] h-[700px] border rounded-lg flex flex-col">
        <div className="p-4 border-b bg-muted/30">
          <h3 className="font-semibold">
            Multi-Agent Business Report Generation
          </h3>
          <div className="text-sm text-muted-foreground mt-1">
            Coordinated task execution across multiple specialized agents
          </div>
        </div>

        <div className="flex-1 p-4 overflow-auto space-y-4">
          {messages.map((message, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{getAgentIcon(message.agent)}</span>
                <span className="font-medium">{message.agent}</span>
                <span>•</span>
                <span>{message.timestamp.toLocaleTimeString()}</span>
              </div>

              <div
                className={`p-3 rounded-lg border ${getAgentColor(
                  message.agent
                )}`}
              >
                <div className="text-sm">{message.content}</div>
              </div>

              {/* Render artifacts */}
              {message.artifacts?.map((artifact) => (
                <div key={artifact.id} className="ml-4">
                  <Artifact
                    artifact={artifact}
                    onDownload={(artifact) =>
                      console.log("Download:", artifact.metadata?.name)
                    }
                    onShare={(artifact) =>
                      console.log("Share:", artifact.metadata?.name)
                    }
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="p-3 border-t">
          <Chat.Input
            placeholder="Ask questions or provide additional requirements..."
            disabled={false}
          />
        </div>
      </div>
    );
  },
};

// Chat with streaming responses
export const StreamingChat: Story = {
  render: () => {
    const [messages, setMessages] = useState([
      {
        role: "user" as const,
        content: "Explain machine learning in simple terms",
        timestamp: new Date(Date.now() - 60000),
      },
    ]);

    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingContent, setStreamingContent] = useState("");

    const fullResponse = `Machine learning is like teaching a computer to recognize patterns and make predictions, similar to how humans learn from experience.

Here's a simple analogy: Imagine you're learning to recognize different dog breeds. At first, you might not know the difference between a Golden Retriever and a Labrador. But as you see more examples of each breed, you start to notice patterns - Golden Retrievers tend to have longer, fluffier coats, while Labradors have shorter, denser fur.

Machine learning works similarly:

1. **Training**: We show the computer thousands of examples (like photos of different dog breeds with labels)

2. **Pattern Recognition**: The computer identifies patterns in the data (coat length, ear shape, size, etc.)

3. **Prediction**: When shown a new photo, the computer uses these learned patterns to make an educated guess about the breed

The key types of machine learning include:
- **Supervised Learning**: Learning with examples and correct answers
- **Unsupervised Learning**: Finding hidden patterns in data without being told what to look for
- **Reinforcement Learning**: Learning through trial and error, like a game

Machine learning is everywhere today - from email spam filters to recommendation systems on Netflix, from voice assistants to autonomous vehicles. It's essentially giving computers the ability to improve their performance on tasks through experience, without being explicitly programmed for every possible scenario.`;

    const simulateStreaming = () => {
      setIsStreaming(true);
      setStreamingContent("");

      let index = 0;
      const interval = setInterval(() => {
        if (index < fullResponse.length) {
          setStreamingContent((prev) => prev + fullResponse[index]);
          index++;
        } else {
          clearInterval(interval);
          setIsStreaming(false);
          setMessages((prev) => [
            ...prev,
            {
              role: "agent" as const,
              content: fullResponse,
              timestamp: new Date(),
            },
          ]);
          setStreamingContent("");
        }
      }, 20);
    };

    React.useEffect(() => {
      const timer = setTimeout(simulateStreaming, 1000);
      return () => clearTimeout(timer);
    }, []);

    return (
      <div className="w-[700px] h-[600px] border rounded-lg flex flex-col">
        <div className="p-4 border-b bg-muted/30">
          <h3 className="font-semibold">Streaming Response Demo</h3>
        </div>

        <div className="flex-1 p-4 overflow-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">
                  {message.content}
                </div>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {/* Streaming message */}
          {isStreaming && (
            <div className="flex justify-start">
              <div className="max-w-[80%] p-3 rounded-lg bg-muted">
                <div className="text-sm whitespace-pre-wrap">
                  {streamingContent}
                  <span className="animate-pulse">|</span>
                </div>
                <div className="text-xs opacity-70 mt-1">Streaming...</div>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t">
          <Chat.Input
            placeholder="Ask another question..."
            disabled={isStreaming}
          />
        </div>
      </div>
    );
  },
};

// Chat with file attachments and artifacts
export const ChatWithFiles: Story = {
  render: () => {
    const [messages, setMessages] = useState([
      {
        role: "user" as const,
        content: "I have uploaded our sales data. Can you analyze it?",
        timestamp: new Date(Date.now() - 300000),
        files: [
          {
            name: "sales_data_q4.csv",
            size: 245760,
            type: "text/csv",
            url: "https://example.com/sales_data_q4.csv",
          },
        ],
      },
      {
        role: "agent" as const,
        content:
          "I have received your sales data file. Let me analyze it and provide insights.",
        timestamp: new Date(Date.now() - 240000),
      },
      {
        role: "agent" as const,
        content:
          "Analysis complete! Here are the key findings from your Q4 sales data:",
        timestamp: new Date(Date.now() - 180000),
        artifacts: [mockDataArtifact],
      },
      {
        role: "agent" as const,
        content:
          "I have also created a Python script that you can use to reproduce this analysis:",
        timestamp: new Date(Date.now() - 120000),
        artifacts: [mockCodeArtifact],
      },
    ]);

    const handleSend = ({ text, files }: { text: string; files?: File[] }) => {
      const newMessage = {
        role: "user" as const,
        content: text,
        timestamp: new Date(),
        files: files?.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
        })),
      };

      setMessages((prev) => [...prev, newMessage]);

      // Simulate agent response
      setTimeout(() => {
        const fileCount = files?.length || 0;
        setMessages((prev) => [
          ...prev,
          {
            role: "agent" as const,
            content:
              fileCount > 0
                ? `I have received ${fileCount} file(s). Let me analyze them for you.`
                : "How else can I help you with your data analysis?",
            timestamp: new Date(),
          },
        ]);
      }, 1000);
    };

    return (
      <div className="w-[800px] h-[600px] border rounded-lg flex flex-col">
        <div className="p-4 border-b bg-muted/30">
          <h3 className="font-semibold">File Analysis Chat</h3>
        </div>

        <div className="flex-1 p-4 overflow-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div className="max-w-[80%] space-y-3">
                <div
                  className={`p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="text-sm">{message.content}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>

                {/* Render file attachments */}
                {message.files?.map((file, fileIndex) => (
                  <div
                    key={fileIndex}
                    className="border rounded-lg p-3 bg-background"
                  >
                    <Chat.File
                      file={file}
                      onDownload={() => console.log("Download:", file.name)}
                      onPreview={() => console.log("Preview:", file.name)}
                    />
                  </div>
                ))}

                {/* Render artifacts */}
                {message.artifacts?.map((artifact) => (
                  <Artifact
                    key={artifact.id}
                    artifact={artifact}
                    onDownload={(artifact) =>
                      console.log("Download:", artifact.metadata?.name)
                    }
                    onShare={(artifact) =>
                      console.log("Share:", artifact.metadata?.name)
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t">
          <Chat.Input
            onSend={handleSend}
            placeholder="Upload files or ask questions..."
            maxFiles={3}
            acceptedFileTypes=".csv,.xlsx,.json,.txt"
          />
        </div>
      </div>
    );
  },
};

// Error handling in chat
export const ChatErrorHandling: Story = {
  render: () => {
    const [messages, setMessages] = useState([
      {
        role: "user" as const,
        content: "Can you analyze this database?",
        timestamp: new Date(Date.now() - 180000),
      },
      {
        role: "agent" as const,
        content:
          "I will try to connect to the database and analyze it for you.",
        timestamp: new Date(Date.now() - 120000),
      },
      {
        role: "system" as const,
        content:
          "❌ Error: Failed to connect to database. Connection timeout after 30 seconds.",
        timestamp: new Date(Date.now() - 60000),
        isError: true,
      },
      {
        role: "agent" as const,
        content:
          "I apologize, but I am unable to connect to the database right now. This could be due to network issues or the database being temporarily unavailable. Would you like me to try again, or is there another way I can help you?",
        timestamp: new Date(Date.now() - 30000),
      },
    ]);

    const handleRetry = () => {
      setMessages((prev) => [
        ...prev,
        {
          role: "user" as const,
          content: "Please try again",
          timestamp: new Date(),
        },
      ]);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "agent" as const,
            content: "Attempting to reconnect to the database...",
            timestamp: new Date(),
          },
        ]);
      }, 1000);
    };

    return (
      <div className="w-[700px] h-[500px] border rounded-lg flex flex-col">
        <div className="p-4 border-b bg-muted/30">
          <h3 className="font-semibold">Error Handling Demo</h3>
        </div>

        <div className="flex-1 p-4 overflow-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user"
                  ? "justify-end"
                  : message.role === "system"
                  ? "justify-center"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : message.role === "system"
                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                    : "bg-muted"
                }`}
              >
                <div className="text-sm">{message.content}</div>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t space-y-2">
          <button
            onClick={handleRetry}
            className="w-full p-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
          >
            Retry Connection
          </button>
          <Chat.Input placeholder="Try a different approach..." />
        </div>
      </div>
    );
  },
};
