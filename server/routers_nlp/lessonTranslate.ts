// Lesson translation router — translates lesson text content to a target language using LLM
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

const SUPPORTED_LANGS: Record<string, string> = {
  "en-US": "English",
  "ar-SA": "Arabic",
  "ru-RU": "Russian",
  "fr-FR": "French",
  "es-ES": "Spanish",
};

export const lessonTranslateRouter = router({
  translateLesson: publicProcedure
    .input(
      z.object({
        lessonId: z.number(),
        lessonTitle: z.string(),
        lessonSubtitle: z.string(),
        lessonDuration: z.string(),
        intro: z.string(),
        sections: z.array(
          z.object({
            title: z.string(),
            highlight: z.string().optional(),
            text: z.string(),
            example: z.string().optional(),
          })
        ),
        keyPoints: z.array(z.string()),
        summary: z.string(),
        exercises: z.array(z.string()),
        targetLang: z.string(), // e.g. "en-US"
      })
    )
    .mutation(async ({ input }) => {
      const langName = SUPPORTED_LANGS[input.targetLang];
      if (!langName) {
        throw new Error(`Unsupported language: ${input.targetLang}`);
      }

      // Build a structured text block to translate
      const sourceText = [
        `TITLE: ${input.lessonTitle}`,
        `SUBTITLE: ${input.lessonSubtitle}`,
        `DURATION: ${input.lessonDuration}`,
        ``,
        `INTRO:`,
        input.intro,
        ``,
        ...input.sections.flatMap((s, i) => [
          `SECTION_${i + 1}_TITLE: ${s.title}`,
          s.highlight ? `SECTION_${i + 1}_HIGHLIGHT: ${s.highlight}` : "",
          `SECTION_${i + 1}_TEXT: ${s.text}`,
          s.example ? `SECTION_${i + 1}_EXAMPLE: ${s.example}` : "",
          ``,
        ]),
        `KEY_POINTS:`,
        ...input.keyPoints.map((p, i) => `KEY_POINT_${i + 1}: ${p}`),
        ``,
        `SUMMARY:`,
        input.summary,
        ``,
        `EXERCISES:`,
        ...input.exercises.map((e, i) => `EXERCISE_${i + 1}: ${e}`),
      ]
        .filter((l) => l !== undefined)
        .join("\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a professional translator specializing in NLP (Neuro-Linguistic Programming) educational content.
Translate the following structured lesson text from Hebrew to ${langName}.
Keep all the structural labels (TITLE:, SUBTITLE:, SECTION_X_TITLE:, etc.) exactly as-is in English — only translate the values after the colon.
Preserve the meaning, tone, and NLP terminology accurately.
Return only the translated structured text, nothing else.`,
          },
          {
            role: "user",
            content: sourceText,
          },
        ],
      });

      const rawContent = response.choices?.[0]?.message?.content ?? "";
      const translated = typeof rawContent === "string" ? rawContent : "";

      // Parse the translated structured text back into a readable document
      const lines = translated.split("\n");
      const get = (prefix: string) => {
        const line = lines.find((l) => l.startsWith(prefix + ":"));
        return line ? line.slice(prefix.length + 1).trim() : "";
      };

      const title = get("TITLE") || input.lessonTitle;
      const subtitle = get("SUBTITLE") || input.lessonSubtitle;
      const duration = get("DURATION") || input.lessonDuration;
      const intro = get("INTRO") || input.intro;
      const summary = get("SUMMARY") || input.summary;

      const docLines: string[] = [
        `NLP Practitioner Course`,
        `Lesson ${input.lessonId}: ${title}`,
        `${subtitle}`,
        `Duration: ${duration}`,
        ``,
        `Introduction:`,
        intro,
        ``,
      ];

      input.sections.forEach((_, i) => {
        const sTitle = get(`SECTION_${i + 1}_TITLE`);
        const sHighlight = get(`SECTION_${i + 1}_HIGHLIGHT`);
        const sText = get(`SECTION_${i + 1}_TEXT`);
        const sExample = get(`SECTION_${i + 1}_EXAMPLE`);
        docLines.push(`── ${sTitle || `Section ${i + 1}`} ──`);
        if (sHighlight) docLines.push(`✨ ${sHighlight}`);
        docLines.push(sText || "");
        if (sExample) docLines.push(`Example: ${sExample}`);
        docLines.push(``);
      });

      docLines.push(`── Key Points ──`);
      input.keyPoints.forEach((_, i) => {
        docLines.push(`◆ ${get(`KEY_POINT_${i + 1}`) || input.keyPoints[i]}`);
      });

      docLines.push(``);
      docLines.push(`── Summary ──`);
      docLines.push(summary);
      docLines.push(``);
      docLines.push(`── Exercises ──`);
      input.exercises.forEach((_, i) => {
        docLines.push(`${i + 1}. ${get(`EXERCISE_${i + 1}`) || input.exercises[i]}`);
      });

      return { text: docLines.join("\n"), langName, title };
    }),
});
