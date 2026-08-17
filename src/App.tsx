import { useState } from 'react'
import { useT } from './i18n'
import { usePlayerStore } from './stores/playerStore'
import { toggle } from './engine/audio'
import LibraryPage from './pages/LibraryPage'
import PlayerPage from './pages/PlayerPage'
import PlaylistPage from './pages/PlaylistPage'
import SettingsPage from './pages/SettingsPage'

type Tab = 'library' | 'player' | 'playlists' | 'settings'

const ICONS: Record<Tab, JSX.Element> = {
  library: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
  ),
  player: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  playlists: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M3 6h12v2H3zm0 5h12v2H3zm0 5h8v2H3zm14-1.5 4 2.5v-5z" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.476.476 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  )
}

export default function App(): JSX.Element {
  const t = useT()
  const [tab, setTab] = useState<Tab>('library')
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const isPlaying = usePlayerStore((s) => s.isPlaying)

  const TABS: { key: Tab; label: string }[] = [
    { key: 'library', label: t('nav.library') },
    { key: 'player', label: t('nav.playing') },
    { key: 'playlists', label: t('nav.playlist') },
    { key: 'settings', label: t('nav.settings') }
  ]

  return (
    <div className="app">
      <main className="app-content">
        {tab === 'library' && <LibraryPage />}
        {tab === 'player' && <PlayerPage />}
        {tab === 'playlists' && <PlaylistPage />}
        {tab === 'settings' && <SettingsPage />}
      </main>

      {currentTrack && (
        <button className="mini-player" onClick={() => setTab('player')}>
          <div className="mini-art">♪</div>
          <div className="mini-info">
            <span className="mini-title">{currentTrack.title}</span>
            <span className="mini-sub">{currentTrack.artist || t('common.unknown')}</span>
          </div>
          <button
            className="mini-btn"
            onClick={(e) => {
              e.stopPropagation()
              toggle()
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        </button>
      )}

      <nav className="tab-bar">
        {TABS.map((tb) => (
          <button
            key={tb.key}
            className={`tab-item${tab === tb.key ? ' active' : ''}`}
            onClick={() => setTab(tb.key)}
          >
            {ICONS[tb.key]}
            <span>{tb.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
