import React from 'react';
import { Platform } from '../types';

interface PlatformSelectorProps {
  selectedPlatforms: Platform[];
  onPlatformChange: (platforms: Platform[]) => void;
}

const platforms = [
  {
    id: 'instagram' as Platform,
    name: 'Instagram',
    icon: '📷',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    description: 'Share to Instagram Stories & Feed'
  },
  {
    id: 'tiktok' as Platform,
    name: 'TikTok',
    icon: '🎵',
    color: 'bg-black',
    description: 'Upload to TikTok'
  },
  {
    id: 'youtube' as Platform,
    name: 'YouTube Shorts',
    icon: '📺',
    color: 'bg-red-600',
    description: 'Upload as YouTube Shorts'
  }
];

const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatforms,
  onPlatformChange
}) => {
  const togglePlatform = (platform: Platform) => {
    if (selectedPlatforms.includes(platform)) {
      onPlatformChange(selectedPlatforms.filter(p => p !== platform));
    } else {
      onPlatformChange([...selectedPlatforms, platform]);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Select Platforms
      </label>
      
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {platforms.map((platform) => {
          const isSelected = selectedPlatforms.includes(platform.id);
          
          return (
            <div
              key={platform.id}
              className={`relative rounded-lg border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => togglePlatform(platform.id)}
            >
              <div className="p-4">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center text-white text-lg`}
                  >
                    {platform.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {platform.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {platform.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {selectedPlatforms.length === 0 && (
        <p className="text-sm text-red-600 mt-2">
          Please select at least one platform
        </p>
      )}
    </div>
  );
};

export default PlatformSelector;