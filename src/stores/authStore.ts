import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { AppRole, Zone } from '@/lib/constants';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  zone: Zone | string;
  status: string;
  avatar_url: string | null;
  has_seen_welcome: boolean;
}

interface AuthState {
  user: Profile | null;
  isGuest: boolean;
  isLoading: boolean;
  setUser: (user: Profile | null) => void;
  setGuest: (isGuest: boolean) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isGuest: false,
  isLoading: true,
  setUser: (user) => set({ user }),
  setGuest: (isGuest) => set({ isGuest }),
  setLoading: (isLoading) => set({ isLoading }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, isGuest: false });
  },
  initialize: async () => {
    set({ isLoading: true });

    const fetchProfile = async (userId: string) => {
      try {
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        // Auto-create profile if missing (e.g. trigger didn't fire)
        if (!profile) {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            const newProfile = {
              id: authUser.id,
              name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || '',
              email: authUser.email || '',
              role: 'volunteer' as const,
              zone: 'General',
              status: 'active',
              has_seen_welcome: false,
            };
            await supabase.from('profiles').upsert(newProfile);
            profile = newProfile as any;
          }
        }

        if (profile) {
          set({ user: profile as unknown as Profile, isGuest: false, isLoading: false });
        } else {
          set({ isLoading: false });
        }
      } catch {
        set({ isLoading: false });
      }
    };

    // Listen for future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          set({ user: null, isLoading: false });
        }
      }
    );

    // Check current session
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
