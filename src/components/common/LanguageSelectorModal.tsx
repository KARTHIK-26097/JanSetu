import React, { useState } from 'react';
import { Volume2, Globe } from 'lucide-react';
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
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage || 'en');
  const selected = GLOBAL_LANGUAGES.find((item) => item.code === selectedLanguage) || GLOBAL_LANGUAGES[0];

  const hearLanguage = () => {
    const language = selected as LanguageOption;
    speakInstruction(`${language.nativeName}. ${language.label}`, language.code);
  };

  return (
    <div className="modal-overlay language-first-overlay" role="dialog" aria-modal="true" aria-labelledby="language-title">
      <section className="modal-content language-first-card">
        <div className="language-first-icon" aria-hidden="true"><Globe size={30} /></div>
        <h1 id="language-title">Choose your language</h1>
        <p>Select the language you speak.</p>

        <label className="sr-only" htmlFor="language-choice">Language</label>
        <select
          id="language-choice"
          className="form-select language-first-select"
          value={selectedLanguage}
          onChange={(event) => setSelectedLanguage(event.target.value)}
          autoFocus
        >
          {GLOBAL_LANGUAGES.map((language) => (
            <option key={language.code} value={language.code}>
              {language.nativeName} — {language.label}
            </option>
          ))}
        </select>

        <div className="language-first-native" lang={selected.bcp47}>{selected.nativeName}</div>
        <div className="language-first-actions">
          <button type="button" className="btn btn-secondary" onClick={hearLanguage} aria-label={`Hear ${selected.label}`}>
            <Volume2 size={20} /><span>Hear</span>
          </button>
          {!isInitialOnboarding && onClose && <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>}
          <button type="button" className="btn btn-primary" onClick={() => onSelectLanguage(selectedLanguage)}>
            Continue <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>
    </div>
  );
};
