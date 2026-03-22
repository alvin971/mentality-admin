// src/components/Header.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/Badge'
import type { Profile } from '@/types'

interface HeaderProps {
  profile: Profile | null
  title: string
  onMenuClick: () => void
}

export function Header({ profile, title, onMenuClick }: HeaderProps) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <header className="h-14 border-b border-clinical-border bg-white px-4 flex items-center justify-between flex-shrink-0 gap-3">
      {/* Bouton hamburger — visible uniquement sur mobile */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-clinical-muted hover:text-clinical-text hover:bg-gray-100 transition-colors flex-shrink-0"
        aria-label="Menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <h1 className="text-sm font-semibold text-clinical-text truncate flex-1">{title}</h1>

      {/* Profil utilisateur */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold flex-shrink-0">
            {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'A'}
          </div>
          {/* Nom visible seulement sur desktop */}
          <div className="hidden sm:block text-left">
            <p className="text-xs font-medium text-clinical-text leading-none truncate max-w-[120px]">
              {profile?.full_name ?? 'Admin'}
            </p>
          </div>
          <Badge variant={profile?.role === 'admin' ? 'blue' : 'gray'} className="hidden sm:inline-flex">
            {profile?.role === 'admin' ? 'Admin' : 'Clinicien'}
          </Badge>
          <svg className="w-3.5 h-3.5 text-clinical-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-clinical-border rounded-lg shadow-lg z-20 py-1">
              {profile?.institution && (
                <div className="px-3 py-2 border-b border-clinical-border">
                  <p className="text-xs text-clinical-muted truncate">{profile.institution}</p>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
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
