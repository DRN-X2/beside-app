import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import type { DemoUser } from '../types'
import { normalizeProfile } from '../utils/profileNormalizer'
import { useConnectionStore } from './connectionStore'

export const isValidUuid = (id?: string | null): boolean =>
  typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

interface AuthState {
  user: any | null
  profile: DemoUser | null
  isLoading: boolean
  isDemo: boolean
  isNewSignUp: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, name?: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  setProfile: (profile: DemoUser | any) => void
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
        set({ isLoading: true })
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          set({ isLoading: false })
          return { error: error.message }
        }

        // Fetch user profile from Supabase safely
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle()

        let userProfile = profileData
        if (!userProfile && data.user) {
          // Self-heal: profile row was deleted from public.profiles table
          const initialRow = {
            id: data.user.id,
            display_name: data.user.user_metadata?.display_name || 'Student',
            username: `user_${data.user.id.slice(0, 8)}`,
            otter_config: {
              fur: 'brown',
              eyes: 'happy',
              glasses: 'none',
              clothing: 'hoodie',
              accessory: 'none',
              background: 'cream',
              onboarding_completed: false,
              openworld_visible: true,
            },
            openworld_visible: true,
            xp: 0,
          }
          const { data: created } = await (supabase.from('profiles') as any)
            .upsert(initialRow)
            .select()
            .single()
          userProfile = created || initialRow
        }

        set({
          isLoading: false,
          user: data.user,
          profile: normalizeProfile(userProfile),
          isDemo: false,
          isNewSignUp: false,
        })
        return { error: null }
      },

      signUp: async (email, password, name) => {
        set({ isLoading: true })
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: name ? { data: { display_name: name } } : undefined,
        })

        if (error) {
          set({ isLoading: false })
          return { error: error.message }
        }

        let profileData = null

        if (data.user) {
          // Poll up to 3 times with progressive backoff to let the DB trigger insert the profile
          for (const delay of [300, 600, 1000]) {
            await new Promise((resolve) => setTimeout(resolve, delay))
            const { data: pData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single()

            if (pData) {
              profileData = pData
              break
            }
          }

          // If trigger didn't run, create the initial profile row directly
          if (!profileData) {
            const initialRow = {
              id: data.user.id,
              display_name: name,
              username: `user_${data.user.id.slice(0, 8)}`,
              otter_config: {
                fur: 'brown',
                eyes: 'happy',
                glasses: 'none',
                clothing: 'hoodie',
                accessory: 'none',
                background: 'cream',
                onboarding_completed: false,
                openworld_visible: true,
              },
              openworld_visible: true,
              xp: 0,
            }
            const { data: upserted } = await (supabase.from('profiles') as any)
              .upsert(initialRow)
              .select()
              .single()
            profileData = upserted || initialRow
          }
        }

        set({
          isLoading: false,
          user: data.user,
          profile: normalizeProfile(profileData),
          isDemo: false,
          isNewSignUp: true,
        })
        useConnectionStore.getState().clearConnections()
        return { error: null }
      },

      signOut: async () => {
        await supabase.auth.signOut().catch(() => {})
        const userId = useAuthStore.getState().user?.id
        if (userId) {
          localStorage.removeItem(`beside-connections-${userId}`)
        }
        useConnectionStore.getState().clearConnections()
        set({ user: null, profile: null, isDemo: false, isNewSignUp: false })
      },

      setProfile: (profile) => set({ profile: normalizeProfile(profile) }),

      setIsNewSignUp: (val) => set({ isNewSignUp: val }),
    }),
    {
      name: 'beside-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isDemo: false,
        profile: state.profile,
        user: state.user,
        isNewSignUp: state.isNewSignUp,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (
            (state.profile && !isValidUuid(state.profile.id)) ||
            (state.user && !isValidUuid(state.user.id))
          ) {
            console.warn('[authStore] Purging legacy non-UUID auth state from storage')
            state.profile = null
            state.user = null
            state.isDemo = false
            try {
              localStorage.removeItem('beside-auth')
            } catch {}
          } else if (state.profile) {
            state.profile = normalizeProfile(state.profile)
          }
        }
      },
    }
  )
)
