// ============================================================================
// SPAC OS AI Client - Claude API Client wrapper
// ============================================================================

import { AI_CONFIG } from './prompts';
import type { AIError, AIResponseMetadata } from './types';

/**
 * Claude API message structure
 */
interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Claude API request body
 */
interface ClaudeRequestBody {
  model: string;
  max_tokens: number;
  temperature?: number;
  system?: string;
  messages: ClaudeMessage[];
}

/**
 * Claude API response structure
 */
interface ClaudeAPIResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * AI Client configuration
 */
interface AIClientConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  timeout?: number;
}

/**
 * Request options for AI calls
 */
export interface AIRequestOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  timeout?: number;
}

/**
 * AI Client for making Claude API calls
 */
export class AIClient {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private timeout: number;

  constructor(config: AIClientConfig = {}) {
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
    this.defaultModel = config.defaultModel || AI_CONFIG.models.default;
    this.timeout = config.timeout || 60000;
  }

  /**
   * Check if the client is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Send a message to Claude API
   */
  async sendMessage(
    userMessage: string,
    options: AIRequestOptions = {}
  ): Promise<{
    content: string;
    metadata: AIResponseMetadata;
  }> {
    const startTime = Date.now();

    if (!this.isConfigured()) {
      throw this.createError('API_KEY_MISSING', 'Anthropic API key is not configured', false);
    }

    const requestBody: ClaudeRequestBody = {
      model: options.model || this.defaultModel,
      max_tokens: options.maxTokens || AI_CONFIG.maxTokens.analysis,
      temperature: options.temperature ?? AI_CONFIG.temperature.analysis,
      messages: [{ role: 'user', content: userMessage }],
    };

    if (options.systemPrompt) {
      requestBody.system = options.systemPrompt;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        options.timeout || this.timeout
      );

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.handleAPIError(response.status, errorData);
      }

      const data: ClaudeAPIResponse = await response.json();
      const processingTime = Date.now() - startTime;

      const content = data.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n');

      return {
        content,
        metadata: {
          model: data.model,
          tokensUsed: {
            input: data.usage.input_tokens,
            output: data.usage.output_tokens,
            total: data.usage.input_tokens + data.usage.output_tokens,
          },
          processingTime,
          timestamp: new Date(),
          requestId: data.id,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createError('TIMEOUT', 'Request timed out', true);
      }
      if ((error as AIError).code) {
        throw error;
      }
      throw this.createError(
        'NETWORK_ERROR',
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        true
      );
    }
  }

  /**
   * Send a conversation with multiple messages
   */
  async sendConversation(
    messages: ClaudeMessage[],
    options: AIRequestOptions = {}
  ): Promise<{
    content: string;
    metadata: AIResponseMetadata;
  }> {
    const startTime = Date.now();

    if (!this.isConfigured()) {
      throw this.createError('API_KEY_MISSING', 'Anthropic API key is not configured', false);
    }

    const requestBody: ClaudeRequestBody = {
      model: options.model || this.defaultModel,
      max_tokens: options.maxTokens || AI_CONFIG.maxTokens.analysis,
      temperature: options.temperature ?? AI_CONFIG.temperature.analysis,
      messages,
    };

    if (options.systemPrompt) {
      requestBody.system = options.systemPrompt;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        options.timeout || this.timeout
      );

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.handleAPIError(response.status, errorData);
      }

      const data: ClaudeAPIResponse = await response.json();
      const processingTime = Date.now() - startTime;

      const content = data.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n');

      return {
        content,
        metadata: {
          model: data.model,
          tokensUsed: {
            input: data.usage.input_tokens,
            output: data.usage.output_tokens,
            total: data.usage.input_tokens + data.usage.output_tokens,
          },
          processingTime,
          timestamp: new Date(),
          requestId: data.id,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createError('TIMEOUT', 'Request timed out', true);
      }
      if ((error as AIError).code) {
        throw error;
      }
      throw this.createError(
        'NETWORK_ERROR',
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        true
      );
    }
  }

  /**
   * Parse JSON from AI response, handling common issues
   */
  parseJSONResponse<T>(content: string): T {
    // Try to extract JSON from the response
    let jsonString = content.trim();

    // Handle markdown code blocks
    const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    }

    // Handle responses that start with text before JSON
    const jsonStart = jsonString.indexOf('{');
    const jsonArrayStart = jsonString.indexOf('[');

    if (jsonStart !== -1 || jsonArrayStart !== -1) {
      const startIndex = jsonStart !== -1 && jsonArrayStart !== -1
        ? Math.min(jsonStart, jsonArrayStart)
        : Math.max(jsonStart, jsonArrayStart);

      jsonString = jsonString.substring(startIndex);

      // Find the matching closing bracket
      let depth = 0;
      let endIndex = 0;
      const openBracket = jsonString[0];
      const closeBracket = openBracket === '{' ? '}' : ']';

      for (let i = 0; i < jsonString.length; i++) {
        if (jsonString[i] === openBracket) depth++;
        if (jsonString[i] === closeBracket) depth--;
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
   * Handle API errors and create appropriate error objects
   */
  private handleAPIError(status: number, errorData: Record<string, unknown>): AIError {
    const errorMessage = (errorData.error as { message?: string })?.message || 'Unknown API error';

    switch (status) {
      case 400:
        return this.createError('BAD_REQUEST', `Invalid request: ${errorMessage}`, false);
      case 401:
        return this.createError('UNAUTHORIZED', 'Invalid API key', false);
      case 403:
        return this.createError('FORBIDDEN', 'Access denied', false);
      case 404:
        return this.createError('NOT_FOUND', 'Resource not found', false);
      case 429:
        return this.createError('RATE_LIMITED', 'Rate limit exceeded', true);
      case 500:
      case 502:
      case 503:
        return this.createError('SERVER_ERROR', `Server error: ${errorMessage}`, true);
      default:
        return this.createError('UNKNOWN_ERROR', `API error (${status}): ${errorMessage}`, true);
    }
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

/**
 * Singleton instance of the AI client
 */
let clientInstance: AIClient | null = null;

/**
 * Get the AI client instance (singleton)
 */
export function getAIClient(config?: AIClientConfig): AIClient {
  if (!clientInstance) {
    clientInstance = new AIClient(config);
  }
  return clientInstance;
}

/**
 * Create a new AI client instance (for testing or custom configurations)
 */
export function createAIClient(config?: AIClientConfig): AIClient {
  return new AIClient(config);
}
