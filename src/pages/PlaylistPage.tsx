import { useState } from 'react'
import { useT } from '../i18n'
import { useCollectionStore } from '../stores/collectionStore'
import { useLibraryStore } from '../stores/libraryStore'
import { playSelection } from '../engine/audio'
import type { MusicFile, Playlist } from '../types'

export default function PlaylistPage(): JSX.Element {
  const t = useT()
  const playlists = useCollectionStore((s) => s.playlists)
  const createPlaylist = useCollectionStore((s) => s.createPlaylist)
  const renamePlaylist = useCollectionStore((s) => s.renamePlaylist)
  const deletePlaylist = useCollectionStore((s) => s.deletePlaylist)
  const removeFromPlaylist = useCollectionStore((s) => s.removeFromPlaylist)
  const tracks = useLibraryStore((s) => s.tracks)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')

  const trackMap = new Map(tracks.map((tr) => [tr.id, tr]))

  const resolve = (p: Playlist): MusicFile[] => {
    let ids: number[] = []
    try { ids = JSON.parse(p.trackIds) as number[] } catch { /* ignore */ }
    return ids.map((id) => trackMap.get(id)).filter((x): x is MusicFile => !!x)
  }

  const active = playlists.find((p) => p.id === activeId) ?? null

  if (active) {
    const list = resolve(active)
    return (
      <div className="page">
        <header className="page-header">
          <button className="btn btn-sm" onClick={() => { setActiveId(null); setEditing(false) }}>‹ {t('nav.playlist')}</button>
          <button
            className="btn btn-sm"
            onClick={() => {
              if (editing) {
                renamePlaylist(active.id, editName.trim() || active.name)
                setEditing(false)
              } else {
                setEditName(active.name)
                setEditing(true)
              }
            }}
          >
            {editing ? t('common.save') : t('playlist.rename')}
          </button>
        </header>

        {editing ? (
          <input className="playlist-name-input" type="text" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
        ) : (
          <h2 className="playlist-title">{active.name}</h2>
        )}

        {list.length === 0 ? (
          <div className="empty-state"><p>{t('list.empty')}</p></div>
        ) : (
          <ul className="track-list">
            {list.map((tr) => (
              <li key={tr.id} className="track-row" onClick={() => playSelection(list, list.indexOf(tr))}>
                <div className="track-info">
                  <span className="track-title">{tr.title}</span>
                  <span className="track-sub">{tr.artist || t('common.unknown')}</span>
                </div>
                <button
                  className="icon-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFromPlaylist(active.id, tr.id)
                  }}
                  title={t('queue.remove')}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page-header">
        <h2>{t('nav.playlist')}</h2>
      </header>

      <div className="playlist-create">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t('playlist.newNamePlaceholder')}
        />
        <button className="btn btn-primary" onClick={() => { createPlaylist(newName.trim()); setNewName('') }}>
          {t('playlist.create')}
        </button>
      </div>

      {playlists.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">♫</div>
          <p>{t('playlist.empty')}</p>
        </div>
      ) : (
        <ul className="picker-list">
          {playlists.map((p) => (
            <li key={p.id} className="playlist-row">
              <button className="picker-item" onClick={() => setActiveId(p.id)}>
                <span className="pl-name">{p.name}</span>
                <span className="pl-count">{t('playlist.songCount', { count: resolve(p).length })}</span>
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => deletePlaylist(p.id)}>{t('common.delete')}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
