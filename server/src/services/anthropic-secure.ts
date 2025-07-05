import Anthropic from '@anthropic-ai/sdk';
import { MessageParam, MessageStreamEvent } from '@anthropic-ai/sdk/resources';
import { query, queryOne } from '../db';
import { encryptionService } from './encryption';

export class SecureAnthropicService {
  private clients: Map<string, Anthropic> = new Map();

  // Get or create client for a specific user
  async getClientForUser(userId: string): Promise<Anthropic> {
    // Check cache first
    if (this.clients.has(userId)) {
      return this.clients.get(userId)!;
    }

    // Get active API key from database
    const apiKeyRecord = await queryOne(
      `SELECT id, encrypted_key 
       FROM api_keys 
       WHERE user_id = $1 
         AND is_active = true 
         AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
       ORDER BY last_used_at DESC NULLS LAST, created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (!apiKeyRecord) {
      throw new Error('No active API key found. Please add your Anthropic API key in settings.');
    }

    // Decrypt the API key
    const apiKey = encryptionService.decrypt(apiKeyRecord.encrypted_key);

    // Update last used
    await query(
      'UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1',
      [apiKeyRecord.id]
    );

    // Create and cache client
    const client = new Anthropic({ apiKey });
    this.clients.set(userId, client);

    // Clear cache after 5 minutes
    setTimeout(() => {
      this.clients.delete(userId);
    }, 5 * 60 * 1000);

    return client;
  }

  // Get client with provided API key (for immediate use without storing)
  getClientWithKey(apiKey: string): Anthropic {
    if (!apiKey || !apiKey.startsWith('sk-ant-')) {
      throw new Error('Invalid API key format. Must start with "sk-ant-"');
    }
    return new Anthropic({ apiKey });
  }

  async createMessage(
    userId: string,
    messages: MessageParam[],
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
      stream?: boolean;
      tools?: any[];
      enableThinking?: boolean;
      directApiKey?: string; // Allow direct API key for immediate use
    } = {}
  ) {
    const client = options.directApiKey 
      ? this.getClientWithKey(options.directApiKey)
      : await this.getClientForUser(userId);
    
    const {
      model = 'claude-3-5-sonnet-20241022',
      maxTokens = 4096,
      temperature = 0.7,
      systemPrompt,
      stream = false,
      tools = [],
      enableThinking = false
    } = options;

    const requestParams: any = {
      model,
      max_tokens: maxTokens,
      temperature,
      messages,
    };

    if (systemPrompt) {
      requestParams.system = systemPrompt;
    }

    if (tools.length > 0) {
      requestParams.tools = tools;
    }

    // Enable thinking mode for extended reasoning
    if (enableThinking && (model.includes('sonnet') || model.includes('opus-4'))) {
      requestParams.metadata = {
        ...requestParams.metadata,
        thinking_mode: 'enabled'
      };
    }

    if (stream) {
      return client.messages.create({
        ...requestParams,
        stream: true,
      });
    }

    return client.messages.create(requestParams);
  }

  async *streamMessage(
    userId: string,
    messages: MessageParam[],
    options: Parameters<typeof this.createMessage>[2] = {}
  ) {
    const stream = await this.createMessage(userId, messages, { ...options, stream: true });

    for await (const event of stream as unknown as AsyncIterable<MessageStreamEvent>) {
      yield event;
    }
  }

  // Create batch request with user's API key
  async createBatch(
    userId: string,
    requests: Array<{
      custom_id: string;
      params: {
        model: string;
        max_tokens: number;
        messages: MessageParam[];
        temperature?: number;
        system?: string;
      };
    }>
  ) {
    // Get user's API key
    const apiKeyRecord = await queryOne(
      `SELECT encrypted_key FROM api_keys 
       WHERE user_id = $1 AND is_active = true 
       ORDER BY last_used_at DESC NULLS LAST LIMIT 1`,
      [userId]
    );

    if (!apiKeyRecord) {
      throw new Error('No active API key found. Please add your Anthropic API key in settings.');
    }

    const apiKey = encryptionService.decrypt(apiKeyRecord.encrypted_key);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages/batches', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ requests })
      });

      if (!response.ok) {
        throw new Error(`Batch API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Batch creation error:', error);
      throw error;
    }
  }

  // Helper to format messages for the API
  formatUserMessage(content: string, attachments?: Array<{ type: string; data: string; mimeType?: string }>): MessageParam {
    const contentBlocks: any[] = [{ type: 'text', text: content }];

    if (attachments) {
      for (const attachment of attachments) {
        if (attachment.type === 'image') {
          contentBlocks.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: attachment.mimeType || 'image/jpeg',
              data: attachment.data
            }
          });
        }
      }
    }

    return {
      role: 'user',
      content: contentBlocks
    };
  }

  // Get available models
  getAvailableModels() {
    return [
      {
        id: 'claude-sonnet-4-20250514',
        name: 'Claude 4 Sonnet',
        description: 'Latest and most advanced model with enhanced reasoning',
        supportsFunctions: true,
        supportsVision: true,
        supportsThinking: true,
        contextWindow: 500000,
        outputTokens: 16384
      },
      {
        id: 'claude-opus-4-20250514',
        name: 'Claude 4 Opus',
        description: 'Cutting-edge model for the most complex tasks',
        supportsFunctions: true,
        supportsVision: true,
        supportsThinking: true,
        contextWindow: 500000,
        outputTokens: 16384
      },
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        description: 'Most capable Claude 3 model with extended thinking',
        supportsFunctions: true,
        supportsVision: true,
        supportsThinking: true,
        contextWindow: 200000,
        outputTokens: 8192
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        description: 'Powerful model for complex tasks',
        supportsFunctions: true,
        supportsVision: true,
        supportsThinking: false,
        contextWindow: 200000,
        outputTokens: 4096
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        description: 'Fast and efficient for simple tasks',
        supportsFunctions: true,
        supportsVision: true,
        supportsThinking: false,
        contextWindow: 200000,
        outputTokens: 4096
      }
    ];
  }

  // Calculate token usage and cost
  calculateCost(usage: { input_tokens: number; output_tokens: number }, model: string) {
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-sonnet-4-20250514': { input: 4, output: 20 },
      'claude-opus-4-20250514': { input: 20, output: 100 },
      'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
      'claude-3-opus-20240229': { input: 15, output: 75 },
      'claude-3-haiku-20240307': { input: 0.25, output: 1.25 }
    };

    const modelPricing = pricing[model] || pricing['claude-3-5-sonnet-20241022'];
    
    const inputCost = (usage.input_tokens / 1_000_000) * modelPricing.input;
    const outputCost = (usage.output_tokens / 1_000_000) * modelPricing.output;
    
    return {
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      totalTokens: usage.input_tokens + usage.output_tokens,
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost
    };
  }
}

export const secureAnthropicService = new SecureAnthropicService();