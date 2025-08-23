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
    'hello everyone': 'hola a todos',
    'music': 'música',
    'reading': 'lectura',
    'gaming': 'juegos',
    'cooking': 'cocinar',
    'travel': 'viajar',
    'sports': 'deportes',
    'movies': 'películas',
    'photography': 'fotografía',
    'art': 'arte',
    'dancing': 'baile',
    'coffee': 'café',
    'pizza': 'pizza',
    'chocolate': 'chocolate',
    'pasta': 'pasta',
    'sushi': 'sushi',
    'tacos': 'tacos',
    'burgers': 'hamburguesas',
    'new york': 'nueva york',
    'paris': 'parís',
    'london': 'londres',
    'tokyo': 'tokio',
    'beach': 'playa',
    'mountains': 'montañas',
    'city': 'ciudad',
    'rock': 'rock',
    'pop': 'pop',
    'jazz': 'jazz',
    'classical': 'clásica',
    'hip hop': 'hip hop',
    'electronic': 'electrónica',
    'single': 'soltero',
    'taken': 'en una relación',
    'married': 'casado',
    'complicated': 'es complicado',
    'prefer not to say': 'prefiero no decir',
    'dog lover': 'amante de los perros',
    'cat lover': 'amante de los gatos',
    'loves dogs & cats': 'ama perros y gatos',
    'other pets': 'otras mascotas',
    'no pets': 'sin mascotas',
    'active': 'activo',
    'relaxed': 'relajado',
    'adventurous': 'aventurero',
    'homebody': 'hogareño',
    'social': 'social',
    'quiet': 'tranquilo',
    'fishing': 'pesca',
    'watching': 'viendo',
    'netflix': 'netflix',
    'wwe': 'wwe',
    'call of duty': 'call of duty',
    'sports cards': 'cartas deportivas',
    'sneaker freak': 'fanático de zapatillas',
    'steak': 'bistec',
    'nachos': 'nachos',
    'gospel': 'gospel',
    'metal': 'metal',
    'the matrix': 'matrix',
    'wizard of oz': 'mago de oz',
    'e.t.': 'e.t.',
    'bible': 'biblia',
    'stephen king': 'stephen king',
    'love life': 'amo la vida',
    'enjoy': 'disfruto',
    'family': 'familia',
    'friends': 'amigos',
    'work': 'trabajo',
    'life': 'vida',
    'fun': 'diversión',
    'time': 'tiempo',
    'good': 'bueno',
    'great': 'genial',
    'amazing': 'increíble',
    'awesome': 'impresionante',
    'beautiful': 'hermoso',
    'nice': 'agradable',
    'cool': 'genial',
    'funny': 'divertido',
    'interesting': 'interesante',
    'exciting': 'emocionante',
    'relaxing': 'relajante',
    'peaceful': 'pacífico',
    'busy': 'ocupado',
    'tired': 'cansado',
    'stressed': 'estresado',
    'worried': 'preocupado',
    'excited': 'emocionado',
    'nervous': 'nervioso',
    'proud': 'orgulloso',
    'grateful': 'agradecido',
    'blessed': 'bendecido',
    'interests & hobbies': 'intereses y pasatiempos',
    'interests': 'intereses',
    'hobbies': 'pasatiempos',
    'favorites': 'favoritos',
    'places': 'lugares',
    'foods': 'comidas',
    'music genres': 'géneros musicales',
    'lifestyle & status': 'estilo de vida y estado',
    'relationship status': 'estado de relación',
    'pet preferences': 'preferencias de mascotas',
    'entertainment': 'entretenimiento',
    'books': 'libros',
    'in a relationship': 'en una relación',
    'it\'s complicated': 'es complicado'
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
    'hello everyone': '大家好',
    'music': '音乐',
    'reading': '阅读',
    'gaming': '游戏',
    'cooking': '烹饪',
    'travel': '旅行',
    'sports': '运动',
    'movies': '电影',
    'photography': '摄影',
    'art': '艺术',
    'dancing': '舞蹈',
    'coffee': '咖啡',
    'pizza': '披萨',
    'chocolate': '巧克力',
    'pasta': '意大利面',
    'sushi': '寿司',
    'tacos': '玉米饼',
    'burgers': '汉堡',
    'new york': '纽约',
    'paris': '巴黎',
    'london': '伦敦',
    'tokyo': '东京',
    'beach': '海滩',
    'mountains': '山脉',
    'city': '城市',
    'rock': '摇滚',
    'pop': '流行',
    'jazz': '爵士',
    'classical': '古典',
    'hip hop': '嘻哈',
    'electronic': '电子',
    'single': '单身',
    'taken': '有对象',
    'married': '已婚',
    'complicated': '复杂',
    'prefer not to say': '不愿说',
    'dog lover': '狗狗爱好者',
    'cat lover': '猫咪爱好者',
    'loves dogs & cats': '喜欢狗和猫',
    'other pets': '其他宠物',
    'no pets': '没有宠物',
    'active': '活跃',
    'relaxed': '放松',
    'adventurous': '冒险',
    'homebody': '宅家',
    'social': '社交',
    'quiet': '安静',
    'fishing': '钓鱼',
    'watching': '观看',
    'netflix': '网飞',
    'wwe': '摔跤',
    'call of duty': '使命召唤',
    'sports cards': '体育卡',
    'sneaker freak': '球鞋迷',
    'steak': '牛排',
    'nachos': '玉米片',
    'gospel': '福音',
    'metal': '金属',
    'the matrix': '黑客帝国',
    'wizard of oz': '绿野仙踪',
    'e.t.': '外星人',
    'bible': '圣经',
    'stephen king': '史蒂芬·金',
    'love life': '热爱生活',
    'enjoy': '享受',
    'family': '家庭',
    'friends': '朋友',
    'work': '工作',
    'life': '生活',
    'fun': '乐趣',
    'time': '时间',
    'good': '好',
    'great': '很棒',
    'amazing': '惊人',
    'awesome': '令人敬畏',
    'beautiful': '美丽',
    'nice': '不错',
    'cool': '酷',
    'funny': '有趣',
    'interesting': '有意思',
    'exciting': '令人兴奋',
    'relaxing': '放松',
    'peaceful': '平静',
    'busy': '忙碌',
    'tired': '累',
    'stressed': '有压力',
    'worried': '担心',
    'excited': '兴奋',
    'nervous': '紧张',
    'proud': '自豪',
    'grateful': '感激',
    'blessed': '有福',
    'interests & hobbies': '兴趣爱好',
    'interests': '兴趣',
    'hobbies': '爱好',
    'favorites': '最爱',
    'places': '地方',
    'foods': '食物',
    'music genres': '音乐类型',
    'lifestyle & status': '生活方式和状态',
    'relationship status': '感情状态',
    'pet preferences': '宠物偏好',
    'entertainment': '娱乐',
    'books': '书籍',
    'in a relationship': '有对象',
    'it\'s complicated': '复杂'
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
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    result = result.replace(regex, translation);
  }
  
  // Handle comma-separated lists
  if (text.includes(',')) {
    const items = result.split(',').map(item => item.trim());
    result = items.join(', ');
  }
  
  // For free-form text, try to translate common words even if not exact matches
  if (!translations[text.toLowerCase()]) {
    const words = result.split(/\s+/);
    const translatedWords = words.map(word => {
      const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
      return translations[cleanWord] || word;
    });
    result = translatedWords.join(' ');
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
  const hasOnlyNumbers = /^\d+$/.test(text);
  const hasCommonEmojis = text.includes('😀') || text.includes('😊') || text.includes('🎉') || 
                         text.includes('📍') || text.includes('❤️') || text.includes('👍') ||
                         text.includes('😂') || text.includes('😍') || text.includes('🙂');
  const isShortAndProbablyEmoji = text.length <= 5 && hasCommonEmojis;
  
  return hasOnlyNumbers || isShortAndProbablyEmoji;
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