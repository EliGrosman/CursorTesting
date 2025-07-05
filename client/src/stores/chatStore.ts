import { create } from 'zustand';
import { Conversation, Message, Model } from '../services/api';

interface ChatStore {
  // Conversations
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoadingConversations: boolean;
  
  // Messages
  isStreaming: boolean;
  streamingMessage: string;
  thinkingContent: string;
  
  // Models
  models: Model[];
  selectedModel: string;
  
  // Settings
  temperature: number;
  maxTokens: number;
  enableThinking: boolean;
  
  // Actions
  setConversations: (conversations: Conversation[]) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  
  setIsLoadingConversations: (loading: boolean) => void;
  setIsStreaming: (streaming: boolean) => void;
  setStreamingMessage: (message: string) => void;
  appendStreamingMessage: (text: string) => void;
  setThinkingContent: (content: string) => void;
  appendThinkingContent: (text: string) => void;
  
  setModels: (models: Model[]) => void;
  setSelectedModel: (model: string) => void;
  setTemperature: (temp: number) => void;
  setMaxTokens: (tokens: number) => void;
  setEnableThinking: (enabled: boolean) => void;
  
  addMessageToCurrentConversation: (message: Message) => void;
  clearStreamingState: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  conversations: [],
  currentConversation: null,
  isLoadingConversations: false,
  
  isStreaming: false,
  streamingMessage: '',
  thinkingContent: '',
  
  models: [],
  selectedModel: 'claude-3-5-sonnet-20241022',
  
  temperature: 0.7,
  maxTokens: 4096,
  enableThinking: false,
  
  // Actions
  setConversations: (conversations) => set({ conversations }),
  
  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
  
  addConversation: (conversation) => 
    set((state) => ({ conversations: [conversation, ...state.conversations] })),
  
  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === id ? { ...conv, ...updates } : conv
      ),
      currentConversation:
        state.currentConversation?.id === id
          ? { ...state.currentConversation, ...updates }
          : state.currentConversation,
    })),
  
  deleteConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((conv) => conv.id !== id),
      currentConversation: state.currentConversation?.id === id ? null : state.currentConversation,
    })),
  
  setIsLoadingConversations: (loading) => set({ isLoadingConversations: loading }),
  
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  
  setStreamingMessage: (message) => set({ streamingMessage: message }),
  
  appendStreamingMessage: (text) =>
    set((state) => ({ streamingMessage: state.streamingMessage + text })),
  
  setThinkingContent: (content) => set({ thinkingContent: content }),
  
  appendThinkingContent: (text) =>
    set((state) => ({ thinkingContent: state.thinkingContent + text })),
  
  setModels: (models) => set({ models }),
  
  setSelectedModel: (model) => set({ selectedModel: model }),
  
  setTemperature: (temp) => set({ temperature: temp }),
  
  setMaxTokens: (tokens) => set({ maxTokens: tokens }),
  
  setEnableThinking: (enabled) => set({ enableThinking: enabled }),
  
  addMessageToCurrentConversation: (message) =>
    set((state) => {
      if (!state.currentConversation) return state;
      
      const updatedConversation = {
        ...state.currentConversation,
        messages: [...state.currentConversation.messages, message],
        updatedAt: new Date(),
      };
      
      return {
        currentConversation: updatedConversation,
        conversations: state.conversations.map((conv) =>
          conv.id === updatedConversation.id ? updatedConversation : conv
        ),
      };
    }),
  
  clearStreamingState: () =>
    set({
      isStreaming: false,
      streamingMessage: '',
      thinkingContent: '',
    }),
}));