import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import type { 
  TaskInputRequest,
  InputResponse,
  ValidationRule,
  ValidationError
} from '@agentarea/core'
import { useIsClient } from '../../hooks/use-ssr'

interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

interface InputContextValue {
  activeRequests: TaskInputRequest[]
  pendingResponses: Map<string, InputResponse>
  validationErrors: Map<string, ValidationError[]>
  submissionStatus: Map<string, 'idle' | 'submitting' | 'submitted' | 'error'>
  error: Error | null
  
  // Actions
  submitResponse: (requestId: string, value: unknown) => Promise<void>
  validateInput: (requestId: string, value: unknown) => ValidationResult
  cancelInputRequest: (requestId: string) => Promise<void>
  clearValidationErrors: (requestId: string) => void
  addInputRequest: (request: TaskInputRequest) => void
  removeInputRequest: (requestId: string) => void
  updateInputRequest: (requestId: string, updates: Partial<TaskInputRequest>) => void
}

const InputContext = createContext<InputContextValue | null>(null)

interface InputProviderProps {
  children: ReactNode
  onSubmitResponse?: (requestId: string, response: InputResponse) => Promise<void>
  onCancelRequest?: (requestId: string) => Promise<void>
  autoValidate?: boolean
}

export function InputProvider({ 
  children, 
  onSubmitResponse,
  onCancelRequest,
  autoValidate = true
}: InputProviderProps) {
  const [activeRequests, setActiveRequests] = useState<TaskInputRequest[]>([])
  const [pendingResponses, setPendingResponses] = useState<Map<string, InputResponse>>(new Map())
  const [validationErrors, setValidationErrors] = useState<Map<string, ValidationError[]>>(new Map())
  const [submissionStatus, setSubmissionStatus] = useState<Map<string, 'idle' | 'submitting' | 'submitted' | 'error'>>(new Map())
  const [error, setError] = useState<Error | null>(null)
  
  const isClient = useIsClient()

  // Auto-cleanup expired requests
  useEffect(() => {
    if (!isClient) return

    const interval = setInterval(() => {
      const now = new Date()
      setActiveRequests(prev => prev.filter(request => {
        if (!request.timeout) return true
        const expiresAt = new Date(request.createdAt.getTime() + request.timeout)
        return expiresAt > now
      }))
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [isClient])

  const validateInput = useCallback((requestId: string, value: unknown): ValidationResult => {
    const request = activeRequests.find(req => req.id === requestId)
    if (!request) {
      return {
        valid: false,
        errors: [{ code: 'REQUEST_NOT_FOUND', message: 'Input request not found', field: 'requestId' }]
      }
    }

    const errors: ValidationError[] = []

    // Apply validation rules
    if (request.validation) {
      for (const rule of request.validation) {
        const validationError = validateRule(rule, value, request)
        if (validationError) {
          errors.push(validationError)
        }
      }
    }

    // Required field validation
    if (request.required && (value === null || value === undefined || value === '')) {
      errors.push({
        code: 'REQUIRED',
        message: 'This field is required',
        field: 'value'
      })
    }

    // Type-specific validation
    switch (request.type) {
      case 'selection':
        if (request.options && value !== null && value !== undefined) {
          const validOptions = request.options.map(opt => opt.value)
          if (Array.isArray(value)) {
            // Multi-select validation
            const invalidValues = value.filter(v => !validOptions.includes(v))
            if (invalidValues.length > 0) {
              errors.push({
                code: 'INVALID_SELECTION',
                message: `Invalid selection: ${invalidValues.join(', ')}`,
                field: 'value',
                data: { invalidValues }
              })
            }
          } else {
            // Single select validation
            if (!validOptions.includes(value)) {
              errors.push({
                code: 'INVALID_SELECTION',
                message: 'Invalid selection',
                field: 'value',
                data: { value, validOptions }
              })
            }
          }
        }
        break
      case 'file':
        if (value && typeof value === 'object' && 'type' in value) {
          const file = value as File
          // File size validation (example: max 10MB)
          if (file.size > 10 * 1024 * 1024) {
            errors.push({
              code: 'FILE_TOO_LARGE',
              message: 'File size must be less than 10MB',
              field: 'value',
              data: { size: file.size, maxSize: 10 * 1024 * 1024 }
            })
          }
        }
        break
    }

    const result = {
      valid: errors.length === 0,
      errors
    }

    // Update validation errors state if auto-validate is enabled
    if (autoValidate) {
      setValidationErrors(prev => {
        const newErrors = new Map(prev)
        if (errors.length > 0) {
          newErrors.set(requestId, errors)
        } else {
          newErrors.delete(requestId)
        }
        return newErrors
      })
    }

    return result
  }, [activeRequests, autoValidate])

  const submitResponse = useCallback(async (requestId: string, value: unknown) => {
    const request = activeRequests.find(req => req.id === requestId)
    if (!request) {
      throw new Error(`Input request ${requestId} not found`)
    }

    // Validate input before submission
    const validation = validateInput(requestId, value)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
    }

    try {
      setSubmissionStatus(prev => new Map(prev.set(requestId, 'submitting')))
      setError(null)

      const response: InputResponse = {
        requestId,
        taskId: request.taskId,
        value,
        timestamp: new Date(),
        metadata: {
          userAgent: isClient ? navigator.userAgent : undefined,
          timestamp: new Date().toISOString()
        }
      }

      // Add to pending responses
      setPendingResponses(prev => new Map(prev.set(requestId, response)))

      // Call external handler if provided
      if (onSubmitResponse) {
        await onSubmitResponse(requestId, response)
      }

      setSubmissionStatus(prev => new Map(prev.set(requestId, 'submitted')))
      
      // Remove from active requests after successful submission
      setActiveRequests(prev => prev.filter(req => req.id !== requestId))
      
      // Clear validation errors
      setValidationErrors(prev => {
        const newErrors = new Map(prev)
        newErrors.delete(requestId)
        return newErrors
      })

    } catch (err) {
      const error = err as Error
      setError(error)
      setSubmissionStatus(prev => new Map(prev.set(requestId, 'error')))
      throw error
    }
  }, [activeRequests, validateInput, onSubmitResponse, isClient])

  const cancelInputRequest = useCallback(async (requestId: string) => {
    const request = activeRequests.find(req => req.id === requestId)
    if (!request) {
      throw new Error(`Input request ${requestId} not found`)
    }

    try {
      setError(null)

      // Call external handler if provided
      if (onCancelRequest) {
        await onCancelRequest(requestId)
      }

      // Remove from active requests
      setActiveRequests(prev => prev.filter(req => req.id !== requestId))
      
      // Clean up related state
      setPendingResponses(prev => {
        const newResponses = new Map(prev)
        newResponses.delete(requestId)
        return newResponses
      })
      
      setValidationErrors(prev => {
        const newErrors = new Map(prev)
        newErrors.delete(requestId)
        return newErrors
      })
      
      setSubmissionStatus(prev => {
        const newStatus = new Map(prev)
        newStatus.delete(requestId)
        return newStatus
      })

    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    }
  }, [activeRequests, onCancelRequest])

  const clearValidationErrors = useCallback((requestId: string) => {
    setValidationErrors(prev => {
      const newErrors = new Map(prev)
      newErrors.delete(requestId)
      return newErrors
    })
  }, [])

  const addInputRequest = useCallback((request: TaskInputRequest) => {
    setActiveRequests(prev => {
      // Remove existing request with same ID if it exists
      const filtered = prev.filter(req => req.id !== request.id)
      return [...filtered, request]
    })
    
    // Initialize submission status
    setSubmissionStatus(prev => new Map(prev.set(request.id, 'idle')))
  }, [])

  const removeInputRequest = useCallback((requestId: string) => {
    setActiveRequests(prev => prev.filter(req => req.id !== requestId))
    
    // Clean up related state
    setPendingResponses(prev => {
      const newResponses = new Map(prev)
      newResponses.delete(requestId)
      return newResponses
    })
    
    setValidationErrors(prev => {
      const newErrors = new Map(prev)
      newErrors.delete(requestId)
      return newErrors
    })
    
    setSubmissionStatus(prev => {
      const newStatus = new Map(prev)
      newStatus.delete(requestId)
      return newStatus
    })
  }, [])

  const updateInputRequest = useCallback((requestId: string, updates: Partial<TaskInputRequest>) => {
    setActiveRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { ...req, ...updates }
        : req
    ))
  }, [])

  const value: InputContextValue = {
    activeRequests,
    pendingResponses,
    validationErrors,
    submissionStatus,
    error,
    submitResponse,
    validateInput,
    cancelInputRequest,
    clearValidationErrors,
    addInputRequest,
    removeInputRequest,
    updateInputRequest
  }

  return (
    <InputContext.Provider value={value}>
      {children}
    </InputContext.Provider>
  )
}

export function useInputContext(): InputContextValue {
  const context = useContext(InputContext)
  if (!context) {
    throw new Error('useInputContext must be used within an InputProvider')
  }
  return context
}

// Helper function to validate individual rules
function validateRule(rule: ValidationRule, value: unknown, request: TaskInputRequest): ValidationError | null {
  switch (rule.type) {
    case 'required':
      if (value === null || value === undefined || value === '') {
        return {
          code: 'REQUIRED',
          message: rule.message || 'This field is required',
          field: 'value'
        }
      }
      break

    case 'minLength':
      if (typeof value === 'string' && typeof rule.value === 'number') {
        if (value.length < rule.value) {
          return {
            code: 'MIN_LENGTH',
            message: rule.message || `Minimum length is ${rule.value}`,
            field: 'value',
            data: { minLength: rule.value, actualLength: value.length }
          }
        }
      }
      break

    case 'maxLength':
      if (typeof value === 'string' && typeof rule.value === 'number') {
        if (value.length > rule.value) {
          return {
            code: 'MAX_LENGTH',
            message: rule.message || `Maximum length is ${rule.value}`,
            field: 'value',
            data: { maxLength: rule.value, actualLength: value.length }
          }
        }
      }
      break

    case 'pattern':
      if (typeof value === 'string' && typeof rule.value === 'string') {
        const regex = new RegExp(rule.value)
        if (!regex.test(value)) {
          return {
            code: 'PATTERN',
            message: rule.message || 'Invalid format',
            field: 'value',
            data: { pattern: rule.value, value }
          }
        }
      }
      break

    case 'custom':
      // Custom validation would need to be implemented based on specific requirements
      // For now, we'll just return null (valid)
      break
  }

  return null
}

// Utility functions for common validation scenarios
export function createRequiredRule(message?: string): ValidationRule {
  return {
    type: 'required',
    message: message || 'This field is required'
  }
}

export function createMinLengthRule(minLength: number, message?: string): ValidationRule {
  return {
    type: 'minLength',
    value: minLength,
    message: message || `Minimum length is ${minLength}`
  }
}

export function createMaxLengthRule(maxLength: number, message?: string): ValidationRule {
  return {
    type: 'maxLength',
    value: maxLength,
    message: message || `Maximum length is ${maxLength}`
  }
}

export function createPatternRule(pattern: string, message?: string): ValidationRule {
  return {
    type: 'pattern',
    value: pattern,
    message: message || 'Invalid format'
  }
}