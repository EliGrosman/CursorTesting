import { create } from 'zustand';
import api from '../services/api';

export interface Folder {
  id: string;
  name: string;
  color: string;
  icon: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FolderStore {
  folders: Folder[];
  isLoading: boolean;
  
  setFolders: (folders: Folder[]) => void;
  setLoading: (loading: boolean) => void;
  
  fetchFolders: () => Promise<void>;
  createFolder: (data: { name: string; color?: string; icon?: string; parentId?: string | null }) => Promise<Folder>;
  updateFolder: (id: string, data: Partial<Folder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  moveConversationToFolder: (conversationId: string, folderId: string | null) => Promise<void>;
}

export const useFolderStore = create<FolderStore>((set) => ({
  folders: [],
  isLoading: false,
  
  setFolders: (folders) => set({ folders }),
  setLoading: (loading) => set({ isLoading: loading }),
  
  fetchFolders: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get<Folder[]>('/folders');
      set({ folders: response.data });
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  createFolder: async (data) => {
    const response = await api.post<Folder>('/folders', data);
    const newFolder = response.data;
    set(state => ({ folders: [...state.folders, newFolder] }));
    return newFolder;
  },
  
  updateFolder: async (id, data) => {
    await api.patch(`/folders/${id}`, data);
    set(state => ({
      folders: state.folders.map(folder =>
        folder.id === id ? { ...folder, ...data } : folder
      )
    }));
  },
  
  deleteFolder: async (id) => {
    await api.delete(`/folders/${id}`);
    set(state => ({
      folders: state.folders.filter(folder => folder.id !== id)
    }));
  },
  
  moveConversationToFolder: async (conversationId, folderId) => {
    await api.patch(`/chat/conversations/${conversationId}`, { folderId });
  }
}));