import { supabase } from '@/integrations/supabase/client';

export const translateText = async (
  text: string,
  targetLanguage: string,
  contentType: 'legal' | 'counseling' | 'educational' | 'emergency' | 'general' = 'general'
): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('translate-content', {
      body: {
        text,
        targetLanguage,
        contentType,
      },
    });

    if (error) throw error;

    return data.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text if translation fails
  }
};

export const supportedLanguages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];
