// ============================================================================
// SPAC OS Claude API Client - Anthropic Claude API Integration
// ============================================================================

import Anthropic from '@anthropic-ai/sdk';

import { AI_CONFIG } from './prompts';

import type { AIError, AIResponseMetadata } from './types';

// ============================================================================
// Types
// ============================================================================

/**
 * Claude API message structure
 */
export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Claude API streaming chunk
 */
export interface StreamChunk {
  type: 'text' | 'done' | 'error';
  text?: string;
  error?: string;
}

/**
 * Claude client configuration
 */
export interface ClaudeClientConfig {
  apiKey?: string;
  defaultModel?: string;
  maxRetries?: number;
  timeout?: number;
}

/**
 * Request options for Claude API calls
 */
export interface ClaudeRequestOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  timeout?: number;
  stream?: boolean;
}

/**
 * Rate limiter configuration
 */
interface RateLimiterConfig {
  maxRequestsPerMinute: number;
  maxTokensPerMinute: number;
}

/**
 * Rate limiter state
 */
interface RateLimiterState {
  requests: number[];
  tokens: number[];
}

// ============================================================================
// Rate Limiter
// ============================================================================

/**
 * Token bucket rate limiter for API requests
 */
class RateLimiter {
  private config: RateLimiterConfig;
  private state: RateLimiterState;

  constructor(config: RateLimiterConfig) {
    this.config = config;
    this.state = {
      requests: [],
      tokens: [],
    };
  }

  /**
   * Check if a request can be made
   */
  async checkLimit(estimatedTokens: number = 1000): Promise<boolean> {
    this.cleanupOldEntries();

    const currentRequests = this.state.requests.length;
    const currentTokens = this.state.tokens.reduce((sum, t) => sum + t, 0);

    if (currentRequests >= this.config.maxRequestsPerMinute) {
      return false;
    }

    if (currentTokens + estimatedTokens > this.config.maxTokensPerMinute) {
      return false;
    }

    return true;
  }

  /**
   * Record a request
   */
  recordRequest(tokensUsed: number): void {
    const now = Date.now();
    this.state.requests.push(now);
    this.state.tokens.push(tokensUsed);
  }

  /**
   * Wait until a request can be made
   */
  async waitForCapacity(estimatedTokens: number = 1000): Promise<void> {
    while (!(await this.checkLimit(estimatedTokens))) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  /**
   * Get current rate limit status
   */
  getStatus(): {
    requestsUsed: number;
    tokensUsed: number;
    requestsRemaining: number;
    tokensRemaining: number;
  } {
    this.cleanupOldEntries();
    const requestsUsed = this.state.requests.length;
    const tokensUsed = this.state.tokens.reduce((sum, t) => sum + t, 0);

    return {
      requestsUsed,
      tokensUsed,
      requestsRemaining: Math.max(0, this.config.maxRequestsPerMinute - requestsUsed),
      tokensRemaining: Math.max(0, this.config.maxTokensPerMinute - tokensUsed),
    };
  }

  /**
   * Remove entries older than 1 minute
   */
  private cleanupOldEntries(): void {
    const oneMinuteAgo = Date.now() - 60000;
    const validIndices: number[] = [];

    this.state.requests = this.state.requests.filter((time, index) => {
      if (time > oneMinuteAgo) {
        validIndices.push(index);
        return true;
      }
      return false;
    });

    this.state.tokens = this.state.tokens.filter((_, index) =>
      validIndices.includes(index)
    );
  }
}

// ============================================================================
// Claude Client
// ============================================================================

/**
 * Claude API client with streaming support, rate limiting, and error handling
 */
export class ClaudeClient {
  private client: Anthropic;
  private defaultModel: string;
  private maxRetries: number;
  private timeout: number;
  private rateLimiter: RateLimiter;
  private isConfigured: boolean;

  constructor(config: ClaudeClientConfig = {}) {
    const apiKey = config.apiKey || process.env['ANTHROPIC_API_KEY'] || '';
    this.isConfigured = !!apiKey;

    this.client = new Anthropic({
      apiKey: apiKey || 'dummy-key', // SDK requires a key, we'll check isConfigured before calls
    });

    this.defaultModel = config.defaultModel || AI_CONFIG.models.default;
    this.maxRetries = config.maxRetries || 3;
    this.timeout = config.timeout || 60000;

    // Default rate limits for Claude API
    this.rateLimiter = new RateLimiter({
      maxRequestsPerMinute: 50,
      maxTokensPerMinute: 100000,
    });
  }

  /**
   * Check if the client is properly configured
   */
  checkConfigured(): boolean {
    return this.isConfigured;
  }

  /**
   * Get rate limiter status
   */
  getRateLimitStatus() {
    return this.rateLimiter.getStatus();
  }

  /**
   * Send a message to Claude API
   */
  async sendMessage(
    userMessage: string,
    options: ClaudeRequestOptions = {}
  ): Promise<{
    content: string;
    metadata: AIResponseMetadata;
  }> {
    if (!this.isConfigured) {
      throw this.createError('API_KEY_MISSING', 'Anthropic API key is not configured', false);
    }

    const estimatedTokens = Math.ceil(userMessage.length / 4) + (options.maxTokens || 4096);
    await this.rateLimiter.waitForCapacity(estimatedTokens);

    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.messages.create({
          model: options.model || this.defaultModel,
          max_tokens: options.maxTokens || AI_CONFIG.maxTokens.analysis,
          temperature: options.temperature ?? AI_CONFIG.temperature.analysis,
          system: options.systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        });

        const processingTime = Date.now() - startTime;

        const content = response.content
          .filter((block): block is Anthropic.TextBlock => block.type === 'text')
          .map((block) => block.text)
          .join('\n');

        const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
        this.rateLimiter.recordRequest(tokensUsed);

        return {
          content,
          metadata: {
            model: response.model,
            tokensUsed: {
              input: response.usage.input_tokens,
              output: response.usage.output_tokens,
              total: tokensUsed,
            },
            processingTime,
            timestamp: new Date(),
            requestId: response.id,
          },
        };
      } catch (error) {
        lastError = error as Error;

        if (this.isRetryableError(error)) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw this.handleAPIError(error);
      }
    }

    throw this.handleAPIError(lastError);
  }

  /**
   * Send a conversation with multiple messages
   */
  async sendConversation(
    messages: ClaudeMessage[],
    options: ClaudeRequestOptions = {}
  ): Promise<{
    content: string;
    metadata: AIResponseMetadata;
  }> {
    if (!this.isConfigured) {
      throw this.createError('API_KEY_MISSING', 'Anthropic API key is not configured', false);
    }

    const estimatedTokens =
      messages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0) +
      (options.maxTokens || 4096);
    await this.rateLimiter.waitForCapacity(estimatedTokens);

    const startTime = Date.now();

    try {
      const response = await this.client.messages.create({
        model: options.model || this.defaultModel,
        max_tokens: options.maxTokens || AI_CONFIG.maxTokens.analysis,
        temperature: options.temperature ?? AI_CONFIG.temperature.analysis,
        system: options.systemPrompt,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const processingTime = Date.now() - startTime;

      const content = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('\n');

      const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
      this.rateLimiter.recordRequest(tokensUsed);

      return {
        content,
        metadata: {
          model: response.model,
          tokensUsed: {
            input: response.usage.input_tokens,
            output: response.usage.output_tokens,
            total: tokensUsed,
          },
          processingTime,
          timestamp: new Date(),
          requestId: response.id,
        },
      };
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  /**
   * Stream a message response from Claude API
   */
  async *streamMessage(
    userMessage: string,
    options: ClaudeRequestOptions = {}
  ): AsyncGenerator<StreamChunk, void, unknown> {
    if (!this.isConfigured) {
      yield { type: 'error', error: 'Anthropic API key is not configured' };
      return;
    }

    const estimatedTokens = Math.ceil(userMessage.length / 4) + (options.maxTokens || 4096);
    await this.rateLimiter.waitForCapacity(estimatedTokens);

    try {
      const stream = await this.client.messages.stream({
        model: options.model || this.defaultModel,
        max_tokens: options.maxTokens || AI_CONFIG.maxTokens.analysis,
        temperature: options.temperature ?? AI_CONFIG.temperature.analysis,
        system: options.systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          const delta = event.delta;
          if ('text' in delta) {
            yield { type: 'text', text: delta.text };
          }
        }
      }

      const finalMessage = await stream.finalMessage();
      const tokensUsed = finalMessage.usage.input_tokens + finalMessage.usage.output_tokens;
      this.rateLimiter.recordRequest(tokensUsed);

      yield { type: 'done' };
    } catch (error) {
      yield { type: 'error', error: (error as Error).message };
    }
  }

  /**
   * Stream a conversation response from Claude API
   */
  async *streamConversation(
    messages: ClaudeMessage[],
    options: ClaudeRequestOptions = {}
  ): AsyncGenerator<StreamChunk, void, unknown> {
    if (!this.isConfigured) {
      yield { type: 'error', error: 'Anthropic API key is not configured' };
      return;
    }

    const estimatedTokens =
      messages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0) +
      (options.maxTokens || 4096);
    await this.rateLimiter.waitForCapacity(estimatedTokens);

    try {
      const stream = await this.client.messages.stream({
        model: options.model || this.defaultModel,
        max_tokens: options.maxTokens || AI_CONFIG.maxTokens.analysis,
        temperature: options.temperature ?? AI_CONFIG.temperature.analysis,
        system: options.systemPrompt,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          const delta = event.delta;
          if ('text' in delta) {
            yield { type: 'text', text: delta.text };
          }
        }
      }

      const finalMessage = await stream.finalMessage();
      const tokensUsed = finalMessage.usage.input_tokens + finalMessage.usage.output_tokens;
      this.rateLimiter.recordRequest(tokensUsed);

      yield { type: 'done' };
    } catch (error) {
      yield { type: 'error', error: (error as Error).message };
    }
  }

  /**
   * Parse JSON from AI response, handling common issues
   */
  parseJSONResponse<T>(content: string): T {
    let jsonString = content.trim();

    // Handle markdown code blocks
    const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonString = jsonMatch[1];
    }

    // Handle responses that start with text before JSON
    const jsonStart = jsonString.indexOf('{');
    const jsonArrayStart = jsonString.indexOf('[');

    if (jsonStart !== -1 || jsonArrayStart !== -1) {
      const startIndex =
        jsonStart !== -1 && jsonArrayStart !== -1
          ? Math.min(jsonStart, jsonArrayStart)
          : Math.max(jsonStart, jsonArrayStart);

      jsonString = jsonString.substring(startIndex);

      // Find the matching closing bracket
      let depth = 0;
      let endIndex = 0;
      const openBracket = jsonString[0];
      const closeBracket = openBracket === '{' ? '}' : ']';

      for (let i = 0; i < jsonString.length; i++) {
        if (jsonString[i] === openBracket) {depth++;}
        if (jsonString[i] === closeBracket) {depth--;}
        if (depth === 0) {
          endIndex = i + 1;
          break;
        }
      }

      if (endIndex > 0) {
        jsonString = jsonString.substring(0, endIndex);
      }
    }

    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      throw this.createError(
        'JSON_PARSE_ERROR',
        `Failed to parse AI response as JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
        false,
        { originalContent: content.substring(0, 500) }
      );
    }
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Anthropic.RateLimitError) {return true;}
    if (error instanceof Anthropic.InternalServerError) {return true;}
    if (error instanceof Anthropic.APIConnectionError) {return true;}
    return false;
  }

  /**
   * Handle API errors and create appropriate error objects
   */
  private handleAPIError(error: unknown): AIError {
    if (error instanceof Anthropic.AuthenticationError) {
      return this.createError('UNAUTHORIZED', 'Invalid API key', false);
    }
    if (error instanceof Anthropic.PermissionDeniedError) {
      return this.createError('FORBIDDEN', 'Access denied', false);
    }
    if (error instanceof Anthropic.NotFoundError) {
      return this.createError('NOT_FOUND', 'Resource not found', false);
    }
    if (error instanceof Anthropic.RateLimitError) {
      return this.createError('RATE_LIMITED', 'Rate limit exceeded', true);
    }
    if (error instanceof Anthropic.BadRequestError) {
      return this.createError('BAD_REQUEST', `Invalid request: ${(error as Error).message}`, false);
    }
    if (error instanceof Anthropic.InternalServerError) {
      return this.createError('SERVER_ERROR', 'Server error', true);
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return this.createError('NETWORK_ERROR', 'Network error', true);
    }

    return this.createError(
      'UNKNOWN_ERROR',
      `Unknown error: ${error instanceof Error ? error.message : 'Unknown'}`,
      true
    );
  }

  /**
   * Create a standardized error object
   */
  private createError(
    code: string,
    message: string,
    retryable: boolean,
    details?: Record<string, unknown>
  ): AIError {
    return { code, message, retryable, details };
  }
}

// ============================================================================
// Singleton & Factory Functions
// ============================================================================

let clientInstance: ClaudeClient | null = null;

/**
 * Get the Claude client instance (singleton)
 */
export function getClaudeClient(config?: ClaudeClientConfig): ClaudeClient {
  if (!clientInstance) {
    clientInstance = new ClaudeClient(config);
  }
  return clientInstance;
}

/**
 * Create a new Claude client instance (for testing or custom configurations)
 */
export function createClaudeClient(config?: ClaudeClientConfig): ClaudeClient {
  return new ClaudeClient(config);
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetClaudeClient(): void {
  clientInstance = null;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Estimate tokens for a given text (rough approximation: ~4 chars per token)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Truncate text to fit within token limit
 */
export function truncateToTokenLimit(text: string, maxTokens: number): string {
  const estimatedChars = maxTokens * 4;
  if (text.length <= estimatedChars) {
    return text;
  }
  return text.substring(0, estimatedChars - 3) + '...';
}

/**
 * Create a timeout promise
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}
