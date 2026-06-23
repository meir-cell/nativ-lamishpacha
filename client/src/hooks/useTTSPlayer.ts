import { useState, useRef, useCallback } from "react";

/**
 * Server-backed TTS hook — works on all devices including mobile.
 * Splits long text into chunks of ~200 chars and plays them sequentially via /api/tts.
 */
export function useTTSPlayer(text: string) {
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setStatus("idle");
  }, []);

  const play = useCallback(async () => {
    if (status === "playing" || status === "loading") {
      stop();
      return;
    }

    setStatus("loading");
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 1000) }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error("TTS failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        setStatus("idle");
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        setStatus("error");
      };

      setStatus("playing");
      await audio.play();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setStatus("idle");
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    }
  }, [text, status, stop]);

  return { status, play, stop };
}
