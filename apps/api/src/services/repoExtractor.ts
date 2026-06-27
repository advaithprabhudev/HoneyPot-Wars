import path from 'path'
import os from 'os'
import fs from 'fs/promises'
import { simpleGit } from 'simple-git'
import AdmZip from 'adm-zip'
import { env } from '../config/env.js'

const tmpBase = env.SCAN_TMP_DIR ?? os.tmpdir()

export type ExtractResult = {
  dir: string   // absolute path to extracted repo root
  name: string  // human-readable repo name
}

export async function extractGitHub(repoUrl: string, token: string): Promise<ExtractResult> {
  const scanId = `scan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const dir = path.join(tmpBase, scanId)
  await fs.mkdir(dir, { recursive: true })

  // Inject token into clone URL for private repo access
  const authedUrl = repoUrl.replace('https://', `https://x-access-token:${token}@`)

  const git = simpleGit()
  await git.clone(authedUrl, dir, ['--depth', '1'])

  const name = repoUrl.replace(/\.git$/, '').split('/').slice(-2).join('/')
  return { dir, name }
}

export async function extractZip(buffer: Buffer, originalName: string): Promise<ExtractResult> {
  const scanId = `scan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const dir = path.join(tmpBase, scanId)
  await fs.mkdir(dir, { recursive: true })

  const zip = new AdmZip(buffer)
  zip.extractAllTo(dir, true)

  // If the ZIP contains a single top-level directory, use that as the root
  const entries = await fs.readdir(dir)
  let root = dir
  if (entries.length === 1) {
    const candidate = path.join(dir, entries[0])
    const stat = await fs.stat(candidate)
    if (stat.isDirectory()) root = candidate
  }

  const name = originalName.replace(/\.zip$/i, '')
  return { dir: root, name }
}

export async function cleanupDir(dir: string): Promise<void> {
  // Safety guard: only delete paths under our controlled tmp base
  if (!dir.startsWith(tmpBase)) return
  await fs.rm(dir, { recursive: true, force: true })
}
