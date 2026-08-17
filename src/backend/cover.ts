import { parseBlob, selectCover } from 'music-metadata'
import { LOCAL_SOURCE_ID, type MusicFile } from '../types'
import { fetchAudioBlob } from './webdav'
import { useLibraryStore } from '../stores/libraryStore'
import { useLocalStore } from '../stores/localStore'

const coverCache = new Map<string, string>()

async function extractCover(blob: Blob, key: string): Promise<string | null> {
  try {
    const metadata = await parseBlob(blob, { duration: false })
    const cover = selectCover(metadata.common.picture)
    if (!cover) return null
    const coverBlob = new Blob([cover.data.slice().buffer], { type: cover.format || 'image/jpeg' })
    const url = URL.createObjectURL(coverBlob)
    coverCache.set(key, url)
    return url
  } catch {
    return null
  }
}

export async function fetchCoverUrl(track: MusicFile): Promise<string | null> {
  const key = track.webdavId + ':' + track.path
  const cached = coverCache.get(key)
  if (cached) return cached

  if (track.webdavId === LOCAL_SOURCE_ID) {
    const entry = useLocalStore.getState().get(track.id)
    if (!entry) return null
    return extractCover(entry.blob, key)
  }

  const config = useLibraryStore.getState().configs.find((c) => c.id === track.webdavId)
  if (!config) return null
  const blob = await fetchAudioBlob(config, track.path)
  return extractCover(blob, key)
}
