/**
 * Admin TTS Editor — Professional narration quality control tool.
 * Allows the admin to:
 * 1. Select a lesson and listen to it sentence by sentence
 * 2. Click any word during playback to pause and open correction tools
 * 3. Fix pronunciation via: nikud, spelling change, phonetic override, speed/emphasis
 * 4. Preview the corrected sentence before saving
 * 5. Save corrections to the pronunciation overrides dictionary
 */
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useNlpAdminAuth } from "@/hooks/useNlpAdminAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

import { Link } from "wouter";
import {
  ArrowRight, Play, Pause, Square, SkipForward, SkipBack,
  Volume2, Pencil, Check, X, RotateCcw, Save, Loader2,
  ChevronDown, Mic, Type, BookOpen, Zap, Settings2,
} from "lucide-react";
import { lessons } from "@/lib/courseData";
import { splitIntoSentences } from "@/lib/naturalSpeech";
import { OpenAITtsController, getOpenAIVoiceForGender } from "@/lib/openaiTts";
import { NaturalSpeechController } from "@/lib/naturalSpeech";
import { useTtsSettings } from "@/hooks/useTtsSettings";

type FixMode = "nikud" | "spelling" | "phonetic" | "speed" | null;

export default function AdminTtsEditor() {
  const { ttsSettings } = useTtsSettings();
  const { loading: authLoading, hasAccess, ownerToken, adminToken } = useNlpAdminAuth();
  const isAdminViaOAuth = hasAccess;
  const trpcUtils = trpc.useUtils();
  const trpcClientRef = useRef(trpcUtils.client);

  // Lesson & slide selection
  const [selectedLessonId, setSelectedLessonId] = useState(1);
  const [selectedSlideIdx, setSelectedSlideIdx] = useState(0);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(-1);
  const [isGenerating, setIsGenerating] = useState(false);
  const controllerRef = useRef<OpenAITtsController | NaturalSpeechController | null>(null);

  // Word editing state
  const [selectedWordIdx, setSelectedWordIdx] = useState<number | null>(null);
  const [fixMode, setFixMode] = useState<FixMode>(null);
  const [editedText, setEditedText] = useState("");
  const [nikudResult, setNikudResult] = useState("");
  const [isLoadingNikud, setIsLoadingNikud] = useState(false);
  const [customSpeed, setCustomSpeed] = useState(1.0);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const previewCtrlRef = useRef<OpenAITtsController | NaturalSpeechController | null>(null);

  // Gender for voice
  const [gender, setGender] = useState<"male" | "female">(() =>
    (localStorage.getItem("tts-gender") as "male" | "female") || "female"
  );

  // Pronunciation overrides - load existing overrides to highlight corrected words
  const { data: existingOverrides } = trpc.pronunciationOverrides.getActive.useQuery();
  const overrideWordsSet = useMemo(() => {
    if (!existingOverrides) return new Set<string>();
    return new Set(existingOverrides.map(o => o.originalWord.trim().toLowerCase()));
  }, [existingOverrides]);

  // Check if a word has an existing override
  const hasOverride = useCallback((word: string) => {
    const cleaned = word.replace(/[.,;:!?\-"'()\[\]{}]/g, "").trim().toLowerCase();
    return overrideWordsSet.has(cleaned);
  }, [overrideWordsSet]);

  // Pronunciation overrides mutations
  const addOverrideMutation = trpc.pronunciationOverrides.add.useMutation({
    onSuccess: () => {
      trpcUtils.pronunciationOverrides.list.invalidate();
      trpcUtils.pronunciationOverrides.getActive.invalidate();
      toast.success("התיקון נשמר בהצלחה למילון החריגים!");
    },
    onError: (error) => {
      console.error("Save override error:", error);
      if (error.message?.includes("Duplicate") || error.message?.includes("duplicate") || error.message?.includes("UNIQUE")) {
        toast.error("המילה כבר קיימת במילון — עדכן אותה מדף מילון ההגייה");
      } else if (error.message?.includes("FORBIDDEN") || error.message?.includes("Admin only")) {
        toast.error("אין הרשאת מנהל — נא להתחבר מחדש");
      } else {
        toast.error(`שגיאה בשמירה: ${error.message}`);
      }
    },
  });

  // Get current lesson data
  const selectedLesson = useMemo(() => lessons.find(l => l.id === selectedLessonId) || lessons[0], [selectedLessonId]);

  // Build slides from lesson content (same logic as LessonPlayer)
  const slides = useMemo(() => {
    const result: { type: string; title?: string; text?: string; points?: string[] }[] = [];
    const c = selectedLesson.content;
    // Intro slide
    result.push({ type: "content", title: "מבוא", text: c.intro });
    // Section slides
    for (const section of c.sections) {
      result.push({ type: "content", title: section.title, text: section.text });
    }
    // Key points slide
    if (selectedLesson.keyPoints.length > 0) {
      result.push({ type: "keypoints", title: "נקודות מפתח", points: selectedLesson.keyPoints });
    }
    // Summary slide
    result.push({ type: "content", title: "סיכום", text: c.summary });
    return result;
  }, [selectedLesson]);

  // Get sentences for current slide
  const currentSentences = useMemo(() => {
    const slide = slides[selectedSlideIdx];
    if (!slide) return [];
    if (slide.type === "keypoints" && slide.points) return slide.points;
    return splitIntoSentences(slide.text || "");
  }, [slides, selectedSlideIdx]);

  // Get words for the selected sentence
  const currentWords = useMemo(() => {
    if (currentSentenceIdx < 0 || currentSentenceIdx >= currentSentences.length) return [];
    return currentSentences[currentSentenceIdx].split(/\s+/).filter(Boolean);
  }, [currentSentences, currentSentenceIdx]);

  // Stop all playback
  const stopAll = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.stop();
      controllerRef.current = null;
    }
    if (previewCtrlRef.current) {
      previewCtrlRef.current.stop();
      previewCtrlRef.current = null;
    }
    setIsPlaying(false);
    setIsPaused(false);
    setIsGenerating(false);
    setPreviewPlaying(false);
  }, []);

  // Play the current slide from the beginning or a specific sentence
  const playFromSentence = useCallback((startIdx = 0) => {
    stopAll();

    const slide = slides[selectedSlideIdx];
    if (!slide) return;

    const text = slide.type === "keypoints" ? (slide.points || []).join(". ") : (slide.text || "");
    if (!text.trim()) return;

    const s = ttsSettings;

    if (s.provider === "openai") {
      // OpenAI TTS path
      const controller = new OpenAITtsController(text, {
        voice: getOpenAIVoiceForGender(s.voice, gender),
        model: s.model,
        speed: s.openaiSpeed,
        mergeSpacedLetters: s.mergeSpacedLetters,
        stripNikudForTts: s.stripNikudForTts,
        sentencePause: s.sentencePause,
        onSentenceStart: (idx) => {
          setCurrentSentenceIdx(idx);
          setIsGenerating(false);
        },
        onEnd: () => {
          setIsPlaying(false);
          setIsPaused(false);
          setCurrentSentenceIdx(-1);
          setIsGenerating(false);
          controllerRef.current = null;
        },
        onError: () => {
          setIsPlaying(false);
          setIsPaused(false);
          setIsGenerating(false);
          controllerRef.current = null;
        },
        onGenerating: () => setIsGenerating(true),
        onReady: () => setIsGenerating(false),
      }, trpcClientRef.current);

      controllerRef.current = controller;
      setIsPlaying(true);
      setIsPaused(false);
      controller.play();
    } else {
      // Browser TTS (Web Speech API) path
      const controller = new NaturalSpeechController(text, {
        lang: "he-IL",
        rate: s.rate,
        pitch: s.pitch,
        sentencePause: s.sentencePause,
        commaPause: s.commaPause,
        mergeSpacedLetters: s.mergeSpacedLetters,
        stripNikudForTts: s.stripNikudForTts,
        onSentenceStart: (idx) => {
          setCurrentSentenceIdx(idx);
        },
        onEnd: () => {
          setIsPlaying(false);
          setIsPaused(false);
          setCurrentSentenceIdx(-1);
          controllerRef.current = null;
        },
        onError: () => {
          setIsPlaying(false);
          setIsPaused(false);
          controllerRef.current = null;
        },
      });

      controllerRef.current = controller;
      setIsPlaying(true);
      setIsPaused(false);
      controller.play();
    }
  }, [slides, selectedSlideIdx, ttsSettings, gender, stopAll]);

  // Pause playback
  const pausePlayback = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  }, []);

  // Resume playback
  const resumePlayback = useCallback(() => {
    if (controllerRef.current) {
      if (controllerRef.current instanceof OpenAITtsController) {
        if (!controllerRef.current.stopped) {
          controllerRef.current.play();
          setIsPaused(false);
          setIsPlaying(true);
        }
      } else {
        controllerRef.current.play();
        setIsPaused(false);
        setIsPlaying(true);
      }
    }
  }, []);

  // Handle word click — pause and open editor
  const handleWordClick = useCallback((wordIdx: number) => {
    // Pause if playing
    if (isPlaying && controllerRef.current) {
      controllerRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
    setSelectedWordIdx(wordIdx);
    setEditedText(currentWords[wordIdx] || "");
    setFixMode(null);
    setNikudResult("");
  }, [isPlaying, currentWords]);

  // Add nikud to the selected word
  const addNikudToWord = useCallback(async () => {
    if (!editedText.trim()) return;
    setIsLoadingNikud(true);
    try {
      const result = await trpcClientRef.current.nikud.addNikud.mutate({
        text: editedText,
        genre: "modern",
      });
      setNikudResult(result.text);
    } catch {
      setNikudResult(editedText);
    } finally {
      setIsLoadingNikud(false);
    }
  }, [editedText]);

  // Preview a single sentence with the fix applied
  const previewSentence = useCallback((textToSpeak: string) => {
    if (previewCtrlRef.current) {
      previewCtrlRef.current.stop();
      previewCtrlRef.current = null;
    }
    setPreviewPlaying(true);

    const s = ttsSettings;

    if (s.provider === "openai") {
      const controller = new OpenAITtsController(textToSpeak, {
        voice: getOpenAIVoiceForGender(s.voice, gender),
        model: s.model,
        speed: fixMode === "speed" ? customSpeed : s.openaiSpeed,
        mergeSpacedLetters: s.mergeSpacedLetters,
        stripNikudForTts: false, // Keep nikud for preview so we hear the effect
        sentencePause: 0,
        onEnd: () => { setPreviewPlaying(false); previewCtrlRef.current = null; },
        onError: () => { setPreviewPlaying(false); previewCtrlRef.current = null; },
      }, trpcClientRef.current);

      previewCtrlRef.current = controller;
      controller.play();
    } else {
      const controller = new NaturalSpeechController(textToSpeak, {
        lang: "he-IL",
        rate: s.rate,
        pitch: s.pitch,
        mergeSpacedLetters: s.mergeSpacedLetters,
        stripNikudForTts: false,
        sentencePause: 0,
        commaPause: 0,
        onEnd: () => { setPreviewPlaying(false); previewCtrlRef.current = null; },
        onError: () => { setPreviewPlaying(false); previewCtrlRef.current = null; },
      });

      previewCtrlRef.current = controller;
      controller.play();
    }
  }, [ttsSettings, gender, fixMode, customSpeed]);

  // Preview the current sentence with the word replaced
  const previewWithFix = useCallback(() => {
    if (currentSentenceIdx < 0 || selectedWordIdx === null) return;
    const sentence = currentSentences[currentSentenceIdx];
    const words = sentence.split(/\s+/).filter(Boolean);
    const replacement = fixMode === "nikud" ? (nikudResult || editedText) : editedText;
    words[selectedWordIdx] = replacement;
    previewSentence(words.join(" "));
  }, [currentSentenceIdx, selectedWordIdx, currentSentences, fixMode, nikudResult, editedText, previewSentence]);

  // Save the correction as a pronunciation override
    const saveCorrection = useCallback(() => {
    console.log("[TTS Save] Starting save...", { selectedWordIdx, currentSentenceIdx, fixMode, editedText, nikudResult });
    if (selectedWordIdx === null || currentSentenceIdx < 0) {
      toast.error("לא נבחרה מילה לתיקון");
      return;
    }
    const originalWord = currentWords[selectedWordIdx];
    const replacement = fixMode === "nikud" ? (nikudResult || editedText) : editedText;
    console.log("[TTS Save] originalWord:", JSON.stringify(originalWord), "replacement:", JSON.stringify(replacement));
    if (!originalWord || !replacement) {
      toast.error("חסרים נתונים — בחר מילה והזן תיקון");
      return;
    }
    if (originalWord === replacement) {
      toast.error("התיקון זהה למילה המקורית — שנה את הטקסט לפני שמירה");
      return;
    }

    // Strip punctuation from originalWord for cleaner storage
    const cleanOriginal = originalWord.replace(/[.,;:!?\-"'()\[\]{}]/g, "").trim();
    const cleanReplacement = replacement.trim();

    if (!cleanOriginal || !cleanReplacement) {
      toast.error("המילה או התיקון ריקים לאחר ניקוי");
      return;
    }

    addOverrideMutation.mutate({
      originalWord: cleanOriginal,
      replacement: cleanReplacement,
      note: `תוקן מעורך ההקראה — שיעור ${selectedLessonId}, שקופית ${selectedSlideIdx + 1}`,
    }, {
      onSuccess: () => {
        // Clear editing state only after successful save
        setSelectedWordIdx(null);
        setFixMode(null);
        setEditedText("");
        setNikudResult("");
      },
    });
  }, [selectedWordIdx, currentSentenceIdx, currentWords, fixMode, nikudResult, editedText, selectedLessonId, selectedSlideIdx, addOverrideMutation]);

  // Cancel editing
  const cancelEdit = useCallback(() => {
    setSelectedWordIdx(null);
    setFixMode(null);
    setEditedText("");
    setNikudResult("");
    if (previewCtrlRef.current) {
      previewCtrlRef.current.stop();
      previewCtrlRef.current = null;
    }
    setPreviewPlaying(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll();
    };
  }, [stopAll]);

  // Reset state when slide changes
  useEffect(() => {
    stopAll();
    setCurrentSentenceIdx(-1);
    setSelectedWordIdx(null);
    setFixMode(null);
  }, [selectedSlideIdx, selectedLessonId, stopAll]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground" dir="rtl">
        <div className="text-center">
          <p className="mb-4">יש להתחבר עם חשבון הבעלים כדי לגשת לדף זה.</p>
          <Link href="/nlp" className="text-amber-500 underline">חזרה לקורס</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mic className="w-6 h-6 text-amber-500" />
              <h1 className="text-xl font-bold">עורך הקראה מתקדם</h1>
            </div>
            <Link href="/nlp/admin" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              חזרה לדשבורד
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            שמע את השיעור, לחץ על מילה בעייתית, תקן ושמור — התיקון יחול אוטומטית בכל ההקראות הבאות
          </p>
        </div>
      </div>

      <div className="container py-6 max-w-5xl mx-auto">
        {/* Lesson & Slide Selector */}
        <div className="bg-card border border-border rounded-lg p-4 mb-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Lesson selector */}
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <select
                value={selectedLessonId}
                onChange={(e) => { setSelectedLessonId(Number(e.target.value)); setSelectedSlideIdx(0); }}
                className="px-3 py-1.5 rounded-md border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
              >
                {lessons.map(l => (
                  <option key={l.id} value={l.id}>שיעור {l.id}: {l.title}</option>
                ))}
              </select>
            </div>

            {/* Slide selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">שקופית:</span>
              <select
                value={selectedSlideIdx}
                onChange={(e) => setSelectedSlideIdx(Number(e.target.value))}
                className="px-3 py-1.5 rounded-md border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
              >
                {slides.map((s, i) => (
                  <option key={i} value={i}>{i + 1}. {s.title || `שקופית ${i + 1}`}</option>
                ))}
              </select>
            </div>

            {/* Gender toggle */}
            <div className="flex items-center gap-2 mr-auto">
              <button
                onClick={() => { const g = gender === "male" ? "female" : "male"; setGender(g); localStorage.setItem("tts-gender", g); }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${gender === "male" ? "bg-blue-500/20 text-blue-300 border border-blue-500/50" : "bg-pink-500/20 text-pink-300 border border-pink-500/50"}`}
              >
                {gender === "male" ? "🗣️ קול גברי" : "🗣️ קול נשי"}
              </button>
            </div>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="bg-card border border-border rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            {/* Play/Pause/Stop */}
            <button
              onClick={() => isPlaying ? pausePlayback() : isPaused ? resumePlayback() : playFromSentence(0)}
              className="w-10 h-10 rounded-full bg-amber-500 text-black flex items-center justify-center hover:bg-amber-400 transition-all active:scale-95"
              title={isPlaying ? "השהה" : "הפעל"}
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 mr-[-2px]" />
              )}
            </button>

            <button
              onClick={stopAll}
              disabled={!isPlaying && !isPaused}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-all disabled:opacity-30"
              title="עצור"
            >
              <Square className="w-4 h-4" />
            </button>

            {/* Skip controls */}
            <button
              onClick={() => setSelectedSlideIdx(Math.max(0, selectedSlideIdx - 1))}
              disabled={selectedSlideIdx === 0}
              className="p-2 rounded hover:bg-muted transition-colors disabled:opacity-30"
              title="שקופית קודמת"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedSlideIdx(Math.min(slides.length - 1, selectedSlideIdx + 1))}
              disabled={selectedSlideIdx >= slides.length - 1}
              className="p-2 rounded hover:bg-muted transition-colors disabled:opacity-30"
              title="שקופית הבאה"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Status */}
            <div className="flex-1 text-sm text-muted-foreground">
              {isGenerating && <span className="text-amber-400 animate-pulse">⏳ מכין אודיו...</span>}
              {isPlaying && !isGenerating && <span className="text-green-400">🔊 מקריא — משפט {currentSentenceIdx + 1}/{currentSentences.length}</span>}
              {isPaused && <span className="text-yellow-400">⏸ מושהה — לחץ על מילה לתיקון</span>}
              {!isPlaying && !isPaused && !isGenerating && <span>לחץ ▶ להתחיל הקראה</span>}
            </div>

            {/* Slide info */}
            <span className="text-xs text-muted-foreground">
              שקופית {selectedSlideIdx + 1}/{slides.length}
            </span>
          </div>
        </div>

        {/* Sentences Display — Interactive */}
        <div className="bg-card border border-border rounded-lg p-5 mb-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Type className="w-4 h-4" />
            טקסט השקופית — לחץ על מילה לתיקון
          </h3>

          <div className="space-y-3">
            {currentSentences.map((sentence, sIdx) => (
              <div
                key={sIdx}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  sIdx === currentSentenceIdx
                    ? "border-amber-500/70 bg-amber-500/10 shadow-[0_0_12px_rgba(240,192,64,0.2)]"
                    : "border-transparent hover:border-border hover:bg-muted/30"
                }`}
                onClick={() => {
                  // Click on sentence to play from that point
                  if (!isPlaying && !isPaused) {
                    setCurrentSentenceIdx(sIdx);
                  }
                }}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs text-muted-foreground mt-1 w-5 shrink-0">{sIdx + 1}.</span>
                  <div className="flex flex-wrap gap-1 leading-relaxed text-base">
                    {sentence.split(/\s+/).filter(Boolean).map((word, wIdx) => (
                      <span
                        key={wIdx}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (sIdx === currentSentenceIdx || !isPlaying) {
                            if (sIdx !== currentSentenceIdx) setCurrentSentenceIdx(sIdx);
                            handleWordClick(wIdx);
                          }
                        }}
                        className={`px-1.5 py-0.5 rounded cursor-pointer transition-all active:scale-90 ${
                          sIdx === currentSentenceIdx && wIdx === selectedWordIdx
                            ? "bg-amber-500 text-black font-bold scale-105 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] ring-2 ring-amber-300"
                            : hasOverride(word)
                              ? "bg-emerald-500/20 text-emerald-400 border-b-2 border-emerald-500 hover:bg-emerald-500/30 active:bg-emerald-500/50"
                              : sIdx === currentSentenceIdx
                                ? "hover:bg-amber-500/30 hover:text-amber-100 active:bg-amber-500/50"
                                : "hover:bg-muted active:bg-muted/80"
                        }`}
                        title={hasOverride(word) ? "תוקן במילון החריגים" : undefined}
                      >
                        {word}
                        {hasOverride(word) && <Check className="inline w-3 h-3 mr-0.5 text-emerald-500" />}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Play this sentence button */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      previewSentence(sentence);
                    }}
                    className="text-xs text-muted-foreground hover:text-amber-400 flex items-center gap-1 transition-colors"
                  >
                    <Play className="w-3 h-3" /> השמע משפט
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Word Editor Panel — Shows when a word is selected */}
        {selectedWordIdx !== null && currentSentenceIdx >= 0 && (
          <div className="bg-card border-2 border-amber-500/50 rounded-lg p-5 mb-4 shadow-[0_0_20px_rgba(240,192,64,0.15)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-500" />
                תיקון מילה: <span className="text-amber-400 font-mono">{currentWords[selectedWordIdx]}</span>
              </h3>
              <button onClick={cancelEdit} className="p-1.5 rounded hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Fix mode tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => { setFixMode("nikud"); setEditedText(currentWords[selectedWordIdx] || ""); }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 active:scale-95 ${
                  fixMode === "nikud" ? "bg-amber-500 text-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] ring-2 ring-amber-400/50" : "bg-muted hover:bg-muted/80"
                }`}
              >
                <Type className="w-3.5 h-3.5" /> הוסף ניקוד
              </button>
              <button
                onClick={() => { setFixMode("spelling"); setEditedText(currentWords[selectedWordIdx] || ""); }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 active:scale-95 ${
                  fixMode === "spelling" ? "bg-amber-500 text-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] ring-2 ring-amber-400/50" : "bg-muted hover:bg-muted/80"
                }`}
              >
                <Pencil className="w-3.5 h-3.5" /> שנה כתיב
              </button>
              <button
                onClick={() => { setFixMode("phonetic"); setEditedText(currentWords[selectedWordIdx] || ""); }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 active:scale-95 ${
                  fixMode === "phonetic" ? "bg-amber-500 text-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] ring-2 ring-amber-400/50" : "bg-muted hover:bg-muted/80"
                }`}
              >
                <Mic className="w-3.5 h-3.5" /> תחליף פונטי
              </button>
              <button
                onClick={() => { setFixMode("speed"); setCustomSpeed(ttsSettings.openaiSpeed); }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 active:scale-95 ${
                  fixMode === "speed" ? "bg-amber-500 text-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] ring-2 ring-amber-400/50" : "bg-muted hover:bg-muted/80"
                }`}
              >
                <Zap className="w-3.5 h-3.5" /> מהירות/הדגשה
              </button>
            </div>

            {/* Fix mode content */}
            {fixMode === "nikud" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  הוסף ניקוד למילה כדי לשפר את ההגייה. המערכת תשתמש ב-Dicta API לניקוד אוטומטי, או שתוכל לערוך ידנית.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-foreground text-lg font-mono focus:ring-2 focus:ring-amber-500/50 outline-none"
                    dir="rtl"
                  />
                  <button
                    onClick={addNikudToWord}
                    disabled={isLoadingNikud}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50 transition-all flex items-center gap-1.5"
                  >
                    {isLoadingNikud ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    נקד אוטומטי
                  </button>
                </div>
                {nikudResult && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-md">
                    <span className="text-sm text-muted-foreground">תוצאה: </span>
                    <span className="text-lg font-mono text-green-300">{nikudResult}</span>
                  </div>
                )}
              </div>
            )}

            {fixMode === "spelling" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  שנה את הכתיב של המילה — הוסף או הסר אותיות כדי לשפר את ההגייה.
                  לדוגמה: "שלום" → "שָׁלוֹם" או "NLP" → "אן אל פי"
                </p>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground whitespace-nowrap">מקור:</div>
                  <span className="px-2 py-1 bg-muted rounded font-mono">{currentWords[selectedWordIdx]}</span>
                  <div className="text-sm text-muted-foreground whitespace-nowrap">→ תיקון:</div>
                  <input
                    type="text"
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-foreground text-lg font-mono focus:ring-2 focus:ring-amber-500/50 outline-none"
                    dir="rtl"
                  />
                </div>
              </div>
            )}

            {fixMode === "phonetic" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  הכנס תחליף פונטי — כתוב את המילה כפי שהיא צריכה להישמע.
                  המערכת תחליף את המילה המקורית בתחליף לפני שליחה ל-TTS.
                </p>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground whitespace-nowrap">מקור:</div>
                  <span className="px-2 py-1 bg-muted rounded font-mono">{currentWords[selectedWordIdx]}</span>
                  <div className="text-sm text-muted-foreground whitespace-nowrap">→ נשמע כ:</div>
                  <input
                    type="text"
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    placeholder='למשל: "פרוגרמינג" → "פרוגראמינג"'
                    className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-foreground text-lg font-mono focus:ring-2 focus:ring-amber-500/50 outline-none"
                    dir="rtl"
                  />
                </div>
              </div>
            )}

            {fixMode === "speed" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  שנה את מהירות ההקראה למשפט זה. מהירות נמוכה יותר מדגישה את המילים.
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">מהירות:</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={customSpeed}
                    onChange={(e) => setCustomSpeed(Number(e.target.value))}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="text-sm font-mono w-12 text-center">{customSpeed.toFixed(1)}x</span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            {fixMode && (
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
                <button
                  onClick={previewWithFix}
                  disabled={previewPlaying}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50 transition-all flex items-center gap-1.5 active:scale-95"
                >
                  {previewPlaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                  השמע עם תיקון
                </button>

                {fixMode !== "speed" && (
                  <button
                    onClick={saveCorrection}
                    disabled={addOverrideMutation.isPending || !(editedText.trim() || nikudResult.trim())}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 disabled:opacity-50 transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    {addOverrideMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    שמור תיקון למילון
                  </button>
                )}

                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-all flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" /> ביטול
                </button>

                {addOverrideMutation.isSuccess && (
                  <span className="text-sm text-green-400 flex items-center gap-1">
                    <Check className="w-4 h-4" /> נשמר!
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="bg-muted/30 border border-border rounded-lg p-4 text-sm text-muted-foreground">
          <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-amber-500" />
            טיפים לשימוש
          </h4>
          <ul className="space-y-1 list-disc list-inside">
            <li>לחץ ▶ כדי להתחיל הקראה — המשפט המוקרא יודגש בזהב</li>
            <li>לחץ על כל מילה כדי לעצור ולפתוח את כלי התיקון</li>
            <li><strong>ניקוד</strong> — מוסיף ניקוד אוטומטי (Dicta API) לשיפור הגייה</li>
            <li><strong>שינוי כתיב</strong> — שנה את האיות (למשל הוסף אותיות)</li>
            <li><strong>תחליף פונטי</strong> — כתוב את המילה כפי שצריך להישמע (למשל מילים באנגלית)</li>
            <li><strong>מהירות</strong> — שנה מהירות למשפט ספציפי לשמיעה מדויקת</li>
            <li>לחץ "השמע עם תיקון" לבדוק לפני שמירה</li>
            <li>התיקונים נשמרים במילון החריגים ומשפיעים על כל ההקראות העתידיות</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
