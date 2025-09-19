// Transport layer abstraction for A2A protocol communication
// Supports JSON-RPC 2.0 and JSON-REST transports

export interface TransportRequest {
  method: string
  params?: unknown
  headers?: Record<string, string>
  timeout?: number
}

export interface TransportResponse<T = unknown> {
  success: boolean
  data?: T
  error?: TransportError
  headers?: Record<string, string>
}

export interface TransportError {
  code: number | string
  message: string
  data?: unknown
}

export interface TransportConfig {
  baseURL: string
  timeout?: number
  retries?: number
  headers?: Record<string, string>
  authentication?: TransportAuth
}

export interface TransportAuth {
  type: 'bearer' | 'api-key' | 'oauth' | 'basic' | 'none'
  token?: string
  apiKey?: string
  username?: string
  password?: string
  headerName?: string
}

// Base transport interface
export interface Transport {
  readonly type: 'json-rpc' | 'json-rest'
  
  // Core request method
  request<T = unknown>(request: TransportRequest): Promise<TransportResponse<T>>
  
  // Batch requests (if supported)
  batch?<T = unknown>(requests: TransportRequest[]): Promise<TransportResponse<T>[]>
  
  // Streaming support
  stream?<T = unknown>(request: TransportRequest): AsyncIterable<TransportResponse<T>>
  
  // Health check
  healthCheck(): Promise<boolean>
  
  // Configuration
  configure(config: Partial<TransportConfig>): void
  getConfig(): TransportConfig
}

// JSON-RPC 2.0 specific types
export interface JsonRpcRequest {
  jsonrpc: '2.0'
  method: string
  params?: unknown
  id?: string | number | null
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0'
  id: string | number | null
  result?: T
  error?: JsonRpcError
}

export interface JsonRpcError {
  code: number
  message: string
  data?: unknown
}

// JSON-REST specific types
export interface RestRequest {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: unknown
  query?: Record<string, string | number | boolean>
}

// Method mapping for REST endpoints
export interface RestEndpointMapping {
  [methodName: string]: {
    path: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    paramMapping?: 'body' | 'query' | 'path'
  }
}

// Transport factory interface
export interface TransportFactory {
  createTransport(type: 'json-rpc' | 'json-rest', config: TransportConfig, mapping?: RestEndpointMapping): Transport
}

// Re-export all transport implementations
export * from './json-rpc-transport'
export * from './json-rest-transport'
export * from './transport-factory'