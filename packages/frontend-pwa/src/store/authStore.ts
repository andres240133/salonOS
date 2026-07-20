import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  id: string;
  email: string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  rememberMe: boolean;
  login: (accessToken: string, user: AuthUser, rememberMe: boolean) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
}

/** Zustand store managing JWT auth state with selective localStorage persistence. */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      rememberMe: false,

      login: (accessToken, user, rememberMe) => {
        set({ accessToken, user, rememberMe });
      },

      setAccessToken: (token) => {
        set({ accessToken: token });
      },

      logout: () => {
        set({ accessToken: null, user: null, rememberMe: false });
      },
    }),
    {
      name: 'salonos-auth',
      // Only persist what's needed to restore session across tabs/reloads.
      // The refresh token lives in an HttpOnly cookie — never touched by JS.
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        rememberMe: state.rememberMe,
      }),
    },
  ),
);
