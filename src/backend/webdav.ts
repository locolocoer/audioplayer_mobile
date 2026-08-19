import { registerPlugin } from '@capacitor/core'
import type { WebDAVConfig, MusicFile } from '../types'

interface WebDavNativeResult {
  status: number
  data: string
}

interface WebDavNativePlugin {
  request(options: {
    url: string
    method: string
    body?: string
    binary?: boolean
    headers?: Record<string, string>
  }): Promise<WebDavNativeResult>
}

const WebDav = registerPlugin<WebDavNativePlugin>('WebDav')

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

function rootUrl(config: WebDAVConfig): string {
  return buildUrl(config).replace(/\/+$/, '')
}

function authHeader(config: WebDAVConfig): string {
  const cred = `${config.username}:${config.password}`
  return 'Basic ' + btoa(unescape(encodeURIComponent(cred)))
}

function joinUrl(base: string, path: string): string {
  if (!path || path === '/') return base
  const encoded = path
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/')
  return base + (encoded.startsWith('/') ? encoded : '/' + encoded)
}

const PROPFIND_BODY = `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:resourcetype/>
    <d:getcontentlength/>
    <d:getlastmodified/>
  </d:prop>
</d:propfind>`

async function propfind(config: WebDAVConfig, depth: '0' | '1' | 'infinity'): Promise<{ status: number; xml: string }> {
  const res = await WebDav.request({
    url: rootUrl(config),
    method: 'PROPFIND',
    body: PROPFIND_BODY,
    headers: {
      Authorization: authHeader(config),
      Depth: depth,
      'Content-Type': 'application/xml; charset=utf-8'
    }
  })
  return { status: res.status, xml: res.data }
}

export async function testWebDAV(config: WebDAVConfig): Promise<{ ok: boolean; error?: string }> {
  try {
    const { status } = await propfind(config, '0')
    return { ok: status >= 200 && status < 400 }
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

function decodeHref(href: string): string {
  try {
    return decodeURIComponent(href)
  } catch {
    return href
  }
}

export async function scanWebDAV(config: WebDAVConfig): Promise<MusicFile[]> {
  const { status, xml } = await propfind(config, 'infinity')
  if (status >= 400) {
    throw new Error('WebDAV PROPFIND failed with HTTP ' + status)
  }
  const files: MusicFile[] = []
  const now = new Date().toISOString()
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const responses = doc.getElementsByTagNameNS('*', 'response')
  for (let i = 0; i < responses.length; i++) {
    const resp = responses[i]
    const hrefEl = resp.getElementsByTagNameNS('*', 'href')[0]
    if (!hrefEl) continue
    const path = decodeHref((hrefEl.textContent || '').trim())
    const rtEl = resp.getElementsByTagNameNS('*', 'resourcetype')[0]
    const isDir = !!rtEl && rtEl.getElementsByTagNameNS('*', 'collection').length > 0
    if (isDir) continue
    const lenEl = resp.getElementsByTagNameNS('*', 'getcontentlength')[0]
    const size = parseInt(lenEl?.textContent || '0', 10) || 0
    const modEl = resp.getElementsByTagNameNS('*', 'getlastmodified')[0]
    const mtime = (modEl?.textContent || '').trim()
    const name = path.split('/').filter(Boolean).pop() || path
    const ext = name.slice(name.lastIndexOf('.')).toLowerCase()
    if (!AUDIO_EXT.has(ext)) continue
    files.push({
      id: hashStr(config.id + ':' + path),
      path,
      filename: name,
      size,
      mtime,
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
  const res = await WebDav.request({
    url: joinUrl(rootUrl(config), path),
    method: 'GET',
    binary: true,
    headers: {
      Authorization: authHeader(config)
    }
  })
  if (res.status >= 400) {
    throw new Error('WebDAV GET failed with HTTP ' + res.status)
  }
  const binary = atob(res.data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes])
}
