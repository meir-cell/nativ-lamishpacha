import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { seoSettings, articles, faqItems, books, siteContent } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { verifyAdmin } from "./_adminAuth";
import { invokeLLM } from "../_core/llm";

// Default SEO pages for the site
const DEFAULT_SEO_PAGES = [
  { pageKey: "home", pageLabel: "דף הבית" },
  { pageKey: "tipul-zugi", pageLabel: "טיפול זוגי" },
  { pageKey: "gishur", pageLabel: "גישור טיפולי" },
  { pageKey: "yiutz-mishpati", pageLabel: "ייעוץ משפטי" },
  { pageKey: "articles", pageLabel: "מאמרים" },
  { pageKey: "books", pageLabel: "ספרים" },
  { pageKey: "faq", pageLabel: "שאלות נפוצות" },
  { pageKey: "payment", pageLabel: "תשלום" },
  { pageKey: "nlp", pageLabel: "קורס NLP" },
];

export const adminSeoRouter = router({
  // Public endpoint — returns SEO data for a single page key (no auth required)
  getByPage: publicProcedure
    .input(z.object({ pageKey: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(seoSettings).where(eq(seoSettings.pageKey, input.pageKey));
      return rows[0] || null;
    }),

  getAll: publicProcedure
    .query(async ({ ctx }) => {
      await verifyAdmin(ctx);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const rows = await db.select().from(seoSettings);
      // Merge with defaults so all pages appear even if not in DB
      const map = new Map(rows.map(r => [r.pageKey, r]));
      return DEFAULT_SEO_PAGES.map(page => ({
        ...page,
        ...(map.get(page.pageKey) || {}),
        pageKey: page.pageKey,
        pageLabel: page.pageLabel,
      }));
    }),

  // AI-powered SEO suggestion for a given page
  aiSuggest: publicProcedure
    .input(z.object({ pageKey: z.string(), pageLabel: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await verifyAdmin(ctx);
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Gather page-specific content from DB
      let pageContext = "";

      if (input.pageKey === "home") {
        const rows = await db.select().from(siteContent).limit(5);
        pageContext = rows.map(r => `${r.key}: ${r.value || r.label || ""}`).join("\n");
        if (!pageContext) pageContext = "דף הבית של מאיר שמעון עשור — מטפל זוגי, מגשר טיפולי ויועץ משפטי בבתי הדין הרבניים עם 33 שנות ניסיון.";
      } else if (input.pageKey === "tipul-zugi") {
        pageContext = "טיפול זוגי — מרחב בטוח לשיקום הקשר. מאיר שמעון עשור מעניק לבני הזוג כלים מעשיים לתקשורת בריאה, חיזוק האמון וחידוש הקרבה הרגשית. שיפור התקשורת, הפחתת מתחים, חיזוק האמון.";
      } else if (input.pageKey === "gishur") {
        pageContext = "גישור טיפולי — הליך ממוקד ויעיל לזוגות הנמצאים במשבר. עבודה מתמקדת בהבנת האינטרסים ובניית הסכמות שמאפשרות התקדמות משותפת. דיאלוג מכבד, בניית הסכמות מעשיות.";
      } else if (input.pageKey === "yiutz-mishpati") {
        pageContext = "ייעוץ משפטי בבתי הדין הרבניים — גירושין, כתובה, מזונות, משמורת, הסדרי שהות, חלוקת רכוש, שלום בית והסכמים משפחתיים. ניתוח משפטי והלכתי, אסטרטגיה מותאמת אישית.";
      } else if (input.pageKey === "articles") {
        const rows = await db.select({ title: articles.title, excerpt: articles.excerpt }).from(articles).limit(5);
        pageContext = "מאמרים מקצועיים בתחום הטיפול הזוגי, הגישור והייעוץ המשפטי:\n" + rows.map(r => `- ${r.title}: ${r.excerpt || ""}`).join("\n");
      } else if (input.pageKey === "books") {
        const rows = await db.select({ title: books.title, description: books.description }).from(books).limit(5);
        pageContext = "ספרים מקצועיים:\n" + rows.map(r => `- ${r.title}: ${r.description || ""}`).join("\n");
      } else if (input.pageKey === "faq") {
        const rows = await db.select({ question: faqItems.question, answer: faqItems.answer }).from(faqItems).limit(5);
        pageContext = "שאלות נפוצות:\n" + rows.map(r => `- ${r.question}`).join("\n");
      } else if (input.pageKey === "nlp") {
        pageContext = "קורס NLP Practitioner — קורס מקצועי בתחום תכנות נוירו-לשוני (NLP). לימוד טכניקות NLP מתקדמות, כלים לשינוי דפוסי חשיבה, תקשורת אפקטיבית ופיתוח אישי.";
      } else if (input.pageKey === "payment") {
        pageContext = "עמוד תשלום עבור שירותי הטיפול הזוגי, הגישור והייעוץ המשפטי של מאיר שמעון עשור.";
      } else {
        pageContext = `דף ${input.pageLabel} באתר נתיב למשפחה — מאיר שמעון עשור, מטפל זוגי ומגשר.`;
      }

      const prompt = `אתה מומחה SEO לאתרי אינטרנט בעברית. בהתבסס על תוכן הדף הבא, צור המלצות SEO אופטימליות.

תוכן הדף (${input.pageLabel}):
${pageContext}

דרישות:
- כותרת Meta: 50-60 תווים, מכילה מילות מפתח עיקריות, מושכת קליקים
- תיאור Meta: 120-155 תווים, מסכם את הדף, מכיל call-to-action
- כותרת OG: דומה לכותרת Meta אך יכולה להיות קצת יותר שיווקית (עד 60 תווים)
- מילות מפתח: 5-7 מילות מפתח רלוונטיות בעברית, מופרדות בפסיק

החזר JSON בלבד, ללא טקסט נוסף.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an expert Hebrew SEO specialist. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "seo_suggestion",
            strict: true,
            schema: {
              type: "object",
              properties: {
                metaTitle: { type: "string", description: "Meta title 50-60 chars" },
                metaDescription: { type: "string", description: "Meta description 120-155 chars" },
                ogTitle: { type: "string", description: "OG title up to 60 chars" },
                keywords: { type: "string", description: "5-7 Hebrew keywords comma-separated" },
              },
              required: ["metaTitle", "metaDescription", "ogTitle", "keywords"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response.choices?.[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : null;
      if (!content) throw new Error("No response from AI");

      try {
        return JSON.parse(content) as {
          metaTitle: string;
          metaDescription: string;
          ogTitle: string;
          keywords: string;
        };
      } catch {
        throw new Error("Invalid AI response format");
      }
    }),

  update: publicProcedure
    .input(z.object({
      pageKey: z.string(),
      pageLabel: z.string().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      ogTitle: z.string().optional(),
      ogDescription: z.string().optional(),
      ogImage: z.string().optional(),
      keywords: z.string().optional(),
      canonical: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await verifyAdmin(ctx);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // Upsert
      const existing = await db.select().from(seoSettings).where(eq(seoSettings.pageKey, input.pageKey));
      if (existing.length > 0) {
        await db.update(seoSettings).set(input).where(eq(seoSettings.pageKey, input.pageKey));
      } else {
        await db.insert(seoSettings).values(input);
      }
      return { success: true };
    }),
});
