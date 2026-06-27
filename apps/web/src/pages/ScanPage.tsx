import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { SOCKET_EVENTS } from '@honeypot-wars/shared'
import { getSocket } from '../lib/socket.ts'

type Tab = 'github' | 'zip'

export default function ScanPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('github')
  const [repoUrl, setRepoUrl] = useState('')
  const [token, setToken] = useState('')
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleGitHubScan(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!repoUrl.startsWith('https://github.com/')) {
      setError('URL must start with https://github.com/')
      return
    }
    if (!token.trim()) {
      setError('GitHub personal access token is required')
      return
    }
    setLoading(true)
    const socket = getSocket()

    socket.once(SOCKET_EVENTS.SCAN_PROGRESS, (payload) => {
      navigate(`/results/${payload.scanId}`)
    })
    socket.once(SOCKET_EVENTS.SCAN_ERROR, (payload) => {
      setLoading(false)
      setError(payload.error)
    })

    socket.emit(SOCKET_EVENTS.REAL_SCAN_START, { type: 'github', repoUrl, token })
  }

  async function handleZipScan(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!zipFile) { setError('Please select a ZIP file'); return }
    setLoading(true)

    const formData = new FormData()
    formData.append('repo', zipFile)

    try {
      const res = await fetch('/api/scan/upload', { method: 'POST', body: formData })
      const json = await res.json() as { success: boolean; data?: { uploadToken: string }; error?: string }
      if (!json.success || !json.data) {
        setError(json.error ?? 'Upload failed')
        setLoading(false)
        return
      }

      const socket = getSocket()
      socket.once(SOCKET_EVENTS.SCAN_PROGRESS, (payload) => {
        navigate(`/results/${payload.scanId}`)
      })
      socket.once(SOCKET_EVENTS.SCAN_ERROR, (payload) => {
        setLoading(false)
        setError(payload.error)
      })

      socket.emit(SOCKET_EVENTS.REAL_SCAN_START, { type: 'zip', scanId: json.data.uploadToken })
    } catch {
      setError('Upload failed — is the API server running on port 4000?')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">HoneyPot Wars</h1>
          <p className="mt-2 text-gray-400">AI-powered security analysis · Consented repositories only</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl">
          <div className="flex rounded-lg bg-gray-800 p-1 mb-6">
            {(['github', 'zip'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null) }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {t === 'github' ? 'GitHub URL' : 'ZIP Upload'}
              </button>
            ))}
          </div>

          {tab === 'github' ? (
            <form onSubmit={handleGitHubScan} className="space-y-4">
              <Field label="Repository URL">
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/company/repo"
                  required
                  className="input"
                />
              </Field>
              <Field label="GitHub Token" hint="repo:read scope sufficient">
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_••••••••••••••••••"
                  required
                  className="input"
                />
              </Field>
              <SubmitButton loading={loading} label="Start Security Scan" />
            </form>
          ) : (
            <form onSubmit={(e) => { void handleZipScan(e) }} className="space-y-4">
              <Field label="Repository ZIP" hint="max 100 MB">
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-full px-3 py-8 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg text-center cursor-pointer hover:border-gray-500 transition-colors"
                >
                  {zipFile
                    ? <span className="text-blue-400 font-medium">{zipFile.name}</span>
                    : <span className="text-gray-500">Click to select a .zip file</span>
                  }
                </div>
                <input ref={fileRef} type="file" accept=".zip" className="hidden"
                  onChange={(e) => setZipFile(e.target.files?.[0] ?? null)} />
              </Field>
              <SubmitButton loading={loading} label="Upload & Scan" />
            </form>
          )}

          {error && (
            <p className="mt-4 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <p className="mt-4 text-xs text-gray-600 text-center">
            Only scan repositories you own or have explicit written consent to test
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">
        {label}
        {hint && <span className="ml-1 text-gray-500 font-normal">({hint})</span>}
      </label>
      {children}
    </div>
  )
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors">
      {loading ? 'Connecting…' : label}
    </button>
  )
}
