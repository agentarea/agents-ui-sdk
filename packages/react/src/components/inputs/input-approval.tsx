import * as React from "react"
import { useState, useCallback } from "react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { useInputContext } from "../providers/input-provider"
import type { 
  TaskInputRequest, 
  ValidationError,
  InputResponse 
} from "@agentarea/core"

export interface ApprovalResponse {
  approved: boolean
  reason?: string
  metadata?: Record<string, unknown>
}

export interface InputApprovalProps {
  request: TaskInputRequest
  onSubmit?: (response: InputResponse) => void
  onCancel?: () => void
  className?: string
  showReasonField?: boolean
  requireReasonForRejection?: boolean
  approveText?: string
  rejectText?: string
  contextData?: unknown
}

export function InputApproval({
  request,
  onSubmit,
  onCancel,
  className,
  showReasonField = true,
  requireReasonForRejection = true,
  approveText = "Approve",
  rejectText = "Reject",
  contextData
}: InputApprovalProps) {
  const { 
    submitResponse, 
    validationErrors, 
    submissionStatus,
    clearValidationErrors 
  } = useInputContext()
  
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | null>(null)
  const [reason, setReason] = useState<string>('')
  const [localErrors, setLocalErrors] = useState<ValidationError[]>([])
  
  const requestErrors = validationErrors.get(request.id) || []
  const status = submissionStatus.get(request.id) || 'idle'
  const isSubmitting = status === 'submitting'
  const isSubmitted = status === 'submitted'
  const allErrors = [...localErrors, ...requestErrors]
  const hasErrors = allErrors.length > 0
  
  // Parse context data from request metadata
  const context = contextData || request.metadata?.context
  const title: string = String(request.metadata?.title || request.prompt)
  const description: string | undefined = request.metadata?.description ? String(request.metadata.description) : undefined
  const details = request.metadata?.details
  
  const validateApproval = useCallback(() => {
    const errors: ValidationError[] = []
    
    if (!selectedAction) {
      errors.push({
        code: 'REQUIRED',
        message: 'Please select approve or reject',
        field: 'action'
      })
    }
    
    if (selectedAction === 'reject' && requireReasonForRejection && !reason.trim()) {
      errors.push({
        code: 'REQUIRED',
        message: 'Please provide a reason for rejection',
        field: 'reason'
      })
    }
    
    return errors
  }, [selectedAction, reason, requireReasonForRejection])
  
  const handleActionSelect = useCallback((action: 'approve' | 'reject') => {
    setSelectedAction(action)
    setLocalErrors([])
    clearValidationErrors(request.id)
    
    // Clear reason if switching to approve and reason is not always shown
    if (action === 'approve' && !showReasonField) {
      setReason('')
    }
  }, [clearValidationErrors, request.id, showReasonField])
  
  const handleReasonChange = useCallback((newReason: string) => {
    setReason(newReason)
    setLocalErrors([])
    clearValidationErrors(request.id)
  }, [clearValidationErrors, request.id])
  
  const handleSubmit = useCallback(async () => {
    const errors = validateApproval()
    setLocalErrors(errors)
    
    if (errors.length > 0) {
      return
    }
    
    const response: ApprovalResponse = {
      approved: selectedAction === 'approve',
      reason: reason.trim() || undefined,
      metadata: {
        timestamp: new Date().toISOString(),
        context: context || undefined
      }
    }
    
    try {
      clearValidationErrors(request.id)
      await submitResponse(request.id, response)
      
      if (onSubmit) {
        const inputResponse: InputResponse = {
          requestId: request.id,
          taskId: request.taskId,
          value: response,
          timestamp: new Date()
        }
        onSubmit(inputResponse)
      }
    } catch (error) {
      console.error('Approval submission error:', error)
    }
  }, [selectedAction, reason, context, validateApproval, clearValidationErrors, submitResponse, request.id, request.taskId, onSubmit])
  
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel()
    }
  }, [onCancel])
  
  if (isSubmitted) {
    const submittedResponse = selectedAction === 'approve'
    return (
      <div className={cn(
        "p-4 border rounded-lg",
        submittedResponse 
          ? "bg-green-50 border-green-200" 
          : "bg-red-50 border-red-200",
        className
      )}>
        <div className="flex items-center space-x-2">
          <div className={cn(
            "w-4 h-4 rounded-full flex items-center justify-center",
            submittedResponse ? "bg-green-500" : "bg-red-500"
          )}>
            {submittedResponse ? (
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26l2.974 2.99L8 2.193z"/>
              </svg>
            ) : (
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                <path d="M1.41 0L0 1.41l.72.72L2.5 4.13l1.78-1.78L4.28 0z"/>
              </svg>
            )}
          </div>
          <span className={cn(
            "text-sm font-medium",
            submittedResponse ? "text-green-800" : "text-red-800"
          )}>
            {submittedResponse ? 'Approved' : 'Rejected'}
          </span>
        </div>
        {reason && (
          <div className={cn(
            "mt-2 text-sm",
            submittedResponse ? "text-green-700" : "text-red-700"
          )}>
            <strong>Reason:</strong> {reason}
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      
      {/* Context display */}
      {context ? (
        <div className="p-3 bg-muted rounded-md">
          <h4 className="text-sm font-medium mb-2">Context:</h4>
          <div className="text-sm">
            {typeof context === 'string' ? (
              <p>{context}</p>
            ) : (
              <pre className="whitespace-pre-wrap text-xs">
                {JSON.stringify(context, null, 2)}
              </pre>
            )}
          </div>
        </div>
      ) : null}
      
      {/* Details */}
      {details ? (
        <div className="p-3 border rounded-md">
          <h4 className="text-sm font-medium mb-2">Details:</h4>
          <div className="text-sm">
            {typeof details === 'string' ? (
              <p>{details as string}</p>
            ) : (
              <pre className="whitespace-pre-wrap text-xs">
                {JSON.stringify(details, null, 2)}
              </pre>
            )}
          </div>
        </div>
      ) : null}
      
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
      
      {/* Action selection */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Your decision:</h4>
        <div className="flex space-x-3">
          <Button
            type="button"
            variant={selectedAction === 'approve' ? 'default' : 'outline'}
            onClick={() => handleActionSelect('approve')}
            disabled={isSubmitting}
            className={cn(
              selectedAction === 'approve' && "bg-green-600 hover:bg-green-700"
            )}
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {approveText}
          </Button>
          
          <Button
            type="button"
            variant={selectedAction === 'reject' ? 'destructive' : 'outline'}
            onClick={() => handleActionSelect('reject')}
            disabled={isSubmitting}
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            {rejectText}
          </Button>
        </div>
      </div>
      
      {/* Reason field */}
      {(showReasonField || selectedAction === 'reject') && (
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">
            Reason {selectedAction === 'reject' && requireReasonForRejection && (
              <span className="text-destructive">*</span>
            )}
          </label>
          <Textarea
            value={reason}
            onChange={(e) => handleReasonChange(e.target.value)}
            placeholder={
              selectedAction === 'approve' 
                ? "Optional: Add a comment about your approval..."
                : "Please explain why you are rejecting this..."
            }
            disabled={isSubmitting}
            className={cn(
              hasErrors && localErrors.some(e => e.field === 'reason') && 
              "border-destructive focus-visible:ring-destructive"
            )}
          />
        </div>
      )}
      
      {/* Actions */}
      <div className="flex justify-between pt-4">
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
          disabled={isSubmitting || !selectedAction}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Decision'}
        </Button>
      </div>
    </div>
  )
}