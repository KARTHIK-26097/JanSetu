import React from 'react';
import {
  Globe,
  Palette,
  Volume2,
  CircleUserRound,
  Shield,
  LogOut,
  RotateCcw,
} from 'lucide-react';
import type { AppView, ThemeMode, UserAccount } from '../../types';
import { GLOBAL_LANGUAGES, speakInstruction } from '../../services/languageService';
import { resetToDemoData } from '../../services/storageService';

interface HeaderProps {
  currentView: AppView;
  currentLanguage: string;
  onOpenLanguageModal: () => void;
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  authenticatedUser: UserAccount | null;
  onLogout: () => void;
  criticalCount: number;
  onProfileOpen: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  currentLanguage,
  onOpenLanguageModal,
  currentTheme,
  onThemeChange,
  authenticatedUser,
  onLogout,
  criticalCount,
  onProfileOpen,
}) => {
  const currentLangObj = GLOBAL_LANGUAGES.find((l) => l.code === currentLanguage) || GLOBAL_LANGUAGES[0];

  const handleSpeakTagline = () => {
    speakInstruction('Civic Voice. Speak your issue, we will handle the rest.', currentLanguage);
  };

  const handleReset = () => {
    if (
      window.confirm(
        'Reset all reports and demo records to initial state? This restores the realistic demo cases.'
      )
    ) {
      resetToDemoData();
    }
  };

  return (
    <header className="civic-header" role="banner">
      <div className="civic-header-inner">
        {/* Civic Voice Brand Logo with Speech Bubble + Reassuring Checkmark */}
        <button type="button" className="civic-logo-group" onClick={onProfileOpen} title={currentView === 'handler' ? 'Civic Voice Operations' : 'Open your Civic Voice profile'}>
          <div className="civic-logo-icon" aria-hidden="true">
            <svg width="34" height="34" viewBox="0 0 100 100" fill="none" aria-hidden="true">
              <path d="M17 24 50 12 82 24v29c0 22-14 34-32 43C31 87 17 75 17 53V24Z" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" />
              <path d="M56 30h21c6 0 9 4 9 9v23c0 6-3 9-9 9h-5v16L56 69h-5" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="civic-logo-title">
              <span>Civic Voice</span>
              <span
                className="btn-speaker"
                style={{ width: '26px', height: '26px', marginLeft: '0.25rem' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeakTagline();
                }}
                title="Hear audio tagline"
                aria-label="Listen to tagline"
              >
                <Volume2 size={13} />
              </span>
            </div>
            <div className="civic-logo-tagline">
              “Speak your issue, we will handle the rest.”
            </div>
          </div>
        </button>

        {/* This header belongs only to the separate Handler Operations app. */}
        <nav className="role-switcher-container" aria-label="Portal Navigation">
          {currentView === 'handler' && <button type="button" className="role-switch-btn active" aria-current="page"><Shield size={16} /><span>Handler Operations</span>{authenticatedUser && criticalCount > 0 && <span className="critical-count">{criticalCount}</span>}</button>}
        </nav>

        {/* Controls: Language, Theme Selector, Reset & Auth */}
        <div className="header-actions">
          {currentView !== 'handler' && !authenticatedUser && <button type="button" className="header-btn" onClick={onProfileOpen} aria-label="Open your profile"><CircleUserRound size={17} /> <span>My Profile</span></button>}
          {/* Language Selector Button */}
          {currentView !== 'handler' && <button
            type="button"
            className="header-btn"
            onClick={onOpenLanguageModal}
            id="btn-open-language"
            title="Choose Language (45+ Available)"
          >
            <Globe size={16} color="var(--brand-primary)" />
            <span>{currentLangObj.nativeName}</span>
          </button>}

          {/* Theme Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Palette size={15} color="var(--text-muted)" aria-hidden="true" />
            <select
              aria-label="Select Color Theme"
              className="form-select"
              style={{
                padding: '0.45rem 0.75rem',
                fontSize: '0.825rem',
                width: 'auto',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              value={currentTheme}
              onChange={(e) => onThemeChange(e.target.value as ThemeMode)}
              id="select-theme"
            >
              <option value="theme-white-orange">White & Orange (Default)</option>
              <option value="theme-high-contrast">High Contrast Dark</option>
              <option value="theme-soft-slate">Soft Slate & Blue</option>
              <option value="theme-warm-sand">Warm Sand & Terracotta</option>
            </select>
          </div>

          {/* Handler authenticated status / logout */}
          {authenticatedUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
                {authenticatedUser.name} ({authenticatedUser.role.toUpperCase()})
              </span>
              <button
                type="button"
                className="header-btn"
                onClick={onLogout}
                title="Log out from operations portal"
                id="btn-logout"
              >
                <LogOut size={14} />
                <span>Log out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="header-btn"
              onClick={handleReset}
              title="Reset Demo Records"
              style={{ fontSize: '0.75rem' }}
            >
              <RotateCcw size={13} />
              <span>Reset Demo</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
