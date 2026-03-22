// src/pages/PreviewPage.tsx
// Prévisualisation de la Flutter app dans un iframe

import { useState } from 'react'
import { Layout } from '@/components/Layout'

const FLUTTER_URL = import.meta.env.VITE_FLUTTER_APP_URL ?? 'https://mentality-flutter-web.pages.dev'

const DEVICES = [
  { label: 'iPhone 14 Pro', width: 393, height: 852 },
  { label: 'Samsung Galaxy S23', width: 360, height: 800 },
  { label: 'iPad Air', width: 820, height: 1180 },
  { label: 'Desktop 1280', width: 1280, height: 800 },
]

export function PreviewPage() {
  const [selectedDevice, setSelectedDevice] = useState(DEVICES[0])
  const [previewUrl, setPreviewUrl] = useState(FLUTTER_URL)
  const [customUrl, setCustomUrl] = useState(FLUTTER_URL)
  const [showAdminOverlay, setShowAdminOverlay] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)

  function reload() {
    setIframeKey(k => k + 1)
  }

  function applyCustomUrl() {
    setPreviewUrl(customUrl)
    reload()
  }

  const iframeUrl = showAdminOverlay
    ? `${previewUrl}${previewUrl.includes('?') ? '&' : '?'}adminPreview=1`
    : previewUrl

  return (
    <Layout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-clinical-text">Prévisualisation App Patient</h1>
            <p className="text-sm text-clinical-muted mt-0.5">
              Visualisez exactement ce que voit le patient dans la Flutter app
            </p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <label className="flex items-center gap-2 text-sm text-clinical-text cursor-pointer">
              <input
                type="checkbox"
                checked={showAdminOverlay}
                onChange={e => { setShowAdminOverlay(e.target.checked); reload() }}
                className="rounded"
              />
              Mode admin overlay
            </label>
            <button
              onClick={reload}
              className="px-3 py-2 text-sm border border-clinical-border rounded-lg text-clinical-subtle hover:text-clinical-text hover:bg-gray-50"
            >
              ↺ Recharger
            </button>
          </div>
        </div>

        {/* URL + device */}
        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-64">
            <label className="block text-xs font-medium text-clinical-muted mb-1">URL de l'app</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-clinical-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
              <button
                onClick={applyCustomUrl}
                className="px-3 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700"
              >
                Appliquer
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-clinical-muted mb-1">Appareil</label>
            <select
              value={selectedDevice.label}
              onChange={e => {
                const dev = DEVICES.find(d => d.label === e.target.value)
                if (dev) setSelectedDevice(dev)
              }}
              className="px-3 py-2 text-sm border border-clinical-border rounded-lg bg-white"
            >
              {DEVICES.map(d => (
                <option key={d.label} value={d.label}>
                  {d.label} ({d.width}×{d.height})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Iframe container */}
        <div className="flex justify-center">
          <div
            className="relative bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
            style={{
              width: Math.min(selectedDevice.width, window.innerWidth - 100),
              height: Math.min(selectedDevice.height, window.innerHeight - 300),
            }}
          >
            {/* Barre de status simulée */}
            <div className="h-6 bg-gray-800 flex items-center px-4">
              <div className="flex gap-1.5 ml-auto">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                <div className="w-6 h-2 rounded-full bg-gray-500" />
              </div>
            </div>

            <iframe
              key={iframeKey}
              src={iframeUrl}
              title="Flutter App Preview"
              style={{
                width: selectedDevice.width,
                height: selectedDevice.height - 24,
                border: 'none',
                transformOrigin: 'top left',
                transform: `scale(${Math.min((window.innerWidth - 100) / selectedDevice.width, (window.innerHeight - 300) / selectedDevice.height, 1)})`,
              }}
              allow="microphone; camera"
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
            />

            {showAdminOverlay && (
              <div className="absolute top-8 right-2 bg-violet-600/90 text-white text-xs px-2 py-1 rounded-full">
                Admin Mode
              </div>
            )}
          </div>
        </div>

        {/* Info + liens rapides */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-medium mb-1">Notes :</p>
          <ul className="space-y-1 text-xs text-blue-700">
            <li>• La Flutter app doit être déployée sur Cloudflare Pages pour être visible ici</li>
            <li>• Le paramètre <code className="bg-blue-100 px-1 rounded">?adminPreview=1</code> est disponible pour les versions futures de l'app</li>
            <li>• Certaines fonctionnalités (microphone, etc.) peuvent nécessiter des permissions navigateur</li>
          </ul>
        </div>
      </div>
    </Layout>
  )
}
