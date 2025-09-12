"use client"

import { useState, useCallback, useEffect } from 'react'
import { useAgentContext } from '../components/providers/agent-provider'
import type { 
  EnhancedArtifact,
  ArtifactMetadata,
  TaskWithInputs
} from '@agentarea/core'

// Artifact management hook
export function useArtifacts(taskId?: string) {
  const { runtime, tasks } = useAgentContext()
  const [downloadProgress, setDownloadProgress] = useState<Map<string, DownloadProgress>>(new Map())
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map())
  const [error, setError] = useState<Error | null>(null)

  // Get artifacts from specific task or all tasks
  const artifacts = taskId 
    ? ((tasks.get(taskId) as TaskWithInputs)?.enhancedArtifacts || [])
    : Array.from(tasks.values()).flatMap(task => 
        (task as TaskWithInputs).enhancedArtifacts || []
      )

  const downloadArtifact = useCallback(async (artifactId: string): Promise<Blob> => {
    if (!runtime) {
      throw new Error('No runtime available')
    }

    setError(null)
    setDownloadProgress(prev => new Map(prev.set(artifactId, { 
      artifactId, 
      progress: 0, 
      status: 'downloading' 
    })))

    try {
      const blob = await runtime.downloadArtifact(artifactId)
      
      setDownloadProgress(prev => new Map(prev.set(artifactId, { 
        artifactId, 
        progress: 100, 
        status: 'completed' 
      })))
      
      return blob
    } catch (err) {
      const error = err as Error
      setError(error)
      setDownloadProgress(prev => new Map(prev.set(artifactId, { 
        artifactId, 
        progress: 0, 
        status: 'error',
        error: error.message
      })))
      throw error
    }
  }, [runtime])

  const uploadArtifact = useCallback(async (file: File, metadata?: ArtifactMetadata): Promise<EnhancedArtifact> => {
    if (!runtime) {
      throw new Error('No runtime available')
    }

    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setError(null)
    setUploadProgress(prev => new Map(prev.set(uploadId, {
      uploadId,
      fileName: file.name,
      fileSize: file.size,
      progress: 0,
      status: 'uploading'
    })))

    try {
      // Simulate progress updates (in real implementation, this would come from the runtime)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev.get(uploadId)
          if (current && current.progress < 90) {
            return new Map(prev.set(uploadId, {
              ...current,
              progress: current.progress + 10
            }))
          }
          return prev
        })
      }, 100)

      const artifact = await runtime.uploadArtifact(file, metadata)
      
      clearInterval(progressInterval)
      setUploadProgress(prev => new Map(prev.set(uploadId, {
        uploadId,
        fileName: file.name,
        fileSize: file.size,
        progress: 100,
        status: 'completed',
        artifactId: artifact.id
      })))
      
      return artifact
    } catch (err) {
      const error = err as Error
      setError(error)
      setUploadProgress(prev => new Map(prev.set(uploadId, {
        uploadId,
        fileName: file.name,
        fileSize: file.size,
        progress: 0,
        status: 'error',
        error: error.message
      })))
      throw error
    }
  }, [runtime])

  const previewArtifact = useCallback(async (artifactId: string): Promise<PreviewData> => {
    const artifact = artifacts.find(a => a.id === artifactId)
    if (!artifact) {
      throw new Error(`Artifact ${artifactId} not found`)
    }

    // Generate preview based on artifact type
    switch (artifact.displayType) {
      case 'text':
        return {
          type: 'text',
          content: typeof artifact.content === 'string' ? artifact.content : JSON.stringify(artifact.content),
          previewable: true
        }
      case 'code':
        return {
          type: 'code',
          content: artifact.content,
          language: artifact.renderOptions?.language || 'text',
          previewable: true
        }
      case 'image':
        return {
          type: 'image',
          content: artifact.content,
          previewable: true
        }
      case 'file':
        return {
          type: 'file',
          content: artifact.content,
          previewable: artifact.mimeType?.startsWith('text/') || false
        }
      case 'data':
        return {
          type: 'data',
          content: artifact.content,
          previewable: true
        }
      default:
        return {
          type: 'unknown',
          content: artifact.content,
          previewable: false
        }
    }
  }, [artifacts])

  const shareArtifact = useCallback(async (artifactId: string, config: ShareConfig): Promise<string> => {
    if (!runtime) {
      throw new Error('No runtime available')
    }

    // This would be implemented by the runtime
    // For now, return a mock share URL
    return `https://share.example.com/artifacts/${artifactId}?token=${Math.random().toString(36).substr(2, 9)}`
  }, [runtime])

  return {
    artifacts,
    downloadProgress,
    uploadProgress,
    error,
    
    // Actions
    downloadArtifact,
    uploadArtifact,
    previewArtifact,
    shareArtifact,
    
    // Helper methods
    hasArtifacts: artifacts.length > 0,
    getArtifact: (artifactId: string) => artifacts.find(a => a.id === artifactId),
    getArtifactsByType: (displayType: string) => artifacts.filter(a => a.displayType === displayType),
    isDownloading: (artifactId: string) => downloadProgress.get(artifactId)?.status === 'downloading',
    isUploading: (uploadId: string) => uploadProgress.get(uploadId)?.status === 'uploading'
  }
}

// Artifact preview hook
export function useArtifactPreview(artifactId: string) {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { previewArtifact } = useArtifacts()

  const loadPreview = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const preview = await previewArtifact(artifactId)
      setPreviewData(preview)
    } catch (err) {
      const error = err as Error
      setError(error)
    } finally {
      setIsLoading(false)
    }
  }, [artifactId, previewArtifact])

  const downloadOriginal = useCallback(async (): Promise<Blob> => {
    const { downloadArtifact } = useArtifacts()
    return downloadArtifact(artifactId)
  }, [artifactId])

  // Auto-load preview when artifactId changes
  useEffect(() => {
    if (artifactId) {
      loadPreview()
    }
  }, [artifactId, loadPreview])

  return {
    previewData,
    isLoading,
    error,
    
    // Actions
    loadPreview,
    downloadOriginal,
    
    // Helper methods
    isPreviewable: previewData?.previewable || false,
    previewType: previewData?.type || 'unknown'
  }
}

// Type definitions
interface DownloadProgress {
  artifactId: string
  progress: number
  status: 'downloading' | 'completed' | 'error'
  error?: string
}

interface UploadProgress {
  uploadId: string
  fileName: string
  fileSize: number
  progress: number
  status: 'uploading' | 'completed' | 'error'
  artifactId?: string
  error?: string
}

interface PreviewData {
  type: 'text' | 'code' | 'image' | 'file' | 'data' | 'unknown'
  content: unknown
  language?: string
  previewable: boolean
}

interface ShareConfig {
  expiresIn?: number
  password?: string
  allowDownload?: boolean
  allowPreview?: boolean
}