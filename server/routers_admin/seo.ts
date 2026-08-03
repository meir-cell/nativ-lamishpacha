import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { seoSettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { verifyAdmin } from "./_adminAuth";

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
