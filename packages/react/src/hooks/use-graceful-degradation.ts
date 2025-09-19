"use client"

import React from 'react'
import { FeatureDetection, ArtifactUtils, InputUtils, ErrorMessages } from '../lib/fallback-utils'
import type { EnhancedArtifact, TaskInputRequest } from '@agentarea/core'

/**
 * Hook for managing graceful degradation across the application
 */
export function useGracefulDegradation() {
  const [features, setFeatures] = React.useState({
    webSockets: false,
    fileAPI: false,
    indexedDB: false,
    localStorage: false,
    notifications: false,
    serviceWorker: false,
    clipboard: false,
    geolocation: false
  })

  const [isChecked, setIsChecked] = React.useState(false)

  // Check feature support on mount
  React.useEffect(() => {
    const checkFeatures = async () => {
      setFeatures({
        webSockets: FeatureDetection.hasWebSocketSupport(),
        fileAPI: FeatureDetection.hasFileAPISupport(),
        indexedDB: FeatureDetection.hasIndexedDBSupport(),
        localStorage: FeatureDetection.hasLocalStorageSupport(),
        notifications: FeatureDetection.hasNotificationSupport(),
        serviceWorker: FeatureDetection.hasServiceWorkerSupport(),
        clipboard: FeatureDetection.hasClipboardSupport(),
        geolocation: FeatureDetection.hasGeolocationSupport()
      })
      setIsChecked(true)
    }

    checkFeatures()
  }, [])

  return {
    features,
    isChecked,
    
    // Feature checks
    canUseRealTime: features.webSockets,
    canUploadFiles: features.fileAPI,
    canStoreOffline: features.indexedDB || features.localStorage,
    canShowNotifications: features.notifications,
    canUseOfflineMode: features.serviceWorker,
    canCopyToClipboard: features.clipboard,
    canUseLocation: features.geolocation
  }
}

/**
 * Hook for artifact fallback handling
 */
export function useArtifactFallback(artifact: EnhancedArtifact) {
  const isSupported = ArtifactUtils.isTypeSupported(artifact)
  const fallbackType = ArtifactUtils.getFallbackType(artifact)
  const canDisplayAsText = ArtifactUtils.canDisplayAsText(artifact)
  const canDownload = ArtifactUtils.canDownload(artifact)
  const icon = ArtifactUtils.getTypeIcon(artifact.displayType || artifact.type)

  const [renderError, setRenderError] = React.useState<Error | null>(null)
  const [useFallback, setUseFallback] = React.useState(!isSupported)

  const handleRenderError = React.useCallback((error: Error) => {
    setRenderError(error)
    setUseFallback(true)
  }, [])

  const retryRender = React.useCallback(() => {
    setRenderError(null)
    setUseFallback(false)
  }, [])

  const forceFallback = React.useCallback(() => {
    setUseFallback(true)
  }, [])

  return {
    isSupported,
    useFallback,
    fallbackType,
    canDisplayAsText,
    canDownload,
    icon,
    renderError,
    handleRenderError,
    retryRender,
    forceFallback
  }
}

/**
 * Hook for input fallback handling
 */
export function useInputFallback(request: TaskInputRequest) {
  const isSupported = InputUtils.isTypeSupported(request)
  const fallbackType = InputUtils.getFallbackType(request)
  const canUseTextFallback = InputUtils.canUseTextFallback(request)
  const icon = InputUtils.getTypeIcon(request.type)

  const [renderError, setRenderError] = React.useState<Error | null>(null)
  const [useFallback, setUseFallback] = React.useState(!isSupported)

  const handleRenderError = React.useCallback((error: Error) => {
    setRenderError(error)
    setUseFallback(true)
  }, [])

  const retryRender = React.useCallback(() => {
    setRenderError(null)
    setUseFallback(false)
  }, [])

  const forceFallback = React.useCallback(() => {
    setUseFallback(true)
  }, [])

  return {
    isSupported,
    useFallback,
    fallbackType,
    canUseTextFallback,
    icon,
    renderError,
    handleRenderError,
    retryRender,
    forceFallback
  }
}

/**
 * Hook for error handling and user-friendly messaging
 */
export function useErrorHandling() {
  const [errors, setErrors] = React.useState<Array<{
    id: string
    error: Error
    context?: string
    timestamp: Date
  }>>([])

  const addError = React.useCallback((error: Error, context?: string) => {
    const errorEntry = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      error,
      context,
      timestamp: new Date()
    }
    
    setErrors(prev => [...prev, errorEntry])
    
    return errorEntry.id
  }, [])

  const removeError = React.useCallback((errorId: string) => {
    setErrors(prev => prev.filter(e => e.id !== errorId))
  }, [])

  const clearErrors = React.useCallback(() => {
    setErrors([])
  }, [])

  const getErrorMessage = React.useCallback((error: Error) => {
    return ErrorMessages.getUserFriendlyMessage(error)
  }, [])

  const getErrorGuidance = React.useCallback((error: Error) => {
    return ErrorMessages.getActionableGuidance(error)
  }, [])

  const getErrorSeverity = React.useCallback((error: Error) => {
    return ErrorMessages.getErrorSeverity(error)
  }, [])

  return {
    errors,
    addError,
    removeError,
    clearErrors,
    getErrorMessage,
    getErrorGuidance,
    getErrorSeverity,
    hasErrors: errors.length > 0,
    errorCount: errors.length
  }
}

/**
 * Hook for progressive enhancement
 */
export function useProgressiveEnhancement<T>(
  baseValue: T,
  enhancedValue: T,
  canUseEnhanced: () => boolean
) {
  const [value, setValue] = React.useState<T>(baseValue)
  const [isEnhanced, setIsEnhanced] = React.useState(false)

  React.useEffect(() => {
    const checkEnhancement = async () => {
      try {
        const enhanced = canUseEnhanced()
        setIsEnhanced(enhanced)
        setValue(enhanced ? enhancedValue : baseValue)
      } catch {
        setIsEnhanced(false)
        setValue(baseValue)
      }
    }

    checkEnhancement()
  }, [baseValue, enhancedValue, canUseEnhanced])

  const forceBase = React.useCallback(() => {
    setIsEnhanced(false)
    setValue(baseValue)
  }, [baseValue])

  const forceEnhanced = React.useCallback(() => {
    setIsEnhanced(true)
    setValue(enhancedValue)
  }, [enhancedValue])

  return {
    value,
    isEnhanced,
    forceBase,
    forceEnhanced
  }
}

/**
 * Hook for offline/online state management
 */
export function useOfflineSupport() {
  const [isOnline, setIsOnline] = React.useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [wasOffline, setWasOffline] = React.useState(false)

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (wasOffline) {
        // Trigger reconnection logic
        window.dispatchEvent(new CustomEvent('agentui:reconnect'))
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [wasOffline])

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    canUseOfflineFeatures: FeatureDetection.hasServiceWorkerSupport() || FeatureDetection.hasLocalStorageSupport()
  }
}

/**
 * Hook for retry mechanisms with exponential backoff
 */
export function useRetryMechanism<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
) {
  const [isRetrying, setIsRetrying] = React.useState(false)
  const [retryCount, setRetryCount] = React.useState(0)
  const [lastError, setLastError] = React.useState<Error | null>(null)

  const retry = React.useCallback(async (): Promise<T> => {
    setIsRetrying(true)
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation()
        setRetryCount(0)
        setLastError(null)
        setIsRetrying(false)
        return result
      } catch (error) {
        setLastError(error as Error)
        setRetryCount(attempt + 1)
        
        if (attempt === maxRetries) {
          setIsRetrying(false)
          throw error
        }
        
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    setIsRetrying(false)
    throw lastError
  }, [operation, maxRetries, baseDelay])

  const reset = React.useCallback(() => {
    setRetryCount(0)
    setLastError(null)
    setIsRetrying(false)
  }, [])

  return {
    retry,
    reset,
    isRetrying,
    retryCount,
    lastError,
    canRetry: retryCount < maxRetries,
    maxRetries
  }
}