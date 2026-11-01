import React, { useEffect, useState } from 'react';
import type { Report, ThemeMode } from '../../types';
import { getReports, subscribeToReports } from '../../services/storageService';
import { LanguageSelectorModal } from '../common/LanguageSelectorModal';
import { CitizenPortal } from './CitizenPortal';
import { CircleUserRound, Palette } from 'lucide-react';
import { GLOBAL_LANGUAGES } from '../../services/languageService';
import { useTranslation } from '../../services/i18n';

export const CitizenApp: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(() => (localStorage.getItem('civicvoice_theme') as ThemeMode) || 'theme-white-orange');
  const [currentLanguage, setCurrentLanguage] = useState(() => localStorage.getItem('civicvoice_lang') || 'en');
  const [showLanguageModal, setShowLanguageModal] = useState(true);
  const [isInitialOnboarding, setIsInitialOnboarding] = useState(true);
  const [startReportAfterLanguage, setStartReportAfterLanguage] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [reports, setReports] = useState<Report[]>(getReports);

  const loadReports = () => setReports(getReports());
  useEffect(() => subscribeToReports(loadReports), []);
  useEffect(() => {
    document.body.className = currentTheme;
    localStorage.setItem('civicvoice_theme', currentTheme);
  }, [currentTheme]);

  const selectLanguage = (language: string) => {
    if (isInitialOnboarding) setStartReportAfterLanguage(true);
    localStorage.setItem('civicvoice_lang', language);
    setCurrentLanguage(language);
    setShowLanguageModal(false);
    setIsInitialOnboarding(false);
  };
  const currentLanguageLabel = GLOBAL_LANGUAGES.find((item) => item.code === currentLanguage)?.nativeName || currentLanguage.toUpperCase();
  const changeTheme = () => {
    const themes: ThemeMode[] = ['theme-white-orange', 'theme-high-contrast', 'theme-soft-slate', 'theme-warm-sand'];
    const next = (themes.indexOf(currentTheme) + 1) % themes.length;
    setCurrentTheme(themes[next]);
  };

  return <div className="app-container citizen-app">
    <header className="citizen-compact-header">
      <button type="button" className="citizen-brand" onClick={() => setShowProfile(true)} aria-label="Open Civic Voice profile">
        <span className="civic-logo-icon" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 100 100" fill="none"><path d="M17 24 50 12 82 24v29c0 22-14 34-32 43C31 87 17 75 17 53V24Z" stroke="currentColor" strokeWidth="7" strokeLinejoin="round"/><path d="M56 30h21c6 0 9 4 9 9v23c0 6-3 9-9 9h-5v16L56 69h-5" stroke="currentColor" strokeWidth="7" strokeLinejoin="round"/></svg></span><strong>Civic Voice</strong>
      </button>
      <div className="citizen-header-actions">
        <span className="demo-badge">Demo</span>
        <button type="button" className="compact-icon-btn header-labeled-btn" onClick={changeTheme} aria-label="Change display colors"><Palette size={18} /><span>Colors</span></button>
        <button type="button" className="compact-icon-btn compact-lang-btn header-labeled-btn" onClick={() => { setIsInitialOnboarding(false); setShowLanguageModal(true); }} aria-label={`Change language, currently ${currentLanguageLabel}`}><span>{currentLanguageLabel}</span></button>
        <button type="button" className="compact-icon-btn header-labeled-btn" onClick={() => setShowProfile(true)} aria-label="Open profile"><CircleUserRound size={18} /><span>Profile</span></button>
      </div>
    </header>
    <main className="main-content" role="main">
      <CitizenPortal key={startReportAfterLanguage ? 'language-selected-report' : 'citizen-home'} reports={reports} currentLanguage={currentLanguage} onReportsUpdated={loadReports} initialEntry={startReportAfterLanguage} />
    </main>
    {showLanguageModal && <LanguageSelectorModal currentLanguage={currentLanguage} onSelectLanguage={selectLanguage} onClose={() => setShowLanguageModal(false)} isInitialOnboarding={isInitialOnboarding} />}
    {showProfile && <ProfileDialog currentLanguage={currentLanguage} onClose={() => setShowProfile(false)} />}
  </div>;
};

function ProfileDialog({ currentLanguage, onClose }: { currentLanguage: string; onClose: () => void }) {
  const { t } = useTranslation(currentLanguage);
  const stored = JSON.parse(localStorage.getItem('civicvoice_profile') || '{}');
  const [name, setName] = useState(stored.name || '');
  const [phone, setPhone] = useState(stored.phone || '');
  const [email, setEmail] = useState(stored.email || '');
  return <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="profile-title"><div className="modal-content">
    <h2 id="profile-title">{t('profileTitle')}</h2><p>{t('profileDesc')}</p>
    <label className="form-label">{t('profileName')}<input className="form-input" value={name} onChange={(event) => setName(event.target.value)} /></label>
    <label className="form-label">{t('profilePhone')}<input className="form-input" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
    <label className="form-label">{t('profileEmail')}<input className="form-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.5rem', marginTop: '1rem' }}><button className="btn btn-secondary" onClick={onClose}>{t('close')}</button><button className="btn btn-primary" onClick={() => { localStorage.setItem('civicvoice_profile', JSON.stringify({ name, phone, email })); onClose(); }}>{t('saveProfile')}</button></div>
  </div></div>;
}
