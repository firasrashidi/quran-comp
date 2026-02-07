"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchJuzVerses,
  fetchSurahInfo,
  fetchAllSurahs,
  fetchChapterVerses,
  parsVerseKey,
  getRandomStartingIndex,
  JUZ_NAMES,
  type Verse,
  type SurahInfo,
  type SurahListItem,
} from "@/lib/quran-api";
import { useLocale } from "@/lib/locale-context";
import { ts, tf } from "@/lib/i18n";

const AYAHS_TO_REVEAL = 5;

type Mode = "juz" | "surah";

export default function QuranPractice() {
  const { locale, setLocale, isRtl } = useLocale();
  const [mode, setMode] = useState<Mode>("juz");

  // Juz mode state
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null);

  // Surah mode state
  const [surahList, setSurahList] = useState<SurahListItem[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);

  // Shared state
  const [startingVerse, setStartingVerse] = useState<Verse | null>(null);
  const [hiddenVerses, setHiddenVerses] = useState<Verse[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [surahInfo, setSurahInfo] = useState<SurahInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch surah list on mount
  useEffect(() => {
    fetchAllSurahs().then(setSurahList).catch(() => {});
  }, []);

  const reset = () => {
    setStartingVerse(null);
    setHiddenVerses([]);
    setRevealedCount(0);
    setSurahInfo(null);
    setError(null);
  };

  const generateFromJuz = useCallback(async () => {
    if (!selectedJuz) return;

    setLoading(true);
    setError(null);
    reset();

    try {
      const verses = await fetchJuzVerses(selectedJuz);
      const startIdx = getRandomStartingIndex(verses.length, AYAHS_TO_REVEAL);

      const start = verses[startIdx];
      const hidden = verses.slice(
        startIdx + 1,
        startIdx + 1 + AYAHS_TO_REVEAL
      );

      setStartingVerse(start);
      setHiddenVerses(hidden);

      const { surah } = parsVerseKey(start.verse_key);
      const info = await fetchSurahInfo(surah);
      setSurahInfo(info);
    } catch {
      setError(ts("fetchError", locale));
    } finally {
      setLoading(false);
    }
  }, [selectedJuz, locale]);

  const generateFromSurah = useCallback(async () => {
    if (!selectedSurah) return;

    setLoading(true);
    setError(null);
    reset();

    try {
      const verses = await fetchChapterVerses(selectedSurah);
      const startIdx = getRandomStartingIndex(verses.length, AYAHS_TO_REVEAL);

      const start = verses[startIdx];
      const hidden = verses.slice(
        startIdx + 1,
        startIdx + 1 + AYAHS_TO_REVEAL
      );

      setStartingVerse(start);
      setHiddenVerses(hidden);

      const info = await fetchSurahInfo(selectedSurah);
      setSurahInfo(info);
    } catch {
      setError(ts("fetchError", locale));
    } finally {
      setLoading(false);
    }
  }, [selectedSurah, locale]);

  const generateAyah = mode === "juz" ? generateFromJuz : generateFromSurah;

  const canGenerate =
    mode === "juz" ? !!selectedJuz && !loading : !!selectedSurah && !loading;

  const revealAll = () => {
    setRevealedCount(hiddenVerses.length);
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 sm:py-12">
      {/* Language Toggle - top right */}
      <div className="w-full max-w-2xl flex justify-end mb-4">
        <button
          onClick={() => setLocale(locale === "en" ? "ar" : "en")}
          className="px-3 py-1.5 rounded-md text-sm font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {ts("langToggle", locale)}
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="font-arabic text-3xl sm:text-4xl font-bold text-foreground mb-2">
          {ts("title", locale)}
        </h1>
        <p className={`text-muted-foreground text-base sm:text-lg ${isRtl ? "font-arabic" : ""}`}>
          {ts("subtitle", locale)}
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted mb-6">
        <button
          onClick={() => {
            setMode("juz");
            setSelectedJuz(null);
            reset();
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
            mode === "juz"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          } ${isRtl ? "font-arabic" : ""}`}
        >
          {ts("byJuz", locale)}
        </button>
        <button
          onClick={() => {
            setMode("surah");
            setSelectedSurah(null);
            reset();
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
            mode === "surah"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          } ${isRtl ? "font-arabic" : ""}`}
        >
          {ts("bySurah", locale)}
        </button>
      </div>

      {/* Juz Selector */}
      {mode === "juz" && (
        <div className="w-full max-w-md mb-6 flex flex-col sm:flex-row sm:items-stretch gap-3">
          <Select
            dir={isRtl ? "rtl" : "ltr"}
            onValueChange={(value) => {
              setSelectedJuz(Number(value));
              reset();
            }}
          >
            <SelectTrigger className="flex-1 h-auto min-h-9 cursor-pointer">
              <SelectValue placeholder={ts("selectJuz", locale)} />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
                <SelectItem
                  key={juz}
                  value={String(juz)}
                  className="cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <span className="font-medium">
                      {ts("juzLabel", locale)} {juz}
                    </span>
                    <span className="text-muted-foreground font-arabic text-sm">
                      {JUZ_NAMES[juz]}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={generateAyah}
            disabled={!canGenerate}
            className="px-6 font-semibold cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner />
                {ts("loading", locale)}
              </span>
            ) : (
              ts("generateAyah", locale)
            )}
          </Button>
        </div>
      )}

      {/* Surah Selector */}
      {mode === "surah" && (
        <div className="w-full max-w-md mb-6 flex flex-col sm:flex-row sm:items-stretch gap-3">
          <Select
            dir={isRtl ? "rtl" : "ltr"}
            onValueChange={(value) => {
              setSelectedSurah(Number(value));
              reset();
            }}
          >
            <SelectTrigger className="flex-1 h-auto min-h-9 cursor-pointer">
              <SelectValue placeholder={ts("selectSurah", locale)} />
            </SelectTrigger>
            <SelectContent>
              {surahList.map((surah) => (
                <SelectItem
                  key={surah.id}
                  value={String(surah.id)}
                  className="cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs w-6 text-right">
                      {surah.id}.
                    </span>
                    <span className="font-medium">
                      {isRtl ? surah.name_arabic : surah.name_simple}
                    </span>
                    <span className="text-muted-foreground font-arabic text-sm">
                      {isRtl ? surah.name_simple : surah.name_arabic}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={generateAyah}
            disabled={!canGenerate}
            className="px-6 font-semibold cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner />
                {ts("loading", locale)}
              </span>
            ) : (
              ts("generateAyah", locale)
            )}
          </Button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="w-full max-w-2xl mb-6">
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="py-4 text-center text-destructive">
              {error}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Starting Verse */}
      {startingVerse && (
        <div className="w-full max-w-2xl space-y-4">
          {/* Surah Info Badge */}
          {surahInfo && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm">
                <span className="font-arabic text-base font-semibold">
                  {surahInfo.name_arabic}
                </span>
                <span className="text-muted-foreground">|</span>
                <span className="text-muted-foreground">
                  {surahInfo.name_simple}
                </span>
                <span className="text-muted-foreground">|</span>
                <span className="text-muted-foreground">
                  {ts("ayah", locale)}{" "}
                  {parsVerseKey(startingVerse.verse_key).ayah}
                </span>
              </div>
            </div>
          )}

          {/* Starting Ayah Card */}
          <Card className="border-2 border-primary/20 bg-card shadow-lg">
            <CardContent className="py-6 sm:py-8">
              <p className={`text-xs uppercase tracking-widest text-muted-foreground mb-4 text-center ${isRtl ? "font-arabic text-sm" : ""}`}>
                {ts("startReciting", locale)}
              </p>
              <p
                className="font-arabic text-2xl sm:text-3xl leading-[2.2] text-center text-foreground"
                dir="rtl"
              >
                {startingVerse.text_uthmani}
              </p>
              {startingVerse.translation && (
                <p className="text-center text-sm sm:text-base text-muted-foreground mt-4 leading-relaxed italic">
                  &ldquo;{startingVerse.translation}&rdquo;
                </p>
              )}
              <p className="text-center text-xs text-muted-foreground mt-3">
                {startingVerse.verse_key}
              </p>
            </CardContent>
          </Card>

          {/* Instruction */}
          {revealedCount === 0 && hiddenVerses.length > 0 && (
            <p className={`text-center text-muted-foreground text-sm sm:text-base animate-pulse ${isRtl ? "font-arabic" : ""}`}>
              {tf("reciteInstruction", locale)(hiddenVerses.length)}
            </p>
          )}

          {/* Hidden / Revealed Verses */}
          <div className="space-y-3">
            {hiddenVerses.map((verse, index) => {
              const isRevealed = index < revealedCount;
              const isNext = index === revealedCount;
              const { surah, ayah } = parsVerseKey(verse.verse_key);

              return (
                <Card
                  key={verse.id}
                  onClick={() => {
                    if (!isRevealed && isNext) {
                      setRevealedCount((prev) => prev + 1);
                    }
                  }}
                  className={`transition-all duration-500 ${
                    isRevealed
                      ? "border-green-500/30 bg-green-50/50 dark:bg-green-950/20"
                      : isNext
                        ? "border-dashed border-primary/40 hover:border-primary/60 hover:bg-primary/5 cursor-pointer"
                        : "border-dashed border-muted-foreground/20"
                  }`}
                >
                  <CardContent className="py-4 sm:py-6">
                    {isRevealed ? (
                      <div>
                        <p
                          className="font-arabic text-xl sm:text-2xl leading-[2.2] text-center text-foreground"
                          dir="rtl"
                        >
                          {verse.text_uthmani}
                        </p>
                        {verse.translation && (
                          <p className="text-center text-sm text-muted-foreground mt-3 leading-relaxed italic">
                            &ldquo;{verse.translation}&rdquo;
                          </p>
                        )}
                        <p className="text-center text-xs text-muted-foreground mt-2">
                          {surah}:{ayah}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 py-4 sm:py-6">
                        <div className="flex items-center gap-2 text-muted-foreground/50">
                          <LockIcon />
                          <span className={`text-sm ${isRtl ? "font-arabic" : ""}`}>
                            {tf("hiddenAyah", locale)(
                              index + 1,
                              hiddenVerses.length
                            )}
                          </span>
                        </div>
                        {isNext && (
                          <span className={`text-xs text-primary/70 font-medium ${isRtl ? "font-arabic" : ""}`}>
                            {ts("tapToReveal", locale)}
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Action Buttons */}
          {hiddenVerses.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              {revealedCount < hiddenVerses.length && (
                <Button
                  onClick={revealAll}
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 text-base cursor-pointer"
                >
                  {ts("revealAll", locale)}
                </Button>
              )}

              {revealedCount === hiddenVerses.length && (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckIcon />
                    <span className={`font-medium ${isRtl ? "font-arabic" : ""}`}>
                      {ts("allRevealed", locale)}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={generateAyah}
                      size="lg"
                      className="h-12 px-8 text-base font-semibold cursor-pointer"
                    >
                      {ts("generateAnother", locale)}
                    </Button>
                    <Button
                      onClick={() => reset()}
                      variant="outline"
                      size="lg"
                      className="h-12 px-8 text-base cursor-pointer"
                    >
                      {ts("reset", locale)}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!startingVerse && !loading && !error && (
        <div className="w-full max-w-md mt-8 sm:mt-16">
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="text-4xl mb-4 opacity-30">📖</div>
              <p className={`text-muted-foreground text-sm sm:text-base ${isRtl ? "font-arabic" : ""}`}>
                {mode === "juz"
                  ? ts("emptyJuz", locale)
                  : ts("emptySurah", locale)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto pt-12 text-center text-xs text-muted-foreground/50">
        {ts("footerText", locale)}{" "}
        <a
          href="https://quran.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-muted-foreground"
        >
          Quran.com API
        </a>
      </div>
    </div>
  );
}

// --- Inline SVG Icons ---

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
