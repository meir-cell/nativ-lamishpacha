import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { articles } from "../../drizzle/schema";
import { eq, desc, like, or, sql } from "drizzle-orm";
import { verifyAdmin } from "./_adminAuth";

export const adminArticlesRouter = router({
  list: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      category: z.string().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      await verifyAdmin(ctx);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const offset = (input.page - 1) * input.pageSize;
      let query = db.select().from(articles);
      const conditions = [];
      if (input.search) {
        conditions.push(or(
          like(articles.title, `%${input.search}%`),
          like(articles.excerpt, `%${input.search}%`),
          like(articles.slug, `%${input.search}%`)
        ));
      }
      if (input.category) {
        conditions.push(eq(articles.category, input.category));
      }
      const rows = await (conditions.length > 0
        ? query.where(conditions.length === 1 ? conditions[0]! : sql`${conditions[0]} AND ${conditions[1]}`)
        : query)
        .orderBy(desc(articles.sortOrder), desc(articles.createdAt))
        .limit(input.pageSize)
        .offset(offset);

      const [{ count }] = await db.select({ count: sql<number>`COUNT(*)` }).from(articles);
      return { articles: rows, total: Number(count) };
    }),

  get: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyAdmin(ctx);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [row] = await db.select().from(articles).where(eq(articles.slug, input.slug));
      if (!row) throw new Error("Article not found");
      return row;
    }),

  create: publicProcedure
    .input(z.object({
      slug: z.string().min(1),
      title: z.string().min(1),
      excerpt: z.string().optional(),
      content: z.string().optional(),
      img: z.string().optional(),
      audioSrc: z.string().optional(),
      category: z.string().optional(),
      date: z.string().optional(),
      readTime: z.string().optional(),
      published: z.number().default(1),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      await verifyAdmin(ctx);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(articles).values(input);
      return { success: true };
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      slug: z.string().min(1).optional(),
      title: z.string().min(1).optional(),
      excerpt: z.string().optional(),
      content: z.string().optional(),
      img: z.string().optional(),
      audioSrc: z.string().optional(),
      category: z.string().optional(),
      date: z.string().optional(),
      readTime: z.string().optional(),
      published: z.number().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await verifyAdmin(ctx);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...data } = input;
      await db.update(articles).set(data).where(eq(articles.id, id));
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await verifyAdmin(ctx);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(articles).where(eq(articles.id, input.id));
      return { success: true };
    }),

  getCategories: publicProcedure
    .query(async ({ ctx }) => {
      await verifyAdmin(ctx);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const rows = await db.selectDistinct({ category: articles.category }).from(articles).where(sql`category IS NOT NULL`);
      return rows.map(r => r.category).filter(Boolean) as string[];
    }),
});
