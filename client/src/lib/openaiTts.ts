/**
 * OpenAI TTS Client
 * Uses the server-side tRPC endpoint to generate speech via OpenAI TTS,
 * then plays it back using HTML5 Audio.
 * Falls back to Web Speech API (NaturalSpeechController) on failure.
 */

import { splitIntoSentences, replaceSymbolsForSpeech, mergeSpacedLetters, stripNikud } from "./naturalSpeech";

/** Map of OpenAI voices by gender */
const OPENAI_MALE_VOICES = ["echo", "onyx", "fable", "ash", "ballad", "verse"];
const OPENAI_FEMALE_VOICES = ["nova", "shimmer", "coral", "sage"];

/**
 * Given a gender preference and the admin-configured voice,
 * returns the appropriate voice. If the configured voice already matches
 * the requested gender, use it. Otherwise pick the first voice of the
 * requested gender.
 */
export function getOpenAIVoiceForGender(configuredVoice: string, gender: "male" | "female"): string {
  if (gender === "male") {
    // If configured voice is already male, use it
    if (OPENAI_MALE_VOICES.includes(configuredVoice)) return configuredVoice;
    // Otherwise default to "echo" (deep male voice)
    return "echo";
  } else {
    // If configured voice is already female, use it
    if (OPENAI_FEMALE_VOICES.includes(configuredVoice)) return configuredVoice;
    // Otherwise default to "nova" (clear female voice)
    return "nova";
  }
}

export interface OpenAITtsOptions {
  voice?: string;
  model?: "tts-1" | "tts-1-hd";
  speed?: number;
  /** Language code for TTS (e.g. "he-IL", "en-US") — controls server-side processing */
  lang?: string;
  /** Volume gain multiplier (1.0 = normal, 2.0 = double, etc.) */
  volume?: number;
  /** Merge spaced letters into words before speaking (default: true) */
  mergeSpacedLetters?: boolean;
  /** Strip nikud before sending to TTS (default: true) */
  stripNikudForTts?: boolean;
  /** Pause duration between sentences in ms (default: 300) */
  sentencePause?: number;
  /** Callback when all sentences are done */
  onEnd?: () => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Callback for each sentence start (index) */
  onSentenceStart?: (index: number) => void;
  /** Callback when audio generation starts (waiting for API) */
  onGenerating?: () => void;
  /** Callback when audio is ready and playback begins */
  onReady?: () => void;
}

/**
 * Controller for OpenAI TTS playback.
 * Splits text into sentences, generates audio for each via the server,
 * and plays them sequentially with natural pauses.
 * 
 * Uses a unique playbackId to prevent stale async operations from
 * interfering after stop() is called.
 */
export class OpenAITtsController {
  private sentences: string[] = [];
  private currentIndex = 0;
  private isPlaying = false;
  private isPaused = false;
  private isStopped = false;
  private options: OpenAITtsOptions;
  private currentAudio: HTMLAudioElement | null = null;
  private pauseTimer: ReturnType<typeof setTimeout> | null = null;
  private trpcClient: any;
  private audioCache: Map<number, string> = new Map(); // index -> base64 audio
  private prefetchCount = 2; // prefetch next N sentences
  /** Unique ID for each play session — used to abort stale async chains */
  private playbackId = 0;
  /** Web Audio API context and gain node for volume boost */
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;

  constructor(text: string, options: OpenAITtsOptions, trpcClient: any) {
    // Preprocess text
    let processedText = replaceSymbolsForSpeech(text);
    if (options.mergeSpacedLetters !== false) {
      processedText = mergeSpacedLetters(processedText);
    }
    if (options.stripNikudForTts !== false) {
      processedText = stripNikud(processedText);
    }
    this.sentences = splitIntoSentences(processedText);
    this.options = {
      voice: "nova",
      model: "tts-1",
      speed: 1.0,
      sentencePause: 300,
      ...options,
    };
    this.trpcClient = trpcClient;
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

  get stopped(): boolean {
    return this.isStopped;
  }

  async play(): Promise<void> {
    if (this.isStopped) return; // Cannot play after stop
    if (this.isPlaying && !this.isPaused) return;

    if (this.isPaused && this.currentAudio) {
      this.isPaused = false;
      this.isPlaying = true;
      this.currentAudio.play();
      return;
    }

    this.isPlaying = true;
    this.isPaused = false;
    this.currentIndex = 0;
    // Increment playbackId so any previous async chain becomes stale
    this.playbackId++;
    const myPlaybackId = this.playbackId;

    // Signal generating state for the first sentence if not cached
    if (!this.audioCache.has(0)) {
      this.options.onGenerating?.();
    }
    this.prefetchAhead();
    await this.playNext(myPlaybackId);
  }

  pause(): void {
    if (!this.isPlaying) return;
    this.isPaused = true;
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }
  }

  stop(): void {
    this.isStopped = true;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentIndex = 0;
    // Increment playbackId to invalidate any running async chain
    this.playbackId++;
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = "";
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
      this.currentAudio = null;
    }
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }
    // Clean up cached audio
    this.audioCache.clear();
    // Close audio context
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
      this.gainNode = null;
    }
  }

  private async generateAudio(text: string): Promise<string> {
    const result = await this.trpcClient.tts.speak.mutate({
      text,
      voice: this.options.voice || "nova",
      model: this.options.model || "tts-1",
      speed: this.options.speed || 1.0,
      lang: this.options.lang || "he-IL",
    });
    return `data:${result.contentType};base64,${result.audio}`;
  }

  private prefetchAhead(): void {
    // Prefetch next sentences in background
    for (let i = this.currentIndex; i < Math.min(this.currentIndex + this.prefetchCount, this.sentences.length); i++) {
      if (!this.audioCache.has(i)) {
        this.generateAudio(this.sentences[i])
          .then(audioUrl => {
            // Only cache if not stopped
            if (!this.isStopped) {
              this.audioCache.set(i, audioUrl);
            }
          })
          .catch(() => {
            // Silently fail prefetch
          });
      }
    }
  }

  private async playNext(myPlaybackId: number): Promise<void> {
    // Check if this playback session is still valid
    if (myPlaybackId !== this.playbackId) return;
    if (!this.isPlaying || this.isPaused || this.isStopped) return;
    if (this.currentIndex >= this.sentences.length) {
      this.isPlaying = false;
      this.options.onEnd?.();
      return;
    }

    const sentence = this.sentences[this.currentIndex];
    console.log(`[TTS] Playing sentence ${this.currentIndex}/${this.sentences.length}, voice: ${this.options.voice}, len: ${sentence.length}`);

    try {
      // Use cached audio or generate new
      let audioUrl: string;
      if (this.audioCache.has(this.currentIndex)) {
        audioUrl = this.audioCache.get(this.currentIndex)!;
      } else {
        // Signal that we're waiting for audio generation
        this.options.onGenerating?.();
        audioUrl = await this.generateAudio(sentence);
        // Check again after await — might have been stopped
        if (myPlaybackId !== this.playbackId || this.isStopped) return;
        this.audioCache.set(this.currentIndex, audioUrl);
      }

      // Check again after potential await
      if (myPlaybackId !== this.playbackId || !this.isPlaying || this.isPaused || this.isStopped) return;

      // Signal that audio is ready and playback is starting
      this.options.onReady?.();

      // Fire onSentenceStart AFTER audio is ready (right before playback)
      // This ensures highlighting is in sync with actual audio playback
      this.options.onSentenceStart?.(this.currentIndex);

      // Prefetch ahead
      this.prefetchAhead();

      // Play audio with volume boost via Web Audio API GainNode
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      // Apply volume boost using Web Audio API if volume > 1
      const vol = this.options.volume ?? 1.0;
      if (vol !== 1.0) {
        try {
          if (!this.audioContext) {
            this.audioContext = new AudioContext();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
          }
          this.gainNode!.gain.value = vol;
          const source = this.audioContext.createMediaElementSource(audio);
          source.connect(this.gainNode!);
        } catch (e) {
          // Fallback: if Web Audio API fails, just play normally
          console.warn("Volume boost unavailable:", e);
        }
      }

      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error("Audio playback failed"));
        // If stopped/paused externally, the audio.pause() in stop() will
        // NOT fire onended, so we also listen for the 'pause' event to
        // resolve (but only if we're stopped)
        audio.onpause = () => {
          if (this.isStopped || myPlaybackId !== this.playbackId) {
            resolve(); // Break out of the promise
          }
          // If just paused (not stopped), don't resolve — wait for resume
        };
        audio.play().then(() => {
          console.log(`[TTS] Audio playing successfully, voice: ${this.options.voice}`);
        }).catch((err) => {
          console.error(`[TTS] Audio play() FAILED, voice: ${this.options.voice}`, err);
          reject(err);
        });
      });

      // Check if we should continue
      if (myPlaybackId !== this.playbackId || !this.isPlaying || this.isStopped) return;
      if (this.isPaused) return;

      // Move to next sentence with pause
      this.currentIndex++;

      if (this.currentIndex >= this.sentences.length) {
        this.isPlaying = false;
        this.options.onEnd?.();
      } else {
        const pause = this.options.sentencePause ?? 300;
        this.pauseTimer = setTimeout(() => {
          if (myPlaybackId === this.playbackId) {
            this.playNext(myPlaybackId);
          }
        }, pause);
      }
    } catch (error) {
      // If stopped, don't propagate error
      if (myPlaybackId !== this.playbackId || this.isStopped) return;

      console.error("OpenAI TTS error for sentence:", sentence, error);
      this.options.onError?.(error instanceof Error ? error : new Error(String(error)));
      // Try next sentence on error
      this.currentIndex++;
      if (this.currentIndex < this.sentences.length && this.isPlaying && !this.isStopped) {
        this.pauseTimer = setTimeout(() => {
          if (myPlaybackId === this.playbackId) {
            this.playNext(myPlaybackId);
          }
        }, 200);
      } else {
        this.isPlaying = false;
        this.options.onEnd?.();
      }
    }
  }
}
