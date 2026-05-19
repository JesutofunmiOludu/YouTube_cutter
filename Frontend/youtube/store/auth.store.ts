'use client'

// ============================================================
// VidMind AI — Auth Store
// src/store/auth.store.ts
//
// Zustand store with cookie persistence so the Next.js
// middleware can read the token server-side on every request.
// ============================================================

import { create }    from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/types'

// ── Cookie helpers ────────────────────────────────────────

const COOKIE_NAME = 'vidmind_access_token'
const COOKIE_DAYS = 7

function setCookie(value: string) {
  const expires = new Date()
  expires.setDate(expires.getDate() + COOKIE_DAYS)
  document.cookie = `${COOKIE_NAME}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

function deleteCookie() {
  document.cookie = `${COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
}

// ── Types ─────────────────────────────────────────────────

interface AuthState {
  user:      User | null
  token:     string | null
  isLoading: boolean

  setAuth:    (user: User, token: string) => void
  updateUser: (partial: Partial<User>)    => void
  clearAuth:  ()                           => void
  setLoading: (v: boolean)                => void
}

// ── Store ─────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:      null,
      token:     null,
      isLoading: true,

      setAuth: (user, token) => {
        setCookie(token)
        set({ user, token, isLoading: false })
      },

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      clearAuth: () => {
        deleteCookie()
        set({ user: null, token: null, isLoading: false })
      },

      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name: 'vidmind-auth',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : {
          getItem:    () => null,
          setItem:    () => {},
          removeItem: () => {},
        }
      ),
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state) => {
        state?.setLoading(false)
        // Re-sync cookie from localStorage on hydration
        if (state?.token) setCookie(state.token)
      },
    }
  )
)