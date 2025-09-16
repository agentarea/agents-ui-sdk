// Tool primitive for agent capabilities and function calling

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  enum?: string[];
  properties?: Record<string, ToolParameter>;
  items?: ToolParameter;
}

export interface ToolSchema {
  id: string;
  name: string;
  description: string;
  parameters: ToolParameter[];
  returns?: {
    type: string;
    description: string;
  };
  examples?: {
    input: Record<string, any>;
    output: any;
    description: string;
  }[];
}

export interface ToolExecution {
  id: string;
  toolId: string;
  arguments: Record<string, any>;
  result?: any;
  error?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface ToolConfig {
  timeout?: number;
  retries?: number;
  validation?: boolean;
  logging?: boolean;
  rateLimit?: {
    requests: number;
    window: number; // milliseconds
  };
}

export type ToolFunction = (args: Record<string, any>) => Promise<any> | any;

export class Tool {
  private schema: ToolSchema;
  private implementation: ToolFunction;
  private config: ToolConfig;
  private executions: Map<string, ToolExecution> = new Map();
  private rateLimitTracker: { timestamp: number; count: number } = { timestamp: 0, count: 0 };

  constructor(schema: ToolSchema, implementation: ToolFunction, config: ToolConfig = {}) {
    this.schema = schema;
    this.implementation = implementation;
    this.config = {
      timeout: config.timeout || 30000,
      retries: config.retries || 0,
      validation: config.validation ?? true,
      logging: config.logging ?? true,
      rateLimit: config.rateLimit
    };
  }

  async execute(args: Record<string, any>, executionId?: string): Promise<ToolExecution> {
    const id = executionId || `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const execution: ToolExecution = {
      id,
      toolId: this.schema.id,
      arguments: args,
      startTime: new Date()
    };

    this.executions.set(id, execution);

    try {
      // Rate limiting check
      if (this.config.rateLimit && !this.checkRateLimit()) {
        throw new Error(`Rate limit exceeded for tool ${this.schema.name}`);
      }

      // Validation
      if (this.config.validation) {
        this.validateArguments(args);
      }

      // Execute with timeout
      const result = await this.executeWithTimeout(args);
      
      execution.result = result;
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();

      if (this.config.logging) {
        console.log(`Tool ${this.schema.name} executed successfully in ${execution.duration}ms`);
      }

      return execution;

    } catch (error) {
      execution.error = error instanceof Error ? error.message : String(error);
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();

      if (this.config.logging) {
        console.error(`Tool ${this.schema.name} failed:`, execution.error);
      }

      return execution;
    }
  }

  getSchema(): ToolSchema {
    return { ...this.schema };
  }

  getConfig(): ToolConfig {
    return { ...this.config };
  }

  getExecution(id: string): ToolExecution | undefined {
    return this.executions.get(id);
  }

  getExecutions(): ToolExecution[] {
    return Array.from(this.executions.values()).sort(
      (a, b) => b.startTime.getTime() - a.startTime.getTime()
    );
  }

  getSuccessRate(): number {
    const executions = this.getExecutions();
    if (executions.length === 0) return 0;
    
    const successful = executions.filter(exec => !exec.error).length;
    return successful / executions.length;
  }

  getAverageExecutionTime(): number {
    const executions = this.getExecutions().filter(exec => exec.duration !== undefined);
    if (executions.length === 0) return 0;
    
    const totalTime = executions.reduce((sum, exec) => sum + (exec.duration || 0), 0);
    return totalTime / executions.length;
  }

  updateConfig(config: Partial<ToolConfig>): void {
    Object.assign(this.config, config);
  }

  clearExecutions(): void {
    this.executions.clear();
  }

  private async executeWithTimeout(args: Record<string, any>): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Tool execution timed out after ${this.config.timeout}ms`));
      }, this.config.timeout);

      try {
        const result = await this.implementation(args);
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  private validateArguments(args: Record<string, any>): void {
    for (const param of this.schema.parameters) {
      if (param.required && !(param.name in args)) {
        throw new Error(`Missing required parameter: ${param.name}`);
      }

      if (param.name in args) {
        this.validateParameterType(param, args[param.name]);
      }
    }
  }

  private validateParameterType(param: ToolParameter, value: any): void {
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    
    if (param.type !== actualType && !(param.type === 'object' && actualType === 'object')) {
      throw new Error(`Parameter ${param.name} expected ${param.type}, got ${actualType}`);
    }

    if (param.enum && !param.enum.includes(value)) {
      throw new Error(`Parameter ${param.name} must be one of: ${param.enum.join(', ')}`);
    }
  }

  private checkRateLimit(): boolean {
    if (!this.config.rateLimit) return true;

    const now = Date.now();
    const windowStart = now - this.config.rateLimit.window;

    if (this.rateLimitTracker.timestamp < windowStart) {
      // Reset window
      this.rateLimitTracker = { timestamp: now, count: 1 };
      return true;
    }

    if (this.rateLimitTracker.count >= this.config.rateLimit.requests) {
      return false;
    }

    this.rateLimitTracker.count++;
    return true;
  }
}

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private categories: Map<string, string[]> = new Map();

  registerTool(tool: Tool, category?: string): void {
    const schema = tool.getSchema();
    this.tools.set(schema.id, tool);
    
    if (category) {
      if (!this.categories.has(category)) {
        this.categories.set(category, []);
      }
      this.categories.get(category)!.push(schema.id);
    }
  }

  unregisterTool(id: string): boolean {
    const deleted = this.tools.delete(id);
    
    // Remove from categories
    for (const [category, toolIds] of this.categories.entries()) {
      const index = toolIds.indexOf(id);
      if (index > -1) {
        toolIds.splice(index, 1);
        if (toolIds.length === 0) {
          this.categories.delete(category);
        }
      }
    }
    
    return deleted;
  }

  getTool(id: string): Tool | undefined {
    return this.tools.get(id);
  }

  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  getToolsByCategory(category: string): Tool[] {
    const toolIds = this.categories.get(category) || [];
    return toolIds.map(id => this.tools.get(id)!).filter(Boolean);
  }

  getCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  searchTools(query: string): Tool[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllTools().filter(tool => {
      const schema = tool.getSchema();
      return (
        schema.name.toLowerCase().includes(lowerQuery) ||
        schema.description.toLowerCase().includes(lowerQuery)
      );
    });
  }

  async executeTool(toolId: string, args: Record<string, any>): Promise<ToolExecution> {
    const tool = this.getTool(toolId);
    if (!tool) {
      throw new Error(`Tool not found: ${toolId}`);
    }
    return tool.execute(args);
  }

  getToolSchemas(): ToolSchema[] {
    return this.getAllTools().map(tool => tool.getSchema());
  }
}

// Built-in tools
export const createBuiltinTools = (): Tool[] => {
  return [
    new Tool(
      {
        id: 'web_search',
        name: 'Web Search',
        description: 'Search the web for information',
        parameters: [
          {
            name: 'query',
            type: 'string',
            description: 'Search query',
            required: true
          },
          {
            name: 'limit',
            type: 'number',
            description: 'Maximum number of results',
            required: false
          }
        ],
        returns: {
          type: 'array',
          description: 'Array of search results'
        }
      },
      async (args) => {
        // Simulate web search
        return [
          {
            title: `Search result for: ${args.query}`,
            url: 'https://example.com',
            snippet: 'This is a simulated search result.'
          }
        ];
      }
    ),

    new Tool(
      {
        id: 'calculate',
        name: 'Calculator',
        description: 'Perform mathematical calculations',
        parameters: [
          {
            name: 'expression',
            type: 'string',
            description: 'Mathematical expression to evaluate',
            required: true
          }
        ],
        returns: {
          type: 'number',
          description: 'Calculation result'
        }
      },
      async (args) => {
        // Simple calculator (in real implementation, use a safe math parser)
        try {
          // This is unsafe - use a proper math parser in production
          return eval(args.expression);
        } catch (error) {
          throw new Error('Invalid mathematical expression');
        }
      },
      { timeout: 5000 }
    )
  ];
};