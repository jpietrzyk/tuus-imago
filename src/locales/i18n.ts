import enTranslations from './en.json';
import plTranslations from './pl.json';
import type { Translations, Language } from './types';

// Current language (can be changed to support language switching in the future)
const currentLanguage: Language = 'pl';

// Translation files
const translations: Record<Language, Translations> = {
  en: enTranslations as Translations,
  pl: plTranslations as Translations,
};

// Get the current translations
export function getTranslations(): Translations {
  return translations[currentLanguage];
}

// Get the current language
export function getCurrentLanguage(): Language {
  return currentLanguage;
}

// Set the current language (for future use when implementing language switching)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function setLanguage(_language: Language): void {
}

// Helper function to get a nested translation by path
// Usage: t('landing.hero.title') -> "Ozdób swoje zdjęcie"
export function t(path: string, params?: Record<string, string | number>): string {
  const translations = getTranslations();
  const keys = path.split('.');
  let result: unknown = translations;

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      console.warn(`Translation key not found: ${path}`);
      return path;
    }
  }

  if (typeof result !== 'string') {
    console.warn(`Translation value is not a string: ${path}`);
    return path;
  }

  // Replace placeholders in the format {param}
  if (params) {
    return result.replace(/\{(\w+)\}/g, (match, param) => {
      return params[param]?.toString() || match;
    });
  }

  return result;
}
