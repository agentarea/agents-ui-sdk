import type { Meta, StoryObj } from '@storybook/react'
import { Artifact, Input, Block, Task, Chat } from '@agentarea/react'
import type { EnhancedArtifact, TaskInputRequest, ProtocolMessage, EnhancedTask } from '@agentarea/core'
import { useState, useRef, useEffect } from 'react'

const meta: Meta = {
  title: 'Accessibility/Testing Scenarios',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Accessibility testing scenarios for all components with keyboard navigation, screen reader support, and WCAG compliance',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Mock data for accessibility testing
const mockAccessibleArtifact: EnhancedArtifact = {
  id: 'accessible-artifact-1',
  taskId: 'task-1',
  displayType: 'code',
  content: {
    code: {
      language: 'javascript',
      content: `// Accessible button component example
function AccessibleButton({ children, onClick, disabled = false, ariaLabel }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="px-4 py-2 bg-blue-500 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
    >
      {children}
    </button>
  )
}`
    }
  },
  mimeType: 'text/javascript',
  size: 256,
  createdAt: new Date(),
  downloadable: true,
  shareable: true,
  metadata: {
    name: 'Accessible Button Component',
    language: 'javascript'
  }
}

const mockAccessibleInputRequest: TaskInputRequest = {
  id: 'accessible-input-1',
  taskId: 'task-1',
  type: 'form',
  prompt: 'User Registration Form (Accessibility Test)',
  required: true,
  metadata: {
    fields: [
      {
        name: 'firstName',
        type: 'text',
        label: 'First Name',
        placeholder: 'Enter your first name',
        validation: [
          { type: 'required', message: 'First name is required for account creation' }
        ]
      },
      {
        name: 'email',
        type: 'email',
        label: 'Email Address',
        placeholder: 'Enter your email address',
        validation: [
          { type: 'required', message: 'Email address is required' },
          { type: 'pattern', value: '^[^@]+@[^@]+\\.[^@]+$', message: 'Please enter a valid email address' }
        ]
      },
      {
        name: 'password',
        type: 'password',
        label: 'Password',
        placeholder: 'Create a secure password',
        validation: [
          { type: 'required', message: 'Password is required' },
          { type: 'minLength', value: 8, message: 'Password must be at least 8 characters long' }
        ]
      },
      {
        name: 'newsletter',
        type: 'checkbox',
        label: 'Subscribe to our newsletter for updates and tips'
      }
    ]
  }
}

// Keyboard Navigation Testing
export const KeyboardNavigation: Story = {
  render: () => {
    const [focusedElement, setFocusedElement] = useState<string>('')
    
    const handleFocus = (elementName: string) => {
      setFocusedElement(elementName)
    }
    
    return (
      <div className="w-[800px] space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Keyboard Navigation Test</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Use Tab to navigate forward, Shift+Tab to navigate backward. 
            Currently focused: <strong>{focusedElement || 'None'}</strong>
          </p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Tab through all interactive elements</p>
            <p>• Enter/Space to activate buttons and checkboxes</p>
            <p>• Arrow keys for radio buttons and select options</p>
            <p>• Escape to close modals and dropdowns</p>
          </div>
        </div>
        
        {/* Artifact with keyboard navigation */}
        <div 
          onFocus={() => handleFocus('Artifact Container')}
          tabIndex={0}
        >
          <Artifact
            artifact={mockAccessibleArtifact}
            onDownload={() => handleFocus('Download Button')}
            onShare={() => handleFocus('Share Button')}
          />
        </div>
        
        {/* Input form with keyboard navigation */}
        <div onFocus={() => handleFocus('Input Form')}>
          <Input.Form
            request={mockAccessibleInputRequest}
            onSubmit={() => handleFocus('Submit Button')}
            onCancel={() => handleFocus('Cancel Button')}
          />
        </div>
        
        {/* Navigation instructions */}
        <div className="p-3 bg-muted rounded text-sm">
          <p><strong>Keyboard Navigation Instructions:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Use Tab key to move between interactive elements</li>
            <li>Use Shift+Tab to move backward</li>
            <li>Use Enter or Space to activate buttons</li>
            <li>Use arrow keys within form controls</li>
            <li>Focus indicators should be clearly visible</li>
          </ul>
        </div>
      </div>
    )
  },
}

// Screen Reader Testing
export const ScreenReaderSupport: Story = {
  render: () => {
    const [announcements, setAnnouncements] = useState<string[]>([])
    
    const addAnnouncement = (message: string) => {
      setAnnouncements(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
    }
    
    return (
      <div className="w-[800px] space-y-6">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Screen Reader Support Test</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This section tests ARIA labels, descriptions, and live regions for screen reader compatibility.
          </p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• All interactive elements have proper ARIA labels</p>
            <p>• Form fields have associated labels and error messages</p>
            <p>• Status updates are announced via live regions</p>
            <p>• Complex widgets have appropriate ARIA roles</p>
          </div>
        </div>
        
        {/* Live region for announcements */}
        <div 
          aria-live="polite" 
          aria-label="Status announcements"
          className="sr-only"
        >
          {announcements[announcements.length - 1]}
        </div>
        
        {/* Artifact with ARIA labels */}
        <div role="region" aria-labelledby="artifact-heading">
          <h4 id="artifact-heading" className="text-lg font-semibold mb-2">
            Code Artifact: Accessible Button Component
          </h4>
          <Artifact
            artifact={mockAccessibleArtifact}
            onDownload={() => addAnnouncement('Downloading accessible button component code')}
            onShare={() => addAnnouncement('Sharing accessible button component code')}
            aria-describedby="artifact-description"
          />
          <p id="artifact-description" className="text-sm text-muted-foreground mt-2">
            JavaScript code example showing how to create an accessible button component with proper ARIA attributes.
          </p>
        </div>
        
        {/* Form with comprehensive ARIA support */}
        <div role="region" aria-labelledby="form-heading">
          <h4 id="form-heading" className="text-lg font-semibold mb-2">
            Accessible Registration Form
          </h4>
          <Input.Form
            request={mockAccessibleInputRequest}
            onSubmit={() => addAnnouncement('Form submitted successfully')}
            onCancel={() => addAnnouncement('Form submission cancelled')}
            aria-describedby="form-description"
          />
          <p id="form-description" className="text-sm text-muted-foreground mt-2">
            Registration form with proper labels, error messages, and validation feedback.
          </p>
        </div>
        
        {/* Announcements log */}
        <div className="p-3 bg-muted rounded">
          <h4 className="font-semibold mb-2">Screen Reader Announcements Log:</h4>
          <div className="text-sm space-y-1 max-h-32 overflow-auto">
            {announcements.length === 0 ? (
              <p className="text-muted-foreground">No announcements yet. Interact with elements above.</p>
            ) : (
              announcements.map((announcement, index) => (
                <div key={index} className="font-mono text-xs">
                  {announcement}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  },
}

// High Contrast and Color Testing
export const HighContrastMode: Story = {
  render: () => {
    const [highContrast, setHighContrast] = useState(false)
    
    return (
      <div className={`w-[800px] space-y-6 ${highContrast ? 'high-contrast' : ''}`}>
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">High Contrast & Color Accessibility</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Testing color contrast ratios and ensuring information is not conveyed by color alone.
          </p>
          <button
            onClick={() => setHighContrast(!highContrast)}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
          >
            {highContrast ? 'Disable' : 'Enable'} High Contrast Mode
          </button>
        </div>
        
        {/* Color-blind friendly status indicators */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Status Indicators (Color + Icon)</h4>
          <div className="grid grid-cols-2 gap-4">
            <Block.Status
              status={{
                type: 'connection',
                state: 'online',
                message: 'Connection established successfully',
                lastUpdate: new Date()
              }}
            />
            <Block.Status
              status={{
                type: 'connection',
                state: 'error',
                message: 'Connection failed - timeout error',
                lastUpdate: new Date()
              }}
            />
          </div>
        </div>
        
        {/* Form validation with multiple indicators */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Form Validation (Multiple Indicators)</h4>
          <Input.Form
            request={{
              ...mockAccessibleInputRequest,
              metadata: {
                ...mockAccessibleInputRequest.metadata,
                fields: [
                  {
                    name: 'email',
                    type: 'email',
                    label: 'Email Address',
                    placeholder: 'Enter a valid email address',
                    validation: [
                      { type: 'required', message: '❌ Email is required' },
                      { type: 'pattern', value: '^[^@]+@[^@]+\\.[^@]+$', message: '⚠️ Please enter a valid email format' }
                    ]
                  }
                ]
              }
            }}
          />
        </div>
        
        {/* Contrast testing guide */}
        <div className="p-3 bg-muted rounded text-sm">
          <p><strong>Accessibility Guidelines:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Text contrast ratio should be at least 4.5:1 for normal text</li>
            <li>Text contrast ratio should be at least 3:1 for large text</li>
            <li>Interactive elements should have 3:1 contrast with adjacent colors</li>
            <li>Information should not be conveyed by color alone</li>
            <li>Focus indicators should be clearly visible in all modes</li>
          </ul>
        </div>
        
        <style jsx>{`
          .high-contrast {
            filter: contrast(150%) brightness(120%);
          }
          .high-contrast * {
            border-color: #000 !important;
          }
        `}</style>
      </div>
    )
  },
}

// Focus Management Testing
export const FocusManagement: Story = {
  render: () => {
    const [modalOpen, setModalOpen] = useState(false)
    const [focusHistory, setFocusHistory] = useState<string[]>([])
    const triggerRef = useRef<HTMLButtonElement>(null)
    const modalRef = useRef<HTMLDivElement>(null)
    
    const addFocusEvent = (element: string) => {
      setFocusHistory(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: Focus moved to ${element}`])
    }
    
    const openModal = () => {
      setModalOpen(true)
      addFocusEvent('Modal dialog')
      // Focus should move to modal
      setTimeout(() => {
        modalRef.current?.focus()
      }, 100)
    }
    
    const closeModal = () => {
      setModalOpen(false)
      addFocusEvent('Modal trigger button (restored)')
      // Focus should return to trigger
      setTimeout(() => {
        triggerRef.current?.focus()
      }, 100)
    }
    
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && modalOpen) {
          closeModal()
        }
      }
      
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }, [modalOpen])
    
    return (
      <div className="w-[800px] space-y-6">
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Focus Management Test</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Testing proper focus management for modals, dropdowns, and dynamic content.
          </p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Focus should be trapped within modals</p>
            <p>• Focus should return to trigger element when modal closes</p>
            <p>• Tab order should be logical and predictable</p>
            <p>• Skip links should be available for long content</p>
          </div>
        </div>
        
        {/* Focus history */}
        <div className="p-3 bg-muted rounded">
          <h4 className="font-semibold mb-2">Focus Movement History:</h4>
          <div className="text-sm space-y-1">
            {focusHistory.length === 0 ? (
              <p className="text-muted-foreground">No focus events yet.</p>
            ) : (
              focusHistory.map((event, index) => (
                <div key={index} className="font-mono text-xs">
                  {event}
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Modal trigger */}
        <div className="space-y-4">
          <button
            ref={triggerRef}
            onClick={openModal}
            onFocus={() => addFocusEvent('Modal trigger button')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            Open Modal Dialog
          </button>
          
          {/* Other focusable elements */}
          <div className="space-x-2">
            <button
              onFocus={() => addFocusEvent('Button 1')}
              className="px-3 py-1 bg-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Button 1
            </button>
            <button
              onFocus={() => addFocusEvent('Button 2')}
              className="px-3 py-1 bg-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Button 2
            </button>
            <input
              type="text"
              placeholder="Text input"
              onFocus={() => addFocusEvent('Text input')}
              className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>
        
        {/* Modal overlay */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              ref={modalRef}
              role="dialog"
              aria-labelledby="modal-title"
              aria-describedby="modal-description"
              tabIndex={-1}
              className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 focus:outline-none focus:ring-2 focus:ring-blue-300"
              onFocus={() => addFocusEvent('Modal container')}
            >
              <h3 id="modal-title" className="text-lg font-semibold mb-2">
                Modal Dialog
              </h3>
              <p id="modal-description" className="text-sm text-muted-foreground mb-4">
                This modal demonstrates proper focus management. Focus should be trapped within this dialog.
              </p>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Modal input field"
                  onFocus={() => addFocusEvent('Modal input field')}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={closeModal}
                    onFocus={() => addFocusEvent('Cancel button')}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={closeModal}
                    onFocus={() => addFocusEvent('Confirm button')}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Instructions */}
        <div className="p-3 bg-muted rounded text-sm">
          <p><strong>Focus Management Test Instructions:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Tab through elements and observe focus movement</li>
            <li>Open modal and verify focus moves to modal</li>
            <li>Tab within modal - focus should stay trapped</li>
            <li>Press Escape or close modal - focus should return to trigger</li>
            <li>Check that focus indicators are always visible</li>
          </ul>
        </div>
      </div>
    )
  },
}

// ARIA Roles and Properties Testing
export const ARIACompliance: Story = {
  render: () => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
    
    const toggleSection = (sectionId: string) => {
      setExpandedSections(prev => {
        const newSet = new Set(prev)
        if (newSet.has(sectionId)) {
          newSet.delete(sectionId)
        } else {
          newSet.add(sectionId)
        }
        return newSet
      })
    }
    
    return (
      <div className="w-[800px] space-y-6">
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">ARIA Roles and Properties Test</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Testing proper ARIA roles, properties, and states for complex UI components.
          </p>
        </div>
        
        {/* Accordion with ARIA */}
        <div role="region" aria-labelledby="accordion-heading">
          <h4 id="accordion-heading" className="text-lg font-semibold mb-4">
            Accessible Accordion
          </h4>
          
          {['section1', 'section2', 'section3'].map((sectionId, index) => {
            const isExpanded = expandedSections.has(sectionId)
            const headingId = `accordion-heading-${sectionId}`
            const panelId = `accordion-panel-${sectionId}`
            
            return (
              <div key={sectionId} className="border border-gray-200 rounded mb-2">
                <h5>
                  <button
                    id={headingId}
                    aria-expanded={isExpanded}
                    aria-controls={panelId}
                    onClick={() => toggleSection(sectionId)}
                    className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-inset"
                  >
                    <span className="flex items-center justify-between">
                      <span>Accordion Section {index + 1}</span>
                      <span aria-hidden="true">
                        {isExpanded ? '−' : '+'}
                      </span>
                    </span>
                  </button>
                </h5>
                
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={headingId}
                  hidden={!isExpanded}
                  className={`px-4 py-3 ${isExpanded ? 'block' : 'hidden'}`}
                >
                  <p className="text-sm">
                    This is the content for accordion section {index + 1}. 
                    It demonstrates proper ARIA attributes for expandable content.
                  </p>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Tab panel with ARIA */}
        <div role="region" aria-labelledby="tabpanel-heading">
          <h4 id="tabpanel-heading" className="text-lg font-semibold mb-4">
            Accessible Tab Panel
          </h4>
          
          <div role="tablist" aria-label="Content sections">
            <div className="flex border-b">
              {['Overview', 'Details', 'Settings'].map((tab, index) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={index === 0}
                  aria-controls={`tabpanel-${index}`}
                  id={`tab-${index}`}
                  tabIndex={index === 0 ? 0 : -1}
                  className={`px-4 py-2 border-b-2 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                    index === 0 
                      ? 'border-blue-500 text-blue-600 bg-blue-50' 
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            <div
              role="tabpanel"
              id="tabpanel-0"
              aria-labelledby="tab-0"
              className="p-4 bg-white"
            >
              <p className="text-sm">
                This is the overview tab content. Tab panels should have proper ARIA roles and relationships.
              </p>
            </div>
          </div>
        </div>
        
        {/* Live region examples */}
        <div role="region" aria-labelledby="live-region-heading">
          <h4 id="live-region-heading" className="text-lg font-semibold mb-4">
            Live Regions
          </h4>
          
          <div className="space-y-4">
            <div>
              <h5 className="font-medium mb-2">Polite Announcements</h5>
              <div 
                aria-live="polite" 
                aria-label="Status updates"
                className="p-3 bg-green-50 border border-green-200 rounded min-h-[2rem]"
              >
                Form validation messages and status updates appear here
              </div>
            </div>
            
            <div>
              <h5 className="font-medium mb-2">Assertive Announcements</h5>
              <div 
                aria-live="assertive" 
                aria-label="Important alerts"
                className="p-3 bg-red-50 border border-red-200 rounded min-h-[2rem]"
              >
                Critical errors and urgent notifications appear here
              </div>
            </div>
          </div>
        </div>
        
        {/* ARIA testing checklist */}
        <div className="p-3 bg-muted rounded text-sm">
          <p><strong>ARIA Compliance Checklist:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>✓ All interactive elements have accessible names</li>
            <li>✓ Form controls have associated labels</li>
            <li>✓ Complex widgets use appropriate ARIA roles</li>
            <li>✓ State changes are communicated via ARIA properties</li>
            <li>✓ Live regions announce dynamic content changes</li>
            <li>✓ Focus management follows ARIA authoring practices</li>
            <li>✓ Keyboard navigation matches expected patterns</li>
          </ul>
        </div>
      </div>
    )
  },
}