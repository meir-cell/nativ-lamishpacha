// LessonPlayer — TTS + Auto-Advancing Slides
// Uses Web Speech API (works on iOS, Android, all browsers)
// Design: Academy Dark Gold | RTL Hebrew
// Feature: Real-time sentence highlighting during reading

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, Square, Volume2, VolumeX,
  ChevronLeft, ChevronRight, Download, Loader2,
  Star, Award, Brain, Headphones,
  Target, Users, Eye, Ear, Hand, MessageSquare, Anchor, Shield,
  Clock, Layers, Zap, RefreshCw, BarChart3, BookOpen, Lightbulb, Heart,
  BookOpenCheck, FlaskConical,
} from "lucide-react";
import type { Lesson } from "@/lib/courseData";
import { getLessonDuration } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { TTS_LANGUAGES, filterVoicesByGender } from "@/lib/ttsConfig";
import { NaturalSpeechController, splitIntoSentences } from "@/lib/naturalSpeech";
import { OpenAITtsController, getOpenAIVoiceForGender } from "@/lib/openaiTts";
import { useTtsSettings } from "@/hooks/useTtsSettings";
import TalkingAvatar from "./TalkingAvatar";

// Map icon name string → Lucide component
const ICON_MAP: Record<string, React.ElementType> = {
  Brain, Target, Users, Eye, Ear, Hand, MessageSquare, Anchor, Shield,
  Clock, Layers, Zap, RefreshCw, BarChart3, BookOpen, Lightbulb, Heart,
  Star, Award, Headphones,
};

interface LessonPlayerProps {
  lesson: Lesson;
  /** Slide index to start at (for resume-where-you-left-off) */
  initialSlide?: number;
  /** Called whenever the user navigates to a different slide */
  onSlideChange?: (slideIndex: number) => void;
}

// splitToSentences removed — now using splitIntoSentences from naturalSpeech.ts
// to ensure the same splitting logic is used for both TTS and UI highlighting.

// TTS config is imported from @/lib/ttsConfig (kept separate for Vite Fast Refresh compatibility)

export default function LessonPlayer({ lesson, initialSlide = 0, onSlideChange }: LessonPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [volumeBoost, setVolumeBoost] = useState<number>(() => {
    const saved = localStorage.getItem("tts-volume-boost");
    return saved ? parseFloat(saved) : 2.0;
  });
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [progress, setProgress] = useState(0);
  const [highlightedSentence, setHighlightedSentence] = useState(-1);
  // TTS selectors (persisted in localStorage)
  const [ttsLang, setTtsLang] = useState<string>(() => localStorage.getItem("tts-lang") || "he-IL");
  const [ttsGender, setTtsGender] = useState<"female" | "male">(
    () => (localStorage.getItem("tts-gender") as "female" | "male") || "female"
  );
  const [isTranslating, setIsTranslating] = useState(false);
  const [isDownloadingExpanded, setIsDownloadingExpanded] = useState(false);
  const [expandMode, setExpandMode] = useState(false);
  const [expandedText, setExpandedText] = useState<string | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);
  const [avatarMinimized, setAvatarMinimized] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const expandCacheRef = useRef<Map<string, string>>(new Map());
  const expandMutate = trpc.expandSlide.expand.useMutation();
  const { ttsSettings } = useTtsSettings();
  const ttsSettingsRef = useRef(ttsSettings);
  const trpcUtils = trpc.useUtils();
  const trpcClientRef = useRef(trpcUtils.client);
  // Fetch approved research sections for this lesson (for narration of highlights)
  const { data: extraContent } = trpc.lessonUpdates.getExtraContent.useQuery(
    { lessonId: lesson.id },
    { staleTime: 60_000 }
  );
  // Extract only sections that have a highlight (short Hebrew summary)
  const researchHighlights = useMemo(() => {
    if (!extraContent?.sections) return [];
    return extraContent.sections
      .filter((s: any) => s.highlight && s.highlight.trim())
      .map((s: any) => ({ title: s.title, highlight: s.highlight }));
  }, [extraContent]);
  const expandModeRef = useRef(false);
  const expandedTextRef = useRef<string | null>(null);
  // Ref copies so speakSlide closure always reads latest values
  const ttsLangRef = useRef<string>("he-IL");
  const ttsGenderRef = useRef<"female" | "male">("female");
  // Translation cache: key = `${lang}:${slideIndex}`, value = translated text
  const translationCacheRef = useRef<Map<string, string>>(new Map());

  const slideTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const currentSlideRef = useRef(0);
  const isMutedRef = useRef(false);
  const speedRef = useRef(1.0);
  const volumeBoostRef = useRef((() => {
    const saved = localStorage.getItem("tts-volume-boost");
    return saved ? parseFloat(saved) : 2.0;
  })());
  const highlightIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const highlightElapsedRef = useRef(0);
  const highlightReadTimeRef = useRef(0);

  // Sync ttsSettings ref
  useEffect(() => { ttsSettingsRef.current = ttsSettings; }, [ttsSettings]);
  // Sync expand refs
  useEffect(() => { expandModeRef.current = expandMode; }, [expandMode]);
  useEffect(() => { expandedTextRef.current = expandedText; }, [expandedText]);
  // Sync refs whenever state changes so speakSlide always reads latest values
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => {
    volumeBoostRef.current = volumeBoost;
    localStorage.setItem("tts-volume-boost", String(volumeBoost));
  }, [volumeBoost]);
  useEffect(() => {
    ttsLangRef.current = ttsLang;
    localStorage.setItem("tts-lang", ttsLang);
    // Clear translation cache when language changes
    translationCacheRef.current.clear();
    stopAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsLang]);
  useEffect(() => {
    ttsGenderRef.current = ttsGender;
    localStorage.setItem("tts-gender", ttsGender);
    stopAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsGender]);

  // Build slides from lesson
  const slides = useMemo(() => {
    const baseSlides = [
      { type: "title" as const, title: lesson.title, subtitle: lesson.subtitle, duration: lesson.duration, slideImage: lesson.slideImage },
      ...lesson.content.sections.map((s) => ({
        type: "content" as const, title: s.title, text: s.text, highlight: s.highlight, example: s.example, icon: s.icon, slideImage: lesson.slideImage,
      })),
      { type: "keypoints" as const, title: "נקודות מפתח", points: lesson.keyPoints, slideImage: lesson.slideImage },
      { type: "summary" as const, title: "סיכום", text: lesson.content.summary, slideImage: lesson.slideImage },
    ];
    // Add research highlights slide if there are approved research sections with highlights
    if (researchHighlights.length > 0) {
      const highlightsText = researchHighlights.map((r: any) => r.highlight).join(". ");
      baseSlides.push({
        type: "research" as any,
        title: "מחקרים עדכניים",
        text: highlightsText,
        highlights: researchHighlights,
        slideImage: lesson.slideImage,
      } as any);
    }
    return baseSlides;
  }, [lesson, researchHighlights]);

  // Text per slide — for content/summary slides, speak ONLY the text body
  // so that NaturalSpeechController sentence indices align with the highlighted text on screen.
  // Title/highlight/example are spoken separately or not highlighted.
  const slideTexts = useMemo(() => {
    const texts = [
      `שיעור ${lesson.id}: ${lesson.title}. ${lesson.subtitle}. ${lesson.content.intro}`,
      ...lesson.content.sections.map((s) => s.example ? `${s.text} לדוגמה: ${s.example}` : s.text),
      lesson.keyPoints.join(". "),
      lesson.content.summary,
    ];
    // Add research highlights narration text
    if (researchHighlights.length > 0) {
      texts.push(researchHighlights.map((r: any) => r.highlight).join(". "));
    }
    return texts;
  }, [lesson, researchHighlights]);

  // Additional spoken prefix for content slides (title + highlight) that is spoken
  // BEFORE the highlighted body text. This keeps the sentence indices aligned.
  const slideSpokenPrefix = useMemo(() => {
    const prefixes = [
      "", // title slide has no prefix
      ...lesson.content.sections.map((s) =>
        `${s.title}. ${s.highlight ? s.highlight + ". " : ""}`
      ),
      "נקודות מפתח: ", // keypoints prefix
      "סיכום: ", // summary prefix
    ];
    // Add prefix for research slide
    if (researchHighlights.length > 0) {
      prefixes.push("מחקרים עדכניים: ");
    }
    return prefixes;
  }, [lesson, researchHighlights]);

  // Pre-split sentences for each slide for highlighting
  // MUST use the same splitIntoSentences function that NaturalSpeechController uses
  // so that onSentenceStart(idx) matches the displayed sentence at that index.
  const slideSentences = useMemo(() => {
    return slides.map((slide, idx) => {
      if (slide.type === "content") {
        const text = (slide as any).text || "";
        const example = (slide as any).example;
        const fullText = example ? `${text} לדוגמה: ${example}` : text;
        return splitIntoSentences(fullText);
      } else if (slide.type === "keypoints") {
        return (slide as any).points || [];
      } else if (slide.type === "summary") {
        return splitIntoSentences((slide as any).text || "");
      } else if ((slide as any).type === "research") {
        return splitIntoSentences((slide as any).text || "");
      }
      return [];
    });
  }, [slides]);

  // WPM for current language
  const currentWpm = useMemo(() => {
    // Estimate WPM from rate multiplier (base 120 WPM for Hebrew, 150 for English)
    const cfg = TTS_LANGUAGES.find(l => l.code === ttsLang);
    const baseWpm = ttsLang === "he-IL" ? 120 : 150;
    return cfg ? Math.round(baseWpm * cfg.rate) : 120;
  }, [ttsLang]);

  // Estimate reading time per slide (ms) based on word count
  const getReadingTime = (text: string) => {
    const words = text.split(/\s+/).length;
    return Math.max(3000, (words / (currentWpm * speedRef.current)) * 60 * 1000);
  };

  // Calculate total estimated duration, adjusted for current playback speed
  const estimatedDuration = useMemo(() => {
    const allText = [
      `${lesson.title} ${lesson.subtitle} ${lesson.content.intro}`,
      ...lesson.content.sections.map(s => `${s.title} ${s.highlight || ""} ${s.text} ${s.example || ""}`),
      lesson.keyPoints.join(" "),
      lesson.content.summary,
      // Include research highlights in duration estimate
      ...researchHighlights.map((r: any) => r.highlight),
    ].join(" ");
    const words = allText.split(/\s+/).length;
    const minutes = Math.ceil(words / (currentWpm * speed));
    return `כ-${minutes} דקות`;
  }, [lesson, speed, currentWpm, researchHighlights]);

  // Fetch expanded explanation when expandMode is on or slide changes
  useEffect(() => {
    if (!expandMode) { setExpandedText(null); return; }
    const slide = slides[currentSlide];
    const cacheKey = `${lesson.id}:${currentSlide}`;
    const cached = expandCacheRef.current.get(cacheKey);
    if (cached) { setExpandedText(cached); return; }
    const slideTitle = (slide as any).title ?? "";
    const slideText = (slide as any).text ?? (slide as any).points?.join(". ") ?? "";
    if (!slideText) { setExpandedText(null); return; }
    setIsExpanding(true);
    setExpandedText(null);
    expandMutate.mutateAsync({
      slideTitle,
      slideText,
      lessonTitle: lesson.title,
    }).then(res => {
      const text = typeof res.expandedText === "string" ? res.expandedText : String(res.expandedText);
      expandCacheRef.current.set(cacheKey, text);
      setExpandedText(text);
    }).catch(() => {
      setExpandedText("לא ניתן לטעון הסבר מורחב כרגע.");
    }).finally(() => setIsExpanding(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandMode, currentSlide, lesson.id]);

  useEffect(() => {
    return () => stopAll();
  }, []);

  useEffect(() => {
    stopAll();
    setCurrentSlide(0);
    currentSlideRef.current = 0;
    setProgress(0);
    setHighlightedSentence(-1);
  }, [lesson.id]);

  const clearTimers = (clearHighlight = true) => {
    slideTimersRef.current.forEach(clearTimeout);
    slideTimersRef.current = [];
    if (clearHighlight && highlightIntervalRef.current) {
      clearInterval(highlightIntervalRef.current);
      highlightIntervalRef.current = null;
    }
  };

  const pauseHighlighting = () => {
    if (highlightIntervalRef.current) {
      clearInterval(highlightIntervalRef.current);
      highlightIntervalRef.current = null;
    }
  };

  const resumeHighlighting = () => {
    const slideIndex = currentSlideRef.current;
    const sentences = slideSentences[slideIndex];
    if (!sentences || sentences.length === 0) return;

    const totalReadTime = highlightReadTimeRef.current;
    const wordCounts = sentences.map((s: string) => s.split(/\s+/).length);
    const totalWords = wordCounts.reduce((a: number, b: number) => a + b, 0);
    const timings = wordCounts.map((w: number) => (w / Math.max(totalWords, 1)) * totalReadTime);

    let elapsed = highlightElapsedRef.current;
    const interval = setInterval(() => {
      elapsed += 200;
      highlightElapsedRef.current = elapsed;
      let cumulativeTime = 0;
      for (let i = 0; i < timings.length; i++) {
        cumulativeTime += timings[i];
        if (elapsed < cumulativeTime) {
          setHighlightedSentence(i);
          break;
        }
      }
    }, 200);
    highlightIntervalRef.current = interval;
  };

  const stopAll = useCallback(() => {
    clearTimers();
    // Stop OpenAI TTS controller if active
    const openaiCtrl = (window as any).__openaiTtsController as OpenAITtsController | undefined;
    if (openaiCtrl) { openaiCtrl.stop(); (window as any).__openaiTtsController = undefined; }
    // Stop natural speech controller if active
    const ctrl = (window as any).__naturalSpeechController as NaturalSpeechController | undefined;
    if (ctrl) { ctrl.stop(); (window as any).__naturalSpeechController = undefined; }
    try { window.speechSynthesis?.cancel(); } catch {}
    setIsPlaying(false);
    setIsPaused(false);
    setIsGeneratingAudio(false);
    setHighlightedSentence(-1);
  }, []);

  /**
   * Attach onboundary listener to an utterance so the highlight tracks the
   * exact word being spoken.  Falls back to the old interval approach on
   * browsers that don’t fire onboundary (e.g. some Android WebViews).
   */
  const attachBoundaryHighlight = useCallback(
    (utterance: SpeechSynthesisUtterance, slideIndex: number, totalReadTime: number) => {
      const sentences = slideSentences[slideIndex];
      if (!sentences || sentences.length === 0) return;

      // Build cumulative char-offset boundaries for each sentence
      const offsets: number[] = [];
      let pos = 0;
      for (const s of sentences) {
        offsets.push(pos);
        pos += s.length + 1; // +1 for the space between sentences
      }

      let boundaryFired = false;

      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        if (event.name !== "word" && event.name !== "sentence") return;
        boundaryFired = true;
        const charIdx = event.charIndex;
        // Use charLength (if available) to find the center of the spoken word/phrase
        // This gives more accurate sentence detection than charIndex alone
        const charLen = (event as SpeechSynthesisEvent & { charLength?: number }).charLength ?? 0;
        const midChar = charIdx + Math.floor(charLen / 2);
        // Find which sentence contains this char position
        let sentIdx = 0;
        for (let i = offsets.length - 1; i >= 0; i--) {
          if (midChar >= offsets[i]) { sentIdx = i; break; }
        }
        setHighlightedSentence(sentIdx);
      };

      // Fallback: if onboundary never fires after 1.5 s, use the old interval
      const fallbackTimer = setTimeout(() => {
        if (boundaryFired) return;
        // interval fallback
        highlightReadTimeRef.current = totalReadTime;
        highlightElapsedRef.current = 0;
        const wordCounts = sentences.map((s: string) => s.split(/\s+/).length);
        const totalWords = wordCounts.reduce((a: number, b: number) => a + b, 0);
        const timings = wordCounts.map((w: number) => (w / Math.max(totalWords, 1)) * totalReadTime);
        setHighlightedSentence(0);
        let elapsed = 0;
        const interval = setInterval(() => {
          elapsed += 200;
          highlightElapsedRef.current = elapsed;
          let cum = 0;
          for (let i = 0; i < timings.length; i++) {
            cum += timings[i];
            if (elapsed < cum) { setHighlightedSentence(i); break; }
          }
        }, 200);
        highlightIntervalRef.current = interval;
      }, 1500);
      slideTimersRef.current.push(fallbackTimer);
    },
    [slideSentences]
  );

  // Keep startHighlighting as a thin wrapper so existing call-sites still work
  const startHighlighting = useCallback((slideIndex: number, totalReadTime: number) => {
    // Will be wired via attachBoundaryHighlight when utterance is available;
    // this path is only reached for the no-TTS fallback timer branch.
    const sentences = slideSentences[slideIndex];
    if (!sentences || sentences.length === 0) { setHighlightedSentence(-1); return; }
    highlightReadTimeRef.current = totalReadTime;
    highlightElapsedRef.current = 0;
    const wordCounts = sentences.map((s: string) => s.split(/\s+/).length);
    const totalWords = wordCounts.reduce((a: number, b: number) => a + b, 0);
    const timings = wordCounts.map((w: number) => (w / Math.max(totalWords, 1)) * totalReadTime);
    setHighlightedSentence(0);
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 200;
      highlightElapsedRef.current = elapsed;
      let cum = 0;
      for (let i = 0; i < timings.length; i++) {
        cum += timings[i];
        if (elapsed < cum) { setHighlightedSentence(i); break; }
      }
    }, 200);
    highlightIntervalRef.current = interval;
  }, [slideSentences]);

  const speakSlide = useCallback(
    (slideIndex: number) => {
      if (slideIndex >= slides.length) {
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(100);
        setHighlightedSentence(-1);
        return;
      }

      currentSlideRef.current = slideIndex;
      setCurrentSlide(slideIndex);
      onSlideChange?.(slideIndex);
      setProgress(Math.round((slideIndex / slides.length) * 100));
      setHighlightedSentence(-1);

      // Clear previous highlight interval
      if (highlightIntervalRef.current) {
        clearInterval(highlightIntervalRef.current);
        highlightIntervalRef.current = null;
      }

      // Use expanded text if expand mode is on and text is ready
      const rawText = slideTexts[slideIndex] || "";
      const text = (expandModeRef.current && expandedTextRef.current) ? expandedTextRef.current : rawText;
      const prefix = slideSpokenPrefix[slideIndex] || "";
      const readTime = getReadingTime(prefix + text);

      // Highlight is now driven by onSentenceStart from NaturalSpeechController.
      // The controller speaks ONLY the body text (matching slideSentences),
      // so sentence indices are perfectly aligned with the highlighted UI.

      const onDone = () => {
        setHighlightedSentence(-1);
        if (highlightIntervalRef.current) {
          clearInterval(highlightIntervalRef.current);
          highlightIntervalRef.current = null;
        }
        const t = setTimeout(() => speakSlide(slideIndex + 1), 400);
        slideTimersRef.current.push(t);
      };

      // ===== OpenAI TTS Provider =====
      if (ttsSettingsRef.current.provider === "openai") {
        // Stop any existing OpenAI controller to prevent duplicate voices
        const prevCtrl = (window as any).__openaiTtsController as OpenAITtsController | undefined;
        if (prevCtrl) { prevCtrl.stop(); (window as any).__openaiTtsController = undefined; }
        // Stop any browser speech
        try { window.speechSynthesis?.cancel(); } catch {}

        const fullText = prefix ? `${prefix} ${text}` : text;
        const s = ttsSettingsRef.current;
        const currentLang = ttsLangRef.current;
        const langBase = currentLang.split("-")[0].toLowerCase();
        const isHebrew = langBase === "he" || langBase === "iw";

        const startOpenAIPlayback = (textToSpeak: string) => {
          const selectedVoice = getOpenAIVoiceForGender(s.voice, ttsGenderRef.current);
          console.log(`[TTS] Creating controller: configVoice=${s.voice}, gender=${ttsGenderRef.current}, selectedVoice=${selectedVoice}`);
          const controller = new OpenAITtsController(textToSpeak, {
            voice: selectedVoice,
            model: s.model,
            speed: s.openaiSpeed * speedRef.current,
            volume: volumeBoostRef.current,
            lang: currentLang,
            mergeSpacedLetters: isHebrew ? s.mergeSpacedLetters : false,
            stripNikudForTts: isHebrew ? s.stripNikudForTts : false,
            sentencePause: s.sentencePause,
            onSentenceStart: (idx) => {
              // For OpenAI TTS, sentence indices include the prefix text.
              // The prefix is typically 1 sentence, so offset accordingly.
              const prefixSentenceCount = prefix.trim() ? splitIntoSentences(prefix).length : 0;
              const bodyIdx = idx - prefixSentenceCount;
              if (bodyIdx >= 0) {
                setHighlightedSentence(bodyIdx);
              }
            },
            onEnd: () => { setIsGeneratingAudio(false); onDone(); },
            onError: () => {
              setIsGeneratingAudio(false);
              // Fallback: advance after estimated read time
              const t = setTimeout(() => speakSlide(slideIndex + 1), readTime);
              slideTimersRef.current.push(t);
            },
            onGenerating: () => setIsGeneratingAudio(true),
            onReady: () => setIsGeneratingAudio(false),
          }, trpcClientRef.current);

          (window as any).__openaiTtsController = controller;
          controller.play();
        };

        if (isHebrew) {
          // Hebrew — send directly (server applies pronunciation overrides)
          startOpenAIPlayback(fullText);
        } else {
          // Non-Hebrew — translate first, then speak
          const cacheKey = `openai:${currentLang}:${slideIndex}`;
          const cached = translationCacheRef.current.get(cacheKey);
          if (cached) {
            startOpenAIPlayback(cached);
          } else {
            setIsGeneratingAudio(true);
            fetch("/api/trpc/slideTranslate.translateSlide", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                json: { text: fullText.slice(0, 2000), targetLang: currentLang },
              }),
            })
              .then(r => r.json())
              .then((data: any) => {
                const translated: string = data?.result?.data?.json?.translatedText ?? fullText;
                translationCacheRef.current.set(cacheKey, translated);
                // Only speak if still on same slide and same language
                if (currentSlideRef.current === slideIndex && ttsLangRef.current === currentLang) {
                  startOpenAIPlayback(translated);
                } else {
                  setIsGeneratingAudio(false);
                }
              })
              .catch(() => {
                setIsGeneratingAudio(false);
                // Fallback: speak original Hebrew text
                startOpenAIPlayback(fullText);
              });
          }
        }
        return;
      }

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();

        const speakText = (textToSpeak: string) => {
          const langCfg = TTS_LANGUAGES.find(l => l.code === ttsLangRef.current) ?? TTS_LANGUAGES[0];

          // Get all voices for this language (including iw- prefix for Hebrew)
          const allVoices = window.speechSynthesis.getVoices();
          const langBase = ttsLangRef.current.split("-")[0].toLowerCase();
          const langVoices = allVoices.filter(v => {
            const vBase = v.lang.split("-")[0].toLowerCase();
            return v.lang === ttsLangRef.current || vBase === langBase ||
              (langBase === "he" && (v.lang.startsWith("iw") || vBase === "he"));
          });

          // Pick voice by gender using hint-based matching
          const genderedVoices = filterVoicesByGender(langVoices, langCfg, ttsGenderRef.current);
          const chosenVoice = genderedVoices[0] ?? langVoices[0];

          // Speak the body text with NaturalSpeechController — sentence indices
          // are aligned with slideSentences used for highlighting.
          const startBodySpeech = () => {
            const s = ttsSettingsRef.current;
            const controller = new NaturalSpeechController(textToSpeak, {
              lang: ttsLangRef.current,
              rate: Math.min(Math.max(speedRef.current, 0.5), 2.0) * (s.rate / 0.88) * 0.92,
              pitch: s.pitch,
              voice: chosenVoice ?? null,
              sentencePause: s.sentencePause,
              commaPause: s.commaPause,
              mergeSpacedLetters: s.mergeSpacedLetters,
              stripNikudForTts: s.stripNikudForTts,
              onSentenceStart: (idx) => {
                // Highlight corresponding sentence — perfectly synced
                setHighlightedSentence(idx);
              },
              onEnd: () => {
                onDone();
              },
              onError: () => {
                const t = setTimeout(() => speakSlide(slideIndex + 1), readTime);
                slideTimersRef.current.push(t);
              },
            });

            // Store controller ref for pause/stop
            (window as any).__naturalSpeechController = controller;
            controller.play();
          };

          // If there's a prefix (title/highlight), speak it first without highlighting,
          // then start the body speech with highlighting.
          if (prefix.trim()) {
            const sP = ttsSettingsRef.current;
            const prefixUtterance = new SpeechSynthesisUtterance(prefix);
            prefixUtterance.lang = ttsLangRef.current;
            prefixUtterance.rate = Math.min(Math.max(speedRef.current, 0.5), 2.0) * (sP.rate / 0.88) * 0.92;
            prefixUtterance.pitch = sP.pitch;
            if (chosenVoice) prefixUtterance.voice = chosenVoice;
            prefixUtterance.onend = () => {
              // Pause after prefix, then start body
              const t = setTimeout(() => startBodySpeech(), sP.prefixPause);
              slideTimersRef.current.push(t);
            };
            prefixUtterance.onerror = () => {
              // On error, just start body speech
              startBodySpeech();
            };
            window.speechSynthesis.speak(prefixUtterance);
          } else {
            startBodySpeech();
          }
        };

        const doSpeak = (textToSpeak: string) => {
          // Wait for voices to load (important on Android)
          const voices = window.speechSynthesis.getVoices();
          if (voices.length > 0) {
            speakText(textToSpeak);
          } else {
            let fired = false;
            window.speechSynthesis.onvoiceschanged = () => {
              if (fired) return;
              fired = true;
              window.speechSynthesis.onvoiceschanged = null;
              speakText(textToSpeak);
            };
            const t = setTimeout(() => { if (!fired) { fired = true; speakText(textToSpeak); } }, 1000);
            slideTimersRef.current.push(t);
          }
        };

        const currentLang = ttsLangRef.current;
        if (currentLang === "he-IL") {
          // Hebrew — add nikud for better pronunciation, then speak
          const nikudCacheKey = `nikud:${slideIndex}`;
          const cachedNikud = translationCacheRef.current.get(nikudCacheKey);
          if (cachedNikud) {
            doSpeak(cachedNikud);
          } else {
            fetch("/api/trpc/nikud.addNikud", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ json: { text: text.slice(0, 5000) } }),
            })
              .then(r => r.json())
              .then((data: any) => {
                const nikudText: string = data?.result?.data?.json?.text ?? text;
                translationCacheRef.current.set(nikudCacheKey, nikudText);
                if (currentSlideRef.current === slideIndex && ttsLangRef.current === currentLang) {
                  doSpeak(nikudText);
                }
              })
              .catch(() => {
                doSpeak(text); // fallback to original text on error
              });
          }
        } else {
          // Non-Hebrew — translate first, then speak
          const cacheKey = `${currentLang}:${slideIndex}`;
          const cached = translationCacheRef.current.get(cacheKey);
          if (cached) {
            doSpeak(cached);
          } else {
            setIsTranslating(true);
            // Call translation API via fetch (can't use tRPC hooks inside useCallback)
            fetch("/api/trpc/slideTranslate.translateSlide", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                json: { text: text.slice(0, 2000), targetLang: currentLang },
              }),
            })
              .then(r => r.json())
              .then((data: any) => {
                const translated: string = data?.result?.data?.json?.translatedText ?? text;
                translationCacheRef.current.set(cacheKey, translated);
                setIsTranslating(false);
                // Only speak if still on same slide and same language
                if (currentSlideRef.current === slideIndex && ttsLangRef.current === currentLang) {
                  doSpeak(translated);
                }
              })
              .catch(() => {
                setIsTranslating(false);
                doSpeak(text); // fallback to Hebrew on error
              });
          }
        }
      } else {
        // No TTS available — advance by time with interval-based highlight
        startHighlighting(slideIndex, readTime);
        const t = setTimeout(() => speakSlide(slideIndex + 1), readTime);
        slideTimersRef.current.push(t);
      }
    },
    [slides.length, slideTexts, slideSpokenPrefix, startHighlighting, attachBoundaryHighlight]
  );

  const handlePlay = () => {
    if (isPaused) {
      // Resume OpenAI TTS controller if active (and not stopped)
      const openaiCtrl = (window as any).__openaiTtsController as OpenAITtsController | undefined;
      if (openaiCtrl && !openaiCtrl.stopped) { openaiCtrl.play(); setIsPaused(false); setIsPlaying(true); return; }
      // Resume natural speech controller if active
      const ctrl = (window as any).__naturalSpeechController as NaturalSpeechController | undefined;
      if (ctrl) { ctrl.play(); } else { try { window.speechSynthesis?.resume(); } catch {} }
      setIsPaused(false);
      setIsPlaying(true);
      // Resume highlighting from where it paused
      resumeHighlighting();
      return;
    }
    clearTimers();
    // Stop any existing controllers
    const existingOpenai = (window as any).__openaiTtsController as OpenAITtsController | undefined;
    if (existingOpenai) { existingOpenai.stop(); (window as any).__openaiTtsController = undefined; }
    const existingCtrl = (window as any).__naturalSpeechController as NaturalSpeechController | undefined;
    if (existingCtrl) { existingCtrl.stop(); (window as any).__naturalSpeechController = undefined; }
    try { window.speechSynthesis?.cancel(); } catch {}
    setIsPlaying(true);
    setIsPaused(false);
    speakSlide(currentSlide);
  };

  const handlePause = () => {
    // Pause highlighting but keep the elapsed time
    pauseHighlighting();
    // Clear advance timers but not highlight (already paused above)
    clearTimers(false);
    // Pause OpenAI TTS controller if active
    const openaiCtrl = (window as any).__openaiTtsController as OpenAITtsController | undefined;
    if (openaiCtrl) { openaiCtrl.pause(); }
    // Pause natural speech controller if active
    const ctrl = (window as any).__naturalSpeechController as NaturalSpeechController | undefined;
    if (ctrl) { ctrl.pause(); }
    try { window.speechSynthesis?.pause(); } catch {}
    setIsPaused(true);
    setIsPlaying(false);
  };

  const handleStop = () => {
    stopAll();
    setCurrentSlide(0);
    currentSlideRef.current = 0;
    setProgress(0);
  };

  const goToSlide = (idx: number) => {
    stopAll();
    setCurrentSlide(idx);
    currentSlideRef.current = idx;
    onSlideChange?.(idx);
  };

  const translateMutation = trpc.lessonTranslate.translateLesson.useMutation();

  /** Download concise (original) lesson text */
  const handleDownloadConcise = async () => {
    if (ttsLang === "he-IL") {
      const lines = [
        `קורס NLP Practitioner`,
        `שיעור ${lesson.id}: ${lesson.title} — ${lesson.subtitle}`,
        `משך: ${lesson.duration}`,
        ``,
        `מבוא:`,
        lesson.content.intro,
        ``,
        ...lesson.content.sections.flatMap((s) => [
          `── ${s.title} ──`,
          s.highlight ? `✨ ${s.highlight}` : "",
          s.text,
          s.example ? `לדוגמה: ${s.example}` : "",
          ``,
        ]),
        `── נקודות מפתח ──`,
        ...lesson.keyPoints.map((p) => `◆ ${p}`),
        ``,
        `── סיכום ──`,
        lesson.content.summary,
        ``,
        `── תרגולים ──`,
        ...lesson.exercises.map((e, i) => `${i + 1}. ${e}`),
      ];
      const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `שיעור_${lesson.id}_${lesson.title}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // Other language — translate via LLM then download
    setIsTranslating(true);
    try {
      const result = await translateMutation.mutateAsync({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        lessonSubtitle: lesson.subtitle,
        lessonDuration: lesson.duration,
        intro: lesson.content.intro,
        sections: lesson.content.sections.map((s) => ({
          title: s.title,
          highlight: s.highlight,
          text: s.text,
          example: s.example,
        })),
        keyPoints: lesson.keyPoints,
        summary: lesson.content.summary,
        exercises: lesson.exercises,
        targetLang: ttsLang,
      });
      const blob = new Blob([result.text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lesson_${lesson.id}_${result.title.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Translation failed:", err);
      alert("תרגום נכשל. נסה שוב.");
    } finally {
      setIsTranslating(false);
    }
  };

  /** Download expanded (AI) lesson text */
  const handleDownloadExpanded = async () => {
    setIsDownloadingExpanded(true);
    try {
      const expandedLines: string[] = [
        `קורס NLP Practitioner — הסבר מורחב`,
        `שיעור ${lesson.id}: ${lesson.title} — ${lesson.subtitle}`,
        ``,
      ];

      // Process all slides in parallel for faster download
      const expandPromises = slides.map(async (slide, i) => {
        const cacheKey = `${lesson.id}:${i}`;
        let text = expandCacheRef.current.get(cacheKey);
        if (!text) {
          const slideTitle = (slide as any).title ?? "";
          const slideText = (slide as any).text ?? (slide as any).points?.join(". ") ?? "";
          if (slideText) {
            try {
              const res = await fetch("/api/trpc/expandSlide.expand", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  json: {
                    slideTitle,
                    slideText: slideText.slice(0, 3000),
                    lessonTitle: lesson.title,
                  },
                }),
              });
              if (res.ok) {
                const data = await res.json();
                const expanded = data?.result?.data?.json?.expandedText;
                text = typeof expanded === "string" ? expanded : slideTexts[i];
                expandCacheRef.current.set(cacheKey, text);
              } else {
                text = slideTexts[i];
              }
            } catch {
              text = slideTexts[i];
            }
          } else {
            text = slideTexts[i];
          }
        }
        return { index: i, title: (slide as any).title ?? `שקופית ${i + 1}`, text: text ?? slideTexts[i] };
      });

      const results = await Promise.all(expandPromises);
      // Sort by index to maintain order
      results.sort((a, b) => a.index - b.index);

      for (const r of results) {
        expandedLines.push(`── ${r.title} ──`);
        expandedLines.push(r.text);
        expandedLines.push(``);
      }

      const blob = new Blob([expandedLines.join("\n")], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `שיעור_${lesson.id}_${lesson.title}_מורחב.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download expanded failed:", err);
    } finally {
      setIsDownloadingExpanded(false);
    }
  };

  const slide = slides[currentSlide];
  const currentSentences = slideSentences[currentSlide] || [];

  /** Render text with sentence highlighting */
  const renderHighlightedText = (text: string, sentences: string[]) => {
    if (!isPlaying || highlightedSentence < 0 || sentences.length === 0) {
      return <span>{text}</span>;
    }

    return (
      <>
        {sentences.map((sentence, idx) => (
          <span
            key={idx}
            style={{
              background: idx === highlightedSentence ? "rgba(240, 192, 64, 0.55)" : "transparent",
              borderRadius: idx === highlightedSentence ? "4px" : "0",
              padding: idx === highlightedSentence ? "2px 5px" : "0",
              transition: "background 0.25s ease, padding 0.25s ease, border 0.25s ease",
              boxShadow: idx === highlightedSentence ? "0 0 12px rgba(240, 192, 64, 0.45)" : "none",
              border: idx === highlightedSentence ? "1px solid rgba(240, 192, 64, 0.7)" : "1px solid transparent",
              color: idx === highlightedSentence ? "#1a1400" : "inherit",
              fontWeight: idx === highlightedSentence ? "600" : "inherit",
            }}
          >
            {sentence}{idx < sentences.length - 1 ? " " : ""}
          </span>
        ))}
      </>
    );
  };

  /** Render key points with highlighting */
  const renderHighlightedPoints = (points: string[]) => {
    return points.map((point, i) => (
      <motion.li
        key={i}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.1 }}
        className="flex items-start gap-2.5 text-sm md:text-base rounded-md px-2 py-1"
        style={{
          color: "oklch(0.82 0.005 65)",
          background: (isPlaying && i === highlightedSentence) ? "rgba(240, 192, 64, 0.50)" : "transparent",
          transition: "background 0.3s ease",
        }}
      >
        <span style={{ color: "#C9A84C" }} className="mt-0.5 flex-shrink-0">◆</span>
        {point}
      </motion.li>
    ));
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "oklch(0.12 0.012 265)",
        border: "1px solid oklch(0.22 0.015 265)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {/* ── SLIDE AREA ── */}
      <div
        className="relative"
        style={{
          minHeight: "300px",
          background: "linear-gradient(135deg, oklch(0.13 0.015 265), oklch(0.10 0.01 265))",
        }}
      >
        {/* Playing / Generating wave indicator */}
        {(isPlaying || isGeneratingAudio) && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
            {isGeneratingAudio ? (
              /* Generating state: pulsing dots */
              <>
                <Loader2 size={16} className="animate-spin" style={{ color: "#F0C040" }} />
                <span className="text-xs font-bold" style={{ color: "#F0C040" }}>מכין אודיו...</span>
              </>
            ) : (
              /* Playing state: wave bars */
              <>
                <div className="flex items-end gap-0.5 h-5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 rounded-full"
                      style={{ background: "#F0C040" }}
                      animate={{ height: ["4px", `${10 + i * 4}px`, "4px"] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold" style={{ color: "#F0C040" }}>מקריא...</span>
              </>
            )}
          </div>
        )}

        {/* Slide counter */}
        <div
          className="absolute top-3 left-3 text-xs px-2 py-1 rounded-lg z-10"
          style={{ background: "rgba(0,0,0,0.5)", color: "oklch(0.60 0.01 265)" }}
        >
          {currentSlide + 1} / {slides.length}
        </div>

        {/* Slide content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="p-6 md:p-8 flex flex-col justify-center"
            style={{ minHeight: "300px" }}
          >
            {slide.type === "title" && (
              <div className="text-center">
                {((slide as any).slideImage || lesson.thumbnail) && (
                  <div className="mb-4 mx-auto overflow-hidden rounded-2xl" style={{ width: 260, height: 150 }}>
                    <img
                      src={(slide as any).slideImage || lesson.thumbnail}
                      alt={lesson.title}
                      className="w-full h-full object-cover"
                      style={{ filter: "brightness(0.9) saturate(1.15)" }}
                    />
                  </div>
                )}
                {!((slide as any).slideImage || lesson.thumbnail) && (
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: "linear-gradient(135deg, #C9A84C, #F0C040)" }}
                  >
                    <Brain size={26} className="text-black" />
                  </div>
                )}
                <p className="text-sm font-bold mb-2" style={{ color: "#C9A84C" }}>
                  שיעור {lesson.id}
                </p>
                <h2 className="text-2xl md:text-3xl font-black mb-2" style={{ color: "#F0C040" }}>
                  {(slide as any).title}
                </h2>
                <p className="text-lg text-muted-foreground mb-3">{(slide as any).subtitle}</p>
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.3)" }}
                >
                  {estimatedDuration}
                </span>
              </div>
            )}

            {slide.type === "content" && (
              <div className="relative">
                {(slide as any).slideImage && (
                  <div
                    className="float-left ml-0 mr-4 mb-2 overflow-hidden rounded-xl"
                    style={{ width: 110, height: 70, flexShrink: 0 }}
                  >
                    <img
                      src={(slide as any).slideImage}
                      alt=""
                      className="w-full h-full object-cover"
                      style={{ filter: "brightness(0.8) saturate(1.1)" }}
                    />
                  </div>
                )}
                {(slide as any).icon && (() => {
                  const IconComp = ICON_MAP[(slide as any).icon];
                  return IconComp ? (
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)" }}
                    >
                      <IconComp size={20} style={{ color: "#C9A84C" }} />
                    </div>
                  ) : null;
                })()}
                <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: "#F0C040" }}>
                  {(slide as any).title}
                </h2>
                {(slide as any).highlight && (
                  <div
                    className="p-3 rounded-xl mb-3 text-sm font-semibold"
                    style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.35)", color: "#F0C040" }}
                  >
                    ✨ {(slide as any).highlight}
                  </div>
                )}
                <p className="text-sm md:text-base leading-relaxed whitespace-pre-line" style={{ color: "oklch(0.82 0.005 65)" }}>
                  {renderHighlightedText(
                    (slide as any).example ? `${(slide as any).text} לדוגמה: ${(slide as any).example}` : (slide as any).text,
                    currentSentences
                  )}
                </p>
              </div>
            )}

            {slide.type === "keypoints" && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: "#F0C040" }}>
                  <Star size={20} /> {(slide as any).title}
                </h2>
                <ul className="space-y-2.5">
                  {renderHighlightedPoints((slide as any).points as string[])}
                </ul>
              </div>
            )}

            {slide.type === "summary" && (
              <div className="text-center">
                <Award size={36} className="mx-auto mb-3" style={{ color: "#F0C040" }} />
                <h2 className="text-xl font-bold mb-3" style={{ color: "#F0C040" }}>
                  {(slide as any).title}
                </h2>
                <p className="text-sm md:text-base leading-relaxed" style={{ color: "oklch(0.82 0.005 65)" }}>
                  {renderHighlightedText((slide as any).text, currentSentences)}
                </p>
              </div>
            )}

            {(slide as any).type === "research" && (
              <div>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <FlaskConical size={24} style={{ color: "#F0C040" }} />
                  <h2 className="text-xl font-bold" style={{ color: "#F0C040" }}>
                    {(slide as any).title}
                  </h2>
                </div>
                <div className="space-y-3">
                  {((slide as any).highlights as { title: string; highlight: string }[]).map((item, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl text-sm"
                      style={{
                        background: "rgba(201,168,76,0.08)",
                        border: "1px solid rgba(201,168,76,0.25)",
                      }}
                    >
                      <span className="font-bold block mb-1" style={{ color: "#C9A84C", fontSize: "0.8rem" }}>
                        🔬 {item.title}
                      </span>
                      <span style={{ color: "oklch(0.82 0.005 65)" }}>{item.highlight}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed" style={{ color: "oklch(0.82 0.005 65)" }}>
                  {renderHighlightedText((slide as any).text, currentSentences)}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Slide dots */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 flex-wrap px-4" role="tablist" aria-label="נווט שקופיות">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className="rounded-full transition-all"
              style={{
                width: i === currentSlide ? "18px" : "6px",
                height: "6px",
                background: i === currentSlide ? "#F0C040" : "oklch(0.28 0.015 265)",
              }}
              role="tab"
              aria-label={`שקופית ${i + 1} מתוך ${slides.length}`}
              aria-selected={i === currentSlide}
            />
          ))}
        </div>
      </div>

      {/* ── PROGRESS BAR ── */}
      <div style={{ background: "oklch(0.10 0.01 265)", height: "3px" }}>
        <motion.div
          style={{ height: "100%", background: "linear-gradient(90deg, #C9A84C, #F0C040)" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* ── BIG PLAY BUTTON (mobile-friendly) ── */}
      <div
        className="px-4 py-4"
        style={{ background: "oklch(0.11 0.012 265)", borderTop: "1px solid oklch(0.18 0.015 265)" }}
      >
        {/* Avatar + controls layout */}
        <div className="flex items-end gap-4">

          {/* TalkingAvatar — shown when not minimized */}
          {!avatarMinimized && (
            <div className="flex-shrink-0 flex flex-col items-center gap-2">
              <TalkingAvatar
                isSpeaking={isPlaying}
                gender={ttsGender}
                isMinimized={false}
                onToggleMinimize={() => setAvatarMinimized(true)}
              />
              {/* Gender selector below avatar */}
              <div className="flex items-center gap-1">
                {([
                  { value: "female" as const, icon: "♀", label: "אשה" },
                  { value: "male"   as const, icon: "♂", label: "גבר" },
                ] as const).map(({ value, icon, label }) => (
                  <button
                    key={value}
                    onClick={() => setTtsGender(value)}
                    aria-pressed={ttsGender === value}
                    className="flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold transition-all"
                    style={{
                      background: ttsGender === value ? "rgba(201,168,76,0.18)" : "transparent",
                      color: ttsGender === value ? "#F0C040" : "oklch(0.42 0.01 265)",
                      border: ttsGender === value ? "1px solid rgba(201,168,76,0.45)" : "1px solid transparent",
                    }}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Right side: instruction + controls */}
          <div className="flex-1">

        {/* Main instruction text */}
        {!isPlaying && !isPaused && !isGeneratingAudio && (
          <p className="text-center text-sm mb-3 font-medium" style={{ color: "oklch(0.55 0.01 265)" }}>
            לחץ על "הפעל קריינות" כדי לשמוע את השיעור 👇
          </p>
        )}
        {isGeneratingAudio && (
          <p className="text-center text-sm mb-3 font-medium flex items-center justify-center gap-2" style={{ color: "#F0C040" }}>
            <Loader2 size={14} className="animate-spin" />
            מכין אודיו, אנא המתן...
          </p>
        )}

        {/* Controls row */}
        <div className="flex items-center justify-center gap-3 mb-3">
          {/* Prev slide */}
          <button
            onClick={() => goToSlide(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
            style={{ background: "oklch(0.18 0.015 265)", border: "1px solid oklch(0.24 0.015 265)" }}
            aria-label="שקופית קודמת"
          >
            <ChevronRight size={18} style={{ color: "oklch(0.65 0.01 265)" }} aria-hidden="true" />
          </button>

          {/* Stop (only when active) */}
          {(isPlaying || isPaused) && (
            <button
              onClick={handleStop}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              style={{ background: "oklch(0.18 0.015 265)", border: "1px solid oklch(0.24 0.015 265)" }}
              aria-label="עצור קריינות"
            >
              <Square size={14} style={{ color: "oklch(0.60 0.01 265)" }} aria-hidden="true" />
            </button>
          )}

          {/* ★ BIG PLAY / PAUSE BUTTON ★ */}
          <button
            onClick={isGeneratingAudio ? undefined : (isPlaying ? handlePause : handlePlay)}
            disabled={isGeneratingAudio}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-base transition-all active:scale-95 disabled:opacity-70 disabled:cursor-wait"
            style={{
              background: isGeneratingAudio ? "linear-gradient(135deg, #8a7a3a, #b0a040)" : "linear-gradient(135deg, #C9A84C, #F0C040)",
              color: "black",
              boxShadow: isPlaying ? "0 0 20px rgba(240,192,64,0.4)" : "0 4px 16px rgba(201,168,76,0.3)",
              minWidth: "140px",
            }}
            aria-label={isGeneratingAudio ? "מכין אודיו" : isPlaying ? "השה קריינות" : isPaused ? "המשך קריינות" : "הפעל קריינות"}
          >
            {isGeneratingAudio ? (
              <>
                <Loader2 size={20} className="animate-spin" aria-hidden="true" />
                מכין...
              </>
            ) : isPlaying ? (
              <>
                <Pause size={20} aria-hidden="true" />
                השהה
              </>
            ) : isPaused ? (
              <>
                <Play size={20} aria-hidden="true" />
                המשך
              </>
            ) : (
              <>
                <Headphones size={20} aria-hidden="true" />
                הפעל קריינות
              </>
            )}
          </button>

          {/* Next slide */}
          <button
            onClick={() => goToSlide(Math.min(slides.length - 1, currentSlide + 1))}
            disabled={currentSlide === slides.length - 1}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
            style={{ background: "oklch(0.18 0.015 265)", border: "1px solid oklch(0.24 0.015 265)" }}
            aria-label="שקופית הבאה"
          >
            <ChevronLeft size={18} style={{ color: "oklch(0.65 0.01 265)" }} aria-hidden="true" />
          </button>
        </div>

        {/* ── Unified Controls Row ── */}
        <div
          className="mt-3 rounded-xl px-3 py-2"
          style={{ background: "oklch(0.10 0.010 265)", border: "1px solid oklch(0.18 0.015 265)" }}
        >
          <div className="flex items-center gap-1.5 flex-wrap">

            {/* Speed buttons */}
            {[0.75, 1.0, 1.25, 1.5].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className="px-2 py-1 rounded-md text-xs font-bold transition-all"
                style={{
                  background: speed === s ? "rgba(201,168,76,0.2)" : "transparent",
                  color: speed === s ? "#F0C040" : "oklch(0.40 0.01 265)",
                  border: speed === s ? "1px solid rgba(201,168,76,0.4)" : "1px solid transparent",
                }}
                aria-label={`מהירות ${s}`}
              >
                {s}x
              </button>
            ))}

            {/* Divider */}
            <div className="w-px self-stretch" style={{ background: "oklch(0.20 0.015 265)", minHeight: "20px" }} />

            {/* Mute */}
            <button
              onClick={() => {
                const newMuted = !isMuted;
                isMutedRef.current = newMuted;
                setIsMuted(newMuted);
                if (isPlaying) {
                  clearTimers();
                  try { window.speechSynthesis?.cancel(); } catch {}
                  setTimeout(() => speakSlide(currentSlideRef.current), 80);
                }
              }}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:bg-white/5"
              aria-label={isMuted ? "הפעל קול" : "השתק קול"}
            >
              {isMuted
                ? <VolumeX size={13} style={{ color: "oklch(0.40 0.01 265)" }} />
                : <Volume2 size={13} style={{ color: "oklch(0.55 0.01 265)" }} />}
            </button>

            {/* Volume Boost Slider */}
            <div className="flex items-center gap-1.5 mr-1">
              <span className="text-[10px] font-bold" style={{ color: "oklch(0.45 0.01 265)" }}>🔊</span>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={volumeBoost}
                onChange={(e) => setVolumeBoost(parseFloat(e.target.value))}
                className="volume-slider"
                style={{ width: "70px", height: "4px", cursor: "pointer" }}
                aria-label="עוצמת קול"
                title={`עוצמה: x${volumeBoost.toFixed(1)}`}
              />
              <span className="text-[10px] font-bold min-w-[28px] text-center" style={{ color: "#6ab06a" }}>
                x{volumeBoost.toFixed(1)}
              </span>
            </div>

            {/* Divider */}
            <div className="w-px self-stretch" style={{ background: "oklch(0.20 0.015 265)", minHeight: "20px" }} />

            {/* Language */}
            {TTS_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setTtsLang(lang.code)}
                aria-pressed={ttsLang === lang.code}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition-all"
                style={{
                  background: ttsLang === lang.code ? "rgba(201,168,76,0.18)" : "transparent",
                  color: ttsLang === lang.code ? "#F0C040" : "oklch(0.42 0.01 265)",
                  border: ttsLang === lang.code ? "1px solid rgba(201,168,76,0.45)" : "1px solid transparent",
                }}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}



            {/* Divider */}
            <div className="w-px self-stretch" style={{ background: "oklch(0.20 0.015 265)", minHeight: "20px" }} />

            {/* Explanation mode: תמציתי */}
            <button
              onClick={() => { setExpandMode(false); setExpandedText(null); }}
              aria-pressed={!expandMode}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all"
              style={{
                background: !expandMode ? "rgba(201,168,76,0.18)" : "transparent",
                color: !expandMode ? "#F0C040" : "oklch(0.42 0.01 265)",
                border: !expandMode ? "1px solid rgba(201,168,76,0.45)" : "1px solid oklch(0.20 0.015 265)",
              }}
              aria-label="הסבר תמציתי"
            >
              📌 תמציתי
            </button>

            {/* Explanation mode: מורחב */}
            <button
              onClick={() => { setExpandMode(true); }}
              aria-pressed={expandMode}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all"
              style={{
                background: expandMode ? "rgba(201,168,76,0.18)" : "transparent",
                color: expandMode ? "#F0C040" : "oklch(0.42 0.01 265)",
                border: expandMode ? "1px solid rgba(201,168,76,0.45)" : "1px solid oklch(0.20 0.015 265)",
              }}
              aria-label="הסבר מורחב"
            >
              {isExpanding
                ? <><Loader2 size={11} className="animate-spin" /> מרחיב...</>
                : <>📖 מורחב</>}
            </button>

            {/* Divider */}
            <div className="w-px self-stretch" style={{ background: "oklch(0.20 0.015 265)", minHeight: "20px" }} />

            {/* Download concise */}
            <button
              onClick={handleDownloadConcise}
              disabled={isTranslating}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all disabled:opacity-50"
              style={{
                background: "transparent",
                color: isTranslating ? "#F0C040" : "oklch(0.42 0.01 265)",
                border: "1px solid oklch(0.20 0.015 265)",
              }}
              aria-label="הורד שיעור תמציתי"
            >
              {isTranslating
                ? <Loader2 size={11} className="animate-spin" />
                : <Download size={11} />}
              הורד תמציתי
            </button>

            {/* Download expanded */}
            <button
              onClick={handleDownloadExpanded}
              disabled={isDownloadingExpanded}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all disabled:opacity-50"
              style={{
                background: "transparent",
                color: isDownloadingExpanded ? "#F0C040" : "oklch(0.42 0.01 265)",
                border: "1px solid oklch(0.20 0.015 265)",
              }}
              aria-label="הורד שיעור מורחב"
            >
              {isDownloadingExpanded
                ? <Loader2 size={11} className="animate-spin" />
                : <Download size={11} />}
              הורד מורחב
            </button>

          </div>
        </div>

          </div> {/* end flex-1 right side */}
        </div> {/* end avatar + controls flex row */}

        {/* ── Expanded Explanation Panel ── */}
        {expandMode && (
          <div
            className="mt-3 rounded-xl p-4"
            style={{
              background: "oklch(0.10 0.012 265)",
              border: "1px solid rgba(201,168,76,0.25)",
            }}
          >
            {isExpanding && (
              <div className="flex items-center gap-2 mb-2">
                <Loader2 size={12} className="animate-spin" style={{ color: "#C9A84C" }} />
                <span className="text-xs" style={{ color: "oklch(0.52 0.01 265)" }}>טוען הסבר מורחב עם AI...</span>
              </div>
            )}

            {expandedText && !isExpanding && (
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "oklch(0.82 0.005 65)" }}>
                {expandedText}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Minimized avatar — floating button */}
      {avatarMinimized && (
        <TalkingAvatar
          isSpeaking={isPlaying}
          gender={ttsGender}
          isMinimized={true}
          onToggleMinimize={() => setAvatarMinimized(false)}
        />
      )}
    </div>
  );
}
