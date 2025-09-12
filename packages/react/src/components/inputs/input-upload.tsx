"use client"

import * as React from "react"
import { useState, useCallback, useRef } from "react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { Progress } from "../ui/progress"
import { useInputContext } from "../providers/input-provider"
import type { 
  TaskInputRequest, 
  ValidationError,
  InputResponse 
} from "@agentarea/core"

export interface FileUploadData {
  file: File
  url?: string
  metadata?: Record<string, unknown>
}

export interface InputUploadProps {
  request: TaskInputRequest
  onSubmit?: (response: InputResponse) => void
  onCancel?: () => void
  className?: string
  multiple?: boolean
  maxFileSize?: number // in bytes
  acceptedFileTypes?: string[]
  showPreview?: boolean
  uploadProgress?: number
  onUploadProgress?: (progress: number) => void
}

export function InputUpload({
  request,
  onSubmit,
  onCancel,
  className,
  multiple = false,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  acceptedFileTypes,
  showPreview = true,
  uploadProgress,
  onUploadProgress
}: InputUploadProps) {
  const { 
    submitResponse, 
    validationErrors, 
    submissionStatus,
    clearValidationErrors 
  } = useInputContext()
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [localErrors, setLocalErrors] = useState<ValidationError[]>([])
  const [previewUrls, setPreviewUrls] = useState<Map<string, string>>(new Map())
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const requestErrors = validationErrors.get(request.id) || []
  const status = submissionStatus.get(request.id) || 'idle'
  const isSubmitting = status === 'submitting'
  const isSubmitted = status === 'submitted'
  const allErrors = [...localErrors, ...requestErrors]
  const hasErrors = allErrors.length > 0
  
  // Parse upload settings from request metadata
  const isMultipleMode = multiple || (request.metadata?.multiple as boolean) || false
  const maxSize = (request.metadata?.maxFileSize as number) || maxFileSize
  const acceptedTypes = acceptedFileTypes || (request.metadata?.acceptedFileTypes as string[])
  const maxFiles = (request.metadata?.maxFiles as number) || (isMultipleMode ? 10 : 1)
  
  // Generate preview URLs for images
  React.useEffect(() => {
    const newPreviewUrls = new Map<string, string>()
    
    selectedFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file)
        newPreviewUrls.set(file.name, url)
      }
    })
    
    // Cleanup old URLs
    previewUrls.forEach((url, fileName) => {
      if (!selectedFiles.some(f => f.name === fileName)) {
        URL.revokeObjectURL(url)
      }
    })
    
    setPreviewUrls(newPreviewUrls)
    
    // Cleanup on unmount
    return () => {
      newPreviewUrls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [selectedFiles])
  
  const validateFiles = useCallback((files: File[]) => {
    const errors: ValidationError[] = []
    
    // Check file count
    if (files.length === 0 && request.required) {
      errors.push({
        code: 'REQUIRED',
        message: 'Please select at least one file',
        field: 'files'
      })
    }
    
    if (files.length > maxFiles) {
      errors.push({
        code: 'TOO_MANY_FILES',
        message: `You can only upload up to ${maxFiles} file${maxFiles > 1 ? 's' : ''}`,
        field: 'files',
        data: { maxFiles, actualFiles: files.length }
      })
    }
    
    // Validate each file
    files.forEach((file, index) => {
      // File size validation
      if (file.size > maxSize) {
        errors.push({
          code: 'FILE_TOO_LARGE',
          message: `${file.name} is too large. Maximum size is ${formatFileSize(maxSize)}`,
          field: `file_${index}`,
          data: { fileName: file.name, size: file.size, maxSize }
        })
      }
      
      // File type validation
      if (acceptedTypes && acceptedTypes.length > 0) {
        const isAccepted = acceptedTypes.some(type => {
          if (type.includes('/')) {
            // MIME type check
            return file.type === type
          } else if (type.startsWith('.')) {
            // Extension check
            return file.name.toLowerCase().endsWith(type.toLowerCase())
          } else {
            // General type check (e.g., 'image', 'video')
            return file.type.startsWith(type + '/')
          }
        })
        
        if (!isAccepted) {
          errors.push({
            code: 'INVALID_FILE_TYPE',
            message: `${file.name} is not an accepted file type. Accepted types: ${acceptedTypes.join(', ')}`,
            field: `file_${index}`,
            data: { fileName: file.name, fileType: file.type, acceptedTypes }
          })
        }
      }
    })
    
    return errors
  }, [request.required, maxFiles, maxSize, acceptedTypes])
  
  const handleFileSelection = useCallback((files: FileList | null) => {
    if (!files) return
    
    const fileArray = Array.from(files)
    setLocalErrors([])
    clearValidationErrors(request.id)
    
    if (isMultipleMode) {
      setSelectedFiles(prev => {
        const combined = [...prev, ...fileArray]
        const errors = validateFiles(combined)
        if (errors.length > 0) {
          setLocalErrors(errors)
          return prev // Don't update if validation fails
        }
        return combined
      })
    } else {
      const errors = validateFiles(fileArray)
      if (errors.length > 0) {
        setLocalErrors(errors)
        return
      }
      setSelectedFiles(fileArray)
    }
  }, [isMultipleMode, validateFiles, clearValidationErrors, request.id])
  
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files)
    }
  }, [handleFileSelection])
  
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelection(e.target.files)
  }, [handleFileSelection])
  
  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setLocalErrors([])
    clearValidationErrors(request.id)
  }, [clearValidationErrors, request.id])
  
  const handleSubmit = useCallback(async () => {
    const errors = validateFiles(selectedFiles)
    setLocalErrors(errors)
    
    if (errors.length > 0) {
      return
    }
    
    const uploadData: FileUploadData[] = selectedFiles.map(file => ({
      file,
      metadata: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }
    }))
    
    const responseValue = isMultipleMode ? uploadData : uploadData[0]
    
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
      console.error('Upload submission error:', error)
    }
  }, [selectedFiles, isMultipleMode, validateFiles, clearValidationErrors, submitResponse, request.id, request.taskId, onSubmit])
  
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel()
    }
  }, [onCancel])
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  if (isSubmitted) {
    return (
      <div className={cn("p-4 border rounded-lg bg-green-50 border-green-200", className)}>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
              <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26l2.974 2.99L8 2.193z"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-green-800">Files uploaded successfully</span>
        </div>
        <div className="mt-2 text-sm text-green-700">
          <strong>Uploaded:</strong> {selectedFiles.map(f => f.name).join(', ')}
        </div>
      </div>
    )
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{request.prompt}</h3>
        <div className="text-sm text-muted-foreground">
          {isMultipleMode ? `Select up to ${maxFiles} files` : 'Select a file'}
          {acceptedTypes && ` (${acceptedTypes.join(', ')})`}
          {` • Max size: ${formatFileSize(maxSize)}`}
        </div>
      </div>
      
      {/* Upload progress */}
      {isSubmitting && uploadProgress !== undefined && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} />
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
      
      {/* Drop zone */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          dragActive 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          isSubmitting && "opacity-50 pointer-events-none"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={isMultipleMode}
          accept={acceptedTypes?.join(',')}
          onChange={handleFileInputChange}
          disabled={isSubmitting}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-2">
          <svg className="mx-auto h-12 w-12 text-muted-foreground" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <p className="text-sm font-medium">
              {dragActive ? 'Drop files here' : 'Drag and drop files here, or click to select'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {acceptedTypes ? `Accepted: ${acceptedTypes.join(', ')}` : 'All file types accepted'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Selected files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Selected files:</h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center space-x-3 p-3 border rounded-lg">
                {/* File preview */}
                {showPreview && file.type.startsWith('image/') && previewUrls.has(file.name) && (
                  <img
                    src={previewUrls.get(file.name)}
                    alt={file.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                )}
                
                {/* File icon for non-images */}
                {(!showPreview || !file.type.startsWith('image/')) && (
                  <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                    <svg className="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                
                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                  </p>
                </div>
                
                {/* Remove button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(index)}
                  disabled={isSubmitting}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex justify-between pt-4">
        <div className="flex space-x-2">
          {selectedFiles.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedFiles([])}
              disabled={isSubmitting}
            >
              Clear Files
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
          disabled={isSubmitting || selectedFiles.length === 0}
        >
          {isSubmitting ? 'Uploading...' : 'Upload Files'}
        </Button>
      </div>
    </div>
  )
}