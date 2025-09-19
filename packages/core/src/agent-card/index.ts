// Agent Card resolver system for A2A protocol
// Supports various discovery methods including well-known endpoints, custom resolvers, and registries

import type { AgentCard } from '../types'

// Agent Card resolver configuration
export interface AgentCardResolverConfig {
  type: 'well-known' | 'custom-endpoint' | 'registry' | 'static' | 'function' | 'multi'
  endpoint?: string
  fallbackEndpoints?: string[]
  timeout?: number
  retries?: number
  transform?: AgentCardTransform
  auth?: {
    type: 'bearer' | 'api-key' | 'basic'
    token?: string
    apiKey?: string
    username?: string
    password?: string
  }
}

// Function to transform raw agent card data
export interface AgentCardTransform {
  (rawData: any): AgentCard
}

// Agent Card resolver interface
export interface AgentCardResolver {
  readonly type: string
  resolve(url: string): Promise<AgentCard>
  configure(config: Partial<AgentCardResolverConfig>): void
  getConfig(): AgentCardResolverConfig
}

// Base resolver implementation
export abstract class BaseAgentCardResolver implements AgentCardResolver {
  protected config: AgentCardResolverConfig

  constructor(config: AgentCardResolverConfig) {
    this.config = { ...config }
  }

  abstract readonly type: string
  abstract resolve(url: string): Promise<AgentCard>

  configure(config: Partial<AgentCardResolverConfig>): void {
    this.config = { ...this.config, ...config }
  }

  getConfig(): AgentCardResolverConfig {
    return { ...this.config }
  }

  protected async fetchJson(url: string): Promise<any> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'AgentArea-UI-SDK/2.0'
    }

    // Add authentication
    if (this.config.auth) {
      switch (this.config.auth.type) {
        case 'bearer':
          if (this.config.auth.token) {
            headers['Authorization'] = `Bearer ${this.config.auth.token}`
          }
          break
        case 'api-key':
          if (this.config.auth.apiKey) {
            headers['X-API-Key'] = this.config.auth.apiKey
          }
          break
        case 'basic':
          if (this.config.auth.username && this.config.auth.password) {
            const credentials = btoa(`${this.config.auth.username}:${this.config.auth.password}`)
            headers['Authorization'] = `Basic ${credentials}`
          }
          break
      }
    }

    const controller = new AbortController()
    const timeout = this.config.timeout || 10000
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  protected transformAgentCard(rawData: any): AgentCard {
    if (this.config.transform) {
      return this.config.transform(rawData)
    }

    // Default transformation - assume A2A standard format
    return {
      name: rawData.name || 'Unknown Agent',
      description: rawData.description || '',
      capabilities: rawData.skills?.map((skill: any) => ({
        name: skill.name,
        description: skill.description,
        inputTypes: skill.defaultInputModes || rawData.defaultInputModes || [],
        outputTypes: skill.defaultOutputModes || rawData.defaultOutputModes || []
      })) || rawData.capabilities || [],
      endpoints: { main: rawData.url || rawData.endpoint },
      streaming: rawData.capabilities?.streaming || false,
      pushNotifications: rawData.capabilities?.pushNotifications || false,
    }
  }
}

// Well-known endpoint resolver (/.well-known/agent-card.json)
export class WellKnownAgentCardResolver extends BaseAgentCardResolver {
  readonly type = 'well-known'

  async resolve(url: string): Promise<AgentCard> {
    const wellKnownUrl = this.buildWellKnownUrl(url)
    
    try {
      const rawData = await this.fetchJson(wellKnownUrl)
      return this.transformAgentCard(rawData)
    } catch (error) {
      throw new Error(`Failed to resolve agent card from well-known endpoint: ${(error as Error).message}`)
    }
  }

  private buildWellKnownUrl(baseUrl: string): string {
    const url = new URL(baseUrl)
    return `${url.protocol}//${url.host}/.well-known/agent-card.json`
  }
}

// Custom endpoint resolver
export class CustomEndpointAgentCardResolver extends BaseAgentCardResolver {
  readonly type = 'custom-endpoint'

  async resolve(url: string): Promise<AgentCard> {
    const endpoint = this.config.endpoint || `${url}/agent-card`
    
    try {
      const rawData = await this.fetchJson(endpoint)
      return this.transformAgentCard(rawData)
    } catch (error) {
      throw new Error(`Failed to resolve agent card from custom endpoint: ${(error as Error).message}`)
    }
  }
}

// Static agent card resolver (for testing or offline scenarios)
export class StaticAgentCardResolver extends BaseAgentCardResolver {
  readonly type = 'static'
  private staticCard: AgentCard

  constructor(config: AgentCardResolverConfig, agentCard: AgentCard) {
    super(config)
    this.staticCard = agentCard
  }

  async resolve(url: string): Promise<AgentCard> {
    // Return static card with URL updated
    return {
      ...this.staticCard,
      endpoints: { ...this.staticCard.endpoints, main: url },
    }
  }
}

// Function-based resolver for custom logic
export class FunctionAgentCardResolver extends BaseAgentCardResolver {
  readonly type = 'function'
  private resolverFunction: (url: string) => Promise<AgentCard>

  constructor(config: AgentCardResolverConfig, resolverFn: (url: string) => Promise<AgentCard>) {
    super(config)
    this.resolverFunction = resolverFn
  }

  async resolve(url: string): Promise<AgentCard> {
    try {
      return await this.resolverFunction(url)
    } catch (error) {
      throw new Error(`Function resolver failed: ${(error as Error).message}`)
    }
  }
}

// Agent Card resolver factory
export class AgentCardResolverFactory {
  createResolver(config: AgentCardResolverConfig, ...args: any[]): AgentCardResolver {
    switch (config.type) {
      case 'well-known':
        return new WellKnownAgentCardResolver(config)
      case 'custom-endpoint':
        return new CustomEndpointAgentCardResolver(config)
      case 'static':
        if (args[0]) {
          return new StaticAgentCardResolver(config, args[0])
        }
        throw new Error('Static resolver requires an AgentCard argument')
      case 'function':
        if (args[0] && typeof args[0] === 'function') {
          return new FunctionAgentCardResolver(config, args[0])
        }
        throw new Error('Function resolver requires a function argument')
      default:
        throw new Error(`Unsupported resolver type: ${config.type}`)
    }
  }
}

export function createAgentCardResolverFactory(): AgentCardResolverFactory {
  return new AgentCardResolverFactory()
}

// Multi-resolver with fallback support
export class MultiAgentCardResolver implements AgentCardResolver {
  readonly type = 'multi'
  private resolvers: AgentCardResolver[]
  private config: AgentCardResolverConfig

  constructor(resolvers: AgentCardResolver[], config: AgentCardResolverConfig = { type: 'multi' }) {
    this.resolvers = resolvers
    this.config = config
  }

  async resolve(url: string): Promise<AgentCard> {
    const errors: Error[] = []

    for (const resolver of this.resolvers) {
      try {
        return await resolver.resolve(url)
      } catch (error) {
        errors.push(error as Error)
      }
    }

    throw new Error(`All resolvers failed: ${errors.map(e => e.message).join('; ')}`)
  }

  configure(config: Partial<AgentCardResolverConfig>): void {
    this.config = { ...this.config, ...config }
    // Optionally propagate config to child resolvers
  }

  getConfig(): AgentCardResolverConfig {
    return { ...this.config }
  }
}

// Default agent card resolver factory function
export function createDefaultAgentCardResolver(config?: Partial<AgentCardResolverConfig>): AgentCardResolver {
  const resolverConfig: AgentCardResolverConfig = {
    type: 'well-known',
    timeout: 10000,
    retries: 2,
    ...config
  }

  // Create multi-resolver with well-known and custom-endpoint fallback
  const factory = new AgentCardResolverFactory()
  const resolvers = [
    factory.createResolver({ ...resolverConfig, type: 'well-known' }),
    factory.createResolver({ ...resolverConfig, type: 'custom-endpoint' })
  ]

  return new MultiAgentCardResolver(resolvers, resolverConfig)
}