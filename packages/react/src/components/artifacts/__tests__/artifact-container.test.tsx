import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@test-utils'
import { axe } from 'jest-axe'
import { ArtifactContainer } from '../artifact-container'
import { mockArtifact } from '@test-utils'

describe('ArtifactContainer', () => {
  const defaultProps = {
    artifact: mockArtifact(),
    onDownload: vi.fn(),
    onShare: vi.fn()
  }

  it('renders artifact container with basic information', () => {
    render(<ArtifactContainer {...defaultProps} />)
    
    expect(screen.getByText('Test artifact content')).toBeInTheDocument()
    expect(screen.getByText('text/plain')).toBeInTheDocument()
    expect(screen.getByText('1.0 KB')).toBeInTheDocument()
  })

  it('shows download button when artifact is downloadable', () => {
    render(<ArtifactContainer {...defaultProps} />)
    
    const downloadButton = screen.getByRole('button', { name: /download/i })
    expect(downloadButton).toBeInTheDocument()
  })

  it('shows share button when artifact is shareable', () => {
    render(<ArtifactContainer {...defaultProps} />)
    
    const shareButton = screen.getByRole('button', { name: /share/i })
    expect(shareButton).toBeInTheDocument()
  })

  it('hides download button when artifact is not downloadable', () => {
    const artifact = mockArtifact({ downloadable: false })
    render(<ArtifactContainer {...defaultProps} artifact={artifact} />)
    
    expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument()
  })

  it('hides share button when artifact is not shareable', () => {
    const artifact = mockArtifact({ shareable: false })
    render(<ArtifactContainer {...defaultProps} artifact={artifact} />)
    
    expect(screen.queryByRole('button', { name: /share/i })).not.toBeInTheDocument()
  })

  it('calls onDownload when download button is clicked', () => {
    const onDownload = vi.fn()
    render(<ArtifactContainer {...defaultProps} onDownload={onDownload} />)
    
    const downloadButton = screen.getByRole('button', { name: /download/i })
    fireEvent.click(downloadButton)
    
    expect(onDownload).toHaveBeenCalledWith(defaultProps.artifact.id)
  })

  it('calls onShare when share button is clicked', () => {
    const onShare = vi.fn()
    render(<ArtifactContainer {...defaultProps} onShare={onShare} />)
    
    const shareButton = screen.getByRole('button', { name: /share/i })
    fireEvent.click(shareButton)
    
    expect(onShare).toHaveBeenCalledWith(defaultProps.artifact.id)
  })

  it('supports collapsible content', () => {
    render(<ArtifactContainer {...defaultProps} collapsible />)
    
    const toggleButton = screen.getByRole('button', { name: /toggle/i })
    expect(toggleButton).toBeInTheDocument()
    
    // Content should be visible initially
    expect(screen.getByText('Test artifact content')).toBeVisible()
    
    // Click to collapse
    fireEvent.click(toggleButton)
    expect(screen.getByText('Test artifact content')).not.toBeVisible()
    
    // Click to expand
    fireEvent.click(toggleButton)
    expect(screen.getByText('Test artifact content')).toBeVisible()
  })

  it('displays timestamp in user-friendly format', () => {
    const artifact = mockArtifact({
      metadata: {
        ...mockArtifact().metadata,
        createdAt: new Date('2024-01-01T12:00:00Z')
      }
    })
    render(<ArtifactContainer {...defaultProps} artifact={artifact} />)
    
    expect(screen.getByText(/Jan 1, 2024/)).toBeInTheDocument()
  })

  it('handles missing metadata gracefully', () => {
    const artifact = mockArtifact({ metadata: {} })
    render(<ArtifactContainer {...defaultProps} artifact={artifact} />)
    
    // Should not crash and should still render content
    expect(screen.getByText('Test artifact content')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <ArtifactContainer {...defaultProps} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('meets accessibility standards', async () => {
    const { container } = render(<ArtifactContainer {...defaultProps} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('supports keyboard navigation', () => {
    render(<ArtifactContainer {...defaultProps} />)
    
    const downloadButton = screen.getByRole('button', { name: /download/i })
    const shareButton = screen.getByRole('button', { name: /share/i })
    
    // Tab to download button
    downloadButton.focus()
    expect(downloadButton).toHaveFocus()
    
    // Tab to share button
    fireEvent.keyDown(downloadButton, { key: 'Tab' })
    shareButton.focus()
    expect(shareButton).toHaveFocus()
  })

  it('handles large file sizes correctly', () => {
    const artifact = mockArtifact({
      metadata: {
        ...mockArtifact().metadata,
        size: 1024 * 1024 * 5 // 5MB
      }
    })
    render(<ArtifactContainer {...defaultProps} artifact={artifact} />)
    
    expect(screen.getByText('5.0 MB')).toBeInTheDocument()
  })

  it('handles very large file sizes', () => {
    const artifact = mockArtifact({
      metadata: {
        ...mockArtifact().metadata,
        size: 1024 * 1024 * 1024 * 2 // 2GB
      }
    })
    render(<ArtifactContainer {...defaultProps} artifact={artifact} />)
    
    expect(screen.getByText('2.0 GB')).toBeInTheDocument()
  })
})