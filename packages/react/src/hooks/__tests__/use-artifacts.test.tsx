import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useArtifacts } from '../use-artifacts'
import { mockArtifact, TestWrapper } from '@test-utils'

// Mock the runtime
const mockRuntime = {
  downloadArtifact: vi.fn(),
  uploadArtifact: vi.fn(),
  previewArtifact: vi.fn(),
  shareArtifact: vi.fn()
}

vi.mock('@agentarea/core', () => ({
  RuntimeFactory: {
    createRuntime: () => mockRuntime
  }
}))

describe('useArtifacts', () => {
  const artifacts = [
    mockArtifact({ id: 'artifact-1', taskId: 'task-1' }),
    mockArtifact({ id: 'artifact-2', taskId: 'task-1' }),
    mockArtifact({ id: 'artifact-3', taskId: 'task-2' })
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns all artifacts when no taskId is provided', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper>
        {children}
      </TestWrapper>
    )

    // Mock the artifact provider context
    const mockArtifactContext = {
      artifacts: new Map(artifacts.map(a => [a.id, a])),
      downloadQueue: [],
      uploadProgress: new Map(),
      downloadArtifact: vi.fn(),
      uploadArtifact: vi.fn(),
      previewArtifact: vi.fn(),
      shareArtifact: vi.fn()
    }

    vi.mock('../use-artifacts', () => ({
      useArtifacts: () => ({
        artifacts,
        downloadProgress: new Map(),
        uploadProgress: new Map(),
        downloadArtifact: mockArtifactContext.downloadArtifact,
        uploadArtifact: mockArtifactContext.uploadArtifact,
        previewArtifact: mockArtifactContext.previewArtifact,
        shareArtifact: mockArtifactContext.shareArtifact
      })
    }))

    const { result } = renderHook(() => useArtifacts(), { wrapper })

    expect(result.current.artifacts).toEqual(artifacts)
  })

  it('filters artifacts by taskId when provided', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper>
        {children}
      </TestWrapper>
    )

    const expectedArtifacts = artifacts.filter(a => a.taskId === 'task-1')

    vi.mock('../use-artifacts', () => ({
      useArtifacts: (taskId?: string) => ({
        artifacts: taskId ? artifacts.filter(a => a.taskId === taskId) : artifacts,
        downloadProgress: new Map(),
        uploadProgress: new Map(),
        downloadArtifact: vi.fn(),
        uploadArtifact: vi.fn(),
        previewArtifact: vi.fn(),
        shareArtifact: vi.fn()
      })
    }))

    const { result } = renderHook(() => useArtifacts('task-1'), { wrapper })

    expect(result.current.artifacts).toEqual(expectedArtifacts)
  })

  it('downloads artifact successfully', async () => {
    const mockBlob = new Blob(['test content'], { type: 'text/plain' })
    const mockDownloadArtifact = vi.fn().mockResolvedValue(mockBlob)
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper>
        {children}
      </TestWrapper>
    )

    const { result } = renderHook(() => ({
      ...useArtifacts(),
      downloadArtifact: mockDownloadArtifact
    }), { wrapper })

    let downloadedBlob: Blob | undefined
    await act(async () => {
      downloadedBlob = await result.current.downloadArtifact('artifact-1')
    })

    expect(mockDownloadArtifact).toHaveBeenCalledWith('artifact-1')
    expect(downloadedBlob).toBe(mockBlob)
  })

  it('tracks download progress', async () => {
    const mockDownloadArtifact = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(new Blob()), 100))
    )
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper>
        {children}
      </TestWrapper>
    )

    const { result } = renderHook(() => ({
      artifacts,
      downloadProgress: new Map([['artifact-1', { progress: 50, total: 100 }]]),
      uploadProgress: new Map(),
      downloadArtifact: mockDownloadArtifact,
      uploadArtifact: vi.fn(),
      previewArtifact: vi.fn(),
      shareArtifact: vi.fn()
    }), { wrapper })

    expect(result.current.downloadProgress.get('artifact-1')).toEqual({
      progress: 50,
      total: 100
    })
  })

  it('uploads artifact successfully', async () => {
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
    const uploadedArtifact = mockArtifact({ id: 'new-artifact' })
    const mockUploadArtifact = vi.fn().mockResolvedValue(uploadedArtifact)
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper>
        {children}
      </TestWrapper>
    )

    const { result } = renderHook(() => ({
      ...useArtifacts(),
      uploadArtifact: mockUploadArtifact
    }), { wrapper })

    const metadata = { description: 'Test file' }
    let result_artifact: any
    
    await act(async () => {
      result_artifact = await result.current.uploadArtifact(file, metadata)
    })

    expect(mockUploadArtifact).toHaveBeenCalledWith(file, metadata)
    expect(result_artifact).toBe(uploadedArtifact)
  })

  it('tracks upload progress', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper>
        {children}
      </TestWrapper>
    )

    const { result } = renderHook(() => ({
      artifacts,
      downloadProgress: new Map(),
      uploadProgress: new Map([['upload-1', { progress: 75, total: 100 }]]),
      downloadArtifact: vi.fn(),
      uploadArtifact: vi.fn(),
      previewArtifact: vi.fn(),
      shareArtifact: vi.fn()
    }), { wrapper })

    expect(result.current.uploadProgress.get('upload-1')).toEqual({
      progress: 75,
      total: 100
    })
  })

  it('previews artifact successfully', async () => {
    const previewData = {
      type: 'image',
      url: 'blob:preview-url',
      metadata: { width: 800, height: 600 }
    }
    const mockPreviewArtifact = vi.fn().mockResolvedValue(previewData)
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper>
        {children}
      </TestWrapper>
    )

    const { result } = renderHook(() => ({
      ...useArtifacts(),
      previewArtifact: mockPreviewArtifact
    }), { wrapper })

    let preview: any
    await act(async () => {
      preview = await result.current.previewArtifact('artifact-1')
    })

    expect(mockPreviewArtifact).toHaveBeenCalledWith('artifact-1')
    expect(preview).toBe(previewData)
  })

  it('shares artifact successfully', async () => {
    const shareUrl = 'https://share.example.com/artifact-1'
    const mockShareArtifact = vi.fn().mockResolvedValue(shareUrl)
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper>
        {children}
      </TestWrapper>
    )

    const { result } = renderHook(() => ({
      ...useArtifacts(),
      shareArtifact: mockShareArtifact
    }), { wrapper })

    const shareConfig = { expiresIn: '7d', permissions: ['read'] }
    let sharedUrl: string | undefined
    
    await act(async () => {
      sharedUrl = await result.current.shareArtifact('artifact-1', shareConfig)
    })

    expect(mockShareArtifact).toHaveBeenCalledWith('artifact-1', shareConfig)
    expect(sharedUrl).toBe(shareUrl)
  })

  it('handles download errors gracefully', async () => {
    const error = new Error('Download failed')
    const mockDownloadArtifact = vi.fn().mockRejectedValue(error)
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper>
        {children}
      </TestWrapper>
    )

    const { result } = renderHook(() => ({
      ...useArtifacts(),
      downloadArtifact: mockDownloadArtifact
    }), { wrapper })

    await act(async () => {
      try {
        await result.current.downloadArtifact('artifact-1')
      } catch (e) {
        expect(e).toBe(error)
      }
    })

    expect(mockDownloadArtifact).toHaveBeenCalledWith('artifact-1')
  })

  it('handles upload errors gracefully', async () => {
    const error = new Error('Upload failed')
    const mockUploadArtifact = vi.fn().mockRejectedValue(error)
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper>
        {children}
      </TestWrapper>
    )

    const { result } = renderHook(() => ({
      ...useArtifacts(),
      uploadArtifact: mockUploadArtifact
    }), { wrapper })

    const file = new File(['test'], 'test.txt')
    
    await act(async () => {
      try {
        await result.current.uploadArtifact(file)
      } catch (e) {
        expect(e).toBe(error)
      }
    })

    expect(mockUploadArtifact).toHaveBeenCalledWith(file, undefined)
  })

  it('filters artifacts by type', () => {
    const mixedArtifacts = [
      mockArtifact({ id: 'text-1', displayType: 'text' }),
      mockArtifact({ id: 'code-1', displayType: 'code' }),
      mockArtifact({ id: 'image-1', displayType: 'image' }),
      mockArtifact({ id: 'text-2', displayType: 'text' })
    ]

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper>
        {children}
      </TestWrapper>
    )

    const { result } = renderHook(() => ({
      artifacts: mixedArtifacts.filter(a => a.displayType === 'text'),
      downloadProgress: new Map(),
      uploadProgress: new Map(),
      downloadArtifact: vi.fn(),
      uploadArtifact: vi.fn(),
      previewArtifact: vi.fn(),
      shareArtifact: vi.fn()
    }), { wrapper })

    expect(result.current.artifacts).toHaveLength(2)
    expect(result.current.artifacts.every(a => a.displayType === 'text')).toBe(true)
  })

  it('handles empty artifact list', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper>
        {children}
      </TestWrapper>
    )

    const { result } = renderHook(() => ({
      artifacts: [],
      downloadProgress: new Map(),
      uploadProgress: new Map(),
      downloadArtifact: vi.fn(),
      uploadArtifact: vi.fn(),
      previewArtifact: vi.fn(),
      shareArtifact: vi.fn()
    }), { wrapper })

    expect(result.current.artifacts).toEqual([])
  })

  it('handles concurrent downloads', async () => {
    const mockDownloadArtifact = vi.fn()
      .mockResolvedValueOnce(new Blob(['content 1']))
      .mockResolvedValueOnce(new Blob(['content 2']))
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper>
        {children}
      </TestWrapper>
    )

    const { result } = renderHook(() => ({
      ...useArtifacts(),
      downloadArtifact: mockDownloadArtifact
    }), { wrapper })

    let results: Blob[]
    await act(async () => {
      results = await Promise.all([
        result.current.downloadArtifact('artifact-1'),
        result.current.downloadArtifact('artifact-2')
      ])
    })

    expect(mockDownloadArtifact).toHaveBeenCalledTimes(2)
    expect(results).toHaveLength(2)
  })
})