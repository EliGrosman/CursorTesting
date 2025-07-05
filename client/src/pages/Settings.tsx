import { useState, useEffect } from 'react';
import { Save, Brain, Zap, MessageSquare, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { useChatStore } from '../stores/chatStore';
import toast from 'react-hot-toast';

interface ApiKey {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
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

  const [apiKey, setApiKey] = useState('');
  const [apiKeyName, setApiKeyName] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Load API keys on component mount
  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('/api/api-keys', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const keys = await response.json();
        setApiKeys(keys);
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Please log in to save API keys');
        return;
      }

      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          name: apiKeyName.trim() || 'My API Key',
        }),
      });

      if (response.ok) {
        toast.success('API key saved successfully');
        setApiKey('');
        setApiKeyName('');
        loadApiKeys();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save API key');
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      toast.error('Failed to save API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('API key deleted');
        loadApiKeys();
      } else {
        toast.error('Failed to delete API key');
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Failed to delete API key');
    }
  };

  const handleEditApiKey = async (id: string) => {
    if (!editingName.trim()) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingName.trim(),
        }),
      });

      if (response.ok) {
        toast.success('API key updated');
        setEditingKey(null);
        setEditingName('');
        loadApiKeys();
      } else {
        toast.error('Failed to update API key');
      }
    } catch (error) {
      console.error('Error updating API key:', error);
      toast.error('Failed to update API key');
    }
  };

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/api-keys/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
        }),
      });

      const result = await response.json();
      if (result.valid) {
        toast.success('API key is valid!');
      } else {
        toast.error(result.error || 'Invalid API key');
      }
    } catch (error) {
      console.error('Error testing API key:', error);
      toast.error('Failed to test API key');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        {/* API Configuration */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-claude-border dark:border-claude-border-dark p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            API Configuration
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Anthropic API Key
              </label>
              <div className="flex gap-2">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-api..."
                  className="flex-1 input-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="btn-secondary"
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={handleSaveApiKey}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Note: In production, API keys should be stored securely on the backend.
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
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-claude-border dark:border-claude-border-dark p-6">
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
                  Shows Claude's reasoning process (available for Sonnet models)
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Cost Information */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Pricing Information (Pay-as-you-go)
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p>• Claude 3.5 Sonnet: $3/1M input tokens, $15/1M output tokens</p>
            <p>• Claude 3 Opus: $15/1M input tokens, $75/1M output tokens</p>
            <p>• Claude 3 Haiku: $0.25/1M input tokens, $1.25/1M output tokens</p>
          </div>
        </div>
      </div>
    </div>
  );
}