/**
 * Civic Voice i18n Service
 *
 * Provides a `useTranslation(lang)` hook and `t(key, vars?)` helper that returns
 * translated strings for the citizen-facing UI.
 *
 * ## Fully-translated languages (8)
 *   en · es · hi · fr · ar · bn · zh · de
 *
 * ## Fallback behavior
 *   All other languages fall back to English for untranslated keys. Voice
 *   dictation and report-content translation remain available for all 45+
 *   languages via the existing `languageService.ts` TTS / translate pipeline.
 *
 * ## Adding a real translation provider
 *   Replace the static import map below with async calls to your provider
 *   (e.g., Google Cloud Translation, DeepL, Azure Cognitive Services).
 *   Set the VITE_TRANSLATION_API_KEY environment variable and call the REST
 *   endpoint inside a `useEffect` to fetch strings at runtime.
 */

import { en } from './translations/en';
import { es } from './translations/es';
import { hi } from './translations/hi';
import { fr } from './translations/fr';
import { ar } from './translations/ar';
import { bn } from './translations/bn';
import { zh } from './translations/zh';
import { de } from './translations/de';
import { te } from './translations/te';
import { GLOBAL_LANGUAGES } from './languageService';

/** Set of language codes that have full UI translations */
export const FULLY_TRANSLATED_LANGS = new Set(['en', 'es', 'hi', 'fr', 'ar', 'bn', 'zh', 'de']);

/** All translation dictionaries keyed by language code */
const DICTIONARIES: Record<string, Record<string, string>> = {
  en,
  es,
  hi,
  fr,
  ar,
  bn,
  zh,
  de,
  te,
};

/**
 * Translate a key for the given language code, with variable substitution.
 *
 * @example
 *   t('stepResponseTarget', 'es', { hours: '24' })
 *   // → 'Tiempo de respuesta estimado dentro de 24 horas'
 */
export function t(
  key: string,
  langCode: string,
  vars?: Record<string, string | number>
): string {
  const dict = DICTIONARIES[langCode] || DICTIONARIES['en'];
  let text = dict[key] ?? DICTIONARIES['en'][key] ?? key;

  if (vars) {
    Object.entries(vars).forEach(([varKey, value]) => {
      text = text.replaceAll(`{${varKey}}`, String(value));
    });
  }

  return text;
}

/**
 * Returns true if the given language code has a full UI translation.
 * Partial support means voice dictation + report translation only.
 */
export function isFullyTranslated(langCode: string): boolean {
  return FULLY_TRANSLATED_LANGS.has(langCode);
}

/**
 * Returns the text direction for the given language code.
 * Used to set `dir` on citizen-facing containers.
 */
export function getTextDirection(langCode: string): 'ltr' | 'rtl' {
  const lang = GLOBAL_LANGUAGES.find((l) => l.code === langCode);
  return lang?.direction === 'rtl' ? 'rtl' : 'ltr';
}

/**
 * React hook that provides a `t()` function bound to the current language.
 *
 * @example
 *   const { t, isRTL, isFullTranslation } = useTranslation(currentLanguage);
 *   <button>{t('submitReport')}</button>
 */
export function useTranslation(langCode: string) {
  return {
    /** Translate a key with optional variable substitution */
    t: (key: string, vars?: Record<string, string | number>) =>
      t(key, langCode, vars),
    /** Whether the current language uses right-to-left text */
    isRTL: getTextDirection(langCode) === 'rtl',
    /** Whether the current language has a full UI translation */
    isFullTranslation: isFullyTranslated(langCode),
    /** The active language code */
    langCode,
  };
}

export default { t, isFullyTranslated, getTextDirection, useTranslation, FULLY_TRANSLATED_LANGS };
