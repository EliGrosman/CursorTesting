import { FileText } from 'lucide-react';

interface ArtifactsToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  artifactCount?: number;
}

export default function ArtifactsToggle({ isOpen, onToggle, artifactCount = 0 }: ArtifactsToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
        isOpen
          ? 'bg-claude-accent text-white'
          : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
      title="Toggle artifacts panel"
    >
      <FileText className="h-4 w-4" />
      <span className="text-sm font-medium">Artifacts</span>
      {artifactCount > 0 && (
        <span className="bg-white dark:bg-gray-900 text-claude-accent text-xs px-1.5 py-0.5 rounded-full font-medium">
          {artifactCount}
        </span>
      )}
    </button>
  );
} 