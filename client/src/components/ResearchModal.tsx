import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Search, X, Globe, FileText } from 'lucide-react';
import { searchApi } from '../services/api';
import toast from 'react-hot-toast';

interface ResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ResearchModal({ isOpen, onClose }: ResearchModalProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [researchData, setResearchData] = useState<any>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const searchResults = await searchApi.webSearch(query);
      setResults(searchResults);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleResearch = async () => {
    if (!query.trim()) return;

    setIsResearching(true);
    setResearchData(null);
    try {
      const research = await searchApi.research(query, 5, (progress) => {
        if (progress.type === 'start') {
          toast.loading(progress.message);
        }
      });
      setResearchData(research);
      toast.dismiss();
      toast.success('Research completed!');
    } catch (error) {
      toast.error('Research failed');
    } finally {
      setIsResearching(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white dark:bg-gray-900 rounded-xl shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-claude-border dark:border-claude-border-dark">
            <Dialog.Title className="text-lg font-semibold">Research Mode</Dialog.Title>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            {/* Search Input */}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter a topic to research..."
                className="flex-1 input-primary"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !query.trim()}
                className="btn-secondary flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
              <button
                onClick={handleResearch}
                disabled={isResearching || !query.trim()}
                className="btn-primary flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Deep Research
              </button>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto scrollbar-thin">
              {/* Search Results */}
              {results.length > 0 && !researchData && (
                <div>
                  <h3 className="text-sm font-medium mb-3">Search Results</h3>
                  <div className="space-y-3">
                    {results.map((result, index) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-claude-accent hover:underline flex items-center gap-1"
                        >
                          <Globe className="h-3 w-3" />
                          {result.title}
                        </a>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {result.snippet}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{result.source}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Research Results */}
              {researchData && (
                <div>
                  <h3 className="text-sm font-medium mb-3">Research Summary</h3>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                    <p className="text-sm">{researchData.summary}</p>
                  </div>
                  
                  <h4 className="text-sm font-medium mb-3">Sources</h4>
                  <div className="space-y-3">
                    {researchData.sources.map((source: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-claude-accent hover:underline flex items-center gap-1"
                        >
                          <Globe className="h-3 w-3" />
                          {source.title}
                        </a>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-3">
                          {source.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading States */}
              {isSearching && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center gap-2 text-gray-500">
                    <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-claude-accent rounded-full" />
                    Searching...
                  </div>
                </div>
              )}

              {isResearching && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center gap-2 text-gray-500">
                    <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-claude-accent rounded-full" />
                    Conducting deep research...
                  </div>
                </div>
              )}
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}