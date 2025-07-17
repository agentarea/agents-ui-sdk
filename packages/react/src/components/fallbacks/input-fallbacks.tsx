import React from 'react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Textarea } from '../ui/textarea'
import { Input } from '../ui/input'
import { cn } from '../../lib/utils'
import type { TaskInputRequest, InputResponse } from '@agentarea/core'

/**
 * Fallback renderer for unsupported input request types
 */
export interface InputFallbackProps {
  request: TaskInputRequest
  onSubmit?: (response: InputResponse) => void
  onCancel?: () => void
  error?: Error
  className?: string
}

export function InputFallback({
  request,
  onSubmit,
  onCancel,
  error,
  className
}: InputFallbackProps) {
  const [value, setValue] = React.useState<string>('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async () => {
    if (!onSubmit) return

    setIsSubmitting(true)
    try {
      const response: InputResponse = {
        requestId: request.id,
        taskId: request.taskId,
        value: value.trim(),
        timestamp: new Date()
      }
      await onSubmit(response)
    } catch (err) {
      console.error('Failed to submit input response:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getInputIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝'
      case 'selection': return '☑️'
      case 'approval': return '✅'
      case 'file': return '📎'
      case 'form': return '📋'
      case 'number': return '🔢'
      case 'date': return '📅'
      case 'email': return '📧'
      default: return '❓'
    }
  }

  return (
    <div className={cn(
      "border rounded-lg p-4 bg-yellow-50 border-yellow-200 space-y-4",
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-xl">{getInputIcon(request.type)}</span>
        <div className="flex-1">
          <h4 className="font-medium text-yellow-800">
            Unsupported Input Type
          </h4>
          <p className="text-sm text-yellow-700">
            Using basic text input for {request.type} type
          </p>
        </div>
        <Badge variant="outline" className="border-yellow-300 text-yellow-700">
          {request.type}
        </Badge>
      </div>

      {/* Error Information */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">⚠️</span>
            <span className="text-sm font-medium text-red-800">Input Error</span>
          </div>
          <p className="text-xs text-red-700">
            {error.message}
          </p>
        </div>
      )}

      {/* Request Information */}
      <div className="space-y-2">
        <div className="font-medium text-yellow-800">
          {request.prompt}
        </div>
        
        {request.required && (
          <Badge variant="destructive" className="text-xs">
            Required
          </Badge>
        )}

        {request.validation && request.validation.length > 0 && (
          <div className="text-xs text-yellow-700">
            <div className="font-medium mb-1">Validation rules:</div>
            <ul className="list-disc list-inside space-y-0.5">
              {request.validation.map((rule, index) => (
                <li key={index}>{rule.message}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Fallback Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-yellow-800">
          Your Response:
        </label>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter your response here..."
          className="bg-white border-yellow-300 focus:border-yellow-500"
          rows={3}
        />
        <div className="text-xs text-yellow-600">
          Note: This is a basic text input fallback. The original input type ({request.type}) is not supported.
        </div>
      </div>

      {/* Original Request Data */}
      {request.options && request.options.length > 0 && (
        <details className="border border-yellow-300 rounded">
          <summary className="p-3 cursor-pointer font-medium text-yellow-800 hover:bg-yellow-100">
            Show Original Options
          </summary>
          <div className="p-3 pt-0 space-y-1">
            {request.options.map((option, index) => (
              <div key={index} className="text-sm text-yellow-700">
                <strong>{option.label}:</strong> {String(option.value)}
                {option.description && (
                  <div className="text-xs text-yellow-600 ml-2">
                    {option.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Metadata */}
      {request.metadata && Object.keys(request.metadata).length > 0 && (
        <details className="border border-yellow-300 rounded">
          <summary className="p-3 cursor-pointer font-medium text-yellow-800 hover:bg-yellow-100">
            Show Metadata
          </summary>
          <div className="p-3 pt-0">
            <pre className="text-xs text-yellow-700 bg-white p-2 rounded border overflow-auto max-h-32">
              {JSON.stringify(request.metadata, null, 2)}
            </pre>
          </div>
        </details>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || (request.required && !value.trim())}
          className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Response'}
        </Button>
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="outline"
            className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Help Text */}
      <div className="text-xs text-yellow-600">
        This input type ({request.type}) is not fully supported. 
        Please provide your response as text, and it will be processed appropriately.
      </div>
    </div>
  )
}

/**
 * Basic text input fallback for any input request
 */
export interface BasicInputFallbackProps {
  request: TaskInputRequest
  onSubmit?: (response: InputResponse) => void
  onCancel?: () => void
  className?: string
}

export function BasicInputFallback({
  request,
  onSubmit,
  onCancel,
  className
}: BasicInputFallbackProps) {
  const [value, setValue] = React.useState<string>('')
  const [errors, setErrors] = React.useState<string[]>([])

  const validateInput = (inputValue: string): string[] => {
    const validationErrors: string[] = []
    
    if (!request.validation) return validationErrors

    for (const rule of request.validation) {
      switch (rule.type) {
        case 'required':
          if (!inputValue.trim()) {
            validationErrors.push(rule.message)
          }
          break
        case 'minLength':
          if (inputValue.length < (rule.value as number)) {
            validationErrors.push(rule.message)
          }
          break
        case 'maxLength':
          if (inputValue.length > (rule.value as number)) {
            validationErrors.push(rule.message)
          }
          break
        case 'pattern':
          if (!(new RegExp(rule.value as string)).test(inputValue)) {
            validationErrors.push(rule.message)
          }
          break
      }
    }

    return validationErrors
  }

  const handleSubmit = () => {
    const validationErrors = validateInput(value)
    setErrors(validationErrors)
    
    if (validationErrors.length === 0 && onSubmit) {
      const response: InputResponse = {
        requestId: request.id,
        taskId: request.taskId,
        value: value.trim(),
        timestamp: new Date()
      }
      onSubmit(response)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className={cn(
      "border rounded-lg p-4 bg-background space-y-3",
      className
    )}>
      <div className="flex items-center gap-2">
        <span className="text-lg">📝</span>
        <h4 className="font-medium">Text Input</h4>
        <Badge variant="secondary" className="text-xs">
          Basic Fallback
        </Badge>
      </div>

      <div className="text-sm text-muted-foreground">
        {request.prompt}
      </div>

      <div className="space-y-2">
        {request.type === 'text' ? (
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your response..."
            className={errors.length > 0 ? "border-destructive" : ""}
            rows={3}
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your response..."
            className={errors.length > 0 ? "border-destructive" : ""}
          />
        )}
        
        {errors.map((error, index) => (
          <div key={index} className="text-xs text-destructive">
            {error}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleSubmit}
          className="flex-1"
          disabled={request.required && !value.trim()}
        >
          Submit
        </Button>
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="outline"
          >
            Cancel
          </Button>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        Press Ctrl+Enter (Cmd+Enter on Mac) to submit quickly.
      </div>
    </div>
  )
}

/**
 * Error fallback for failed input rendering
 */
export interface InputErrorFallbackProps {
  request: TaskInputRequest
  error: Error
  onRetry?: () => void
  onSubmit?: (response: InputResponse) => void
  className?: string
}

export function InputErrorFallback({
  request,
  error,
  onRetry,
  onSubmit,
  className
}: InputErrorFallbackProps) {
  const [useBasicInput, setUseBasicInput] = React.useState(false)

  if (useBasicInput) {
    return (
      <BasicInputFallback
        request={request}
        onSubmit={onSubmit}
        onCancel={() => setUseBasicInput(false)}
        className={className}
      />
    )
  }

  return (
    <div className={cn(
      "border border-destructive/20 rounded-lg p-4 bg-destructive/5 space-y-3",
      className
    )}>
      <div className="flex items-center gap-3">
        <span className="text-xl">⚠️</span>
        <div>
          <h4 className="font-medium text-destructive">
            Input Render Failed
          </h4>
          <p className="text-sm text-muted-foreground">
            {error.message}
          </p>
        </div>
      </div>

      <div className="text-sm space-y-1">
        <div><strong>Request ID:</strong> {request.id}</div>
        <div><strong>Type:</strong> {request.type}</div>
        <div><strong>Required:</strong> {request.required ? 'Yes' : 'No'}</div>
      </div>

      <div className="bg-muted/50 rounded p-3">
        <div className="font-medium text-sm mb-1">Original Request:</div>
        <div className="text-sm text-muted-foreground">
          {request.prompt}
        </div>
      </div>

      <div className="flex gap-2">
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
          >
            Retry Render
          </Button>
        )}
        <Button
          onClick={() => setUseBasicInput(true)}
          variant="outline"
          size="sm"
        >
          Use Basic Input
        </Button>
      </div>
    </div>
  )
}

/**
 * Hook to determine if an input type is supported
 */
export function useInputSupport() {
  const supportedTypes = React.useMemo(() => new Set([
    'text',
    'selection',
    'approval',
    'file',
    'form'
  ]), [])

  const isSupported = React.useCallback((request: TaskInputRequest) => {
    return supportedTypes.has(request.type)
  }, [supportedTypes])

  const getFallbackComponent = React.useCallback((request: TaskInputRequest, error?: Error) => {
    if (error) {
      return InputErrorFallback
    }
    
    if (!isSupported(request)) {
      return InputFallback
    }

    // Default to basic input fallback
    return BasicInputFallback
  }, [isSupported])

  return {
    isSupported,
    getFallbackComponent,
    supportedTypes: Array.from(supportedTypes)
  }
}