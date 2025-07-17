import * as React from "react"
import { useState, useCallback, useMemo } from "react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { useInputContext } from "../providers/input-provider"
import type { 
  TaskInputRequest, 
  InputOption,
  ValidationError,
  InputResponse 
} from "@agentarea/core"

export interface InputSelectionProps {
  request: TaskInputRequest
  onSubmit?: (response: InputResponse) => void
  onCancel?: () => void
  className?: string
  multiSelect?: boolean
  searchable?: boolean
  maxSelections?: number
  showSelectedCount?: boolean
}

export function InputSelection({
  request,
  onSubmit,
  onCancel,
  className,
  multiSelect = false,
  searchable = true,
  maxSelections,
  showSelectedCount = true
}: InputSelectionProps) {
  const { 
    submitResponse, 
    validationErrors, 
    submissionStatus,
    clearValidationErrors 
  } = useInputContext()
  
  const [selectedValues, setSelectedValues] = useState<unknown[]>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [localErrors, setLocalErrors] = useState<ValidationError[]>([])
  
  const requestErrors = validationErrors.get(request.id) || []
  const status = submissionStatus.get(request.id) || 'idle'
  const isSubmitting = status === 'submitting'
  const isSubmitted = status === 'submitted'
  const allErrors = [...localErrors, ...requestErrors]
  const hasErrors = allErrors.length > 0
  
  // Parse options from request
  const options = request.options || []
  const isMultiSelectMode = multiSelect || (request.metadata?.multiSelect as boolean) || false
  const isSearchableMode = searchable && (request.metadata?.searchable !== false)
  const maxSelectionsLimit = maxSelections || (request.metadata?.maxSelections as number)
  const minSelections = (request.metadata?.minSelections as number) || (request.required ? 1 : 0)
  
  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options
    
    const query = searchQuery.toLowerCase()
    return options.filter(option => 
      option.label.toLowerCase().includes(query) ||
      (option.description && option.description.toLowerCase().includes(query))
    )
  }, [options, searchQuery])
  
  // Get selected options for display
  const selectedOptions = useMemo(() => {
    return options.filter(option => selectedValues.includes(option.value))
  }, [options, selectedValues])
  
  const validateSelection = useCallback(() => {
    const errors: ValidationError[] = []
    
    if (minSelections > 0 && selectedValues.length < minSelections) {
      errors.push({
        code: 'MIN_SELECTIONS',
        message: `Please select at least ${minSelections} option${minSelections > 1 ? 's' : ''}`,
        field: 'selection',
        data: { minSelections, actualSelections: selectedValues.length }
      })
    }
    
    if (maxSelectionsLimit && selectedValues.length > maxSelectionsLimit) {
      errors.push({
        code: 'MAX_SELECTIONS',
        message: `Please select no more than ${maxSelectionsLimit} option${maxSelectionsLimit > 1 ? 's' : ''}`,
        field: 'selection',
        data: { maxSelections: maxSelectionsLimit, actualSelections: selectedValues.length }
      })
    }
    
    // Validate that all selected values are valid options
    const validValues = options.map(opt => opt.value)
    const invalidValues = selectedValues.filter(value => !validValues.includes(value))
    if (invalidValues.length > 0) {
      errors.push({
        code: 'INVALID_SELECTION',
        message: 'Some selected options are no longer valid',
        field: 'selection',
        data: { invalidValues }
      })
    }
    
    return errors
  }, [selectedValues, minSelections, maxSelectionsLimit, options])
  
  const handleOptionToggle = useCallback((option: InputOption) => {
    if (option.disabled) return
    
    setLocalErrors([])
    clearValidationErrors(request.id)
    
    if (isMultiSelectMode) {
      setSelectedValues(prev => {
        const isSelected = prev.includes(option.value)
        if (isSelected) {
          return prev.filter(value => value !== option.value)
        } else {
          // Check max selections limit
          if (maxSelectionsLimit && prev.length >= maxSelectionsLimit) {
            setLocalErrors([{
              code: 'MAX_SELECTIONS',
              message: `You can only select up to ${maxSelectionsLimit} options`,
              field: 'selection'
            }])
            return prev
          }
          return [...prev, option.value]
        }
      })
    } else {
      // Single select mode
      setSelectedValues([option.value])
    }
  }, [isMultiSelectMode, maxSelectionsLimit, clearValidationErrors, request.id])
  
  const handleClearSelection = useCallback(() => {
    setSelectedValues([])
    setLocalErrors([])
    clearValidationErrors(request.id)
  }, [clearValidationErrors, request.id])
  
  const handleSubmit = useCallback(async () => {
    const errors = validateSelection()
    setLocalErrors(errors)
    
    if (errors.length > 0) {
      return
    }
    
    const responseValue = isMultiSelectMode ? selectedValues : selectedValues[0]
    
    try {
      clearValidationErrors(request.id)
      await submitResponse(request.id, responseValue)
      
      if (onSubmit) {
        const response: InputResponse = {
          requestId: request.id,
          taskId: request.taskId,
          value: responseValue,
          timestamp: new Date()
        }
        onSubmit(response)
      }
    } catch (error) {
      console.error('Selection submission error:', error)
    }
  }, [selectedValues, isMultiSelectMode, validateSelection, clearValidationErrors, submitResponse, request.id, request.taskId, onSubmit])
  
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
          <span className="text-sm font-medium text-green-800">Selection submitted successfully</span>
        </div>
        <div className="mt-2 text-sm text-green-700">
          <strong>Selected:</strong> {selectedOptions.map(opt => opt.label).join(', ')}
        </div>
      </div>
    )
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{request.prompt}</h3>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {isMultiSelectMode ? 'Select one or more options' : 'Select one option'}
            {request.required && ' (required)'}
          </span>
          {showSelectedCount && selectedValues.length > 0 && (
            <span>
              {selectedValues.length} selected
              {maxSelectionsLimit && ` of ${maxSelectionsLimit} max`}
            </span>
          )}
        </div>
      </div>
      
      {/* Search */}
      {isSearchableMode && options.length > 5 && (
        <div className="space-y-2">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search options..."
            disabled={isSubmitting}
            className="w-full"
          />
        </div>
      )}
      
      {/* Selected options display (for multi-select) */}
      {isMultiSelectMode && selectedValues.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Selected options:</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              disabled={isSubmitting}
            >
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedOptions.map((option) => (
              <div
                key={String(option.value)}
                className="flex items-center space-x-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
              >
                <span>{option.label}</span>
                <button
                  type="button"
                  onClick={() => handleOptionToggle(option)}
                  disabled={isSubmitting}
                  className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
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
      
      {/* Options list */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredOptions.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            {searchQuery ? 'No options match your search' : 'No options available'}
          </div>
        ) : (
          filteredOptions.map((option) => {
            const isSelected = selectedValues.includes(option.value)
            const isDisabled = option.disabled || isSubmitting
            
            return (
              <div
                key={String(option.value)}
                className={cn(
                  "flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors",
                  isSelected 
                    ? "border-primary bg-primary/5" 
                    : "border-input hover:bg-accent",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !isDisabled && handleOptionToggle(option)}
              >
                <div className="flex items-center pt-0.5">
                  {isMultiSelectMode ? (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // Handled by onClick
                      disabled={isDisabled}
                      className="h-4 w-4 rounded border border-input"
                    />
                  ) : (
                    <input
                      type="radio"
                      checked={isSelected}
                      onChange={() => {}} // Handled by onClick
                      disabled={isDisabled}
                      className="h-4 w-4 border border-input"
                    />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {option.description}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
      
      {/* Actions */}
      <div className="flex justify-between pt-4">
        <div className="flex space-x-2">
          {selectedValues.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClearSelection}
              disabled={isSubmitting}
            >
              Clear Selection
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
        
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || selectedValues.length === 0}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Selection'}
        </Button>
      </div>
    </div>
  )
}