// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { Layout } from '@/components/Layout'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  adminOnly?: boolean
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()

  if (loading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && profile?.role !== 'admin') return <Navigate to="/dashboard" replace />
  if (profile && !profile.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-clinical-bg">
        <div className="text-center max-w-sm">
          <p className="text-lg font-semibold text-clinical-text">Compte désactivé</p>
          <p className="text-sm text-clinical-muted mt-2">
            Votre compte a été désactivé. Contactez l'administrateur Mentality.
          </p>
        </div>
      </div>
    )
  }

  return <Layout>{children}</Layout>
}
