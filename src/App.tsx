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

export default function App() {
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

        {/* Admin only */}
        <Route
          path="/admin"
          element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>}
        />

        {/* Redirect root → login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
