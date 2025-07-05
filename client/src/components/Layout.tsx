import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  MessageSquare, 
  Plus, 
  Settings, 
  Moon, 
  Sun, 
  Download,
  Trash2
} from 'lucide-react';
import { useChatStore } from '../stores/chatStore';
import { useThemeStore } from '../stores/themeStore';
import { conversationApi } from '../services/api';
import toast from 'react-hot-toast';

import clsx from 'clsx';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  
  const { 
    conversations, 
    currentConversation,
    setConversations,
    setCurrentConversation,
    deleteConversation,
    setIsLoadingConversations
  } = useChatStore();
  
  const { theme, toggleTheme } = useThemeStore();

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const convs = await conversationApi.getAll();
      setConversations(convs);
    } catch (error) {
      toast.error('Failed to load conversations');
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const newConversation = await conversationApi.create();
      setCurrentConversation(newConversation);
      navigate(`/chat/${newConversation.id}`);
    } catch (error) {
      toast.error('Failed to create new conversation');
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (confirm('Are you sure you want to delete this conversation?')) {
      try {
        await conversationApi.delete(id);
        deleteConversation(id);
        toast.success('Conversation deleted');
        
        if (currentConversation?.id === id) {
          navigate('/');
        }
      } catch (error) {
        toast.error('Failed to delete conversation');
      }
    }
  };

  const handleExportConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    try {
      const blob = await conversationApi.export(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${id}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Conversation exported');
    } catch (error) {
      toast.error('Failed to export conversation');
    }
  };

  return (
    <div className="flex h-screen bg-claude-bg dark:bg-claude-bg-dark">
      {/* Sidebar */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-80 transform bg-white dark:bg-gray-900 border-r border-claude-border dark:border-claude-border-dark transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-claude-border dark:border-claude-border-dark">
            <h1 className="text-xl font-semibold">Claude Clone</h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 btn-primary"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin">
            <h2 className="mb-2 text-sm font-medium text-gray-500">Recent Chats</h2>
            <div className="space-y-1">
              {conversations.map((conv) => (
                <Link
                  key={conv.id}
                  to={`/chat/${conv.id}`}
                  className={clsx(
                    'group flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                    currentConversation?.id === conv.id && 'bg-gray-100 dark:bg-gray-800'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{conv.title}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleExportConversation(conv.id, e)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      title="Export conversation"
                    >
                      <Download className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600"
                      title="Delete conversation"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-claude-border dark:border-claude-border-dark p-4 space-y-2">
            <Link
              to="/settings"
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={clsx(
          'fixed top-4 left-4 z-40 p-2 bg-white dark:bg-gray-900 border border-claude-border dark:border-claude-border-dark rounded-lg shadow-lg lg:hidden',
          sidebarOpen && 'hidden'
        )}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}