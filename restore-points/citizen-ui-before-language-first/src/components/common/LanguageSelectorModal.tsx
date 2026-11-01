import React, { useState } from 'react';
import { Search, Volume2, Globe, Check } from 'lucide-react';
import { GLOBAL_LANGUAGES, speakInstruction } from '../../services/languageService';
import type { LanguageOption } from '../../types';

interface LanguageSelectorModalProps {
  currentLanguage: string;
  onSelectLanguage: (langCode: string) => void;
  onClose?: () => void;
  isInitialOnboarding?: boolean;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  currentLanguage,
  onSelectLanguage,
  onClose,
  isInitialOnboarding = false,
}) => {
  const [search, setSearch] = useState('');
  const [playingCode, setPlayingCode] = useState<string | null>(null);

  const filtered = GLOBAL_LANGUAGES.filter((lang) => {
    const q = search.toLowerCase();
    return (
      lang.label.toLowerCase().includes(q) ||
      lang.nativeName.toLowerCase().includes(q) ||
      lang.region.toLowerCase().includes(q) ||
      lang.code.toLowerCase().includes(q)
    );
  });

  const handleHearAudio = (e: React.MouseEvent, lang: LanguageOption) => {
    e.stopPropagation();
    setPlayingCode(lang.code);
    speakInstruction(`${lang.nativeName}. ${lang.label}`, lang.code);
    setTimeout(() => setPlayingCode(null), 1500);
  };

  const handleSelect = (code: string) => {
    onSelectLanguage(code);
    if (onClose) onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Select Language">
      <div className="modal-content" style={{ maxWidth: '820px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'var(--brand-light)',
              color: 'var(--brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem',
            }}
          >
            <Globe size={28} />
          </div>

          <h2>Choose Your Preferred Language</h2>
          <p style={{ marginTop: '0.25rem', fontSize: '1rem' }}>
            {isInitialOnboarding
              ? 'Select the language you want to speak or read in. We support over 45 languages with voice assistance.'
              : 'Change your reporting and portal language anytime.'}
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.75rem', fontSize: '1.05rem', borderRadius: 'var(--radius-full)' }}
            placeholder="Search by language name, native script, or region..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* Language Grid */}
        <div className="lang-modal-grid">
          {filtered.map((lang) => {
            const isSelected = currentLanguage === lang.code;
            return (
              <div
                key={lang.code}
                className={`lang-card-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(lang.code)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleSelect(lang.code)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="lang-nativeName">{lang.nativeName}</span>
                  <button
                    type="button"
                    className="btn-speaker"
                    style={{ width: '30px', height: '30px' }}
                    onClick={(e) => handleHearAudio(e, lang)}
                    title={`Hear pronunciation of ${lang.label}`}
                    aria-label={`Hear ${lang.label}`}
                  >
                    <Volume2 size={15} color={playingCode === lang.code ? 'var(--brand-primary)' : 'currentColor'} />
                  </button>
                </div>

                <span className="lang-english-name">{lang.label}</span>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {lang.region}
                </span>

                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      color: 'var(--brand-primary)',
                    }}
                  >
                    <Check size={18} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {filtered.length} of {GLOBAL_LANGUAGES.length} supported languages.
          </span>

          {!isInitialOnboarding && onClose && (
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          )}

          {isInitialOnboarding && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleSelect(currentLanguage || 'en')}
            >
              <span>Continue in {GLOBAL_LANGUAGES.find((l) => l.code === (currentLanguage || 'en'))?.label || 'English'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
