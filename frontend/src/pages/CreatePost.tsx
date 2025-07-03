import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import VideoUpload from '../components/VideoUpload';
import PlatformSelector from '../components/PlatformSelector';
import { uploadVideo, createPost, schedulePost } from '../api';
import { Platform } from '../types';

interface FormData {
  title: string;
  description: string;
  hashtags: string;
  scheduledTime: string;
  publishNow: boolean;
}

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>();
  
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const publishNow = watch('publishNow');

  const onSubmit = async (data: FormData) => {
    if (!selectedVideo) {
      alert('Please select a video file');
      return;
    }

    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload video
      setIsUploading(true);
      const uploadResponse = await uploadVideo(selectedVideo);
      setIsUploading(false);

      // Create post
      const postData = {
        title: data.title,
        description: data.description,
        hashtags: data.hashtags,
        video_path: uploadResponse.file_path,
        platforms: selectedPlatforms,
      };

      const createdPost = await createPost(postData);

      // Schedule or publish now
      if (data.publishNow) {
        // Schedule for immediate posting (1 minute from now)
        const immediateTime = new Date();
        immediateTime.setMinutes(immediateTime.getMinutes() + 1);
        
        await schedulePost({
          post_id: createdPost.id,
          scheduled_time: immediateTime.toISOString(),
        });
      } else if (data.scheduledTime) {
        await schedulePost({
          post_id: createdPost.id,
          scheduled_time: new Date(data.scheduledTime).toISOString(),
        });
      }

      navigate('/');
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Post</h1>
        <p className="text-gray-600">Upload a video and schedule it across your social media platforms</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Video Upload */}
        <div className="card">
          <VideoUpload
            onVideoSelect={setSelectedVideo}
            selectedVideo={selectedVideo}
            isUploading={isUploading}
          />
        </div>

        {/* Post Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Post Details</h2>
          
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                id="title"
                {...register('title', { required: 'Title is required' })}
                className="input-field"
                placeholder="Enter post title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                {...register('description', { required: 'Description is required' })}
                className="input-field"
                placeholder="Write your post description..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Hashtags */}
            <div>
              <label htmlFor="hashtags" className="block text-sm font-medium text-gray-700 mb-2">
                Hashtags
              </label>
              <input
                type="text"
                id="hashtags"
                {...register('hashtags')}
                className="input-field"
                placeholder="#fun #viral #trending"
              />
              <p className="mt-1 text-sm text-gray-500">
                Separate hashtags with spaces (e.g., #fun #viral #trending)
              </p>
            </div>
          </div>
        </div>

        {/* Platform Selection */}
        <div className="card">
          <PlatformSelector
            selectedPlatforms={selectedPlatforms}
            onPlatformChange={setSelectedPlatforms}
          />
        </div>

        {/* Scheduling */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Scheduling</h2>
          
          <div className="space-y-4">
            {/* Publish Now Option */}
            <div className="flex items-center">
              <input
                id="publishNow"
                type="checkbox"
                {...register('publishNow')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="publishNow" className="ml-2 block text-sm text-gray-900">
                Publish immediately
              </label>
            </div>

            {/* Scheduled Time */}
            {!publishNow && (
              <div>
                <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule for later
                </label>
                <input
                  type="datetime-local"
                  id="scheduledTime"
                  {...register('scheduledTime', {
                    required: !publishNow ? 'Please select a time or choose to publish now' : false
                  })}
                  min={new Date().toISOString().slice(0, 16)}
                  className="input-field"
                />
                {errors.scheduledTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.scheduledTime.message}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </div>
            ) : (
              publishNow ? 'Create & Publish' : 'Create & Schedule'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;