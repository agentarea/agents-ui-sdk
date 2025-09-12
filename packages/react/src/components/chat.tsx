import * as React from "react"
import { cn } from "../lib/utils"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Badge } from "./ui/badge"
import { Artifact } from "./artifacts"
import type { EnhancedArtifact } from "@agentarea/core"

// Chat container with auto-scrolling
export interface ChatRootProps extends React.HTMLAttributes<HTMLDivElement> {
  autoScroll?: boolean
  maxHeight?: string
}

const ChatRoot = React.forwardRef<HTMLDivElement, ChatRootProps>(
  ({ autoScroll = true, maxHeight = "400px", children, className, style, ...props }, ref) => {
    const scrollRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      if (autoScroll && scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    })

    return (
      <div 
        ref={ref} 
        className={cn(
          "flex flex-col overflow-hidden",
          className
        )}
        style={{ maxHeight, ...style }} 
        {...props}
      >
        <div 
          ref={scrollRef} 
          className="flex-1 overflow-y-auto scroll-smooth"
        >
          {children}
        </div>
      </div>
    )
  }
)
ChatRoot.displayName = "Chat.Root"

// Message container with artifact support
export interface ChatMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  role: "user" | "agent" | "system"
  timestamp?: Date
  avatar?: React.ReactNode
  isStreaming?: boolean
  artifacts?: EnhancedArtifact[]
  onDownloadArtifact?: (artifact: EnhancedArtifact) => void
  onShareArtifact?: (artifact: EnhancedArtifact) => void
  onPreviewArtifact?: (artifact: EnhancedArtifact) => void
}

const ChatMessage = React.forwardRef<HTMLDivElement, ChatMessageProps>(
  ({ 
    role, 
    timestamp, 
    avatar, 
    isStreaming, 
    artifacts,
    onDownloadArtifact,
    onShareArtifact,
    onPreviewArtifact,
    children, 
    className, 
    ...props 
  }, ref) => {
    const isUser = role === "user"
    
    return (
      <div 
        ref={ref}
        className={cn(
          "flex items-start gap-3 p-3 mb-2",
          isUser ? "flex-row-reverse" : "flex-row",
          className
        )}
        {...props}
      >
        {avatar && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
            {avatar}
          </div>
        )}
        
        <div 
          className={cn(
            "max-w-[70%] rounded-lg relative",
            isUser 
              ? "ml-auto" 
              : ""
          )}
        >
          {/* Main message content */}
          <div 
            className={cn(
              "px-4 py-3 rounded-lg",
              isUser 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground"
            )}
          >
            {children}
            
            {isStreaming && (
              <span className="inline-block ml-1 animate-pulse">●</span>
            )}
            
            {timestamp && (
              <div 
                className={cn(
                  "text-xs opacity-70 mt-1",
                  isUser ? "text-right" : "text-left"
                )}
                suppressHydrationWarning
              >
                {timestamp.toLocaleTimeString()}
              </div>
            )}
          </div>
          
          {/* Artifacts rendered below the message */}
          {artifacts && artifacts.length > 0 && (
            <div className="mt-2 space-y-2">
              {artifacts.map((artifact, index) => (
                <div
                  key={artifact.id || index}
                  className={cn(
                    "rounded-lg overflow-hidden",
                    isUser ? "bg-primary/10" : "bg-background"
                  )}
                >
                  <Artifact
                    artifact={artifact}
                    onDownload={onDownloadArtifact}
                    onShare={onShareArtifact}
                    onPreview={onPreviewArtifact}
                    className="border-0"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }
)
ChatMessage.displayName = "Chat.Message"

// Markdown content renderer (simplified)
export interface ChatMarkdownProps extends React.HTMLAttributes<HTMLDivElement> {
  content: string
}

const ChatMarkdown = React.forwardRef<HTMLDivElement, ChatMarkdownProps>(
  ({ content, className, ...props }, ref) => {
    // Simple markdown parser - in production, use react-markdown
    const parseMarkdown = (text: string) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
        .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
          return `<pre class="bg-muted p-3 rounded-md overflow-x-auto my-2"><code class="language-${lang || ''}">${code.trim()}</code></pre>`
        })
    }

    return (
      <div 
        ref={ref}
        className={cn("prose prose-sm max-w-none", className)}
        dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
        {...props}
      />
    )
  }
)
ChatMarkdown.displayName = "Chat.Markdown"

// File attachment display
export interface ChatFileProps extends React.HTMLAttributes<HTMLDivElement> {
  file: {
    name: string
    size: number
    type: string
    url?: string
  }
  onDownload?: () => void
  onPreview?: () => void
}

const ChatFile = React.forwardRef<HTMLDivElement, ChatFileProps>(
  ({ file, onDownload, onPreview, className, ...props }, ref) => {
    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return "0 Bytes"
      const k = 1024
      const sizes = ["Bytes", "KB", "MB", "GB"]
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    }

    const getFileIcon = (type: string) => {
      if (type.startsWith("image/")) return "🖼️"
      if (type.includes("pdf")) return "📄"
      if (type.includes("text")) return "📝"
      if (type.includes("video")) return "🎥"
      if (type.includes("audio")) return "🎵"
      return "📎"
    }

    return (
      <div 
        ref={ref}
        className={cn(
          "flex items-center gap-3 p-3 border rounded-lg bg-background my-2",
          className
        )}
        {...props}
      >
        <span className="text-xl">{getFileIcon(file.type)}</span>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm" style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{file.name}</div>
          <div className="text-xs text-muted-foreground">
            {formatFileSize(file.size)} • {file.type}
          </div>
        </div>
        
        <div className="flex gap-2">
          {onPreview && (
            <Button variant="outline" size="sm" onClick={onPreview}>
              Preview
            </Button>
          )}
          {onDownload && (
            <Button variant="outline" size="sm" onClick={onDownload}>
              Download
            </Button>
          )}
        </div>
      </div>
    )
  }
)
ChatFile.displayName = "Chat.File"

// Tool call display with approval interface
export interface ChatToolCallProps extends React.HTMLAttributes<HTMLDivElement> {
  toolCall: {
    id: string
    name: string
    parameters: Record<string, any>
    status: "pending" | "approved" | "rejected" | "executed"
    result?: any
  }
  onApprove?: (toolCallId: string) => void
  onReject?: (toolCallId: string) => void
  requiresApproval?: boolean
}

const ChatToolCall = React.forwardRef<HTMLDivElement, ChatToolCallProps>(
  ({ toolCall, onApprove, onReject, requiresApproval = true, className, ...props }, ref) => {
    const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
      switch (status) {
        case "approved": return "default"
        case "rejected": return "destructive"
        case "executed": return "secondary"
        default: return "secondary"
      }
    }

    return (
      <div 
        ref={ref}
        className={cn(
          "border rounded-lg p-4 my-2 bg-muted/50",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">🔧</span>
          <span className="font-semibold">Tool Call: {toolCall.name}</span>
          <Badge variant={getStatusVariant(toolCall.status)}>
            {toolCall.status.toUpperCase()}
          </Badge>
        </div>
        
        <div className="mb-3">
          <div className="font-medium text-sm mb-1">Parameters:</div>
          <pre className="text-xs bg-background p-2 rounded border overflow-auto">
            {JSON.stringify(toolCall.parameters, null, 2)}
          </pre>
        </div>
        
        {toolCall.result && (
          <div className="mb-3">
            <div className="font-medium text-sm mb-1">Result:</div>
            <pre className="text-xs bg-background p-2 rounded border overflow-auto">
              {JSON.stringify(toolCall.result, null, 2)}
            </pre>
          </div>
        )}
        
        {requiresApproval && toolCall.status === "pending" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onApprove?.(toolCall.id)}
            >
              ✓ Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject?.(toolCall.id)}
            >
              ✗ Reject
            </Button>
          </div>
        )}
      </div>
    )
  }
)
ChatToolCall.displayName = "Chat.ToolCall"

// Input with file upload
export interface ChatInputProps extends React.HTMLAttributes<HTMLDivElement> {
  onSend?: (message: { text: string; files?: File[] }) => void
  placeholder?: string
  disabled?: boolean
  maxFiles?: number
  acceptedFileTypes?: string
}

const ChatInput = React.forwardRef<HTMLDivElement, ChatInputProps>(
  ({ 
    onSend, 
    placeholder = "Type a message...", 
    disabled, 
    maxFiles = 5, 
    acceptedFileTypes,
    className,
    ...props 
  }, ref) => {
    const [message, setMessage] = React.useState("")
    const [files, setFiles] = React.useState<File[]>([])
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleSend = () => {
      if (message.trim() || files.length > 0) {
        onSend?.({ text: message.trim(), files: files.length > 0 ? files : undefined })
        setMessage("")
        setFiles([])
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleSend()
      }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || [])
      setFiles(prev => [...prev, ...selectedFiles].slice(0, maxFiles))
    }

    const removeFile = (index: number) => {
      setFiles(prev => prev.filter((_, i) => i !== index))
    }

    return (
      <div 
        ref={ref}
        className={cn(
          "border rounded-lg p-3 bg-background",
          className
        )}
        {...props}
      >
        {/* File attachments */}
        {files.length > 0 && (
          <div className="mb-2 space-y-1">
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-2 px-2 py-1 bg-muted rounded text-sm">
                <span className="flex-1 truncate">{file.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFile(index)}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-end gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[60px] resize-none"
            rows={1}
          />
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || files.length >= maxFiles}
          >
            📎
          </Button>
          
          <Button
            onClick={handleSend}
            disabled={disabled || (!message.trim() && files.length === 0)}
            size="icon"
          >
            ↑
          </Button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFileTypes}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    )
  }
)
ChatInput.displayName = "Chat.Input"

// Typing indicator
export interface ChatTypingProps extends React.HTMLAttributes<HTMLDivElement> {
  isTyping?: boolean
  avatar?: React.ReactNode
}

const ChatTyping = React.forwardRef<HTMLDivElement, ChatTypingProps>(
  ({ isTyping, avatar, className, ...props }, ref) => {
    if (!isTyping) return null

    return (
      <div 
        ref={ref}
        className={cn(
          "flex items-center gap-3 p-3 mb-2",
          className
        )}
        {...props}
      >
        {avatar && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
            {avatar}
          </div>
        )}
        
        <div className="px-4 py-3 bg-muted rounded-lg flex items-center gap-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    )
  }
)
ChatTyping.displayName = "Chat.Typing"

// Input form for structured input collection in chat
export interface ChatInputFormProps extends React.HTMLAttributes<HTMLDivElement> {
  inputRequest: {
    id: string
    type: 'text' | 'selection' | 'approval' | 'file' | 'form'
    prompt: string
    required: boolean
    validation?: Array<{
      type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom'
      value?: unknown
      message: string
    }>
    options?: Array<{
      value: unknown
      label: string
      description?: string
      disabled?: boolean
    }>
    metadata?: Record<string, unknown>
  }
  onSubmit?: (value: unknown) => void
  onCancel?: () => void
  disabled?: boolean
}

const ChatInputForm = React.forwardRef<HTMLDivElement, ChatInputFormProps>(
  ({ 
    inputRequest, 
    onSubmit, 
    onCancel, 
    disabled,
    className, 
    ...props 
  }, ref) => {
    const [value, setValue] = React.useState<unknown>("")
    const [errors, setErrors] = React.useState<string[]>([])

    const validateInput = (inputValue: unknown): string[] => {
      const validationErrors: string[] = []
      
      if (!inputRequest.validation) return validationErrors

      for (const rule of inputRequest.validation) {
        switch (rule.type) {
          case 'required':
            if (!inputValue || (typeof inputValue === 'string' && !inputValue.trim())) {
              validationErrors.push(rule.message)
            }
            break
          case 'minLength':
            if (typeof inputValue === 'string' && inputValue.length < (rule.value as number)) {
              validationErrors.push(rule.message)
            }
            break
          case 'maxLength':
            if (typeof inputValue === 'string' && inputValue.length > (rule.value as number)) {
              validationErrors.push(rule.message)
            }
            break
          case 'pattern':
            if (typeof inputValue === 'string' && !(new RegExp(rule.value as string)).test(inputValue)) {
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
      
      if (validationErrors.length === 0) {
        onSubmit?.(value)
      }
    }

    const handleCancel = () => {
      setValue("")
      setErrors([])
      onCancel?.()
    }

    return (
      <div 
        ref={ref}
        className={cn(
          "border rounded-lg p-4 bg-muted/50 space-y-3",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📝</span>
          <span className="font-semibold">Input Required</span>
          {inputRequest.required && (
            <Badge variant="destructive" className="text-xs">Required</Badge>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground">
          {inputRequest.prompt}
        </div>
        
        {/* Text input */}
        {inputRequest.type === 'text' && (
          <div className="space-y-2">
            <Textarea
              value={value as string}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter your response..."
              disabled={disabled}
              className={errors.length > 0 ? "border-destructive" : ""}
            />
            {errors.map((error, index) => (
              <div key={index} className="text-xs text-destructive">{error}</div>
            ))}
          </div>
        )}
        
        {/* Selection input */}
        {inputRequest.type === 'selection' && (
          <div className="space-y-2">
            {inputRequest.options?.map((option, index) => (
              <label key={index} className="flex items-center gap-2 cursor-pointer">
                <input
                  type={inputRequest.metadata?.multiple ? "checkbox" : "radio"}
                  name={`selection-${inputRequest.id}`}
                  value={String(option.value)}
                  disabled={disabled || option.disabled}
                  onChange={(e) => {
                    if (inputRequest.metadata?.multiple) {
                      const currentValues = Array.isArray(value) ? value : []
                      if (e.target.checked) {
                        setValue([...currentValues, option.value])
                      } else {
                        setValue(currentValues.filter(v => v !== option.value))
                      }
                    } else {
                      setValue(option.value)
                    }
                  }}
                />
                <div>
                  <div className="text-sm">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  )}
                </div>
              </label>
            ))}
            {errors.map((error, index) => (
              <div key={index} className="text-xs text-destructive">{error}</div>
            ))}
          </div>
        )}
        
        {/* Approval input */}
        {inputRequest.type === 'approval' && (
          <div className="flex gap-2">
            <Button
              onClick={() => onSubmit?.(true)}
              disabled={disabled}
              className="flex-1"
            >
              ✓ Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => onSubmit?.(false)}
              disabled={disabled}
              className="flex-1"
            >
              ✗ Reject
            </Button>
          </div>
        )}
        
        {/* File input */}
        {inputRequest.type === 'file' && (
          <div className="space-y-2">
            <input
              type="file"
              multiple={inputRequest.metadata?.multiple as boolean}
              accept={inputRequest.metadata?.acceptedTypes as string}
              onChange={(e) => setValue(Array.from(e.target.files || []))}
              disabled={disabled}
              className="w-full"
            />
            {errors.map((error, index) => (
              <div key={index} className="text-xs text-destructive">{error}</div>
            ))}
          </div>
        )}
        
        {/* Form input */}
        {inputRequest.type === 'form' && (
          <div className="space-y-3">
            {(inputRequest.metadata?.fields as any[] || []).map((field: any, index: number) => (
              <div key={index} className="space-y-1">
                <label className="text-sm font-medium">{field.label}</label>
                <Input
                  type={field.type || 'text'}
                  placeholder={field.placeholder}
                  onChange={(e) => {
                    const formValue = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
                    setValue({ ...formValue, [field.name]: e.target.value })
                  }}
                  disabled={disabled}
                />
              </div>
            ))}
            {errors.map((error, index) => (
              <div key={index} className="text-xs text-destructive">{error}</div>
            ))}
          </div>
        )}
        
        {/* Action buttons for non-approval types */}
        {inputRequest.type !== 'approval' && (
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={disabled}
              className="flex-1"
            >
              Submit
            </Button>
            {onCancel && (
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={disabled}
              >
                Cancel
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }
)
ChatInputForm.displayName = "Chat.InputForm"

// Import Block components and useTask hook
import { Block } from './blocks'
import { useTask } from '../hooks/use-task'

// Simple chat component displaying communication blocks
export interface ChatSimpleProps extends React.HTMLAttributes<HTMLDivElement> {
  taskId?: string
  autoScroll?: boolean
  maxHeight?: string
  showMetadata?: boolean
  showTimestamp?: boolean
  showRouting?: boolean
  expandable?: boolean
}

const ChatSimple = React.forwardRef<HTMLDivElement, ChatSimpleProps>(
  ({ 
    taskId,
    autoScroll = true,
    maxHeight = "400px",
    showMetadata = true,
    showTimestamp = true,
    showRouting = true,
    expandable = false,
    className,
    ...props 
  }, ref) => {
    const { communicationBlocks } = useTask(taskId)
    const scrollRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      if (autoScroll && scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    })

    return (
      <div 
        ref={ref}
        className={cn(
          "flex flex-col overflow-hidden border rounded-lg bg-background",
          className
        )}
        style={{ maxHeight, ...props.style }}
        {...props}
      >
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto scroll-smooth p-4 space-y-3"
        >
          {communicationBlocks.length > 0 ? (
            communicationBlocks.map((block) => (
              <Block.Message
                key={block.id}
                message={block}
                showMetadata={showMetadata}
                showTimestamp={showTimestamp}
                showRouting={showRouting}
                expandable={expandable}
              />
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              {taskId ? (
                "No communication blocks available for this task."
              ) : (
                "No active task. Create a task to see communication blocks."
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
)
ChatSimple.displayName = "Chat.Simple"

export const Chat = {
  Root: ChatRoot,
  Message: ChatMessage,
  Markdown: ChatMarkdown,
  File: ChatFile,
  ToolCall: ChatToolCall,
  Input: ChatInput,
  InputForm: ChatInputForm,
  Typing: ChatTyping,
  Simple: ChatSimple,
}