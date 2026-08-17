import { useState } from 'react'
import { useT } from '../i18n'
import { useCollectionStore } from '../stores/collectionStore'
import type { MusicFile } from '../types'

interface Props {
  track: MusicFile
  onClose: () => void
}

export default function PlaylistPicker({ track, onClose }: Props): JSX.Element {
  const t = useT()
  const playlists = useCollectionStore((s) => s.playlists)
  const addToPlaylist = useCollectionStore((s) => s.addToPlaylist)
  const createPlaylist = useCollectionStore((s) => s.createPlaylist)
  const [newName, setNewName] = useState('')

  const handlePick = (id: number): void => {
    addToPlaylist(id, track)
    onClose()
  }

  const handleCreate = (): void => {
    const p = createPlaylist(newName.trim())
    addToPlaylist(p.id, track)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{t('library.addToPlaylist')}</h3>
        {playlists.length === 0 && <p className="muted">{t('playlist.empty')}</p>}
        <ul className="picker-list">
          {playlists.map((p) => (
            <li key={p.id}>
              <button className="picker-item" onClick={() => handlePick(p.id)}>{p.name}</button>
            </li>
          ))}
        </ul>
        <div className="form-group" style={{ marginTop: 12 }}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('playlist.newNamePlaceholder')}
          />
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn btn-primary" onClick={handleCreate}>{t('playlist.create')}</button>
        </div>
      </div>
    </div>
  )
}
