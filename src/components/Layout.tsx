// src/components/Layout.tsx
import { useState, type ReactNode } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { useAuth } from '@/hooks/useAuth'
import { useLocation } from 'react-router-dom'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':     'Tableau de bord',
  '/score-config':  'Configuration du scoring',
  '/test-flow':     'Flow des tests',
  '/items':         'Bibliothèque d\'items',
  '/analytics':     'Analytique',
  '/collaboration': 'Espace collaboratif',
  '/admin':         'Administration',
}

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { profile } = useAuth()
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] ?? 'Mentality Admin'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-clinical-bg">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — masquée sur mobile, slide-in via z-30 */}
      <div className={`
        fixed inset-y-0 left-0 z-30 transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0 lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar profile={profile} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          profile={profile}
          title={title}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
