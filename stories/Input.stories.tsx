import type { Meta, StoryObj } from '@storybook/react'
import { Input } from '@agentarea/react'
import type { TaskInputRequest, FormField, InputOption } from '@agentarea/core'
import { useState } from 'react'

const meta: Meta<typeof Input.Form> = {
  title: 'Components/Input',
  component: Input.Form,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Input collection components for handling task feedback and user interactions',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onSubmit: { action: 'submit' },
    onCancel: { action: 'cancel' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Mock input requests for stories
const mockTextInputRequest: TaskInputRequest = {
  id: 'input-text-1',
  taskId: 'task-1',
  type: 'text',
  prompt: 'Please provide additional context for the analysis',
  required: true,
  validation: [
    { type: 'required', message: 'This field is required' },
    { type: 'minLength', value: 10, message: 'Please provide at least 10 characters' }
  ],
  metadata: {
    placeholder: 'Enter your analysis context here...',
    maxLength: 500
  }
}

const mockFormInputRequest: TaskInputRequest = {
  id: 'input-form-1',
  taskId: 'task-1',
  type: 'form',
  prompt: 'Configure Analysis Parameters',
  required: true,
  metadata: {
    fields: [
      {
        name: 'analysisType',
        type: 'select',
        label: 'Analysis Type',
        validation: [{ type: 'required', message: 'Please select an analysis type' }],
        options: [
          { value: 'descriptive', label: 'Descriptive Analysis' },
          { value: 'predictive', label: 'Predictive Analysis' },
          { value: 'prescriptive', label: 'Prescriptive Analysis' }
        ]
      },
      {
        name: 'timeRange',
        type: 'select',
        label: 'Time Range',
        validation: [{ type: 'required', message: 'Please select a time range' }],
        options: [
          { value: '7d', label: 'Last 7 days' },
          { value: '30d', label: 'Last 30 days' },
          { value: '90d', label: 'Last 90 days' },
          { value: 'custom', label: 'Custom range' }
        ]
      },
      {
        name: 'includeWeekends',
        type: 'checkbox',
        label: 'Include weekends in analysis'
      },
      {
        name: 'confidenceLevel',
        type: 'number',
        label: 'Confidence Level (%)',
        placeholder: '95',
        validation: [
          { type: 'required', message: 'Confidence level is required' },
          { type: 'pattern', value: '^([1-9][0-9]?|100)$', message: 'Must be between 1-100' }
        ]
      },
      {
        name: 'notes',
        type: 'textarea',
        label: 'Additional Notes',
        placeholder: 'Any specific requirements or considerations...'
      }
    ] as FormField[]
  }
}

const mockApprovalRequest: TaskInputRequest = {
  id: 'input-approval-1',
  taskId: 'task-1',
  type: 'approval',
  prompt: 'Database Query Approval Required',
  required: true,
  metadata: {
    title: 'Execute SQL Query',
    description: 'The agent wants to execute a SQL query on the production database to gather sales data.',
    context: {
      query: 'SELECT customer_id, SUM(order_total) as total_spent FROM orders WHERE order_date >= "2024-01-01" GROUP BY customer_id ORDER BY total_spent DESC LIMIT 100',
      database: 'production_sales',
      estimatedRows: 100,
      estimatedExecutionTime: '2-3 seconds'
    },
    details: {
      impact: 'Read-only query with minimal performance impact',
      dataAccess: 'Customer spending data for top 100 customers',
      purpose: 'Generate customer segmentation analysis'
    }
  }
}

const mockSelectionRequest: TaskInputRequest = {
  id: 'input-selection-1',
  taskId: 'task-1',
  type: 'selection',
  prompt: 'Select data sources for analysis',
  required: true,
  metadata: {
    multiSelect: true,
    searchable: true,
    options: [
      { 
        value: 'sales_db', 
        label: 'Sales Database',
        description: 'Primary sales transaction data',
        metadata: { lastUpdated: '2024-01-15', recordCount: 125000 }
      },
      { 
        value: 'customer_db', 
        label: 'Customer Database',
        description: 'Customer profiles and demographics',
        metadata: { lastUpdated: '2024-01-14', recordCount: 45000 }
      },
      { 
        value: 'inventory_db', 
        label: 'Inventory Database',
        description: 'Product inventory and pricing',
        metadata: { lastUpdated: '2024-01-15', recordCount: 8500 }
      },
      { 
        value: 'marketing_db', 
        label: 'Marketing Database',
        description: 'Campaign data and customer interactions',
        metadata: { lastUpdated: '2024-01-13', recordCount: 67000 }
      },
      { 
        value: 'support_db', 
        label: 'Support Database',
        description: 'Customer support tickets and resolutions',
        metadata: { lastUpdated: '2024-01-15', recordCount: 23000 }
      }
    ] as InputOption[]
  }
}

const mockUploadRequest: TaskInputRequest = {
  id: 'input-upload-1',
  taskId: 'task-1',
  type: 'file',
  prompt: 'Upload data files for analysis',
  required: true,
  metadata: {
    acceptedTypes: ['.csv', '.xlsx', '.json', '.txt'],
    maxFileSize: 10485760, // 10MB
    maxFiles: 3,
    description: 'Upload your data files in CSV, Excel, JSON, or text format'
  }
}

// Basic input stories
export const TextInput: Story = {
  args: {
    request: mockTextInputRequest,
  },
}

export const FormInput: Story = {
  args: {
    request: mockFormInputRequest,
    showProgress: true,
  },
}

export const ApprovalInput: Story = {
  args: {
    request: mockApprovalRequest,
    showReasonField: true,
    requireReasonForRejection: true,
  },
}

// Individual component stories
export const InputField: Story = {
  render: () => {
    const [value, setValue] = useState('')
    
    return (
      <div className="w-[400px] space-y-4">
        <Input.Field
          label="Project Name"
          value={value}
          onChange={setValue}
          placeholder="Enter project name..."
          required={true}
          type="text"
        />
        
        <Input.Field
          label="Description"
          value={value}
          onChange={setValue}
          placeholder="Describe your project..."
          type="textarea"
          rows={4}
        />
        
        <Input.Field
          label="Priority Level"
          value={value}
          onChange={setValue}
          type="select"
          options={[
            { value: 'low', label: 'Low Priority' },
            { value: 'medium', label: 'Medium Priority' },
            { value: 'high', label: 'High Priority' },
            { value: 'urgent', label: 'Urgent' }
          ]}
        />
      </div>
    )
  },
}

export const InputApproval: Story = {
  render: () => (
    <div className="w-[600px]">
      <Input.Approval
        request={mockApprovalRequest}
        showReasonField={true}
        requireReasonForRejection={true}
        onSubmit={(response) => console.log('Approval response:', response)}
      />
    </div>
  ),
}

export const InputSelection: Story = {
  render: () => (
    <div className="w-[500px]">
      <Input.Selection
        request={mockSelectionRequest}
        onSubmit={(response) => console.log('Selection response:', response)}
      />
    </div>
  ),
}

export const InputUpload: Story = {
  render: () => (
    <div className="w-[500px]">
      <Input.Upload
        request={mockUploadRequest}
        onSubmit={(response) => console.log('Upload response:', response)}
      />
    </div>
  ),
}

// Complex form with validation
export const ComplexFormWithValidation: Story = {
  render: () => {
    const complexFormRequest: TaskInputRequest = {
      id: 'complex-form-1',
      taskId: 'task-1',
      type: 'form',
      prompt: 'User Registration Form',
      required: true,
      metadata: {
        fields: [
          {
            name: 'firstName',
            type: 'text',
            label: 'First Name',
            placeholder: 'John',
            validation: [
              { type: 'required', message: 'First name is required' },
              { type: 'minLength', value: 2, message: 'Must be at least 2 characters' }
            ]
          },
          {
            name: 'lastName',
            type: 'text',
            label: 'Last Name',
            placeholder: 'Doe',
            validation: [
              { type: 'required', message: 'Last name is required' },
              { type: 'minLength', value: 2, message: 'Must be at least 2 characters' }
            ]
          },
          {
            name: 'email',
            type: 'email',
            label: 'Email Address',
            placeholder: 'john.doe@example.com',
            validation: [
              { type: 'required', message: 'Email is required' },
              { type: 'pattern', value: '^[^@]+@[^@]+\\.[^@]+$', message: 'Please enter a valid email' }
            ]
          },
          {
            name: 'phone',
            type: 'text',
            label: 'Phone Number',
            placeholder: '+1 (555) 123-4567',
            validation: [
              { type: 'pattern', value: '^\\+?[1-9]\\d{1,14}$', message: 'Please enter a valid phone number' }
            ]
          },
          {
            name: 'role',
            type: 'select',
            label: 'Role',
            validation: [{ type: 'required', message: 'Please select a role' }],
            options: [
              { value: 'admin', label: 'Administrator' },
              { value: 'user', label: 'Standard User' },
              { value: 'viewer', label: 'Viewer Only' }
            ]
          },
          {
            name: 'notifications',
            type: 'checkbox',
            label: 'Enable email notifications'
          },
          {
            name: 'bio',
            type: 'textarea',
            label: 'Bio (Optional)',
            placeholder: 'Tell us about yourself...'
          }
        ] as FormField[]
      }
    }
    
    return (
      <div className="w-[600px]">
        <Input.Form
          request={complexFormRequest}
          showProgress={true}
          onSubmit={(response) => console.log('Form submitted:', response)}
          onCancel={() => console.log('Form cancelled')}
        />
      </div>
    )
  },
}

// Multi-step form
export const MultiStepForm: Story = {
  render: () => {
    const multiStepRequest: TaskInputRequest = {
      id: 'multistep-form-1',
      taskId: 'task-1',
      type: 'form',
      prompt: 'Project Setup Wizard',
      required: true,
      metadata: {
        fields: [
          // Step 1: Basic Info
          {
            name: 'projectName',
            type: 'text',
            label: 'Project Name',
            validation: [{ type: 'required', message: 'Project name is required' }]
          },
          {
            name: 'projectType',
            type: 'select',
            label: 'Project Type',
            validation: [{ type: 'required', message: 'Please select a project type' }],
            options: [
              { value: 'web', label: 'Web Application' },
              { value: 'mobile', label: 'Mobile Application' },
              { value: 'desktop', label: 'Desktop Application' },
              { value: 'api', label: 'API Service' }
            ]
          },
          {
            name: 'description',
            type: 'textarea',
            label: 'Project Description',
            validation: [{ type: 'required', message: 'Description is required' }]
          },
          
          // Step 2: Technical Details
          {
            name: 'framework',
            type: 'select',
            label: 'Framework',
            validation: [{ type: 'required', message: 'Please select a framework' }],
            options: [
              { value: 'react', label: 'React' },
              { value: 'vue', label: 'Vue.js' },
              { value: 'angular', label: 'Angular' },
              { value: 'svelte', label: 'Svelte' }
            ]
          },
          {
            name: 'database',
            type: 'select',
            label: 'Database',
            options: [
              { value: 'postgresql', label: 'PostgreSQL' },
              { value: 'mysql', label: 'MySQL' },
              { value: 'mongodb', label: 'MongoDB' },
              { value: 'sqlite', label: 'SQLite' }
            ]
          },
          {
            name: 'features',
            type: 'textarea',
            label: 'Key Features',
            placeholder: 'List the main features you want to implement...'
          },
          
          // Step 3: Deployment
          {
            name: 'hosting',
            type: 'select',
            label: 'Hosting Platform',
            options: [
              { value: 'vercel', label: 'Vercel' },
              { value: 'netlify', label: 'Netlify' },
              { value: 'aws', label: 'AWS' },
              { value: 'heroku', label: 'Heroku' }
            ]
          },
          {
            name: 'domain',
            type: 'text',
            label: 'Custom Domain (Optional)',
            placeholder: 'example.com'
          },
          {
            name: 'ssl',
            type: 'checkbox',
            label: 'Enable SSL Certificate'
          }
        ] as FormField[]
      }
    }
    
    return (
      <div className="w-[700px]">
        <Input.Form
          request={multiStepRequest}
          showProgress={true}
          onSubmit={(response) => console.log('Multi-step form submitted:', response)}
        />
      </div>
    )
  },
}

// Approval with complex context
export const ComplexApproval: Story = {
  render: () => {
    const complexApprovalRequest: TaskInputRequest = {
      id: 'complex-approval-1',
      taskId: 'task-1',
      type: 'approval',
      prompt: 'API Integration Approval',
      required: true,
      metadata: {
        title: 'Third-Party API Integration',
        description: 'The agent wants to integrate with the Stripe payment API to process customer payments.',
        context: {
          apiProvider: 'Stripe',
          endpoints: [
            'POST /v1/payment_intents',
            'GET /v1/payment_intents/{id}',
            'POST /v1/payment_intents/{id}/confirm'
          ],
          dataShared: ['customer email', 'payment amount', 'currency'],
          permissions: ['read payment data', 'create payment intents', 'confirm payments'],
          estimatedCost: '$0.029 per transaction + 2.9%'
        },
        details: {
          securityMeasures: 'All data encrypted in transit and at rest',
          compliance: 'PCI DSS Level 1 compliant',
          dataRetention: 'Payment data stored for 7 years as required by law',
          monitoring: 'Real-time fraud detection and monitoring enabled'
        }
      }
    }
    
    return (
      <div className="w-[700px]">
        <Input.Approval
          request={complexApprovalRequest}
          showReasonField={true}
          requireReasonForRejection={true}
          approveText="Approve Integration"
          rejectText="Reject Integration"
          onSubmit={(response) => console.log('Complex approval response:', response)}
        />
      </div>
    )
  },
}

// Error states and validation
export const ValidationErrors: Story = {
  render: () => {
    const errorFormRequest: TaskInputRequest = {
      id: 'error-form-1',
      taskId: 'task-1',
      type: 'form',
      prompt: 'Form with Validation Errors',
      required: true,
      metadata: {
        fields: [
          {
            name: 'username',
            type: 'text',
            label: 'Username',
            validation: [
              { type: 'required', message: 'Username is required' },
              { type: 'minLength', value: 3, message: 'Username must be at least 3 characters' },
              { type: 'pattern', value: '^[a-zA-Z0-9_]+$', message: 'Username can only contain letters, numbers, and underscores' }
            ]
          },
          {
            name: 'password',
            type: 'password',
            label: 'Password',
            validation: [
              { type: 'required', message: 'Password is required' },
              { type: 'minLength', value: 8, message: 'Password must be at least 8 characters' },
              { type: 'pattern', value: '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)', message: 'Password must contain uppercase, lowercase, and number' }
            ]
          },
          {
            name: 'confirmPassword',
            type: 'password',
            label: 'Confirm Password',
            validation: [
              { type: 'required', message: 'Please confirm your password' }
            ]
          }
        ] as FormField[]
      }
    }
    
    return (
      <div className="w-[500px]">
        <Input.Form
          request={errorFormRequest}
          onSubmit={(response) => console.log('Form with errors submitted:', response)}
        />
        <div className="mt-4 p-3 bg-muted rounded text-sm">
          <p><strong>Try submitting without filling fields to see validation errors.</strong></p>
          <p>Username: Try entering less than 3 characters or special characters</p>
          <p>Password: Try a weak password without uppercase/numbers</p>
        </div>
      </div>
    )
  },
}

// Auto-submit form
export const AutoSubmitForm: Story = {
  render: () => {
    const autoSubmitRequest: TaskInputRequest = {
      id: 'auto-submit-1',
      taskId: 'task-1',
      type: 'form',
      prompt: 'Quick Settings (Auto-submit when complete)',
      required: true,
      metadata: {
        fields: [
          {
            name: 'theme',
            type: 'select',
            label: 'Theme',
            validation: [{ type: 'required', message: 'Please select a theme' }],
            options: [
              { value: 'light', label: 'Light Theme' },
              { value: 'dark', label: 'Dark Theme' },
              { value: 'auto', label: 'Auto (System)' }
            ]
          },
          {
            name: 'notifications',
            type: 'checkbox',
            label: 'Enable notifications'
          }
        ] as FormField[]
      }
    }
    
    return (
      <div className="w-[400px]">
        <Input.Form
          request={autoSubmitRequest}
          autoSubmit={true}
          showProgress={false}
          onSubmit={(response) => console.log('Auto-submitted:', response)}
        />
        <div className="mt-4 p-3 bg-muted rounded text-sm">
          <p><strong>This form auto-submits when all required fields are filled.</strong></p>
        </div>
      </div>
    )
  },
}