import type { Meta, StoryObj } from '@storybook/react'
import { Artifact, Input, Block, Task, Chat } from '@agentarea/react'
import type { EnhancedArtifact, TaskInputRequest, ProtocolMessage, EnhancedTask } from '@agentarea/core'
import { useState, useEffect, useMemo, useCallback } from 'react'

const meta: Meta = {
  title: 'Testing/Performance',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Performance testing scenarios with large datasets, rapid updates, and memory usage monitoring',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Performance monitoring hook
const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    componentCount: 0,
    updateCount: 0
  })
  
  const startTime = useMemo(() => performance.now(), [])
  
  useEffect(() => {
    const updateMetrics = () => {
      const renderTime = performance.now() - startTime
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0
      
      setMetrics(prev => ({
        renderTime: Math.round(renderTime * 100) / 100,
        memoryUsage: Math.round(memoryUsage / 1024 / 1024 * 100) / 100, // MB
        componentCount: document.querySelectorAll('[data-testid]').length,
        updateCount: prev.updateCount + 1
      }))
    }
    
    updateMetrics()
    const interval = setInterval(updateMetrics, 1000)
    return () => clearInterval(interval)
  }, [startTime])
  
  return metrics
}

// Large dataset testing
export const LargeDatasetRendering: Story = {
  render: () => {
    const metrics = usePerformanceMonitor()
    
    // Generate large dataset
    const largeDataset = useMemo(() => ({
      metadata: {
        totalRecords: 10000,
        generatedAt: new Date().toISOString(),
        categories: 50,
        avgRecordSize: 256
      },
      records: Array(10000).fill(0).map((_, i) => ({
        id: `record-${i}`,
        name: `Record ${i}`,
        value: Math.random() * 1000,
        category: `Category ${i % 50}`,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        tags: Array(Math.floor(Math.random() * 5) + 1).fill(0).map((_, j) => `tag-${i}-${j}`),
        metadata: {
          priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          status: ['active', 'inactive', 'pending'][Math.floor(Math.random() * 3)],
          score: Math.random(),
          nested: {
            level1: {
              level2: {
                level3: `Deep nested value ${i}`
              }
            }
          }
        }
      })),
      summary: {
        totalValue: 0,
        averageValue: 0,
        maxValue: 0,
        minValue: 0,
        categoryDistribution: {}
      }
    }), [])
    
    // Calculate summary statistics
    const summaryStats = useMemo(() => {
      const values = largeDataset.records.map(r => r.value)
      const categoryDist = largeDataset.records.reduce((acc, r) => {
        acc[r.category] = (acc[r.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      return {
        ...largeDataset.summary,
        totalValue: values.reduce((sum, v) => sum + v, 0),
        averageValue: values.reduce((sum, v) => sum + v, 0) / values.length,
        maxValue: Math.max(...values),
        minValue: Math.min(...values),
        categoryDistribution: categoryDist
      }
    }, [largeDataset])
    
    return (
      <div className="w-[900px] space-y-6">
        {/* Performance metrics */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Large Dataset Performance Test</h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">Render Time</div>
              <div className="text-blue-600">{metrics.renderTime}ms</div>
            </div>
            <div>
              <div className="font-medium">Memory Usage</div>
              <div className="text-blue-600">{metrics.memoryUsage}MB</div>
            </div>
            <div>
              <div className="font-medium">Components</div>
              <div className="text-blue-600">{metrics.componentCount}</div>
            </div>
            <div>
              <div className="font-medium">Updates</div>
              <div className="text-blue-600">{metrics.updateCount}</div>
            </div>
          </div>
        </div>
        
        {/* Large data artifact */}
        <div className="space-y-2">
          <h4 className="font-semibold">Large Dataset Artifact (10,000 records)</h4>
          <Artifact.Data
            artifact={{
              id: 'large-dataset',
              taskId: 'perf-test-1',
              displayType: 'data',
              content: { ...largeDataset, summary: summaryStats },
              mimeType: 'application/json',
              size: JSON.stringify(largeDataset).length,
              createdAt: new Date(),
              downloadable: true,
              shareable: true,
              metadata: {
                name: 'Large Performance Dataset',
                recordCount: largeDataset.records.length,
                sizeBytes: JSON.stringify(largeDataset).length
              }
            }}
          />
        </div>
        
        {/* Performance tips */}
        <div className="p-3 bg-muted rounded text-sm">
          <p><strong>Performance Optimization Notes:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Large datasets are virtualized to maintain performance</li>
            <li>JSON rendering is limited to prevent browser freezing</li>
            <li>Expandable sections help manage memory usage</li>
            <li>Lazy loading is used for nested data structures</li>
          </ul>
        </div>
      </div>
    )
  },
}

// Rapid updates testing
export const RapidUpdatesTest: Story = {
  render: () => {
    const [isRunning, setIsRunning] = useState(false)
    const [updateCount, setUpdateCount] = useState(0)
    const [messages, setMessages] = useState<Array<{
      id: string
      content: string
      timestamp: Date
      type: 'status' | 'data' | 'error'
    }>>([])
    
    const metrics = usePerformanceMonitor()
    
    // Simulate rapid updates
    useEffect(() => {
      if (!isRunning) return
      
      const interval = setInterval(() => {
        const messageTypes = ['status', 'data', 'error'] as const
        const messageType = messageTypes[Math.floor(Math.random() * messageTypes.length)]
        
        const newMessage = {
          id: `msg-${Date.now()}-${Math.random()}`,
          content: `${messageType.toUpperCase()}: Update #${updateCount + 1} - ${new Date().toLocaleTimeString()}`,
          timestamp: new Date(),
          type: messageType
        }
        
        setMessages(prev => [...prev.slice(-19), newMessage]) // Keep last 20 messages
        setUpdateCount(prev => prev + 1)
      }, 100) // 10 updates per second
      
      return () => clearInterval(interval)
    }, [isRunning, updateCount])
    
    const toggleUpdates = useCallback(() => {
      setIsRunning(prev => !prev)
      if (isRunning) {
        setUpdateCount(0)
        setMessages([])
      }
    }, [isRunning])
    
    return (
      <div className="w-[800px] space-y-6">
        {/* Performance metrics */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Rapid Updates Performance Test</h3>
          <div className="grid grid-cols-4 gap-4 text-sm mb-4">
            <div>
              <div className="font-medium">Updates/sec</div>
              <div className="text-green-600">10</div>
            </div>
            <div>
              <div className="font-medium">Total Updates</div>
              <div className="text-green-600">{updateCount}</div>
            </div>
            <div>
              <div className="font-medium">Memory Usage</div>
              <div className="text-green-600">{metrics.memoryUsage}MB</div>
            </div>
            <div>
              <div className="font-medium">Render Time</div>
              <div className="text-green-600">{metrics.renderTime}ms</div>
            </div>
          </div>
          
          <button
            onClick={toggleUpdates}
            className={`px-4 py-2 rounded text-white font-medium ${
              isRunning 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isRunning ? 'Stop Updates' : 'Start Rapid Updates'}
          </button>
        </div>
        
        {/* Real-time message stream */}
        <div className="space-y-2">
          <h4 className="font-semibold">Real-time Message Stream</h4>
          <div className="h-64 border rounded-lg p-4 overflow-auto bg-gray-50">
            {messages.length === 0 ? (
              <p className="text-muted-foreground text-center">
                Click "Start Rapid Updates" to begin the performance test
              </p>
            ) : (
              <div className="space-y-2">
                {messages.map((message) => (
                  <Block.Message
                    key={message.id}
                    message={{
                      id: message.id,
                      type: message.type,
                      source: 'performance-test',
                      target: 'ui',
                      payload: { content: message.content },
                      timestamp: message.timestamp,
                      metadata: { updateCount }
                    } as ProtocolMessage}
                    showMetadata={false}
                    showTimestamp={true}
                    isError={message.type === 'error'}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Performance analysis */}
        <div className="p-3 bg-muted rounded text-sm">
          <p><strong>Performance Test Analysis:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Tests component performance with 10 updates per second</li>
            <li>Monitors memory usage and render times</li>
            <li>Uses message queue with size limit to prevent memory leaks</li>
            <li>Demonstrates real-time UI update capabilities</li>
          </ul>
        </div>
      </div>
    )
  },
}

// Memory usage testing
export const MemoryUsageTest: Story = {
  render: () => {
    const [componentCount, setComponentCount] = useState(10)
    const [memoryHistory, setMemoryHistory] = useState<number[]>([])
    const metrics = usePerformanceMonitor()
    
    // Track memory usage over time
    useEffect(() => {
      const interval = setInterval(() => {
        const memUsage = (performance as any).memory?.usedJSHeapSize || 0
        setMemoryHistory(prev => [...prev.slice(-19), memUsage / 1024 / 1024]) // Keep last 20 measurements
      }, 1000)
      
      return () => clearInterval(interval)
    }, [])
    
    // Generate multiple components for testing
    const testComponents = useMemo(() => {
      return Array(componentCount).fill(0).map((_, i) => ({
        id: `test-component-${i}`,
        artifact: {
          id: `artifact-${i}`,
          taskId: 'memory-test',
          displayType: 'data' as const,
          content: {
            componentIndex: i,
            data: Array(100).fill(0).map((_, j) => ({
              id: j,
              value: Math.random() * 1000,
              timestamp: new Date().toISOString()
            })),
            metadata: {
              created: new Date().toISOString(),
              size: 100,
              type: 'test-data'
            }
          },
          mimeType: 'application/json',
          size: 2048,
          createdAt: new Date(),
          downloadable: true,
          shareable: true,
          metadata: { name: `Test Component ${i}` }
        }
      }))
    }, [componentCount])
    
    const averageMemory = memoryHistory.length > 0 
      ? memoryHistory.reduce((sum, val) => sum + val, 0) / memoryHistory.length 
      : 0
    
    return (
      <div className="w-[900px] space-y-6">
        {/* Memory metrics */}
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Memory Usage Test</h3>
          <div className="grid grid-cols-4 gap-4 text-sm mb-4">
            <div>
              <div className="font-medium">Current Memory</div>
              <div className="text-purple-600">{metrics.memoryUsage}MB</div>
            </div>
            <div>
              <div className="font-medium">Average Memory</div>
              <div className="text-purple-600">{Math.round(averageMemory * 100) / 100}MB</div>
            </div>
            <div>
              <div className="font-medium">Components</div>
              <div className="text-purple-600">{componentCount}</div>
            </div>
            <div>
              <div className="font-medium">Total Elements</div>
              <div className="text-purple-600">{metrics.componentCount}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Component Count:</label>
            <input
              type="range"
              min="1"
              max="100"
              value={componentCount}
              onChange={(e) => setComponentCount(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-mono">{componentCount}</span>
          </div>
        </div>
        
        {/* Memory usage chart */}
        <div className="space-y-2">
          <h4 className="font-semibold">Memory Usage Over Time</h4>
          <div className="h-32 border rounded-lg p-4 bg-gray-50 relative">
            <div className="absolute inset-4 flex items-end space-x-1">
              {memoryHistory.map((usage, index) => {
                const height = Math.max((usage / Math.max(...memoryHistory, 1)) * 100, 2)
                return (
                  <div
                    key={index}
                    className="bg-purple-500 rounded-t"
                    style={{
                      height: `${height}%`,
                      width: `${100 / Math.max(memoryHistory.length, 1)}%`
                    }}
                    title={`${Math.round(usage * 100) / 100}MB`}
                  />
                )
              })}
            </div>
            {memoryHistory.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                Collecting memory usage data...
              </div>
            )}
          </div>
        </div>
        
        {/* Test components */}
        <div className="space-y-2">
          <h4 className="font-semibold">Test Components ({componentCount} instances)</h4>
          <div className="max-h-96 overflow-auto space-y-2">
            {testComponents.slice(0, Math.min(componentCount, 20)).map((component) => (
              <Artifact
                key={component.id}
                artifact={component.artifact}
                onDownload={() => console.log('Download:', component.id)}
                onShare={() => console.log('Share:', component.id)}
              />
            ))}
            {componentCount > 20 && (
              <div className="p-3 bg-muted rounded text-center text-sm">
                ... and {componentCount - 20} more components (hidden for performance)
              </div>
            )}
          </div>
        </div>
        
        {/* Memory optimization tips */}
        <div className="p-3 bg-muted rounded text-sm">
          <p><strong>Memory Optimization Strategies:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Virtual scrolling for large lists</li>
            <li>Component memoization with React.memo</li>
            <li>Lazy loading of heavy components</li>
            <li>Proper cleanup of event listeners and timers</li>
            <li>Efficient data structures and algorithms</li>
          </ul>
        </div>
      </div>
    )
  },
}

// Rendering performance testing
export const RenderingPerformanceTest: Story = {
  render: () => {
    const [testType, setTestType] = useState<'simple' | 'complex' | 'nested'>('simple')
    const [itemCount, setItemCount] = useState(50)
    const [renderTimes, setRenderTimes] = useState<number[]>([])
    
    const metrics = usePerformanceMonitor()
    
    // Measure render performance
    const measureRender = useCallback(() => {
      const startTime = performance.now()
      
      // Force a re-render
      setRenderTimes(prev => {
        const endTime = performance.now()
        const renderTime = endTime - startTime
        return [...prev.slice(-9), renderTime] // Keep last 10 measurements
      })
    }, [])
    
    // Generate test data based on complexity
    const testData = useMemo(() => {
      const baseData = Array(itemCount).fill(0).map((_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random() * 1000
      }))
      
      switch (testType) {
        case 'simple':
          return baseData
        case 'complex':
          return baseData.map(item => ({
            ...item,
            metadata: {
              tags: Array(10).fill(0).map((_, j) => `tag-${j}`),
              properties: Object.fromEntries(
                Array(20).fill(0).map((_, k) => [`prop${k}`, Math.random()])
              )
            }
          }))
        case 'nested':
          return baseData.map(item => ({
            ...item,
            nested: {
              level1: {
                level2: {
                  level3: {
                    level4: {
                      data: Array(50).fill(0).map((_, l) => ({
                        id: l,
                        value: Math.random()
                      }))
                    }
                  }
                }
              }
            }
          }))
        default:
          return baseData
      }
    }, [testType, itemCount])
    
    const averageRenderTime = renderTimes.length > 0
      ? renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length
      : 0
    
    return (
      <div className="w-[900px] space-y-6">
        {/* Performance controls */}
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Rendering Performance Test</h3>
          
          <div className="grid grid-cols-3 gap-4 text-sm mb-4">
            <div>
              <div className="font-medium">Avg Render Time</div>
              <div className="text-orange-600">{Math.round(averageRenderTime * 100) / 100}ms</div>
            </div>
            <div>
              <div className="font-medium">Items Rendered</div>
              <div className="text-orange-600">{itemCount}</div>
            </div>
            <div>
              <div className="font-medium">Complexity</div>
              <div className="text-orange-600 capitalize">{testType}</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium">Test Type:</label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value as any)}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value="simple">Simple Objects</option>
                <option value="complex">Complex Objects</option>
                <option value="nested">Deeply Nested</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium">Item Count:</label>
              <input
                type="range"
                min="10"
                max="200"
                value={itemCount}
                onChange={(e) => setItemCount(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-mono w-12">{itemCount}</span>
            </div>
            
            <button
              onClick={measureRender}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Measure Render Performance
            </button>
          </div>
        </div>
        
        {/* Render time history */}
        <div className="space-y-2">
          <h4 className="font-semibold">Render Time History</h4>
          <div className="h-24 border rounded-lg p-4 bg-gray-50 relative">
            <div className="absolute inset-4 flex items-end space-x-1">
              {renderTimes.map((time, index) => {
                const height = Math.max((time / Math.max(...renderTimes, 1)) * 100, 2)
                return (
                  <div
                    key={index}
                    className="bg-orange-500 rounded-t"
                    style={{
                      height: `${height}%`,
                      width: `${100 / Math.max(renderTimes.length, 1)}%`
                    }}
                    title={`${Math.round(time * 100) / 100}ms`}
                  />
                )
              })}
            </div>
            {renderTimes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                Click "Measure Render Performance" to start testing
              </div>
            )}
          </div>
        </div>
        
        {/* Test artifact */}
        <div className="space-y-2">
          <h4 className="font-semibold">Performance Test Artifact</h4>
          <Artifact.Data
            artifact={{
              id: 'perf-test-artifact',
              taskId: 'render-perf-test',
              displayType: 'data',
              content: {
                testConfiguration: {
                  type: testType,
                  itemCount,
                  complexity: testType === 'simple' ? 'low' : testType === 'complex' ? 'medium' : 'high'
                },
                performanceMetrics: {
                  averageRenderTime: Math.round(averageRenderTime * 100) / 100,
                  renderHistory: renderTimes,
                  memoryUsage: metrics.memoryUsage
                },
                testData: testData.slice(0, 5) // Show only first 5 items for preview
              },
              mimeType: 'application/json',
              size: JSON.stringify(testData).length,
              createdAt: new Date(),
              downloadable: true,
              shareable: true,
              metadata: {
                name: 'Rendering Performance Test Results',
                testType,
                itemCount,
                dataSize: JSON.stringify(testData).length
              }
            }}
          />
        </div>
        
        {/* Performance guidelines */}
        <div className="p-3 bg-muted rounded text-sm">
          <p><strong>Rendering Performance Guidelines:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Target render times under 16ms for 60fps</li>
            <li>Use React.memo for expensive components</li>
            <li>Implement virtual scrolling for large lists</li>
            <li>Avoid deep object nesting in render paths</li>
            <li>Profile with React DevTools for optimization</li>
          </ul>
        </div>
      </div>
    )
  },
}