import { createClient, type WebDAVClient } from 'webdav'
import type { WebDAVConfig, MusicFile } from '../types'

const clients = new Map<string, WebDAVClient>()

function buildUrl(config: WebDAVConfig): string {
  if (config.sourceType === 'local') return config.url
  let raw = config.url.trim()
  // 允许用户直接填「IP」或「域名」，自动补 http://
  if (!/^https?:\/\//i.test(raw)) raw = 'http://' + raw
  // 拆出 scheme://host[:port][/path]
  const m = raw.match(/^(https?:\/\/[^/:]+)(?::(\d+))?(\/.*)?$/)
  if (!m) return raw
  // 已显式带端口则原样使用
  if (m[2]) return raw
  // https 默认 443（fnConnect 公网地址）；http 才拼用户填的端口（飞牛 WebDAV 默认 5006）
  const isHttps = m[1].toLowerCase().startsWith('https://')
  const port = isHttps ? 443 : config.port || 80
  return `${m[1]}:${port}${m[3] || ''}`
}

export function getClient(config: WebDAVConfig): WebDAVClient {
  const key = config.id || buildUrl(config)
  const cached = clients.get(key)
  if (cached) return cached
  const client = createClient(buildUrl(config), {
    username: config.username,
    password: config.password
  })
  clients.set(key, client)
  return client
}

export async function testWebDAV(config: WebDAVConfig): Promise<{ ok: boolean; error?: string }> {
  try {
    await getClient(config).getDirectoryContents('/')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

const AUDIO_EXT = new Set(['.mp3', '.flac', '.wav', '.ogg', '.aac', '.m4a', '.wma'])

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export async function scanWebDAV(config: WebDAVConfig): Promise<MusicFile[]> {
  const client = getClient(config)
  const entries = await client.getDirectoryContents('/', { deep: true })
  const files: MusicFile[] = []
  const now = new Date().toISOString()
  for (const entry of entries) {
    if (entry.type === 'directory') continue
    const name = entry.basename || ''
    const ext = name.slice(name.lastIndexOf('.')).toLowerCase()
    if (!AUDIO_EXT.has(ext)) continue
    files.push({
      id: hashStr(config.id + ':' + entry.filename),
      path: entry.filename,
      filename: name,
      size: entry.size || 0,
      mtime: entry.lastmod || '',
      title: name.replace(/\.[^.]+$/, ''),
      artist: '',
      album: '',
      duration: 0,
      webdavId: config.id,
      scannedAt: now,
      favorite: 0
    })
  }
  return files
}

export async function fetchAudioBlob(config: WebDAVConfig, path: string): Promise<Blob> {
  const client = getClient(config)
  const data = (await client.getFileContents(path, { format: 'binary' })) as unknown
  if (data instanceof Blob) return data
  if (data instanceof ArrayBuffer) return new Blob([data])
  if (typeof data === 'string') return new Blob([data], { type: 'application/octet-stream' })
  if (ArrayBuffer.isView(data)) {
    const arr = new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
    return new Blob([arr.slice().buffer])
  }
  throw new Error('unsupported audio response')
}
