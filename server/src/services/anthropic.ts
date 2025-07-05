import Anthropic from '@anthropic-ai/sdk';
import { MessageParam, MessageStreamEvent } from '@anthropic-ai/sdk/resources';

export class AnthropicService {
  private client: Anthropic;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }

    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async createMessage(
    messages: MessageParam[],
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
      stream?: boolean;
      tools?: any[];
      enableThinking?: boolean;
    } = {}
  ) {
    console.log('🚀 createMessage called with model:', options.model);
    console.log('📝 Messages count:', messages.length);
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
    if (enableThinking && model.includes('sonnet')) {
      requestParams.metadata = {
        ...requestParams.metadata,
        thinking_mode: 'enabled'
      };
    }

    if (stream) {
      return this.client.messages.create({
        ...requestParams,
        stream: true,
      });
    }

    return this.client.messages.create(requestParams);
  }

  async *streamMessage(
    messages: MessageParam[],
    options: Parameters<typeof this.createMessage>[1] = {}
  ) {
    const stream = await this.createMessage(messages, { ...options, stream: true });

    for await (const event of stream as unknown as AsyncIterable<MessageStreamEvent>) {
      yield event;
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
    // Prices per 1M tokens (as of 2025)
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

  // Create batch request
  async createBatch(requests: Array<{
    custom_id: string;
    params: {
      model: string;
      max_tokens: number;
      messages: MessageParam[];
      temperature?: number;
      system?: string;
    };
  }>) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages/batches', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
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

  // Get batch status
  async getBatchStatus(batchId: string) {
    try {
      const response = await fetch(`https://api.anthropic.com/v1/messages/batches/${batchId}`, {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01'
        }
      });

      if (!response.ok) {
        throw new Error(`Batch status error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Batch status error:', error);
      throw error;
    }
  }
}

// Lazy instantiation to ensure environment variables are loaded first
let _anthropicService: AnthropicService | null = null;

export function getAnthropicService(): AnthropicService {
  if (!_anthropicService) {
    console.log('🔧 Creating new AnthropicService instance');
    console.log('🔑 API Key present:', !!process.env.ANTHROPIC_API_KEY);
    _anthropicService = new AnthropicService();
    console.log('✅ AnthropicService created successfully');
  }
  return _anthropicService;
}