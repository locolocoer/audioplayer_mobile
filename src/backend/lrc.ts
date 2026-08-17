import { t2s } from 'chinese-s2t'

export interface LrcQuery {
  title: string
  artist: string
  album: string
  duration: number
}

export interface LrcResult {
  ok: boolean
  lrc: string
  error?: string
}

export async function searchLrc(track: LrcQuery): Promise<LrcResult> {
  try {
    const params = new URLSearchParams()
    if (track.title) params.set('track_name', track.title)
    if (track.artist) params.set('artist_name', track.artist)
    if (track.album) params.set('album_name', track.album)
    const url = `https://lrclib.net/api/search?${params.toString()}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FeiYuMusic-Mobile/0.1.0 (https://github.com/locolocoer/audioPlayer)' }
    })
    if (!res.ok) return { ok: false, lrc: '', error: `HTTP ${res.status}` }
    const data = (await res.json()) as Array<{ syncedLyrics?: string; plainLyrics?: string }>
    if (Array.isArray(data) && data.length > 0) {
      const best = data[0]
      const lrc = t2s(best.syncedLyrics || best.plainLyrics || '')
      if (lrc) return { ok: true, lrc }
    }
    return { ok: false, lrc: '', error: 'not_found' }
  } catch (e) {
    return { ok: false, lrc: '', error: e instanceof Error ? e.message : String(e) }
  }
}
