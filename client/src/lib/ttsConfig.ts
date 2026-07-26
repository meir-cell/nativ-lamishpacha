/**
 * TTS Voice Configuration — Hebrew & English only
 * Uses Web Speech API with comprehensive voice name matching.
 * Sources: Readium Speech Database (https://github.com/readium/speech)
 *          covering Windows/Edge, Chrome Desktop, macOS/iOS, Android
 *
 * Kept in a separate file so LessonPlayer.tsx only exports a React component
 * (required for Vite Fast Refresh to work correctly).
 */

export interface LangConfig {
  code: string;        // BCP-47 language code
  label: string;       // Display label
  flag: string;        // Flag emoji
  rate: number;        // Speech rate multiplier
  femaleNames: string[]; // Lowercase substrings matching female voice names
  maleNames: string[];   // Lowercase substrings matching male voice names
}

export const TTS_LANGUAGES: LangConfig[] = [
  {
    code: "he-IL",
    label: "עברית",
    flag: "🇮🇱",
    rate: 0.9,
    femaleNames: [
      // Edge/Windows Natural (best quality)
      "hila",
      // macOS/iOS
      "carmit",
      // Android/Chrome
      "he-il-x-hec",  // Android female voice 1
      "he-il-x-hee",  // Android female voice 2
    ],
    maleNames: [
      // Edge/Windows Natural (best quality)
      "avri",
      // Windows SAPI (legacy)
      "asaf",
      // Android/Chrome
      "he-il-x-heb",  // Android male voice 1
      "he-il-x-hed",  // Android male voice 2
    ],
  },
  {
    code: "en-US",
    label: "English",
    flag: "🇺🇸",
    rate: 1.0,
    femaleNames: [
      // Edge Natural (US) — highest quality on Windows
      "emma", "ava", "jenny", "aria", "michelle", "ana",
      // Edge Natural (UK)
      "sonia", "libby", "maisie",
      // Edge Natural (Australia)
      "natasha", "hayley",
      // Edge Natural (Canada)
      "clara", "heather",
      // Windows SAPI (legacy)
      "zira", "hazel", "eva",
      // macOS/iOS
      "samantha", "karen", "victoria", "allison", "moira",
      "fiona", "tessa", "veena", "serena",
      // Chrome Desktop (Google voice — female by default)
      "google us english",
      // Android
      "en-us-x-tpc", "en-us-x-iob", "en-us-x-iog",
      "en-gb-x-gba",
    ],
    maleNames: [
      // Edge Natural (US) — highest quality on Windows
      "andrew", "brian", "guy", "eric", "steffan", "christopher", "roger",
      // Edge Natural (UK)
      "ryan", "thomas",
      // Edge Natural (Australia)
      "william",
      // Edge Natural (Canada)
      "liam",
      // Windows SAPI (legacy)
      "david", "mark",
      // macOS/iOS
      "alex", "fred", "daniel", "oliver", "arthur", "rishi",
      // Chrome Desktop
      "google uk english male",
      // Android
      "en-us-x-sfg", "en-us-x-iod",
    ],
  },
];

/**
 * Get all voices available for a given language code.
 * Handles Hebrew legacy code (iw-IL = he-IL).
 */
export function getVoicesForLang(
  voices: SpeechSynthesisVoice[],
  langCode: string
): SpeechSynthesisVoice[] {
  const primaryLang = langCode.split("-")[0].toLowerCase();
  return voices.filter((v) => {
    const vLang = v.lang.toLowerCase();
    return (
      vLang === langCode.toLowerCase() ||
      vLang.startsWith(primaryLang + "-") ||
      vLang === primaryLang ||
      // Hebrew: iw-IL is the legacy BCP-47 code for he-IL
      (primaryLang === "he" && (vLang.startsWith("iw") || vLang.startsWith("he")))
    );
  });
}

/**
 * Filter voices by gender using substring matching against known voice names.
 * Priority: exact gender match → unknown gender → opposite gender (never silent).
 */
export function filterVoicesByGender(
  voices: SpeechSynthesisVoice[],
  langCfg: LangConfig,
  gender: "female" | "male"
): SpeechSynthesisVoice[] {
  const wantedNames   = gender === "female" ? langCfg.femaleNames : langCfg.maleNames;
  const oppositeNames = gender === "female" ? langCfg.maleNames   : langCfg.femaleNames;

  const matched:  SpeechSynthesisVoice[] = [];
  const unknown:  SpeechSynthesisVoice[] = [];
  const opposite: SpeechSynthesisVoice[] = [];

  for (const v of voices) {
    const n = (v.name + " " + v.voiceURI).toLowerCase();
    if (wantedNames.some((h) => n.includes(h))) {
      matched.push(v);
    } else if (oppositeNames.some((h) => n.includes(h))) {
      opposite.push(v);
    } else {
      unknown.push(v);
    }
  }

  // Priority: exact gender match → unknown gender → opposite gender
  return [...matched, ...unknown, ...opposite];
}

/**
 * Debug helper: log all available voices for a language to the browser console.
 * Usage: window.__debugTTSVoices('he-IL')
 */
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__debugTTSVoices = (
    langCode: string
  ) => {
    const voices = window.speechSynthesis.getVoices();
    const relevant = getVoicesForLang(voices, langCode);
    console.table(
      relevant.map((v) => ({
        name: v.name,
        lang: v.lang,
        voiceURI: v.voiceURI,
        localService: v.localService,
        default: v.default,
      }))
    );
    return relevant.map((v) => v.name);
  };
}
