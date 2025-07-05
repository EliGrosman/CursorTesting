import { User, Bot, Copy, Check } from 'lucide-react';
import { Message } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';
import clsx from 'clsx';

interface MessageItemProps {
  message: Message;
}

export default function MessageItem({ message }: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    const content = typeof message.content === 'string' 
      ? message.content 
      : JSON.stringify(message.content);
    
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMessageContent = () => {
    if (typeof message.content === 'string') {
      return message.content;
    }
    
    // Handle array content (with images, etc.)
    return message.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n');
  };

  return (
    <div className={clsx(
      'flex gap-3 chat-message',
      isUser ? 'flex-row-reverse' : 'flex-row'
    )}>
      {/* Avatar */}
      <div className={clsx(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        isUser 
          ? 'bg-claude-accent text-white' 
          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
      )}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message Content */}
      <div className={clsx(
        'flex-1 rounded-lg px-4 py-3',
        isUser 
          ? 'bg-claude-accent text-white ml-8' 
          : 'bg-gray-100 dark:bg-gray-800 mr-8'
      )}>
        {isUser ? (
          <div className="whitespace-pre-wrap">{getMessageContent()}</div>
        ) : (
          <div className="prose-claude">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      language={match[1]}
                      style={vscDarkPlus}
                      PreTag="div"
                      customStyle={{
                        margin: '0.5em 0',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                      }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {getMessageContent()}
            </ReactMarkdown>
          </div>
        )}

        {/* Actions */}
        {!isUser && (
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}