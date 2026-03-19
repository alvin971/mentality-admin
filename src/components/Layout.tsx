// src/components/Layout.tsx
import { type ReactNode } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { useAuth } from '@/hooks/useAuth'
import { useLocation } from 'react-router-dom'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':    'Tableau de bord',
  '/score-config': 'Configuration du scoring',
  '/test-flow':    'Flow des tests',
  '/items':        'Bibliothèque d\'items',
  '/analytics':    'Analytique',
  '/collaboration':'Espace collaboratif',
  '/admin':        'Administration',
}

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { profile } = useAuth()
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] ?? 'Mentality Admin'

  return (
    <div className="flex h-screen overflow-hidden bg-clinical-bg">
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header profile={profile} title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
