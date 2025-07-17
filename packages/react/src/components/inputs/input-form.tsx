import * as React from "react"
import { useState, useCallback, useEffect } from "react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { Progress } from "../ui/progress"
import { useInputContext } from "../providers/input-provider"
import type { 
  TaskInputRequest, 
  FormField, 
  ValidationError,
  InputResponse 
} from "@agentarea/core"

export interface InputFormProps {
  request: TaskInputRequest
  onSubmit?: (response: InputResponse) => void
  onCancel?: () => void
  className?: string
  showProgress?: boolean
  autoSubmit?: boolean
}

export interface FormData {
  [key: string]: unknown
}

export interface FormErrors {
  [key: string]: ValidationError[]
}

export function InputForm({
  request,
  onSubmit,
  onCancel,
  className,
  showProgress = true,
  autoSubmit = false
}: InputFormProps) {
  const { 
    submitResponse, 
    validateInput, 
    validationErrors, 
    submissionStatus,
    clearValidationErrors 
  } = useInputContext()
  
  const [formData, setFormData] = useState<FormData>({})
  const [localErrors, setLocalErrors] = useState<FormErrors>({})
  const [currentStep, setCurrentStep] = useState(0)
  
  // Parse form fields from request metadata
  const formFields = React.useMemo(() => {
    if (request.type !== 'form' || !request.metadata?.fields) {
      return []
    }
    return request.metadata.fields as FormField[]
  }, [request])
  
  const isMultiStep = formFields.length > 3 // Consider multi-step if more than 3 fields
  const totalSteps = isMultiStep ? Math.ceil(formFields.length / 3) : 1
  const currentFields = isMultiStep 
    ? formFields.slice(currentStep * 3, (currentStep + 1) * 3)
    : formFields
  
  const requestErrors = validationErrors.get(request.id) || []
  const status = submissionStatus.get(request.id) || 'idle'
  const isSubmitting = status === 'submitting'
  const isSubmitted = status === 'submitted'
  
  // Initialize form data with default values
  useEffect(() => {
    const initialData: FormData = {}
    formFields.forEach(field => {
      if (field.type === 'checkbox') {
        initialData[field.name] = false
      } else if (field.type === 'select' && field.options) {
        initialData[field.name] = field.options[0]?.value || ''
      } else {
        initialData[field.name] = ''
      }
    })
    setFormData(initialData)
  }, [formFields])
  
  // Auto-submit when all required fields are filled (if enabled)
  useEffect(() => {
    if (!autoSubmit || isSubmitting || isSubmitted) return
    
    const requiredFields = formFields.filter(field => 
      field.validation?.some(rule => rule.type === 'required')
    )
    
    const allRequiredFilled = requiredFields.every(field => {
      const value = formData[field.name]
      return value !== null && value !== undefined && value !== ''
    })
    
    if (allRequiredFilled && requiredFields.length > 0) {
      handleSubmit()
    }
  }, [formData, autoSubmit, isSubmitting, isSubmitted, formFields])
  
  const validateField = useCallback((fieldName: string, value: unknown) => {
    const field = formFields.find(f => f.name === fieldName)
    if (!field?.validation) return []
    
    const errors: ValidationError[] = []
    
    for (const rule of field.validation) {
      let error: ValidationError | null = null
      
      switch (rule.type) {
        case 'required':
          if (value === null || value === undefined || value === '') {
            error = {
              code: 'REQUIRED',
              message: rule.message || `${field.label} is required`,
              field: fieldName
            }
          }
          break
          
        case 'minLength':
          if (typeof value === 'string' && typeof rule.value === 'number') {
            if (value.length < rule.value) {
              error = {
                code: 'MIN_LENGTH',
                message: rule.message || `${field.label} must be at least ${rule.value} characters`,
                field: fieldName,
                data: { minLength: rule.value, actualLength: value.length }
              }
            }
          }
          break
          
        case 'maxLength':
          if (typeof value === 'string' && typeof rule.value === 'number') {
            if (value.length > rule.value) {
              error = {
                code: 'MAX_LENGTH',
                message: rule.message || `${field.label} must be no more than ${rule.value} characters`,
                field: fieldName,
                data: { maxLength: rule.value, actualLength: value.length }
              }
            }
          }
          break
          
        case 'pattern':
          if (typeof value === 'string' && typeof rule.value === 'string') {
            const regex = new RegExp(rule.value)
            if (!regex.test(value)) {
              error = {
                code: 'PATTERN',
                message: rule.message || `${field.label} format is invalid`,
                field: fieldName,
                data: { pattern: rule.value, value }
              }
            }
          }
          break
      }
      
      if (error) {
        errors.push(error)
      }
    }
    
    return errors
  }, [formFields])
  
  const handleFieldChange = useCallback((fieldName: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
    
    // Clear previous errors for this field
    setLocalErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
    
    // Validate field on change
    const fieldErrors = validateField(fieldName, value)
    if (fieldErrors.length > 0) {
      setLocalErrors(prev => ({ ...prev, [fieldName]: fieldErrors }))
    }
  }, [validateField])
  
  const validateCurrentStep = useCallback(() => {
    const errors: FormErrors = {}
    let hasErrors = false
    
    currentFields.forEach(field => {
      const fieldErrors = validateField(field.name, formData[field.name])
      if (fieldErrors.length > 0) {
        errors[field.name] = fieldErrors
        hasErrors = true
      }
    })
    
    setLocalErrors(errors)
    return !hasErrors
  }, [currentFields, formData, validateField])
  
  const handleNext = useCallback(() => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1))
    }
  }, [validateCurrentStep, totalSteps])
  
  const handlePrevious = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }, [])
  
  const handleSubmit = useCallback(async () => {
    // Validate all fields before submission
    const allErrors: FormErrors = {}
    let hasErrors = false
    
    formFields.forEach(field => {
      const fieldErrors = validateField(field.name, formData[field.name])
      if (fieldErrors.length > 0) {
        allErrors[field.name] = fieldErrors
        hasErrors = true
      }
    })
    
    setLocalErrors(allErrors)
    
    if (hasErrors) {
      return
    }
    
    try {
      clearValidationErrors(request.id)
      await submitResponse(request.id, formData)
      
      if (onSubmit) {
        const response: InputResponse = {
          requestId: request.id,
          taskId: request.taskId,
          value: formData,
          timestamp: new Date()
        }
        onSubmit(response)
      }
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }, [formFields, formData, validateField, clearValidationErrors, submitResponse, request.id, request.taskId, onSubmit])
  
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel()
    }
  }, [onCancel])
  
  if (isSubmitted) {
    return (
      <div className={cn("p-4 border rounded-lg bg-green-50 border-green-200", className)}>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
              <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26l2.974 2.99L8 2.193z"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-green-800">Form submitted successfully</span>
        </div>
      </div>
    )
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{request.prompt}</h3>
        {isMultiStep && showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {totalSteps}</span>
              <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}% complete</span>
            </div>
            <Progress value={((currentStep + 1) / totalSteps) * 100} />
          </div>
        )}
      </div>
      
      {/* Global errors */}
      {requestErrors.length > 0 && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="text-sm text-destructive">
            {requestErrors.map((error, index) => (
              <div key={index}>{error.message}</div>
            ))}
          </div>
        </div>
      )}
      
      {/* Form fields */}
      <div className="space-y-4">
        {currentFields.map((field) => (
          <FormFieldRenderer
            key={field.name}
            field={field}
            value={formData[field.name]}
            onChange={(value) => handleFieldChange(field.name, value)}
            errors={localErrors[field.name] || []}
            disabled={isSubmitting}
          />
        ))}
      </div>
      
      {/* Actions */}
      <div className="flex justify-between pt-4">
        <div className="flex space-x-2">
          {isMultiStep && currentStep > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={isSubmitting}
            >
              Previous
            </Button>
          )}
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
        
        <div className="flex space-x-2">
          {isMultiStep && currentStep < totalSteps - 1 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Form field renderer component
interface FormFieldRendererProps {
  field: FormField
  value: unknown
  onChange: (value: unknown) => void
  errors: ValidationError[]
  disabled?: boolean
}

function FormFieldRenderer({ 
  field, 
  value, 
  onChange, 
  errors, 
  disabled = false 
}: FormFieldRendererProps) {
  const hasErrors = errors.length > 0
  const isRequired = field.validation?.some(rule => rule.type === 'required') || false
  
  const renderInput = () => {
    const baseClassName = cn(
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      hasErrors && "border-destructive focus-visible:ring-destructive"
    )
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
      case 'url':
        return (
          <input
            type={field.type}
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={baseClassName}
          />
        )
        
      case 'textarea':
        return (
          <textarea
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={cn(
              "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              hasErrors && "border-destructive focus-visible:ring-destructive"
            )}
          />
        )
        
      case 'number':
        return (
          <input
            type="number"
            value={String(value || '')}
            onChange={(e) => onChange(e.target.valueAsNumber || 0)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={baseClassName}
          />
        )
        
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 rounded border border-input"
            />
            <span className="text-sm">{field.label}</span>
          </div>
        )
        
      case 'select':
        return (
          <select
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={baseClassName}
          >
            <option value="">Select an option...</option>
            {field.options?.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        )
        
      default:
        return (
          <input
            type="text"
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={baseClassName}
          />
        )
    }
  }
  
  return (
    <div className="space-y-2">
      {field.type !== 'checkbox' && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {field.label}
          {isRequired && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      
      {renderInput()}
      
      {hasErrors && (
        <div className="text-sm text-destructive">
          {errors.map((error, index) => (
            <div key={index}>{error.message}</div>
          ))}
        </div>
      )}
    </div>
  )
}