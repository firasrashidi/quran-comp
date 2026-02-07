const API_BASE = "https://api.quran.com/api/v4";

// Sahih International translation ID
const TRANSLATION_ID = 20;

export interface Verse {
  id: number;
  verse_key: string; // e.g. "2:255"
  text_uthmani: string;
  translation: string;
}

export interface SurahInfo {
  id: number;
  name_arabic: string;
  name_simple: string;
  revelation_place: string;
  verses_count: number;
}

// Juz metadata: names commonly used for each juz
export const JUZ_NAMES: Record<number, string> = {
  1: "الم",
  2: "سَيَقُولُ",
  3: "تِلْكَ ٱلرُّسُلُ",
  4: "لَن تَنَالُوا",
  5: "وَٱلْمُحْصَنَاتُ",
  6: "لَا يُحِبُّ ٱللَّهُ",
  7: "وَإِذَا سَمِعُوا",
  8: "وَلَوْ أَنَّنَا",
  9: "قَالَ ٱلْمَلَأُ",
  10: "وَٱعْلَمُوا",
  11: "يَعْتَذِرُونَ",
  12: "وَمَا مِن دَابَّةٍ",
  13: "وَمَا أُبَرِّئُ",
  14: "رُبَمَا",
  15: "سُبْحَانَ ٱلَّذِي",
  16: "قَالَ أَلَمْ",
  17: "ٱقْتَرَبَ",
  18: "قَدْ أَفْلَحَ",
  19: "وَقَالَ ٱلَّذِينَ",
  20: "أَمَّنْ خَلَقَ",
  21: "اتْلُ مَا أُوحِيَ",
  22: "وَمَن يَقْنُتْ",
  23: "وَمَا لِيَ",
  24: "فَمَنْ أَظْلَمُ",
  25: "إِلَيْهِ يُرَدُّ",
  26: "حم",
  27: "قَالَ فَمَا خَطْبُكُمْ",
  28: "قَدْ سَمِعَ ٱللَّهُ",
  29: "تَبَارَكَ ٱلَّذِي",
  30: "عَمَّ",
};

export interface SurahListItem {
  id: number;
  name_arabic: string;
  name_simple: string;
  verses_count: number;
}

// Caches
const juzCache: Map<number, Verse[]> = new Map();
const chapterVersesCache: Map<number, Verse[]> = new Map();
let surahListCache: SurahListItem[] | null = null;

// Strip HTML tags from translation text (API sometimes returns <sup> footnotes etc.)
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

export async function fetchJuzVerses(juzNumber: number): Promise<Verse[]> {
  if (juzCache.has(juzNumber)) {
    return juzCache.get(juzNumber)!;
  }

  // Fetch Arabic text and English translation in parallel
  const [arabicRes, translationRes] = await Promise.all([
    fetch(`${API_BASE}/quran/verses/uthmani?juz_number=${juzNumber}`),
    fetch(
      `${API_BASE}/quran/translations/${TRANSLATION_ID}?juz_number=${juzNumber}`
    ),
  ]);

  if (!arabicRes.ok || !translationRes.ok) {
    throw new Error(`Failed to fetch juz ${juzNumber}`);
  }

  const [arabicData, translationData] = await Promise.all([
    arabicRes.json(),
    translationRes.json(),
  ]);

  // Build a map of verse_key -> translation text
  const translationMap = new Map<string, string>();
  for (const t of translationData.translations) {
    translationMap.set(
      t.verse_key ?? String(t.resource_id),
      stripHtml(t.text)
    );
  }

  // Merge Arabic and English into a single Verse object
  const verses: Verse[] = arabicData.verses.map(
    (v: { id: number; verse_key: string; text_uthmani: string }) => ({
      id: v.id,
      verse_key: v.verse_key,
      text_uthmani: v.text_uthmani,
      translation: translationMap.get(v.verse_key) ?? "",
    })
  );

  juzCache.set(juzNumber, verses);
  return verses;
}

// Fetch all 114 surahs for the dropdown
export async function fetchAllSurahs(): Promise<SurahListItem[]> {
  if (surahListCache) return surahListCache;

  const response = await fetch(`${API_BASE}/chapters`);
  if (!response.ok) throw new Error("Failed to fetch surahs");

  const data = await response.json();
  surahListCache = data.chapters.map(
    (ch: { id: number; name_arabic: string; name_simple: string; verses_count: number }) => ({
      id: ch.id,
      name_arabic: ch.name_arabic,
      name_simple: ch.name_simple,
      verses_count: ch.verses_count,
    })
  );
  return surahListCache!;
}

// Fetch all verses of a chapter (Arabic + English)
export async function fetchChapterVerses(
  chapterNumber: number
): Promise<Verse[]> {
  if (chapterVersesCache.has(chapterNumber)) {
    return chapterVersesCache.get(chapterNumber)!;
  }

  const [arabicRes, translationRes] = await Promise.all([
    fetch(`${API_BASE}/quran/verses/uthmani?chapter_number=${chapterNumber}`),
    fetch(
      `${API_BASE}/quran/translations/${TRANSLATION_ID}?chapter_number=${chapterNumber}`
    ),
  ]);

  if (!arabicRes.ok || !translationRes.ok) {
    throw new Error(`Failed to fetch chapter ${chapterNumber}`);
  }

  const [arabicData, translationData] = await Promise.all([
    arabicRes.json(),
    translationRes.json(),
  ]);

  const translationMap = new Map<string, string>();
  for (const t of translationData.translations) {
    translationMap.set(t.verse_key ?? String(t.resource_id), stripHtml(t.text));
  }

  const verses: Verse[] = arabicData.verses.map(
    (v: { id: number; verse_key: string; text_uthmani: string }) => ({
      id: v.id,
      verse_key: v.verse_key,
      text_uthmani: v.text_uthmani,
      translation: translationMap.get(v.verse_key) ?? "",
    })
  );

  chapterVersesCache.set(chapterNumber, verses);
  return verses;
}

// Fetch verses starting from a specific surah:ayah, spanning into the next surah if needed
export async function fetchVersesFromAyah(
  surahNumber: number,
  ayahNumber: number,
  count: number
): Promise<Verse[]> {
  const verses = await fetchChapterVerses(surahNumber);
  const startIdx = ayahNumber - 1; // ayah numbers are 1-based

  if (startIdx < 0 || startIdx >= verses.length) {
    throw new Error(`Ayah ${ayahNumber} not found in Surah ${surahNumber}`);
  }

  const result = verses.slice(startIdx, startIdx + 1 + count);

  // If we need more verses and there's a next surah, fetch from it
  if (result.length < 1 + count && surahNumber < 114) {
    const nextVerses = await fetchChapterVerses(surahNumber + 1);
    const needed = 1 + count - result.length;
    result.push(...nextVerses.slice(0, needed));
  }

  return result;
}

// Get surah name from verse_key
const surahNamesCache: Map<number, SurahInfo> = new Map();

export async function fetchSurahInfo(
  surahNumber: number
): Promise<SurahInfo> {
  if (surahNamesCache.has(surahNumber)) {
    return surahNamesCache.get(surahNumber)!;
  }

  const response = await fetch(`${API_BASE}/chapters/${surahNumber}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch surah ${surahNumber}`);
  }

  const data = await response.json();
  const info: SurahInfo = data.chapter;
  surahNamesCache.set(surahNumber, info);
  return info;
}

export function parsVerseKey(verseKey: string): {
  surah: number;
  ayah: number;
} {
  const [surah, ayah] = verseKey.split(":").map(Number);
  return { surah, ayah };
}

export function getRandomStartingIndex(
  totalVerses: number,
  count: number
): number {
  // Make sure we have enough verses after the starting point
  const maxStart = Math.max(0, totalVerses - count - 1);
  return Math.floor(Math.random() * (maxStart + 1));
}
