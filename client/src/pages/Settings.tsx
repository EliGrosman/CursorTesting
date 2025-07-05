import { useState, useEffect } from 'react';
import { Save, Brain, Zap, MessageSquare, Key, Shield, Moon, Sun, Trash2, Eye, EyeOff } from 'lucide-react';
import { useChatStore } from '../stores/chatStore';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

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
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [decryptedKeys, setDecryptedKeys] = useState<Record<string, string>>({});
  const [decryptPassword, setDecryptPassword] = useState('');
  const [decrypting, setDecrypting] = useState(false);

  // Load API keys on component mount
  useEffect(() => {
    if (user) {
      loadApiKeys();
    }
  }, [user]);

  const loadApiKeys = async () => {
    setLoadingKeys(true);
    try {
      const response = await api.get('/apikeys');
      setApiKeys(response.data);
    } catch (error: any) {
      toast.error('Failed to load API keys');
    } finally {
      setLoadingKeys(false);
    }
  };

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
      loadApiKeys(); // Reload the list
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save API key');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) {
      return;
    }

    try {
      await api.delete(`/apikeys/${keyId}`);
      toast.success('API key deleted');
      loadApiKeys(); // Reload the list
    } catch (error: any) {
      toast.error('Failed to delete API key');
    }
  };

  const handleDecryptApiKey = async (keyId: string) => {
    if (!decryptPassword) {
      toast.error('Please enter your password');
      return;
    }

    setDecrypting(true);
    try {
      const response = await api.post(`/apikeys/${keyId}/decrypt`, {
        password: decryptPassword
      });
      
      setDecryptedKeys(prev => ({ ...prev, [keyId]: response.data.key }));
      setDecryptPassword('');
      toast.success('API key decrypted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to decrypt API key');
    } finally {
      setDecrypting(false);
    }
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    return key.substring(0, 7) + '...' + key.substring(key.length - 4);
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

        {/* API Key Management */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-claude-border dark:border-claude-border-dark p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key Management
          </h2>
          
          {/* Existing API Keys */}
          <div className="mb-6">
            <h3 className="text-md font-medium mb-3">Your API Keys</h3>
            {loadingKeys ? (
              <div className="text-gray-500 dark:text-gray-400">Loading API keys...</div>
            ) : apiKeys.length > 0 ? (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div key={key.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{key.name}</span>
                          {key.is_active ? (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded">
                              Inactive
                            </span>
                          )}
                          {key.isExpired && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded">
                              Expired
                            </span>
                          )}
                        </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-300">
              <p>Key: {maskApiKey('sk-ant-api03-...')}</p>
              <p>Created: {new Date(key.created_at).toLocaleDateString()}</p>
              {key.last_used_at && (
                <p>Last used: {new Date(key.last_used_at).toLocaleDateString()}</p>
              )}
              {key.expires_at && (
                <p>Expires: {new Date(key.expires_at).toLocaleDateString()}</p>
              )}
            </div>
                        
                        {/* Decrypt API Key Section */}
                        {decryptedKeys[key.id] ? (
                          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                            <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                              API Key (copy this now - it won't be shown again):
                            </p>
                            <code className="text-xs bg-white dark:bg-gray-800 p-2 rounded border block break-all">
                              {decryptedKeys[key.id]}
                            </code>
                            <button
                              onClick={() => setDecryptedKeys(prev => {
                                const newKeys = { ...prev };
                                delete newKeys[key.id];
                                return newKeys;
                              })}
                              className="mt-2 text-xs text-green-600 dark:text-green-400 hover:underline"
                            >
                              Hide key
                            </button>
                          </div>
                        ) : (
                          <div className="mt-3">
                            <div className="flex gap-2 items-center">
                              <input
                                type="password"
                                value={decryptPassword}
                                onChange={(e) => setDecryptPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="flex-1 input-primary text-sm"
                              />
                              <button
                                onClick={() => handleDecryptApiKey(key.id)}
                                disabled={decrypting || !decryptPassword}
                                className="btn-secondary text-sm"
                              >
                                {decrypting ? 'Decrypting...' : 'Show Key'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteApiKey(key.id)}
                          className="btn-secondary text-red-600 hover:text-red-700"
                          title="Delete API key"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400 text-center py-4">
                No API keys found. Add your first API key below.
              </div>
            )}
          </div>

          {/* Add New API Key */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-md font-medium mb-3">Add New API Key</h3>
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
                    {showNewApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Your API key is encrypted and stored securely. You'll need to enter your password to retrieve it.
                </p>
              </div>
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