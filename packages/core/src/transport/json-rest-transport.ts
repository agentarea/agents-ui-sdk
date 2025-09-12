// JSON-REST transport implementation for A2A protocol
import type {
  Transport,
  TransportRequest,
  TransportResponse,
  TransportConfig,
  TransportError,
  RestEndpointMapping
} from './index'

export class JsonRestTransport implements Transport {
  readonly type = 'json-rest' as const

  private config: TransportConfig
  private endpointMapping?: RestEndpointMapping

  constructor(config: TransportConfig, mapping?: RestEndpointMapping) {
    this.config = { ...config }
    this.endpointMapping = mapping
  }

  async request<T = unknown>(request: TransportRequest): Promise<TransportResponse<T>> {
    try {
      const { url, method, body } = this.resolveRequest(request)
      const response = await this.performHttpRequest(url, method, body, request.headers, request.timeout)

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

      const data = await this.safeJson<T>(response)
      return {
        success: true,
        data,
        headers: this.extractHeaders(response.headers)
      }
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
    // REST batch is not standardized; we will perform sequential requests for simplicity
    const results: TransportResponse<T>[] = []
    for (const req of requests) {
      results.push(await this.request<T>(req))
    }
    return results
  }

  async *stream<T = unknown>(request: TransportRequest): AsyncIterable<TransportResponse<T>> {
    // Streaming not implemented for REST by default
    throw new Error('Streaming not supported in JSON-REST transport. Use SSE or WebSocket transport instead.')
  }

  async healthCheck(): Promise<boolean> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        ...this.config.headers,
      }

      if (this.config.authentication) {
        const auth = this.config.authentication
        switch (auth.type) {
          case 'bearer':
            if (auth.token) headers['Authorization'] = `Bearer ${auth.token}`
            break
          case 'api-key':
            if (auth.apiKey && auth.headerName) headers[auth.headerName] = auth.apiKey
            else if (auth.apiKey) headers['X-API-Key'] = auth.apiKey
            break
          case 'basic':
            if (auth.username && auth.password) {
              const credentials = btoa(`${auth.username}:${auth.password}`)
              headers['Authorization'] = `Basic ${credentials}`
            }
            break
        }
      }

      const response = await fetch(`${this.config.baseURL}/health`, {
        method: 'GET',
        headers,
      })
      return response.ok
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

  private resolveRequest(request: TransportRequest): { url: string; method: string; body?: unknown } {
    if (this.endpointMapping && this.endpointMapping[request.method]) {
      const { path, method, paramMapping } = this.endpointMapping[request.method]
      let url = `${this.config.baseURL}${path}`
      let body: unknown
      
      if (paramMapping === 'query' && request.params && typeof request.params === 'object') {
        const qs = new URLSearchParams()
        for (const [key, value] of Object.entries(request.params as Record<string, any>)) {
          if (value !== undefined && value !== null) qs.append(key, String(value))
        }
        url += `?${qs.toString()}`
      } else if (paramMapping === 'body') {
        body = request.params
      } else {
        body = request.params
      }

      return { url, method, body }
    }

    // Fallback: assume request.method is a path for REST
    const url = `${this.config.baseURL}/${request.method}`
    return { url, method: 'POST', body: request.params }
  }

  private async performHttpRequest(
    url: string,
    method: string,
    body?: unknown,
    headers?: Record<string, string>,
    timeout?: number
  ): Promise<Response> {
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
      ...headers
    }

    // Authentication
    if (this.config.authentication) {
      const auth = this.config.authentication
      switch (auth.type) {
        case 'bearer':
          if (auth.token) requestHeaders['Authorization'] = `Bearer ${auth.token}`
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
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  private async safeJson<T>(response: Response): Promise<T> {
    const text = await response.text()
    try {
      return JSON.parse(text) as T
    } catch {
      // @ts-expect-error - when T is not JSON object
      return text
    }
  }

  private extractHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {}
    headers.forEach((value, key) => {
      result[key] = value
    })
    return result
  }
}