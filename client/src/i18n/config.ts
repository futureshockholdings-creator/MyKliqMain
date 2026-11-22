import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { notificationPhrases } from './notificationCatalog';

// Translation resources
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import pt from './locales/pt.json';
import it from './locales/it.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import ar from './locales/ar.json';

export const supportedLanguages = ['en', 'es', 'fr', 'de', 'pt', 'it', 'zh', 'ja', 'ko', 'ar'] as const;
const interfaceCatalogs = import.meta.glob<{ default: Record<string, string> }>('./interface/*.json');

// Load just the selected language and English fallback, rather than putting
// every translated policy and interface string in the startup JavaScript.
const bundledInterfaceBackend = {
  type: 'backend' as const,
  read(language: string, namespace: string, callback: (error: Error | null, data?: Record<string, string>) => void) {
    const code = language.split('-')[0];
    const load = namespace === 'interface' ? interfaceCatalogs[`./interface/${code}.json`] : undefined;
    if (!load) {
      callback(new Error(`Unavailable bundled locale: ${code}/${namespace}`));
      return;
    }
    load().then(module => callback(null, module.default)).catch(error => callback(error));
  },
};

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  pt: { translation: pt },
  it: { translation: it },
  zh: { translation: zh },
  ja: { translation: ja },
  ko: { translation: ko },
  ar: { translation: ar },
};

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  .use(bundledInterfaceBackend)
  // Initialize i18next
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: [...supportedLanguages],
    load: 'languageOnly',
    ns: ['translation', 'interface'],
    defaultNS: 'translation',
    partialBundledLanguages: true,
    react: { useSuspense: false },
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
      alwaysFormat: true,
      format(value, _format, language) {
        return typeof value === 'number'
          ? new Intl.NumberFormat(language || 'en').format(value)
          : String(value);
      },
    },

    detection: {
      // Detection options
      order: ['localStorage', 'sessionStorage', 'cookie', 'navigator', 'htmlTag'],
      convertDetectedLanguage: (language: string) => language.toLowerCase().split(/[-_]/)[0],
      lookupLocalStorage: 'i18nextLng',
      lookupSessionStorage: 'i18nextLng',
      lookupCookie: 'i18nextLng',
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,
      caches: ['localStorage', 'sessionStorage', 'cookie'],
      excludeCacheFor: ['cimode'],
    },
  });

function updateDocumentLanguage() {
  if (typeof document === 'undefined') return;
  const language = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  const splash = document.getElementById('mykliq-startup');
  if (splash) {
    const text = (message: string) => String(i18n.t(message, { ns: 'interface', keySeparator: false, defaultValue: message }));
    splash.setAttribute('aria-label', text('Starting MyKliq'));
    const tagline = splash.querySelector('.mk-splash-tagline');
    const recovery = splash.querySelector('.mk-splash-recovery p');
    const retry = splash.querySelector('.mk-splash-retry');
    if (tagline) tagline.textContent = text('Your Private Social Circle');
    if (recovery) recovery.textContent = text('MyKliq is taking longer to start. Check your connection, then try again.');
    if (retry) retry.textContent = text('Try again');
  }
  syncWorkerLanguage();
}

let lastWorkerLanguage = '';
function syncWorkerLanguage(force = false) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const language = i18n.resolvedLanguage || i18n.language || 'en';
  if (!i18n.hasResourceBundle(language.split('-')[0], 'interface')) return;
  if (!force && lastWorkerLanguage === language) return;
  lastWorkerLanguage = language;
  const messages = Object.fromEntries(notificationPhrases.map(message => [
    message,
    // Do not interpolate placeholders until the actual notification arrives.
    i18n.getResource(language.split('-')[0], 'interface', message, { keySeparator: false }) || message,
  ]));
  navigator.serviceWorker.ready.then(registration => {
    registration.active?.postMessage({ type: 'SET_INTERFACE_LANGUAGE', language, messages });
  }).catch(() => { lastWorkerLanguage = ''; });
}

if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => syncWorkerLanguage(true));
}

i18n.on('initialized', updateDocumentLanguage);
i18n.on('languageChanged', updateDocumentLanguage);
i18n.on('loaded', updateDocumentLanguage);
updateDocumentLanguage();

export default i18n;