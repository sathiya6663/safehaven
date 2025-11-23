import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { supportedLanguages } from '@/utils/translation';

export function LanguageSelector() {
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  useEffect(() => {
    // Load saved language preference
    const saved = localStorage.getItem('preferredLanguage');
    if (saved) {
      setSelectedLanguage(saved);
      applyLanguage(saved);
    }
  }, []);

  const applyLanguage = (languageCode: string) => {
    const lang = supportedLanguages.find((l) => l.code === languageCode);
    if (lang) {
      document.documentElement.lang = languageCode;
      if (lang.rtl) {
        document.documentElement.dir = 'rtl';
      } else {
        document.documentElement.dir = 'ltr';
      }
      localStorage.setItem('preferredLanguage', languageCode);
    }
  };

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    applyLanguage(languageCode);
    // Reload page to apply language change
    window.location.reload();
  };

  return (
    <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[180px]">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {supportedLanguages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <div className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
