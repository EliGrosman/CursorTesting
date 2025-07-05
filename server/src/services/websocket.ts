import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { anthropicService } from './anthropic';
import { MessageParam } from '@anthropic-ai/sdk/resources';

interface WSMessage {
  type: 'chat' | 'ping' | 'pong' | 'error' | 'usage' | 'thinking';
  conversationId?: string;
  data?: any;
}

interface ActiveConnection {
  id: string;
  ws: WebSocket;
  conversationId?: string;
  isAlive: boolean;
}

class WebSocketService {
  private connections: Map<string, ActiveConnection> = new Map();

  handleConnection(ws: WebSocket) {
    const connectionId = uuidv4();
    const connection: ActiveConnection = {
      id: connectionId,
      ws,
      isAlive: true
    };

    this.connections.set(connectionId, connection);
    console.log(`New WebSocket connection: ${connectionId}`);

    // Send welcome message
    this.sendMessage(ws, {
      type: 'chat',
      data: {
        role: 'system',
        content: 'Connected to Claude Clone. Ready for streaming chat.'
      }
    });

    // Handle messages
    ws.on('message', async (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString()) as WSMessage;
        await this.handleMessage(connectionId, data);
      } catch (error: unknown) {
        console.error('WebSocket message error:', error as Error);
        this.sendError(ws, 'Invalid message format');
      }
    });

    // Handle pong for keep-alive
    ws.on('pong', () => {
      connection.isAlive = true;
    });

    // Handle disconnect
    ws.on('close', () => {
      this.connections.delete(connectionId);
      console.log(`WebSocket disconnected: ${connectionId}`);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for ${connectionId}:`, error);
      this.connections.delete(connectionId);
    });
  }

  private async handleMessage(connectionId: string, message: WSMessage) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    switch (message.type) {
      case 'ping':
        this.sendMessage(connection.ws, { type: 'pong' });
        break;

      case 'chat':
        await this.handleChatMessage(connection, message.data);
        break;

      default:
        this.sendError(connection.ws, `Unknown message type: ${message.type}`);
    }
  }

  private async handleChatMessage(connection: ActiveConnection, data: any) {
    try {
      const {
        messages,
        model = 'claude-3-5-sonnet-20241022',
        temperature = 0.7,
        maxTokens = 4096,
        systemPrompt,
        enableThinking = false
      } = data;

      // Start streaming response
      const stream = anthropicService.streamMessage(messages, {
        model,
        temperature,
        maxTokens,
        systemPrompt,
        stream: true,
        enableThinking
      });

      let fullContent = '';
      let thinkingContent = '';
      let isThinking = false;

      for await (const event of stream) {
        if (event.type === 'message_start') {
          // Send initial message
          this.sendMessage(connection.ws, {
            type: 'chat',
            data: {
              role: 'assistant',
              content: '',
              isStreaming: true,
              messageId: event.message.id
            }
          });
        } else if (event.type === 'content_block_start') {
          // Check if this is a thinking block
          if (event.content_block.type === 'text' && event.content_block.text?.startsWith('<thinking>')) {
            isThinking = true;
          }
        } else if (event.type === 'content_block_delta') {
          const delta = event.delta;
          if (delta.type === 'text_delta') {
            if (isThinking) {
              thinkingContent += delta.text;
              // Send thinking updates
              this.sendMessage(connection.ws, {
                type: 'thinking',
                data: {
                  content: delta.text,
                  isStreaming: true
                }
              });
            } else {
              fullContent += delta.text;
              // Send content updates
              this.sendMessage(connection.ws, {
                type: 'chat',
                data: {
                  role: 'assistant',
                  content: delta.text,
                  isStreaming: true,
                  isDelta: true
                }
              });
            }
          }
        } else if (event.type === 'content_block_stop') {
          if (isThinking) {
            isThinking = false;
          }
        } else if (event.type === 'message_stop') {
          // Send final message with usage info
          const usage = (event as any).message?.usage;
          if (usage) {
            const cost = anthropicService.calculateCost(usage, model);
            this.sendMessage(connection.ws, {
              type: 'usage',
              data: cost
            });
          }

          // Send completion signal
          this.sendMessage(connection.ws, {
            type: 'chat',
            data: {
              role: 'assistant',
              content: fullContent,
              isStreaming: false,
              messageId: (event as any).message?.id
            }
          });
        }
      }
    } catch (error: any) {
      console.error('Chat message error:', error);
      this.sendError(connection.ws, error.message || 'Failed to process chat message');
    }
  }

  private sendMessage(ws: WebSocket, message: WSMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string) {
    this.sendMessage(ws, {
      type: 'error',
      data: { error }
    });
  }

  // Keep-alive mechanism
  startKeepAlive() {
    setInterval(() => {
      this.connections.forEach((connection, id) => {
        if (!connection.isAlive) {
          connection.ws.terminate();
          this.connections.delete(id);
          return;
        }

        connection.isAlive = false;
        connection.ws.ping();
      });
    }, 30000); // 30 seconds
  }
}

export const webSocketService = new WebSocketService();

export function handleWebSocketConnection(ws: WebSocket) {
  webSocketService.handleConnection(ws);
}

// Start keep-alive when service is initialized
webSocketService.startKeepAlive();