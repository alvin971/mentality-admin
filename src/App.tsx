// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ScoreConfigPage } from '@/pages/ScoreConfigPage'
import { TestFlowPage } from '@/pages/TestFlowPage'
import { ItemsLibraryPage } from '@/pages/ItemsLibraryPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { CollaborationPage } from '@/pages/CollaborationPage'
import { AdminPage } from '@/pages/AdminPage'
import { NormativePage } from '@/pages/NormativePage'
import { IRTPage } from '@/pages/IRTPage'
import { PreviewPage } from '@/pages/PreviewPage'
import { AuditPage } from '@/pages/AuditPage'
import { isConfigured } from '@/lib/supabase'

function SetupPage() {
  return (
    <div className="min-h-screen bg-clinical-bg flex items-center justify-center p-6">
      <div className="bg-white border border-clinical-border rounded-xl shadow-sm p-8 max-w-lg w-full space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 4a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-clinical-text">Mentality Admin — Configuration requise</h1>
            <p className="text-sm text-clinical-muted">Variables d'environnement Supabase manquantes</p>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
          <p className="text-sm text-orange-800 font-medium">Le site est bien déployé, mais Supabase n'est pas encore connecté.</p>
        </div>

        <div className="space-y-3 text-sm text-clinical-text">
          <p className="font-medium">Pour activer l'interface, ajoutez ces 2 variables dans Cloudflare :</p>
          <ol className="list-decimal list-inside space-y-2 text-clinical-subtle">
            <li>Ouvrez <strong>Cloudflare Dashboard → Pages → mentality-admin → Settings → Environment variables</strong></li>
            <li>Ajoutez <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">VITE_SUPABASE_URL</code></li>
            <li>Ajoutez <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">VITE_SUPABASE_ANON_KEY</code></li>
            <li>Allez dans <strong>Deployments → Retry deployment</strong> pour reconstruire avec les nouvelles variables</li>
          </ol>
          <p className="text-xs text-clinical-muted pt-1">
            Récupérez ces valeurs dans votre projet Supabase : <strong>Settings → API</strong>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  if (!isConfigured) return <SetupPage />

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected — tous les cliniciens */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
        />
        <Route
          path="/score-config"
          element={<ProtectedRoute><ScoreConfigPage /></ProtectedRoute>}
        />
        <Route
          path="/test-flow"
          element={<ProtectedRoute><TestFlowPage /></ProtectedRoute>}
        />
        <Route
          path="/items"
          element={<ProtectedRoute><ItemsLibraryPage /></ProtectedRoute>}
        />
        <Route
          path="/analytics"
          element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>}
        />
        <Route
          path="/collaboration"
          element={<ProtectedRoute><CollaborationPage /></ProtectedRoute>}
        />

        {/* Cortex clinique — nouvelles pages */}
        <Route
          path="/normative"
          element={<ProtectedRoute><NormativePage /></ProtectedRoute>}
        />
        <Route
          path="/irt"
          element={<ProtectedRoute><IRTPage /></ProtectedRoute>}
        />
        <Route
          path="/preview"
          element={<ProtectedRoute><PreviewPage /></ProtectedRoute>}
        />
        <Route
          path="/audit"
          element={<ProtectedRoute><AuditPage /></ProtectedRoute>}
        />

        {/* Admin only */}
        <Route
          path="/admin"
          element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>}
        />

        {/* Redirect root → dashboard (mode démo) */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
