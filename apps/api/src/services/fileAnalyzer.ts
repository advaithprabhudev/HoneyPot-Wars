import path from 'path'
import fs from 'fs/promises'
import { glob } from 'fast-glob'

const SCAN_EXTENSIONS = [
  '**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs',
  '**/*.py', '**/*.go', '**/*.java', '**/*.rb', '**/*.php', '**/*.cs',
  '**/*.env', '**/*.env.*',
  '**/package.json', '**/requirements.txt', '**/Pipfile', '**/Gemfile',
  '**/pom.xml', '**/build.gradle', '**/go.mod',
  '**/docker-compose.yml', '**/docker-compose.yaml', '**/.github/workflows/*.yml',
  '**/nginx.conf', '**/Dockerfile',
]

const IGNORE_PATTERNS = [
  '**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**',
  '**/__pycache__/**', '**/.venv/**', '**/vendor/**',
  '**/*.min.js', '**/*.bundle.js', '**/*.lock',
]

// Cap per file to avoid blowing context with generated or binary content
const MAX_FILE_BYTES = 200_000

// Target ~80k tokens per GPT-4o batch (approx 300k chars)
const MAX_BATCH_CHARS = 300_000

export type FileEntry = {
  relativePath: string
  content: string
}

export async function listScanableFiles(repoDir: string): Promise<string[]> {
  return glob(SCAN_EXTENSIONS, {
    cwd: repoDir,
    ignore: IGNORE_PATTERNS,
    dot: true,
    absolute: false,
  })
}

export async function readFiles(relativePaths: string[], repoDir: string): Promise<FileEntry[]> {
  const results: FileEntry[] = []
  for (const relativePath of relativePaths) {
    try {
      const abs = path.join(repoDir, relativePath)
      const stat = await fs.stat(abs)
      if (stat.size > MAX_FILE_BYTES) continue
      const content = await fs.readFile(abs, 'utf-8')
      results.push({ relativePath, content })
    } catch {
      // Skip unreadable or binary files
    }
  }
  return results
}

export function batchByContent(entries: FileEntry[]): FileEntry[][] {
  const batches: FileEntry[][] = []
  let current: FileEntry[] = []
  let currentChars = 0

  for (const entry of entries) {
    if (currentChars + entry.content.length > MAX_BATCH_CHARS && current.length > 0) {
      batches.push(current)
      current = []
      currentChars = 0
    }
    current.push(entry)
    currentChars += entry.content.length
  }
  if (current.length > 0) batches.push(current)
  return batches
}
