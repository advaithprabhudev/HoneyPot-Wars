import { randomUUID } from 'crypto'
import { Router } from 'express'
import multer from 'multer'
import { handleGetScanReport, handleGitHubScanValidate } from '../controllers/scan.js'
import { storePendingUpload } from '../services/scanStore.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
      cb(null, true)
    } else {
      cb(new Error('Only .zip files are accepted'))
    }
  },
})

const router = Router()

// Validate GitHub scan params before client initiates Socket.IO scan
router.post('/github/validate', handleGitHubScanValidate)

// Upload a ZIP — stores buffer server-side, returns uploadToken for Socket.IO scan
router.post('/upload', upload.single('repo'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file uploaded' })
    return
  }
  const token = randomUUID()
  storePendingUpload(token, req.file.buffer, req.file.originalname)
  res.json({
    success: true,
    data: { uploadToken: token, fileName: req.file.originalname, size: req.file.size },
  })
})

// Download the full JSON report for a completed scan
router.get('/:scanId/report', handleGetScanReport)

export { router as scanRouter }
