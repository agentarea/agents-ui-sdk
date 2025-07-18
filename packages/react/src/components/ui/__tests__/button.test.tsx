import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@test-utils'
import { axe } from 'jest-axe'
import { Button } from '../button'

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('applies default variant styling', () => {
    render(<Button>Default</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-primary')
  })

  it('applies variant styling correctly', () => {
    render(<Button variant="destructive">Delete</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive')
  })

  it('applies size styling correctly', () => {
    render(<Button size="sm">Small</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('h-8')
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('can be disabled', () => {
    const handleClick = vi.fn()
    render(<Button disabled onClick={handleClick}>Disabled</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    
    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Ref test</Button>)
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('supports asChild prop with Slot', () => {
    render(
      <Button asChild>
        <a href="/test">Link button</a>
      </Button>
    )
    
    const link = screen.getByRole('link')
    expect(link).toHaveClass('bg-primary') // Button styles applied to child
    expect(link).toHaveAttribute('href', '/test')
  })

  it('handles keyboard navigation', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Keyboard</Button>)
    
    const button = screen.getByRole('button')
    button.focus()
    expect(button).toHaveFocus()
    
    fireEvent.keyDown(button, { key: 'Enter' })
    expect(handleClick).toHaveBeenCalledTimes(1)
    
    fireEvent.keyDown(button, { key: ' ' })
    expect(handleClick).toHaveBeenCalledTimes(2)
  })

  it('meets accessibility standards', async () => {
    const { container } = render(<Button>Accessible button</Button>)
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('supports all variant combinations', () => {
    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const
    const sizes = ['default', 'sm', 'lg', 'icon'] as const
    
    variants.forEach(variant => {
      sizes.forEach(size => {
        const { unmount } = render(
          <Button variant={variant} size={size}>
            {variant} {size}
          </Button>
        )
        
        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()
        
        unmount()
      })
    })
  })

  it('handles loading state', () => {
    render(<Button disabled>Loading...</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('supports icon buttons', () => {
    const Icon = () => <span data-testid="icon">🔥</span>
    
    render(
      <Button size="icon" aria-label="Fire button">
        <Icon />
      </Button>
    )
    
    const button = screen.getByRole('button', { name: /fire button/i })
    expect(button).toBeInTheDocument()
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('handles form submission', () => {
    const handleSubmit = vi.fn(e => e.preventDefault())
    
    render(
      <form onSubmit={handleSubmit}>
        <Button type="submit">Submit</Button>
      </form>
    )
    
    const button = screen.getByRole('button', { name: /submit/i })
    fireEvent.click(button)
    
    expect(handleSubmit).toHaveBeenCalledTimes(1)
  })

  it('prevents double-click when disabled', () => {
    const handleClick = vi.fn()
    const { rerender } = render(<Button onClick={handleClick}>Click me</Button>)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
    
    // Disable button
    rerender(<Button disabled onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1) // Should not increase
  })

  it('supports custom HTML attributes', () => {
    render(
      <Button 
        data-testid="custom-button"
        aria-describedby="description"
        title="Custom title"
      >
        Custom
      </Button>
    )
    
    const button = screen.getByTestId('custom-button')
    expect(button).toHaveAttribute('aria-describedby', 'description')
    expect(button).toHaveAttribute('title', 'Custom title')
  })
})