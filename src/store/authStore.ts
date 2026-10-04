import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import type { DemoUser } from '../types'
import { DEMO_CURRENT_USER, isDemoMode } from '../data/demoUsers'
import { normalizeProfile } from '../utils/profileNormalizer'
import { useConnectionStore } from './connectionStore'

interface AuthState {
  user: any | null
  profile: DemoUser | null
  isLoading: boolean
  isDemo: boolean
  isNewSignUp: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  setProfile: (profile: DemoUser | any) => void
  enterDemoMode: () => void
  setIsNewSignUp: (val: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      isLoading: false,
      isDemo: false,
      isNewSignUp: false,

      signIn: async (email, password) => {
        if (isDemoMode()) {
          set({
            isDemo: true,
            isNewSignUp: false,
            profile: { ...DEMO_CURRENT_USER, onboarding_completed: true },
            user: { id: DEMO_CURRENT_USER.id, email: DEMO_CURRENT_USER.email },
          })
          return { error: null }
        }
        set({ isLoading: true })
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          set({ isLoading: false })
          return { error: error.message }
        }

        // Fetch user profile from Supabase
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        set({
          isLoading: false,
          user: data.user,
          profile: normalizeProfile(profileData),
          isNewSignUp: false,
        })
        return { error: profileError ? profileError.message : null }
      },

      signUp: async (email, password, name) => {
        if (isDemoMode()) {
          const newUser: DemoUser = {
            ...DEMO_CURRENT_USER,
            email,
            display_name: name,
            id: `demo-${Date.now()}`,
            onboarding_completed: false,
          }
          set({ isDemo: true, isNewSignUp: true, profile: newUser, user: { id: newUser.id, email } })
          return { error: null }
        }
        set({ isLoading: true })
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } })
        
        if (error) {
          set({ isLoading: false })
          return { error: error.message }
        }

        // Wait a tiny bit for the database trigger to insert the profile before we fetch it
        await new Promise(resolve => setTimeout(resolve, 600))

        let profileData = null
        if (data.user) {
          const { data: pData } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
          profileData = pData
        }

        set({
          isLoading: false,
          user: data.user,
          profile: normalizeProfile(profileData),
          isNewSignUp: true,
        })
        useConnectionStore.getState().clearConnections()
        return { error: null }
      },

      signOut: async () => {
        if (!isDemoMode()) await supabase.auth.signOut()
        useConnectionStore.getState().clearConnections()
        set({ user: null, profile: null, isDemo: false, isNewSignUp: false })
      },

      setProfile: (profile) => set({ profile: normalizeProfile(profile) }),

      enterDemoMode: () => {
        useConnectionStore.getState().loadDemoConnections()
        set({
          isDemo: true,
          isNewSignUp: false,
          profile: { ...DEMO_CURRENT_USER, onboarding_completed: true },
          user: { id: DEMO_CURRENT_USER.id, email: DEMO_CURRENT_USER.email },
        })
      },

      setIsNewSignUp: (val) => set({ isNewSignUp: val }),
    }),
    {
      name: 'beside-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ isDemo: state.isDemo, profile: state.profile, user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state?.profile) {
          state.profile = normalizeProfile(state.profile)
        }
        if (!state?.isDemo) {
          const conns = useConnectionStore.getState().connections
          if (conns && Object.keys(conns).some((k) => k.startsWith('demo-'))) {
            useConnectionStore.getState().clearConnections()
          }
        }
      },
    }
  )
)
