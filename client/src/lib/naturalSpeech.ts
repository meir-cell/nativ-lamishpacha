/**
 * Natural Speech Engine
 * Splits text into sentences and speaks them sequentially with natural pauses.
 * This creates a much more natural-sounding TTS experience compared to
 * reading an entire paragraph at once.
 */

export interface NaturalSpeechOptions {
  lang: string;
  rate?: number;
  pitch?: number;
  voice?: SpeechSynthesisVoice | null;
  /** Pause duration between sentences in ms (default: 350) */
  sentencePause?: number;
  /** Pause duration for commas/semicolons in ms (default: 150) */
  commaPause?: number;
  /** Merge spaced letters into words before speaking (default: true) */
  mergeSpacedLetters?: boolean;
  /** Strip nikud (vowel diacritics) from text before TTS to prevent over-emphasis (default: true) */
  stripNikudForTts?: boolean;
  /** Callback when all sentences are done */
  onEnd?: () => void;
  /** Callback on error */
  onError?: (error: SpeechSynthesisErrorEvent) => void;
  /** Callback for each sentence start (index) */
  onSentenceStart?: (index: number) => void;
}

/**
 * Split text into natural speech segments (sentences).
 * Handles Hebrew and English punctuation patterns.
 */
export function splitIntoSentences(text: string): string[] {
  if (!text || !text.trim()) return [];

  // Split on sentence-ending punctuation followed by space or end
  // Also split on colons followed by space (common in educational content)
  const segments = text
    .split(/(?<=[.!?।؟])\s+|(?<=[:;])\s+|(?<=\n)\s*/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // If a segment is very long (>200 chars), try to split on commas
  const result: string[] = [];
  for (const segment of segments) {
    if (segment.length > 200) {
      // Split on commas but keep minimum chunk size of 40 chars
      const parts = splitLongSegment(segment);
      result.push(...parts);
    } else {
      result.push(segment);
    }
  }

  return result;
}

function splitLongSegment(text: string): string[] {
  const parts: string[] = [];
  let current = "";

  // Split on commas, semicolons, or dashes
  const chunks = text.split(/(?<=[,;–—])\s+/);

  for (const chunk of chunks) {
    if (current.length + chunk.length > 150 && current.length > 40) {
      parts.push(current.trim());
      current = chunk;
    } else {
      current += (current ? " " : "") + chunk;
    }
  }
  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * Determine pause duration based on how a sentence ends
 */
function getPauseDuration(sentence: string, options: NaturalSpeechOptions): number {
  const trimmed = sentence.trimEnd();
  const lastChar = trimmed[trimmed.length - 1];

  if (lastChar === "." || lastChar === "!" || lastChar === "?" || lastChar === "؟") {
    return options.sentencePause ?? 350;
  }
  if (lastChar === "," || lastChar === ";" || lastChar === "–" || lastChar === "—") {
    return options.commaPause ?? 150;
  }
  if (lastChar === ":") {
    return options.sentencePause ?? 350;
  }
  // Default pause between segments
  return options.commaPause ?? 150;
}

/**
 * Strip all nikud (Hebrew vowel diacritics) from text.
 * This prevents TTS engines from over-emphasizing prefix letters (ה, ב, ש, ו)
 * which sound unnatural when nikud forces specific vowel pronunciation.
 * Hebrew TTS reads unvocalized text more naturally.
 */
export function stripNikud(text: string): string {
  // Hebrew nikud unicode range: \u05B0-\u05BD, \u05BF, \u05C1, \u05C2, \u05C4, \u05C5, \u05C7
  return text.replace(/[\u05B0-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g, "");
}

/**
 * Merge spaced single letters into words (client-side version).
 * Detects patterns like "א נ ק ו ר י נ ג" and merges to "אנקורינג".
 */
export function mergeSpacedLetters(text: string): string {
  // Match 3+ single Hebrew letters separated by single spaces
  const hebrewPattern = /(?<![\u0590-\u05FF])([\u0590-\u05FF] ){2,}[\u0590-\u05FF](?![\u0590-\u05FF])/g;
  let result = text.replace(hebrewPattern, (match) => match.replace(/ /g, ""));

  // Match 3+ single Latin letters separated by single spaces
  const latinPattern = /(?<![a-zA-Z])([a-zA-Z] ){2,}[a-zA-Z](?![a-zA-Z])/g;
  result = result.replace(latinPattern, (match) => match.replace(/ /g, ""));

  return result;
}

/**
 * Replace symbols and special characters with their spoken Hebrew equivalents.
 * This prevents TTS from reading "/" as "חלוקה" or ignoring symbols.
 */
export function replaceSymbolsForSpeech(text: string): string {
  return text
    .replace(/\//g, " סלש ")
    .replace(/@/g, " שטרודל ")
    .replace(/&/g, " ו ")
    .replace(/#/g, " האשטאג ")
    .replace(/\+/g, " פלוס ")
    .replace(/=/g, " שווה ")
    .replace(/%/g, " אחוז ")
    .replace(/\s+/g, " ")
    .trim();
}

export class NaturalSpeechController {
  private sentences: string[] = [];
  private currentIndex = 0;
  private isPlaying = false;
  private isPaused = false;
  private options: NaturalSpeechOptions;
  private pauseTimer: ReturnType<typeof setTimeout> | null = null;
  private keepAliveInterval: ReturnType<typeof setInterval> | null = null;

  constructor(text: string, options: NaturalSpeechOptions) {
    // Replace symbols with spoken equivalents before processing
    let processedText = replaceSymbolsForSpeech(text);
    // Merge spaced letters before splitting into sentences (if enabled)
    processedText = (options.mergeSpacedLetters !== false) ? mergeSpacedLetters(processedText) : processedText;
    // Strip nikud (vowel diacritics) to prevent TTS over-emphasis on prefix letters
    if (options.stripNikudForTts !== false) {
      processedText = stripNikud(processedText);
    }
    this.sentences = splitIntoSentences(processedText);
    this.options = {
      rate: 0.92,
      pitch: 1.0,
      sentencePause: 220,
      commaPause: 100,
      mergeSpacedLetters: true,
      ...options,
    };
  }

  get totalSentences(): number {
    return this.sentences.length;
  }

  get currentSentenceIndex(): number {
    return this.currentIndex;
  }

  get playing(): boolean {
    return this.isPlaying;
  }

  get paused(): boolean {
    return this.isPaused;
  }

  play(): void {
    if (this.isPlaying && !this.isPaused) return;

    if (this.isPaused) {
      this.isPaused = false;
      window.speechSynthesis.resume();
      return;
    }

    this.isPlaying = true;
    this.isPaused = false;
    this.currentIndex = 0;
    this.speakNext();
  }

  pause(): void {
    if (!this.isPlaying) return;
    this.isPaused = true;
    window.speechSynthesis.pause();
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }
  }

  stop(): void {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentIndex = 0;
    window.speechSynthesis.cancel();
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  private speakNext(): void {
    if (!this.isPlaying || this.isPaused) return;
    if (this.currentIndex >= this.sentences.length) {
      this.isPlaying = false;
      if (this.keepAliveInterval) {
        clearInterval(this.keepAliveInterval);
        this.keepAliveInterval = null;
      }
      this.options.onEnd?.();
      return;
    }

    const sentence = this.sentences[this.currentIndex];
    this.options.onSentenceStart?.(this.currentIndex);

    // Prepend a very short silent connector to prevent the TTS engine from
    // over-emphasizing the first word of each new utterance. A single comma
    // followed by a space acts as a soft-start signal for Hebrew TTS.
    const textToSpeak = this.currentIndex > 0 ? `\u200B${sentence}` : sentence;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = this.options.lang;
    utterance.rate = this.options.rate ?? 0.92;
    utterance.pitch = this.options.pitch ?? 1.0;

    if (this.options.voice) {
      utterance.voice = this.options.voice;
    }

    // Keep-alive for long sentences (Chrome bug workaround)
    if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
    this.keepAliveInterval = setInterval(() => {
      if (window.speechSynthesis.paused && !this.isPaused) {
        window.speechSynthesis.resume();
      }
    }, 10000);

    utterance.onend = () => {
      if (!this.isPlaying || this.isPaused) return;

      const pause = getPauseDuration(sentence, this.options);
      this.currentIndex++;

      if (this.currentIndex >= this.sentences.length) {
        // Last sentence done
        this.isPlaying = false;
        if (this.keepAliveInterval) {
          clearInterval(this.keepAliveInterval);
          this.keepAliveInterval = null;
        }
        this.options.onEnd?.();
      } else {
        // Natural pause before next sentence
        this.pauseTimer = setTimeout(() => {
          this.speakNext();
        }, pause);
      }
    };

    utterance.onerror = (e) => {
      if (e.error === "interrupted" || e.error === "canceled") return;
      this.options.onError?.(e);
      // Try next sentence on error
      this.currentIndex++;
      if (this.currentIndex < this.sentences.length && this.isPlaying) {
        this.pauseTimer = setTimeout(() => this.speakNext(), 200);
      } else {
        this.isPlaying = false;
        this.options.onEnd?.();
      }
    };

    window.speechSynthesis.speak(utterance);
  }
}

/**
 * Simple one-shot function to speak text naturally.
 * Returns a controller that can be used to pause/stop.
 */
export function speakNaturally(
  text: string,
  options: NaturalSpeechOptions
): NaturalSpeechController {
  window.speechSynthesis.cancel(); // Cancel any ongoing speech
  const controller = new NaturalSpeechController(text, options);
  controller.play();
  return controller;
}
