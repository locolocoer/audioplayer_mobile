import { useI18nStore, useT } from '../i18n'

export default function SettingsPage(): JSX.Element {
  const t = useT()
  const lang = useI18nStore((s) => s.lang)
  const setLang = useI18nStore((s) => s.setLang)

  return (
    <div className="page">
      <header className="page-header">
        <h2>{t('nav.settings')}</h2>
      </header>

      <section className="settings-group">
        <div className="settings-row">
          <span className="settings-label">{t('settings.language')}</span>
          <div className="segmented">
            <button
              className={`seg-btn${lang === 'zh' ? ' active' : ''}`}
              onClick={() => setLang('zh')}
            >
              {t('settings.language.zh')}
            </button>
            <button
              className={`seg-btn${lang === 'en' ? ' active' : ''}`}
              onClick={() => setLang('en')}
            >
              {t('settings.language.en')}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
