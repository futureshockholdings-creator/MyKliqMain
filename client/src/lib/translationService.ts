import { useTranslation } from 'react-i18next';

// Translation cache to avoid repeated API calls
const translationCache = new Map<string, string>();

// Simple translation mappings for common words/phrases
const commonTranslations: Record<string, Record<string, string>> = {
  es: {
    'hello': 'hola',
    'good morning': 'buenos días',
    'good night': 'buenas noches',
    'thank you': 'gracias',
    'love': 'amor',
    'happy': 'feliz',
    'birthday': 'cumpleaños',
    'checked in at': 'registrado en',
    'feeling': 'sintiéndose',
    'just': 'solo',
    'grinding': 'trabajando duro',
    'bored': 'aburrido',
    'test': 'prueba',
    'hello everyone': 'hola a todos'
  },
  fr: {
    'hello': 'bonjour',
    'good morning': 'bonjour',
    'good night': 'bonne nuit',
    'thank you': 'merci',
    'love': 'amour',
    'happy': 'heureux',
    'birthday': 'anniversaire',
    'checked in at': 'enregistré à',
    'feeling': 'se sentir',
    'just': 'juste',
    'grinding': 'travailler dur',
    'bored': 'ennuyé',
    'test': 'test',
    'hello everyone': 'bonjour tout le monde'
  },
  de: {
    'hello': 'hallo',
    'good morning': 'guten Morgen',
    'good night': 'gute Nacht',
    'thank you': 'danke',
    'love': 'liebe',
    'happy': 'glücklich',
    'birthday': 'Geburtstag',
    'checked in at': 'eingecheckt bei',
    'feeling': 'fühlen',
    'just': 'nur',
    'grinding': 'hart arbeiten',
    'bored': 'gelangweilt',
    'test': 'Test',
    'hello everyone': 'hallo alle'
  },
  pt: {
    'hello': 'olá',
    'good morning': 'bom dia',
    'good night': 'boa noite',
    'thank you': 'obrigado',
    'love': 'amor',
    'happy': 'feliz',
    'birthday': 'aniversário',
    'checked in at': 'check-in em',
    'feeling': 'sentindo',
    'just': 'apenas',
    'grinding': 'trabalhando duro',
    'bored': 'entediado',
    'test': 'teste',
    'hello everyone': 'olá pessoal'
  },
  it: {
    'hello': 'ciao',
    'good morning': 'buongiorno',
    'good night': 'buonanotte',
    'thank you': 'grazie',
    'love': 'amore',
    'happy': 'felice',
    'birthday': 'compleanno',
    'checked in at': 'registrato a',
    'feeling': 'sentendosi',
    'just': 'solo',
    'grinding': 'lavorando sodo',
    'bored': 'annoiato',
    'test': 'test',
    'hello everyone': 'ciao a tutti'
  },
  zh: {
    'hello': '你好',
    'good morning': '早上好',
    'good night': '晚安',
    'thank you': '谢谢',
    'love': '爱',
    'happy': '快乐',
    'birthday': '生日',
    'checked in at': '签到于',
    'feeling': '感觉',
    'just': '只是',
    'grinding': '努力工作',
    'bored': '无聊',
    'test': '测试',
    'hello everyone': '大家好'
  },
  ja: {
    'hello': 'こんにちは',
    'good morning': 'おはよう',
    'good night': 'おやすみ',
    'thank you': 'ありがとう',
    'love': '愛',
    'happy': '幸せ',
    'birthday': '誕生日',
    'checked in at': 'チェックイン',
    'feeling': '感じて',
    'just': 'ただ',
    'grinding': '頑張っている',
    'bored': '退屈',
    'test': 'テスト',
    'hello everyone': '皆さんこんにちは'
  },
  ko: {
    'hello': '안녕하세요',
    'good morning': '좋은 아침',
    'good night': '안녕히 주무세요',
    'thank you': '감사합니다',
    'love': '사랑',
    'happy': '행복한',
    'birthday': '생일',
    'checked in at': '체크인',
    'feeling': '느끼는',
    'just': '그냥',
    'grinding': '열심히 일하는',
    'bored': '지루한',
    'test': '테스트',
    'hello everyone': '안녕하세요 여러분'
  },
  ar: {
    'hello': 'مرحبا',
    'good morning': 'صباح الخير',
    'good night': 'تصبح على خير',
    'thank you': 'شكرا لك',
    'love': 'حب',
    'happy': 'سعيد',
    'birthday': 'عيد ميلاد',
    'checked in at': 'تسجيل الوصول في',
    'feeling': 'شعور',
    'just': 'فقط',
    'grinding': 'العمل الجاد',
    'bored': 'ملل',
    'test': 'اختبار',
    'hello everyone': 'مرحبا بالجميع'
  }
};

export function translateText(text: string, targetLanguage: string): string {
  // Don't translate if target is English or if text is empty
  if (!text || targetLanguage === 'en' || targetLanguage === 'en-US') {
    return text;
  }

  // Check cache first
  const cacheKey = `${text}-${targetLanguage}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  // Skip translation for certain content types
  if (isUrl(text) || isSpecialContent(text)) {
    return text;
  }

  // Use simple word-based translation for now
  let translatedText = translateUsingDictionary(text, targetLanguage);
  
  // Cache the result
  translationCache.set(cacheKey, translatedText);
  
  return translatedText;
}

function translateUsingDictionary(text: string, targetLanguage: string): string {
  const languageCode = targetLanguage.split('-')[0]; // Get 'es' from 'es-ES'
  const translations = commonTranslations[languageCode];
  
  if (!translations) {
    return text; // Return original if language not supported
  }

  let result = text.toLowerCase();
  
  // Sort by length descending to match longer phrases first
  const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);
  
  for (const key of sortedKeys) {
    const translation = translations[key];
    result = result.replace(new RegExp(key, 'gi'), translation);
  }
  
  // Preserve original capitalization for first word
  if (text.length > 0 && text[0] === text[0].toUpperCase()) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }
  
  return result;
}

function isUrl(text: string): boolean {
  try {
    new URL(text);
    return true;
  } catch {
    return text.includes('http://') || text.includes('https://') || text.includes('www.');
  }
}

function isSpecialContent(text: string): boolean {
  // Don't translate emojis, numbers, special characters
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;
  const hasOnlyEmojisAndSpaces = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]*$/u;
  
  return emojiRegex.test(text) && hasOnlyEmojisAndSpaces.test(text);
}

export function translateMood(mood: string, targetLanguage: string): string {
  const moodTranslations: Record<string, Record<string, string>> = {
    es: {
      'happy': 'feliz', 'sad': 'triste', 'excited': 'emocionado', 'angry': 'enojado',
      'blessed': 'bendecido', 'lucky': 'afortunado', 'anxious': 'ansioso', 'nostalgic': 'nostálgico'
    },
    fr: {
      'happy': 'heureux', 'sad': 'triste', 'excited': 'excité', 'angry': 'en colère',
      'blessed': 'béni', 'lucky': 'chanceux', 'anxious': 'anxieux', 'nostalgic': 'nostalgique'
    },
    de: {
      'happy': 'glücklich', 'sad': 'traurig', 'excited': 'aufgeregt', 'angry': 'wütend',
      'blessed': 'gesegnet', 'lucky': 'glücklich', 'anxious': 'ängstlich', 'nostalgic': 'nostalgisch'
    },
    pt: {
      'happy': 'feliz', 'sad': 'triste', 'excited': 'animado', 'angry': 'zangado',
      'blessed': 'abençoado', 'lucky': 'sortudo', 'anxious': 'ansioso', 'nostalgic': 'nostálgico'
    },
    it: {
      'happy': 'felice', 'sad': 'triste', 'excited': 'eccitato', 'angry': 'arrabbiato',
      'blessed': 'benedetto', 'lucky': 'fortunato', 'anxious': 'ansioso', 'nostalgic': 'nostalgico'
    },
    zh: {
      'happy': '快乐', 'sad': '伤心', 'excited': '兴奋', 'angry': '生气',
      'blessed': '受祝福', 'lucky': '幸运', 'anxious': '焦虑', 'nostalgic': '怀念'
    },
    ja: {
      'happy': '幸せ', 'sad': '悲しい', 'excited': '興奮', 'angry': '怒っている',
      'blessed': '祝福された', 'lucky': '幸運', 'anxious': '心配', 'nostalgic': '懐かしい'
    },
    ko: {
      'happy': '행복한', 'sad': '슬픈', 'excited': '흥분한', 'angry': '화난',
      'blessed': '축복받은', 'lucky': '운이 좋은', 'anxious': '불안한', 'nostalgic': '향수를 불러일으키는'
    },
    ar: {
      'happy': 'سعيد', 'sad': 'حزين', 'excited': 'متحمس', 'angry': 'غاضب',
      'blessed': 'مبارك', 'lucky': 'محظوظ', 'anxious': 'قلق', 'nostalgic': 'حنين'
    }
  };

  const languageCode = targetLanguage.split('-')[0];
  const translations = moodTranslations[languageCode];
  
  if (!translations) {
    return mood;
  }
  
  return translations[mood.toLowerCase()] || mood;
}

// Hook for using translation service in components
export function usePostTranslation() {
  const { i18n } = useTranslation();
  
  const translatePost = (text: string) => {
    return translateText(text, i18n.language);
  };
  
  const translateMoodText = (mood: string) => {
    return translateMood(mood, i18n.language);
  };
  
  return { translatePost, translateMoodText, currentLanguage: i18n.language };
}