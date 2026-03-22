// src/pages/DashboardPage.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { analyticsService } from '@/services/analytics.service'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { ChangeLogEntry } from '@/types'

interface DashboardStats {
  activeClinicians: number
  activeConfigs: number
  pendingProposals: number
  itemStats: { active: number; review: number; archived: number }
}

const CHANGE_TYPE_LABELS: Record<string, string> = {
  create:   'Création',
  update:   'Mise à jour',
  delete:   'Suppression',
  rollback: 'Rollback',
  deploy:   'Déploiement',
}

const CHANGE_TYPE_VARIANTS: Record<string, 'blue' | 'green' | 'red' | 'orange' | 'gray'> = {
  create:   'green',
  update:   'blue',
  delete:   'red',
  rollback: 'orange',
  deploy:   'green',
}

const QUICK_LINKS = [
  { to: '/score-config', label: 'Configurer le scoring', description: 'Modifier les règles de scoring des 12 tests', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { to: '/test-flow',    label: 'Éditer le flow',         description: 'Réordonner et configurer les tests',         color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { to: '/items',        label: 'Bibliothèque items',     description: 'Ajouter et gérer les items des tests',       color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { to: '/collaboration',label: 'Collaboration',          description: 'Commentaires et propositions en attente',    color: 'bg-orange-50 border-orange-200 text-orange-700' },
]

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activity, setActivity] = useState<ChangeLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      analyticsService.getActiveClinicianCount(),
      analyticsService.getActiveConfigCount(),
      analyticsService.getPendingProposalCount(),
      analyticsService.getRecentActivity(8),
      analyticsService.getItemStats(),
    ]).then(([clinicians, configs, proposals, recent, itemStats]) => {
      setStats({ activeClinicians: clinicians, activeConfigs: configs, pendingProposals: proposals, itemStats })
      setActivity(recent)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex justify-center pt-16"><Spinner size="lg" /></div>
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Stats KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card padding="md">
          <p className="text-xs font-medium text-clinical-muted uppercase tracking-wide">Cliniciens actifs</p>
          <p className="text-3xl font-bold text-clinical-text mt-1">{stats?.activeClinicians ?? 0}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs font-medium text-clinical-muted uppercase tracking-wide">Configs déployées</p>
          <p className="text-3xl font-bold text-clinical-text mt-1">{stats?.activeConfigs ?? 0}</p>
          <p className="text-xs text-clinical-muted mt-1">sur 12 tests</p>
        </Card>
        <Card padding="md">
          <p className="text-xs font-medium text-clinical-muted uppercase tracking-wide">Propositions en attente</p>
          <p className="text-3xl font-bold text-clinical-text mt-1">{stats?.pendingProposals ?? 0}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs font-medium text-clinical-muted uppercase tracking-wide">Items bibliothèque</p>
          <p className="text-3xl font-bold text-clinical-text mt-1">{(stats?.itemStats.active ?? 0) + (stats?.itemStats.review ?? 0)}</p>
          <p className="text-xs text-clinical-muted mt-1">{stats?.itemStats.review ?? 0} en révision</p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Liens rapides */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>Accès rapide</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`p-3 rounded-lg border text-left transition-opacity hover:opacity-80 ${link.color}`}
              >
                <p className="text-sm font-semibold">{link.label}</p>
                <p className="text-xs mt-0.5 opacity-80">{link.description}</p>
              </Link>
            ))}
          </div>
        </Card>

        {/* Activité récente */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          {activity.length === 0 ? (
            <p className="text-sm text-clinical-muted text-center py-6">
              Aucune activité récente.
            </p>
          ) : (
            <div className="space-y-2">
              {activity.map(entry => (
                <div key={entry.id} className="flex items-start gap-3 py-2 border-b border-clinical-border last:border-0">
                  <Badge variant={CHANGE_TYPE_VARIANTS[entry.change_type] ?? 'gray'}>
                    {CHANGE_TYPE_LABELS[entry.change_type] ?? entry.change_type}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-clinical-text truncate">
                      {entry.table_name.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-clinical-muted">
                      {entry.author
                        ? (entry.author as { full_name: string }).full_name
                        : 'Système'
                      }
                      {' · '}
                      {format(new Date(entry.changed_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
