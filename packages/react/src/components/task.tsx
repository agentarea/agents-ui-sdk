import * as React from "react"
import { cn } from "../lib/utils"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { Chat } from "./chat"
import { Input } from "./inputs"
import { Artifact } from "./artifacts"
import { useTask, useTaskCreation, useTaskList } from "../hooks/use-task"
import type { 
  Task as TaskType, 
  TaskStatus, 
  Message, 
  TaskInputRequest, 
  InputResponse,
  EnhancedArtifact,
  TaskWithInputs 
} from "@agentarea/core"

// Basic task input
export interface TaskInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onSend?: (value: string) => void
}

const TaskInput = React.forwardRef<HTMLTextAreaElement, TaskInputProps>(
  ({ onSend, onKeyDown, className, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        const value = e.currentTarget.value.trim()
        if (value && onSend) {
          onSend(value)
          e.currentTarget.value = ""
        }
      }
      onKeyDown?.(e)
    }

    return (
      <Textarea
        ref={ref}
        placeholder="Describe the task..."
        onKeyDown={handleKeyDown}
        className={cn("min-h-[80px]", className)}
        {...props}
      />
    )
  }
)
TaskInput.displayName = "Task.Input"

// Send task button
export interface TaskSendProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  taskInput?: string
}

const TaskSend = React.forwardRef<HTMLButtonElement, TaskSendProps>(
  ({ taskInput, onClick, children, ...props }, ref) => {
    const { createTask, isCreating } = useTaskCreation()

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (taskInput?.trim()) {
        await createTask({
          message: {
            role: "user",
            parts: [{ type: "text", content: taskInput }]
          }
        })
      }
      onClick?.(e)
    }

    return (
      <Button
        ref={ref}
        disabled={isCreating || !taskInput?.trim()}
        onClick={handleClick}
        {...props}
      >
        {children || (isCreating ? "Sending..." : "Send Task")}
      </Button>
    )
  }
)
TaskSend.displayName = "Task.Send"

// Task status indicator
export interface TaskStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  taskId?: string
  status?: TaskStatus
  variant?: "default" | "outline"
}

const TaskStatus = React.forwardRef<HTMLDivElement, TaskStatusProps>(
  ({ taskId, status: statusProp, variant = "default", children, className, ...props }, ref) => {
    const { task } = useTask(taskId)
    const status = statusProp || task?.status

    const getStatusVariant = (status?: TaskStatus) => {
      switch (status) {
        case "completed": return "default"
        case "failed": return "destructive"
        case "working": return "secondary"
        default: return "outline"
      }
    }

    return (
      <div ref={ref} className={className} {...props}>
        {children || (
          <Badge variant={getStatusVariant(status)}>
            {status}
          </Badge>
        )}
      </div>
    )
  }
)
TaskStatus.displayName = "Task.Status"

// Task progress indicator
export interface TaskProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  taskId?: string
  showPercentage?: boolean
  showDescription?: boolean
  showSteps?: boolean
}

const TaskProgress = React.forwardRef<HTMLDivElement, TaskProgressProps>(
  ({ 
    taskId, 
    showPercentage = true, 
    showDescription = true, 
    showSteps = true, 
    children, 
    className, 
    ...props 
  }, ref) => {
    const { task } = useTask(taskId)
    const progress = task?.progress

    if (!progress) return null

    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {children || (
          <>
            {showDescription && progress.description && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{progress.description}</span>
                {showPercentage && progress.percentage !== undefined && (
                  <span className="text-muted-foreground">{progress.percentage}%</span>
                )}
              </div>
            )}
            
            {progress.percentage !== undefined && (
              <Progress value={progress.percentage} className="h-2" />
            )}
            
            {showSteps && progress.step !== undefined && progress.totalSteps !== undefined && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Step {progress.step} of {progress.totalSteps}</span>
                <div className="flex gap-1 flex-1">
                  {Array.from({ length: progress.totalSteps }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex-1 h-1 rounded-full",
                        i < progress.step! ? "bg-primary" : "bg-muted"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    )
  }
)
TaskProgress.displayName = "Task.Progress"

// Task output/results
export interface TaskOutputProps extends React.HTMLAttributes<HTMLDivElement> {
  taskId?: string
  renderMarkdown?: boolean
}

const TaskOutput = React.forwardRef<HTMLDivElement, TaskOutputProps>(
  ({ taskId, renderMarkdown = true, children, className, ...props }, ref) => {
    const { task } = useTask(taskId)

    return (
      <div ref={ref} className={cn("space-y-3", className)} {...props}>
        {children || (
          <>
            {/* Display artifacts */}
            {task?.artifacts?.map((artifact, index) => (
              <div key={artifact.id || index} className="border rounded-lg p-4 bg-muted/50">
                <div className="font-medium text-sm mb-2">Type: {artifact.type}</div>
                {typeof artifact.content === "string" ? (
                  renderMarkdown ? (
                    <Chat.Markdown content={artifact.content} />
                  ) : (
                    <pre className="text-sm bg-background p-3 rounded border overflow-auto">
                      {artifact.content}
                    </pre>
                  )
                ) : (
                  <pre className="text-sm bg-background p-3 rounded border overflow-auto">
                    {JSON.stringify(artifact.content, null, 2)}
                  </pre>
                )}
              </div>
            ))}
            
            {/* Display messages */}
            {task?.messages?.map((message, index) => (
              <div key={index} className="space-y-2">
                {message.parts.map((part, partIndex) => (
                  <div key={partIndex}>
                    {part.type === "text" && (
                      renderMarkdown ? (
                        <Chat.Markdown content={part.content as string} />
                      ) : (
                        <div className="text-sm">{part.content as string}</div>
                      )
                    )}
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    )
  }
)
TaskOutput.displayName = "Task.Output"

// Cancel task button
export interface TaskCancelProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  taskId?: string
}

const TaskCancel = React.forwardRef<HTMLButtonElement, TaskCancelProps>(
  ({ taskId, onClick, children, ...props }, ref) => {
    const { task, cancelTask } = useTask(taskId)

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (taskId) {
        await cancelTask(taskId)
      }
      onClick?.(e)
    }

    const canCancel = task?.status === "working" || task?.status === "submitted"

    return (
      <Button
        ref={ref}
        variant="destructive"
        disabled={!canCancel}
        onClick={handleClick}
        {...props}
      >
        {children || "Cancel"}
      </Button>
    )
  }
)
TaskCancel.displayName = "Task.Cancel"

// Enhanced task chat interface
export interface TaskChatProps extends React.HTMLAttributes<HTMLDivElement> {
  taskId?: string
  autoScroll?: boolean
  maxHeight?: string
  enableMarkdown?: boolean
  enableFileUploads?: boolean
  enableToolCallApprovals?: boolean
  avatarAgent?: React.ReactNode
  avatarUser?: React.ReactNode
  onSendMessage?: (content: string, files?: File[]) => void
}

const TaskChat = React.forwardRef<HTMLDivElement, TaskChatProps>(
  ({ 
    taskId, 
    autoScroll = true,
    maxHeight = "500px",
    enableMarkdown = true,
    enableFileUploads = true,
    enableToolCallApprovals = true,
    avatarAgent = "🤖",
    avatarUser = "👤",
    onSendMessage,
    className,
    ...props 
  }, ref) => {
    const { task } = useTask(taskId)
    const { createTask, isCreating } = useTaskCreation()
    const [messages, setMessages] = React.useState<Message[]>([])
    const [isAgentTyping, setIsAgentTyping] = React.useState(false)

    // Get input requests and artifacts from enhanced task
    const taskWithInputs = task as TaskWithInputs
    const inputRequests = taskWithInputs?.inputRequests || []
    const activeInputRequests = inputRequests.filter(req => 
      !taskWithInputs?.inputResponses?.some(res => res.requestId === req.id)
    )

    // Update messages when task changes
    React.useEffect(() => {
      if (task?.messages) {
        setMessages(task.messages)
        setIsAgentTyping(task.status === "working")
      }
    }, [task])

    const handleSendMessage = async ({ text, files }: { text: string; files?: File[] }) => {
      const message: Message = {
        role: "user",
        parts: [
          { type: "text", content: text },
          ...(files || []).map(file => ({
            type: "file" as const,
            content: file.name,
            mimeType: file.type
          }))
        ]
      }

      // Add user message immediately
      setMessages(prev => [...prev, message])

      if (onSendMessage) {
        onSendMessage(text, files)
      } else {
        try {
          await createTask({
            message,
            context: { files: files?.map(f => ({ name: f.name, type: f.type, size: f.size })) }
          })
        } catch (error) {
          console.error("Failed to send message:", error)
        }
      }
    }

    const handleToolCallApproval = (toolCallId: string, approved: boolean) => {
      console.log(`Tool call ${toolCallId} ${approved ? "approved" : "rejected"}`)
    }

    const handleInputResponse = (requestId: string, response: InputResponse) => {
      console.log(`Input response for ${requestId}:`, response)
      // In a real implementation, this would send the response to the agent
    }

    return (
      <div 
        ref={ref} 
        className={cn("flex flex-col border rounded-lg bg-background", className)} 
        {...props}
      >
        <Chat.Root autoScroll={autoScroll} maxHeight={maxHeight} className="flex-1 p-4">
          {messages.map((message, index) => (
            <Chat.Message
              key={index}
              role={message.role}
              avatar={message.role === "agent" ? avatarAgent : avatarUser}
              timestamp={new Date()}
            >
              {message.parts.map((part, partIndex) => (
                <div key={partIndex}>
                  {part.type === "text" && (
                    enableMarkdown ? (
                      <Chat.Markdown content={part.content as string} />
                    ) : (
                      <div>{part.content as string}</div>
                    )
                  )}
                  
                  {part.type === "file" && (
                    <Chat.File
                      file={{
                        name: part.content as string,
                        type: part.mimeType || "unknown",
                        size: 0,
                        url: "#"
                      }}
                      onDownload={() => console.log("Download file")}
                      onPreview={() => console.log("Preview file")}
                    />
                  )}
                  
                  {part.type === "tool_call" && enableToolCallApprovals && (
                    <Chat.ToolCall
                      toolCall={part.content as any}
                      onApprove={(id) => handleToolCallApproval(id, true)}
                      onReject={(id) => handleToolCallApproval(id, false)}
                    />
                  )}
                </div>
              ))}
            </Chat.Message>
          ))}
          
          {/* Display active input requests in chat */}
          {activeInputRequests.map((inputRequest) => (
            <Chat.Message
              key={`input-${inputRequest.id}`}
              role="agent"
              avatar={avatarAgent}
              timestamp={inputRequest.createdAt}
            >
              <TaskInputRequest
                inputRequest={inputRequest}
                onResponse={handleInputResponse}
                className="border-0 bg-transparent p-0"
              />
            </Chat.Message>
          ))}
          
          {/* Display artifacts in chat */}
          {taskWithInputs?.enhancedArtifacts && taskWithInputs.enhancedArtifacts.length > 0 && (
            <Chat.Message
              role="agent"
              avatar={avatarAgent}
              timestamp={new Date()}
            >
              <TaskArtifacts
                artifacts={taskWithInputs.enhancedArtifacts}
                className="border-0 bg-transparent p-0"
                groupByType={false}
              />
            </Chat.Message>
          )}
          
          {isAgentTyping && (
            <Chat.Typing isTyping={true} avatar={avatarAgent} />
          )}
        </Chat.Root>
        
        <div className="p-4 border-t">
          <Chat.Input
            onSend={handleSendMessage}
            disabled={isCreating || activeInputRequests.length > 0}
            maxFiles={enableFileUploads ? 5 : 0}
            acceptedFileTypes="image/*,text/*,.pdf,.doc,.docx"
            placeholder={
              activeInputRequests.length > 0 
                ? "Please respond to the input request above..." 
                : "Type a message..."
            }
          />
        </div>
      </div>
    )
  }
)
TaskChat.displayName = "Task.Chat"

// Conditional rendering based on task state
export interface TaskIfProps extends React.HTMLAttributes<HTMLDivElement> {
  taskId?: string
  status?: TaskStatus | TaskStatus[]
  hasError?: boolean
  isCompleted?: boolean
  isWorking?: boolean
}

const TaskIf = React.forwardRef<HTMLDivElement, TaskIfProps>(
  ({ 
    taskId, 
    status: statusProp, 
    hasError, 
    isCompleted, 
    isWorking, 
    children, 
    ...props 
  }, ref) => {
    const { task } = useTask(taskId)

    if (!task) return null

    // Check status condition
    if (statusProp) {
      const statuses = Array.isArray(statusProp) ? statusProp : [statusProp]
      if (!statuses.includes(task.status)) return null
    }

    // Check other conditions
    if (hasError !== undefined && Boolean(task.error) !== hasError) return null
    if (isCompleted !== undefined && (task.status === "completed") !== isCompleted) return null
    if (isWorking !== undefined && (task.status === "working") !== isWorking) return null

    return (
      <div ref={ref} {...props}>
        {children}
      </div>
    )
  }
)
TaskIf.displayName = "Task.If"

// Task list with filtering
export interface TaskListProps extends React.HTMLAttributes<HTMLDivElement> {
  filter?: {
    status?: TaskStatus[]
    search?: string
  }
  sortBy?: "createdAt" | "updatedAt" | "status"
  sortOrder?: "asc" | "desc"
  maxItems?: number
  renderTask?: (task: TaskType) => React.ReactNode
}

const TaskList = React.forwardRef<HTMLDivElement, TaskListProps>(
  ({ 
    filter, 
    sortBy = "updatedAt", 
    sortOrder = "desc",
    maxItems,
    renderTask,
    className,
    ...props 
  }, ref) => {
    const { tasks } = useTaskList()
    
    // Apply filtering
    let filteredTasks = tasks.filter(task => {
      if (filter?.status && !filter.status.includes(task.status)) return false
      if (filter?.search) {
        const searchLower = filter.search.toLowerCase()
        const taskText = task.input.message.parts
          .map(part => part.content)
          .join(" ")
          .toLowerCase()
        if (!taskText.includes(searchLower)) return false
      }
      return true
    })
    
    // Apply sorting
    filteredTasks.sort((a, b) => {
      const aValue = a[sortBy]
      const bValue = b[sortBy]
      const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      return sortOrder === "asc" ? comparison : -comparison
    })
    
    // Apply limit
    if (maxItems) {
      filteredTasks = filteredTasks.slice(0, maxItems)
    }

    const defaultRenderTask = (task: TaskType) => (
      <div 
        key={task.id}
        className="border rounded-lg p-4 space-y-3 bg-background"
      >
        <div className="flex justify-between items-start">
          <span className="text-xs text-muted-foreground font-mono">{task.id}</span>
          <TaskStatus status={task.status} />
        </div>
        
        <div className="text-sm">
          {task.input.message.parts
            .filter(part => part.type === "text")
            .map((part, i) => (
              <div key={i}>{part.content as string}</div>
            ))
          }
        </div>
        
        {task.progress && (
          <TaskProgress 
            taskId={task.id}
            showPercentage={true} 
            showDescription={true} 
            showSteps={false}
          />
        )}
        
        <div className="text-xs text-muted-foreground">
          Created: {new Date(task.createdAt).toLocaleString()}
        </div>
      </div>
    )

    return (
      <div ref={ref} className={cn("space-y-3", className)} {...props}>
        {filteredTasks.map(task => 
          renderTask ? renderTask(task) : defaultRenderTask(task)
        )}
        
        {filteredTasks.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No tasks found
          </div>
        )}
      </div>
    )
  }
)
TaskList.displayName = "Task.List"

// Task input request display and handling
export interface TaskInputRequestProps extends React.HTMLAttributes<HTMLDivElement> {
  taskId?: string
  inputRequest?: TaskInputRequest
  onResponse?: (requestId: string, response: InputResponse) => void
  showMetadata?: boolean
}

const TaskInputRequest = React.forwardRef<HTMLDivElement, TaskInputRequestProps>(
  ({ 
    taskId, 
    inputRequest: inputRequestProp, 
    onResponse,
    showMetadata = false,
    children, 
    className, 
    ...props 
  }, ref) => {
    const { task } = useTask(taskId)
    const inputRequests = (task as TaskWithInputs)?.inputRequests || []
    const inputRequest = inputRequestProp || inputRequests[0] // Use first request if none specified

    if (!inputRequest) return null

    const handleResponse = (value: unknown) => {
      const response: InputResponse = {
        requestId: inputRequest.id,
        taskId: inputRequest.taskId,
        value,
        timestamp: new Date(),
      }
      onResponse?.(inputRequest.id, response)
    }

    return (
      <div 
        ref={ref} 
        className={cn("border rounded-lg p-4 bg-muted/50 space-y-4", className)} 
        {...props}
      >
        {children || (
          <>
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
            
            {/* Render appropriate input component based on type */}
            {inputRequest.type === 'text' && (
              <Input.Field
                request={inputRequest}
                onSubmit={(response) => handleResponse(response.value)}
              />
            )}
            
            {inputRequest.type === 'selection' && (
              <Input.Selection
                request={inputRequest}
                onSubmit={(response) => handleResponse(response.value)}
              />
            )}
            
            {inputRequest.type === 'approval' && (
              <Input.Approval
                request={inputRequest}
                onSubmit={(response) => handleResponse(response.value)}
              />
            )}
            
            {inputRequest.type === 'file' && (
              <Input.Upload
                request={inputRequest}
                onSubmit={(response) => handleResponse(response.value)}
              />
            )}
            
            {inputRequest.type === 'form' && (
              <Input.Form
                request={inputRequest}
                onSubmit={(response) => handleResponse(response.value)}
              />
            )}
            
            {showMetadata && inputRequest.metadata && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground">
                  Show metadata
                </summary>
                <pre className="mt-2 p-2 bg-background rounded border overflow-auto">
                  {JSON.stringify(inputRequest.metadata, null, 2)}
                </pre>
              </details>
            )}
            
            {inputRequest.timeout && (
              <div className="text-xs text-muted-foreground">
                Timeout: {new Date(inputRequest.createdAt.getTime() + inputRequest.timeout).toLocaleString()}
              </div>
            )}
          </>
        )}
      </div>
    )
  }
)
TaskInputRequest.displayName = "Task.InputRequest"

// Task artifacts display and management
export interface TaskArtifactsProps extends React.HTMLAttributes<HTMLDivElement> {
  taskId?: string
  artifacts?: EnhancedArtifact[]
  onDownload?: (artifact: EnhancedArtifact) => void
  onShare?: (artifact: EnhancedArtifact) => void
  onPreview?: (artifact: EnhancedArtifact) => void
  showMetadata?: boolean
  groupByType?: boolean
}

const TaskArtifacts = React.forwardRef<HTMLDivElement, TaskArtifactsProps>(
  ({ 
    taskId, 
    artifacts: artifactsProp,
    onDownload,
    onShare,
    onPreview,
    showMetadata = false,
    groupByType = false,
    children, 
    className, 
    ...props 
  }, ref) => {
    const { task } = useTask(taskId)
    const artifacts = artifactsProp || (task as TaskWithInputs)?.enhancedArtifacts || 
      task?.artifacts?.map(artifact => ({
        ...artifact,
        displayType: 'text' as const,
        downloadable: true,
        shareable: true
      })) || []

    if (artifacts.length === 0) return null

    // Group artifacts by type if requested
    const groupedArtifacts = groupByType 
      ? artifacts.reduce((groups, artifact) => {
          const type = artifact.displayType || 'text'
          if (!groups[type]) groups[type] = []
          groups[type].push(artifact)
          return groups
        }, {} as Record<string, EnhancedArtifact[]>)
      : { all: artifacts }

    return (
      <div 
        ref={ref} 
        className={cn("space-y-4", className)} 
        {...props}
      >
        {children || (
          <>
            <div className="flex items-center gap-2">
              <span className="text-base">📎</span>
              <span className="font-semibold">Artifacts ({artifacts.length})</span>
            </div>
            
            {Object.entries(groupedArtifacts).map(([type, typeArtifacts]) => (
              <div key={type} className="space-y-3">
                {groupByType && type !== 'all' && (
                  <div className="text-sm font-medium text-muted-foreground capitalize">
                    {type} ({typeArtifacts.length})
                  </div>
                )}
                
                {typeArtifacts.map((artifact, index) => (
                  <Artifact
                    key={artifact.id || index}
                    artifact={artifact}
                    onDownload={onDownload}
                    onShare={onShare}
                    onPreview={onPreview}
                    className="border rounded-lg"
                  />
                ))}
              </div>
            ))}
            
            {showMetadata && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground">
                  Show artifact metadata
                </summary>
                <div className="mt-2 space-y-2">
                  {artifacts.map((artifact, index) => (
                    <div key={artifact.id || index} className="p-2 bg-muted rounded">
                      <div className="font-medium">{artifact.id}</div>
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify({
                          type: artifact.type,
                          displayType: artifact.displayType,
                          size: 'size' in artifact ? artifact.size : undefined,
                          createdAt: 'createdAt' in artifact ? artifact.createdAt : undefined,
                          metadata: artifact.metadata
                        }, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </div>
    )
  }
)
TaskArtifacts.displayName = "Task.Artifacts"

// Export as namespace
export const Task = {
  Input: TaskInput,
  Send: TaskSend,
  Status: TaskStatus,
  Progress: TaskProgress,
  Output: TaskOutput,
  Cancel: TaskCancel,
  Chat: TaskChat,
  InputRequest: TaskInputRequest,
  Artifacts: TaskArtifacts,
  If: TaskIf,
  List: TaskList,
}