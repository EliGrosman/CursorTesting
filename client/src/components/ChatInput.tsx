import { useRef, KeyboardEvent } from 'react';
import { Paperclip, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import clsx from 'clsx';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  attachments: File[];
  onAttachmentsChange: (files: File[]) => void;
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  attachments,
  onAttachmentsChange,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      onAttachmentsChange([...attachments, ...acceptedFiles]);
    },
    noClick: true,
    noKeyboard: true,
  });

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const removeAttachment = (index: number) => {
    onAttachmentsChange(attachments.filter((_, i) => i !== index));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onAttachmentsChange([...attachments, ...files]);
  };

  return (
    <div {...getRootProps()} className="relative">
      <input {...getInputProps()} />
      
      {/* Drag overlay */}
      {isDragActive && (
        <div className="absolute inset-0 bg-claude-accent/10 border-2 border-dashed border-claude-accent rounded-lg flex items-center justify-center z-10">
          <p className="text-claude-accent font-medium">Drop files here...</p>
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-sm"
            >
              <span className="truncate max-w-[200px]">{file.name}</span>
              <button
                onClick={() => removeAttachment(index)}
                className="text-gray-500 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="relative flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Send a message..."
          rows={1}
          className={clsx(
            'flex-1 resize-none rounded-lg px-4 py-3 pr-12',
            'bg-white dark:bg-gray-800',
            'border border-claude-border dark:border-claude-border-dark',
            'focus:outline-none focus:ring-2 focus:ring-claude-accent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'max-h-[200px]'
          )}
          style={{
            minHeight: '48px',
            height: 'auto',
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${target.scrollHeight}px`;
          }}
        />

        {/* File upload button */}
        <label className="absolute right-2 bottom-3 cursor-pointer">
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
            accept="image/*,.txt,.md,.csv,.json,.xml,.html,.css,.js,.ts,.jsx,.tsx"
          />
          <Paperclip className={clsx(
            'h-5 w-5',
            disabled 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          )} />
        </label>
      </div>
    </div>
  );
}