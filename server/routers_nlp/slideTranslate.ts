// Single-slide translation for real-time TTS playback
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

const LANG_NAMES: Record<string, string> = {
  "en-US": "English",
  "ar-SA": "Arabic",
  "ru-RU": "Russian",
  "fr-FR": "French",
  "es-ES": "Spanish",
};

export const slideTranslateRouter = router({
  translateSlide: publicProcedure
    .input(
      z.object({
        text: z.string().max(3000),
        targetLang: z.string(), // e.g. "en-US"
      })
    )
    .mutation(async ({ input }) => {
      const langName = LANG_NAMES[input.targetLang];
      if (!langName) {
        // Hebrew or unsupported — return as-is
        return { translatedText: input.text };
      }

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a professional translator specializing in NLP (Neuro-Linguistic Programming) educational content.
Translate the following Hebrew text to ${langName}.
Preserve the meaning, tone, and NLP terminology accurately.
Return ONLY the translated text, nothing else — no labels, no explanations.`,
          },
          {
            role: "user",
            content: input.text,
          },
        ],
      });

      const raw = response.choices?.[0]?.message?.content ?? "";
      const translatedText = typeof raw === "string" ? raw.trim() : input.text;
      return { translatedText };
    }),
});
