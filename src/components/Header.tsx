// src/components/Header.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/Badge'
import type { Profile } from '@/types'

interface HeaderProps {
  profile: Profile | null
  title: string
}

export function Header({ profile, title }: HeaderProps) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <header className="h-14 border-b border-clinical-border bg-white px-6 flex items-center justify-between flex-shrink-0">
      <h1 className="text-base font-semibold text-clinical-text">{title}</h1>

      <div className="relative">
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
            {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-clinical-text leading-none">{profile?.full_name ?? '—'}</p>
            <p className="text-xs text-clinical-muted mt-0.5">{profile?.specialty ?? profile?.role ?? ''}</p>
          </div>
          <Badge variant={profile?.role === 'admin' ? 'blue' : 'gray'}>
            {profile?.role === 'admin' ? 'Admin' : 'Clinicien'}
          </Badge>
          <svg className="w-4 h-4 text-clinical-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-clinical-border rounded-lg shadow-lg z-20 py-1">
              {profile?.institution && (
                <div className="px-4 py-2 border-b border-clinical-border">
                  <p className="text-xs text-clinical-muted truncate">{profile.institution}</p>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Se déconnecter
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
