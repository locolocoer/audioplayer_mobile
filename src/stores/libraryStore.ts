import { create } from 'zustand'
import { LOCAL_SOURCE_ID, type MusicFile, type WebDAVConfig } from '../types'
import { scanWebDAV } from '../backend/webdav'

const CONFIGS_KEY = 'feiyu_mobile_configs'
const TRACKS_KEY = 'feiyu_mobile_tracks'

function loadConfigs(): WebDAVConfig[] {
  try {
    const raw = localStorage.getItem(CONFIGS_KEY)
    if (raw) return JSON.parse(raw) as WebDAVConfig[]
  } catch { /* ignore */ }
  return []
}

function loadTracks(): MusicFile[] {
  try {
    const raw = localStorage.getItem(TRACKS_KEY)
    if (raw) return JSON.parse(raw) as MusicFile[]
  } catch { /* ignore */ }
  return []
}

interface LibraryState {
  tracks: MusicFile[]
  configs: WebDAVConfig[]
  scanning: boolean
  loadFromStorage: () => void
  addTracks: (tracks: MusicFile[]) => void
  saveConfig: (config: WebDAVConfig) => Promise<void>
  deleteConfig: (id: string) => void
  scan: (config: WebDAVConfig) => Promise<void>
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  tracks: loadTracks(),
  configs: loadConfigs(),
  scanning: false,
  loadFromStorage: () => {
    set({ tracks: loadTracks(), configs: loadConfigs() })
  },
  addTracks: (tracks) => {
    set((s) => {
      const existing = new Set(s.tracks.map((t) => t.id))
      const fresh = tracks.filter((t) => !existing.has(t.id))
      return { tracks: [...s.tracks, ...fresh] }
    })
  },
  saveConfig: async (config) => {
    const next = [...get().configs.filter((c) => c.id !== config.id), config]
    set({ configs: next })
    try { localStorage.setItem(CONFIGS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  },
  deleteConfig: (id) => {
    const next = get().configs.filter((c) => c.id !== id)
    set({ configs: next })
    try { localStorage.setItem(CONFIGS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  },
  scan: async (config) => {
    set({ scanning: true })
    try {
      const files = await scanWebDAV(config)
      const others = get().tracks.filter((tr) => tr.webdavId !== config.id)
      const merged = [...others, ...files]
      set({ tracks: merged })
      // 仅持久化云端曲目，导入的本地文件（内存态）不落盘
      const persistable = merged.filter((tr) => tr.webdavId !== LOCAL_SOURCE_ID)
      try { localStorage.setItem(TRACKS_KEY, JSON.stringify(persistable)) } catch { /* ignore */ }
    } finally {
      set({ scanning: false })
    }
  }
}))
