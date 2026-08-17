import { create } from 'zustand'
import { t } from '../i18n'
import type { MusicFile, Playlist } from '../types'

const FAV_KEY = 'feiyu_mobile_favorites'
const RECENT_KEY = 'feiyu_mobile_recent'
const PLAYLISTS_KEY = 'feiyu_mobile_playlists'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch { /* ignore */ }
  return fallback
}

function save(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
}

interface CollectionState {
  favorites: MusicFile[]
  recent: MusicFile[]
  playlists: Playlist[]
  toggleFavorite: (track: MusicFile) => void
  isFavorite: (id: number) => boolean
  recordPlay: (track: MusicFile) => void
  createPlaylist: (name: string) => Playlist
  renamePlaylist: (id: number, name: string) => void
  deletePlaylist: (id: number) => void
  addToPlaylist: (playlistId: number, track: MusicFile) => void
  removeFromPlaylist: (playlistId: number, trackId: number) => void
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  favorites: load<MusicFile[]>(FAV_KEY, []),
  recent: load<MusicFile[]>(RECENT_KEY, []),
  playlists: load<Playlist[]>(PLAYLISTS_KEY, []),

  toggleFavorite: (track) => {
    const exists = get().favorites.some((f) => f.id === track.id)
    const next = exists
      ? get().favorites.filter((f) => f.id !== track.id)
      : [track, ...get().favorites]
    set({ favorites: next })
    save(FAV_KEY, next)
  },

  isFavorite: (id) => get().favorites.some((f) => f.id === id),

  recordPlay: (track) => {
    const next = [track, ...get().recent.filter((r) => r.id !== track.id)].slice(0, 200)
    set({ recent: next })
    save(RECENT_KEY, next)
  },

  createPlaylist: (name) => {
    const playlist: Playlist = {
      id: Date.now(),
      name: name || t('playlist.newDefaultName'),
      trackIds: '[]',
      createdAt: new Date().toISOString()
    }
    const next = [...get().playlists, playlist]
    set({ playlists: next })
    save(PLAYLISTS_KEY, next)
    return playlist
  },

  renamePlaylist: (id, name) => {
    const next = get().playlists.map((p) => (p.id === id ? { ...p, name } : p))
    set({ playlists: next })
    save(PLAYLISTS_KEY, next)
  },

  deletePlaylist: (id) => {
    const next = get().playlists.filter((p) => p.id !== id)
    set({ playlists: next })
    save(PLAYLISTS_KEY, next)
  },

  addToPlaylist: (playlistId, track) => {
    const next = get().playlists.map((p) => {
      if (p.id !== playlistId) return p
      let ids: number[] = []
      try { ids = JSON.parse(p.trackIds) as number[] } catch { /* ignore */ }
      if (ids.includes(track.id)) return p
      return { ...p, trackIds: JSON.stringify([...ids, track.id]) }
    })
    set({ playlists: next })
    save(PLAYLISTS_KEY, next)
  },

  removeFromPlaylist: (playlistId, trackId) => {
    const next = get().playlists.map((p) => {
      if (p.id !== playlistId) return p
      let ids: number[] = []
      try { ids = JSON.parse(p.trackIds) as number[] } catch { /* ignore */ }
      return { ...p, trackIds: JSON.stringify(ids.filter((id) => id !== trackId)) }
    })
    set({ playlists: next })
    save(PLAYLISTS_KEY, next)
  }
}))
