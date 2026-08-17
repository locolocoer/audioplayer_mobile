import { LOCAL_SOURCE_ID, type MusicFile } from '../types'
import { useLibraryStore } from '../stores/libraryStore'
import { useLocalStore } from '../stores/localStore'

const AUDIO_EXT = new Set(['.mp3', '.flac', '.wav', '.ogg', '.aac', '.m4a', '.wma'])

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function importLocalFiles(fileList: FileList | File[]): number {
  const files = Array.from(fileList)
  let imported = 0
  for (const file of files) {
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    if (!AUDIO_EXT.has(ext)) continue
    const id = hashStr('local:' + file.name + ':' + file.size + ':' + (file.lastModified || 0))
    const track: MusicFile = {
      id,
      path: file.name,
      filename: file.name,
      size: file.size,
      mtime: String(file.lastModified || ''),
      title: file.name.replace(/\.[^.]+$/, ''),
      artist: '',
      album: '',
      duration: 0,
      webdavId: LOCAL_SOURCE_ID,
      scannedAt: new Date().toISOString(),
      favorite: 0
    }
    useLocalStore.getState().add(id, file)
    const lib = useLibraryStore.getState()
    if (!lib.tracks.some((t) => t.id === id)) {
      lib.addTracks([track])
      imported++
    }
  }
  return imported
}
