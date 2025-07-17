import type { Meta, StoryObj } from '@storybook/react'
import { Artifact, Input, Block, Task, Chat } from '@agentarea/react'
import type { EnhancedArtifact, TaskInputRequest, ProtocolMessage, EnhancedTask } from '@agentarea/core'
import { useState } from 'react'

const meta: Meta = {
  title: 'Testing/Edge Cases',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Edge case testing scenarios including error states, empty data, malformed content, and boundary conditions',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Empty and null data testing
export const EmptyDataHandling: Story = {
  render: () => (
    <div className="w-[800px] space-y-6">
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Empty Data Handling</h3>
        <p className="text-sm text-muted-foreground">
          Testing how components handle empty, null, or undefined data gracefully.
        </p>
      </div>
      
      {/* Empty artifact */}
      <div className="space-y-2">
        <h4 className="font-semibold">Empty Artifact Content</h4>
        <Artifact
          artifact={{
            id: 'empty-artifact',
            taskId: 'task-1',
            displayType: 'text',
            content: '',
            mimeType: 'text/plain',
            size: 0,
            createdAt: new Date(),
            downloadable: false,
            shareable: false,
            metadata: {}
          }}
        />
      </div>
      
      {/* Null content artifact */}
      <div className="space-y-2">
        <h4 className="font-semibold">Null Content Artifact</h4>
        <Artifact
          artifact={{
            id: 'null-artifact',
            taskId: 'task-1',
            displayType: 'data',
            content: null,
            mimeType: 'application/json',
            size: 0,
            createdAt: new Date(),
            downloadable: false,
            shareable: false,
            metadata: { name: 'Null Content Test' }
          }}
        />
      </div>
      
      {/* Empty form fields */}
      <div className="space-y-2">
        <h4 className="font-semibold">Empty Form Configuration</h4>
        <Input.Form
          request={{
            id: 'empty-form',
            taskId: 'task-1',
            type: 'form',
            prompt: 'Form with no fields',
            required: false,
            metadata: {
              fields: []
            }
          }}
        />
      </div>
      
      {/* Empty message */}
      <div className="space-y-2">
        <h4 className="font-semibold">Empty Protocol Message</h4>
        <Block.Message
          message={{
            id: 'empty-msg',
            type: '',
            source: '',
            target: '',
            payload: null,
            timestamp: new Date(),
            metadata: {}
          } as ProtocolMessage}
        />
      </div>
    </div>
  ),
}

// Malformed data testing
export const MalformedDataHandling: Story = {
  render: () => (
    <div className="w-[800px] space-y-6">
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Malformed Data Handling</h3>
        <p className="text-sm text-muted-foreground">
          Testing component resilience with corrupted, malformed, or unexpected data structures.
        </p>
      </div>
      
      {/* Malformed code artifact */}
      <div className="space-y-2">
        <h4 className="font-semibold">Malformed Code Artifact</h4>
        <Artifact
          artifact={{
            id: 'malformed-code',
            taskId: 'task-1',
            displayType: 'code',
            content: {
              // Missing required 'code' property
              language: 'javascript',
              invalidProperty: 'should not be here'
            },
            mimeType: 'text/javascript',
            size: 100,
            createdAt: new Date(),
            downloadable: true,
            shareable: true,
            metadata: { name: 'Malformed Code' }
          }}
        />
      </div>
      
      {/* Invalid JSON data */}
      <div className="space-y-2">
        <h4 className="font-semibold">Invalid JSON Data</h4>
        <Artifact
          artifact={{
            id: 'invalid-json',
            taskId: 'task-1',
            displayType: 'data',
            content: '{ invalid json: missing quotes, trailing comma, }',
            mimeType: 'application/json',
            size: 50,
            createdAt: new Date(),
            downloadable: true,
            shareable: true,
            metadata: { name: 'Invalid JSON' }
          }}
        />
      </div>
      
      {/* Circular reference data */}
      <div className="space-y-2">
        <h4 className="font-semibold">Circular Reference Data</h4>
        <Artifact
          artifact={(() => {
            const obj: any = { id: 'circular', name: 'test' }
            obj.self = obj // Create circular reference
            return {
              id: 'circular-ref',
              taskId: 'task-1',
              displayType: 'data',
              content: obj,
              mimeType: 'application/json',
              size: 100,
              createdAt: new Date(),
              downloadable: true,
              shareable: true,
              metadata: { name: 'Circular Reference' }
            }
          })()}
        />
      </div>
      
      {/* Invalid form field types */}
      <div className="space-y-2">
        <h4 className="font-semibold">Invalid Form Field Types</h4>
        <Input.Form
          request={{
            id: 'invalid-form',
            taskId: 'task-1',
            type: 'form',
            prompt: 'Form with invalid field configurations',
            required: true,
            metadata: {
              fields: [
                {
                  name: 'invalidField',
                  type: 'nonexistent-type' as any,
                  label: 'Invalid Field Type',
                  validation: [
                    { type: 'invalid-rule' as any, message: 'Invalid validation rule' }
                  ]
                },
                {
                  // Missing required properties
                  name: '',
                  type: 'text',
                  label: ''
                } as any
              ]
            }
          }}
        />
      </div>
    </div>
  ),
}

// Boundary value testing
export const BoundaryValues: Story = {
  render: () => {
    // Generate very long content
    const veryLongText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(200)
    const veryLongCode = Array(1000).fill(0).map((_, i) => 
      `// Line ${i + 1}: This is a very long line of code that tests horizontal scrolling and line wrapping behavior in code displays`
    ).join('\n')
    
    // Generate large data structure
    const largeDataStructure = {
      metadata: {
        generatedAt: new Date().toISOString(),
        recordCount: 10000,
        description: 'Large dataset for boundary testing'
      },
      data: Array(1000).fill(0).map((_, i) => ({
        id: i,
        name: `Record ${i}`,
        value: Math.random() * 1000,
        category: `Category ${i % 10}`,
        tags: Array(5).fill(0).map((_, j) => `tag-${i}-${j}`),
        metadata: {
          created: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          updated: new Date().toISOString(),
          version: Math.floor(Math.random() * 10) + 1
        }
      }))
    }
    
    return (
      <div className="w-[800px] space-y-6">
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Boundary Value Testing</h3>
          <p className="text-sm text-muted-foreground">
            Testing components with extreme values: very long content, large datasets, and edge cases.
          </p>
        </div>
        
        {/* Very long text */}
        <div className="space-y-2">
          <h4 className="font-semibold">Very Long Text Content</h4>
          <Artifact
            artifact={{
              id: 'long-text',
              taskId: 'task-1',
              displayType: 'text',
              content: veryLongText,
              mimeType: 'text/plain',
              size: veryLongText.length,
              createdAt: new Date(),
              downloadable: true,
              shareable: true,
              metadata: { 
                name: 'Very Long Text Document',
                wordCount: veryLongText.split(' ').length
              }
            }}
          />
        </div>
        
        {/* Very long code */}
        <div className="space-y-2">
          <h4 className="font-semibold">Very Long Code File</h4>
          <Artifact.Code
            artifact={{
              id: 'long-code',
              taskId: 'task-1',
              displayType: 'code',
              content: {
                code: {
                  language: 'javascript',
                  content: veryLongCode
                }
              },
              mimeType: 'text/javascript',
              size: veryLongCode.length,
              createdAt: new Date(),
              downloadable: true,
              shareable: true,
              metadata: { 
                name: 'Very Long Code File',
                lineCount: veryLongCode.split('\n').length
              }
            }}
            maxHeight={300}
            showLineNumbers={true}
          />
        </div>
        
        {/* Large data structure */}
        <div className="space-y-2">
          <h4 className="font-semibold">Large Data Structure</h4>
          <Artifact.Data
            artifact={{
              id: 'large-data',
              taskId: 'task-1',
              displayType: 'data',
              content: largeDataStructure,
              mimeType: 'application/json',
              size: JSON.stringify(largeDataStructure).length,
              createdAt: new Date(),
              downloadable: true,
              shareable: true,
              metadata: { 
                name: 'Large Dataset',
                recordCount: largeDataStructure.data.length
              }
            }}
          />
        </div>
        
        {/* Very long form */}
        <div className="space-y-2">
          <h4 className="font-semibold">Form with Many Fields</h4>
          <Input.Form
            request={{
              id: 'long-form',
              taskId: 'task-1',
              type: 'form',
              prompt: 'Comprehensive form with many fields',
              required: true,
              metadata: {
                fields: Array(20).fill(0).map((_, i) => ({
                  name: `field${i}`,
                  type: ['text', 'email', 'number', 'textarea', 'select'][i % 5] as any,
                  label: `Field ${i + 1}: ${['Personal Info', 'Contact Details', 'Preferences', 'Settings', 'Additional'][i % 5]}`,
                  placeholder: `Enter your ${['name', 'email', 'age', 'comments', 'choice'][i % 5]}`,
                  validation: i % 3 === 0 ? [{ type: 'required', message: `Field ${i + 1} is required` }] : [],
                  options: i % 5 === 4 ? [
                    { value: 'option1', label: `Option 1 for field ${i + 1}` },
                    { value: 'option2', label: `Option 2 for field ${i + 1}` },
                    { value: 'option3', label: `Option 3 for field ${i + 1}` }
                  ] : undefined
                }))
              }
            }}
            showProgress={true}
          />
        </div>
      </div>
    )
  },
}

// Unicode and special character testing
export const UnicodeAndSpecialCharacters: Story = {
  render: () => (
    <div className="w-[800px] space-y-6">
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Unicode & Special Characters</h3>
        <p className="text-sm text-muted-foreground">
          Testing component handling of various Unicode characters, emojis, and special symbols.
        </p>
      </div>
      
      {/* Unicode text */}
      <div className="space-y-2">
        <h4 className="font-semibold">Multilingual Text</h4>
        <Artifact
          artifact={{
            id: 'unicode-text',
            taskId: 'task-1',
            displayType: 'text',
            content: `English: Hello World!
中文: 你好世界！
العربية: مرحبا بالعالم!
Русский: Привет мир!
日本語: こんにちは世界！
한국어: 안녕하세요 세계!
Français: Bonjour le monde!
Deutsch: Hallo Welt!
Español: ¡Hola mundo!
हिन्दी: नमस्ते दुनिया!
עברית: שלום עולם!
Ελληνικά: Γεια σου κόσμε!`,
            mimeType: 'text/plain',
            size: 200,
            createdAt: new Date(),
            downloadable: true,
            shareable: true,
            metadata: { name: 'Multilingual Greetings' }
          }}
        />
      </div>
      
      {/* Emoji and symbols */}
      <div className="space-y-2">
        <h4 className="font-semibold">Emojis and Symbols</h4>
        <Artifact
          artifact={{
            id: 'emoji-text',
            taskId: 'task-1',
            displayType: 'text',
            content: `🚀 Rocket Launch Analysis 📊
🔥 Performance Metrics:
• CPU Usage: 85% 📈
• Memory: 2.4GB 💾
• Network: 150Mbps 🌐
• Disk I/O: 45MB/s 💿

⚠️ Warnings:
❌ High CPU usage detected
⚡ Power consumption above normal
🔧 Maintenance required

✅ Status: All systems operational
🎯 Target: 99.9% uptime
📅 Next review: Tomorrow
👥 Team: DevOps Engineers`,
            mimeType: 'text/plain',
            size: 300,
            createdAt: new Date(),
            downloadable: true,
            shareable: true,
            metadata: { name: 'System Status with Emojis' }
          }}
        />
      </div>
      
      {/* Special characters in code */}
      <div className="space-y-2">
        <h4 className="font-semibold">Code with Special Characters</h4>
        <Artifact.Code
          artifact={{
            id: 'special-chars-code',
            taskId: 'task-1',
            displayType: 'code',
            content: {
              code: {
                language: 'javascript',
                content: `// Special characters and Unicode in code
const specialChars = {
  // Mathematical symbols
  pi: π = 3.14159,
  infinity: ∞,
  sum: Σ,
  delta: Δ,
  
  // Currency symbols
  prices: {
    usd: '$100.00',
    eur: '€85.50',
    gbp: '£75.25',
    jpy: '¥12000',
    btc: '₿0.0025'
  },
  
  // Arrows and symbols
  arrows: '← ↑ → ↓ ↔ ↕ ⇄ ⇅',
  checkmarks: '✓ ✔ ✗ ✘ ⚠ ⚡ ★ ☆',
  
  // Quotes and punctuation
  quotes: '"Hello" 'World' «Bonjour» ‹Monde›',
  dashes: 'en–dash em—dash',
  ellipsis: '…',
  
  // Regex with special chars
  regex: /[^\w\s]|_/g,
  
  // Template literals with Unicode
  message: \`Welcome 🎉 to our app! 
             Price: \${prices.usd} 💰\`
}

// Function with Unicode parameter names
function calculateΔ(α, β) {
  return Math.abs(α - β)
}`
              }
            },
            mimeType: 'text/javascript',
            size: 800,
            createdAt: new Date(),
            downloadable: true,
            shareable: true,
            metadata: { name: 'Unicode JavaScript Code' }
          }}
        />
      </div>
      
      {/* Form with special characters */}
      <div className="space-y-2">
        <h4 className="font-semibold">Form with Unicode Labels</h4>
        <Input.Form
          request={{
            id: 'unicode-form',
            taskId: 'task-1',
            type: 'form',
            prompt: '🌍 International User Registration',
            required: true,
            metadata: {
              fields: [
                {
                  name: 'name',
                  type: 'text',
                  label: '👤 Full Name (姓名)',
                  placeholder: 'Enter your full name...'
                },
                {
                  name: 'email',
                  type: 'email',
                  label: '📧 Email Address (电子邮件)',
                  placeholder: 'user@example.com'
                },
                {
                  name: 'country',
                  type: 'select',
                  label: '🌎 Country/Region (国家/地区)',
                  options: [
                    { value: 'us', label: '🇺🇸 United States' },
                    { value: 'cn', label: '🇨🇳 China (中国)' },
                    { value: 'jp', label: '🇯🇵 Japan (日本)' },
                    { value: 'de', label: '🇩🇪 Germany (Deutschland)' },
                    { value: 'fr', label: '🇫🇷 France' }
                  ]
                },
                {
                  name: 'bio',
                  type: 'textarea',
                  label: '📝 Bio (个人简介)',
                  placeholder: 'Tell us about yourself... 自我介绍...'
                }
              ]
            }
          }}
        />
      </div>
    </div>
  ),
}

// Error recovery testing
export const ErrorRecovery: Story = {
  render: () => {
    const [simulateError, setSimulateError] = useState(false)
    const [errorCount, setErrorCount] = useState(0)
    
    const triggerError = () => {
      setSimulateError(true)
      setErrorCount(prev => prev + 1)
      setTimeout(() => setSimulateError(false), 3000)
    }
    
    return (
      <div className="w-[800px] space-y-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Error Recovery Testing</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Testing component behavior during errors and recovery scenarios.
          </p>
          <button
            onClick={triggerError}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            Simulate Error (Count: {errorCount})
          </button>
        </div>
        
        {/* Error boundary simulation */}
        <div className="space-y-2">
          <h4 className="font-semibold">Component Error Handling</h4>
          {simulateError ? (
            <div className="p-4 border border-red-300 bg-red-50 rounded">
              <div className="flex items-center space-x-2 text-red-800">
                <span>⚠️</span>
                <span className="font-medium">Component Error</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                A simulated error occurred while rendering this component.
              </p>
              <button
                onClick={() => setSimulateError(false)}
                className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <Artifact
              artifact={{
                id: 'recovery-test',
                taskId: 'task-1',
                displayType: 'text',
                content: 'This component recovered successfully from the error.',
                mimeType: 'text/plain',
                size: 50,
                createdAt: new Date(),
                downloadable: true,
                shareable: true,
                metadata: { name: 'Recovery Test' }
              }}
            />
          )}
        </div>
        
        {/* Network error simulation */}
        <div className="space-y-2">
          <h4 className="font-semibold">Network Error Handling</h4>
          <Block.Status
            status={{
              type: 'connection',
              state: simulateError ? 'error' : 'online',
              message: simulateError 
                ? 'Network connection lost. Attempting to reconnect...'
                : 'Connection stable',
              lastUpdate: new Date(),
              details: simulateError ? {
                errorCode: 'NETWORK_TIMEOUT',
                retryAttempts: 3,
                nextRetry: new Date(Date.now() + 5000).toISOString()
              } : undefined
            }}
            showDetails={simulateError}
          />
        </div>
        
        {/* Form validation error recovery */}
        <div className="space-y-2">
          <h4 className="font-semibold">Form Error Recovery</h4>
          <Input.Form
            request={{
              id: 'error-recovery-form',
              taskId: 'task-1',
              type: 'form',
              prompt: 'Form with Error Recovery',
              required: true,
              metadata: {
                fields: [
                  {
                    name: 'email',
                    type: 'email',
                    label: 'Email Address',
                    placeholder: 'Enter a valid email',
                    validation: [
                      { type: 'required', message: 'Email is required' },
                      { type: 'pattern', value: '^[^@]+@[^@]+\\.[^@]+$', message: 'Please enter a valid email address' }
                    ]
                  }
                ]
              }
            }}
            onSubmit={() => {
              if (simulateError) {
                throw new Error('Simulated submission error')
              }
            }}
          />
        </div>
        
        {/* Instructions */}
        <div className="p-3 bg-muted rounded text-sm">
          <p><strong>Error Recovery Test Instructions:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Click "Simulate Error" to trigger error states</li>
            <li>Observe how components handle and recover from errors</li>
            <li>Check that error messages are clear and actionable</li>
            <li>Verify that retry mechanisms work properly</li>
            <li>Ensure components don't crash the entire application</li>
          </ul>
        </div>
      </div>
    )
  },
}