import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      clearAuth: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      // Quick logout for testing (accessible from console)
      quickLogout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        window.location.href = '/login';
      },

      setLoading: (isLoading) => set({ isLoading }),

      updateUser: (userData) => {
        const updatedUser = { ...get().user, ...userData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        set({ user: updatedUser });
      },

      // Initialize auth state from localStorage
      initAuth: () => {
        try {
          const token = localStorage.getItem('token');
          const userStr = localStorage.getItem('user');
          
          if (token && userStr) {
            const user = JSON.parse(userStr);
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Error initializing auth:', error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      // Getters
      isAdmin: () => get().user?.role === 'admin',
      isVendor: () => get().user?.role === 'vendor',
      hasRole: (role) => get().user?.role === role,
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
    }
  )
);

// Make logout available globally for testing
if (typeof window !== 'undefined') {
  window.logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    useAuthStore.getState().clearAuth();
    window.location.href = '/login';
  };
}

export default useAuthStore;
