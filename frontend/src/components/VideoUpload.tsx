import React, { useState, useRef } from 'react';
import { CloudArrowUpIcon, VideoCameraIcon } from '@heroicons/react/24/outline';

interface VideoUploadProps {
  onVideoSelect: (file: File) => void;
  selectedVideo: File | null;
  isUploading: boolean;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ 
  onVideoSelect, 
  selectedVideo, 
  isUploading 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith('video/'));
    
    if (videoFile) {
      onVideoSelect(videoFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onVideoSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Video Upload
      </label>
      
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer ${
          isDragOver
            ? 'border-primary-400 bg-primary-50'
            : selectedVideo
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="text-center">
          {selectedVideo ? (
            <div className="space-y-2">
              <VideoCameraIcon className="mx-auto h-12 w-12 text-green-500" />
              <div>
                <p className="text-sm font-medium text-green-600">
                  {selectedVideo.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(selectedVideo.size)}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  MP4, AVI, MOV up to 100MB
                </p>
              </div>
            </div>
          )}
        </div>
        
        {isUploading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              <span className="text-sm font-medium text-gray-600">Uploading...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoUpload;