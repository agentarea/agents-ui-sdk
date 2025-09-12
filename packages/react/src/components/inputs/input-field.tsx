"use client"

import * as React from "react"
import { useState, useCallback, useEffect } from "react"
import { cn } from "../../lib/utils"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Button } from "../ui/button"
import { useInputContext } from "../providers/input-provider"
import type { 
  TaskInputRequest, 
  ValidationError,
  InputResponse 
} from "@agentarea/core"

export interface InputFieldProps {
  request: TaskInputRequest
  onSubmit?: (response: InputResponse) => void
  onCancel?: () => void
  className?: string
  autoSubmit?: boolean
  showActions?: boolean
}

export function InputField({
  request,
  onSubmit,
  onCancel,
  className,
  autoSubmit = false,
  showActions = true
}: InputFieldProps) {
  const { 
    submitResponse, 
    validateInput, 
    validationErrors, 
    submissionStatus,
    clearValidationErrors 
  } = useInputContext()
  
  const [value, setValue] = useState<string>('')
  const [localErrors, setLocalErrors] = useState<ValidationError[]>([])
  
  const requestErrors = validationErrors.get(request.id) || []
  const status = submissionStatus.get(request.id) || 'idle'
  const isSubmitting = status === 'submitting'
  const isSubmitted = status === 'submitted'
  const allErrors = [...localErrors, ...requestErrors]
  const hasErrors = allErrors.length > 0
  
  // Determine input type based on request metadata or default to text
  const inputType = (request.metadata?.inputType as string) || 'text'
  const isMultiline = inputType === 'textarea' || (request.metadata?.multiline as boolean)
  const placeholder = (request.metadata?.placeholder as string) || request.prompt
  const maxLength = request.metadata?.maxLength as number
  const minLength = request.metadata?.minLength as number
  
  // Auto-submit when value meets requirements (if enabled)
  useEffect(() => {
    if (!autoSubmit || isSubmitting || isSubmitted || !value.trim()) return
    
    const validation = validateInput(request.id, value)
    if (validation.valid) {
      handleSubmit()
    }
  }, [value, autoSubmit, isSubmitting, isSubmitted, validateInput, request.id])
  
  const validateValue = useCallback((inputValue: string) => {
    const errors: ValidationError[] = []
    
    // Required validation
    if (request.required && !inputValue.trim()) {
      errors.push({
        code: 'REQUIRED',
        message: 'This field is required',
        field: 'value'
      })
    }
    
    // Length validations
    if (minLength && inputValue.length < minLength) {
      errors.push({
        code: 'MIN_LENGTH',
        message: `Minimum length is ${minLength} characters`,
        field: 'value',
        data: { minLength, actualLength: inputValue.length }
      })
    }
    
    if (maxLength && inputValue.length > maxLength) {
      errors.push({
        code: 'MAX_LENGTH',
        message: `Maximum length is ${maxLength} characters`,
        field: 'value',
        data: { maxLength, actualLength: inputValue.length }
      })
    }
    
    // Pattern validation
    const pattern = request.validation?.find(rule => rule.type === 'pattern')
    if (pattern && typeof pattern.value === 'string') {
      const regex = new RegExp(pattern.value)
      if (!regex.test(inputValue)) {
        errors.push({
          code: 'PATTERN',
          message: pattern.message || 'Invalid format',
          field: 'value',
          data: { pattern: pattern.value, value: inputValue }
        })
      }
    }
    
    // Email validation for email type
    if (inputType === 'email' && inputValue) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(inputValue)) {
        errors.push({
          code: 'INVALID_EMAIL',
          message: 'Please enter a valid email address',
          field: 'value'
        })
      }
    }
    
    // URL validation for url type
    if (inputType === 'url' && inputValue) {
      try {
        new URL(inputValue)
      } catch {
        errors.push({
          code: 'INVALID_URL',
          message: 'Please enter a valid URL',
          field: 'value'
        })
      }
    }
    
    return errors
  }, [request, inputType, minLength, maxLength])
  
  const handleValueChange = useCallback((newValue: string) => {
    setValue(newValue)
    
    // Clear previous errors
    setLocalErrors([])
    clearValidationErrors(request.id)
    
    // Validate on change for immediate feedback
    const errors = validateValue(newValue)
    if (errors.length > 0) {
      setLocalErrors(errors)
    }
  }, [validateValue, clearValidationErrors, request.id])
  
  const handleSubmit = useCallback(async () => {
    const errors = validateValue(value)
    setLocalErrors(errors)
    
    if (errors.length > 0) {
      return
    }
    
    try {
      clearValidationErrors(request.id)
      await submitResponse(request.id, value)
      
      if (onSubmit) {
        const response: InputResponse = {
          requestId: request.id,
          taskId: request.taskId,
          value,
          timestamp: new Date()
        }
        onSubmit(response)
      }
    } catch (error) {
      console.error('Field submission error:', error)
    }
  }, [value, validateValue, clearValidationErrors, submitResponse, request.id, request.taskId, onSubmit])
  
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel()
    }
  }, [onCancel])
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isMultiline && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }, [isMultiline, handleSubmit])
  
  if (isSubmitted) {
    return (
      <div className={cn("p-4 border rounded-lg bg-green-50 border-green-200", className)}>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
              <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26l2.974 2.99L8 2.193z"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-green-800">Response submitted successfully</span>
        </div>
        <div className="mt-2 text-sm text-green-700">
          <strong>Your response:</strong> {String(value)}
        </div>
      </div>
    )
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{request.prompt}</h3>
        {request.required && (
          <p className="text-sm text-muted-foreground">
            This field is required
          </p>
        )}
      </div>
      
      {/* Errors */}
      {hasErrors && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="text-sm text-destructive">
            {allErrors.map((error, index) => (
              <div key={index}>{error.message}</div>
            ))}
          </div>
        </div>
      )}
      
      {/* Input field */}
      <div className="space-y-2">
        {isMultiline ? (
          <Textarea
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSubmitting}
            className={cn(
              hasErrors && "border-destructive focus-visible:ring-destructive"
            )}
            maxLength={maxLength}
          />
        ) : (
          <Input
            type={inputType}
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSubmitting}
            className={cn(
              hasErrors && "border-destructive focus-visible:ring-destructive"
            )}
            maxLength={maxLength}
          />
        )}
        
        {/* Character count */}
        {maxLength && (
          <div className="text-xs text-muted-foreground text-right">
            {value.length}/{maxLength}
          </div>
        )}
      </div>
      
      {/* Actions */}
      {showActions && (
        <div className="flex justify-between">
          <div>
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
          
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || (request.required && !value.trim())}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      )}
      
      {/* Hints */}
      {!hasErrors && (
        <div className="text-xs text-muted-foreground">
          {isMultiline ? (
            <span>Press Shift+Enter for new line, Enter to submit</span>
          ) : (
            <span>Press Enter to submit</span>
          )}
        </div>
      )}
    </div>
  )
}