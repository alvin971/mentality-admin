// src/services/auth.service.ts
import { supabase } from '@/lib/supabase'
import type { Specialty } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export const authService = {
  async signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password })
  },

  async signOut() {
    return supabase.auth.signOut()
  },

  async inviteClinician(email: string, fullName: string, specialty: Specialty, institution: string) {
    // Invite via Supabase Auth Admin API — nécessite la service_role key côté serveur.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (supabase.auth as any).admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName,
        role: 'clinician',
        specialty,
        institution,
      },
    })
  },

  async updateProfile(id: string, updates: { full_name?: string; specialty?: Specialty; institution?: string }) {
    return db.from('profiles').update(updates).eq('id', id)
  },

  async setClinicianActive(id: string, is_active: boolean) {
    return db.from('profiles').update({ is_active }).eq('id', id)
  },

  async listClinicians() {
    return db
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
  },
}
