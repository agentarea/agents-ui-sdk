import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@test-utils'
import { axe } from 'jest-axe'
import { ArtifactCode } from '../artifact-code'
import { mockArtifact } from '@test-utils'

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined)
  }
})

describe('ArtifactCode', () => {
  const codeArtifact = mockArtifact({
    displayType: 'code',
    content: {
      code: {
        language: 'javascript',
        content: 'const hello = "world";\nconsole.log(hello);'
      }
    }
  })

  const defaultProps = {
    artifact: codeArtifact,
    onCopy: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders code content with syntax highlighting', () => {
    render(<ArtifactCode {...defaultProps} />)
    
    expect(screen.getByText('const hello = "world";')).toBeInTheDocument()
    expect(screen.getByText('console.log(hello);')).toBeInTheDocument()
  })

  it('displays the programming language', () => {
    render(<ArtifactCode {...defaultProps} />)
    
    expect(screen.getByText('javascript')).toBeInTheDocument()
  })

  it('shows copy button', () => {
    render(<ArtifactCode {...defaultProps} />)
    
    const copyButton = screen.getByRole('button', { name: /copy/i })
    expect(copyButton).toBeInTheDocument()
  })

  it('copies code to clipboard when copy button is clicked', async () => {
    render(<ArtifactCode {...defaultProps} />)
    
    const copyButton = screen.getByRole('button', { name: /copy/i })
    fireEvent.click(copyButton)
    
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'const hello = "world";\nconsole.log(hello);'
      )
    })
  })

  it('calls onCopy callback when copy button is clicked', async () => {
    const onCopy = vi.fn()
    render(<ArtifactCode {...defaultProps} onCopy={onCopy} />)
    
    const copyButton = screen.getByRole('button', { name: /copy/i })
    fireEvent.click(copyButton)
    
    await waitFor(() => {
      expect(onCopy).toHaveBeenCalledWith(codeArtifact.id)
    })
  })

  it('shows success feedback after copying', async () => {
    render(<ArtifactCode {...defaultProps} />)
    
    const copyButton = screen.getByRole('button', { name: /copy/i })
    fireEvent.click(copyButton)
    
    await waitFor(() => {
      expect(screen.getByText(/copied/i)).toBeInTheDocument()
    })
  })

  it('displays line numbers when enabled', () => {
    render(<ArtifactCode {...defaultProps} showLineNumbers />)
    
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('handles unknown programming languages gracefully', () => {
    const unknownLangArtifact = mockArtifact({
      displayType: 'code',
      content: {
        code: {
          language: 'unknown-lang',
          content: 'some code content'
        }
      }
    })
    
    render(<ArtifactCode {...defaultProps} artifact={unknownLangArtifact} />)
    
    expect(screen.getByText('some code content')).toBeInTheDocument()
    expect(screen.getByText('unknown-lang')).toBeInTheDocument()
  })

  it('handles empty code content', () => {
    const emptyCodeArtifact = mockArtifact({
      displayType: 'code',
      content: {
        code: {
          language: 'javascript',
          content: ''
        }
      }
    })
    
    render(<ArtifactCode {...defaultProps} artifact={emptyCodeArtifact} />)
    
    expect(screen.getByText(/no code content/i)).toBeInTheDocument()
  })

  it('supports code highlighting for specific lines', () => {
    render(<ArtifactCode {...defaultProps} highlightLines={[1]} />)
    
    // First line should be highlighted
    const firstLine = screen.getByText('const hello = "world";').closest('div')
    expect(firstLine).toHaveClass('highlighted')
  })

  it('supports maximum height with scrolling', () => {
    const longCodeArtifact = mockArtifact({
      displayType: 'code',
      content: {
        code: {
          language: 'javascript',
          content: Array(50).fill('console.log("line");').join('\n')
        }
      }
    })
    
    const { container } = render(
      <ArtifactCode {...defaultProps} artifact={longCodeArtifact} maxHeight="200px" />
    )
    
    const codeContainer = container.querySelector('[data-testid="code-container"]')
    expect(codeContainer).toHaveStyle({ maxHeight: '200px' })
  })

  it('handles clipboard API failures gracefully', async () => {
    const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard failed'))
    Object.assign(navigator, {
      clipboard: { writeText: mockWriteText }
    })
    
    render(<ArtifactCode {...defaultProps} />)
    
    const copyButton = screen.getByRole('button', { name: /copy/i })
    fireEvent.click(copyButton)
    
    await waitFor(() => {
      expect(screen.getByText(/failed to copy/i)).toBeInTheDocument()
    })
  })

  it('supports custom theme', () => {
    const { container } = render(
      <ArtifactCode {...defaultProps} theme="dark" />
    )
    
    expect(container.firstChild).toHaveClass('theme-dark')
  })

  it('meets accessibility standards', async () => {
    const { container } = render(<ArtifactCode {...defaultProps} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('supports keyboard navigation', () => {
    render(<ArtifactCode {...defaultProps} />)
    
    const copyButton = screen.getByRole('button', { name: /copy/i })
    
    copyButton.focus()
    expect(copyButton).toHaveFocus()
    
    // Enter key should trigger copy
    fireEvent.keyDown(copyButton, { key: 'Enter' })
    expect(navigator.clipboard.writeText).toHaveBeenCalled()
  })

  it('handles very long single lines', () => {
    const longLineArtifact = mockArtifact({
      displayType: 'code',
      content: {
        code: {
          language: 'javascript',
          content: 'const veryLongVariableName = ' + 'x'.repeat(1000) + ';'
        }
      }
    })
    
    render(<ArtifactCode {...defaultProps} artifact={longLineArtifact} />)
    
    // Should render without crashing
    expect(screen.getByText(/const veryLongVariableName/)).toBeInTheDocument()
  })

  it('supports word wrapping option', () => {
    const { container } = render(
      <ArtifactCode {...defaultProps} wordWrap />
    )
    
    const codeElement = container.querySelector('code')
    expect(codeElement).toHaveStyle({ whiteSpace: 'pre-wrap' })
  })
})