// LessonAudioPlayer — Compact audio bar for lesson narration
// Reads the lesson content aloud in Hebrew
// Design: Academy Dark Gold theme

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, Square, Volume2, VolumeX,
  ChevronDown, ChevronUp, Mic,
} from "lucide-react";
import { NaturalSpeechController } from "@/lib/naturalSpeech";
import { OpenAITtsController, getOpenAIVoiceForGender } from "@/lib/openaiTts";
import { trpc } from "@/lib/trpc";
import { useTtsSettings } from "@/hooks/useTtsSettings";

interface LessonAudioPlayerProps {
  text: string;
  lessonTitle: string;
}

export default function LessonAudioPlayer({ text, lessonTitle }: LessonAudioPlayerProps) {
  const { ttsSettings } = useTtsSettings();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentWord, setCurrentWord] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [supported, setSupported] = useState(true);
  const [hebrewVoice, setHebrewVoice] = useState<SpeechSynthesisVoice | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const wordsRef = useRef<string[]>([]);
  const wordIndexRef = useRef(0);
  const trpcUtils = trpc.useUtils();
  const trpcClientRef = useRef(trpcUtils.client);

  useEffect(() => {
    // Check browser TTS support — but OpenAI TTS doesn't need it
    if (!("speechSynthesis" in window) && ttsSettings.provider !== "openai") {
      setSupported(false);
      return;
    }

    if ("speechSynthesis" in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        // Try to find a Hebrew voice
        const heb = voices.find(
          (v) =>
            v.lang.startsWith("he") ||
            v.lang.startsWith("iw") ||
            v.name.toLowerCase().includes("hebrew") ||
            v.name.toLowerCase().includes("ivrit")
        );
        if (heb) {
          setHebrewVoice(heb);
        } else {
          // Fallback: use any available voice
          const fallback = voices.find((v) => v.default) || voices[0] || null;
          setHebrewVoice(fallback);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      try { window.speechSynthesis?.cancel(); } catch {}
    };
  }, [ttsSettings.provider]);

  // Update supported state when provider changes (OpenAI always supported)
  useEffect(() => {
    if (ttsSettings.provider === "openai") {
      setSupported(true);
    } else if (!("speechSynthesis" in window)) {
      setSupported(false);
    }
  }, [ttsSettings.provider]);

  // Stop when lesson changes
  useEffect(() => {
    stopSpeech();
    setProgress(0);
    setCurrentWord("");
    wordIndexRef.current = 0;
    nikudCacheRef.current = null; // Clear nikud cache for new text
  }, [text]);

  const stopSpeech = useCallback(() => {
    // Stop OpenAI controller
    const openaiCtrl = (window as any).__openaiAudioPlayerCtrl as OpenAITtsController | undefined;
    if (openaiCtrl) { openaiCtrl.stop(); (window as any).__openaiAudioPlayerCtrl = undefined; }
    // Stop browser controller
    if (controllerRef.current) { controllerRef.current.stop(); controllerRef.current = null; }
    try { window.speechSynthesis?.cancel(); } catch {}
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    setCurrentWord("");
    wordIndexRef.current = 0;
  }, []);

  const nikudCacheRef = useRef<string | null>(null);

  const controllerRef = useRef<NaturalSpeechController | null>(null);

  const doSpeakOpenAI = useCallback((textToSpeak: string) => {
    // Stop any existing OpenAI controller to prevent duplicate voices
    const prevCtrl = (window as any).__openaiAudioPlayerCtrl as OpenAITtsController | undefined;
    if (prevCtrl) { prevCtrl.stop(); (window as any).__openaiAudioPlayerCtrl = undefined; }
    const s = ttsSettings;
    // Use gender from localStorage to pick appropriate OpenAI voice
    const gender = (localStorage.getItem("tts-gender") as "male" | "female") || "female";
    const volumeBoostVal = parseFloat(localStorage.getItem("tts-volume-boost") || "2.0");
    const controller = new OpenAITtsController(textToSpeak, {
      voice: getOpenAIVoiceForGender(s.voice, gender),
      model: s.model,
      speed: s.openaiSpeed * speed,
      volume: volumeBoostVal,
      mergeSpacedLetters: s.mergeSpacedLetters,
      stripNikudForTts: s.stripNikudForTts,
      sentencePause: s.sentencePause,
      onSentenceStart: (idx) => {
        const totalSentences = controller.totalSentences;
        const prog = Math.min(100, Math.round(((idx + 1) / totalSentences) * 100));
        setProgress(prog);
        setCurrentWord(`משפט ${idx + 1}/${totalSentences}`);
      },
      onEnd: () => {
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(100);
        setCurrentWord("");
        (window as any).__openaiAudioPlayerCtrl = undefined;
      },
      onError: () => {
        setIsPlaying(false);
        setIsPaused(false);
        (window as any).__openaiAudioPlayerCtrl = undefined;
      },
    }, trpcClientRef.current);

    (window as any).__openaiAudioPlayerCtrl = controller;
    controller.play();
    setIsPlaying(true);
    setIsPaused(false);
  }, [speed, ttsSettings]);

  const doSpeak = useCallback((textToSpeak: string) => {
    const words = textToSpeak.split(/\s+/).filter(Boolean);
    wordsRef.current = words;
    wordIndexRef.current = 0;

    // Use NaturalSpeechController for sentence-by-sentence speaking
    const controller = new NaturalSpeechController(textToSpeak, {
      lang: "he-IL",
      rate: speed * (ttsSettings.rate / 0.88) * 0.92,
      pitch: ttsSettings.pitch,
      voice: hebrewVoice,
      sentencePause: ttsSettings.sentencePause,
      commaPause: ttsSettings.commaPause,
      mergeSpacedLetters: ttsSettings.mergeSpacedLetters,
      stripNikudForTts: ttsSettings.stripNikudForTts,
      onSentenceStart: (idx) => {
        // Approximate progress based on sentence index
        const totalSentences = controller.totalSentences;
        const prog = Math.min(100, Math.round(((idx + 1) / totalSentences) * 100));
        setProgress(prog);
        setCurrentWord(`משפט ${idx + 1}/${totalSentences}`);
      },
      onEnd: () => {
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(100);
        setCurrentWord("");
        controllerRef.current = null;
      },
      onError: () => {
        setIsPlaying(false);
        setIsPaused(false);
        controllerRef.current = null;
      },
    });

    controllerRef.current = controller;
    controller.play();
    setIsPlaying(true);
    setIsPaused(false);
  }, [speed, hebrewVoice, ttsSettings]);

  const startSpeech = useCallback(() => {
    if (!supported) return;
    try { window.speechSynthesis?.cancel(); } catch {}

    if (ttsSettings.provider === "openai") {
      // OpenAI TTS — speak directly (no nikud needed, OpenAI handles Hebrew well)
      doSpeakOpenAI(text);
      return;
    }

    // Browser TTS — add nikud for better pronunciation
    if (nikudCacheRef.current) {
      doSpeak(nikudCacheRef.current);
      return;
    }

    // Try to get nikud from server for better pronunciation
    fetch("/api/trpc/nikud.addNikud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ json: { text: text.slice(0, 5000) } }),
    })
      .then(r => r.json())
      .then((data: any) => {
        const nikudText: string = data?.result?.data?.json?.text ?? text;
        nikudCacheRef.current = nikudText;
        doSpeak(nikudText);
      })
      .catch(() => {
        doSpeak(text); // fallback to original text
      });
  }, [text, supported, doSpeak, doSpeakOpenAI, ttsSettings.provider]);

  const togglePlay = () => {
    if (!supported) return;

    if (isPlaying && !isPaused) {
      // Pause
      const openaiCtrl = (window as any).__openaiAudioPlayerCtrl as OpenAITtsController | undefined;
      if (openaiCtrl) { openaiCtrl.pause(); }
      else if (controllerRef.current) { controllerRef.current.pause(); }
      else { try { window.speechSynthesis?.pause(); } catch {} }
      setIsPaused(true);
      setIsPlaying(false);
    } else if (isPaused) {
      // Resume
      const openaiCtrl = (window as any).__openaiAudioPlayerCtrl as OpenAITtsController | undefined;
      if (openaiCtrl && !openaiCtrl.stopped) { openaiCtrl.play(); }
      else if (controllerRef.current) { controllerRef.current.play(); }
      else { try { window.speechSynthesis?.resume(); } catch {} }
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      startSpeech();
    }
  };

  const toggleMute = () => {
    setIsMuted((m) => {
      if (utteranceRef.current) {
        utteranceRef.current.volume = m ? 1 : 0;
      }
      return !m;
    });
  };

  const changeSpeed = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (isPlaying || isPaused) {
      stopSpeech();
      setTimeout(() => {
        startSpeech();
      }, 100);
    }
  };

  if (!supported) {
    return (
      <div
        className="p-3 rounded-xl text-sm text-center"
        style={{
          background: "oklch(0.14 0.012 265)",
          border: "1px solid oklch(0.20 0.015 265)",
          color: "oklch(0.55 0.01 265)",
        }}
      >
        הדפדפן שלך אינו תומך בקריינות קולית. נסה Chrome או Edge.
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "oklch(0.14 0.012 265)",
        border: "1px solid oklch(0.22 0.015 265)",
      }}
    >
      {/* Main player bar */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: isPlaying
              ? "linear-gradient(135deg, #C9A84C, #F0C040)"
              : "oklch(0.18 0.015 265)",
          }}
        >
          <Mic size={16} style={{ color: isPlaying ? "black" : "#C9A84C" }} />
        </div>

        {/* Info + progress */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold mb-1 truncate" style={{ color: "#F0C040" }}>
            {isPlaying ? `מקריא: ${currentWord}` : isPaused ? "מושהה" : `האזן לשיעור: ${lessonTitle}`}
          </p>
          {/* Progress bar */}
          <div
            className="w-full h-1.5 rounded-full cursor-pointer"
            style={{ background: "oklch(0.20 0.015 265)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #C9A84C, #F0C040)",
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-xs mt-0.5" style={{ color: "oklch(0.45 0.01 265)" }}>
            {progress}%
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Mute */}
          <button
            onClick={toggleMute}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
          >
            {isMuted ? (
              <VolumeX size={15} style={{ color: "oklch(0.55 0.01 265)" }} />
            ) : (
              <Volume2 size={15} style={{ color: "oklch(0.65 0.01 265)" }} />
            )}
          </button>

          {/* Stop */}
          {(isPlaying || isPaused) && (
            <button
              onClick={stopSpeech}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
            >
              <Square size={13} style={{ color: "oklch(0.55 0.01 265)" }} />
            </button>
          )}

          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95"
            style={{
              background: "linear-gradient(135deg, #C9A84C, #F0C040)",
            }}
          >
            {isPlaying ? (
              <Pause size={18} className="text-black" />
            ) : (
              <Play size={18} className="text-black mr-[-1px]" />
            )}
          </button>

          {/* Expand */}
          <button
            onClick={() => setExpanded((e) => !e)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
          >
            {expanded ? (
              <ChevronUp size={15} style={{ color: "oklch(0.55 0.01 265)" }} />
            ) : (
              <ChevronDown size={15} style={{ color: "oklch(0.55 0.01 265)" }} />
            )}
          </button>
        </div>
      </div>

      {/* Expanded: speed controls + wave animation */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-3 pt-1"
              style={{ borderTop: "1px solid oklch(0.18 0.015 265)" }}
            >
              {/* Sound wave animation when playing */}
              {isPlaying && (
                <div className="flex items-end justify-center gap-0.5 h-8 mb-3">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 rounded-full"
                      style={{ background: "#C9A84C" }}
                      animate={{
                        height: [4, Math.random() * 24 + 8, 4],
                      }}
                      transition={{
                        duration: 0.5 + Math.random() * 0.5,
                        repeat: Infinity,
                        delay: i * 0.05,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Speed control */}
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "oklch(0.55 0.01 265)" }}>
                  מהירות:
                </span>
                <div className="flex gap-1.5">
                  {[0.75, 1.0, 1.25, 1.5].map((s) => (
                    <button
                      key={s}
                      onClick={() => changeSpeed(s)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background:
                          speed === s
                            ? "linear-gradient(135deg, #C9A84C, #F0C040)"
                            : "oklch(0.18 0.015 265)",
                        color: speed === s ? "black" : "oklch(0.65 0.01 265)",
                        border: speed === s ? "none" : "1px solid oklch(0.22 0.015 265)",
                      }}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice info */}
              <p className="text-xs mt-2" style={{ color: "oklch(0.40 0.01 265)" }}>
                {ttsSettings.provider === "openai"
                  ? `ספק: OpenAI TTS | קול: ${ttsSettings.voice} | מודל: ${ttsSettings.model}`
                  : hebrewVoice
                    ? `קול: ${hebrewVoice.name} (${hebrewVoice.lang})`
                    : "קול ברירת מחדל"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
