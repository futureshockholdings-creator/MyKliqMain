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
import { uiText, useUiLanguage } from '@/i18n/interfaceText';

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
  const { i18n } = useTranslation();
  useUiLanguage();
  const [isDetected, setIsDetected] = useState(true);

  const currentCode = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase().split(/[-_]/)[0];
  const currentLanguage = languages.find(lang => lang.code === currentCode) || languages[0];

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsDetected(false);
    // Store language preference
    try {
      localStorage.setItem('i18nextLng', languageCode);
    } catch {
      // Language selection still works for this session if storage is blocked.
    }
  };

  if (variant === 'select') {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="text-sm font-medium">
          {uiText("Select language")}
        </label>
        <Select value={currentCode} onValueChange={changeLanguage}>
          <SelectTrigger>
            <SelectValue>
              <div className="flex items-center gap-2">
                {showFlag && <span>{currentLanguage.flag}</span>}
                <span>{currentLanguage.name}</span>
                {isDetected && (
                  <span className="text-xs text-muted-foreground">
                    ({uiText("Auto-detected")})
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
          className={`gap-1 text-xs ${className} flex-shrink-0`}
          data-testid="button-language-selector"
          aria-label={uiText("Select language")}
          title={uiText("Select language")}
        >
          <Globe className="w-3 h-3 flex-shrink-0" />
          {showFlag && <span className="flex-shrink-0">{currentLanguage.flag}</span>}
          <span className="hidden lg:inline truncate">{currentLanguage.name}</span>
          <span className="lg:hidden truncate">{currentLanguage.code.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={`flex items-center gap-3 ${
              currentCode === language.code ? 'bg-accent' : ''
            }`}
            data-testid={`language-option-${language.code}`}
          >
            {showFlag && <span className="text-lg">{language.flag}</span>}
            <div className="flex flex-col">
              <span className="font-medium">{language.name}</span>
              {currentCode === language.code && (
                <span className="text-xs text-muted-foreground">
                  {uiText("Current language")}
                  {isDetected && ` • ${uiText("Auto-detected")}`}
                </span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}