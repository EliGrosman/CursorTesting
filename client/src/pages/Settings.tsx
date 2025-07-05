import React, { useState } from 'react';
import { Save, Brain, Zap, MessageSquare } from 'lucide-react';
import { useChatStore } from '../stores/chatStore';
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

  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }
    
    // In a real app, you'd send this to the backend securely
    localStorage.setItem('anthropic_api_key', apiKey);
    toast.success('API key saved (client-side only - use backend in production)');
    setApiKey('');
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