import type { Meta, StoryObj } from '@storybook/react'
import React, { useState } from 'react'
import { Chat } from '@agentarea/react'

const meta: Meta<typeof Chat.Root> = {
  title: 'Components/Chat',
  component: Chat.Root,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Advanced chat UI components with streaming, markdown, file attachments, and tool calls',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Basic chat message
export const BasicMessage: Story = {
  render: () => (
    <div style={{ width: '400px', fontFamily: 'system-ui' }}>
      <Chat.Message role="user" timestamp={new Date()} avatar="👤">
        Hello! Can you help me analyze this data?
      </Chat.Message>
      
      <Chat.Message role="agent" timestamp={new Date()} avatar="🤖">
        Of course! I'd be happy to help you analyze your data. Could you please share the dataset you'd like me to examine?
      </Chat.Message>
    </div>
  ),
}

// Markdown message
export const MarkdownMessage: Story = {
  render: () => (
    <div style={{ width: '500px', fontFamily: 'system-ui' }}>
      <Chat.Message role="agent" timestamp={new Date()} avatar="🤖">
        <Chat.Markdown content={`Here's the analysis results:

**Key Findings:**
- *Revenue increased* by **23%** this quarter
- Customer satisfaction improved significantly
- \`conversion_rate\` is now at 4.2%

\`\`\`python
def calculate_growth(current, previous):
    return ((current - previous) / previous) * 100

growth = calculate_growth(123000, 100000)
print(f"Growth: {growth}%")
\`\`\`

Let me know if you need more details!`} />
      </Chat.Message>
    </div>
  ),
}

// File attachment
export const FileAttachment: Story = {
  render: () => (
    <div style={{ width: '400px', fontFamily: 'system-ui' }}>
      <Chat.Message role="user" timestamp={new Date()} avatar="👤">
        Here's the dataset you requested:
        <Chat.File
          file={{
            name: 'sales_data_q4.csv',
            size: 245760,
            type: 'text/csv',
            url: 'https://example.com/sales_data_q4.csv'
          }}
          onDownload={() => alert('Downloading file...')}
          onPreview={() => alert('Opening preview...')}
        />
      </Chat.Message>
    </div>
  ),
}

// Tool call with approval
export const ToolCallApproval: Story = {
  render: () => {
    const [toolCall, setToolCall] = useState({
      id: 'tool_123',
      name: 'execute_sql_query',
      parameters: {
        query: 'SELECT * FROM sales WHERE date >= "2024-01-01"',
        database: 'production'
      },
      status: 'pending' as const
    })

    const handleApprove = (id: string) => {
      setToolCall(prev => ({ ...prev, status: 'approved' as const }))
    }

    const handleReject = (id: string) => {
      setToolCall(prev => ({ ...prev, status: 'rejected' as const }))
    }

    return (
      <div style={{ width: '500px', fontFamily: 'system-ui' }}>
        <Chat.Message role="agent" timestamp={new Date()} avatar="🤖">
          I need to run a SQL query to fetch the sales data. Please review and approve:
          <Chat.ToolCall
            toolCall={toolCall}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </Chat.Message>
      </div>
    )
  },
}

// Chat input with file upload
export const ChatInputExample: Story = {
  render: () => {
    const [messages, setMessages] = useState<string[]>([])

    const handleSend = ({ text, files }: { text: string; files?: File[] }) => {
      const message = text + (files?.length ? ` (with ${files.length} files)` : '')
      setMessages(prev => [...prev, message])
    }

    return (
      <div style={{ width: '500px', fontFamily: 'system-ui' }}>
        <div style={{ marginBottom: '16px', maxHeight: '200px', overflowY: 'auto' }}>
          {messages.map((msg, i) => (
            <div key={i} className="p-2 mb-1 bg-muted rounded">
              {msg}
            </div>
          ))}
        </div>
        
        <Chat.Input
          onSend={handleSend}
          placeholder="Type a message and attach files..."
          maxFiles={3}
          acceptedFileTypes="image/*,text/*,.pdf"
        />
      </div>
    )
  },
}

// Complete chat interface
export const CompleteChatInterface: Story = {
  render: () => {
    const [messages, setMessages] = useState([
      {
        role: 'agent' as const,
        content: 'Hello! I\'m your AI assistant. How can I help you today?',
        timestamp: new Date(Date.now() - 60000)
      },
      {
        role: 'user' as const,
        content: 'I need help analyzing my sales data',
        timestamp: new Date(Date.now() - 30000)
      },
      {
        role: 'agent' as const,
        content: 'I\'d be happy to help! Please upload your sales data file and I\'ll analyze it for you.',
        timestamp: new Date(Date.now() - 15000)
      }
    ])
    const [isAgentTyping, setIsAgentTyping] = useState(false)

    const handleSend = ({ text, files }: { text: string; files?: File[] }) => {
      // Add user message
      setMessages(prev => [...prev, {
        role: 'user' as const,
        content: text + (files?.length ? ` [${files.length} files attached]` : ''),
        timestamp: new Date()
      }])

      // Simulate agent response
      setIsAgentTyping(true)
      setTimeout(() => {
        setIsAgentTyping(false)
        setMessages(prev => [...prev, {
          role: 'agent' as const,
          content: 'Thank you for sharing that information. Let me process this and get back to you with insights.',
          timestamp: new Date()
        }])
      }, 2000)
    }

    return (
      <div className="w-[600px] h-[500px] border border-border rounded-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-muted">
          <h3 className="text-lg font-semibold">AI Assistant Chat</h3>
        </div>
        
        <Chat.Root className="flex-1 p-0" maxHeight="none">
          {messages.map((message, index) => (
            <Chat.Message
              key={index}
              role={message.role}
              timestamp={message.timestamp}
              avatar={message.role === 'agent' ? '🤖' : '👤'}
            >
              <Chat.Markdown content={message.content} />
            </Chat.Message>
          ))}
          
          {isAgentTyping && (
            <Chat.Typing isTyping={true} avatar="🤖" />
          )}
        </Chat.Root>
        
        <div className="p-3 border-t bg-background">
          <Chat.Input
            onSend={handleSend}
            placeholder="Ask me anything..."
            maxFiles={5}
            acceptedFileTypes="*"
          />
        </div>
      </div>
    )
  },
}