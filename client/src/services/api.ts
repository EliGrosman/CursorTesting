import axios from 'axios';
import { io, Socket } from 'socket.io-client';

// Use environment variables with fallback to relative URL for production
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || '';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | any[];
  messageId?: string;
  timestamp?: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  model: string;
  totalCost: number;
}

export interface Model {
  id: string;
  name: string;
  description: string;
  supportsFunctions: boolean;
  supportsVision: boolean;
  supportsThinking: boolean;
  contextWindow: number;
  outputTokens: number;
}

export interface UsageInfo {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source?: string;
}

export interface ResearchResult {
  summary: string;
  sources: Array<{
    title: string;
    url: string;
    content: string;
  }>;
}

// WebSocket client
let socket: Socket | null = null;

export const websocketService = {
  connect(): Socket {
    if (!socket) {
      socket = io(WS_BASE_URL || window.location.origin, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socket.on('connect', () => {
        console.log('WebSocket connected');
      });

      socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
      });

      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    }
    return socket;
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  sendMessage(data: any) {
    if (socket && socket.connected) {
      socket.emit('message', data);
    }
  },

  onMessage(callback: (data: any) => void) {
    if (socket) {
      socket.on('message', callback);
    }
  },

  offMessage(callback: (data: any) => void) {
    if (socket) {
      socket.off('message', callback);
    }
  },
};

// Conversation API
export const conversationApi = {
  async create(): Promise<Conversation> {
    const response = await api.post('/chat/conversations');
    return response.data;
  },

  async getAll(): Promise<Conversation[]> {
    const response = await api.get('/chat/conversations');
    return response.data;
  },

  async get(id: string): Promise<Conversation> {
    const response = await api.get(`/chat/conversations/${id}`);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/chat/conversations/${id}`);
  },

  async sendMessage(
    conversationId: string,
    message: string,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
      enableThinking?: boolean;
      attachments?: any[];
    } = {}
  ): Promise<{ message: Message; usage?: UsageInfo }> {
    const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
      message,
      ...options,
    });
    return response.data;
  },

  async export(id: string): Promise<Blob> {
    const response = await api.get(`/chat/conversations/${id}/export`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// Models API
export const modelsApi = {
  async getAll(): Promise<Model[]> {
    const response = await api.get('/chat/models');
    return response.data;
  },
};

// Search API
export const searchApi = {
  async webSearch(query: string, maxResults = 5): Promise<SearchResult[]> {
    const response = await api.post('/search/web', { query, maxResults });
    return response.data.results;
  },

  async extractContent(url: string): Promise<string> {
    const response = await api.post('/search/extract', { url });
    return response.data.content;
  },

  async research(
    topic: string,
    depth = 3,
    onProgress?: (data: any) => void
  ): Promise<ResearchResult> {
    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      
      fetch(`${API_BASE_URL}/search/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, depth }),
        signal: controller.signal,
      })
        .then(async (response) => {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          
          if (!reader) {
            throw new Error('No response body');
          }

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'complete') {
                    resolve(data.data);
                  } else if (data.type === 'error') {
                    reject(new Error(data.error));
                  } else if (onProgress) {
                    onProgress(data);
                  }
                } catch (e) {
                  // Ignore parsing errors
                }
              }
            }
          }
        })
        .catch(reject);
    });
  },
};

// File API
export const fileApi = {
  async upload(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async uploadMultiple(files: File[]): Promise<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post('/files/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async delete(filename: string): Promise<void> {
    await api.delete(`/files/${filename}`);
  },

  async getBase64(filename: string): Promise<{ filename: string; base64: string; size: number }> {
    const response = await api.get(`/files/${filename}/base64`);
    return response.data;
  },
};

export default api;