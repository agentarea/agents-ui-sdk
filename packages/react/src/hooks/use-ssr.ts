"use client"

import { useEffect, useState } from 'react'

/**
 * Hook to detect if we're running on the client side
 * Useful for SSR compatibility with Next.js
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}

/**
 * Hook to safely check if we're in a browser environment
 * Returns false during SSR, true on client
 */
export function useIsBrowser(): boolean {
  const isClient = useIsClient()
  return isClient && typeof window !== 'undefined'
}

/**
 * Hook to safely access window object
 * Returns null during SSR
 */
export function useWindow(): Window | null {
  const isBrowser = useIsBrowser()
  return isBrowser ? window : null
}