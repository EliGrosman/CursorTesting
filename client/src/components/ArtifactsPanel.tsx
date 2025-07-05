import { useState, useEffect } from 'react';
import { X, FileText, Code, Image, Database, Download, Trash2 } from 'lucide-react';
import api, { websocketService } from '../services/api';

interface Artifact {
  id: string;
  name: string;
  type: string;
  mime_type: string;
  file_extension?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface ArtifactsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
}

const getArtifactIcon = (type: string) => {
  switch (type) {
    case 'code':
      return <Code className="h-4 w-4" />;
    case 'document':
      return <FileText className="h-4 w-4" />;
    case 'image':
      return <Image className="h-4 w-4" />;
    case 'data':
      return <Database className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getFileExtension = (mimeType: string): string => {
  const extensions: Record<string, string> = {
    'text/plain': '.txt',
    'text/markdown': '.md',
    'text/html': '.html',
    'text/css': '.css',
    'text/javascript': '.js',
    'application/json': '.json',
    'application/xml': '.xml',
    'text/xml': '.xml',
    'text/csv': '.csv',
    'application/pdf': '.pdf',
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
  };
  return extensions[mimeType] || '.txt';
};

export default function ArtifactsPanel({ isOpen, onClose, conversationId }: ArtifactsPanelProps) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && conversationId) {
      loadArtifacts();
    }
  }, [isOpen, conversationId]);

  // Listen for new artifacts from WebSocket
  useEffect(() => {
    const handleArtifactMessage = (data: any) => {
      if (data.type === 'artifact' && data.data.artifacts) {
        loadArtifacts();
      }
    };

    // Add WebSocket listener
    websocketService.onMessage(handleArtifactMessage);

    return () => {
      websocketService.offMessage(handleArtifactMessage);
    };
  }, [conversationId]);

  const loadArtifacts = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/artifacts/conversation/${conversationId}`);
      setArtifacts(response.data);
      if (response.data.length > 0 && !selectedArtifact) {
        setSelectedArtifact(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to load artifacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (artifact: Artifact) => {
    try {
      const extension = artifact.file_extension || getFileExtension(artifact.mime_type);
      const filename = `${artifact.name}${extension}`;
      
      // Create blob and download
      const blob = new Blob([artifact.content], { type: artifact.mime_type });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download artifact:', error);
    }
  };

  const handleDelete = async (artifact: Artifact) => {
    if (!confirm(`Are you sure you want to delete "${artifact.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/artifacts/${artifact.id}`);
      setArtifacts(artifacts.filter(a => a.id !== artifact.id));
      if (selectedArtifact?.id === artifact.id) {
        setSelectedArtifact(artifacts.length > 1 ? artifacts[0] : null);
      }
    } catch (error) {
      console.error('Failed to delete artifact:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-900 border-l border-claude-border dark:border-claude-border-dark flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-claude-border dark:border-claude-border-dark">
        <h2 className="text-lg font-semibold">Artifacts</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Artifacts List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading artifacts...</div>
        ) : artifacts.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No artifacts in this conversation
          </div>
        ) : (
          <div className="p-2">
            {artifacts.map((artifact) => (
              <div
                key={artifact.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedArtifact?.id === artifact.id
                    ? 'bg-claude-accent text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onClick={() => setSelectedArtifact(artifact)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getArtifactIcon(artifact.type)}
                    <span className="truncate">{artifact.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(artifact);
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      title="Download"
                    >
                      <Download className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(artifact);
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="text-xs mt-1 opacity-75">
                  {formatDate(artifact.updated_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Artifact Content */}
      {selectedArtifact && (
        <div className="border-t border-claude-border dark:border-claude-border-dark flex-1 flex flex-col">
          <div className="p-4 border-b border-claude-border dark:border-claude-border-dark">
            <div className="flex items-center gap-2 mb-2">
              {getArtifactIcon(selectedArtifact.type)}
              <h3 className="font-medium">{selectedArtifact.name}</h3>
            </div>
            <div className="text-xs text-gray-500">
              {selectedArtifact.type} • {formatDate(selectedArtifact.updated_at)}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {selectedArtifact.type === 'image' ? (
              <img
                src={`data:${selectedArtifact.mime_type};base64,${selectedArtifact.content}`}
                alt={selectedArtifact.name}
                className="max-w-full h-auto rounded"
              />
            ) : (
              <pre className="text-sm whitespace-pre-wrap break-words bg-gray-50 dark:bg-gray-800 p-3 rounded border">
                {selectedArtifact.content}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 