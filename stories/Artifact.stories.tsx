import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Artifact } from '@agentarea/react'

// Mock type for Storybook
interface EnhancedArtifact {
  id: string
  taskId: string
  displayType: 'text' | 'code' | 'data' | 'file' | 'image'
  content: any
  mimeType: string
  size: number
  createdAt: Date
  downloadable: boolean
  shareable: boolean
  metadata: Record<string, any>
}

const meta: Meta<typeof Artifact> = {
  title: 'Components/Artifact',
  component: Artifact,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Artifact display components for showing task outputs and results with different content types',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onDownload: { action: 'download' },
    onShare: { action: 'share' },
    onPreview: { action: 'preview' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Mock artifacts for stories
const mockTextArtifact: EnhancedArtifact = {
  id: 'artifact-text-1',
  taskId: 'task-1',
  displayType: 'text',
  content: 'This is a sample text artifact containing analysis results and insights from the data processing task.',
  mimeType: 'text/plain',
  size: 156,
  createdAt: new Date('2024-01-15T10:30:00Z'),
  downloadable: true,
  shareable: true,
  metadata: {
    name: 'Analysis Summary',
    author: 'Data Analysis Agent',
    version: '1.0'
  }
}

const mockCodeArtifact: EnhancedArtifact = {
  id: 'artifact-code-1',
  taskId: 'task-1',
  displayType: 'code',
  content: {
    code: {
      language: 'python',
      content: `import pandas as pd
import matplotlib.pyplot as plt

def analyze_sales_data(df):
    """Analyze sales data and generate insights."""
    
    # Calculate monthly totals
    monthly_sales = df.groupby('month')['sales'].sum()
    
    # Find top performing products
    top_products = df.groupby('product')['sales'].sum().sort_values(ascending=False).head(5)
    
    # Generate visualization
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
    
    # Monthly sales trend
    monthly_sales.plot(kind='line', ax=ax1, marker='o')
    ax1.set_title('Monthly Sales Trend')
    ax1.set_xlabel('Month')
    ax1.set_ylabel('Sales ($)')
    
    # Top products bar chart
    top_products.plot(kind='bar', ax=ax2)
    ax2.set_title('Top 5 Products by Sales')
    ax2.set_xlabel('Product')
    ax2.set_ylabel('Sales ($)')
    ax2.tick_params(axis='x', rotation=45)
    
    plt.tight_layout()
    return fig, monthly_sales, top_products

# Example usage
if __name__ == "__main__":
    # Load data
    df = pd.read_csv('sales_data.csv')
    
    # Perform analysis
    chart, monthly, products = analyze_sales_data(df)
    
    # Save results
    chart.savefig('sales_analysis.png', dpi=300, bbox_inches='tight')
    print("Analysis complete!")
`
    }
  },
  mimeType: 'text/x-python',
  size: 1247,
  createdAt: new Date('2024-01-15T10:35:00Z'),
  downloadable: true,
  shareable: true,
  metadata: {
    name: 'Sales Analysis Script',
    language: 'python',
    author: 'Code Generation Agent'
  }
}

const mockFileArtifact: EnhancedArtifact = {
  id: 'artifact-file-1',
  taskId: 'task-1',
  displayType: 'file',
  content: 'https://example.com/reports/sales_report_q4_2024.pdf',
  mimeType: 'application/pdf',
  size: 2048576, // 2MB
  createdAt: new Date('2024-01-15T10:40:00Z'),
  downloadable: true,
  shareable: true,
  metadata: {
    name: 'Q4 2024 Sales Report',
    pages: 24,
    author: 'Report Generation Agent',
    category: 'financial'
  }
}

const mockDataArtifact: EnhancedArtifact = {
  id: 'artifact-data-1',
  taskId: 'task-1',
  displayType: 'data',
  content: {
    summary: {
      totalSales: 1250000,
      totalOrders: 3420,
      averageOrderValue: 365.50,
      topProduct: 'Premium Widget',
      growthRate: 0.23
    },
    monthlyBreakdown: [
      { month: 'October', sales: 420000, orders: 1150 },
      { month: 'November', sales: 380000, orders: 1040 },
      { month: 'December', sales: 450000, orders: 1230 }
    ],
    topProducts: [
      { name: 'Premium Widget', sales: 280000, units: 560 },
      { name: 'Standard Widget', sales: 220000, units: 880 },
      { name: 'Deluxe Widget', sales: 180000, units: 300 }
    ]
  },
  mimeType: 'application/json',
  size: 512,
  createdAt: new Date('2024-01-15T10:45:00Z'),
  downloadable: true,
  shareable: true,
  metadata: {
    name: 'Sales Data Analysis',
    format: 'json',
    schema: 'sales-summary-v1'
  }
}

const mockImageArtifact: EnhancedArtifact = {
  id: 'artifact-image-1',
  taskId: 'task-1',
  displayType: 'image',
  content: {
    image: {
      url: 'https://via.placeholder.com/600x400/4f46e5/ffffff?text=Sales+Chart',
      alt: 'Q4 2024 Sales Performance Chart',
      width: 600,
      height: 400
    }
  },
  mimeType: 'image/png',
  size: 89432,
  createdAt: new Date('2024-01-15T10:50:00Z'),
  downloadable: true,
  shareable: true,
  metadata: {
    name: 'Sales Performance Chart',
    dimensions: '600x400',
    format: 'PNG',
    dpi: 300
  }
}

// Basic artifact stories
export const TextArtifact: Story = {
  args: {
    artifact: mockTextArtifact,
  },
}

export const CodeArtifact: Story = {
  args: {
    artifact: mockCodeArtifact,
  },
}

export const FileArtifact: Story = {
  args: {
    artifact: mockFileArtifact,
  },
}

export const DataArtifact: Story = {
  args: {
    artifact: mockDataArtifact,
  },
}

export const ImageArtifact: Story = {
  args: {
    artifact: mockImageArtifact,
  },
}

// Container component stories
export const ArtifactContainer: Story = {
  render: () => (
    <div className="w-[600px] space-y-4">
      <Artifact.Container
        artifact={mockTextArtifact}
        collapsible={true}
        showMetadata={true}
        showTimestamp={true}
        onDownload={(artifact) => console.log('Download:', artifact.metadata?.name)}
        onShare={(artifact) => console.log('Share:', artifact.metadata?.name)}
      >
        <div className="p-4 bg-muted/30 rounded">
          <p className="text-sm">Custom content inside the artifact container.</p>
        </div>
      </Artifact.Container>
      
      <Artifact.Container
        artifact={mockCodeArtifact}
        collapsible={true}
        defaultExpanded={false}
        showMetadata={false}
        actions={
          <button className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded">
            Custom Action
          </button>
        }
      >
        <div className="text-sm font-mono bg-background p-2 rounded border">
          print("Hello, World!")
        </div>
      </Artifact.Container>
    </div>
  ),
}

// Specialized component stories
export const CodeWithSyntaxHighlighting: Story = {
  render: () => (
    <div className="w-[700px]">
      <Artifact.Code
        artifact={{
          ...mockCodeArtifact,
          content: {
            code: {
              language: 'typescript',
              content: `interface User {
  id: string
  name: string
  email: string
  createdAt: Date
}

class UserService {
  private users: Map<string, User> = new Map()
  
  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const user: User = {
      id: crypto.randomUUID(),
      ...userData,
      createdAt: new Date()
    }
    
    this.users.set(user.id, user)
    return user
  }
  
  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null
  }
  
  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id)
    if (!user) return null
    
    const updatedUser = { ...user, ...updates }
    this.users.set(id, updatedUser)
    return updatedUser
  }
}`
            }
          }
        }}
        showLineNumbers={true}
        maxHeight={400}
        theme="auto"
      />
    </div>
  ),
}

export const DataVisualization: Story = {
  render: () => (
    <div className="w-[600px]">
      <Artifact.Data
        artifact={{
          ...mockDataArtifact,
          content: {
            analytics: {
              pageViews: 125430,
              uniqueVisitors: 8920,
              bounceRate: 0.34,
              avgSessionDuration: 245,
              conversionRate: 0.067
            },
            topPages: [
              { path: '/products', views: 23450, conversions: 156 },
              { path: '/about', views: 18920, conversions: 89 },
              { path: '/contact', views: 12340, conversions: 234 },
              { path: '/blog', views: 9870, conversions: 45 }
            ],
            trafficSources: {
              organic: 0.45,
              direct: 0.28,
              social: 0.15,
              referral: 0.08,
              paid: 0.04
            },
            deviceBreakdown: {
              desktop: 0.52,
              mobile: 0.41,
              tablet: 0.07
            }
          }
        }}
      />
    </div>
  ),
}

// Interactive stories
export const InteractiveArtifacts: Story = {
  render: () => {
    const handleDownload = (artifact: EnhancedArtifact) => {
      alert(`Downloading: ${artifact.metadata?.name}`)
    }
    
    const handleShare = (artifact: EnhancedArtifact) => {
      alert(`Sharing: ${artifact.metadata?.name}`)
    }
    
    const handlePreview = (artifact: EnhancedArtifact) => {
      alert(`Previewing: ${artifact.metadata?.name}`)
    }
    
    return (
      <div className="w-[700px] space-y-6">
        <Artifact
          artifact={mockTextArtifact}
          onDownload={handleDownload}
          onShare={handleShare}
        />
        
        <Artifact
          artifact={mockCodeArtifact}
          onDownload={handleDownload}
          onShare={handleShare}
        />
        
        <Artifact
          artifact={mockFileArtifact}
          onDownload={handleDownload}
          onShare={handleShare}
          onPreview={handlePreview}
        />
      </div>
    )
  },
}

// Error states
export const ErrorStates: Story = {
  render: () => (
    <div className="w-[600px] space-y-4">
      <Artifact
        artifact={{
          ...mockTextArtifact,
          content: null,
          metadata: { ...mockTextArtifact.metadata, name: 'Failed Artifact' }
        }}
      />
      
      <Artifact
        artifact={{
          ...mockCodeArtifact,
          content: { code: { language: 'unknown', content: '' } },
          metadata: { ...mockCodeArtifact.metadata, name: 'Empty Code Artifact' }
        }}
      />
    </div>
  ),
}

// Large content handling
export const LargeContent: Story = {
  render: () => (
    <div className="w-[700px]">
      <Artifact.Code
        artifact={{
          ...mockCodeArtifact,
          content: {
            code: {
              language: 'javascript',
              content: Array(50).fill(0).map((_, i) => 
                `// Line ${i + 1}: This is a long line of code that demonstrates scrolling behavior
function processData${i}(data) {
  return data.map(item => ({ ...item, processed: true, timestamp: Date.now() }))
}`
              ).join('\n')
            }
          }
        }}
        maxHeight={300}
        showLineNumbers={true}
      />
    </div>
  ),
}