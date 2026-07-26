/**
 * expandSlide — uses LLM to rewrite a concise slide text into a fuller, accessible explanation.
 * Keeps the professional NLP Practitioner tone while making content accessible to beginners.
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

export const expandSlideRouter = router({
  expand: publicProcedure
    .input(
      z.object({
        slideTitle: z.string().max(200),
        slideText: z.string().max(3000),
        lessonTitle: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const systemPrompt = `אתה מומחה NLP ומרצה מנוסה בקורס NLP Practitioner. 
תפקידך לקחת טקסט תמציתי משקופית ולהרחיב אותו להסבר מפורט, נגיש ומובן לאנשים שלומדים NLP לראשונה.

כללים:
- שמור על רמה מקצועית אך הסבר בשפה פשוטה ונגישה
- הוסף דוגמאות מחיי היומיום כדי להמחיש מושגים מופשטים
- שמור על הקשר ל-NLP ולפיתוח אישי
- כתוב בעברית תקנית וברורה
- אורך: 3-5 פסקאות קצרות
- אל תחזור על הטקסט המקורי מילה במילה — הרחב, פרש והסבר`;

      const userPrompt = `שקופית מהשיעור: "${input.lessonTitle ?? ""}"
כותרת: ${input.slideTitle}
טקסט תמציתי:
${input.slideText}

אנא הרחב והסבר את הטקסט הזה בצורה נגישה ומפורטת.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const expandedText =
        response?.choices?.[0]?.message?.content ?? "לא ניתן להרחיב כרגע.";

      return { expandedText };
    }),
});
