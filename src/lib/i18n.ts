export type Locale = "en" | "ar";

const translations = {
  // Header
  title: {
    en: "مُراجَعَة القرآن",
    ar: "مُراجَعَة القرآن",
  },
  subtitle: {
    en: "Quran Revision Practice",
    ar: "تدرّب على مراجعة حفظك",
  },

  // Language toggle
  langToggle: {
    en: "عربي",
    ar: "English",
  },

  // Mode toggle
  byJuz: {
    en: "By Juz",
    ar: "حسب الجزء",
  },
  bySurah: {
    en: "By Surah",
    ar: "حسب السورة",
  },

  // Selectors
  selectJuz: {
    en: "Select a Juz",
    ar: "اختر جزءاً",
  },
  juzLabel: {
    en: "Juz",
    ar: "الجزء",
  },
  selectSurah: {
    en: "Select a Surah",
    ar: "اختر سورة",
  },

  // Buttons
  generateAyah: {
    en: "Generate Ayah",
    ar: "اختر آية",
  },
  loading: {
    en: "Loading...",
    ar: "جارٍ التحميل...",
  },
  revealNext: {
    en: "Reveal Next Ayah",
    ar: "أظهر الآية التالية",
  },
  revealAll: {
    en: "Reveal All",
    ar: "أظهر الكل",
  },
  generateAnother: {
    en: "Generate Another",
    ar: "اختر آية أخرى",
  },
  reset: {
    en: "Reset",
    ar: "إعادة تعيين",
  },

  // Labels
  startReciting: {
    en: "Start reciting from here",
    ar: "ابدأ التلاوة من هنا",
  },
  ayah: {
    en: "Ayah",
    ar: "آية",
  },
  reciteInstruction: {
    en: (count: number) =>
      `Recite the next ${count} ayahs from memory, then reveal to check...`,
    ar: (count: number) =>
      `اتلُ الآيات الـ ${count} التالية من حفظك، ثم أظهرها للتحقق...`,
  },
  hiddenAyah: {
    en: (index: number, total: number) =>
      `Ayah ${index} of ${total} — hidden`,
    ar: (index: number, total: number) =>
      `الآية ${index} من ${total} — مخفية`,
  },
  tapToReveal: {
    en: "Click to reveal",
    ar: "اضغط للإظهار",
  },
  allRevealed: {
    en: "All ayahs revealed — how did you do?",
    ar: "تم إظهار جميع الآيات — كيف كان أداؤك؟",
  },

  // Empty state
  emptyJuz: {
    en: "Select a Juz and press Generate Ayah to start practicing your memorization.",
    ar: "اختر جزءاً ثم اضغط على «اختر آية» لبدء مراجعة حفظك.",
  },
  emptySurah: {
    en: "Select a Surah and press Generate Ayah to start practicing your memorization.",
    ar: "اختر سورة ثم اضغط على «اختر آية» لبدء مراجعة حفظك.",
  },

  // Error
  fetchError: {
    en: "Failed to fetch ayahs. Please check your connection and try again.",
    ar: "فشل في تحميل الآيات. يرجى التحقق من اتصالك والمحاولة مرة أخرى.",
  },

  // Footer
  footerText: {
    en: "Quran text from",
    ar: "نص القرآن من",
  },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, locale: Locale): string | ((...args: number[]) => string) {
  return translations[key][locale];
}

// Helper for simple string translations
export function ts(key: TranslationKey, locale: Locale): string {
  return translations[key][locale] as string;
}

// Helper for function translations (with parameters)
export function tf(key: TranslationKey, locale: Locale): (...args: number[]) => string {
  return translations[key][locale] as (...args: number[]) => string;
}
