import { useState } from 'react';
import { Save, Brain, Zap, MessageSquare, Key, Shield, Moon, Sun } from 'lucide-react';
import { useChatStore } from '../stores/chatStore';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

interface ApiKey {
  id: string;
  name: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  isExpired?: boolean;
}

export default function Settings() {
  const {
    temperature,
    maxTokens,
    enableThinking,
    setTemperature,
    setMaxTokens,
    setEnableThinking,
  } = useChatStore();

  const { theme, setTheme } = useThemeStore();
  const { user } = useAuthStore();

  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [showNewApiKey, setShowNewApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveApiKey = async () => {
    if (!newApiKeyName.trim() || !newApiKey.trim()) {
      toast.error('Please enter both name and API key');
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/apikeys', {
        name: newApiKeyName,
        anthropicKey: newApiKey,
      });
      
      toast.success('API key saved securely');
      setNewApiKeyName('');
      setNewApiKey('');
      setShowNewApiKey(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save API key');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        {/* User Info */}
        {user && (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-claude-border dark:border-claude-border-dark p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account
            </h2>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Name:</span> {user.name}</p>
            </div>
          </div>
        )}

        {/* API Key Configuration */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-claude-border dark:border-claude-border-dark p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key Management
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Key Name
              </label>
              <input
                type="text"
                value={newApiKeyName}
                onChange={(e) => setNewApiKeyName(e.target.value)}
                placeholder="e.g., Production Key"
                className="w-full input-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Anthropic API Key
              </label>
              <div className="flex gap-2">
                <input
                  type={showNewApiKey ? 'text' : 'password'}
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder="sk-ant-api..."
                  className="flex-1 input-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowNewApiKey(!showNewApiKey)}
                  className="btn-secondary"
                >
                  {showNewApiKey ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={handleSaveApiKey}
                  disabled={isSaving}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Your API key is encrypted and stored securely. You'll need to enter your password to retrieve it.
              </p>
            </div>
          </div>
        </div>

        {/* Model Settings */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-claude-border dark:border-claude-border-dark p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Model Settings
          </h2>
          
          <div className="space-y-6">
            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Temperature: {temperature}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">
                Controls randomness. Lower = more focused, higher = more creative.
              </p>
            </div>

            {/* Max Tokens */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Max Tokens: {maxTokens}
              </label>
              <input
                type="range"
                min="256"
                max="8192"
                step="256"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum length of the response.
              </p>
            </div>
          </div>
        </div>

        {/* Advanced Features */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-claude-border dark:border-claude-border-dark p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Advanced Features
          </h2>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enableThinking}
                onChange={(e) => setEnableThinking(e.target.checked)}
                className="w-4 h-4 text-claude-accent bg-gray-100 border-gray-300 rounded focus:ring-claude-accent"
              />
              <div>
                <span className="font-medium">Enable Extended Thinking</span>
                <p className="text-sm text-gray-500">
                  Shows Claude's reasoning process (available for Claude 4 and Sonnet models)
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-claude-border dark:border-claude-border-dark p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            Appearance
          </h2>
          
          <div className="flex gap-4">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                theme === 'light'
                  ? 'border-claude-accent bg-claude-accent/10'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <Sun className="h-5 w-5 mx-auto mb-1" />
              <span className="text-sm">Light</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                theme === 'dark'
                  ? 'border-claude-accent bg-claude-accent/10'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <Moon className="h-5 w-5 mx-auto mb-1" />
              <span className="text-sm">Dark</span>
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                theme === 'system'
                  ? 'border-claude-accent bg-claude-accent/10'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <MessageSquare className="h-5 w-5 mx-auto mb-1" />
              <span className="text-sm">System</span>
            </button>
          </div>
        </div>

        {/* Cost Information */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Pricing Information (Pay-as-you-go)
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p>• Claude 4 Sonnet: $4/1M input tokens, $20/1M output tokens</p>
            <p>• Claude 4 Opus: $20/1M input tokens, $100/1M output tokens</p>
            <p>• Claude 3.5 Sonnet: $3/1M input tokens, $15/1M output tokens</p>
            <p>• Claude 3 Opus: $15/1M input tokens, $75/1M output tokens</p>
            <p>• Claude 3 Haiku: $0.25/1M input tokens, $1.25/1M output tokens</p>
          </div>
        </div>
      </div>
    </div>
  );
}