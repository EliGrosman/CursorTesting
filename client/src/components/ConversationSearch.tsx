import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MessageSquare, Calendar, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Fuse from 'fuse.js';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Conversation } from '../services/api';
import clsx from 'clsx';

interface ConversationSearchProps {
  conversations: Conversation[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ConversationSearch({ conversations, isOpen, onClose }: ConversationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Conversation[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Initialize Fuse.js for fuzzy search
  const fuse = new Fuse(conversations, {
    keys: [
      { name: 'title', weight: 0.6 },
      { name: 'messages.content', weight: 0.4 }
    ],
    threshold: 0.3,
    includeScore: true,
    minMatchCharLength: 2,
  });

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim()) {
      const searchResults = fuse.search(query);
      setResults(searchResults.map(result => result.item));
    } else {
      // Show recent conversations when no query
      setResults(conversations.slice(0, 5));
    }
  }, [query, conversations]);

  const handleSelect = (conversation: Conversation) => {
    navigate(`/chat/${conversation.id}`);
    onClose();
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          {/* Search Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search conversations..."
                className={clsx(
                  'w-full pl-12 pr-12 py-3 text-lg',
                  'bg-gray-50 dark:bg-gray-800 rounded-lg',
                  'border border-transparent focus:border-claude-accent',
                  'focus:outline-none focus:ring-2 focus:ring-claude-accent/50',
                  'transition-all duration-200'
                )}
              />
              <button
                onClick={onClose}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Search Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {results.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No conversations found</p>
              </div>
            ) : (
              <div className="p-2">
                {results.map((conversation) => (
                  <motion.button
                    key={conversation.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSelect(conversation)}
                    className={clsx(
                      'w-full p-4 mb-2 rounded-lg text-left',
                      'hover:bg-gray-100 dark:hover:bg-gray-800',
                      'focus:outline-none focus:ring-2 focus:ring-claude-accent',
                      'transition-all duration-200'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <MessageSquare className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {conversation.title}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(conversation.updatedAt), 'MMM d, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {conversation.messages.length} messages
                          </span>
                        </div>
                        {conversation.messages.length > 0 && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {conversation.messages[conversation.messages.length - 1].content}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Search Tips */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-xs text-gray-500">
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">ESC</kbd> to close
              {' • '}
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">↑↓</kbd> to navigate
              {' • '}
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd> to select
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}