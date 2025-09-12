// JSON-RPC 2.0 transport implementation for A2A protocol
import type { 
  Transport, 
  TransportRequest, 
  TransportResponse, 
  TransportConfig, 
  TransportError,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcError
} from './index'

export class JsonRpcTransport implements Transport {
  readonly type = 'json-rpc' as const
  
  private config: TransportConfig
  private requestId = 0

  constructor(config: TransportConfig) {
    this.config = { ...config }
  }

  async request<T = unknown>(request: TransportRequest): Promise<TransportResponse<T>> {
    try {
      const rpcRequest = this.buildRpcRequest(request)
      const response = await this.performHttpRequest(rpcRequest, request.headers, request.timeout)
      
      if (!response.ok) {
        return {
          success: false,
          error: {
            code: response.status,
            message: `HTTP ${response.status}: ${response.statusText}`,
            data: await response.text()
          }
        }
      }

      const rpcResponse = await response.json() as JsonRpcResponse<T>
      return this.processRpcResponse(rpcResponse)
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TRANSPORT_ERROR',
          message: (error as Error).message,
          data: error
        }
      }
    }
  }

  async batch<T = unknown>(requests: TransportRequest[]): Promise<TransportResponse<T>[]> {
    try {
      const rpcRequests = requests.map(req => this.buildRpcRequest(req))
      const firstRequest = requests[0]
      
      const response = await this.performHttpRequest(
        rpcRequests,
        firstRequest?.headers,
        firstRequest?.timeout
      )

      if (!response.ok) {
        const error: TransportError = {
          code: response.status,
          message: `HTTP ${response.status}: ${response.statusText}`,
          data: await response.text()
        }
        return requests.map(() => ({ success: false, error }))
      }

      const rpcResponses = await response.json() as JsonRpcResponse<T>[]
      return rpcResponses.map((rpcResponse) => this.processRpcResponse(rpcResponse))
    } catch (error) {
      const transportError: TransportError = {
        code: 'BATCH_ERROR',
        message: (error as Error).message,
        data: error
      }
      return requests.map(() => ({ success: false, error: transportError }))
    }
  }

  async *stream<T = unknown>(request: TransportRequest): AsyncIterable<TransportResponse<T>> {
    // JSON-RPC doesn't natively support streaming, but we can implement polling
    // or use server-sent events if the server supports it
    throw new Error('Streaming not supported in JSON-RPC transport. Use WebSocket or SSE transport instead.')
  }

  async healthCheck(): Promise<boolean> {
    try {
      const healthRequest: TransportRequest = {
        method: 'system.ping',
        params: {}
      }
      
      const response = await this.request(healthRequest)
      return response.success
    } catch (error) {
      return false
    }
  }

  configure(config: Partial<TransportConfig>): void {
    this.config = { ...this.config, ...config }
  }

  getConfig(): TransportConfig {
    return { ...this.config }
  }

  private buildRpcRequest(request: TransportRequest): JsonRpcRequest {
    return {
      jsonrpc: '2.0',
      method: request.method,
      params: request.params,
      id: ++this.requestId
    }
  }

  private async performHttpRequest(
    body: JsonRpcRequest | JsonRpcRequest[],
    headers?: Record<string, string>,
    timeout?: number
  ): Promise<Response> {
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
      ...headers
    }

    // Add authentication headers
    if (this.config.authentication) {
      const auth = this.config.authentication
      switch (auth.type) {
        case 'bearer':
          if (auth.token) {
            requestHeaders['Authorization'] = `Bearer ${auth.token}`
          }
          break
        case 'api-key':
          if (auth.apiKey && auth.headerName) {
            requestHeaders[auth.headerName] = auth.apiKey
          } else if (auth.apiKey) {
            requestHeaders['X-API-Key'] = auth.apiKey
          }
          break
        case 'basic':
          if (auth.username && auth.password) {
            const credentials = btoa(`${auth.username}:${auth.password}`)
            requestHeaders['Authorization'] = `Basic ${credentials}`
          }
          break
      }
    }

    const controller = new AbortController()
    const timeoutMs = timeout || this.config.timeout || 30000
    
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(this.config.baseURL, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(body),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  private processRpcResponse<T>(rpcResponse: JsonRpcResponse<T>): TransportResponse<T> {
    if (rpcResponse.error) {
      return {
        success: false,
        error: {
          code: rpcResponse.error.code,
          message: rpcResponse.error.message,
          data: rpcResponse.error.data
        }
      }
    }

    return {
      success: true,
      data: rpcResponse.result
    }
  }

  // Method for mapping A2A protocol methods to JSON-RPC calls
  static mapA2AMethodToRpc(method: string): string {
    const methodMap: Record<string, string> = {
      'getAgentCard': 'agent.getCard',
      'sendMessage': 'message.send',
      'createTask': 'task.create',
      'getTask': 'task.get',
      'updateTask': 'task.update',
      'cancelTask': 'task.cancel',
      'listCapabilities': 'capabilities.list',
      'negotiate': 'capabilities.negotiate'
    }

    return methodMap[method] || method
  }
}