import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'

const ScanPage = lazy(() => import('./pages/ScanPage.tsx'))
const ResultsPage = lazy(() => import('./pages/ResultsPage.tsx'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen bg-gray-950 text-gray-400">
          Loading…
        </div>
      }>
        <Routes>
          <Route path="/" element={<ScanPage />} />
          <Route path="/results/:scanId" element={<ResultsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
