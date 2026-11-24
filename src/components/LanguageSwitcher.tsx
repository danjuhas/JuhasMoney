import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANGUAGE_STORAGE_KEY, type SupportedLanguage } from '../lib/i18n';

const LANGUAGES: { code: SupportedLanguage; label: string }[] = [
  { code: 'pt', label: 'PT' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = (i18n?.language?.split('-')[0] || 'pt') as SupportedLanguage;

  const handleSelectLanguage = (lang: SupportedLanguage) => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // ignore localStorage write errors
    }
    if (i18n?.changeLanguage) {
      i18n.changeLanguage(lang);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-1 bg-slate-900/80 backdrop-blur-md border border-slate-800 p-1 rounded-full shadow-lg">
      <Globe className="w-3.5 h-3.5 text-slate-400 ml-2 mr-0.5" />
      {LANGUAGES.map(({ code, label }) => {
        const isActive = currentLang === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => handleSelectLanguage(code)}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
              isActive
                ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
