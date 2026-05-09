import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'sa', name: 'Sanskrit', native: 'संस्कृतम्' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
];

export const UI_LABELS = {
  en: {
    welcome: 'Divine Wisdom for Modern Minds',
    startLearning: 'START LEARNING',
    gitaReels: 'GITA REELS',
    kidsParadise: 'Kids Paradise',
    safeFunLearning: 'Safe & Fun Learning',
    divineCinema: 'Divine Cinema',
    trendingNow: 'Trending Now',
    aiSearch: 'AI Search...',
    follow: 'Follow',
    save: 'Save',
    share: 'Share',
    enterCinema: 'Enter Divine Cinema',
    spiritualPath: 'Spiritual Path',
    dailySloka: 'DAILY SLOKA',
    slokaText: '"You have a right to perform your duty, but not to the fruits."',
  },
  hi: {
    welcome: 'आधुनिक दिमागों के लिए दिव्य ज्ञान',
    startLearning: 'सीखना शुरू करें',
    gitaReels: 'गीता रील्स',
    kidsParadise: 'किड्स पैराडाइज',
    safeFunLearning: 'सुरक्षित और मजेदार सीखना',
    divineCinema: 'दिव्य सिनेमा',
    trendingNow: 'अभी ट्रेंडिंग',
    aiSearch: 'एआई खोज...',
    follow: 'फॉलो करें',
    save: 'सहेजें',
    share: 'साझा करें',
    enterCinema: 'दिव्य सिनेमा में प्रवेश करें',
    spiritualPath: 'आध्यात्मिक पथ',
    dailySloka: 'दैनिक श्लोक',
    slokaText: '"आपको अपना कर्तव्य निभाने का अधिकार है, लेकिन उसके फलों पर नहीं।"',
  },
  te: {
    welcome: 'ఆధునిక మనస్సుల కోసం దైవిక జ్ఞానం',
    startLearning: 'నేర్చుకోవడం ప్రారంభించండి',
    gitaReels: 'గీతా రీల్స్',
    kidsParadise: 'కిడ్స్ ప్యారడైజ్',
    safeFunLearning: 'సురక్షితమైన మరియు సరదా అభ్యాసం',
    divineCinema: 'దైవిక సినిమా',
    trendingNow: 'ప్రస్తుతం ట్రెండింగ్‌లో ఉంది',
    aiSearch: 'AI శోధన...',
    follow: 'అనుసరించండి',
    save: 'సేవ్ చేయండి',
    share: 'షేర్ చేయండి',
    enterCinema: 'దైవిక సినిమాలోకి ప్రవేశించండి',
    spiritualPath: 'ఆధ್ಯಾత్మిక మార్గం',
    dailySloka: 'ದೈನಂದಿನ ಶ್ಲೋಕ',
    slokaText: '"నీ కర్తవ్యాన్ని నిర్వహించే హక్కు నీకు ఉంది, ಆದರೆ ಫಲಿತಾಂಶాలపై కాదు."',
  },
  ta: {
    welcome: 'நவீன மனங்களுக்கான தெய்வீக ஞானம்',
    startLearning: 'கற்றலைத் தொடங்கு',
    gitaReels: 'கீதா ரீல்ஸ்',
    kidsParadise: 'குழந்தைகள் சொர்க்கம்',
    safeFunLearning: 'பாதுகாப்பான மற்றும் வேடிக்கையான கற்றல்',
    divineCinema: 'தெய்வீக சினிமா',
    trendingNow: 'இப்போது பிரபலமானது',
    aiSearch: 'AI தேடல்...',
    follow: 'பின்தொடர்',
    save: 'சேமி',
    share: 'பகிர்',
    enterCinema: 'தெய்வீக சினிமாவில் நுழையுங்கள்',
    spiritualPath: 'ஆன்மீக பாதை',
    dailySloka: 'தினசரி ஸ்லோகம்',
    slokaText: '"உங்கள் கடமையைச் செய்ய உங்களுக்கு உரிமை உண்டு, ಆದರೆ அதன் பலன்களுக்கு அல்ல."',
  },
  ur: {
    welcome: 'جدید ذہنوں کے لیے الہی حکمت',
    startLearning: 'سیکھنا شروع کریں',
    gitaReels: 'گیتا ریلز',
    kidsParadise: 'بچوں کی جنت',
    safeFunLearning: 'محفوظ اور تفریحی سیکھنا',
    divineCinema: 'الہی سینما',
    trendingNow: 'ابھی ٹرینڈنگ',
    aiSearch: 'اے آئی سرچ...',
    follow: 'فالو کریں',
    save: 'محفوظ کریں',
    share: 'شیئر کریں',
    enterCinema: 'الہی سینما میں داخل ہوں',
    spiritualPath: 'روحانی راستہ',
  },
  ru: {
    welcome: 'Божественная мудрость для современных умов',
    startLearning: 'НАЧАТЬ ОБУЧЕНИЕ',
    gitaReels: 'ГИТА РИЛС',
    kidsParadise: 'Детский рай',
    safeFunLearning: 'Безопасное и веселое обучение',
    divineCinema: 'Божественный кинотеатр',
    trendingNow: 'Сейчас в тренде',
    aiSearch: 'AI поиск...',
    follow: 'Подписаться',
    save: 'Сохранить',
    share: 'Поделиться',
    enterCinema: 'Войти в Божественный кинотеатр',
    spiritualPath: 'Духовный путь',
  },
  pt: {
    welcome: 'Sabedoria Divina para Mentes Modernas',
    startLearning: 'COMEÇAR A APRENDER',
    gitaReels: 'REELS DA GITA',
    kidsParadise: 'Paraíso das Crianças',
    safeFunLearning: 'Aprendizado Seguro e Divertido',
    divineCinema: 'Cinema Divino',
    trendingNow: 'Bombando agora',
    aiSearch: 'Pesquisa AI...',
    follow: 'Seguir',
    save: 'Salvar',
    share: 'Compartilhar',
    enterCinema: 'Entrar no Cinema Divino',
    spiritualPath: 'Caminho Espiritual',
    dailySloka: 'SLOKA DIÁRIO',
    slokaText: '"Você tem o direito de cumprir seu dever, mas não aos frutos."',
  },
  kn: {
    welcome: 'ಆಧುನಿಕ ಮನಸ್ಸುಗಳಿಗೆ ದೈವಿಕ ಜ್ಞಾನ',
    startLearning: 'ಕಲಿಕೆಯನ್ನು ಪ್ರಾರಂಭಿಸಿ',
    gitaReels: 'ಗೀತಾ ರೀಲ್ಸ್',
    kidsParadise: 'ಮಕ್ಕಳ ಸ್ವರ್ಗ',
    safeFunLearning: 'ಸುರಕ್ಷಿತ ಮತ್ತು ಮೋಜಿನ ಕಲಿಕೆ',
    divineCinema: 'ದೈವಿಕ ಸಿನೆಮಾ',
    trendingNow: 'ಈಗ ಟ್ರೆಂಡಿಂಗ್',
    aiSearch: 'AI ಹುಡುಕಾಟ...',
    follow: 'ಅನುಸರಿಸಿ',
    save: 'ಉಳಿಸಿ',
    share: 'ಹಂಚಿಕೊಳ್ಳಿ',
    enterCinema: 'ದೈವಿಕ ಸಿನೆಮಾವನ್ನು ಪ್ರವೇಶಿಸಿ',
    spiritualPath: 'ಆಧ್ಯಾತ್ಮಿಕ ಹಾದಿ',
    dailySloka: 'ದೈನಂದಿನ ಶ್ಲೋಕ',
    slokaText: '"ನಿಮ್ಮ ಕರ್ತವ್ಯವನ್ನು ಮಾಡಲು ನಿಮಗೆ ಹಕ್ಕಿದೆ, ಆದರೆ ಫಲಿತಾಂಶದ ಮೇಲಲ್ಲ."',
  },
  sa: {
    welcome: 'आधुनिकमनसां कृते दिव्यज्ञानम्',
    startLearning: 'अधिगमं आरभत',
    gitaReels: 'गीतारील्स्',
    kidsParadise: 'बालस्वर्गः',
    safeFunLearning: 'सुरक्षितं आनन्ददं च शिक्षणम्',
    divineCinema: 'दिव्यं चलच्चित्रम्',
    trendingNow: 'अधुना प्रचलिताः',
    aiSearch: 'AI अन्वेषणम्...',
    follow: 'अनुसरतु',
    save: 'रक्षतु',
    share: 'वितरतु',
    enterCinema: 'दिव्यं चलच्चित्रं प्रविशतु',
    spiritualPath: 'आध्यात्मिकः मार्गः',
    dailySloka: 'दैनिकश्लोकः',
    slokaText: '"कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥"',
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(localStorage.getItem('preferredLanguage') || 'en');

  useEffect(() => {
    localStorage.setItem('preferredLanguage', language);
  }, [language]);

  const t = (content, field) => {
    if (!content) return '';
    
    // 1. Check strict translations object (AI Generated)
    if (content.translations && content.translations[language] && content.translations[language][field]) {
      return content.translations[language][field];
    }
    
    // 2. Map language codes to legacy field names
    const legacyMap = {
      en: 'English',
      hi: 'Hindi',
      te: 'Telugu',
      ta: 'Tamil',
      kn: 'Kannada',
      ml: 'Malayalam',
      sa: 'Sanskrit'
    };
    
    const suffix = legacyMap[language];
    if (suffix && content[`${field}${suffix}`]) {
      return content[`${field}${suffix}`];
    }
    
    // 3. Fallback to English suffix
    if (content[`${field}English`]) return content[`${field}English`];
    
    // 4. Final fallback to base field
    return content[field] || '';
  };

  const tLabel = (key) => {
    return UI_LABELS[language]?.[key] || UI_LABELS['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tLabel, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
