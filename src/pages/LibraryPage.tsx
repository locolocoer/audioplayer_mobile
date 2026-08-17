import { useEffect, useMemo, useRef, useState } from 'react'
import { useT } from '../i18n'
import { useLibraryStore } from '../stores/libraryStore'
import { useCollectionStore } from '../stores/collectionStore'
import { playSelection } from '../engine/audio'
import { importLocalFiles } from '../backend/local'
import ConfigModal from '../components/ConfigModal'
import PlaylistPicker from '../components/PlaylistPicker'
import type { MusicFile } from '../types'

type Filter = 'all' | 'favorites' | 'recent'

const FILTERS: { key: Filter; labelKey: string }[] = [
  { key: 'all', labelKey: 'library.all' },
  { key: 'favorites', labelKey: 'nav.favorites' },
  { key: 'recent', labelKey: 'nav.recent' }
]

function formatDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '--:--'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function LibraryPage(): JSX.Element {
  const t = useT()
  const configs = useLibraryStore((s) => s.configs)
  const tracks = useLibraryStore((s) => s.tracks)
  const scanning = useLibraryStore((s) => s.scanning)
  const loadFromStorage = useLibraryStore((s) => s.loadFromStorage)
  const saveConfig = useLibraryStore((s) => s.saveConfig)
  const deleteConfig = useLibraryStore((s) => s.deleteConfig)
  const scan = useLibraryStore((s) => s.scan)
  const favorites = useCollectionStore((s) => s.favorites)
  const recent = useCollectionStore((s) => s.recent)
  const toggleFavorite = useCollectionStore((s) => s.toggleFavorite)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [pickerTrack, setPickerTrack] = useState<MusicFile | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  const favIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites])

  const displayed = filter === 'favorites' ? favorites : filter === 'recent' ? recent : tracks

  const renderRow = (tr: MusicFile): JSX.Element => (
    <li key={tr.webdavId + ':' + tr.path} className="track-row" onClick={() => playSelection(displayed, displayed.indexOf(tr))}>
      <div className="track-info">
        <span className="track-title">{tr.title}</span>
        <span className="track-sub">{tr.artist || t('common.unknown')}</span>
      </div>
      <span className="track-duration">{formatDuration(tr.duration)}</span>
      <button
        className={`icon-btn${favIds.has(tr.id) ? ' active' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          toggleFavorite(tr)
        }}
        title={t('list.favorite')}
      >
        {favIds.has(tr.id) ? '♥' : '♡'}
      </button>
      <button
        className="icon-btn"
        onClick={(e) => {
          e.stopPropagation()
          setPickerTrack(tr)
        }}
        title={t('library.addToPlaylist')}
      >
        ＋
      </button>
    </li>
  )

  return (
    <div className="page">
      <header className="page-header">
        <h2>{t('nav.library')}</h2>
        <div className="header-actions">
          <button className="btn btn-sm" onClick={() => fileInputRef.current?.click()}>{t('library.importLocal')}</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>{t('settings.addServer')}</button>
        </div>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files) importLocalFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {configs.length > 0 && (
        <section className="config-list">
          {configs.map((c) => (
            <div key={c.id} className="config-item">
              <div className="config-info">
                <strong>{c.sourceType === 'local' ? '📁 ' : '🌐 '}{c.name || c.url}</strong>
              </div>
              <div className="config-actions">
                <button className="btn btn-sm" onClick={() => void scan(c)} disabled={scanning}>{t('settings.scan')}</button>
                <button className="btn btn-sm btn-danger" onClick={() => deleteConfig(c.id)}>{t('common.delete')}</button>
              </div>
            </div>
          ))}
        </section>
      )}

      {scanning && <div className="scan-hint">{t('common.loading')}</div>}

      <div className="segmented filter-bar">
        {FILTERS.map((f) => (
          <button key={f.key} className={`seg-btn${filter === f.key ? ' active' : ''}`} onClick={() => setFilter(f.key)}>
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {configs.length === 0 && tracks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">♪</div>
          <p>{t('settings.noSources')}</p>
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>{t('library.importLocal')}</button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>{t('settings.addFirstServer')}</button>
        </div>
      ) : displayed.length === 0 && !scanning ? (
        <div className="empty-state">
          <p>{t('list.empty')}</p>
        </div>
      ) : (
        <ul className="track-list">{displayed.map(renderRow)}</ul>
      )}

      {showModal && <ConfigModal initial={null} onClose={() => setShowModal(false)} onSave={saveConfig} />}
      {pickerTrack && <PlaylistPicker track={pickerTrack} onClose={() => setPickerTrack(null)} />}
    </div>
  )
}
