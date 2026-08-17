import { create } from 'zustand'
import type { MusicFile } from '../types'

export type PlayMode = 'sequential' | 'shuffle' | 'single'

interface PlayerState {
  currentTrack: MusicFile | null
  queue: MusicFile[]
  index: number
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  playMode: PlayMode
  setQueue: (tracks: MusicFile[]) => void
  setCurrentTrack: (track: MusicFile | null) => void
  setIndex: (index: number) => void
  setIsPlaying: (isPlaying: boolean) => void
  seek: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  setPlayMode: (mode: PlayMode) => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTrack: null,
  queue: [],
  index: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  playMode: 'sequential',
  setQueue: (queue) => set({ queue }),
  setCurrentTrack: (currentTrack) => set({ currentTrack }),
  setIndex: (index) => set({ index }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  seek: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  setPlayMode: (playMode) => set({ playMode })
}))
