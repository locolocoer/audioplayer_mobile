import { usePlayerStore } from '../stores/playerStore'
import { useLibraryStore } from '../stores/libraryStore'
import { useCollectionStore } from '../stores/collectionStore'
import { useLocalStore } from '../stores/localStore'
import { fetchAudioBlob } from '../backend/webdav'
import { LOCAL_SOURCE_ID, type MusicFile } from '../types'

let audio: HTMLAudioElement | null = null
let objectUrl: string | null = null
let loading = false

function ensureAudio(): HTMLAudioElement {
  if (audio) return audio
  const el = new Audio()
  el.addEventListener('timeupdate', () => {
    usePlayerStore.getState().seek(el.currentTime)
  })
  el.addEventListener('durationchange', () => {
    if (Number.isFinite(el.duration)) usePlayerStore.getState().setDuration(el.duration)
  })
  el.addEventListener('ended', () => {
    void next()
  })
  el.addEventListener('error', () => {
    usePlayerStore.getState().setIsPlaying(false)
  })
  audio = el
  return el
}

export async function playTrack(track: MusicFile): Promise<void> {
  if (loading) return
  loading = true
  try {
    let src: string
    if (track.webdavId === LOCAL_SOURCE_ID) {
      const entry = useLocalStore.getState().get(track.id)
      if (!entry) return
      src = entry.url
    } else {
      const config = useLibraryStore.getState().configs.find((c) => c.id === track.webdavId)
      if (!config) return
      const blob = await fetchAudioBlob(config, track.path)
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      objectUrl = URL.createObjectURL(blob)
      src = objectUrl
    }
    const el = ensureAudio()
    el.src = src
    el.volume = usePlayerStore.getState().volume
    await el.play()
    usePlayerStore.setState({ currentTrack: track, isPlaying: true, currentTime: 0 })
    useCollectionStore.getState().recordPlay(track)
  } catch (e) {
    console.error('[audio] play error', e)
    usePlayerStore.getState().setIsPlaying(false)
  } finally {
    loading = false
  }
}

export function playSelection(tracks: MusicFile[], startIndex = 0): void {
  if (tracks.length === 0) return
  const s = usePlayerStore.getState()
  s.setQueue(tracks)
  s.setIndex(startIndex)
  void playTrack(tracks[startIndex])
}

export function toggle(): void {
  const el = audio
  if (!el) return
  if (el.paused) {
    void el.play().then(() => usePlayerStore.getState().setIsPlaying(true)).catch(() => {})
  } else {
    el.pause()
    usePlayerStore.getState().setIsPlaying(false)
  }
}

export function next(): void {
  const s = usePlayerStore.getState()
  const { queue, index, playMode } = s
  if (queue.length === 0) return
  if (playMode === 'single') {
    void playTrack(queue[index])
    return
  }
  const nextIndex = index + 1 >= queue.length ? 0 : index + 1
  s.setIndex(nextIndex)
  void playTrack(queue[nextIndex])
}

export function prev(): void {
  const s = usePlayerStore.getState()
  const { queue, index } = s
  if (queue.length === 0) return
  const prevIndex = index <= 0 ? queue.length - 1 : index - 1
  s.setIndex(prevIndex)
  void playTrack(queue[prevIndex])
}

export function seekTo(time: number): void {
  const el = audio
  if (el && Number.isFinite(el.duration)) {
    el.currentTime = time
    usePlayerStore.getState().seek(time)
  }
}

export function setVolume(v: number): void {
  usePlayerStore.getState().setVolume(v)
  if (audio) audio.volume = v
}
