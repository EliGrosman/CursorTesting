export interface Post {
  id: number;
  title: string;
  description: string;
  hashtags: string;
  video_path: string;
  platforms: string[];
  created_at: string;
}

export interface ScheduledPost {
  id: number;
  post_id: number;
  scheduled_time: string;
  status: 'pending' | 'processing' | 'posted' | 'failed';
  error_message?: string;
  posted_at?: string;
  created_at: string;
  post?: Post;
}

export interface CreatePostData {
  title: string;
  description: string;
  hashtags: string;
  video_path: string;
  platforms: string[];
}

export interface SchedulePostData {
  post_id: number;
  scheduled_time: string;
}

export interface UploadResponse {
  filename: string;
  file_path: string;
  file_url: string;
}

export type Platform = 'instagram' | 'tiktok' | 'youtube';