import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/auth';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: authService.getUser(),
      isAuthenticated: authService.isAuthenticated(),
      isLoading: true,
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const isAuth = await authService.checkAuth();
          if (isAuth) {
            set({ user: authService.getUser(), isAuthenticated: true });
          } else {
            set({ user: null, isAuthenticated: false });
          }
        } catch (error) {
          set({ user: null, isAuthenticated: false });
        } finally {
          set({ isLoading: false });
        }
      },
      
      logout: async () => {
        await authService.logout();
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user }),
    }
  )
);