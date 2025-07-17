import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import type { 
  EnhancedArtifact,
  ArtifactMetadata
} from '@agentarea/core'
import { useIsClient } from '../../hooks/use-ssr'

interface DownloadItem {
  artifactId: string
  progress: number
  status: 'pending' | 'downloading' | 'completed' | 'error'
  error?: Error
  blob?: Blob
}

interface UploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: Error
  artifact?: EnhancedArtifact
}

interface PreviewData {
  artifactId: string
  type: 'text' | 'image' | 'code' | 'data'
  content: unknown
  metadata?: Record<string, unknown>
}

interface ShareConfig {
  type: 'link' | 'embed' | 'download'
  expiresAt?: Date
  permissions?: string[]
  metadata?: Record<string, unknown>
}

interface ArtifactContextValue {
  artifacts: Map<string, EnhancedArtifact>
  downloadQueue: DownloadItem[]
  uploadProgress: Map<string, UploadProgress>
  previews: Map<string, PreviewData>
  error: Error | null
  
  // Actions
  downloadArtifact: (artifactId: string) => Promise<Blob>
  uploadArtifact: (file: File, metadata?: ArtifactMetadata) => Promise<EnhancedArtifact>
  previewArtifact: (artifactId: string) => Promise<PreviewData>
  shareArtifact: (artifactId: string, shareConfig: ShareConfig) => Promise<string>
  cacheArtifact: (artifact: EnhancedArtifact) => void
  removeArtifact: (artifactId: string) => void
  clearCache: () => void
}

const ArtifactContext = createContext<ArtifactContextValue | null>(null)

interface ArtifactProviderProps {
  children: ReactNode
  maxCacheSize?: number
  enableAutoCleanup?: boolean
}

export function ArtifactProvider({ 
  children, 
  maxCacheSize = 100,
  enableAutoCleanup = true 
}: ArtifactProviderProps) {
  const [artifacts, setArtifacts] = useState<Map<string, EnhancedArtifact>>(new Map())
  const [downloadQueue, setDownloadQueue] = useState<DownloadItem[]>([])
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map())
  const [previews, setPreviews] = useState<Map<string, PreviewData>>(new Map())
  const [error, setError] = useState<Error | null>(null)
  
  const isClient = useIsClient()

  // Auto-cleanup cache when it exceeds maxCacheSize
  useEffect(() => {
    if (!enableAutoCleanup || artifacts.size <= maxCacheSize) return

    const sortedArtifacts = Array.from(artifacts.entries())
      .sort(([, a], [, b]) => {
        const aTime = a.updatedAt || a.createdAt || new Date(0)
        const bTime = b.updatedAt || b.createdAt || new Date(0)
        return aTime.getTime() - bTime.getTime()
      })

    const toRemove = sortedArtifacts.slice(0, artifacts.size - maxCacheSize)
    
    setArtifacts(prev => {
      const newArtifacts = new Map(prev)
      toRemove.forEach(([id]) => newArtifacts.delete(id))
      return newArtifacts
    })

    // Also cleanup related previews
    setPreviews(prev => {
      const newPreviews = new Map(prev)
      toRemove.forEach(([id]) => newPreviews.delete(id))
      return newPreviews
    })
  }, [artifacts.size, maxCacheSize, enableAutoCleanup])

  const downloadArtifact = useCallback(async (artifactId: string): Promise<Blob> => {
    if (!isClient) {
      throw new Error('Download not available on server side')
    }

    const artifact = artifacts.get(artifactId)
    if (!artifact) {
      throw new Error(`Artifact ${artifactId} not found`)
    }

    // Check if already downloading
    const existingDownload = downloadQueue.find(item => item.artifactId === artifactId)
    if (existingDownload) {
      if (existingDownload.status === 'completed' && existingDownload.blob) {
        return existingDownload.blob
      }
      if (existingDownload.status === 'downloading') {
        throw new Error(`Artifact ${artifactId} is already being downloaded`)
      }
    }

    try {
      // Add to download queue
      const downloadItem: DownloadItem = {
        artifactId,
        progress: 0,
        status: 'downloading'
      }

      setDownloadQueue(prev => [...prev.filter(item => item.artifactId !== artifactId), downloadItem])
      setError(null)

      // Simulate download process (replace with actual implementation)
      const blob = await simulateDownload(artifact, (progress) => {
        setDownloadQueue(prev => prev.map(item => 
          item.artifactId === artifactId 
            ? { ...item, progress }
            : item
        ))
      })

      // Update download item with completed status
      setDownloadQueue(prev => prev.map(item => 
        item.artifactId === artifactId 
          ? { ...item, status: 'completed', progress: 100, blob }
          : item
      ))

      return blob
    } catch (err) {
      const error = err as Error
      setError(error)
      
      // Update download item with error status
      setDownloadQueue(prev => prev.map(item => 
        item.artifactId === artifactId 
          ? { ...item, status: 'error', error }
          : item
      ))
      
      throw error
    }
  }, [artifacts, downloadQueue, isClient])

  const uploadArtifact = useCallback(async (
    file: File, 
    metadata?: ArtifactMetadata
  ): Promise<EnhancedArtifact> => {
    if (!isClient) {
      throw new Error('Upload not available on server side')
    }

    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    try {
      // Add to upload progress
      const uploadItem: UploadProgress = {
        file,
        progress: 0,
        status: 'uploading'
      }

      setUploadProgress(prev => new Map(prev.set(uploadId, uploadItem)))
      setError(null)

      // Simulate upload process (replace with actual implementation)
      const artifact = await simulateUpload(file, metadata, (progress) => {
        setUploadProgress(prev => {
          const newProgress = new Map(prev)
          const item = newProgress.get(uploadId)
          if (item) {
            newProgress.set(uploadId, { ...item, progress })
          }
          return newProgress
        })
      })

      // Update upload progress with completed status
      setUploadProgress(prev => {
        const newProgress = new Map(prev)
        const item = newProgress.get(uploadId)
        if (item) {
          newProgress.set(uploadId, { ...item, status: 'completed', progress: 100, artifact })
        }
        return newProgress
      })

      // Cache the uploaded artifact
      cacheArtifact(artifact)

      return artifact
    } catch (err) {
      const error = err as Error
      setError(error)
      
      // Update upload progress with error status
      setUploadProgress(prev => {
        const newProgress = new Map(prev)
        const item = newProgress.get(uploadId)
        if (item) {
          newProgress.set(uploadId, { ...item, status: 'error', error })
        }
        return newProgress
      })
      
      throw error
    }
  }, [isClient])

  const previewArtifact = useCallback(async (artifactId: string): Promise<PreviewData> => {
    const artifact = artifacts.get(artifactId)
    if (!artifact) {
      throw new Error(`Artifact ${artifactId} not found`)
    }

    // Check if preview is already cached
    const cachedPreview = previews.get(artifactId)
    if (cachedPreview) {
      return cachedPreview
    }

    try {
      setError(null)

      // Generate preview based on artifact type
      const previewData = await generatePreview(artifact)
      
      // Cache the preview
      setPreviews(prev => new Map(prev.set(artifactId, previewData)))
      
      return previewData
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    }
  }, [artifacts, previews])

  const shareArtifact = useCallback(async (
    artifactId: string, 
    shareConfig: ShareConfig
  ): Promise<string> => {
    const artifact = artifacts.get(artifactId)
    if (!artifact) {
      throw new Error(`Artifact ${artifactId} not found`)
    }

    if (!artifact.shareable) {
      throw new Error(`Artifact ${artifactId} is not shareable`)
    }

    try {
      setError(null)

      // Generate share link/embed code (replace with actual implementation)
      const shareUrl = await generateShareUrl(artifact, shareConfig)
      
      return shareUrl
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    }
  }, [artifacts])

  const cacheArtifact = useCallback((artifact: EnhancedArtifact) => {
    setArtifacts(prev => new Map(prev.set(artifact.id, {
      ...artifact,
      updatedAt: new Date()
    })))
  }, [])

  const removeArtifact = useCallback((artifactId: string) => {
    setArtifacts(prev => {
      const newArtifacts = new Map(prev)
      newArtifacts.delete(artifactId)
      return newArtifacts
    })

    setPreviews(prev => {
      const newPreviews = new Map(prev)
      newPreviews.delete(artifactId)
      return newPreviews
    })

    setDownloadQueue(prev => prev.filter(item => item.artifactId !== artifactId))
  }, [])

  const clearCache = useCallback(() => {
    setArtifacts(new Map())
    setPreviews(new Map())
    setDownloadQueue([])
    setUploadProgress(new Map())
    setError(null)
  }, [])

  const value: ArtifactContextValue = {
    artifacts,
    downloadQueue,
    uploadProgress,
    previews,
    error,
    downloadArtifact,
    uploadArtifact,
    previewArtifact,
    shareArtifact,
    cacheArtifact,
    removeArtifact,
    clearCache
  }

  return (
    <ArtifactContext.Provider value={value}>
      {children}
    </ArtifactContext.Provider>
  )
}

export function useArtifactContext(): ArtifactContextValue {
  const context = useContext(ArtifactContext)
  if (!context) {
    throw new Error('useArtifactContext must be used within an ArtifactProvider')
  }
  return context
}

// Helper functions (replace with actual implementations)
async function simulateDownload(
  artifact: EnhancedArtifact, 
  onProgress: (progress: number) => void
): Promise<Blob> {
  // Simulate download progress
  for (let i = 0; i <= 100; i += 10) {
    await new Promise(resolve => setTimeout(resolve, 100))
    onProgress(i)
  }

  // Create a mock blob based on artifact content
  const content = typeof artifact.content === 'string' 
    ? artifact.content 
    : JSON.stringify(artifact.content)
  
  return new Blob([content], { type: artifact.mimeType || 'text/plain' })
}

async function simulateUpload(
  file: File, 
  metadata?: ArtifactMetadata,
  onProgress?: (progress: number) => void
): Promise<EnhancedArtifact> {
  // Simulate upload progress
  if (onProgress) {
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100))
      onProgress(i)
    }
  }

  // Create enhanced artifact from file
  const artifact: EnhancedArtifact = {
    id: `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'file',
    content: file,
    mimeType: file.type,
    metadata: {
      ...metadata,
      originalName: file.name,
      size: file.size
    },
    displayType: getDisplayType(file.type),
    downloadable: true,
    shareable: true,
    size: file.size,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  return artifact
}

async function generatePreview(artifact: EnhancedArtifact): Promise<PreviewData> {
  // Generate preview based on artifact type
  let content: unknown
  let type: PreviewData['type']

  switch (artifact.displayType) {
    case 'text':
      content = typeof artifact.content === 'string' 
        ? artifact.content.substring(0, 1000) 
        : String(artifact.content).substring(0, 1000)
      type = 'text'
      break
    case 'code':
      content = artifact.content
      type = 'code'
      break
    case 'image':
      content = artifact.content
      type = 'image'
      break
    case 'data':
      content = artifact.content
      type = 'data'
      break
    default:
      content = String(artifact.content).substring(0, 500)
      type = 'text'
  }

  return {
    artifactId: artifact.id,
    type,
    content,
    metadata: artifact.metadata
  }
}

async function generateShareUrl(
  artifact: EnhancedArtifact, 
  shareConfig: ShareConfig
): Promise<string> {
  // Mock share URL generation
  const baseUrl = 'https://share.example.com'
  const shareId = `share-${artifact.id}-${Date.now()}`
  
  switch (shareConfig.type) {
    case 'link':
      return `${baseUrl}/link/${shareId}`
    case 'embed':
      return `${baseUrl}/embed/${shareId}`
    case 'download':
      return `${baseUrl}/download/${shareId}`
    default:
      return `${baseUrl}/${shareId}`
  }
}

function getDisplayType(mimeType: string): EnhancedArtifact['displayType'] {
  if (mimeType.startsWith('text/')) {
    if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('xml')) {
      return 'code'
    }
    return 'text'
  }
  
  if (mimeType.startsWith('image/')) {
    return 'image'
  }
  
  if (mimeType.includes('json') || mimeType.includes('xml')) {
    return 'data'
  }
  
  return 'file'
}