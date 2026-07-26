import { trpc } from "@/lib/trpc";

/** Default TTS settings (used as fallback before DB loads) */
const DEFAULTS = {
  rate: 0.88,
  pitch: 1.02,
  sentencePause: 220,
  commaPause: 100,
  prefixPause: 180,
  mergeSpacedLetters: true,
  stripNikudForTts: true,
  provider: "openai" as "browser" | "openai",
  voice: "nova",
  model: "tts-1-hd" as "tts-1" | "tts-1-hd",
  openaiSpeed: 1.0,
};

/**
 * Hook to fetch global TTS settings from the server.
 * Returns the settings (or defaults while loading) and a loading flag.
 */
export function useTtsSettings() {
  const { data, isLoading } = trpc.ttsSettings.get.useQuery(undefined, {
    staleTime: 60_000, // Cache for 1 minute
    refetchOnWindowFocus: false,
  });

  return {
    ttsSettings: data ?? DEFAULTS,
    isLoading,
  };
}
