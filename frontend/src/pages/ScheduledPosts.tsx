import React, { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { ScheduledPost } from '../types';
import { getScheduledPosts, deletePost } from '../api';
import { format, formatDistanceToNow } from 'date-fns';

const ScheduledPosts: React.FC = () => {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadScheduledPosts();
  }, []);

  const loadScheduledPosts = async () => {
    try {
      const data = await getScheduledPosts();
      setScheduledPosts(data);
    } catch (error) {
      console.error('Failed to load scheduled posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        await deletePost(postId);
        await loadScheduledPosts(); // Reload the list
      } catch (error) {
        console.error('Failed to delete post:', error);
        alert('Failed to delete post. Please try again.');
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'posted':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const filteredPosts = scheduledPosts.filter(post => {
    if (filter === 'all') return true;
    return post.status === filter;
  });

  const statusCounts = {
    all: scheduledPosts.length,
    pending: scheduledPosts.filter(p => p.status === 'pending').length,
    posted: scheduledPosts.filter(p => p.status === 'posted').length,
    failed: scheduledPosts.filter(p => p.status === 'failed').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scheduled Posts</h1>
        <p className="text-gray-600">Manage and monitor your scheduled social media posts</p>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: 'All Posts', count: statusCounts.all },
            { key: 'pending', label: 'Pending', count: statusCounts.pending },
            { key: 'posted', label: 'Posted', count: statusCounts.posted },
            { key: 'failed', label: 'Failed', count: statusCounts.failed },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                filter === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2.5 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {filter === 'all' ? 'No scheduled posts' : `No ${filter} posts`}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? 'Get started by creating your first scheduled post.'
              : `No posts with ${filter} status found.`
            }
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredPosts.map((scheduledPost) => (
              <li key={scheduledPost.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(scheduledPost.status)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Post #{scheduledPost.post_id}
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>
                            Scheduled for {format(new Date(scheduledPost.scheduled_time), 'MMM d, yyyy h:mm a')}
                          </span>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(scheduledPost.scheduled_time), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(scheduledPost.status)}`}>
                        {scheduledPost.status}
                      </span>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {/* TODO: Implement view details */}}
                          className="text-gray-400 hover:text-gray-600"
                          title="View details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        
                        <button
                          onClick={() => handleDeletePost(scheduledPost.post_id)}
                          className="text-gray-400 hover:text-red-600"
                          title="Delete post"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {scheduledPost.error_message && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-md p-3">
                      <div className="flex">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">
                            Error occurred
                          </h3>
                          <div className="mt-1 text-sm text-red-700">
                            {scheduledPost.error_message}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Posted Time */}
                  {scheduledPost.posted_at && (
                    <div className="mt-2 text-sm text-gray-500">
                      Posted {formatDistanceToNow(new Date(scheduledPost.posted_at), { addSuffix: true })}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ScheduledPosts;