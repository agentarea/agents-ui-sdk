import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRuntimeEnvironment } from '../use-runtime-environment'

describe('useRuntimeEnvironment', () => {
  const originalWindow = global.window
  const originalProcess = global.process

  afterEach(() => {
    global.window = originalWindow
    global.process = originalProcess
  })

  it('detects client environment correctly', () => {
    // Ensure we're in a client environment
    global.window = originalWindow

    const { result } = renderHook(() => useRuntimeEnvironment())

    expect(result.current.isClient).toBe(true)
    expect(result.current.isServer).toBe(false)
  })

  it('detects server environment correctly', () => {
    // Mock server environment
    delete (global as any).window

    const { result } = renderHook(() => useRuntimeEnvironment())

    expect(result.current.isClient).toBe(false)
    expect(result.current.isServer).toBe(true)
  })

  it('detects Next.js environment', () => {
    // Mock Next.js environment
    global.window = {
      ...originalWindow,
      __NEXT_DATA__: { page: '/', query: {}, buildId: 'test' }
    } as any

    const { result } = renderHook(() => useRuntimeEnvironment())

    expect(result.current.isNextJS).toBe(true)
  })

  it('detects Vite environment', () => {
    // Mock Vite environment
    global.window = {
      ...originalWindow,
      __vite_plugin_react_preamble_installed__: true
    } as any

    const { result } = renderHook(() => useRuntimeEnvironment())

    expect(result.current.isVite).toBe(true)
  })

  it('detects WebSocket support', () => {
    // Ensure WebSocket is available
    global.WebSocket = class MockWebSocket {} as any

    const { result } = renderHook(() => useRuntimeEnvironment())

    expect(result.current.supportsWebSockets).toBe(true)
  })

  it('detects lack of WebSocket support', () => {
    // Remove WebSocket
    const originalWebSocket = global.WebSocket
    delete (global as any).WebSocket

    const { result } = renderHook(() => useRuntimeEnvironment())

    expect(result.current.supportsWebSockets).toBe(false)

    // Restore WebSocket
    global.WebSocket = originalWebSocket
  })

  it('detects File API support', () => {
    // Ensure File API is available
    global.File = class MockFile {} as any

    const { result } = renderHook(() => useRuntimeEnvironment())

    expect(result.current.supportsFileAPI).toBe(true)
  })

  it('detects lack of File API support', () => {
    // Remove File API
    const originalFile = global.File
    delete (global as any).File

    const { result } = renderHook(() => useRuntimeEnvironment())

    expect(result.current.supportsFileAPI).toBe(false)

    // Restore File API
    global.File = originalFile
  })

  it('provides stable reference across renders', () => {
    const { result, rerender } = renderHook(() => useRuntimeEnvironment())

    const firstResult = result.current
    rerender()
    const secondResult = result.current

    expect(firstResult).toBe(secondResult)
  })

  it('handles edge cases gracefully', () => {
    // Mock partial window object
    global.window = {} as any

    const { result } = renderHook(() => useRuntimeEnvironment())

    expect(result.current.isClient).toBe(true)
    expect(result.current.isNextJS).toBe(false)
    expect(result.current.isVite).toBe(false)
  })

  it('detects development vs production environment', () => {
    const originalEnv = process.env.NODE_ENV

    // Test development
    process.env.NODE_ENV = 'development'
    const { result: devResult } = renderHook(() => useRuntimeEnvironment())
    expect(devResult.current.isDevelopment).toBe(true)
    expect(devResult.current.isProduction).toBe(false)

    // Test production
    process.env.NODE_ENV = 'production'
    const { result: prodResult } = renderHook(() => useRuntimeEnvironment())
    expect(prodResult.current.isDevelopment).toBe(false)
    expect(prodResult.current.isProduction).toBe(true)

    process.env.NODE_ENV = originalEnv
  })

  it('detects SSR capabilities', () => {
    // Server environment should support SSR
    delete (global as any).window

    const { result } = renderHook(() => useRuntimeEnvironment())

    expect(result.current.supportsSSR).toBe(true)
  })

  it('detects hydration capabilities', () => {
    // Client environment should support hydration
    global.window = originalWindow

    const { result } = renderHook(() => useRuntimeEnvironment())

    expect(result.current.supportsHydration).toBe(true)
  })

  it('detects service worker support', () => {
    // Mock service worker support
    global.navigator = {
      ...global.navigator,
      serviceWorker: {
        register: () => Promise.resolve({} as any)
      }
    } as any

    const { result } = renderHook(() => useRuntimeEnvironment())

    expect(result.current.supportsServiceWorker).toBe(true)
  })

  it('detects local storage support', () => {
    // Mock localStorage
    global.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null
    }

    const { result } = renderHook(() => useRuntimeEnvironment())

    expect(result.current.supportsLocalStorage).toBe(true)
  })

  it('handles localStorage access errors', () => {
    // Mock localStorage that throws on access
    Object.defineProperty(global, 'localStorage', {
      get: () => {
        throw new Error('localStorage not available')
      }
    })

    const { result } = renderHook(() => useRuntimeEnvironment())

    expect(result.current.supportsLocalStorage).toBe(false)
  })

  it('detects mobile environment', () => {
    // Mock mobile user agent
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true
    })

    const { result } = renderHook(() => useRuntimeEnvironment())

    expect(result.current.isMobile).toBe(true)
  })

  it('detects desktop environment', () => {
    // Mock desktop user agent
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      configurable: true
    })

    const { result } = renderHook(() => useRuntimeEnvironment())

    expect(result.current.isMobile).toBe(false)
  })

  it('provides framework-specific capabilities', () => {
    // Mock Next.js environment
    global.window = {
      ...originalWindow,
      __NEXT_DATA__: { page: '/', query: {}, buildId: 'test' }
    } as any

    const { result } = renderHook(() => useRuntimeEnvironment())

    expect(result.current.isNextJS).toBe(true)
    expect(result.current.capabilities).toContain('ssr')
    expect(result.current.capabilities).toContain('static-generation')
    expect(result.current.capabilities).toContain('api-routes')
  })

  it('provides Vite-specific capabilities', () => {
    // Mock Vite environment
    global.window = {
      ...originalWindow,
      __vite_plugin_react_preamble_installed__: true
    } as any

    const { result } = renderHook(() => useRuntimeEnvironment())

    expect(result.current.isVite).toBe(true)
    expect(result.current.capabilities).toContain('hmr')
    expect(result.current.capabilities).toContain('fast-refresh')
  })

  it('handles environment changes', () => {
    const { result, rerender } = renderHook(() => useRuntimeEnvironment())

    // Initial state
    expect(result.current.isClient).toBe(true)

    // Simulate environment change (though this wouldn't happen in practice)
    delete (global as any).window
    rerender()

    // Should still return stable reference due to memoization
    expect(result.current.isClient).toBe(true) // Memoized result
  })
})