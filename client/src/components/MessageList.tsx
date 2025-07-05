import React from 'react';
import { Message } from '../services/api';
import MessageItem from './MessageItem';
import StreamingMessage from './StreamingMessage';

interface MessageListProps {
  messages: Message[];
  streamingMessage?: string;
  isStreaming?: boolean;
}

export default function MessageList({ messages, streamingMessage, isStreaming }: MessageListProps) {
  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <MessageItem key={index} message={message} />
      ))}
      
      {isStreaming && streamingMessage !== undefined && (
        <StreamingMessage content={streamingMessage} />
      )}
    </div>
  );
}