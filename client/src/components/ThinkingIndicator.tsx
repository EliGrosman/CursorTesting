import { useState } from 'react';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';

interface ThinkingIndicatorProps {
  content: string;
}

export default function ThinkingIndicator({ content }: ThinkingIndicatorProps) {
  const [expanded, setExpanded] = useState(false);

  if (!content) return null;

  return (
    <div className="my-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
      >
        <Brain className="h-4 w-4" />
        <span>Claude is thinking...</span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      
      <div className={clsx(
        'mt-2 overflow-hidden transition-all duration-200',
        expanded ? 'max-h-96' : 'max-h-0'
      )}>
        <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-pre-wrap font-mono max-h-96 overflow-y-auto scrollbar-thin">
          {content}
        </div>
      </div>
      
      {!expanded && content && (
        <div className="mt-2 flex items-center gap-1">
          <div className="thinking-dot" style={{ animationDelay: '0ms' }} />
          <div className="thinking-dot" style={{ animationDelay: '150ms' }} />
          <div className="thinking-dot" style={{ animationDelay: '300ms' }} />
        </div>
      )}
    </div>
  );
}