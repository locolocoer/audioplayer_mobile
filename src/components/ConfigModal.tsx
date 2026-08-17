import { useState } from 'react'
import { useT } from '../i18n'
import { testWebDAV } from '../backend/webdav'
import type { WebDAVConfig } from '../types'

interface Props {
  initial: WebDAVConfig | null
  onClose: () => void
  onSave: (config: WebDAVConfig) => Promise<void>
}

const EMPTY: WebDAVConfig = {
  id: '',
  name: '',
  url: '',
  username: '',
  password: '',
  port: 443,
  enabled: true,
  createdAt: new Date().toISOString(),
  sourceType: 'webdav'
}

export default function ConfigModal({ initial, onClose, onSave }: Props): JSX.Element {
  const t = useT()
  const [form, setForm] = useState<WebDAVConfig>(initial ?? EMPTY)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  const patch = (p: Partial<WebDAVConfig>): void => setForm((f) => ({ ...f, ...p }))

  const handleTest = async (): Promise<void> => {
    setTesting(true)
    setTestResult(null)
    const r = await testWebDAV(form)
    setTestResult({ ok: r.ok, message: r.ok ? t('settings.testOk') : (r.error || t('settings.testFailed')) })
    setTesting(false)
  }

  const handleSave = async (): Promise<void> => {
    await onSave({ ...form, id: form.id || 'webdav_' + Date.now().toString() })
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{t('settings.editServer')}</h3>
        <div className="form-group">
          <label>{t('settings.name')}</label>
          <input type="text" value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder={t('settings.serverNamePlaceholder')} />
        </div>
        <div className="form-group">
          <label>{t('settings.address')}</label>
          <input type="text" value={form.url} onChange={(e) => patch({ url: e.target.value })} placeholder="https://dav.example.com/dav" />
        </div>
        <div className="form-group">
          <label>{t('settings.port')}</label>
          <input type="number" value={form.port} onChange={(e) => patch({ port: parseInt(e.target.value) || 443 })} />
        </div>
        <div className="form-group">
          <label>{t('settings.username')}</label>
          <input type="text" value={form.username} onChange={(e) => patch({ username: e.target.value })} />
        </div>
        <div className="form-group">
          <label>{t('settings.password')}</label>
          <input type="password" value={form.password} onChange={(e) => patch({ password: e.target.value })} />
        </div>
        {testResult && <div className={`test-result ${testResult.ok ? 'success' : 'error'}`}>{testResult.message}</div>}
        <div className="modal-actions">
          <button className="btn" onClick={handleTest} disabled={testing}>{testing ? t('settings.testing') : t('settings.testConnection')}</button>
          <button className="btn" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn btn-primary" onClick={handleSave}>{t('common.save')}</button>
        </div>
      </div>
    </div>
  )
}
