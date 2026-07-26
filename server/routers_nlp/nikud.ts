import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { addNikud } from "../nikud";

export const nikudRouter = router({
  /**
   * Add nikud (vowel diacritics) to Hebrew text.
   * Used before sending text to TTS for improved pronunciation.
   */
  addNikud: publicProcedure
    .input(
      z.object({
        text: z.string().min(1).max(10000),
        genre: z.enum(["modern", "rabbinic", "poetry"]).default("modern"),
      })
    )
    .mutation(async ({ input }) => {
      const nikudText = await addNikud(input.text, input.genre);
      return { text: nikudText };
    }),
});
