import axios from 'axios';
import { Post, ScheduledPost, CreatePostData, SchedulePostData, UploadResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadVideo = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/upload-video', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const createPost = async (postData: CreatePostData): Promise<Post> => {
  const response = await api.post('/posts', postData);
  return response.data;
};

export const schedulePost = async (scheduleData: SchedulePostData): Promise<ScheduledPost> => {
  const response = await api.post('/schedule', scheduleData);
  return response.data;
};

export const getPosts = async (): Promise<Post[]> => {
  const response = await api.get('/posts');
  return response.data;
};

export const getScheduledPosts = async (): Promise<ScheduledPost[]> => {
  const response = await api.get('/scheduled-posts');
  return response.data;
};

export const deletePost = async (postId: number): Promise<void> => {
  await api.delete(`/posts/${postId}`);
};

export default api;