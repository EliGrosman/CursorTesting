import { Server as IOServer, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { secureAnthropicService } from './anthropic-secure';
import { MessageParam } from '@anthropic-ai/sdk/resources';
import { queryOne } from '../db';
import jwt from 'jsonwebtoken';

interface WSMessage {
  type: 'chat' | 'ping' | 'pong' | 'error' | 'usage' | 'thinking';
  conversationId?: string;
  data?: any;
}

interface ActiveConnection {
  id: string;
  socket: Socket;
  conversationId?: string;
  isAlive: boolean;
  userId?: string;
}

class WebSocketService {
  private connections: Map<string, ActiveConnection> = new Map();

  async handleConnection(socket: Socket) {
    const connectionId = socket.id;
    
    // Try to authenticate user from handshake auth
    let userId: string | undefined;
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      if (token) {
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        
        // Verify user exists
        const user = await queryOne(
          'SELECT id FROM users WHERE id = $1',
          [decoded.id]
        );
        
        if (user) {
          userId = user.id;
          console.log(`Authenticated WebSocket user: ${userId}`);
        }
      }
    } catch (error) {
      console.log('WebSocket authentication failed:', error);
    }

    const connection: ActiveConnection = {
      id: connectionId,
      socket,
      isAlive: true,
      userId
    };

    this.connections.set(connectionId, connection);
    console.log(`New Socket.IO connection: ${connectionId}${userId ? ` (user: ${userId})` : ' (anonymous)'}`);

    // Send welcome message
    // socket.emit('message', {
    //   type: 'chat',
    //   data: {
    //     role: 'system',
    //     content: 'Connected to Claude Clone. Ready for streaming chat.'
    //   }
    // });

    // Handle messages
    socket.on('message', async (data: WSMessage) => {
      try {
        console.log('📨 Socket.IO message received:', data);
        await this.handleMessage(socket, data);
      } catch (error: unknown) {
        console.error('Socket.IO message error:', error as Error);
        this.sendError(socket, 'Invalid message format');
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      this.connections.delete(connectionId);
      console.log(`Socket.IO disconnected: ${connectionId}`);
    });
  }

  private async handleMessage(socket: Socket, message: WSMessage) {
    const connection = this.connections.get(socket.id);
    if (!connection) return;

    switch (message.type) {
      case 'ping':
        this.sendMessage(socket, { type: 'pong' });
        break;

      case 'chat':
        await this.handleChatMessage(socket, message.data);
        break;

      default:
        this.sendError(socket, `Unknown message type: ${message.type}`);
    }
  }

  private async handleChatMessage(socket: Socket, data: any) {
    try {
      console.log('🤖 Processing chat message:', data);
      
      const connection = this.connections.get(socket.id);
      if (!connection) {
        throw new Error('Connection not found');
      }

      const {
        messages,
        model = 'claude-3-5-sonnet-20241022',
        temperature = 0.7,
        maxTokens = 4096,
        systemPrompt,
        enableThinking = false,
        apiKey // Allow direct API key for websocket connections
      } = data;

      // Clean messages to only include fields that Anthropic API accepts
      const cleanMessages = messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }));

      // Use provided API key or get from user's stored keys
      let finalApiKey = apiKey;
      if (!finalApiKey && connection.userId) {
        // Get user's stored API key
        const apiKeyRecord = await queryOne(
          `SELECT encrypted_key 
           FROM api_keys 
           WHERE user_id = $1 
             AND is_active = true 
             AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
           ORDER BY last_used_at DESC NULLS LAST, created_at DESC
           LIMIT 1`,
          [connection.userId]
        );

        if (apiKeyRecord) {
          const { encryptionService } = require('./encryption');
          finalApiKey = encryptionService.decrypt(apiKeyRecord.encrypted_key);
        }
      }

      if (!finalApiKey) {
        throw new Error('API key required. Please provide an API key or add one in your account settings.');
      }

      // Start streaming response using secure service
      const stream = secureAnthropicService.streamMessage(connection.userId || 'websocket', cleanMessages, {
        model,
        temperature,
        maxTokens,
        systemPrompt,
        stream: true,
        enableThinking,
        directApiKey: finalApiKey
      });

      let fullContent = '';
      let thinkingContent = '';
      let isThinking = false;

      for await (const event of stream) {
        if (event.type === 'message_start') {
          // Send initial message
          this.sendMessage(socket, {
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
              this.sendMessage(socket, {
                type: 'thinking',
                data: {
                  content: delta.text,
                  isStreaming: true
                }
              });
            } else {
              fullContent += delta.text;
              // Send content updates
              this.sendMessage(socket, {
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
            const cost = secureAnthropicService.calculateCost(usage, model);
            this.sendMessage(socket, {
              type: 'usage',
              data: cost
            });
          }

          // Send completion signal
          this.sendMessage(socket, {
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
    } catch (error: unknown) {
      console.error('Chat message error:', error as Error);
      const message = error instanceof Error ? error.message : 'Failed to process chat message';
      this.sendError(socket, message);
    }
  }

  private sendMessage(socket: Socket, message: WSMessage) {
    socket.emit('message', message);
  }

  private sendError(socket: Socket, error: string) {
    this.sendMessage(socket, {
      type: 'error',
      data: { error }
    });
  }

  // Keep-alive mechanism
  startKeepAlive() {
    setInterval(() => {
      this.connections.forEach((connection, id) => {
        if (!connection.isAlive) {
          connection.socket.disconnect();
          this.connections.delete(id);
          return;
        }

        connection.isAlive = false;
        connection.socket.emit('ping');
      });
    }, 30000); // 30 seconds
  }
}

const webSocketService = new WebSocketService();
export function handleWebSocketConnection(socket: Socket) {
  webSocketService.handleConnection(socket);
}

// Start keep-alive when service is initialized
webSocketService.startKeepAlive();