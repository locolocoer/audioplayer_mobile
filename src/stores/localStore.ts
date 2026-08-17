import { create } from 'zustand'

export interface LocalFileEntry {
  blob: Blob
  url: string
}

interface LocalState {
  files: Map<number, LocalFileEntry>
  add: (id: number, blob: Blob) => void
  get: (id: number) => LocalFileEntry | undefined
  remove: (id: number) => void
}

export const useLocalStore = create<LocalState>((set, get) => ({
  files: new Map(),
  add: (id, blob) => {
    const url = URL.createObjectURL(blob)
    set((s) => {
      const next = new Map(s.files)
      next.set(id, { blob, url })
      return { files: next }
    })
  },
  get: (id) => get().files.get(id),
  remove: (id) => {
    const entry = get().files.get(id)
    if (entry) URL.revokeObjectURL(entry.url)
    set((s) => {
      const next = new Map(s.files)
      next.delete(id)
      return { files: next }
    })
  }
}))
