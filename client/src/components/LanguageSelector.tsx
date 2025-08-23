import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'select';
  showFlag?: boolean;
  className?: string;
}

export function LanguageSelector({ 
  variant = 'dropdown', 
  showFlag = true,
  className = '' 
}: LanguageSelectorProps) {
  const { i18n, t } = useTranslation();
  const [isDetected, setIsDetected] = useState(true);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsDetected(false);
    // Store language preference
    localStorage.setItem('i18nextLng', languageCode);
  };

  if (variant === 'select') {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="text-sm font-medium">
          {t('language.selectLanguage')}
        </label>
        <Select value={i18n.language} onValueChange={changeLanguage}>
          <SelectTrigger>
            <SelectValue>
              <div className="flex items-center gap-2">
                {showFlag && <span>{currentLanguage.flag}</span>}
                <span>{currentLanguage.name}</span>
                {isDetected && (
                  <span className="text-xs text-muted-foreground">
                    ({t('language.autoDetected')})
                  </span>
                )}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {languages.map((language) => (
              <SelectItem key={language.code} value={language.code}>
                <div className="flex items-center gap-2">
                  {showFlag && <span>{language.flag}</span>}
                  <span>{language.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`gap-2 ${className}`}
          data-testid="button-language-selector"
        >
          <Globe className="w-4 h-4" />
          {showFlag && <span>{currentLanguage.flag}</span>}
          <span className="hidden sm:inline">{currentLanguage.name}</span>
          <span className="sm:hidden">{currentLanguage.code.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={`flex items-center gap-3 ${
              i18n.language === language.code ? 'bg-accent' : ''
            }`}
            data-testid={`language-option-${language.code}`}
          >
            {showFlag && <span className="text-lg">{language.flag}</span>}
            <div className="flex flex-col">
              <span className="font-medium">{language.name}</span>
              {i18n.language === language.code && (
                <span className="text-xs text-muted-foreground">
                  {t('language.currentLanguage')}
                  {isDetected && ` • ${t('language.autoDetected')}`}
                </span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}