import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, StopCircle, Brain, Search } from 'lucide-react';
import { useChatStore } from '../stores/chatStore';
import { conversationApi, websocketService } from '../services/api';
import MessageList from '../components/MessageList';
import ChatInput from '../components/ChatInput';
import ModelSelector from '../components/ModelSelector';
import ThinkingIndicator from '../components/ThinkingIndicator';
import ResearchModal from '../components/ResearchModal';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showResearch, setShowResearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    currentConversation,
    setCurrentConversation,
    isStreaming,
    streamingMessage,
    thinkingContent,
    selectedModel,
    temperature,
    maxTokens,
    enableThinking,
    setIsStreaming,
    setStreamingMessage,
    appendStreamingMessage,
    setThinkingContent,
    appendThinkingContent,
    addMessageToCurrentConversation,
    clearStreamingState,
  } = useChatStore();

  // Load conversation on mount or ID change
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      createNewConversation();
    }
  }, [conversationId]);

  // Setup WebSocket connection
  useEffect(() => {
    const socket = websocketService.connect();
    
    socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socket.on('message', handleWebSocketMessage);

    return () => {
      websocketService.offMessage(handleWebSocketMessage);
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages, streamingMessage]);

  const loadConversation = async (id: string) => {
    try {
      const conv = await conversationApi.get(id);
      setCurrentConversation(conv);
    } catch (error) {
      toast.error('Failed to load conversation');
      navigate('/');
    }
  };

  const createNewConversation = async () => {
    try {
      const newConv = await conversationApi.create();
      setCurrentConversation(newConv);
      navigate(`/chat/${newConv.id}`);
    } catch (error) {
      toast.error('Failed to create conversation');
    }
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'chat':
        if (data.data.isStreaming && data.data.isDelta) {
          appendStreamingMessage(data.data.content);
        } else if (!data.data.isStreaming) {
          // Final message
          const assistantMessage = {
            role: 'assistant' as const,
            content: data.data.content,
            messageId: data.data.messageId,
            timestamp: new Date(),
          };
          addMessageToCurrentConversation(assistantMessage);
          clearStreamingState();
        }
        break;
      
      case 'thinking':
        if (data.data.isStreaming) {
          appendThinkingContent(data.data.content);
        }
        break;
      
      case 'usage':
        // Update conversation with new cost
        if (currentConversation) {
          const newTotalCost = currentConversation.totalCost + data.data.totalCost;
          // Update in store
          toast.success(`Cost: $${data.data.totalCost.toFixed(4)} (Total: $${newTotalCost.toFixed(4)})`);
        }
        break;
      
      case 'error':
        toast.error(data.data.error);
        clearStreamingState();
        break;
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!input.trim() && attachments.length === 0) return;
    if (isStreaming) return;
    if (!currentConversation) return;

    const userMessage = {
      role: 'user' as const,
      content: input,
      timestamp: new Date(),
    };

    // Add user message to conversation
    addMessageToCurrentConversation(userMessage);
    setInput('');
    setIsStreaming(true);
    setStreamingMessage('');
    setThinkingContent('');

    try {
      // Process attachments
      let processedAttachments: any[] = [];
      if (attachments.length > 0) {
        // Convert images to base64
        for (const file of attachments) {
          if (file.type.startsWith('image/')) {
            const base64 = await fileToBase64(file);
            processedAttachments.push({
              type: 'image',
              data: base64,
              mimeType: file.type,
            });
          }
        }
        setAttachments([]);
      }

      // Send via WebSocket for streaming
      websocketService.sendMessage({
        type: 'chat',
        data: {
          messages: [...currentConversation.messages, userMessage],
          model: selectedModel,
          temperature,
          maxTokens,
          enableThinking,
          attachments: processedAttachments,
        },
      });
    } catch (error) {
      toast.error('Failed to send message');
      clearStreamingState();
    }
  };

  const handleStopStreaming = () => {
    // In a real implementation, send a stop signal to the server
    clearStreamingState();
    toast.success('Stopped generating');
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-claude-border dark:border-claude-border-dark">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">
            {currentConversation?.title || 'New Chat'}
          </h2>
          {enableThinking && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Brain className="h-4 w-4" />
              <span>Thinking enabled</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowResearch(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            title="Research mode"
          >
            <Search className="h-5 w-5" />
          </button>
          <ModelSelector />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {currentConversation && (
          <MessageList
            messages={currentConversation.messages}
            streamingMessage={streamingMessage}
            isStreaming={isStreaming}
          />
        )}
        
        {thinkingContent && (
          <ThinkingIndicator content={thinkingContent} />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-claude-border dark:border-claude-border-dark p-4">
        <form onSubmit={handleSubmit} className="relative">
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            disabled={isStreaming}
            attachments={attachments}
            onAttachmentsChange={setAttachments}
          />
          
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-gray-500">
              {isStreaming ? 'Generating...' : `${selectedModel} • ${temperature} temp • ${maxTokens} max tokens`}
            </div>
            
            {isStreaming ? (
              <button
                type="button"
                onClick={handleStopStreaming}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
              >
                <StopCircle className="h-4 w-4" />
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() && attachments.length === 0}
                className={clsx(
                  'flex items-center gap-1 text-sm',
                  input.trim() || attachments.length > 0
                    ? 'text-claude-accent hover:text-claude-accent-hover'
                    : 'text-gray-400 cursor-not-allowed'
                )}
              >
                <Send className="h-4 w-4" />
                Send
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Research Modal */}
      {showResearch && (
        <ResearchModal
          isOpen={showResearch}
          onClose={() => setShowResearch(false)}
        />
      )}
    </div>
  );
}