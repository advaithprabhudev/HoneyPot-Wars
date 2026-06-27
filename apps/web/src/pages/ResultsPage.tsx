import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { SOCKET_EVENTS } from '@honeypot-wars/shared'
import type { RealFinding, ScanJob, ScanSummary } from '@honeypot-wars/shared'
import { getSocket } from '../lib/socket.ts'

type PageStatus = 'scanning' | 'done' | 'error'

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#22c55e',
}

const CATEGORY_LABELS: Record<string, string> = {
  hardcoded_secret:      'Hardcoded Secret',
  injection_vector:      'Injection Vector',
  insecure_config:       'Insecure Config',
  vulnerable_dependency: 'Vulnerable Dependency',
}

const AGENT_LABELS: Record<string, string> = {
  secrets:    'Secrets',
  injection:  'Injection',
  config:     'Config',
  dependency: 'Dependency',
}

export default function ResultsPage() {
  const { scanId } = useParams<{ scanId: string }>()
  const navigate = useNavigate()

  const [pageStatus, setPageStatus] = useState<PageStatus>('scanning')
  const [repoName, setRepoName] = useState('')
  const [findings, setFindings] = useState<RealFinding[]>([])
  const [summary, setSummary] = useState<ScanSummary>({ critical: 0, high: 0, medium: 0, low: 0, total: 0 })
  const [progress, setProgress] = useState({ scanned: 0, total: 0, file: '' })
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const addFinding = useCallback((f: RealFinding) => {
    setFindings((prev) => [f, ...prev])
    setSummary((prev) => ({ ...prev, [f.severity]: prev[f.severity] + 1, total: prev.total + 1 }))
  }, [])

  useEffect(() => {
    if (!scanId) return
    const socket = getSocket()

    socket.on(SOCKET_EVENTS.SCAN_PROGRESS, (p) => {
      if (p.scanId !== scanId) return
      setProgress({ scanned: p.scannedFiles, total: p.totalFiles, file: p.file ?? '' })
    })

    socket.on(SOCKET_EVENTS.SCAN_FINDING, (f) => addFinding(f))

    socket.on(SOCKET_EVENTS.SCAN_COMPLETE, (p) => {
      if (p.scanId !== scanId) return
      setPageStatus('done')
      setRepoName(p.job.repoName)
      setProgress({ scanned: p.job.scannedFiles, total: p.job.totalFiles, file: '' })
      setFindings(p.job.findings.slice().reverse())
      setSummary(p.job.summary)
    })

    socket.on(SOCKET_EVENTS.SCAN_ERROR, (p) => {
      if (p.scanId !== scanId) return
      setPageStatus('error')
      setErrorMsg(p.error)
    })

    return () => {
      socket.off(SOCKET_EVENTS.SCAN_PROGRESS)
      socket.off(SOCKET_EVENTS.SCAN_FINDING)
      socket.off(SOCKET_EVENTS.SCAN_COMPLETE)
      socket.off(SOCKET_EVENTS.SCAN_ERROR)
    }
  }, [scanId, addFinding])

  function downloadReport() {
    void (async () => {
      const res = await fetch(`/api/scan/${scanId}/report`)
      const json = await res.json() as { success: boolean; data?: ScanJob }
      if (!json.data) return
      const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `security-report-${scanId?.slice(0, 8)}.json`
      a.click()
      URL.revokeObjectURL(url)
    })()
  }

  const pct = progress.total > 0 ? Math.round((progress.scanned / progress.total) * 100) : 0

  const chartData = [
    { name: 'Critical', value: summary.critical, color: SEVERITY_COLORS.critical },
    { name: 'High',     value: summary.high,     color: SEVERITY_COLORS.high },
    { name: 'Medium',   value: summary.medium,   color: SEVERITY_COLORS.medium },
    { name: 'Low',      value: summary.low,      color: SEVERITY_COLORS.low },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-300 text-sm">
            ← New scan
          </button>
          <span className="text-gray-700">|</span>
          <span className="font-semibold">{repoName || 'Initialising…'}</span>
          <span className="text-gray-600 text-xs font-mono">{scanId?.slice(0, 8)}</span>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={pageStatus} />
          {pageStatus === 'done' && (
            <button onClick={downloadReport}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-sm font-medium rounded-lg transition-colors">
              Download JSON Report
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Progress */}
        {pageStatus === 'scanning' && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span className="truncate max-w-sm">{progress.file || 'Extracting repository…'}</span>
              <span>{progress.scanned}/{progress.total} files ({pct}%)</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {pageStatus === 'error' && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-400">
            <strong>Scan failed:</strong> {errorMsg}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {chartData.map(({ name, value, color }) => (
            <div key={name} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-3xl font-bold" style={{ color }}>{value}</div>
              <div className="text-sm text-gray-400 mt-1">{name}</div>
            </div>
          ))}
        </div>

        {/* Chart + findings list */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Severity Distribution
            </h2>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={chartData} barSize={28}>
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {chartData.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 text-center">
              <span className="text-2xl font-bold text-white">{summary.total}</span>
              <span className="text-sm text-gray-500 ml-1">total findings</span>
            </div>
          </div>

          <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              Findings
              {pageStatus === 'scanning' && (
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              )}
            </h2>

            {findings.length === 0 && pageStatus === 'scanning' && (
              <p className="text-gray-600 text-sm">Analyzing files… findings appear here as detected.</p>
            )}
            {findings.length === 0 && pageStatus === 'done' && (
              <p className="text-green-400 text-sm">No security findings detected. ✓</p>
            )}

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {findings.map((f) => (
                <FindingCard
                  key={f.id}
                  finding={f}
                  expanded={expanded === f.id}
                  onToggle={() => setExpanded(expanded === f.id ? null : f.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: PageStatus }) {
  const cfg = {
    scanning: { cls: 'bg-blue-900/40 text-blue-400 border-blue-800',  label: '⟳ Scanning' },
    done:     { cls: 'bg-green-900/40 text-green-400 border-green-800', label: '✓ Complete' },
    error:    { cls: 'bg-red-900/40 text-red-400 border-red-800',      label: '✕ Error' },
  }[status]
  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${cfg.cls}`}>{cfg.label}</span>
  )
}

function FindingCard({ finding, expanded, onToggle }: {
  finding: RealFinding; expanded: boolean; onToggle: () => void
}) {
  const { severity, category, file, line, description, recommendation, agent } = finding
  const severityStyles: Record<string, string> = {
    critical: 'bg-red-900/50 text-red-400 border-red-800',
    high:     'bg-orange-900/50 text-orange-400 border-orange-800',
    medium:   'bg-yellow-900/50 text-yellow-400 border-yellow-800',
    low:      'bg-green-900/50 text-green-400 border-green-800',
  }
  return (
    <div onClick={onToggle}
      className="bg-gray-800 border border-gray-700 rounded-lg p-3 cursor-pointer hover:border-gray-600 transition-colors select-none">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${severityStyles[severity] ?? ''}`}>
            {severity}
          </span>
          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded">
            {CATEGORY_LABELS[category] ?? category}
          </span>
          <span className="text-xs text-gray-500">{AGENT_LABELS[agent] ?? agent}</span>
        </div>
        <span className="text-gray-600 text-xs">{expanded ? '▲' : '▼'}</span>
      </div>
      <p className="mt-1.5 text-xs text-gray-500 font-mono truncate">{file}:{line}</p>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">Finding</p>
            <p className="text-sm text-gray-200">{description}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">Recommendation</p>
            <p className="text-sm text-green-300">{recommendation}</p>
          </div>
        </div>
      )}
    </div>
  )
}
