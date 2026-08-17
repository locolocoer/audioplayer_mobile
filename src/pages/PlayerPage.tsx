import { useEffect, useRef, useState } from 'react'
import { useT } from '../i18n'
import { usePlayerStore, type PlayMode } from '../stores/playerStore'
import { toggle, next, prev, seekTo } from '../engine/audio'
import { searchLrc } from '../backend/lrc'
import { fetchCoverUrl } from '../backend/cover'
import { parseLrc, activeLyricIndex } from '../utils/lrc'

function fmt(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function PlayerPage(): JSX.Element {
  const t = useT()
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const playMode = usePlayerStore((s) => s.playMode)
  const setPlayMode = usePlayerStore((s) => s.setPlayMode)

  const [view, setView] = useState<'cover' | 'lyrics'>('cover')
  const [lyrics, setLyrics] = useState<{ time: number; text: string }[]>([])
  const [lrcLoading, setLrcLoading] = useState(false)
  const [lrcFailed, setLrcFailed] = useState(false)
  const [coverUrl, setCoverUrl] = useState('')
  const lyricsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!currentTrack) {
      setLyrics([])
      return
    }
    let cancelled = false
    setLrcLoading(true)
    setLrcFailed(false)
    searchLrc({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.album,
      duration: currentTrack.duration
    }).then((r) => {
      if (cancelled) return
      setLrcLoading(false)
      if (r.ok) {
        setLyrics(parseLrc(r.lrc))
      } else {
        setLyrics([])
        setLrcFailed(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [currentTrack])

  useEffect(() => {
    if (!currentTrack) {
      setCoverUrl('')
      return
    }
    let cancelled = false
    setCoverUrl('')
    fetchCoverUrl(currentTrack).then((url) => {
      if (!cancelled && url) setCoverUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [currentTrack])

  const activeIndex = activeLyricIndex(lyrics, currentTime)

  useEffect(() => {
    if (view !== 'lyrics') return
    const el = lyricsRef.current?.querySelector('.lyric-line.active')
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeIndex, view])

  const cycleMode = (): void => {
    const order: PlayMode[] = ['sequential', 'shuffle', 'single']
    const nextMode = order[(order.indexOf(playMode) + 1) % order.length]
    setPlayMode(nextMode)
  }

  return (
    <div className="page player-page">
      <header className="page-header">
        <h2>{t('nav.playing')}</h2>
        <div className="segmented">
          <button className={`seg-btn${view === 'cover' ? ' active' : ''}`} onClick={() => setView('cover')}>{t('playerPage.cover')}</button>
          <button className={`seg-btn${view === 'lyrics' ? ' active' : ''}`} onClick={() => setView('lyrics')}>{t('playerPage.lyrics')}</button>
        </div>
      </header>

      {currentTrack ? (
        <div className="np-body">
          {view === 'cover' ? (
            <div className="now-playing">
              <div className="artwork-placeholder">{coverUrl ? <img src={coverUrl} alt="" /> : '♪'}</div>
              <h3 className="np-title">{currentTrack.title}</h3>
              <p className="np-artist">{currentTrack.artist || t('common.unknown')}</p>
            </div>
          ) : (
            <div className="lyrics-view" ref={lyricsRef}>
              {lrcLoading ? (
                <p className="muted">{t('common.loading')}</p>
              ) : lyrics.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎵</div>
                  <p>{lrcFailed ? t('playerPage.notFound') : t('lyrics.none')}</p>
                </div>
              ) : (
                lyrics.map((line, i) => (
                  <p key={i} className={`lyric-line${i === activeIndex ? ' active' : ''}`}>
                    {line.text}
                  </p>
                ))
              )}
            </div>
          )}

          <div className="seek-row">
            <span className="seek-time">{fmt(currentTime)}</span>
            <input
              className="seek-bar"
              type="range"
              min={0}
              max={duration || 0}
              step={0.5}
              value={Math.min(currentTime, duration || 0)}
              onChange={(e) => seekTo(parseFloat(e.target.value))}
            />
            <span className="seek-time">{fmt(duration)}</span>
          </div>

          <div className="controls">
            <button className="ctrl-btn" onClick={cycleMode}>
              {playMode === 'sequential' ? '↻' : playMode === 'single' ? '🔂' : '🔀'}
            </button>
            <button className="ctrl-btn big" onClick={() => prev()}>⏮</button>
            <button className="ctrl-btn big primary" onClick={() => toggle()}>{isPlaying ? '⏸' : '▶'}</button>
            <button className="ctrl-btn big" onClick={() => next()}>⏭</button>
            <button className="ctrl-btn">⋮</button>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">♪</div>
          <p>{t('playerPage.noTrack')}</p>
        </div>
      )}
    </div>
  )
}
