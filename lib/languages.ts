export const languages = {
  en: { flag: '🇬🇧', name: 'English' },
  fr: { flag: '🇫🇷', name: 'Français' },
  de: { flag: '🇩🇪', name: 'Deutsch' },
  es: { flag: '🇪🇸', name: 'Español' },
  it: { flag: '🇮🇹', name: 'Italiano' },
  pl: { flag: '🇵🇱', name: 'Polski' },
  ru: { flag: '🇷🇺', name: 'Русский' },
  pt: { flag: '🇵🇹', name: 'Português' },
  zh: { flag: '🇨🇳', name: '中文' }
} as const;

export type SupportedLocale = keyof typeof languages; 