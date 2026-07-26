import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { applyPronunciationOverrides } from "../nikud";

const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";

// Available voices for OpenAI TTS
export const OPENAI_VOICES = [
  { id: "alloy", name: "Alloy", gender: "neutral" },
  { id: "echo", name: "Echo", gender: "male" },
  { id: "fable", name: "Fable", gender: "male" },
  { id: "onyx", name: "Onyx", gender: "male" },
  { id: "nova", name: "Nova", gender: "female" },
  { id: "shimmer", name: "Shimmer", gender: "female" },
  { id: "ash", name: "Ash", gender: "male" },
  { id: "ballad", name: "Ballad", gender: "male" },
  { id: "coral", name: "Coral", gender: "female" },
  { id: "sage", name: "Sage", gender: "female" },
  { id: "verse", name: "Verse", gender: "male" },
] as const;

export const ttsRouter = router({
  /**
   * Generate speech audio from text using OpenAI TTS
   * Returns base64-encoded audio data
   */
  speak: publicProcedure
    .input(
      z.object({
        text: z.string().min(1).max(4096),
        voice: z.string().default("nova"),
        model: z.enum(["tts-1", "tts-1-hd"]).default("tts-1-hd"),
        speed: z.number().min(0.25).max(4.0).default(1.0),
        lang: z.string().optional().default("he-IL"),
      })
    )
    .mutation(async ({ input }) => {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "OpenAI API key not configured",
        });
      }

      try {
        let processedText = input.text;
        const langBase = input.lang.split("-")[0].toLowerCase();

        if (langBase === "he" || langBase === "iw") {
          // Hebrew — apply pronunciation overrides (replace English words with Hebrew phonetic equivalents)
          // This ensures that words like "NLP", "Rapport", "VAKOG" etc. are read correctly
          processedText = await applyPronunciationOverrides(input.text);
        }
        // For non-Hebrew languages, the text should already be translated by the client
        // so we skip Hebrew pronunciation overrides

        const response = await fetch(OPENAI_TTS_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: input.model,
            input: processedText,
            voice: input.voice,
            speed: input.speed,
            response_format: "mp3",
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("OpenAI TTS error:", response.status, errorText);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `OpenAI TTS failed: ${response.status}`,
          });
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString("base64");

        return {
          audio: base64Audio,
          contentType: "audio/mpeg",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("TTS generation error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate speech",
        });
      }
    }),

  /** List available voices */
  voices: publicProcedure.query(() => {
    return OPENAI_VOICES;
  }),
});
