import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@test-utils'
import { axe } from 'jest-axe'
import { InputForm } from '../input-form'
import { mockInputRequest } from '@test-utils'

describe('InputForm', () => {
  const textInputRequest = mockInputRequest({
    type: 'text',
    prompt: 'Please enter your name',
    required: true,
    validation: [
      { type: 'required', message: 'Name is required' },
      { type: 'minLength', value: 2, message: 'Name must be at least 2 characters' }
    ]
  })

  const selectionInputRequest = mockInputRequest({
    type: 'selection',
    prompt: 'Choose your favorite color',
    required: true,
    options: [
      { value: 'red', label: 'Red' },
      { value: 'blue', label: 'Blue' },
      { value: 'green', label: 'Green' }
    ]
  })

  const defaultProps = {
    inputRequests: [textInputRequest],
    onSubmit: vi.fn(),
    onCancel: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders input form with prompt', () => {
    render(<InputForm {...defaultProps} />)
    
    expect(screen.getByText('Please enter your name')).toBeInTheDocument()
  })

  it('renders text input field', () => {
    render(<InputForm {...defaultProps} />)
    
    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('required')
  })

  it('renders selection input with options', () => {
    render(<InputForm {...defaultProps} inputRequests={[selectionInputRequest]} />)
    
    expect(screen.getByText('Choose your favorite color')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    
    // Open dropdown
    fireEvent.click(screen.getByRole('combobox'))
    
    expect(screen.getByText('Red')).toBeInTheDocument()
    expect(screen.getByText('Blue')).toBeInTheDocument()
    expect(screen.getByText('Green')).toBeInTheDocument()
  })

  it('shows submit and cancel buttons', () => {
    render(<InputForm {...defaultProps} />)
    
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(<InputForm {...defaultProps} />)
    
    const submitButton = screen.getByRole('button', { name: /submit/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })
    
    expect(defaultProps.onSubmit).not.toHaveBeenCalled()
  })

  it('validates minimum length', async () => {
    render(<InputForm {...defaultProps} />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'A' } })
    
    const submitButton = screen.getByRole('button', { name: /submit/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument()
    })
    
    expect(defaultProps.onSubmit).not.toHaveBeenCalled()
  })

  it('submits valid form data', async () => {
    render(<InputForm {...defaultProps} />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'John Doe' } })
    
    const submitButton = screen.getByRole('button', { name: /submit/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith([
        {
          requestId: textInputRequest.id,
          value: 'John Doe',
          timestamp: expect.any(Date)
        }
      ])
    })
  })

  it('calls onCancel when cancel button is clicked', () => {
    render(<InputForm {...defaultProps} />)
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)
    
    expect(defaultProps.onCancel).toHaveBeenCalled()
  })

  it('handles multiple input requests', () => {
    const multipleRequests = [textInputRequest, selectionInputRequest]
    render(<InputForm {...defaultProps} inputRequests={multipleRequests} />)
    
    expect(screen.getByText('Please enter your name')).toBeInTheDocument()
    expect(screen.getByText('Choose your favorite color')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('shows progress indicator for multi-step forms', () => {
    const multipleRequests = [textInputRequest, selectionInputRequest]
    render(<InputForm {...defaultProps} inputRequests={multipleRequests} showProgress />)
    
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('handles form submission with multiple inputs', async () => {
    const multipleRequests = [textInputRequest, selectionInputRequest]
    render(<InputForm {...defaultProps} inputRequests={multipleRequests} />)
    
    // Fill text input
    const textInput = screen.getByRole('textbox')
    fireEvent.change(textInput, { target: { value: 'John Doe' } })
    
    // Select option
    const select = screen.getByRole('combobox')
    fireEvent.click(select)
    fireEvent.click(screen.getByText('Blue'))
    
    const submitButton = screen.getByRole('button', { name: /submit/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith([
        {
          requestId: textInputRequest.id,
          value: 'John Doe',
          timestamp: expect.any(Date)
        },
        {
          requestId: selectionInputRequest.id,
          value: 'blue',
          timestamp: expect.any(Date)
        }
      ])
    })
  })

  it('disables submit button while submitting', async () => {
    const onSubmit = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    render(<InputForm {...defaultProps} onSubmit={onSubmit} />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'John Doe' } })
    
    const submitButton = screen.getByRole('button', { name: /submit/i })
    fireEvent.click(submitButton)
    
    expect(submitButton).toBeDisabled()
    expect(screen.getByText(/submitting/i)).toBeInTheDocument()
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
  })

  it('handles submission errors gracefully', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'))
    render(<InputForm {...defaultProps} onSubmit={onSubmit} />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'John Doe' } })
    
    const submitButton = screen.getByRole('button', { name: /submit/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/submission failed/i)).toBeInTheDocument()
    })
  })

  it('supports custom validation functions', async () => {
    const customValidationRequest = mockInputRequest({
      type: 'text',
      prompt: 'Enter an email',
      validation: [
        {
          type: 'custom',
          message: 'Please enter a valid email',
          validator: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        }
      ]
    })
    
    render(<InputForm {...defaultProps} inputRequests={[customValidationRequest]} />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'invalid-email' } })
    
    const submitButton = screen.getByRole('button', { name: /submit/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument()
    })
  })

  it('meets accessibility standards', async () => {
    const { container } = render(<InputForm {...defaultProps} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('supports keyboard navigation', () => {
    render(<InputForm {...defaultProps} />)
    
    const input = screen.getByRole('textbox')
    const submitButton = screen.getByRole('button', { name: /submit/i })
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    
    // Tab through form elements
    input.focus()
    expect(input).toHaveFocus()
    
    fireEvent.keyDown(input, { key: 'Tab' })
    submitButton.focus()
    expect(submitButton).toHaveFocus()
    
    fireEvent.keyDown(submitButton, { key: 'Tab' })
    cancelButton.focus()
    expect(cancelButton).toHaveFocus()
  })

  it('handles Enter key submission', async () => {
    render(<InputForm {...defaultProps} />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'John Doe' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    
    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalled()
    })
  })

  it('handles Escape key cancellation', () => {
    render(<InputForm {...defaultProps} />)
    
    const input = screen.getByRole('textbox')
    fireEvent.keyDown(input, { key: 'Escape' })
    
    expect(defaultProps.onCancel).toHaveBeenCalled()
  })
})